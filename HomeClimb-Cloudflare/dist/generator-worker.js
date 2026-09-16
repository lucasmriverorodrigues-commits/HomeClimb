import {generateBoulder} from './generator.js';
self.onmessage=e=>{try{self.postMessage({result:generateBoulder(e.data.wall,e.data.options)});}catch(error){self.postMessage({error:error.message});}};
