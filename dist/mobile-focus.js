// Dismiss the editing keyboard before non-text actions, without guessing its visibility.
const editable=el=>el?.matches?.('textarea,input:not([type=checkbox]):not([type=range]):not([type=file]),[contenteditable=true]');
const button=document.createElement('button');button.type='button';button.id='dismiss-keyboard';button.textContent='Concluir digitação';button.hidden=true;document.body.append(button);
button.onclick=()=>{document.activeElement?.blur?.();button.hidden=true;};
document.addEventListener('pointerdown',e=>{if(e.target.closest('button,svg,.file-button')&&editable(document.activeElement))document.activeElement.blur();},true);
document.addEventListener('focusin',()=>{const active=document.activeElement;if(editable(active))(active.closest('dialog')||document.body).append(button);button.hidden=!editable(active);});
document.addEventListener('focusout',()=>queueMicrotask(()=>{button.hidden=!editable(document.activeElement);}));
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('#hold-form input:not([type=checkbox])')){e.preventDefault();e.target.blur();}},true);
