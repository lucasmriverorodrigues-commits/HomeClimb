import {rockTargets,verifyRockScale} from './rock-scale.js';
import {id} from './core.js';
import {calibration as C} from './generation-config.js';
import {gradeBoulder,predictionSummary} from './boulder-grader.js';
import {startingSupportPlans,rescueMiddleSupports} from './starting-supports.js';
import {matchRockHolds,rockMoves,compareRockMovements,sourceGroups} from './rock-matching.js';
// One measured plane, no implicit rotation, mirroring or anisotropic scaling.
export function adaptRock(wall,faceId,points,aspect=1,calibration=null){
 const face=wall.faces.find(f=>f.id===faceId),holds=wall.holds.filter(h=>h.faceId===faceId&&!h.footOnly);
 if(!face||points.length<4||points.length>30||holds.length<new Set(sourceGroups(points)).size)throw Error('Marque de 4 a 30 pegadas e escolha uma face com agarras suficientes.');
 if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1||p.hand!==undefined&&!['L','R'].includes(p.hand)))throw Error('Confira a posição e a mão das pegadas.');
 const targets=rockTargets(points,aspect,face,calibration),beam=matchRockHolds(targets,holds,face),analysisCache={snapshot:wall,bodies:new Map()},entries=[],rescues=[];
 for(const option of beam.slice(0,C.rock.candidates)){
  const roles={};option.chosen.forEach((h,i)=>{const role=i===0?'startL':i===1?'startR':i===option.chosen.length-2?'finishL':i===option.chosen.length-1?'finishR':'hand';(roles[h.id]??=[]).push(role);});
  for(const id of Object.keys(roles))roles[id]=[...new Set(roles[id])];
  const prescribedMoves=rockMoves(points,option.chosen),candidate={snapshot:wall,assignments:roles,feet:'follow'},plans=startingSupportPlans(candidate,face);
  let analysis=null,assignments=roles,baseFeet=[],middleFeet=[];
  for(const plan of plans){
   const prediction=gradeBoulder(plan.route,{prescribedMoves,analysisCache});
   if(!analysis||prediction.feasible){analysis=prediction;assignments=plan.route.assignments;baseFeet=plan.baseFeet;}
   if(prediction.feasible)break;
   rescues.push({option,plan,prescribedMoves});
  }
  analysis??=gradeBoulder(candidate,{prescribedMoves,analysisCache});
  entries.push({...option,analysis,assignments,baseFeet,middleFeet,prescribedMoves});
 }
 // Keep sparse feet: middle supports are considered only after every
 // shortlisted mapping failed with base feet alone.
 if(!entries.some(e=>e.analysis.feasible))for(const r of rescues.slice(0,C.startingSupports.rescuePaths)){
  const rescued=rescueMiddleSupports(r.plan,face,analysisCache,{prescribedMoves:r.prescribedMoves});
  if(rescued){entries.push({...r.option,analysis:rescued.prediction,assignments:rescued.assignments,baseFeet:rescued.baseFeet,middleFeet:rescued.middleFeet,prescribedMoves:r.prescribedMoves});break;}
 }
 for(const e of entries)e.penalty=e.cost+(e.analysis.feasible?0:C.rock.unsupportedPenalty)+e.analysis.morphologySensitivity.spread*C.rock.morphologyPenalty;
 entries.sort((a,b)=>Number(b.analysis.feasible)-Number(a.analysis.feasible)||a.penalty-b.penalty);
 const best=entries[0],chosen=best.chosen,comparison=compareRockMovements(targets,chosen,face),percent=calibration?.percent??100;
 const rockAnalysis={version:1,...comparison,measured:!!calibration,scalePercent:calibration?percent:null,scaleCheck:calibration?.check?verifyRockScale(aspect,calibration):null,sequenceVerified:best.analysis.feasible,prescribedMoves:best.prescribedMoves,baseFeet:best.baseFeet,middleFeet:best.middleFeet};
 for(const m of rockAnalysis.moves)m.sourceMeters=calibration?m.expectedMeters/(percent/100):null;
 const comparisons=comparison.moves.map(m=>`${m.hand} ${m.fromPoint}→${m.toPoint}: referência ${m.expectedMeters.toFixed(2)} m / muro ${m.actualMeters.toFixed(2)} m`).join('; ');
 const supportNote=best.analysis.feasible?'Sequência das mãos indicada na rocha encontrada para três tamanhos de escalador no muro.':'ATENÇÃO: encaixe geométrico; a sequência indicada não foi encontrada para todos os tamanhos. Revise mãos e pés.';
 return {id:id(),name:'On the Rock',kind:'boulder',scale:'Sem grau',grade:'',stance:'free',feet:'follow',smear:'no',finishSeconds:2,assignments:best.assignments,snapshot:structuredClone(wall),generationAnalysis:predictionSummary(best.analysis),rockAnalysis,notes:`On the Rock — ${calibration?'escala medida '+percent+'%':'sem escala real, apenas proporções'} na face ${face.name}.\n${supportNote}\n${comparisons}\nErro médio dos vetores de movimento: ${(comparison.meanVectorErrorMeters*100).toFixed(0)} cm. ${comparison.closeMoves}/${comparison.moves.length} lances dentro da tolerância de comparação.\n${best.baseFeet.length} pés na base; ${best.middleFeet.length} no meio. Mãos também valem como pés.\nA análise corporal se refere ao muro. Foto não determina profundidade, inclinação ou dificuldade; proximidade geométrica não garante a mesma sensação na rocha.`.slice(0,2000)};
}
export {createOnRock} from './on-rock-ui.js';
