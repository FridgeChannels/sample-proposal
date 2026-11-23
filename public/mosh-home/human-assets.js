// Load one anatomical actor, falling back to the other mesh resolution if a
// detail asset is temporarily unavailable. A family is revealed only after all
// four calls have completed; pets never act as the human-loading placeholder.
function validate(data){
 const n=data?.positions?.length/3;
 if(!Number.isInteger(n)||n<100||data.normals?.length!==n*3||data.skinIndices?.length!==n*4||data.skinWeights?.length!==n*4||!data.indices?.length||!data.groups?.length||!data.materials?.length||!data.joints||!(data.height>0))throw new Error('Incomplete character geometry');
 for(const key of ['positions','normals','skinWeights','skinIndices','indices'])if(!data[key].every(Number.isFinite))throw new Error('Invalid character geometry');
 return data;
}

export async function loadCharacterMesh(index,{software=false,fetcher=fetch,timeoutMs=8000,retries=1}={}){
 const preferred=software?'-low':'',alternate=software?'':'-low';
 let lastError;
 for(const suffix of [preferred,alternate]){
  for(let attempt=0;attempt<=retries;attempt++){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
   try{
    const response=await fetcher(new URL(`./assets/models/character-${index}${suffix}.json?v=44`,import.meta.url),{signal:controller.signal,cache:attempt?'reload':'default'});
    if(!response.ok)throw new Error(`Character asset returned ${response.status||'an error'}`);
    return {data:validate(await response.json()),detail:suffix?'low':'full'};
   }catch(error){lastError=error;}finally{clearTimeout(timer);}
  }
 }
 throw new Error(`Could not load family member ${index+1}`,{cause:lastError});
}

// One compressed transfer preserves the original Blender vertices and joint weights.
export async function loadCastPack(software, fetcher=fetch){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),12000);
 try{
  const url=new URL(`./assets/models/cast-${software?'low':'full'}.bin?v=44`,import.meta.url);
  const response=await fetcher(url,{signal:controller.signal});
  if(!response.ok||!response.body)throw new Error('Cast pack unavailable');
  const data=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();
  if(!Array.isArray(data)||data.length!==4)throw new Error('Incomplete family');
  return data.map(mesh=>({data:validate(mesh),detail:software?'low':'full'}));
 }finally{clearTimeout(timer);}
}
