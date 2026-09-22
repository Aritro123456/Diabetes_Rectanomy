import assert from 'node:assert/strict';
import {apiBase,diabetesPayload,diabetesAPI} from './lib/diabetes-api.ts';
const values={pregnancies:'2',glucose:'110',blood_pressure:'70',skin_thickness:'20',insulin:'80',bmi:'24.5',diabetes_pedigree_function:'0.4',age:'35'};
const payload=diabetesPayload(values);
assert.equal(payload.bmi,24.5);
assert.throws(()=>diabetesPayload({...values,age:''}));
assert.throws(()=>diabetesPayload({...values,age:'35.5'}));
assert.throws(()=>diabetesPayload({...values,glucose:'0'}));
assert.throws(()=>diabetesPayload({...values,bmi:'Infinity'}));
assert.equal(apiBase('https://example.com/api/'),'https://example.com/api');
assert.throws(()=>apiBase('http://example.com'));
assert.throws(()=>apiBase('https://user:secret@example.com'));
assert.throws(()=>apiBase('https://example.com?token=secret'));
assert.equal(apiBase('http://127.0.0.1:8000/'),'http://127.0.0.1:8000');
const original=globalThis.fetch;
try {
 globalThis.fetch=async()=>new Response(JSON.stringify({status:'ok',model_ready:false,model_version:null}));
 assert.equal((await diabetesAPI('https://example.com','health')).model_ready,false);
 globalThis.fetch=async(url,options)=>{assert.equal(url,'https://example.com/predict');assert.equal(options.method,'POST');assert.equal(options.credentials,'omit');assert.deepEqual(JSON.parse(options.body),payload);return new Response(JSON.stringify({prediction:1,risk:'high',probability:.8,model_version:'test'}));};
 assert.equal((await diabetesAPI('https://example.com','predict',payload)).probability,.8);
 globalThis.fetch=async()=>new Response('{}',{status:503});
 await assert.rejects(()=>diabetesAPI('https://example.com','predict',payload),/unavailable/);
 globalThis.fetch=async()=>new Response('{}',{status:422});
 await assert.rejects(()=>diabetesAPI('https://example.com','predict',payload),/rejected/);
 globalThis.fetch=async()=>new Response(JSON.stringify({prediction:1,risk:'low',probability:.8,model_version:'test'}));
 await assert.rejects(()=>diabetesAPI('https://example.com','predict',payload),/invalid prediction/);
 globalThis.fetch=async()=>new Response('not-json');
 await assert.rejects(()=>diabetesAPI('https://example.com','health'),/invalid JSON/);
 globalThis.fetch=async()=>{throw new TypeError('Failed to fetch');};
 await assert.rejects(()=>diabetesAPI('https://example.com','health'),/Cannot reach/);
} finally {globalThis.fetch=original;}
if(process.env.API_TEST_URL){
 const health=await diabetesAPI(process.env.API_TEST_URL,'health');
 assert.equal(health.status,'ok');
 if(!health.model_ready)await assert.rejects(()=>diabetesAPI(process.env.API_TEST_URL,'predict',payload),/unavailable/);
 console.log('Live frontend API client → FastAPI integration passed');
}
console.log('Diabetes API validation and response checks passed');
