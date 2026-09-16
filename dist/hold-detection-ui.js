import {withoutExisting} from './hold-detection.js';
import {insideContour} from './precise-detection.js';

export function createHoldDetection({onAccept}){
 const dialog=document.createElement('dialog');dialog.id='detection-dialog';dialog.className='wide-dialog detection-v8';dialog.setAttribute('aria-labelledby','detection-title');
 dialog.innerHTML=`<div class="detection-heading"><div><div class="eyebrow">LEITURA DA FACE</div><h2 id="detection-title">Revise as agarras</h2></div><button id="detection-cancel" type="button">← Voltar</button></div><p id="detection-status" role="status">Abrindo foto…</p><div class="detection-controls"><label>Leitura<select id="detection-preset"><option value="careful">Menos marcações</option><option value="balanced" selected>Equilibrada</option><option value="detailed">Incluir agarras pequenas</option></select></label><button id="detection-run" type="button">Analisar novamente</button><button id="detection-region" type="button">Ler só uma região</button><button id="detection-full" type="button" hidden>Face inteira</button><button id="detection-stop" type="button" hidden>Parar leitura</button></div><p id="detection-hint" class="help">A leitura começa sozinha. Depois, toque no contorno para incluir ou excluir.</p><div class="detection-stage"><canvas id="detection-canvas" role="img" aria-label="Foto da face e contornos das agarras"></canvas></div><div class="detection-controls detection-review"><label class="zoom-label">Zoom<input id="detection-zoom" type="range" min="100" max="400" step="25" value="150"></label><label class="check"><input id="detection-uncertain" type="checkbox">Mostrar incertas <span id="detection-uncertain-count"></span></label><button id="detection-none" type="button">Desmarcar todas</button></div><details class="advanced"><summary>Alternativa por cores</summary><p class="help">Se o detector não funcionar neste aparelho, use a leitura por cores: marque até 12 regiões da parede sem agarras e analise novamente.</p><div class="detection-controls"><button id="detection-sample" type="button">Marcar cores</button><button id="detection-reset" type="button">Voltar ao automático</button></div><div id="detection-colors"></div><label>Tolerância ao fundo<input id="detection-tolerance" type="range" min="8" max="100" value="35"></label></details><div class="detection-bottom"><span id="detection-count" role="status">0 selecionadas</span><button id="detection-accept" type="button" class="primary" disabled>Adicionar agarras</button></div><p class="help">Laranja = selecionada. Tracejado = descartada ou incerta. Confira as bordas; Ajustar contorno permite corrigir depois.</p>`;
 document.body.append(dialog);
 const $=s=>dialog.querySelector(s),canvas=$('#detection-canvas'),ctx=canvas.getContext('2d');
 let source,pixels,face,existing=[],candidates=[],samples=[],region=null,firstCorner=null,mode='review',worker,timer,token=0,decoding=false,saving=false;
 const say=t=>$('#detection-status').textContent=t;
 const visible=()=>candidates.filter(c=>c.confidence==='strong'||c.selected||$('#detection-uncertain').checked);
 function stop(){token++;worker?.terminate();worker=null;clearTimeout(timer);}
 function controls(){
  const busy=!!worker||decoding||saving;
  for(const id of ['#detection-run','#detection-preset','#detection-region','#detection-full','#detection-sample','#detection-reset','#detection-tolerance'])$(id).disabled=decoding||saving;
  $('#detection-stop').hidden=!worker;$('#detection-full').hidden=!region;
  $('#detection-accept').disabled=busy||!candidates.some(c=>c.selected);
  $('#detection-count').textContent='Selecionadas: '+candidates.filter(c=>c.selected).length;
  $('#detection-uncertain-count').textContent=`(${candidates.filter(c=>c.confidence!=='strong').length})`;
  $('#detection-hint').textContent=mode==='region'?(firstCorner?'Toque no canto oposto da região.':'Toque no primeiro canto da região da foto.'):mode==='sample'?'Toque na parede sem agarras; depois, Analisar novamente.':'Toque dentro do contorno para incluir ou excluir. Agarras incertas ficam ocultas até você pedir.';
 }
 function path(c){ctx.beginPath();if(c.contour?.length){c.contour.forEach(([x,y],i)=>i?ctx.lineTo(x*canvas.width,y*canvas.height):ctx.moveTo(x*canvas.width,y*canvas.height));ctx.closePath();}else ctx.arc(c.x*canvas.width,c.y*canvas.height,c.radius*canvas.width,0,Math.PI*2);}
 function draw(){
  if(!source)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0);
  ctx.lineWidth=Math.max(1.4,canvas.width/550);
  for(const c of existing){ctx.strokeStyle='#aaa';ctx.setLineDash([3,5]);path(c);ctx.stroke();}
  for(const c of visible()){ctx.setLineDash(c.selected?[]:[4,5]);ctx.strokeStyle=c.selected?'#ff9c4a':'#d9c99c';path(c);if(c.selected){ctx.fillStyle='#f58a3614';ctx.fill();}ctx.stroke();}
  ctx.setLineDash([]);
  if(region){ctx.strokeStyle='#fff';ctx.strokeRect(region.x,region.y,region.w,region.h);}
  if(firstCorner){ctx.fillStyle='#fff';ctx.fillRect(firstCorner.x-4,firstCorner.y-4,8,8);}
  if(mode==='sample')for(const s of samples){ctx.fillStyle='#fff';ctx.fillRect(s.x-3,s.y-3,6,6);}
 }
 function swatches(){const host=$('#detection-colors');host.replaceChildren();samples.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=`${i+1} ×`;b.style.borderColor=`rgb(${s.rgb.join(',')})`;b.setAttribute('aria-label',`Remover cor ${i+1}`);b.onclick=()=>{samples.splice(i,1);invalidate();swatches();};host.append(b);});}
 function invalidate(){stop();candidates=[];controls();draw();say('Ajuste alterado. Analise novamente.');}
 function run(){
  if(!pixels||decoding||saving)return;stop();candidates=[];mode='review';firstCorner=null;const current=token;
  const r=region||{x:0,y:0,w:canvas.width,h:canvas.height};
  const crop=source.getContext('2d').getImageData(r.x,r.y,r.w,r.h);
  try{worker=new Worker(samples.length?'./hold-detection-worker.js':'./neural-worker.js');}catch{say('Não foi possível iniciar. Tente novamente ou use a marcação manual.');controls();return;}
  say('Localizando agarras…');controls();draw();
  const fail=message=>{if(current!==token)return;stop();say(message);controls();};
  const armTimeout=()=>{clearTimeout(timer);timer=setTimeout(()=>fail('A leitura demorou demais. Use Ler só uma região.'),90000);};armTimeout();
  worker.onerror=()=>fail('Falha na leitura. Confira se todos os arquivos foram publicados.');
  worker.onmessage=({data})=>{
   if(current!==token||!dialog.open)return;
   if(data.progress){armTimeout();say(data.progress);return;}
   if(data.error){fail(data.error);return;}
   stop();const mapped=data.result.candidates.map(c=>({...c,x:(c.x*r.w+r.x)/canvas.width,y:(c.y*r.h+r.y)/canvas.height,radius:c.radius*r.w/canvas.width,contour:c.contour.map(([x,y])=>[(x*r.w+r.x)/canvas.width,(y*r.h+r.y)/canvas.height])}));
   candidates=withoutExisting(mapped,existing,canvas.width/canvas.height).map(c=>({...c,radius:Math.max(.008,Math.min(.1,c.radius)),selected:c.confidence==='strong'}));
   const selected=candidates.filter(c=>c.selected).length;
   say(candidates.length?`${selected} selecionadas para adicionar · ${candidates.length-selected} para conferir.${data.result.pending?' As caixas tracejadas ainda não são contornos da agarra.':''}${data.result.truncated?' Há mais regiões do que o limite; leia uma parte menor.':''}`:'Nenhuma sugestão nova. Tente outra leitura, uma região menor ou marque cores do fundo.');controls();draw();
  };
  worker.postMessage({data:crop.data,width:r.w,height:r.h,automatic:!samples.length,samples:samples.map(s=>s.rgb),preset:$('#detection-preset').value,tolerance:Number($('#detection-tolerance').value)},[crop.data.buffer]);
 }
 canvas.onclick=e=>{
  if(!pixels||decoding||saving)return;
  const rect=canvas.getBoundingClientRect(),x=Math.max(0,Math.min(canvas.width-1,(e.clientX-rect.left)*canvas.width/rect.width)),y=Math.max(0,Math.min(canvas.height-1,(e.clientY-rect.top)*canvas.height/rect.height));
  if(mode==='region'){
   if(!firstCorner){firstCorner={x,y};draw();controls();return;}
   const left=Math.floor(Math.min(x,firstCorner.x)),top=Math.floor(Math.min(y,firstCorner.y)),w=Math.ceil(Math.abs(x-firstCorner.x)),h=Math.ceil(Math.abs(y-firstCorner.y));
   if(w<32||h<32){say('Escolha uma região maior.');return;}
   region={x:left,y:top,w:Math.min(w,canvas.width-left),h:Math.min(h,canvas.height-top)};run();return;
  }
  if(mode==='sample'){
   if(samples.length>=12){say('Remova uma cor antes de adicionar outra.');return;}
   const channels=[[],[],[]];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const px=Math.round(x)+dx,py=Math.round(y)+dy;if(px<0||py<0||px>=canvas.width||py>=canvas.height)continue;channels.forEach((c,k)=>c.push(pixels.data[(py*canvas.width+px)*4+k]));}
   samples.push({x,y,rgb:channels.map(v=>v.sort((a,b)=>a-b)[Math.floor(v.length/2)])});invalidate();swatches();return;
  }
  const target=visible().filter(c=>c.contour?.length&&insideContour(x/canvas.width,y/canvas.height,c.contour)).sort((a,b)=>a.area-b.area)[0];
  if(target){target.selected=!target.selected;controls();draw();}
 };
 $('#detection-run').onclick=run;$('#detection-preset').onchange=run;
 $('#detection-region').onclick=()=>{stop();mode='region';firstCorner=null;controls();say('Selecione uma parte do muro.');draw();};
 $('#detection-full').onclick=()=>{region=null;run();};
 $('#detection-stop').onclick=()=>{stop();say('Leitura interrompida. Você pode analisar uma região menor.');controls();};
 $('#detection-sample').onclick=()=>{stop();mode='sample';controls();draw();};
 $('#detection-reset').onclick=()=>{samples=[];swatches();run();};$('#detection-tolerance').oninput=invalidate;
 $('#detection-uncertain').onchange=draw;$('#detection-none').onclick=()=>{candidates.forEach(c=>c.selected=false);controls();draw();};
 function fitPhoto(zoom=150){canvas.style.width=`min(${zoom}%, ${46*Number(zoom)/100*canvas.width/canvas.height}dvh)`;}
 $('#detection-zoom').oninput=e=>fitPhoto(e.target.value);
 $('#detection-cancel').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{stop();source=null;pixels=null;candidates=[];});
 $('#detection-accept').onclick=async()=>{
  if(saving||worker||decoding)return;const chosen=candidates.filter(c=>c.selected);if(!chosen.length)return;
  saving=true;controls();try{await onAccept(face.id,chosen);dialog.close();}catch(error){say(error.message);}finally{saving=false;if(dialog.open)controls();}
 };
 return {async open(currentFace,holds){
  stop();face=currentFace;existing=structuredClone(holds);samples=[];candidates=[];region=null;firstCorner=null;mode='review';source=null;pixels=null;decoding=true;
  $('#detection-preset').value='balanced';$('#detection-tolerance').value=35;$('#detection-uncertain').checked=false;$('#detection-zoom').value=150;canvas.style.width='100%';swatches();ctx.clearRect(0,0,canvas.width,canvas.height);say('Abrindo foto…');controls();dialog.showModal();const current=token;
  try{const image=new Image();image.src=face.photo;await image.decode();if(current!==token||!dialog.open)return;
   const scale=Math.min(1,1000/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
   source=document.createElement('canvas');source.width=canvas.width;source.height=canvas.height;source.getContext('2d').drawImage(image,0,0,source.width,source.height);pixels=source.getContext('2d').getImageData(0,0,source.width,source.height);decoding=false;fitPhoto();run();
  }catch{if(current===token){decoding=false;say('Não foi possível abrir a foto. Volte e tente novamente.');controls();}}
 }};
}
