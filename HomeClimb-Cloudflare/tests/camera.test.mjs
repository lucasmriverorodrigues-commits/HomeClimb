import test from 'node:test';
import assert from 'node:assert/strict';
import {CameraSession,cameraError} from '../dist/camera.js';
const context={clearRect(){}};
globalThis.document={createElement:()=>({getContext:()=>context}),hidden:false};
globalThis.window={isSecureContext:true};
function session(){return new CameraSession({video:{srcObject:null,play:async()=>{}},overlay:{getContext:()=>context,width:100,height:100},status:{textContent:''}});}
test('câmera negada informa motivo e libera a sessão',async()=>{Object.defineProperty(globalThis,'navigator',{value:{mediaDevices:{getUserMedia:async()=>{throw {name:'NotAllowedError'}}}},configurable:true});const s=session();await s.start({snapshot:{faces:[]}});assert.match(s.status.textContent,/negado/);assert.equal(s.active,false);});
test('HTTP inseguro não solicita câmera',async()=>{let called=false;window.isSecureContext=false;Object.defineProperty(globalThis,'navigator',{value:{mediaDevices:{getUserMedia:async()=>{called=true}}},configurable:true});const s=session();await s.start({});assert.match(s.status.textContent,/HTTPS/);assert.equal(called,false);window.isSecureContext=true;});
test('parar enquanto permissão está pendente fecha o stream tardio',async()=>{let resolve,stopped=0;Object.defineProperty(globalThis,'navigator',{value:{mediaDevices:{getUserMedia:()=>new Promise(r=>resolve=r)}},configurable:true});const s=session(),pending=s.start({snapshot:{faces:[]}});s.stop();resolve({getTracks:()=>[{stop:()=>stopped++}]});await pending;assert.equal(stopped,1);assert.equal(s.video.srcObject,null);assert.equal(s.active,false);});
test('mensagens para câmera ausente e ocupada',()=>{assert.match(cameraError({name:'NotFoundError'}),/Nenhuma câmera/);assert.match(cameraError({name:'NotReadableError'}),/ocupada/);});
test('câmera projeta e rotula um contorno de três pontos',()=>{
 const texts=[];Object.assign(context,{beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},drawImage(){},strokeText(...args){texts.push(args)},fillText(...args){texts.push(args)}});
 const s=session();s.route={feet:'follow',assignments:{h:['hand']},snapshot:{holds:[{id:'h',faceId:'f',x:.2,y:.2,radius:.03,contour:[[.1,.1],[.3,.1],[.2,.3]]}]}};
 s.draw([{id:'f',width:100,height:100,H:[1,0,0,0,1,0,0,0,1],quad:[[0,0],[100,0],[100,100],[0,100]]}],100,100);
 assert.equal(texts.length,2);assert.ok(texts.every(t=>Number.isFinite(t[1])&&Number.isFinite(t[2])));
});
