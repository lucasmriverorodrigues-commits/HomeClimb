const button=document.querySelector('#install-app');
const dialog=document.createElement('dialog');dialog.id='install-dialog';dialog.setAttribute('aria-labelledby','install-title');
dialog.innerHTML=`<h2 id="install-title">HomeClimb no celular</h2><p id="offline-status" role="status">Preparando uso sem internet…</p><button id="install-native" class="primary" type="button" hidden>Instalar aplicativo</button><p><b>Android:</b> no menu do Chrome, escolha Instalar aplicativo ou Adicionar à tela inicial.</p><p><b>iPhone:</b> abra no Safari, toque em Compartilhar e Adicionar à Tela de Início. Ative Abrir como App, se aparecer.</p><p class="help">O primeiro download inclui o detector de agarras e pode demorar. Abra com internet uma vez e aguarde “Pronto para usar sem internet”. Depois, use o ícone na tela inicial.</p><p class="help">As fotos e os boulders ficam no aparelho. Use Backup para protegê-los; limpar os dados do aplicativo pode apagar seu acervo. Se o acervo não aparecer ao instalar, importe seu backup.</p><p id="pwa-update" class="help" hidden>Atualização baixada. Salve seu trabalho e feche todas as janelas do HomeClimb; a nova versão abre no próximo uso.</p><div class="dialog-actions"><button id="offline-retry" type="button">Verificar download</button><button id="install-close" type="button">Fechar</button></div>`;
document.body.append(dialog);
const $=s=>dialog.querySelector(s);let deferred,registration,checking=false;
const say=text=>$('#offline-status').textContent=text;
button.onclick=()=>{dialog.showModal();checkOffline();};
$('#install-close').onclick=()=>dialog.close();
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;$('#install-native').hidden=false;});
window.addEventListener('appinstalled',()=>{deferred=null;$('#install-native').hidden=true;});
$('#install-native').onclick=async()=>{
  if(!deferred)return;const prompt=deferred;deferred=null;$('#install-native').hidden=true;
  try{await prompt.prompt();await prompt.userChoice;await navigator.storage?.persist?.();}catch{say('Use o menu do navegador para instalar.');}
};
async function checkOffline(){
  const worker=navigator.serviceWorker?.controller||registration?.active;
  if(!worker)return;
  const channel=new MessageChannel();let finished=false;
  const timer=setTimeout(()=>{if(!finished)say('Não foi possível confirmar o download. Conecte à internet e tente novamente.');channel.port1.close();},5000);
  channel.port1.onmessage=({data})=>{finished=true;clearTimeout(timer);channel.port1.close();const version=typeof data.version==='string'?data.version.replace('homeclimb-shell-',''):'';say((data.ready?'Pronto para usar sem internet.':'Download incompleto. Conecte à internet e toque em Verificar download.')+(version?' Versão em uso: '+version+'.':''));};
  worker.postMessage({type:'OFFLINE_STATUS'},[channel.port2]);
}
async function register(){
  if(checking)return;
  if(!window.isSecureContext||!('serviceWorker' in navigator)){say('Para instalar, abra o endereço HTTPS do HomeClimb no Chrome ou Safari.');return;}
  checking=true;
  try{
    registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
    const observe=()=>{const worker=registration.installing;if(!worker)return;
      worker.addEventListener('statechange',()=>{
        if(worker.state==='installed'){if(registration.active)$('#pwa-update').hidden=false;checkOffline();}
        if(worker.state==='activated')checkOffline();
        if(worker.state==='redundant')say('O download falhou. Confira a internet e tente novamente.');
      });
    };
    observe();registration.addEventListener('updatefound',observe);
    $('#pwa-update').hidden=!registration.waiting;
    await checkOffline();
  }catch{say('Não foi possível preparar o uso offline. Confira a conexão e os arquivos publicados.');}
  finally{checking=false;}
}
$('#offline-retry').onclick=async()=>{say('Verificando arquivos…');await register();try{await registration?.update();}catch{say('Sem conexão para baixar arquivos.');}await checkOffline();};
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('controllerchange',checkOffline);
register();
