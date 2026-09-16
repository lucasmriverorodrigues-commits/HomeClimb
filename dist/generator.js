import {proposeSupports,pruneSupports} from './support-proposal.js';
import {id,validateRoute} from './core.js';
import {calibration as C} from './generation-config.js';
import {gradeBoulder,predictionSummary} from './boulder-grader.js';
const difficulty=C.handQuality,typeCost=C.handType;
export function generateBoulder(wall,{faceId,target=3,count=6,reach=.85,direction='up',startBand=25,finishBand=10,seed=Date.now(),debugGeneration=false}={}){
 const face=wall.faces.find(f=>f.id===faceId);
 if(!face)throw Error('Escolha uma face do muro.');
 if(!Number.isInteger(target)||target<0||target>12||!Number.isInteger(count)||count<4||count>10||!Number.isFinite(reach)||reach<.4||reach>1.4||!['up','right','left'].includes(direction))throw Error('Configuração de geração inválida.');
 if(!Number.isFinite(startBand)||startBand<5||startBand>40||!Number.isFinite(finishBand)||finishBand<5||finishBand>30)throw Error('Faixas de saída e final inválidas.');
 const all=wall.holds.filter(h=>h.faceId===faceId),supports=all.filter(h=>h.quality!=='unknown'&&h.quality in difficulty||h.footOnly),holds=supports.filter(h=>!h.footOnly);
 if(holds.length<count||supports.length<count+1)throw Error(`Classifique pelo menos ${count} agarras de mão e um apoio adicional nesta face. Hoje há ${holds.length} de mão.`);
 if(holds.length>1000)throw Error('Esta versão gera em faces com até 1000 agarras classificadas.');
 let rng=Number(seed)>>>0;const random=()=>{rng=(1664525*rng+1013904223)>>>0;return rng/4294967296};
 const distance=(a,b)=>Math.hypot((a.x-b.x)*face.width,(a.y-b.y)*face.height);
 const progress=h=>direction==='up'?1-h.y:direction==='right'?h.x:1-h.x;
 const g=C.generator;
 const sorted=[...holds].sort((a,b)=>progress(a)-progress(b));
 const low=progress(sorted[0]),high=progress(sorted.at(-1)),extent=high-low;
 if(extent<g.coverage)throw Error('As agarras classificadas cobrem menos de 60% desta face na direção escolhida. Classifique também agarras próximas da base e do topo (ou das extremidades, na travessia).');
 const inStart=h=>progress(h)<=low+extent*startBand/100+1e-9;
 const inFinish=h=>progress(h)>=high-extent*finishBand/100-1e-9;
 const bottom=sorted.filter(inStart),goodStarts=bottom.filter(h=>h.quality==='good');
 const startPool=goodStarts.length?goodStarts:bottom;
 const finishPool=sorted.filter(inFinish);
 const cost=h=>(difficulty[h.quality]??4.5)+(typeCost[h.type]??.2);
 const neighbors=new Map(holds.map(h=>[h.id,holds.filter(n=>n.id!==h.id&&distance(h,n)<=reach&&distance(h,n)>g.neighborMin)]));
 let best=null,valid=0;const proposals=[],signatures=new Set();
 for(let attempt=0;attempt<C.generator.attempts;attempt++){
   const path=[startPool[Math.floor(random()*startPool.length)]];
   for(let step=1;step<count;step++){
     const previous=path.at(-1),other=path.at(-2);
     const candidates=neighbors.get(previous.id).filter(n=>!path.some(h=>h.id===n.id)&&progress(n)>=progress(previous)-g.progressBacktrack&&(!other||distance(n,other)<=reach*g.otherReach)
       &&(step!==1||path[0].match||inStart(n))
       &&(step!==count-1||inFinish(n))
       &&finishPool.some(end=>distance(n,end)<=(count-1-step)*reach+1e-9));
     if(!candidates.length)break;
     const goal=progress(path[0])+(high-progress(path[0]))*step/(count-1);
     const rank=n=>Math.abs(cost(n)-target*g.qualityTarget)+Math.abs(progress(n)-goal)*g.progressRank;
     candidates.sort((a,b)=>rank(a)-rank(b));
     const pool=candidates.slice(0,Math.min(g.rankPool,candidates.length));path.push(pool[Math.floor(random()*pool.length)]);
   }
   if(path.length<count||(!path[0].match&&distance(path[0],path[1])>reach*g.matchSpread)||(!path.at(-1).match&&distance(path.at(-1),path.at(-2))>reach*g.matchSpread))continue;
   if(!inFinish(path.at(-1))||(!path.at(-1).match&&!inFinish(path.at(-2))))continue;
   const coverage=progress(path.at(-1))-progress(path[0]);
   const starts=path[0].match?[path[0]]:path.slice(0,2),finishes=path.at(-1).match?[path.at(-1)]:path.slice(-2);
   const closestGap=Math.min(...starts.flatMap(a=>finishes.map(b=>progress(b)-progress(a))));
   if(coverage<Math.max(g.coverage,extent*g.extentCoverage)||closestGap<Math.max(g.gap,extent*g.extentGap))continue;
   const signature=path.map(h=>h.id).join('|');if(signatures.has(signature))continue;signatures.add(signature);
   const rough=path.reduce((sum,h)=>sum+cost(h),0)/path.length;
   const rank=Math.abs(rough-target*g.qualityTarget)+(extent-coverage)*2+random()*.3;
   proposals.push({path,rank});
 }
 proposals.sort((a,b)=>a.rank-b.rank);
 const diagnostics=[];
 // Candidate construction chooses contact options; grading searches legal betas independently.
 for(const [proposalIndex,proposal] of proposals.slice(0,g.shortlist*2).entries()){
  if(proposalIndex>=g.shortlist&&best&&Math.abs(best.estimate-target)<=g.tolerance)break;
  const path=proposal.path,assignments={};for(const h of path)assignments[h.id]=['hand'];
  const first=path[0],last=path.at(-1);
  assignments[first.id].push('startL');assignments[first.match?first.id:path[1].id].push('startR');
  assignments[last.id].push('finishL');assignments[last.match?last.id:path.at(-2).id].push('finishR');
  const candidate={id:'candidate',name:'Candidato',kind:'boulder',scale:'V',grade:'',stance:'free',feet:'follow',smear:'no',finishSeconds:2,notes:'',snapshot:wall,assignments:proposeSupports(wall,face,path,assignments)};
  let prediction=gradeBoulder(candidate,{intended:path.map(h=>h.id)});
  diagnostics.push({handIds:path.map(h=>h.id),...predictionSummary(prediction)});
  if(!prediction.feasible||prediction.morphologySensitivity.high)continue;
  let finalAssignments=pruneSupports(candidate.assignments,prediction);
  const verified=gradeBoulder({...candidate,assignments:finalAssignments},{intended:path.map(h=>h.id)});
  if(!verified.feasible||verified.morphologySensitivity.high)continue;
  prediction=verified;
  const penalty=Math.abs(prediction.score-target)+prediction.morphologySensitivity.spread*g.morphologyWeight+(prediction.shortcut.detected?g.shortcutWeight:0);
  valid++;if(!best||penalty<best.penalty)best={path,assignments:finalAssignments,estimate:prediction.score,penalty,prediction};
 }

 if(!best)throw Error('Não encontrei uma beta de mãos e pés para os três tamanhos de escalador ligando a faixa de saída à última faixa com esse alcance. Tente mais agarras de mão, amplie as faixas ou confira medidas e apoios. O final não foi deslocado para o meio do muro.');
 const assignments=best.assignments;const feet=new Set(Object.keys(assignments).filter(key=>assignments[key].includes('foot')));
 const estimated=Math.round(best.estimate),difference=Math.abs(estimated-target);
 const explanation=`Alvo V${target}; estimativa heurística V${estimated}. ${difference>1?'O cadastro disponível não produziu uma opção próxima do alvo nesta busca.':'A sugestão se aproximou do alvo na pontuação interna.'} Busca de mãos e pés para três tamanhos de escalador. Grau não validado por escaladores. Distâncias aproximadas, assumindo foto frontal e medidas corretas.`;
 const beta=best.prediction.easiestBeta,byId=new Map(wall.holds.map(h=>[h.id,h]));
 const betaNames=[...new Set([beta.states[0].LH,beta.states[0].RH]),...beta.moves.filter(m=>m.movingLimb.endsWith('H')).map(m=>m.targetHold)].map(key=>byId.get(key).name);
 const route={id:id(),name:`Projeto V${target}`,kind:'boulder',scale:'V',grade:`≈ V${estimated}`,stance:'free',feet:'follow',smear:'no',finishSeconds:2,notes:`${explanation}\nSequência sugerida: ${betaNames.join(' → ')}.\n${feet.size} pés exclusivos. Revise saída, final e apoios antes de experimentar.`,snapshot:structuredClone(wall),assignments,generationAnalysis:predictionSummary(best.prediction)};
 const error=validateRoute(route);if(error)throw Error(error);
 return {route,estimated,target,explanation,candidates:valid,ignored:all.filter(h=>!(h.quality!=='unknown'&&h.quality in difficulty)&&!h.footOnly).length,handIds:best.path.map(h=>h.id),analysis:predictionSummary(best.prediction),...(debugGeneration?{diagnostics,beta:best.prediction.easiestBeta}: {})};
}
