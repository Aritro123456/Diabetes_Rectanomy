export const gradeNames = ['No DR', 'Mild NPDR', 'Moderate NPDR', 'Severe NPDR', 'Proliferative DR'];
export type Quality = { width: number; height: number; brightness: number; contrast: number; sharpness: number; coverage: number; clipping: number; flags: string[] };
export type Prediction = { imageSha256: string; model: string; probabilities: number[]; calibration: string; heatmap?: { method: string; alignment: 'original-image'; values: number[][] } };
export type EvalRow = { id: string; trueGrade: number; predictedGrade: number; probabilities?: number[] };
export type Run = { id: string; model: string; variant: string; dataset: string; split: string; cohort: string; external: boolean; overlapChecked: boolean; rows: EvalRow[] };
const object = (v: unknown): Record<string, unknown> => { if (!v || typeof v !== 'object' || Array.isArray(v)) throw Error('Expected a JSON object.'); return v as Record<string, unknown>; };
const label = (v: unknown, field: string) => { if (typeof v !== 'string' || !v.trim() || v.length > 160) throw Error(`${field} must be text, 1–160 characters.`); return v.trim(); };
const grade = (v: unknown): number => { if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 4) throw Error('Grades must be integers from 0 to 4.'); return v; };
export function probabilities(v: unknown): number[] {
 if (!Array.isArray(v) || v.length !== 5 || !v.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1) || Math.abs(v.reduce((a,b) => a+b,0)-1) > 0.0001) throw Error('Provide five probabilities between 0 and 1 that sum to 1.');
 return v.slice();
}
export const predictedGrade = (p: number[]) => p.indexOf(Math.max(...p));
export function parsePrediction(input: unknown, imageSha256: string): Prediction {
 const o = object(input);
 if (!/^[a-f0-9]{64}$/.test(String(o.imageSha256)) || o.imageSha256 !== imageSha256) throw Error('Image SHA-256 does not match this image. Export the case record to find its hash.');
 const result: Prediction = {imageSha256, model:label(o.model,'model'), probabilities:probabilities(o.probabilities), calibration:label(o.calibration,'calibration')};
 if (o.heatmap !== undefined) {
  const h = object(o.heatmap), rows = h.values;
  if (h.alignment !== 'original-image') throw Error('Heatmap must be mapped back to the full original image.');
  if (!Array.isArray(rows) || rows.length < 2 || rows.length > 256 || !Array.isArray(rows[0]) || rows[0].length < 2 || rows[0].length > 256 || !rows.every(r => Array.isArray(r) && r.length === rows[0].length && r.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1))) throw Error('Heatmap must be a rectangular 2–256 × 2–256 grid of values in [0,1].');
  result.heatmap = {method:label(h.method,'heatmap.method'),alignment:'original-image',values:rows.map(r => r.slice())};
 }
 return result;
}
export function parseRuns(input: unknown): Run[] {
 const o = object(input);
 if (!Array.isArray(o.runs) || !o.runs.length || o.runs.length > 20) throw Error('Provide 1–20 evaluation runs.');
 const ids = new Set<string>();
 let total = 0;
 return o.runs.map(value => {
  const r = object(value), id = label(r.id,'run.id');
  if (ids.has(id)) throw Error('Run IDs must be unique.'); ids.add(id);
  if (!Array.isArray(r.rows) || !r.rows.length || (total += r.rows.length) > 100000) throw Error('Runs need labeled rows; maximum 100,000 rows total.');
  if (typeof r.external !== 'boolean' || typeof r.overlapChecked !== 'boolean') throw Error('external and overlapChecked must be booleans.');
  const caseIds = new Set<string>();
  const rows = r.rows.map(value => {
   const row = object(value), id = label(row.id,'row.id');
   if (caseIds.has(id)) throw Error(`Duplicate case ID in ${r.id}: ${id}`); caseIds.add(id);
   const result: EvalRow = {id,trueGrade:grade(row.trueGrade),predictedGrade:grade(row.predictedGrade)};
   if (row.probabilities !== undefined) {
    result.probabilities = probabilities(row.probabilities);
    if (predictedGrade(result.probabilities) !== result.predictedGrade) throw Error('predictedGrade must equal probability argmax (first grade wins ties).');
   }
   return result;
  });
  return {id,model:label(r.model,'model'),variant:label(r.variant,'variant'),dataset:label(r.dataset,'dataset'),split:label(r.split,'split'),cohort:label(r.cohort,'cohort'),external:r.external,overlapChecked:r.overlapChecked,rows};
 });
}
export function comparable(a: Run, b: Run) {
 if (a.dataset !== b.dataset || a.split !== b.split || a.cohort !== b.cohort || a.external !== b.external || a.rows.length !== b.rows.length) return false;
 const truth = new Map(a.rows.map(r => [r.id,r.trueGrade]));
 return b.rows.every(r => truth.get(r.id) === r.trueGrade);
}
export function metrics(rows: EvalRow[]) {
 const matrix = Array.from({length:5}, () => Array(5).fill(0) as number[]);
 rows.forEach(r => matrix[r.trueGrade][r.predictedGrade]++);
 const actual = matrix.map(r => r.reduce((a,b) => a+b,0));
 const predicted = matrix.map((_,i) => matrix.reduce((s,r) => s+r[i],0));
 const n = rows.length;
 let observed = 0, expected = 0;
 matrix.forEach((r,i) => r.forEach((count,j) => {observed += count*(i-j)**2; expected += (actual[i]*predicted[j]/(n||1))*(i-j)**2;}));
 const recalls = actual.map((count,i) => count ? matrix[i][i]/count : null);
 const f1 = actual.map((count,i) => count+predicted[i] ? 2*matrix[i][i]/(count+predicted[i]) : 0);
 const scored = rows.filter(r => r.probabilities);
 let ece = 0;
 for (let bin=0;bin<10;bin++) {
  const group = scored.filter(r => Math.min(9,Math.floor(Math.max(...r.probabilities!)*10)) === bin);
  if (group.length) ece += Math.abs(group.reduce((s,r) => s+Math.max(...r.probabilities!),0)/group.length - group.filter(r => r.trueGrade===r.predictedGrade).length/group.length)*group.length/scored.length;
 }
 return {n,matrix,actual,recalls,qwk:expected ? 1-observed/expected : null,macroF1:n ? f1.reduce((a,b) => a+b,0)/5 : null,accuracy:n ? rows.filter(r => r.trueGrade===r.predictedGrade).length/n : null,mae:n ? rows.reduce((s,r) => s+Math.abs(r.trueGrade-r.predictedGrade),0)/n : null,ece:scored.length ? ece : null,scored:scored.length};
}
export function imageSignals(data: ArrayLike<number>, width: number, height: number, originalWidth=width, originalHeight=height): Quality {
 if (width < 3 || height < 3 || data.length !== width*height*4) throw Error('Invalid pixel dimensions.');
 const gray = new Float64Array(width*height);
 let count=0,sum=0,squares=0,clipped=0;
 for(let i=0;i<gray.length;i++) {
  const v = gray[i] = .2126*data[i*4]+.7152*data[i*4+1]+.0722*data[i*4+2];
  if(v>10){count++;sum+=v;squares+=v*v;if(v>245)clipped++;}
 }
 let lapSum=0,lapSquares=0,lapCount=0;
 for(let y=1;y<height-1;y++) for(let x=1;x<width-1;x++) {
  const i=y*width+x;
  if ([i,i-1,i+1,i-width,i+width].some(j => gray[j]<=10)) continue;
  const v=gray[i-1]+gray[i+1]+gray[i-width]+gray[i+width]-4*gray[i];lapSum+=v;lapSquares+=v*v;lapCount++;
 }
 const brightness=count?sum/count:0, contrast=count?Math.sqrt(Math.max(0,squares/count-brightness**2)):0;
 const sharpness=lapCount?Math.max(0,lapSquares/lapCount-(lapSum/lapCount)**2):0;
 const coverage=count/gray.length,clipping=count?clipped/count:0;
 // ponytail: fixed image-signal thresholds, replace with validated camera-specific quality models before clinical use.
 const flags:string[]=[];
 if(Math.min(originalWidth,originalHeight)<512)flags.push('Low resolution');
 if(coverage<.35)flags.push('Small illuminated area');
 if(brightness<45)flags.push('Low exposure');
 if(brightness>210 || clipping>.1)flags.push('Possible overexposure');
 if(contrast<20)flags.push('Low contrast');
 if(sharpness<60)flags.push('Possible blur');
 return {width:originalWidth,height:originalHeight,brightness,contrast,sharpness,coverage,clipping,flags};
}
export async function inspectImage(image: HTMLImageElement): Promise<Quality> {
 const scale=Math.min(1,512/Math.max(image.naturalWidth,image.naturalHeight));
 const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Image analysis is unavailable in this browser.');
 ctx.drawImage(image,0,0,canvas.width,canvas.height);
 return imageSignals(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,image.naturalWidth,image.naturalHeight);
}
export function reportText(record: {id:string; eye:string; review?:string; notes?:string; status:string; imageSha256?:string; qualityCheck?:Quality; analysis?:Prediction}, timestamp: string) {
 const p=record.analysis,q=record.qualityCheck;
 return ['RETINAREVIEW — RESEARCH REVIEW REPORT',`Generated: ${timestamp}`,`Case: ${record.id}`,`Eye: ${record.eye}`,`Review status: ${record.status}`,`Image SHA-256: ${record.imageSha256 ?? 'No image supplied'}`,'','IMAGE QUALITY (UNVALIDATED HEURISTIC)', q ? `${q.width} × ${q.height}; brightness ${q.brightness.toFixed(1)}/255; contrast ${q.contrast.toFixed(1)}; Laplacian variance ${q.sharpness.toFixed(1)}; illuminated area ${(q.coverage*100).toFixed(1)}%. Flags: ${q.flags.join(', ') || 'No heuristic flags'}.` : 'Not assessed.','','IMPORTED MODEL OUTPUT',p ? `Model: ${p.model}\nPredicted grade: ${predictedGrade(p.probabilities)} — ${gradeNames[predictedGrade(p.probabilities)]}\nTop-class probability: ${(Math.max(...p.probabilities)*100).toFixed(1)}%\nCalibration (declared by importer): ${p.calibration}\nProbabilities: ${p.probabilities.map(n=>n.toFixed(4)).join(', ')}\nAttribution: ${p.heatmap?.method ?? 'Not supplied'}` : 'No model output. No prediction generated.','','REVIEWER ASSESSMENT',record.review === 'ungradable' ? 'Ungradable' : record.review !== undefined && record.review !== '' ? `${record.review} — ${gradeNames[Number(record.review)]}` : 'Pending',record.notes?.trim() || 'No observations recorded.','','LIMITATIONS','Research prototype; not a clinical diagnosis or treatment recommendation. Imported outputs are not independently verified. Attribution is not lesion segmentation. Image-quality flags do not establish clinical gradability. Reviewer assessment is distinct from the model output.'].join('\n');
}
