import {adaptRock} from './on-rock.js';
self.onmessage=({data})=>{try{self.postMessage({route:adaptRock(data.wall,data.faceId,data.points,data.aspect,data.calibration)});}catch(error){self.postMessage({error:error.message});}};
