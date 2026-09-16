let ready;
function vision(){
 if(!ready)ready=new Promise((resolve,reject)=>{
  try{importScripts('./vendor/opencv.js');const done=()=>resolve({cv:self.cv});if(self.cv?.Mat)done();else if(self.cv)self.cv.onRuntimeInitialized=done;else reject(Error('Motor de contornos indisponível.'));}catch(error){reject(error);}
 });
 return ready;
}
self.onmessage=async({data})=>{
 try{
  self.postMessage({progress:'Preparando contornos…'});
  const [{cv},{preciseDetection}]=await Promise.all([vision(),import('./precise-detection.js')]);
  const result=preciseDetection(cv,data,(current,total)=>self.postMessage({progress:`Refinando agarras: ${current} / ${total}`}));
  self.postMessage({result});
 }catch(error){self.postMessage({error:typeof error==='number'?'Não foi possível refinar esta imagem. Tente uma região menor.':error.message});}
};
