import assert from 'node:assert/strict';
const base = process.env.PREVIEW_URL || 'http://localhost:3000';
for (const [route, expected] of [['/', ['See clearly.', 'Step into the workspace', 'href="/dashboard/"', 'Pause ambient videos']], ['/dashboard', ['Case queue', 'Review findings', 'No diagnostic model is running.']]]) {
 const response = await fetch(base + route);
 assert.equal(response.status, 200, route);
 const html = await response.text();
 for (const text of expected) {
  // Playback starts off in the server render to respect reduced motion on hydration.
  if (text === 'Pause ambient videos') assert.ok(html.includes('Play ambient videos'));
  else assert.ok(html.includes(text), `${route} is missing ${text}`);
 }
}
console.log('Landing and dashboard route checks passed');

