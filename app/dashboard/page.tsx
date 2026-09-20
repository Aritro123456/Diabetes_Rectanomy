'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowRight, Check, CheckCheck, ChevronRight, CircleHelp, Eye, FileImage, FlaskConical, LayoutGrid, Plus, Search, ShieldCheck, SlidersHorizontal, Upload, X, ZoomIn, ZoomOut } from 'lucide-react';

import { validateImageFile, validateImageDimensions } from '../../lib/review';
import { inspectImage, predictedGrade } from '../../lib/analysis';
import type { Quality, Prediction, Run } from '../../lib/analysis';
import { CaseTools, EvaluationTools, Heatmap } from './features';
import './features.css';
import { homeUrl } from '../../lib/site-paths';

type Case = { id: string; eye: string; grade: number | null; status: string; quality: string; image?: string; notes?: string; review?: string; imageSha256?: string; qualityCheck?: Quality; analysis?: Prediction };
const initial: Case[] = [
  { id: 'DEMO-001', eye: 'Right eye', grade: 2, status: 'Needs review', quality: 'Adequate' },
  { id: 'DEMO-002', eye: 'Left eye', grade: 0, status: 'Needs review', quality: 'Adequate' },
  { id: 'DEMO-003', eye: 'Right eye', grade: null, status: 'Needs review', quality: 'Low quality' },
  { id: 'DEMO-004', eye: 'Left eye', grade: 3, status: 'Needs review', quality: 'Adequate' },
];
const grades = ['No DR', 'Mild NPDR', 'Moderate NPDR', 'Severe NPDR', 'Proliferative DR'];

