import {directionKnown} from './hold-direction.js';
export function mountDirectionPicker(host,hold,onChange){
 const known=directionKnown(hold),angles=[315,0,45,270,null,90,225,180,135];
 const names={0:'↑ Invertida',45:'↗',90:'→ Direita',135:'↘',180:'↓ Para baixo',225:'↙',270:'← Esquerda',315:'↖'};
 host.innerHTML=`<fieldset class="direction-picker"><legend>Para onde você puxa?</legend><p class="help">A seta mostra a força da mão sobre a agarra, vista na foto.</p><input type="hidden" name="directionKnown" value="${known}"><div class="direction-grid">${angles.map(a=>`<button type="button" data-angle="${a??''}" aria-label="${a===null?'Direção não informada':names[a]+' '+a+' graus'}">${a===null?'Não sei':names[a]}</button>`).join('')}</div><label>Ajuste fino <output data-degrees></output><input name="direction" type="range" min="0" max="359" step="1" value="${hold.direction%360}" style="width:100%"></label><label>Uso da puxada<select name="directionTolerance"><option value="60">Direcional — só perto da seta</option><option value="100">Ampla — aceita diagonais</option><option value="180">Livre — vários lados</option></select></label></fieldset>`;
 const range=host.querySelector('[name=direction]'),flag=host.querySelector('[name=directionKnown]'),tolerance=host.querySelector('[name=directionTolerance]');
 tolerance.value=String(hold.directionTolerance??100);
 function refresh(){host.querySelector('[data-degrees]').textContent=flag.value==='true'?range.value+'°':'Não informada';for(const b of host.querySelectorAll('[data-angle]')){const active=b.dataset.angle===''?flag.value!=='true':flag.value==='true'&&Number(b.dataset.angle)===Number(range.value);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}}
 for(const b of host.querySelectorAll('[data-angle]'))b.onclick=()=>{flag.value=String(b.dataset.angle!=='');if(b.dataset.angle!=='')range.value=b.dataset.angle;refresh();onChange();};
 range.oninput=()=>{flag.value='true';refresh();};
 range.onchange=e=>{e.stopPropagation();onChange();};tolerance.onchange=e=>{e.stopPropagation();if(tolerance.value==='180')flag.value='true';refresh();onChange();};refresh();
}
