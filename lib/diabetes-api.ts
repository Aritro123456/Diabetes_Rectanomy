export type Health = {status:'ok';model_ready:boolean;model_version:string|null};
export type DiabetesResult = {prediction:0|1;risk:'low'|'high';probability:number|null;model_version:string};
export const diabetesFields = [
 {name:'pregnancies',label:'Pregnancies',min:0,max:25,integer:true},
 {name:'glucose',label:'Glucose',min:0,max:300,positive:true},
 {name:'blood_pressure',label:'Blood pressure',min:0,max:250,positive:true},
 {name:'skin_thickness',label:'Skin thickness',min:0,max:100},
 {name:'insulin',label:'Insulin',min:0,max:1000},
 {name:'bmi',label:'BMI',min:0,max:100,positive:true},
 {name:'diabetes_pedigree_function',label:'Diabetes pedigree function',min:0,max:5},
 {name:'age',label:'Age',min:1,max:120,integer:true},
] as const;
export function apiBase(input:string) {
 let url:URL;try{url=new URL(input.trim());}catch{throw Error('Enter the backend’s full HTTPS URL, or a localhost URL for local development.');}
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if((url.protocol!=='https:' && !(url.protocol==='http:'&&local))||url.username||url.password||url.search||url.hash) throw Error('Use HTTPS (HTTP is allowed only for localhost). Do not put credentials, query parameters, or fragments in the URL.');
 return url.href.replace(/\/+$/,'');
}
export function diabetesPayload(values:Record<string,string>) {
 const payload:Record<string,number>={};
 for(const field of diabetesFields){const raw=values[field.name];const value=Number(raw);if(raw===undefined||raw.trim()===''||!Number.isFinite(value)||value<field.min||value>field.max||('positive'in field&&field.positive&&value===0)||('integer'in field&&field.integer&&!Number.isInteger(value)))throw Error(`Enter a valid ${field.label.toLowerCase()} within the API’s accepted range.`);payload[field.name]=value;}
 return payload;
}
export async function diabetesAPI(base:string, route:'health'|'predict', payload?:Record<string,number>, signal?:AbortSignal):Promise<Health|DiabetesResult> {
 const timeout=AbortSignal.timeout(15000);
 let response:Response;
 try {response=await fetch(`${apiBase(base)}/${route}`,{method:route==='predict'?'POST':'GET',...(route==='predict'?{headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}:{}),credentials:'omit',cache:'no-store',signal:signal?AbortSignal.any([signal,timeout]):timeout});}
 catch(error){if(signal?.aborted)throw error;throw Error(timeout.aborted?'The backend did not respond within 15 seconds.':'Cannot reach the backend. Check its URL, HTTPS, server status, and allowed frontend origin (CORS).');}
 if(!response.ok){if(response.status===503)throw Error('The API is reachable, but its prediction model is unavailable.');if(response.status===422)throw Error('The backend rejected the measurements. Check all eight values and their accepted ranges.');throw Error(`The backend returned HTTP ${response.status}. Please try again later.`);}
 let raw:unknown;try{raw=await response.json();}catch{throw Error('The backend returned an invalid JSON response.');}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Unexpected backend response.');
 const data=raw as Record<string,unknown>;
 if(route==='health'){
  if(data.status!=='ok'||typeof data.model_ready!=='boolean'||!(data.model_version===null||typeof data.model_version==='string'))throw Error('This URL does not return the expected diabetes API health response.');
  return {status:'ok',model_ready:data.model_ready,model_version:data.model_version};
 }
 if((data.prediction!==0&&data.prediction!==1)||(data.risk!=='low'&&data.risk!=='high')||data.risk!==(data.prediction===1?'high':'low')||typeof data.model_version!=='string'||!data.model_version||!(data.probability===null||(typeof data.probability==='number'&&Number.isFinite(data.probability)&&data.probability>=0&&data.probability<=1)))throw Error('The backend returned an invalid prediction. No result has been displayed.');
 return {prediction:data.prediction,risk:data.risk,probability:data.probability,model_version:data.model_version};
}