export default function Home() {
 const [tab, setTab] = useState('Workspace');
 const [cases, setCases] = useState(initial);
 const [selected, setSelected] = useState('DEMO-001');
 const [query, setQuery] = useState('');
 const [filter, setFilter] = useState('All cases');
 const [modal, setModal] = useState(false);
 const [notice, setNotice] = useState('');
 const [zoom, setZoom] = useState(1);
 const [runs, setRuns] = useState<Run[]>([]);
 const [showHeatmap, setShowHeatmap] = useState(false);
 const [overlayOpacity, setOverlayOpacity] = useState(.55);
 const input = useRef<HTMLInputElement>(null);
 const urls = useRef<string[]>([]);
 const current = cases.find(c => c.id === selected)!;
 const reviewed = cases.filter(c => c.status === 'Reviewed').length;
 useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);
 useEffect(() => {
  if (!modal) return;
  const previous = document.activeElement as HTMLElement | null;
  return () => previous?.focus();
 }, [modal]);
 useEffect(() => {
  const context = (document as Document & {modelContext?: {registerTool: (tool: unknown, options: {signal: AbortSignal}) => void | Promise<void>}}).modelContext;
  if (!context) return;
  const lifecycle = new AbortController();
  try {
   void Promise.resolve(context.registerTool({name:'open_sample_case', description:'Open one of the four sample cases in the review workspace. Does not save or change assessments.', inputSchema:{type:'object',properties:{id:{type:'string',enum:initial.map(c => c.id)}},required:['id'],additionalProperties:false}, execute: (input: unknown) => {
    if (!input || typeof input !== 'object' || !('id' in input) || !initial.some(c => c.id === input.id)) throw new Error('Unknown sample case');
    setSelected(String(input.id)); setZoom(1); setTab('Workspace');
    return {opened:input.id};
   }}, {signal:lifecycle.signal})).catch(() => {});
  } catch { /* Optional browser capability; the interface remains available. */ }
  return () => lifecycle.abort();
 }, []);
 function selectCase(id: string) { setSelected(id); setZoom(1); setShowHeatmap(false); setTab('Workspace'); }
 function update(values: Partial<Case>) { setCases(old => old.map(c => c.id === selected ? { ...c, ...values } : c)); }
 async function upload(file?: File) {
  if (!file) return;
  if (!validateImageFile(file)) { setNotice('Choose a JPEG or PNG image under 10 MB.'); return; }
  const url = URL.createObjectURL(file);
  try {
   const image = new Image(); image.src = url; await image.decode();
   if (!validateImageDimensions(image.width, image.height)) throw new Error('dimensions');
   const qualityCheck = await inspectImage(image);
   const imageSha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))).map(n=>n.toString(16).padStart(2,'0')).join('');
   urls.current.push(url);
   const id = `LOCAL-${crypto.randomUUID().slice(0,8)}`;
   setCases(old => [...old, { id, eye: 'Not specified', grade: null, quality: qualityCheck.flags.length ? 'Quality flags' : 'No heuristic flags', status: 'Needs review', image: url, qualityCheck, imageSha256 }]);
   selectCase(id); setModal(false); setNotice('Image opened locally. Image-quality signals are ready; DR inference is not connected.');
  } catch { URL.revokeObjectURL(url); setNotice('Unable to open image. Use a valid image between 32 pixels and 40 megapixels.'); }
 }
 function exportReview() {
  const { image, ...record } = current;
  const blob = new Blob([JSON.stringify({ prototype: true, modelConnected: false, importedOutput: !!current.analysis, ...record }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${current.id}-review.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  setNotice('Review record exported. Images are not included.');
 }
 return <div className="shell">
  <a href="#main" className="skip">Skip to content</a>
  <aside className="sidebar">
   <a href={homeUrl} className="brand"><span className="brandmark"><Eye size={23}/></span>retina<span>review</span></a>
   <div className="workspace-label">RESEARCH WORKSPACE</div>
   <nav aria-label="Main navigation">{[['Workspace', LayoutGrid], ['Evaluation', Activity], ['Project', FlaskConical]].map(([name, Icon]) => <button key={String(name)} className={tab === name ? 'nav-item active' : 'nav-item'} onClick={() => setTab(String(name))}>{typeof Icon !== 'string' && <Icon size={18}/>}<span>{String(name)}</span>{name === 'Workspace' && <span className="nav-count">{cases.length}</span>}</button>)}</nav>
   <div className="sidebar-bottom"><div className="research-card"><ShieldCheck size={22}/><strong>Human review, always.</strong><p>Research prototype.<br/>Not for clinical decisions.</p></div><button className="help" onClick={() => { setTab('Project'); }}><CircleHelp size={17}/> About this prototype <ArrowRight size={15}/></button><div className="profile"><span className="avatar">R</span><div><strong>Researcher</strong><small>Local demo session</small></div><span className="live-dot"/></div></div>
  </aside>
  <div className="body"><header className="topbar"><div>Research workspace <ChevronRight size={14}/><span>{tab}</span></div><span className="demo-pill"><span className="live-dot"/> FRONTEND DEMO</span></header>
  <main id="main">
   <div className="heading"><div><div className="eyebrow">RETINAL IMAGE INTELLIGENCE</div><h1>{tab === 'Workspace' ? 'A clearer view. A considered review.' : tab === 'Evaluation' ? 'Evidence before confidence.' : 'Built for thoughtful review.'}</h1><p>{tab === 'Workspace' ? 'Inspect images, review findings, and keep the human in the loop.' : tab === 'Evaluation' ? 'A transparent place for performance, limitations, and model comparisons.' : 'The workflow, the research, and what comes next.'}</p></div><button className="primary" onClick={() => {setNotice('');setModal(true);}}><Plus size={18}/> New case</button></div>
   {notice && <div role="status" className="notice">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={16}/></button></div>}
   {tab === 'Workspace' ? <>
   <section className="stats" aria-label="Session overview">{[[FileImage, 'Cases in session', cases.length, 'Sample and local images'], [Eye, 'Awaiting review', cases.length - reviewed, 'Ready for your assessment'], [CheckCheck, 'Reviewed', reviewed, 'Saved for this session'], [FlaskConical, 'Inference engine', 'Offline', 'Import trained-model outputs']].map(([Icon, label, value, sub]) => <div className="stat" key={String(label)}><div><span>{String(label)}</span>{typeof Icon !== 'string' && typeof Icon !== 'number' && <Icon size={18}/>}</div><strong>{String(value)}</strong><small>{String(sub)}</small></div>)}</section>
   <div className="review-layout"><section className="queue panel"><div className="panel-title"><h2>Case queue</h2><span className="count">{cases.length}</span></div><label className="search"><Search size={16}/><input placeholder="Search case ID" value={query} onChange={e => setQuery(e.target.value)}/></label><label className="filter"><SlidersHorizontal size={14}/><select aria-label="Filter cases" value={filter} onChange={e => setFilter(e.target.value)}><option>All cases</option><option>Needs review</option><option>Reviewed</option></select></label><div className="case-list">{cases.filter(c => c.id.toLowerCase().includes(query.toLowerCase()) && (filter === 'All cases' || c.status === filter)).map(c => <button key={c.id} onClick={() => selectCase(c.id)} className={`case ${c.id === selected ? 'selected' : ''}`}><span className="thumbnail">{c.image ? <img src={c.image} alt=""/> : <Eye size={21}/>}</span><span className="case-copy"><strong>{c.id}</strong><small>{c.eye} · {c.image ? 'Local image' : 'Sample case'}</small><span className={`status ${c.status === 'Reviewed' ? 'green' : ''}`}>{c.status}</span></span><ChevronRight size={14}/></button>)}{!cases.some(c => c.id.toLowerCase().includes(query.toLowerCase()) && (filter === 'All cases' || c.status === filter)) && <p className="empty">No matching cases.</p>}</div><div className="queue-footer"><span className="live-dot"/> Changes stay in this session</div></section>
   <section className="viewer panel"><div className="panel-title"><div><h2>{current.id}</h2><small>{current.eye} <span className="separator">/</span> Fundus image</small></div><span className="outline-badge">{current.image ? 'LOCAL UPLOAD' : 'SAMPLE CASE'}</span></div><div className="image-stage">{current.image ? <div className="scan-frame" style={{transform: `scale(${zoom})`, width: `min(100%, ${359 * (current.qualityCheck ? current.qualityCheck.width / current.qualityCheck.height : 1)}px)`}}><img src={current.image} alt={`Fundus image for ${current.id}`}/>{showHeatmap && current.analysis?.heatmap && <Heatmap map={current.analysis.heatmap} opacity={overlayOpacity}/>}</div> : <div className="image-placeholder"><div className="orbital"><div/><Eye size={54} strokeWidth={1}/></div><strong>Your next perspective starts here.</strong><p>No patient image is included in this sample.<br/>Open a fundus image to inspect it locally.</p><button className="secondary" onClick={() => setModal(true)}><Upload size={16}/> Open an image</button></div>}<div className="stage-corner">{current.image ? 'ORIGINAL IMAGE' : 'IMAGE PREVIEW'}</div></div><div className="viewer-tools"><span><ShieldCheck size={15}/> {current.image ? 'Image remains in your browser' : 'No patient data'}</span><div><button aria-label="Zoom out" disabled={!current.image || zoom <= 1} onClick={() => setZoom(z => Math.max(1, z - .25))}><ZoomOut size={17}/></button><span>{Math.round(zoom * 100)}%</span><button aria-label="Zoom in" disabled={!current.image || zoom >= 3} onClick={() => setZoom(z => Math.min(3, z + .25))}><ZoomIn size={17}/></button></div></div><div className="overlay-controls"><button className="secondary" disabled={!current.analysis?.heatmap} aria-pressed={showHeatmap} onClick={() => setShowHeatmap(!showHeatmap)}>{showHeatmap ? "Hide attribution" : "Show attribution"}</button>{showHeatmap && current.analysis?.heatmap && <label>Opacity<input aria-label="Attribution opacity" type="range" min="0" max="1" step="0.05" value={overlayOpacity} onChange={e=>setOverlayOpacity(Number(e.target.value))}/></label>}</div><div className="image-caption"><span className="caption-icon"><Eye size={18}/></span><div><strong>{showHeatmap ? "Imported attribution overlay" : "Original detail. Unaltered."}</strong><p>{showHeatmap ? "Model influence, not verified lesion segmentation. Hide the overlay to inspect the original." : "Use the original image for your assessment. No diagnostic inference is running."}</p></div></div></section>
   <section className="findings panel"><div className="panel-title"><h2>Review findings</h2><FlaskConical size={18}/></div><div className="findings-body"><div className="sample-note">{current.analysis ? 'Imported model output · not independently verified' : current.image ? 'Awaiting model output import' : 'Illustrative output · not a model prediction'}</div><div className="prediction"><span>DR SEVERITY</span><h3>{current.grade === null ? 'Not assessed' : grades[current.grade]}</h3><p>{current.grade === null ? 'Manual review required' : `Grade ${current.grade} of 4 · ${current.analysis ? "imported output" : "sample value"}`}</p></div><div className="grade-scale" aria-label="DR grade scale">{grades.map((g,i) => <div key={g} className={current.grade === i ? 'chosen' : ''}><span>{i}</span><div/></div>)}</div><div className="scale-labels"><span>No DR</span><span>Proliferative</span></div><div className="quality"><span>Image quality</span><span className={current.quality === 'Low quality' ? 'amber-text' : ''}>{current.quality}{!current.image && ' (sample)'}</span></div><hr/><label className="field">Reviewer assessment<select value={current.review ?? ''} onChange={e => update({review:e.target.value, status:'Needs review'})}><option value="">Select an assessment</option>{grades.map((g,i) => <option key={g} value={String(i)}>{i} — {g}</option>)}<option value="ungradable">Ungradable</option></select></label><label className="field">Review notes<textarea value={current.notes ?? ''} onChange={e => update({notes:e.target.value,status:'Needs review'})} placeholder="Add observations for this case…" rows={3}/></label><button className="primary save" disabled={!current.review} onClick={() => {update({status:'Reviewed'});setNotice(`${current.id}: review saved for this session. Export it to keep a copy.`);}}><Check size={16}/>{current.status === 'Reviewed' ? 'Review saved' : 'Save review'}</button><button className="export" onClick={exportReview}><ArrowDownToLine size={16}/> Export review</button></div></section></div>
   <CaseTools record={current} onAnalysis={analysis => {update({analysis, grade: analysis ? predictedGrade(analysis.probabilities) : null, status:"Needs review"}); setShowHeatmap(false);}}/>
   <div className="bottom-note"><ShieldCheck size={16}/><span>Research use only. All sample findings are illustrative. No diagnostic model is running.</span><span>RetinaReview <span className="version">v0.1</span></span></div>
   </> : tab === 'Evaluation' ? <EvaluationTools runs={runs} onRuns={setRuns}/> : <section className="project panel"><span className="eyebrow">FROM IMAGE TO HUMAN REVIEW</span><h2>One careful workflow.</h2><div className="workflow">{['Open an image','Inspect original detail','Record assessment','Export the review'].map((step,i) => <div key={step}><span>0{i+1}</span><h3>{step}</h3></div>)}</div><h3>Research sources</h3><div className="sources">{[['APTOS 2019','Five-grade DR classification dataset','https://www.kaggle.com/competitions/aptos2019-blindness-detection'],['IDRiD','Grading and lesion annotation research','https://idrid.grand-challenge.org/Data/'],['RetiZero','Vision-language foundation model research','https://github.com/LooKing9218/RetiZero'],['MotionSites · AI Runtime','Visual reference by Ritu; adapted for this workspace','https://motionsites.ai/?prompt=ai-runtime']].map(([name,description,url]) => <a href={url} target="_blank" rel="noreferrer" key={name}><div><strong>{name}</strong><p>{description}</p></div><ArrowRight size={18}/></a>)}</div><p className="project-note">This frontend does not run RETFound or RetiZero. Uploaded images and review notes stay in memory and are cleared on refresh. Export reviews before leaving.</p></section>}
  </main></div>
  {modal && <div className="modal-backdrop" onClick={() => setModal(false)}><section className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title" onClick={e => e.stopPropagation()} onKeyDown={e => {if(e.key === 'Escape') setModal(false); if(e.key === 'Tab') { const nodes = e.currentTarget.querySelectorAll<HTMLElement>('button,input'); const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}}}}><button autoFocus className="modal-close" aria-label="Close upload" onClick={() => setModal(false)}><X size={20}/></button><span className="upload-icon"><Upload size={28}/></span><h2 id="upload-title">A new perspective.</h2><p>Open a fundus image for manual review.<br/>The image stays in your browser.</p><div className="dropzone" onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); void upload(e.dataTransfer.files[0]);}}><FileImage size={34}/><strong>Drop an image here</strong><span>JPEG or PNG · up to 10 MB</span><button className="primary" onClick={() => input.current?.click()}>Browse files <ArrowRight size={16}/></button><input className="file-input" ref={input} type="file" accept="image/jpeg,image/png" aria-label="Choose fundus image" onChange={e => void upload(e.target.files?.[0])}/></div>{notice && <p role="alert">{notice}</p>}<small>No automatic diagnosis. Reviewer assessment only.</small></section></div>}
 </div>;
}





