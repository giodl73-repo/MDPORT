const $ = id => document.getElementById(id);
$('static-help').hidden = true;
const initial = $('record').defaultValue;
let worker, generation = 0, revision = 0, serial = 0, active = null;
let ready = false, busy = false, reading = false, startupTimer, computeTimer;
let result = null, fileSerial = 0, originalFileText = null;
function controls() {
  $('run').disabled = !ready || busy || reading;
  $('download').disabled = !result?.canonical;
  $('original-download').disabled = !$('record').value && originalFileText === null;
}
function clearResults() {
  result = null; $('results').hidden = true;
  for (const id of ['title','identity','section-text','metadata','section-metadata','refs','decoded','section-identity','sizes','counts']) $(id).textContent = '';
  $('section').replaceChildren(); controls();
}
function diagnostic(detail) {
  clearResults(); $('error').hidden = false;
  $('error-message').textContent = detail.message || 'The record could not be inspected.';
  $('diagnostic').textContent = JSON.stringify(detail, null, 2);
}
function engineError(message, detail = '') {
  generation++; ready = busy = false; active = null;
  clearTimeout(startupTimer); clearTimeout(computeTimer); worker?.terminate(); worker = null;
  diagnostic({ kind:'engine', message, ...(detail ? {detail} : {}) });
  $('status').textContent = 'Engine unavailable. Your draft is retained; source and original input downloads still work.';
  $('retry').hidden = false; controls();
}
function invalidate() {
  originalFileText = null;
  revision++; clearResults(); $('error').hidden = true;
  if (ready) $('status').textContent = busy ? 'Draft changed. Waiting for the previous inspection.' : 'Draft changed. Inspect again to refresh results.';
  // Startup and compute deadlines survive edits.
}
function showSection() {
  if (!result) return;
  const section = result.document.sections[Number($('section').value)];
  $('empty').hidden = result.document.sections.length !== 0;
  $('section').disabled = !section;
  $('section-text').textContent = section?.text || '';
  $('section-identity').textContent = section ? `ID: ${section.id} · Path: ${JSON.stringify(section.path)} · Level: ${section.level} · Source line: ${section.line}` : '';
  $('section-metadata').textContent = section ? JSON.stringify(section.metadata,null,2) : 'No section selected.';
}
function run() {
  if (!ready || busy || reading) return;
  clearResults(); $('error').hidden = true;
  const input = $('record').value;
  if (input.length > 1048576 || new TextEncoder().encode(input).length > 1048576) {
    diagnostic({kind:'limit',message:'Record exceeds the inspector’s 1 MiB UTF-8 limit.'});
    $('status').textContent = 'Reduce the input and inspect again.'; return;
  }
  busy = true; active = {id:++serial, revision};
  $('status').textContent = 'Inspecting in Rust…'; controls();
  const id = active.id, epoch = generation;
  computeTimer = setTimeout(() => { if (generation === epoch && active?.id === id) engineError('Inspection exceeded its deadline. Retry the engine, then inspect your retained draft.'); },10000);
  try { worker.postMessage({type:'inspect',id,request:input}); }
  catch (error) { engineError('The worker could not accept the record.',String(error)); }
}
function start() {
  generation++; const epoch = generation;
  worker?.terminate(); clearTimeout(startupTimer); clearTimeout(computeTimer);
  ready = busy = false; active = null; clearResults(); $('error').hidden = true; $('retry').hidden = true;
  $('status').textContent = 'Loading Rust engine…';
  startupTimer = setTimeout(() => { if (epoch === generation && !ready) engineError('The Rust engine did not start before its deadline. Retry to load it again.'); },12000);
  try { worker = new Worker(new URL('./worker.js',import.meta.url),{type:'module'}); }
  catch (error) { engineError('The browser could not start the Rust worker.',String(error)); return; }
  worker.onerror = event => { event.preventDefault(); if (epoch === generation) engineError('The Rust worker failed. Retry with your current draft.',event.message); };
  worker.onmessage = ({data}) => {
    if (epoch !== generation) return;
    if (data.type === 'startup-error') { engineError('The Rust engine could not be downloaded or initialized.',data.message); return; }
    if (data.type === 'ready') {
      clearTimeout(startupTimer); ready = true; $('status').textContent = 'Rust engine ready. Inspect your record.';
      controls(); if (revision === 0) run(); return;
    }
    if (!active || data.id !== active.id) return;
    clearTimeout(computeTimer); const submitted = active.revision; busy = false; active = null;
    if (data.type === 'compute-error') { engineError('The Rust worker could not finish this inspection.',data.message); return; }
    if (submitted !== revision) { $('status').textContent = 'Draft changed. Inspect again to refresh results.'; controls(); return; }
    let response;
    try { response = JSON.parse(data.canonical); } catch { engineError('The Rust worker returned an unreadable response.'); return; }
    if (!response.ok) { diagnostic(response.diagnostic); $('status').textContent = 'Fix the record and inspect again.'; controls(); return; }
    result = response; const doc = response.document;
    $('results').hidden = false; $('title').textContent = doc.title;
    $('counts').textContent = `${doc.sections.length} sections · ${doc.refs.length} references`;
    $('identity').textContent = `Source: ${doc.source} · Kind: ${doc.kind} · Format: ${doc.format} · Schema: ${doc.schema}`;
    $('metadata').textContent = JSON.stringify(doc.metadata,null,2); $('refs').textContent = JSON.stringify(doc.refs,null,2);
    $('decoded').textContent = JSON.stringify(doc,null,2);
    $('unknown-warning').hidden = !response.unknown_fields.length;
    $('unknown-warning').textContent = `Unknown extension fields: ${response.unknown_fields.join(', ')}. Compact export is disabled because native serialization would drop them. Download original input to retain all fields.`;
    for (const [i,section] of doc.sections.entries()) {
      const option = document.createElement('option'); option.value = String(i); option.textContent = `${i+1}. ${section.path.join(' / ') || section.id}`; $('section').append(option);
    }
    showSection();
    $('sizes').textContent = `Input: ${response.input_bytes.toLocaleString()} UTF-8 bytes.${response.canonical ? ` Native compact export: ${response.canonical_bytes.toLocaleString()} bytes.` : ' Compact export unavailable for this record.'}`;
    $('status').textContent = 'Inspection complete. Results reflect the current input.'; controls();
  };
}
function download(name,text) {
  const url = URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
}
$('inspect-form').addEventListener('submit',event => {event.preventDefault(); run();});
$('record').addEventListener('input',invalidate);
$('section').addEventListener('change',showSection);
$('reset').addEventListener('click',() => { fileSerial++; reading = false; $('file').value = ''; $('record').value = initial; invalidate(); $('record').focus(); });
$('retry').addEventListener('click',start);
$('download').addEventListener('click',() => { if (result?.canonical) download('record.mdport.json',result.canonical); });
$('original-download').addEventListener('click',() => download('original-input.json',originalFileText ?? $('record').value));
$('file').addEventListener('change',async () => {
  const file = $('file').files[0]; if (!file) return;
  invalidate(); const token = ++fileSerial, atRevision = revision; reading = false;
  if (file.size > 1048576) { diagnostic({kind:'file',message:'Choose a JSON file no larger than 1 MiB.'}); $('file').value = ''; return; }
  reading = true; controls();
  try {
    const text = new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(await file.arrayBuffer());
    if (token === fileSerial && atRevision === revision) { $('record').value = text; invalidate(); originalFileText = text; }
  } catch { if (token === fileSerial) diagnostic({kind:'file',message:'The local file could not be read as valid UTF-8. Your draft is retained.'}); }
  finally { if (token === fileSerial) {reading = false; $('file').value = ''; controls();} }
});
start();
