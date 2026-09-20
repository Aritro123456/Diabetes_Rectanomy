import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync} from 'node:fs';
for (const page of ['index.html','dashboard/index.html']) {
 const html=readFileSync(`dist-pages/${page}`,'utf8');
 assert.ok(html.includes(page.startsWith('dashboard')?'data-page="dashboard"':'data-page="home"'));
 const assets=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(assets.length>=2);
 for(const asset of assets) {
  assert.ok(asset.startsWith('/Diabetes_Rectanomy/'),`Wrong base path: ${asset}`);
  assert.ok(existsSync(`dist-pages/${asset.slice('/Diabetes_Rectanomy/'.length)}`),`Missing asset: ${asset}`);
 }
}
const js=readdirSync('dist-pages/assets').filter(f=>f.endsWith('.js')).map(f=>readFileSync(`dist-pages/assets/${f}`,'utf8')).join('');
assert.ok(js.includes('/Diabetes_Rectanomy'));
assert.ok(!js.includes('href:"/dashboard"'));
assert.ok(!js.includes('href:"/"'));
console.log('Both static routes and their base-prefixed assets passed.');
