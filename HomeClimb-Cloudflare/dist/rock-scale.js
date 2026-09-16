export function verifyRockScale(aspect,calibration){
 const distance=p=>{if(!p?.a||!p?.b||![p.a.x,p.a.y,p.b.x,p.b.y].every(v=>Number.isFinite(v)&&v>=0&&v<=1)||!Number.isFinite(p.meters)||p.meters<=0||p.meters>30)throw Error('Confira as duas medidas reais.');const d=Math.hypot((p.a.x-p.b.x)*aspect,p.a.y-p.b.y);if(d<.03)throw Error('Use referências maiores na foto.');return d;};
 if(!Number.isFinite(aspect)||aspect<=0)throw Error('Foto inválida.');
 const factor=calibration.meters/distance(calibration),predicted=distance(calibration.check)*factor,error=Math.abs(predicted-calibration.check.meters)/calibration.check.meters;
 return {predicted,error,valid:error<=.10};
}
export function rockTargets(points,aspect,face,calibration){
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y),sx=Math.max(...xs)-Math.min(...xs),sy=Math.max(...ys)-Math.min(...ys);
 if(!Number.isFinite(aspect)||aspect<=0||Math.max(sx,sy)<.03)throw Error('Marque pegadas distribuídas pela foto.');
 let factor;
 if(calibration){
  const {a,b,meters,percent=100}=calibration;
  if(!a||!b||![a.x,a.y,b.x,b.y].every(v=>Number.isFinite(v)&&v>=0&&v<=1)||!Number.isFinite(meters)||meters<=0||meters>30||!Number.isFinite(percent)||percent<25||percent>150)throw Error('Confira a referência medida e a escala.');
  const length=Math.hypot((a.x-b.x)*aspect,a.y-b.y);
  if(length<.03)throw Error('Marque uma referência maior na foto para reduzir o erro.');
  if(calibration.check&&!verifyRockScale(aspect,calibration).valid)throw Error('As medidas divergem mais de 10%. Confira as marcas, medidas e perspectiva da foto.');
  factor=meters/length*percent/100;
 }else factor=Math.min(sx?face.width*.8/(sx*aspect):Infinity,sy?face.height*.8/sy:Infinity);
 if(sx*aspect*factor>face.width*.95||sy*factor>face.height*.95)throw Error('O boulder não cabe nesta face nessa escala. Escolha uma face maior ou reduza explicitamente a escala.');
 const mx=(Math.min(...xs)+Math.max(...xs))/2,my=(Math.min(...ys)+Math.max(...ys))/2;
 return points.map(p=>({...p,x:.5+(p.x-mx)*aspect*factor/face.width,y:.5+(p.y-my)*factor/face.height}));
}
export function angleDifference(a,b){return Math.abs(((a-b+540)%360)-180);}
