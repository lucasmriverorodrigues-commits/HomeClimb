// Bump this version whenever a shipped asset changes. Updates activate after
// all windows of the previous version close, preserving open editing sessions.
const CACHE='homeclimb-shell-v0.20';
const ASSETS=['./rock-matching.js','./rock-comparison.js','./hold-direction.js','./direction-picker.js','./starting-supports.js','./contact-transition.js','./route-refinement.js','./generation-config.js','./movement-model.js','./beta-search.js','./boulder-grader.js','./support-proposal.js','./on-rock-worker.js','./locations.js','./mobile-focus.js','./name-dialog.js','./rock-scale.js','./on-rock-ui.js','./route-face.js','./classification.js','./on-rock.js','./codigo.html','./LICENSE.txt','./models/LICENSE.txt','./vendor/ort/LICENSE.txt','./','./index.html','./styles.css','./app.js','./contour-editor.js','./geometry.js','./core.js','./storage.js','./camera.js','./tracking.js','./generator.js','./generator-worker.js','./help.js','./neural-detection.js','./neural-worker.js','./models/holds-640.onnx','./vendor/ort/ort.wasm.min.js','./vendor/ort/ort-wasm-simd-threaded.mjs','./vendor/ort/ort-wasm-simd-threaded.wasm','./precise-detection.js','./hold-detection.js','./hold-detection-ui.js','./hold-detection-worker.js','./pwa.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./vendor/opencv.js'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  try{await cache.addAll(ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})));}
  catch(error){await caches.delete(CACHE);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith('homeclimb-shell-')&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
  if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(request.mode==='navigate')return await cache.match(request,{ignoreSearch:true})||await cache.match(new URL('./index.html',scope).href)||fetch(request);
    // Serve one coherent release; never mix online modules with old cached HTML.
    const cached=await cache.match(request,{ignoreSearch:true});
    return cached||fetch(request);
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type!=='OFFLINE_STATUS')return;
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    const entries=await Promise.all(ASSETS.map(path=>cache.match(new URL(path,self.registration.scope).href)));
    event.ports[0]?.postMessage({ready:entries.every(Boolean),version:CACHE});
  })());
});

