const DB='homeclimb-v1';
let connection;
async function database(){if(connection)return connection;return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore('state');req.onsuccess=()=>{connection=req.result;resolve(connection)};req.onerror=()=>reject(req.error);});}
export async function readState(){const db=await database();return new Promise((resolve,reject)=>{const req=db.transaction('state').objectStore('state').get('main');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function writeState(state){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'main');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??Error('Armazenamento interrompido.'));});}
