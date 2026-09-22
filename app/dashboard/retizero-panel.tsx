'use client';
import { useEffect, useRef, useState } from 'react';
import { apiBase } from '../../lib/diabetes-api';
import { parseRetiZero } from '../../lib/retizero';
import type { RetiZeroResult } from '../../lib/retizero';
declare const __API_URL__:string;
export default function RetiZeroPanel({image,hash}:{image?:string;hash?:string}) {
 const [url,setUrl]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('Check the API connection before sending an image.'),[result,setResult]=useState<RetiZeroResult|null>(null);
 const request=useRef<AbortController|null>(null);
 useEffect(()=>{setUrl(typeof __API_URL__==='string'&&__API_URL__?__API_URL__:['localhost','127.0.0.1'].includes(location.hostname)?'http://127.0.0.1:8000':'');return()=>request.current?.abort();},[]);
 async function run(predict:boolean){
  request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);setResult(null);
  try{
   const base=apiBase(url);const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(predict?120000:15000)]);
   const body=predict&&image?await(await fetch(image,{signal})).blob():undefined;
   const response=await fetch(base+(predict?'/predict/image':'/retizero/health'),{method:predict?'POST':'GET',...(body?{body,headers:{'Content-Type':body.type}}:{}),signal,credentials:'omit',cache:'no-store'});
   if(!response.ok)throw Error(response.status===503?'RetiZero is unavailable. Install the official checkpoint and runtime on the backend.':response.status===422?'The API rejected this image. Use a valid JPEG or PNG.':response.status===413?'Image exceeds 10 MB.':`API request failed (HTTP ${response.status}).`);
   const data=await response.json();if(controller.signal.aborted)return;
   if(predict){setResult(parseRetiZero(data,hash??''));setMessage('Image processed. Scores compare the 14 candidate labels only.');}
   else{if(!data||typeof data!=='object'||!('status' in data)||data.status!=='ok'||!('model_ready' in data)||typeof data.model_ready!=='boolean')throw Error('Unexpected RetiZero health response.');setReady(data.model_ready);setMessage(data.model_ready?'RetiZero ready.':'API connected; RetiZero weights/runtime are not loaded.');}
  }catch(error){if(!controller.signal.aborted){setReady(false);setMessage(error instanceof Error?error.message:'Unable to reach the API. Check HTTPS and CORS.');}}
  finally{if(!controller.signal.aborted)setBusy(false);}
 }
 function download(){if(!result)return;const link=document.createElement('a');const objectURL=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));link.href=objectURL;link.download='retizero-ranking.json';link.click();setTimeout(()=>URL.revokeObjectURL(objectURL),1000);}
 return <section className="panel feature-panel"><span className="eyebrow">RETIZERO · IMAGE PREDICTION</span><h2>Retinal disease ranking</h2><p className="feature-description">Uses the official 14 disease prompts. This does not assign a five-level DR grade or generate a lesion heatmap.</p><label className="field">Backend URL<input type="url" placeholder="https://your-api.example.com" value={url} onChange={e=>{request.current?.abort();setBusy(false);setReady(false);setResult(null);setUrl(e.target.value);setMessage('Check the new API connection.');}}/></label><button className="secondary" disabled={busy||!url.trim()} onClick={()=>void run(false)}>Check RetiZero connection</button><p role="status">{busy?'Waiting for backend…':message}</p><p className="sample-note">Choosing “Send image to RetiZero” uploads this image to {url||'the configured backend'}. The API processes it in memory. Only send images you are permitted to share.</p><button className="primary" disabled={busy||!ready||!image||!hash} onClick={()=>void run(true)}>Send image to RetiZero</button>{!image&&<p>Open a JPEG or PNG in the workspace first.</p>}{result&&<div className="prediction-result"><h3>Candidate ranking</h3><ol>{[...result.scores].sort((a,b)=>b.score-a.score).map(s=><li key={s.label}>{s.label}: {(s.score*100).toFixed(2)}%</li>)}</ol><p>Uncalibrated softmax scores, not disease probabilities. Informational research output, not a medical diagnosis. Conditions outside these labels cannot be identified.</p><small>Model: {result.model}</small><p><button className="secondary" onClick={download}>Download ranking JSON</button></p></div>}</section>;
}
