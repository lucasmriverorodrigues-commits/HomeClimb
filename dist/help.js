const steps = [
  ['Organize por local', 'Use + Local para criar Casa do Rogério, por exemplo. Selecione o local e cadastre suas faces com + Face. Renomear local altera o nome do grupo; Editar nome e medidas altera a face selecionada.', '+ Local'],
  ['Compartilhe um boulder', 'Na biblioteca, toque em Compartilhar. Envie o arquivo pelo aplicativo que preferir. A outra pessoa usa Receber boulder na biblioteca. O arquivo inclui a foto e as agarras das faces usadas, preservando o encaixe. Usem essa mesma referência para criar novos boulders; fotos cadastradas independentemente não são alinhadas automaticamente.', 'Compartilhar'],
  ['Confira as medidas da rocha', 'No On the Rock, fotografe de frente um plano por vez. Meça A–B e outro trecho C–D no mesmo plano. Marque os quatro pontos e informe as duas distâncias em metros. Divergências acima de 10% pedem revisão. No destino, informe largura e altura reais da área fotografada. É uma comparação 2D, sem medição de profundidade.', 'On the Rock'],
  ['Cadastre cada face', 'Em Muro, toque em + Face. Envie uma foto nítida e informe as medidas e a inclinação. Cadastre o teto separadamente.', '+ Face'],
  ['Marque as agarras', 'Use Encontrar agarras: a leitura começa sozinha. Revise os contornos, mostre incertas quando necessário e use Ler só uma região em muros cheios. Adicione as selecionadas. Depois classifique qualidade e tipo; use Próxima sem classificação para avançar. Complete as faltantes com + Agarra. Ajustar contorno permite traçar a borda. Voltar à face mostra Excluir face e Renumerar; Excluir agarra aparece na seleção.', '+ Agarra'],
  ['Marque a puxada', 'Selecione a agarra e toque em uma seta: para baixo, invertida, lateral ou diagonal. A seta amarela sobre a foto mostra para onde sua mão faz força na agarra. Direcional limita o uso perto da seta; Ampla aceita diagonais; Livre permite vários lados. Não sei mantém a informação desconhecida. Use o ajuste fino e Próxima sem direção para completar o muro.', 'Puxada'],
  ['Monte seu boulder', 'Em Boulders, escolha Montar à mão. Selecione a função e toque nas agarras: Saída E/D, Mão, Pé e Final E/D. Para juntar as mãos, marque E e D na mesma agarra.', 'Montar à mão'],
  ['Ou peça uma sugestão', 'Toque em Gerar boulder e escolha a face e o grau. Cadastre mãos e dois apoios baixos. Escolha movimentos curtos, equilibrados ou amplos; a busca limita o deslocamento da mesma mão de acordo com cada perfil corporal. Confira largura e altura da área exata da foto: zoom, corte e perspectiva alteram a escala. Revise a sequência antes de salvar: o grau é uma estimativa e a geração usa uma face por vez.', 'Gerar boulder'],
  ['Retome pela câmera', 'Abra o boulder na Sessão e toque em Ver no muro. Permita a câmera e enquadre a face como na foto cadastrada. Use Anterior e Próximo para trocar o boulder.', 'Ver no muro'],
  ['Guarde seus projetos', 'As alterações ficam neste navegador e aparelho. Use Backup para baixar uma cópia com fotos e boulders. Importar substitui o acervo atual pelo arquivo escolhido.', 'Backup']
];
const help = document.createElement('dialog');
help.id = 'help-dialog';
help.setAttribute('aria-labelledby', 'help-title');
help.innerHTML = `<div class="help-heading"><h2 id="help-title">Como usar</h2><button type="button" id="help-close" aria-label="Fechar ajuda">Fechar</button></div><div id="help-manual"><p>Do cadastro à sessão.</p><button type="button" id="help-tour" class="primary">Iniciar tour ilustrado</button>${steps.map(([title,copy],i)=>`<details class="advanced" ${i===0?'open':''}><summary>${i+1}. ${title}</summary><p>${copy}</p></details>`).join('')}<details class="advanced"><summary>Câmera: alinhamento e limitações</summary><p>Acesse o aplicativo por HTTPS e autorize a câmera no navegador. Use boa iluminação e aproxime o enquadramento da foto original.</p><p>A RA é experimental: cada face é alinhada separadamente. Volumes, teto, grandes mudanças de ângulo e o corpo na frente podem prejudicar o reconhecimento. Se perder o alinhamento, as marcações somem. Use Voltar à foto quando necessário.</p></details><details class="advanced"><summary>Grau e cores</summary><p>No cadastro: verde = boa, amarelo = média, vermelho = ruim. No boulder: verde = saída, vermelho = final, laranja = demais marcações; as letras indicam a função.</p><p>O gerador combina a classificação, a direção da puxada, o tipo, a postura, a distância e a inclinação. Não garante o grau nem a execução do movimento. Confira as agarras, os pés e as duas mãos da saída e do final antes de salvar.</p></details></div><div id="help-tour-panel" hidden><p id="tour-progress" class="eyebrow"></p><div id="tour-illustration" aria-hidden="true"></div><div aria-live="polite" aria-atomic="true"><h3 id="tour-title"></h3><p id="tour-copy"></p></div><p class="help">Exemplo ilustrativo. Seu acervo não é alterado.</p><div class="tour-actions"><button type="button" id="tour-back">Anterior</button><button type="button" id="tour-next" class="primary">Próximo</button></div><button type="button" id="tour-manual" class="text-button">Voltar ao manual</button></div>`;
document.body.append(help);
let step = 0;
function showStep() {
  const [title, copy, action] = steps[step];
  help.querySelector('#tour-progress').textContent = `${step+1} / ${steps.length}`;
  help.querySelector('#tour-title').textContent = title;
  help.querySelector('#tour-copy').textContent = copy;
  help.querySelector('#tour-back').disabled = step === 0;
  help.querySelector('#tour-next').textContent = step === steps.length-1 ? 'Concluir' : 'Próximo';
  const points = [[65,150],[145,150],[105,105],[190,90],[145,40],[220,45]];
  help.querySelector('#tour-illustration').innerHTML = `<svg viewBox="0 0 280 190" focusable="false"><rect x="15" y="10" width="250" height="170" rx="8" fill="#30291f" stroke="#68513b"/>${points.map(([x,y],i)=>`<ellipse cx="${x}" cy="${y}" rx="16" ry="10" fill="${step===0?'#89735e':i<2?'#99dba4':i>3?'#f39887':'#f58a36'}" ${step===4?'stroke="#fff" stroke-width="3"':''}/>`).join('')}${step===2||step===3?'<path d="M65 150 L145 150 L105 105 L190 90 L145 40 L220 45" fill="none" stroke="#fff" stroke-dasharray="4 5"/>':''}</svg><span class="badge">${action}</span>`;
  help.scrollTop = 0;
}
function manual() { help.querySelector('#help-manual').hidden=false;help.querySelector('#help-tour-panel').hidden=true; }
document.querySelector('#help-open').addEventListener('click',()=>{manual();help.showModal();});
help.querySelector('#help-close').onclick=()=>help.close();
help.querySelector('#help-tour').onclick=()=>{step=0;help.querySelector('#help-manual').hidden=true;help.querySelector('#help-tour-panel').hidden=false;showStep();help.querySelector('#tour-next').focus();};
help.querySelector('#tour-back').onclick=()=>{if(step>0){step--;showStep();}};
help.querySelector('#tour-next').onclick=()=>{if(step===steps.length-1){manual();help.querySelector('#help-tour').focus();}else{step++;showStep();}};
help.querySelector('#tour-manual').onclick=()=>{manual();help.querySelector('#help-tour').focus();};
