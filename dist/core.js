export const roles = ['startL','startR','hand','foot','finishL','finishR'];
export const id = () => crypto.randomUUID();
export const freshState = () => ({version:1,wall:{id:id(),name:'Meu muro',revision:1,faces:[],holds:[]},routes:[],attempts:[]});
export function setRole(route,holdId,role){
 if(role==='remove'){delete route.assignments[holdId];return;}
 if(!roles.includes(role))throw Error('Função inválida.');
 if(role!=='foot'&&route.snapshot.holds.find(h=>h.id===holdId)?.footOnly)throw Error('Esta agarra é somente pé. Escolha a função Pé.');
 if(role==='foot'){route.assignments[holdId]=['foot'];return;}
 if(route.assignments[holdId])route.assignments[holdId]=route.assignments[holdId].filter(r=>r!=='foot');
 if(['startL','startR','finishL','finishR'].includes(role))for(const list of Object.values(route.assignments)){const i=list.indexOf(role);if(i>=0)list.splice(i,1);}
 const list=route.assignments[holdId]??=[];
 const i=list.indexOf(role);if(i>=0)list.splice(i,1);else list.push(role);
 for(const [key,value] of Object.entries(route.assignments))if(!value.length)delete route.assignments[key];
}
export function allowedHolds(route){
 const result=new Set();
 for(const [key,list] of Object.entries(route.assignments))if(list.length)result.add(key);
 if(route.feet==='free')for(const h of route.snapshot.holds)result.add(h.id);
 return result;
}
export function footHolds(route){
 return new Set(route.snapshot.holds.filter(h=>route.feet==='free'||route.assignments[h.id]?.includes('foot')||(route.feet==='follow'&&route.assignments[h.id]?.some(r=>r!=='foot'))).map(h=>h.id));
}
export function validateRoute(r){
 if(!r.name?.trim())return 'Dê um nome ao boulder.';
 const holders=role=>Object.entries(r.assignments).filter(([,rs])=>rs.includes(role)).map(([key])=>key);
 for(const [role,label]of [['startL','saída da mão esquerda'],['startR','saída da mão direita'],['finishL','final da mão esquerda'],['finishR','final da mão direita']])if(holders(role).length!==1)return `Marque a ${label}.`;
 const ids=new Set(r.snapshot.holds.map(h=>h.id));
 if(r.snapshot.holds.some(h=>h.footOnly&&r.assignments[h.id]?.some(role=>role!=='foot')))return 'Uma agarra somente pé está marcada como mão.';
 if(Object.keys(r.assignments).some(key=>!ids.has(key)))return 'Há uma agarra que não pertence a esta montagem.';
 for(const [a,b,label]of [['startL','startR','saída'],['finishL','finishR','final']]){
   if(holders(a)[0]===holders(b)[0]&&!r.snapshot.holds.find(h=>h.id===holders(a)[0])?.match)return `A agarra de ${label} não está cadastrada para duas mãos juntas. Use duas agarras ou ajuste seu cadastro.`;
 }
 if(r.feet==='marked'&&footHolds(r).size===0)return 'Marque pelo menos um pé ou escolha outra regra de pés.';
 if(r.kind==='boulder'&&['Brasileira (via)','Francesa (via)'].includes(r.scale))return 'Use V, Font ou Sem grau para um boulder.';
 if(r.kind==='via'&&['V','Font'].includes(r.scale))return 'Escolha uma escala de via ou Sem grau.';
 return '';
}
const check=(condition,message)=>{if(!condition)throw Error(message);};
const str=(v,max=100)=>typeof v==='string'&&v.length<=max;
const num=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
const validId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
function checkWall(w){
 check(w&&validId(w.id)&&str(w.name,80)&&Number.isInteger(w.revision)&&w.revision>0,'Muro inválido.');
 check(Array.isArray(w.faces)&&w.faces.length<=30&&Array.isArray(w.holds)&&w.holds.length<=5000,'Cadastro de faces/agarras inválido.');
 const faces=new Set();for(const f of w.faces){check(validId(f.id)&&!faces.has(f.id)&&str(f.name,50)&&num(f.width,.2,30)&&num(f.height,.2,30)&&num(f.angle,-30,90)&&num(f.aspect,.01,100),'Face inválida.');check(typeof f.photo==='string'&&f.photo.length<=12000000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(f.photo),'Foto inválida no backup.');faces.add(f.id);}
 const holds=new Set();for(const h of w.holds){check(validId(h.id)&&!holds.has(h.id)&&faces.has(h.faceId)&&str(h.name,50)&&num(h.x,0,1)&&num(h.y,0,1)&&num(h.radius,.008,.1)&&['unknown','good','medium','bad'].includes(h.quality)&&str(h.type,40)&&str(h.color,40)&&num(h.direction,0,360)&&typeof h.match==='boolean','Agarra inválida.');check(h.footOnly===undefined||typeof h.footOnly==='boolean','Uso da agarra inválido.');check(h.directionKnown===undefined||typeof h.directionKnown==='boolean','Direção da agarra inválida.');check(h.directionTolerance===undefined||[60,100,180].includes(h.directionTolerance),'Amplitude da puxada inválida.');if(h.contour!==undefined)check(Array.isArray(h.contour)&&h.contour.length>=3&&h.contour.length<=256&&h.contour.every(p=>Array.isArray(p)&&p.length===2&&num(p[0],0,1)&&num(p[1],0,1)),'Contorno inválido.');holds.add(h.id);}
}
export function validateState(s){
 check(s&&s.version===1&&Array.isArray(s.routes)&&s.routes.length<=1000&&Array.isArray(s.attempts)&&s.attempts.length<=50000,'Formato de backup não reconhecido.');checkWall(s.wall);if(s.otherWalls!==undefined){check(Array.isArray(s.otherWalls)&&s.otherWalls.length<30,'Locais inválidos.');const wallIds=new Set([s.wall.id]);for(const wall of s.otherWalls){checkWall(wall);check(!wallIds.has(wall.id),'Local duplicado.');wallIds.add(wall.id);}}
 const routes=new Set();for(const r of s.routes){check(validId(r.id)&&!routes.has(r.id)&&str(r.name,80)&&str(r.grade,20)&&str(r.notes,2000)&&['boulder','via'].includes(r.kind)&&['V','Font','Brasileira (via)','Francesa (via)','Sem grau'].includes(r.scale)&&['follow','marked','free'].includes(r.feet)&&['free','sit','stand'].includes(r.stance)&&['yes','no'].includes(r.smear)&&num(r.finishSeconds,0,10),'Boulder inválido.');check(r.movementStyle===undefined||['compact','balanced','wide'].includes(r.movementStyle),'Estilo de movimento inválido.');checkWall(r.snapshot);check(r.assignments&&typeof r.assignments==='object'&&!Array.isArray(r.assignments),'Marcações inválidas.');for(const [key,list]of Object.entries(r.assignments)){check(validId(key)&&Array.isArray(list)&&list.length<=6&&new Set(list).size===list.length&&list.every(v=>roles.includes(v)),'Função de agarra inválida.');}check(!validateRoute(r),`Boulder inválido: ${validateRoute(r)}`);routes.add(r.id);}
 for(const a of s.attempts)check(validId(a.id)&&routes.has(a.routeId)&&['attempt','send'].includes(a.type)&&typeof a.at==='string'&&Number.isFinite(Date.parse(a.at)),'Registro de sessão inválido.');return s;
}
