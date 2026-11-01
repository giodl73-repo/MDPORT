import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const references = JSON.parse(readFileSync('.cache/native-references.json','utf8'));
const sample = readFileSync('web/example-record.json','utf8');
const workerSource = readFileSync('web/worker.js','utf8');
async function observe(page) {
  await page.addInitScript(() => {
    const ActualWorker = window.Worker;
    window.Worker = class extends ActualWorker {
      constructor(...args) {
        super(...args); window.testWorker = this;
        this.addEventListener('message',({data}) => { if (data.type === 'result') window.lastInspection = data.canonical; });
      }
      postMessage(...args) { if (args[0].type === 'inspect') window.lastInspection = null; return super.postMessage(...args); }
    };
  });
}
async function ready(page) { await page.goto('./'); await expect(page.locator('#counts')).toHaveText('2 sections · 2 references'); await expect(page.locator('#status')).toContainText('Inspection complete'); }
async function submit(page,input) { await page.locator('#record').fill(input); await page.locator('#run').click(); }
async function download(page,id) {
  const [file] = await Promise.all([page.waitForEvent('download'),page.locator(id).click()]);
  return readFileSync(await file.path(),'utf8');
}
for (const ref of references) test(`native/WASM report parity: ${ref.name}`,async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await observe(page);await ready(page);await submit(page,ref.input);
  await expect.poll(()=>page.evaluate(()=>window.lastInspection)).toBe(ref.canonical);
  const result=JSON.parse(ref.canonical);
  if (result.ok) {
    await expect(page.locator('#counts')).toHaveText(`${result.document.sections.length} sections · ${result.document.refs.length} references`);
    await expect(page.locator('#identity')).toContainText(result.document.source);
    if (result.canonical) expect(await download(page,'#download')).toBe(result.canonical);
    else { await expect(page.locator('#download')).toBeDisabled();await expect(page.locator('#unknown-warning')).toBeVisible(); }
    if (!result.document.sections.length) await expect(page.locator('#empty')).toBeVisible();
  } else { await expect(page.locator('#error')).toBeVisible(); await expect(page.locator('#results')).toBeHidden();await expect(page.locator('#download')).toBeDisabled(); }
  expect(await download(page,'#original-download')).toBe(ref.input.replace(/\r\n?/g,'\n'));
  expect(errors).toEqual([]);
});
test('ordered section navigation preserves identity, text and metadata',async ({page})=>{
  await ready(page);await page.locator('#section').selectOption('1');
  await expect(page.locator('#section-identity')).toContainText('ID: notes');await expect(page.locator('#section-identity')).toContainText('Source line: 5');
  await expect(page.locator('#section-text')).toContainText('Source identity and references');await expect(page.locator('#section-metadata')).toContainText('provenance');
  const input=JSON.parse(sample);input.sections[0].id='same';input.sections[1].id='same';await submit(page,JSON.stringify(input));
  await expect(page.locator('#status')).toContainText('Inspection complete');await page.locator('#section').selectOption('1');await expect(page.locator('#section-text')).toContainText('## Notes');
});
test('edits and invalid JSON clear results and compact export',async ({page})=>{
  await ready(page);await page.locator('#record').fill('{');await expect(page.locator('#results')).toBeHidden();await expect(page.locator('#download')).toBeDisabled();
  await page.locator('#run').click();await expect(page.locator('#error')).toBeVisible();await expect(page.locator('#diagnostic')).toContainText('column');
  await page.locator('#reset').click();await expect(page.locator('#record')).toBeFocused();await page.locator('#run').click();await expect(page.locator('#counts')).toHaveText('2 sections · 2 references');
});
test('local Unicode file input is inert and references are never fetched',async ({page})=>{
  const external=[];page.on('request',r=>{if(r.url().includes('invalid.example'))external.push(r.url());});await ready(page);
  const input=JSON.parse(sample);input.title='Café 🌿';input.refs=['https://invalid.example/private','javascript:alert(1)'];input.sections[0].text='<img src="https://invalid.example/x" onerror="alert(1)">';
  await page.locator('#file').setInputFiles({name:'own.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(input))});await page.locator('#run').click();
  await expect(page.locator('#title')).toHaveText('Café 🌿');await expect(page.locator('#section-text')).toContainText('<img');await expect(page.locator('#results img')).toHaveCount(0);await expect(page.locator('#refs a')).toHaveCount(0);
  expect(JSON.parse(await download(page,'#download'))).toEqual(input);expect(external).toEqual([]);
  await page.setViewportSize({width:390,height:844});input.title='x'.repeat(4000);input.source='s'.repeat(2000);await submit(page,JSON.stringify(input));
  await expect(page.locator('#title')).toHaveText(input.title);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('original file download preserves CRLF and extensions until edited',async ({page})=>{
  await ready(page);const input=JSON.parse(sample);input.extension={origin:'Café 🌿'};const text=JSON.stringify(input,null,2).replace(/\n/g,'\r\n');
  await page.locator('#file').setInputFiles({name:'original.json',mimeType:'application/json',buffer:Buffer.from(text)});
  expect(await download(page,'#original-download')).toBe(text);await page.locator('#run').click();await expect(page.locator('#unknown-warning')).toBeVisible();await expect(page.locator('#download')).toBeDisabled();
  await page.locator('#file').setInputFiles({name:'unreadable.json',mimeType:'application/json',buffer:Buffer.from([255])});
  await expect(page.locator('#error-message')).toContainText('valid UTF-8');expect(await download(page,'#original-download')).toBe(text);
  const edited=JSON.stringify({...input,title:'Edited'});await page.locator('#record').fill(edited);expect(await download(page,'#original-download')).toBe(edited);
});
test('oversized and invalid UTF-8 files preserve the previous draft',async ({page})=>{
  await ready(page);const before=await page.locator('#record').inputValue();
  await page.locator('#file').setInputFiles({name:'large.json',mimeType:'application/json',buffer:Buffer.alloc(1048577,32)});await expect(page.locator('#error-message')).toContainText('1 MiB');await expect(page.locator('#record')).toHaveValue(before);
  await page.locator('#file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from([255])});await expect(page.locator('#error-message')).toContainText('valid UTF-8');await expect(page.locator('#record')).toHaveValue(before);await expect(page.locator('#run')).toBeEnabled();
});
test('Restore example cancels a held file read and ignores its late delivery',async ({page})=>{
  await page.addInitScript(()=>{const original=File.prototype.arrayBuffer;File.prototype.arrayBuffer=function(){if(this.name==='held.json')return new Promise(resolve=>{window.releaseFile=()=>resolve(new TextEncoder().encode('late bad file').buffer);});return original.call(this);};});
  await ready(page);await page.locator('#file').setInputFiles({name:'held.json',mimeType:'application/json',buffer:Buffer.from('{}')});await expect(page.locator('#run')).toBeDisabled();
  await page.locator('#reset').click();await expect(page.locator('#run')).toBeEnabled();await page.evaluate(()=>window.releaseFile());await expect(page.locator('#record')).toHaveValue(sample.replace(/\r\n?/g,'\n'));
});
test('source, compiled artifact and clean provenance are independent routes',async ({page})=>{
  await ready(page);const provenance=await (await page.request.get('./provenance.json')).json();
  const core=await (await page.request.get('./source/src/lib.rs')).body();
  const expected=provenance.dirty?readFileSync('src/lib.rs'):execFileSync('git',['show',`${provenance.commit}:src/lib.rs`]);expect(core.equals(expected)).toBe(true);
  const wasm=await page.request.get('./pkg/mdport_web_bg.wasm');expect(wasm.ok()).toBe(true);expect(wasm.headers()['content-type']).toContain('application/wasm');expect((await wasm.body()).subarray(0,4).equals(Buffer.from([0,97,115,109]))).toBe(true);
  for(const route of ['source.zip','BUILD.md','LICENSE','THIRD-PARTY-NOTICES.txt','rust/COPYRIGHT-library.html','example-record.json'])expect((await page.request.get('./'+route)).ok()).toBe(true);
});
test('WASM failure retains input and original/source downloads; Retry recovers',async ({page})=>{
  await page.route('**/pkg/*.wasm',route=>route.abort());await page.goto('./');await expect(page.locator('#retry')).toBeVisible();
  const draft=sample.replace('Field Guide','My draft');await page.locator('#record').fill(draft);expect(await download(page,'#original-download')).toBe(draft.replace(/\r\n?/g,'\n'));
  expect((await page.request.get('./source.zip')).ok()).toBe(true);await page.unroute('**/pkg/*.wasm');await page.locator('#retry').click();await expect(page.locator('#run')).toBeEnabled();await expect(page.locator('#record')).toHaveValue(draft.replace(/\r\n?/g,'\n'));await page.locator('#run').click();await expect(page.locator('#title')).toHaveText('My draft');
});
test('startup deadline survives edits and terminated-worker ready events',async ({page})=>{
  await observe(page);await page.clock.install();let intercepted=false;await page.route('**/pkg/*.wasm',()=>{intercepted=true;});await page.goto('./');await expect.poll(()=>intercepted).toBe(true);
  await page.locator('#record').fill(sample.replace('Field Guide','Retained draft'));await page.clock.fastForward(13000);await expect(page.locator('#retry')).toBeVisible();
  await page.evaluate(()=>window.testWorker.onmessage({data:{type:'ready'}}));await expect(page.locator('#run')).toBeDisabled();await expect(page.locator('#status')).toContainText('unavailable');
  await page.unroute('**/pkg/*.wasm');await page.locator('#retry').click();await expect(page.locator('#run')).toBeEnabled();await page.locator('#run').click();await expect(page.locator('#title')).toHaveText('Retained draft');
});
test('compute deadline survives edits and Retry preserves the draft',async ({page})=>{
  await page.clock.install();await page.route('**/worker.js',route=>route.fulfill({contentType:'text/javascript',body:workerSource+'\nconst actual=self.onmessage;let seen=0;self.onmessage=e=>{if(++seen===1)actual(e);};'}));
  await ready(page);await submit(page,sample.replace('Field Guide','Stalled'));await expect(page.locator('#status')).toContainText('Inspecting');await page.locator('#record').fill(sample.replace('Field Guide','Keep this'));
  await page.clock.fastForward(11000);await expect(page.locator('#retry')).toBeVisible();await expect(page.locator('#error-message')).toContainText('deadline');await expect(page.locator('#download')).toBeDisabled();
  await page.unroute('**/worker.js');await page.locator('#retry').click();await expect(page.locator('#run')).toBeEnabled();await page.locator('#run').click();await expect(page.locator('#title')).toHaveText('Keep this');
});
test('held real results cannot repopulate edited drafts',async ({page})=>{
  await observe(page);await page.route('**/worker.js',route=>route.fulfill({contentType:'text/javascript',body:workerSource+'\nconst post=self.postMessage.bind(self);let count=0,pending;self.postMessage=data=>{if(data.type==="result"&&++count>1)pending=data;else post(data);};const handler=self.onmessage;self.onmessage=e=>{if(e.data.type==="release"){post(pending);pending=null;}else handler(e);};'}));
  await ready(page);await submit(page,sample.replace('Field Guide','Old result'));await expect(page.locator('#status')).toContainText('Inspecting');await page.locator('#record').fill(sample.replace('Field Guide','New draft'));
  await page.evaluate(()=>window.testWorker.postMessage({type:'release'}));await expect(page.locator('#run')).toBeEnabled();await expect(page.locator('#results')).toBeHidden();await expect(page.locator('#download')).toBeDisabled();
});
for(const [name,viewport] of [['desktop',{width:1365,height:900}],['mobile',{width:390,height:844}]])test(`keyboard, layout and visual sample: ${name}`,async ({page,browser})=>{
  await page.setViewportSize(viewport);const start=Date.now();await ready(page);const readiness=Date.now()-start;
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('#section').focus();await page.keyboard.press('End');await expect(page.locator('#section-text')).toContainText('## Notes');
  await page.locator('#reset').focus();await page.keyboard.press('Enter');await expect(page.locator('#record')).toBeFocused();await page.locator('#run').focus();await page.keyboard.press('Enter');await expect(page.locator('#status')).toContainText('Inspection complete');
  mkdirSync('.cache/review',{recursive:true});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`.cache/review/${name}-entry.png`});await page.locator('#results').screenshot({path:`.cache/review/${name}-results.png`});
  writeFileSync(`.cache/review/${name}-observation.json`,JSON.stringify({browser:browser.version(),viewport,readiness_ms:readiness,fixture_sections:2,scope:'One environment-specific startup including worker/network/UI; not Rust CPU or large-corpus benchmark'},null,2));
});
test.describe('without JavaScript',()=>{test.use({javaScriptEnabled:false});test('example and source routes remain available',async ({page})=>{
  await page.goto('./');await expect(page.locator('#static-help')).toBeVisible();await expect(page.locator('#record')).toContainText('Field Guide');await expect(page.locator('#run')).toBeDisabled();for(const route of ['source.zip','BUILD.md','LICENSE'])expect((await page.request.get('./'+route)).ok()).toBe(true);
});});
