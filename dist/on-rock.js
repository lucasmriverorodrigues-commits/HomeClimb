import {rockTargets} from './rock-scale.js';
import {id} from './core.js';
import {calibration as C} from './generation-config.js';
import {gradeBoulder,predictionSummary} from './boulder-grader.js';
import {proposeSupports,pruneSupports} from './support-proposal.js';
import {directionDistance} from './hold-direction.js';
// A geometric approximation in the plane of the photo, not a 3D reconstruction.
export function adaptRock(wall,faceId,points,aspect=1,calibration=null){
 const face=wall.faces.find(f=>f.id===faceId),holds=wall.holds.filter(h=>h.faceId===faceId&&!h.footOnly);
 if(!face||points.length<4||points.length>30||holds.length<points.length)throw Error('Marque de 4 a 30 pegadas e escolha uma face com agarras suficientes.');
 if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1))throw Error('Pegada fora da foto.');
 const targets=rockTargets(points,aspect,face,calibration);
 let beam=[{cost:0,chosen:[]}];
 for(let i=0;i<targets.length;i++){
  const p=targets[i],pool=holds.map(h=>({h,cost:Math.hypot((h.x-p.x)*face.width,(h.y-p.y)*face.height)+(p.quality!=='unknown'&&p.quality!==h.quality?.25:0)+(p.type!=='Não informado'&&p.type!==h.type ? .35 : 0)+(Number.isFinite(p.direction)?(directionDistance(p.direction,h)??.5)*.8:0)})).sort((a,b)=>a.cost-b.cost).slice(0,Math.max(40,points.length));
  const next=[];
  for(const partial of beam)for(const {h,cost} of pool){if(partial.chosen.some(v=>v.id===h.id))continue;const previous=partial.chosen.at(-1),sourcePrevious=targets[i-1];const movement=previous?Math.hypot(((h.x-previous.x)-(p.x-sourcePrevious.x))*face.width,((h.y-previous.y)-(p.y-sourcePrevious.y))*face.height):0;next.push({cost:partial.cost+cost+movement,chosen:[...partial.chosen,h]});}
  beam=next.sort((a,b)=>a.cost-b.cost).slice(0,24);if(!beam.length)throw Error('Não foi possível encontrar agarras distintas.');
 }
 let best=null;
 for(const option of beam.slice(0,C.rock.candidates)){
  const roles={};option.chosen.forEach((h,i)=>roles[h.id]=[i===0?'startL':i===1?'startR':i===option.chosen.length-2?'finishL':i===option.chosen.length-1?'finishR':'hand']);
  const assignments=proposeSupports(wall,face,option.chosen,roles),candidate={snapshot:wall,assignments,feet:'follow'};
  let analysis=gradeBoulder(candidate),finalAssignments=analysis.feasible?pruneSupports(assignments,analysis):roles;
  analysis=gradeBoulder({...candidate,assignments:finalAssignments});
  const penalty=option.cost+(analysis.feasible?0:C.rock.unsupportedPenalty)+analysis.morphologySensitivity.spread*C.rock.morphologyPenalty;
  if(!best||penalty<best.penalty)best={...option,penalty,analysis,assignments:finalAssignments};
 }
 const chosen=best.chosen,assignments=best.assignments;
 const sequence=chosen.map((h,i)=>`${i+1}:${h.name.slice(0,12)} [rocha:${points[i].type||'?'} ${points[i].direction??'?'}°]`).join('; ');
 const comparisons=chosen.slice(1).map((h,i)=>{const previous=chosen[i],a=targets[i],b=targets[i+1],expected=Math.hypot((b.x-a.x)*face.width,(b.y-a.y)*face.height),actual=Math.hypot((h.x-previous.x)*face.width,(h.y-previous.y)*face.height);return `${i+1}→${i+2}: referência ${expected.toFixed(2)} m / muro ${actual.toFixed(2)} m`;}).join('; ');
 const supportNote=best.analysis.feasible?'Apoios sugeridos e beta encontrada para três tamanhos de escalador no muro.':'ATENÇÃO: encaixe geométrico; não foi encontrada beta para todos os tamanhos. Revise mãos e pés.';
 return {id:id(),name:'On the Rock',kind:'boulder',scale:'Sem grau',grade:'',stance:'free',feet:'follow',smear:'no',finishSeconds:2,assignments,snapshot:structuredClone(wall),generationAnalysis:predictionSummary(best.analysis),notes:`On the Rock — ${calibration?'escala medida '+(calibration.percent||100)+'%':'sem escala real'} na face ${face.name}.\n${supportNote}\n${sequence}\n${comparisons}\nA análise corporal se refere ao muro, não valida equivalência com a rocha. Foto não determina profundidade, inclinação ou dificuldade. Não é uma reprodução exata.`.slice(0,2000)};
}
export {createOnRock} from './on-rock-ui.js';
