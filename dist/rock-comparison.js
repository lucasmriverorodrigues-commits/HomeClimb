const cm=n=>Number.isFinite(n)?Math.round(n*100)+' cm':'—';
const deg=n=>Number.isFinite(n)?Math.round(n)+'°':'Não informada';
function element(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
export function renderRockComparison(host,analysis,wall){
 host.replaceChildren();host.hidden=!analysis;if(!analysis)return;
 if(analysis.stale){host.append(element('p','On the Rock: montagem editada. A comparação anterior não descreve estas marcações.'));return;}
 if(!Array.isArray(analysis.moves)||!Array.isArray(analysis.grips))return;
 const details=element('details'),summary=element('summary','Rocha → muro · comparar os lances');details.open=true;details.append(summary);
 details.append(element('p',analysis.measured?`Referência medida · reprodução em ${analysis.scalePercent}%. Erro médio de direção e distância: ${cm(analysis.meanVectorErrorMeters)}.`:'Sem medida real: comparação apenas das proporções ajustadas ao muro.'));
 details.append(element('p',analysis.sequenceVerified?'A sequência indicada de mãos passou na busca geométrica para três tamanhos de escalador.':'Revisar sequência: não foi encontrada uma beta para todas as mãos e tamanhos indicados.'));
 const wrap=element('div');wrap.className='rock-comparison-scroll';const table=element('table'),head=element('tr');
 for(const label of ['Lance','Rocha','Alvo','Muro','Diferença do vetor'])head.append(element('th',label));table.append(head);
 for(const m of analysis.moves.slice(0,30)){const row=element('tr');for(const text of [`${m.hand} · ${m.fromPoint}→${m.toPoint}`,cm(m.sourceMeters),cm(m.expectedMeters),cm(m.actualMeters),`${cm(m.vectorErrorMeters)} · ${m.close?'próximo':'revisar'}`])row.append(element('td',text));table.append(row);}
 wrap.append(table);details.append(wrap);
 details.append(element('p','O vetor considera distância e direção do deslocamento da mesma mão. “Próximo” usa uma tolerância de comparação (12 cm ou 25% do lance), não valida dificuldade ou sensação na rocha.'));
 const grips=element('details');grips.append(element('summary','Tipo e puxada de cada pegada'));
 for(const p of analysis.grips.slice(0,30)){const name=wall.holds.find(h=>h.id===p.holdId)?.name||p.holdId;grips.append(element('p',`${p.point} → ${name}: ${p.sourceType} → ${p.targetType}${p.typeMatch===false?' (tipo diferente)':''}. Puxada: ${p.sourceFree?'Livre':deg(p.sourceDirection)} → ${p.targetTolerance===180&&p.targetDirection!==null?'Livre':deg(p.targetDirection)}${p.pullMismatch>0?' (direções diferentes)':''}.`));}
 details.append(grips);host.append(details);
}
