import init, { inspect } from './pkg/mdport_web.js';
try {
  await init({module_or_path:new URL('./pkg/mdport_web_bg.wasm',import.meta.url)});
  self.postMessage({type:'ready'});
} catch (error) { self.postMessage({type:'startup-error',message:String(error)}); }
self.onmessage = ({data}) => {
  if (data.type !== 'inspect') return;
  try { self.postMessage({type:'result',id:data.id,canonical:inspect(data.request)}); }
  catch (error) { self.postMessage({type:'compute-error',id:data.id,message:String(error)}); }
};
