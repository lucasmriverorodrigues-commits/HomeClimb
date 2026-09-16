import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const root=new URL('../dist/',import.meta.url),code=fs.readFileSync(new URL('sw.js',root),'utf8');
function setup(){
  const handlers={},entries=new Map(),deleted=[];let network=0,fail=false;
  const cache={async addAll(requests){if(fail)throw Error('offline');for(const r of requests){const path=new URL(r.url).pathname.replace('/app/','')||'index.html';entries.set(r.url,fs.readFileSync(new URL(path,root),'utf8'));}},async match(key,options){const url=new URL(typeof key==='string'?key:key.url);if(options?.ignoreSearch)url.search='';return entries.get(url.href);}};
  const context={URL,Request,caches:{open:async()=>cache,keys:async()=>['unrelated','homeclimb-shell-old','homeclimb-shell-v0.15'],delete:async key=>deleted.push(key)},fetch:async()=>{network++;throw Error('offline');},self:{registration:{scope:'https://example.test/app/'},clients:{claim:async()=>{}},addEventListener:(name,fn)=>handlers[name]=fn}};
  vm.runInNewContext(code,context);
  const dispatch=async(name,extra={})=>{let result;handlers[name]({...extra,waitUntil:p=>{result=p;},respondWith:p=>{result=p;}});return result;};
  return {entries,deleted,dispatch,network:()=>network,setFail:()=>{fail=true;}};
}
test('precache contains every application module and installation asset',async()=>{const s=setup();await s.dispatch('install');for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.js')&&f!=='sw.js'))assert.ok(s.entries.has('https://example.test/app/'+file),file);assert.ok(s.entries.has('https://example.test/app/vendor/opencv.js'));const manifest=JSON.parse(fs.readFileSync(new URL('manifest.webmanifest',root)));assert.equal(manifest.display,'standalone');for(const icon of manifest.icons)assert.ok(fs.existsSync(new URL(icon.src,root)));});
test('offline navigation and worker scripts come from installed release',async()=>{const s=setup();await s.dispatch('install');const page=await s.dispatch('fetch',{request:{method:'GET',mode:'navigate',url:'https://example.test/app/?launch=icon'}});assert.match(page,/HomeClimb/);const worker=await s.dispatch('fetch',{request:{method:'GET',url:'https://example.test/app/generator-worker.js'}});assert.match(worker,/generateBoulder/);assert.equal(s.network(),0);});
test('activation only removes obsolete HomeClimb shell caches',async()=>{const s=setup();await s.dispatch('activate');assert.deepEqual(s.deleted,['homeclimb-shell-old']);});
test('incomplete download fails installation and removes partial cache',async()=>{const s=setup();s.setFail();await assert.rejects(s.dispatch('install'));assert.deepEqual(s.deleted,['homeclimb-shell-v0.15']);});
test('readiness checks all cached resources, including camera engine',async()=>{const s=setup();await s.dispatch('install');let status;const message={data:{type:'OFFLINE_STATUS'},ports:[{postMessage:value=>{status=value;}}]};await s.dispatch('message',message);assert.equal(status.ready,true);s.entries.delete('https://example.test/app/vendor/opencv.js');await s.dispatch('message',message);assert.equal(status.ready,false);});








