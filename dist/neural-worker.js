let loaded;
async function engines(){
 if(!loaded)loaded=(async()=>{
  importScripts('./vendor/opencv.js','./vendor/ort/ort.wasm.min.js');
  if(!self.cv?.Mat)await new Promise(resolve=>self.cv.onRuntimeInitialized=resolve);
  self.ort.env.wasm.numThreads=1;self.ort.env.wasm.wasmPaths=new URL('./vendor/ort/',self.location.href).href;
  const session=await self.ort.InferenceSession.create(new URL('./models/holds-640.onnx',self.location.href).href,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
  return {cv:self.cv,ort:self.ort,session};
 })();
 return loaded;
}
self.onmessage=async({data})=>{
 try{
  self.postMessage({progress:'Abrindo detector de agarras…'});
  const [{cv,ort,session},{neuralDetect},{refineHold}]=await Promise.all([engines(),import('./neural-detection.js'),import('./precise-detection.js')]);
  const proposals=await neuralDetect(ort,session,data,text=>self.postMessage({progress:text}));
  let refined=0;const start=Date.now();
  const candidates=proposals.map((c,i)=>{
   if(i%10===0)self.postMessage({progress:`Ajustando bordas: ${i+1} / ${proposals.length}`});
   let next=c;
   if(Date.now()-start<25000)try{next=refineHold(cv,data,c);}catch{next={...c,refined:false};}
   if(next.refined)refined++;
   return {...next,confidence:next.refined&&c.score>=.45?'strong':'review'};
  });
  self.postMessage({result:{candidates,refined,pending:candidates.length-refined,truncated:candidates.length>=1000,engine:'neural'}});
 }catch(error){self.postMessage({error:'Não foi possível executar o detector neste aparelho. '+(typeof error==='number'?'':error.message)});}
};
