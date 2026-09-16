export function editContour(face,hold){
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='wide-dialog';dialog.setAttribute('aria-label','Ajustar contorno');
  dialog.innerHTML='<h2>Ajustar contorno</h2><p>Toque ao redor da borda da agarra, em ordem. Use pelo menos 3 pontos.</p><label>Zoom <input id="contour-zoom" type="range" min="100" max="400" step="25" value="200"></label><div class="stage"><div class="photo-board"><img alt="Face do muro"><svg></svg></div></div><p id="contour-count" role="status"></p><div class="dialog-actions"><button id="contour-back">← Voltar</button><button id="contour-clear">Recomeçar</button><button id="contour-undo">Desfazer ponto</button><button id="contour-save" class="primary">Salvar contorno</button></div>';
  document.body.append(dialog);const $=s=>dialog.querySelector(s),svg=$('svg');let points=structuredClone(hold.contour||[]),result=null;
  $('img').src=face.photo;svg.setAttribute('viewBox',`0 0 1000 ${1000/face.aspect}`);
  function render(){svg.innerHTML=`<polygon points="${points.map(([x,y])=>`${x*1000},${y*1000/face.aspect}`).join(' ')}" fill="#f58a3633" stroke="#f58a36" stroke-width="2"/>${points.map(([x,y])=>`<circle cx="${x*1000}" cy="${y*1000/face.aspect}" r="3" fill="white"/>`).join('')}`;$('#contour-count').textContent=points.length+' pontos';$('#contour-save').disabled=points.length<3;$('#contour-undo').disabled=!points.length;}
  svg.onclick=e=>{if(points.length>=256)return;const r=svg.getBoundingClientRect();points.push([Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))]);render();};
  $('#contour-zoom').oninput=e=>{$('.photo-board').style.width=e.target.value+'%';};$('.photo-board').style.width='200%';
  $('#contour-clear').onclick=()=>{points=[];render();};$('#contour-undo').onclick=()=>{points.pop();render();};
  $('#contour-save').onclick=()=>{result=points;dialog.close();};$('#contour-back').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();resolve(result);},{once:true});render();dialog.showModal();
 });
}
