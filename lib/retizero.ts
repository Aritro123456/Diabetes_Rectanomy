export type RetiZeroResult = { imageSha256:string; model:string; task:'zero-shot-disease-ranking'; scoreType:'uncalibrated-softmax'; scores:{label:string;score:number}[] };
export function parseRetiZero(value:unknown, hash:string):RetiZeroResult {
 if(!value||typeof value!=='object')throw Error('Invalid model response.');
 const data=value as RetiZeroResult;
 if(data.imageSha256!==hash||!/^[a-f0-9]{64}$/.test(hash)||typeof data.model!=='string'||!data.model||data.model.length>160||data.task!=='zero-shot-disease-ranking'||data.scoreType!=='uncalibrated-softmax'||!Array.isArray(data.scores)||data.scores.length!==14)throw Error('Model response does not match this image or task.');
 if(data.scores.some(s=>!s||typeof s.label!=='string'||!s.label||s.label.length>160||typeof s.score!=='number'||!Number.isFinite(s.score)||s.score<0||s.score>1)||new Set(data.scores.map(s=>s.label)).size!==14||Math.abs(data.scores.reduce((sum,s)=>sum+s.score,0)-1)>0.0001)throw Error('Invalid RetiZero scores.');
 return data;
}
