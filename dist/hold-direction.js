// The arrow is the force applied BY the climber TO the hold in the photo:
// 0 up (undercling), 90 right, 180 down, 270 left. Metric coordinates use y up.
// Old numeric defaults do not prove that the climber classified the pull.
export const directionKnown=h=>Number.isFinite(h.direction)&&h.directionKnown===true;
export function pullVector(degrees){const r=degrees*Math.PI/180;return {x:Math.sin(r),y:Math.cos(r)};}
export function directionFit(hold,shoulder){
 if(!directionKnown(hold))return {known:false,allowed:true,alignment:null,penalty:0};
 const tolerance=hold.directionTolerance??100;
 if(tolerance===180)return {known:true,allowed:true,alignment:1,penalty:0};
 const dx=shoulder.x-hold.x,dy=shoulder.y-hold.y,length=Math.hypot(dx,dy);
 if(length<.02)return {known:true,allowed:true,alignment:1,penalty:0};
 const v=pullVector(hold.direction),alignment=Math.max(-1,Math.min(1,(dx*v.x+dy*v.y)/length));
 const limit=Math.cos(tolerance*Math.PI/180);
 return {known:true,allowed:alignment>=limit-1e-9,alignment,penalty:(1-alignment)/2};
}
export function directionDistance(a,b){
 if(!Number.isFinite(a)||!directionKnown(b))return null;
 if(b.directionTolerance===180)return 0;
 const delta=Math.abs(((a-b.direction)%360+540)%360-180);
 return Math.max(0,delta-(b.directionTolerance??100)/2)/180;
}
export function arrowPath(x,y,length,degrees){
 const v=pullVector(degrees),ex=x+v.x*length,ey=y-v.y*length,s=length*.23;
 return `M ${x} ${y} L ${ex} ${ey} M ${ex-v.x*s-v.y*s*.6} ${ey+v.y*s-v.x*s*.6} L ${ex} ${ey} L ${ex-v.x*s+v.y*s*.6} ${ey+v.y*s+v.x*s*.6}`;
}
