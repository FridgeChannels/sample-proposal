// Small, depth-tested practical appliances on the photographed counter.
// All visual parts are meshes: the same geometry works in WebGL and the CPU
// depth renderer. Timelines start from actor arrival, via applyProps().
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
const blend=(a,b,t)=>a+(b-a)*t;
const DIGITS=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'];
export const KITCHEN_PLACEMENT={coffee:[55.2,26],microwave:[61.65,26],prep:[46.4,35.6],counterHeight:1.35};

export function createKitchenProps(THREE,scene,{software=false,world}={}){
 if(typeof world!=='function')throw new TypeError('Kitchen props require the floor projection helper');
 const root=new THREE.Group();root.name='Practical kitchen appliances';scene.add(root);
 const geometries=new Set(),materials=new Set();
 const geometry=g=>{geometries.add(g);return g;};
 function material(color,roughness=.7,extra={}){const m=new THREE.MeshStandardMaterial({color,roughness,metalness:roughness<.4?.35:0,...extra});materials.add(m);return m;}
 const steel=material(0x818981,.3),dark=material(0x252b29,.5),black=material(0x101915,.6),cream=material(0xe9e1cf),ceramic=material(0xf2ebde,.48),coffeeColor=material(0x3b2318,.35),wood=material(0xb58751),green=material(0x6d9147),orange=material(0xd87d31),white=material(0xeae1cd),warm=material(0xf7c878,.55,{emissive:0xe9b65c,emissiveIntensity:.22});
 const glass=material(0x22312c,.25,{transparent:true,opacity:.34,depthWrite:false});
 const segMat=material(0xa5c29b,.6,{emissive:0xa0d08a,emissiveIntensity:.5});
 const ringSegments=software?10:20;
 function mesh(parent,g,m,pos=[0,0,0]){const o=new THREE.Mesh(geometry(g),m);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(parent,m,w,h,d,p)=>mesh(parent,new THREE.BoxGeometry(w,h,d),m,p);
 const cylinder=(parent,m,rt,rb,h,p,segs=ringSegments)=>mesh(parent,new THREE.CylinderGeometry(rt,rb,h,segs),m,p);
 function group(parent,name){const g=new THREE.Group();g.name=name;parent.add(g);return g;}
 function place(g,x,y,height){
  // One world vertical unit projects 3.787% of house-image height with the
  // retained orthographic camera. Adjust floor projection before elevation.
  g.position.copy(world(x,y+height*3.787));g.position.y=height;
 }
 function makeCup(parent,name='Ceramic coffee cup'){
  const g=group(parent,name);
  const points=[[.045,0],[.064,.012],[.074,.118],[.066,.125],[.061,.117],[.055,.023],[.043,.017]].map(p=>new THREE.Vector2(...p));
  mesh(g,new THREE.LatheGeometry(points,ringSegments),ceramic);
  const handle=mesh(g,new THREE.TorusGeometry(.045,.012,software?5:8,ringSegments),ceramic,[.085,.07,0]);handle.rotation.y=Math.PI/2;
  cylinder(g,ceramic,.115,.115,.012,[0,-.005,0]);
  const liquid=cylinder(g,coffeeColor,.059,.059,.004,[0,.025,0]);
  return {g,liquid};
 }
 function steam(parent,count=3){
  const wisps=[];
  for(let i=0;i<count;i++){
   const points=[];for(let k=0;k<7;k++)points.push(new THREE.Vector3(Math.sin(k*.85+i)*.014,k*.035,Math.cos(k*.7+i)*.009));
   const m=material(0xf9f5e9,.9,{transparent:true,opacity:.15,depthWrite:false});
   const w=mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),software?6:10,.006,software?3:5,false),m);w.visible=false;wisps.push(w);
  }
  return wisps;
 }
 function updateSteam(wisps,time,amount,origin){if(amount<=.03){if(wisps[0].visible)for(const w of wisps)w.visible=false;return;}wisps.forEach((w,i)=>{const phase=(time*.6+i*.32)%1;w.visible=amount>.03;w.position.set(origin[0]+Math.sin(time*.7+i)*.016,origin[1]+phase*.09,origin[2]+Math.cos(time*.4+i)*.012);w.scale.setScalar(.7+phase*.65);w.material.opacity=amount*.22*Math.sin(Math.PI*phase);});}

 const brewer=group(root,'Espresso machine on the counter');place(brewer,...KITCHEN_PLACEMENT.coffee,KITCHEN_PLACEMENT.counterHeight);
 // Compact26×32×29cm capsule brewer at4/3 scene units per metre.
 brewer.scale.set(.55,.74,.8);
 // Capsule-machine silhouette: warm steel body, recessed brewing opening,
 // water reservoir, drip tray, extraction head and separate cup.
 box(brewer,dark,.53,.045,.48,[0,.023,0]);
 box(brewer,steel,.52,.52,.24,[0,.29,-.09]);
 box(brewer,dark,.38,.34,.05,[0,.23,.055]);
 for(const x of [-.24,.24])box(brewer,steel,.045,.47,.35,[x,.27,-.02]);
 box(brewer,steel,.45,.08,.33,[0,.49,-.025]);
 box(brewer,dark,.50,.045,.34,[0,.55,-.03]);
 const lever=group(brewer,'Hinged capsule lid');lever.position.set(0,.579,-.18);
 box(lever,steel,.46,.014,.30,[0,0,.15]);
 box(brewer,glass,.11,.42,.19,[-.32,.24,-.10]);
 box(brewer,steel,.39,.015,.27,[0,.06,.10]);
 for(let i=0;i<7;i++)box(brewer,dark,.012,.006,.21,[-.15+i*.05,.071,.10]);
 const coffeeNozzle=cylinder(brewer,steel,.035,.027,.06,[0,.405,.13]);
 const brewIndicator=material(0xbacf99,.43,{emissive:0x97c886,emissiveIntensity:.14});
 const brewLight=cylinder(brewer,brewIndicator,.018,.018,.012,[.14,.574,.135]);
 const coffeeCup=makeCup(brewer);coffeeCup.g.position.set(0,.08,.13);
 // Keep the cup9.4cm tall instead of shrinking it with the appliance.
 coffeeCup.g.scale.set(1/.55,1/.74,1/.8);
 const coffeeStream=cylinder(root,coffeeColor,.008,.008,1,[0,0,0],6);coffeeStream.visible=false;
 const brewFrom=new THREE.Vector3(),brewTo=new THREE.Vector3(),brewDirection=new THREE.Vector3(),steamOrigin=new THREE.Vector3();
 const coffeeSteam=steam(brewer);
 const milkCarton=group(brewer,'Milk beside the coffee');
 box(milkCarton,white,.10,.20,.10,[0,.10,0]);box(milkCarton,green,.103,.055,.103,[0,.035,0]);
 const milkTop=box(milkCarton,white,.105,.06,.085,[0,.22,0]);milkTop.rotation.z=.2;
 cylinder(milkCarton,cream,.018,.018,.012,[.027,.255,.01],8);milkCarton.position.set(.37,0,.10);milkCarton.visible=false;

 const microwave=group(root,'Countertop microwave');place(microwave,...KITCHEN_PLACEMENT.microwave,KITCHEN_PLACEMENT.counterHeight);
 microwave.scale.setScalar(.8); //54cm cabinet width; hinges and contents share the scale.
 const mwW=.90,mwH=.48,mwD=.57;
 box(microwave,steel,mwW,.045,mwD,[0,mwH,0]);box(microwave,steel,mwW,.045,mwD,[0,.024,0]);
 box(microwave,steel,.035,mwH,mwD,[-mwW/2+.017,mwH/2,0]);box(microwave,steel,.035,mwH,mwD,[mwW/2-.017,mwH/2,0]);
 box(microwave,dark,mwW,mwH,.035,[0,mwH/2,-mwD/2]);
 box(microwave,cream,.68,.32,.025,[-.06,.235,-.24]);
 box(microwave,cream,.68,.025,.48,[-.06,.072,0]);
 const ovenLight=box(microwave,warm,.08,.20,.025,[-.36,.25,-.12]);ovenLight.visible=false;
 const turntable=group(microwave,'Rotating glass plate');turntable.position.set(-.06,.095,.01);
 cylinder(turntable,glass,.23,.23,.012,[0,0,0],software?16:28);
 const bowl=group(turntable,'Leftover rice bowl');
 const bowlProfile=[[.10,.008],[.16,.04],[.17,.11],[.16,.12],[.145,.105],[.09,.025]].map(p=>new THREE.Vector2(...p));
 mesh(bowl,new THREE.LatheGeometry(bowlProfile,ringSegments),ceramic);
 cylinder(bowl,white,.143,.11,.025,[0,.085,0]);
 for(let i=0;i<8;i++){const a=i*2.4,r=i%2?.08:.04;box(bowl,i%3?orange:green,.033,.022,.024,[Math.cos(a)*r,.109,Math.sin(a)*r]);}
 bowl.visible=false;
 const door=group(microwave,'Microwave door hinge');door.position.set(-.45,.245,.30);
 box(door,dark,.72,.45,.035,[.36,0,0]);
 // Four narrow frame rails leave a real window into the lighted cavity.
 box(door,steel,.72,.035,.045,[.36,.211,.015]);box(door,steel,.72,.035,.045,[.36,-.211,.015]);
 box(door,steel,.025,.41,.045,[.015,0,.015]);box(door,steel,.025,.41,.045,[.705,0,.015]);
 // The opaque inner panel is only the frame. The center is translucent glass.
 door.children[0].geometry.dispose();geometries.delete(door.children[0].geometry);door.remove(door.children[0]);
 const windowGlass=material(0x182620,.25,{transparent:true,opacity:.60,depthWrite:false});
 box(door,windowGlass,.66,.36,.012,[.36,0,.012]);
 const windowMesh=material(0x18231d,.75,{transparent:true,opacity:.36,depthWrite:false});
 for(let i=0;i<8;i++)box(door,windowMesh,.64,.003,.003,[.36,-.15+i*.043,.021]);
 box(door,steel,.028,.29,.065,[.655,0,.059]);
 box(microwave,dark,.16,.45,.045,[.365,.245,.305]);
 for(const yy of [.13,.19])cylinder(microwave,steel,.018,.018,.012,[.368,yy,.337],8).rotation.x=Math.PI/2;
 const digits=[];
 function digit(x){
  const g=group(microwave,'Countdown digit');g.position.set(x,.365,.332);const seg={};
  const horizontal=(name,y)=>{seg[name]=box(g,segMat,.022,.004,.003,[0,y,0]);};
  const vertical=(name,x,y)=>{seg[name]=box(g,segMat,.004,.023,.003,[x,y,0]);};
  horizontal('a',.027);horizontal('g',0);horizontal('d',-.027);vertical('b',.012,.014);vertical('c',.012,-.014);vertical('f',-.012,.014);vertical('e',-.012,-.014);
  return seg;
 }
 for(let i=0;i<4;i++)digits.push(digit(.305+i*.033));
 const colon=[];for(const y of [.354,.373])colon.push(box(microwave,segMat,.0035,.0035,.004,[.355,y,.334]));
 let displayedSeconds=-1;
 function showTime(seconds){const value=Math.max(0,Math.ceil(seconds));if(value===displayedSeconds)return;displayedSeconds=value;const text='00'+String(value).padStart(2,'0');digits.forEach((seg,i)=>Object.entries(seg).forEach(([name,m])=>m.visible=DIGITS[Number(text[i])].includes(name)));}
 const foodSteam=steam(microwave,2),foodSteamOrigin=[-.06,.25,.15],cupSteamOrigin=[0,0,0];
 const faucet=group(root,'Kitchen tap');place(faucet,49.48,24.85,1.53);
 const tapWater=material(0xb1d6db,.22,{transparent:true,opacity:.66,depthWrite:false});
 const water=cylinder(faucet,tapWater,.010,.015,.28,[0,-.14,0],6);water.castShadow=false;
 water.visible=false;let waterFlow=0;

 const prep=group(root,'Fresh preparation on the island');place(prep,...KITCHEN_PLACEMENT.prep,KITCHEN_PLACEMENT.counterHeight+.015);
 box(prep,wood,.62,.025,.37,[0,.014,0]);
 const cucumber=cylinder(prep,green,.037,.037,.28,[-.06,.052,-.05],10);cucumber.rotation.z=Math.PI/2;
 const slices=[];for(let i=0;i<5;i++){const m=cylinder(prep,green,.037,.037,.013,[.10+i*.035,.042,-.04],10);m.rotation.z=Math.PI/2;slices.push(m);}
 for(let i=0;i<4;i++)box(prep,orange,.045,.035,.035,[-.17+(i%2)*.06,.04,.07+Math.floor(i/2)*.05]);
 const bowlPrep=group(prep,'Prepared vegetables');bowlPrep.position.set(.40,0,.01);
 mesh(bowlPrep,new THREE.LatheGeometry([[.07,0],[.13,.025],[.15,.13],[.14,.14],[.12,.12],[.06,.02]].map(p=>new THREE.Vector2(...p)),ringSegments),cream);
 for(let i=0;i<7;i++)box(bowlPrep,i%2?green:orange,.045,.036,.04,[Math.sin(i*2.3)*.07,.055+(i%3)*.018,Math.cos(i*2.3)*.07]);
 const pourStream=cylinder(root,cream,.009,.009,1,[0,0,0],6);pourStream.visible=false;
 const milkA=new THREE.Vector3(),milkB=new THREE.Vector3(),mid=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 const tennis=mesh(root,new THREE.SphereGeometry(.064,software?10:18,software?7:12),material(0xb8c75f,.97));tennis.name='Rolling tennis ball';tennis.visible=false;
 const seamMaterial=material(0xe5e4b8,.9);
 for(const angle of [-.55,.55]){const seam=mesh(tennis,new THREE.TorusGeometry(.0645,.002,3,software?16:28),seamMaterial);seam.rotation.x=angle;seam.rotation.y=Math.PI/2;}
 const ballStart=new THREE.Vector3(),ballEnd=new THREE.Vector3(),dogMouth=new THREE.Vector3();
 const states={coffee:'off',microwave:'off',milk:'returned',vegetables:'off',ball:'off'};
 let ballPhase='off',ballAge=0,throwObserved=false;
 let stageId='',elapsed=0,coffeeAge=0,microwaveAge=0,brewFill=0,mwRemaining=0,doorAngle=0;
 function applyProps(props={}){
  if(props.coffee&&props.coffee!==states.coffee){states.coffee=props.coffee;coffeeAge=0;if(props.coffee==='loading')brewFill=0;}
  if(props.microwave&&props.microwave!==states.microwave){states.microwave=props.microwave;microwaveAge=0;if(props.microwave==='warming')mwRemaining=30;}
  if(props.milk)states.milk=props.milk;
  if(props.vegetables)states.vegetables=props.vegetables;
  if(props.ball&&props.ball!==states.ball){states.ball=props.ball;if(props.ball==='play'){ballPhase='waiting';ballAge=0;throwObserved=false;}if(props.ball==='off'){ballPhase='off';tennis.visible=false;}}
 }
 function setStage(sc={}){stageId=sc.id||'';elapsed=0;applyProps(sc.props||{});}
 function reset(){states.coffee='off';states.microwave='off';states.milk='returned';states.vegetables='off';states.ball='off';ballPhase='off';ballAge=0;throwObserved=false;tennis.visible=false;waterFlow=0;elapsed=coffeeAge=microwaveAge=brewFill=mwRemaining=doorAngle=0;update(0,0,[]);}
 const gripPoint=new THREE.Vector3();
 function bindActor(actor){
  if(actor.actionHandTargets?.owner==='appliance')delete actor.actionHandTargets;
  if(actor.state!=='doing'||actor.actionHandTargets||!Number.isFinite(actor.actionProgress))return;
  const p=actor.actionProgress,pose=actor.activityPose;let weight;
  const atBrewer=actor.node==='brewer',atOven=actor.node==='coffee';
  if(pose==='press-button'&&(atBrewer||atOven)){
   if(atBrewer)brewLight.localToWorld(gripPoint.set(0,.009,.012));
   else microwave.localToWorld(gripPoint.set(.368,.13,.35));
   weight=smooth(p/.38)*(1-smooth((p-.65)/.35));
  }else if(atBrewer&&pose==='reach'&&states.coffee==='loading'){
   lever.localToWorld(gripPoint.set(.13,0,.29));
   weight=smooth(p/.20)*(1-smooth((p-.80)/.20));
  }else return;
  // Stage actions assign one operator at a time to each of these appliances.
  // Keep separate targets when two family members work at once.
  const contact=actor.model.applianceContact??={owner:'appliance',right:new THREE.Vector3()};
  contact.right.copy(gripPoint);contact.rightWeight=weight;actor.actionHandTargets=contact;
 }
 function update(time,dt,cast=[]){
  const delta=clamp(dt,0,.2);elapsed+=delta;coffeeAge+=delta;microwaveAge+=delta;
  const coffeeState=states.coffee,microState=states.microwave;
  const brewing=coffeeState==='brewing',barista=cast[0];
  const atBrewer=barista?.node==='brewer'&&barista.state==='doing';
  const loading=coffeeState==='loading'&&atBrewer&&barista.activityPose==='reach';
  const lift=loading?clamp(barista.actionProgress??coffeeAge/.9):0;
  lever.rotation.x=-.74*smooth(lift/.36)*(1-smooth((lift-.53)/.47));
  const pressing=atBrewer&&barista.activityPose==='press-button';
  brewLight.position.y=.574-(pressing?.009*Math.sin(Math.PI*clamp(barista.actionProgress??0)):0);
  const washing=cast.some(c=>c?.node==='sink'&&c.state==='doing'&&c.activityPose==='wash');
  waterFlow=blend(waterFlow,washing?1:0,1-Math.exp(-delta*(washing?15:25)));
  water.visible=waterFlow>.025;
  if(water.visible){water.scale.set(.74+.26*waterFlow,waterFlow,.74+.26*waterFlow);water.position.y=-.14*waterFlow;}

  if(brewing)brewFill=clamp(brewFill+delta/5.8);else if(['ready','served','at-island'].includes(coffeeState))brewFill=1;
  const pouring=cast[0]?.state!=='walking'&&cast[0]?.activityPose==='pour';
  const drinking=cast[0]?.state!=='walking'&&cast[0]?.activityPose==='drink';
  coffeeCup.g.visible=!pouring&&!drinking&&!['served','at-island'].includes(coffeeState);
  coffeeCup.liquid.position.y=.025+brewFill*.075;
  coffeeStream.visible=brewing&&brewFill<1&&coffeeAge>.25;
  if(coffeeStream.visible){
   coffeeNozzle.localToWorld(brewFrom.set(0,-.03,0));coffeeCup.liquid.getWorldPosition(brewTo);
  root.worldToLocal(brewFrom);root.worldToLocal(brewTo);
  coffeeStream.position.copy(brewFrom).add(brewTo).multiplyScalar(.5);
  coffeeStream.scale.set(.88+.12*Math.sin(time*19),brewFrom.distanceTo(brewTo),.88+.12*Math.sin(time*19));
  coffeeStream.quaternion.setFromUnitVectors(up,brewDirection.copy(brewFrom).sub(brewTo).normalize());
  }
  brewLight.material.emissiveIntensity=brewing?.32+.2*Math.sin(time*5):.14;
  milkCarton.visible=states.milk==='out'&&!pouring;
  const steamAmount=brewing?brewFill:brewFill&&coffeeCup.g.visible?.65:0;
  if(steamAmount>.03){coffeeCup.g.localToWorld(steamOrigin.set(0,.135,0));brewer.worldToLocal(steamOrigin).toArray(cupSteamOrigin);}
  updateSteam(coffeeSteam,time,steamAmount,cupSteamOrigin);
  // Loading opens the physical hinge, moves the bowl into the cavity, then
  // closes. A later warming state keeps the door closed and plate rotating.
  let desiredDoor=0,bowlZ=0;
  if(microState==='loading'){
   desiredDoor=-1.22*smooth(microwaveAge/.30)*(1-smooth((microwaveAge-1.0)/.30));
   bowlZ=.49*(1-smooth((microwaveAge-.25)/.7));
  }else if(microState==='ready')desiredDoor=-1.22*smooth(microwaveAge/.4);
  doorAngle=blend(doorAngle,desiredDoor,1-Math.exp(-delta*12));door.rotation.y=doorAngle;
  bowl.visible=microState==='warming'||microState==='loading'&&microwaveAge>=.8||microState==='ready'&&microwaveAge<.945;
  bowl.position.z=bowlZ;
  if(microState==='warming'){
   mwRemaining=Math.max(0,mwRemaining-delta);turntable.rotation.y+=delta*1.2;
  }
  ovenLight.visible=microState==='warming'||microState==='ready';
  windowGlass.opacity=ovenLight.visible?.34:.60;
  showTime(microState==='warming'?mwRemaining:0);
  colon.forEach(m=>m.visible=microState!=='warming'||Math.floor(time*2)%2===0);
  updateSteam(foodSteam,time,microState==='ready'?.75:0,foodSteamOrigin);
  prep.visible=['preparing','ready'].includes(states.vegetables);
  if(prep.visible)slices.forEach((slice,i)=>slice.position.x=.10+i*.035+(states.vegetables==='preparing'?.003*Math.sin(time*4+i):0));
  // Milk pours between real animated hands. The actor rig owns the carton and
  // mug; this stream disappears immediately if the actor leaves the task.
  const hands=cast[0]?.model?.hands;
  pourStream.visible=pouring&&!!hands;
  if(pourStream.visible){
   const milkProp=cast[0].model.props?.milk||hands[1],cupProp=cast[0].model.props?.leftCup||hands[0];
   milkProp.localToWorld(milkA.set(.015,.0755,0));cupProp.localToWorld(milkB.set(0,.032,0));
   root.worldToLocal(milkA);root.worldToLocal(milkB);
   const distance=milkA.distanceTo(milkB);pourStream.visible=distance>.02&&distance<.9;
   if(pourStream.visible){mid.addVectors(milkA,milkB).multiplyScalar(.5);pourStream.position.copy(mid);pourStream.scale.y=distance;pourStream.quaternion.setFromUnitVectors(up,brewDirection.copy(milkA).sub(milkB).normalize());}
  }
  // One throw owns one visible ball. It stays at its landing point instead
  // of looping, and transfers to the dog's mouth only at collection.
  const noah=cast[3],dog=cast[4],mouth=dog?.model?.props?.ball;
  if(mouth&&states.ball!=='off')mouth.visible=false;
  const throwing=noah?.state==='doing'&&noah?.activityPose==='throw-ball';
  if(ballPhase==='waiting'&&throwing){
   if(!throwObserved){throwObserved=true;ballAge=0;}ballAge+=delta;
   const grip=noah.model?.hands?.[1];
   if(grip)grip.getWorldPosition(ballStart);else{ballStart.copy(world(noah.x,noah.y));ballStart.y=.45;}
   tennis.visible=true;tennis.position.copy(ballStart);
   const progress=Number.isFinite(noah.actionProgress)?noah.actionProgress:ballAge/1.2;
   if(progress>=.40){
    ballPhase='rolling';ballAge=0;ballEnd.copy(dog?.model?.g?.position||world(noah.x+4,noah.y));ballEnd.y=.064;
    if(dog){const toward=ballStart.clone().sub(ballEnd);toward.y=0;toward.normalize();ballEnd.addScaledVector(toward,.24);}
   }
  }else if(ballPhase==='rolling'){
   ballAge+=delta;const t=clamp(ballAge/1.2),ease=1-(1-t)*(1-t);
   tennis.position.lerpVectors(ballStart,ballEnd,ease);
   tennis.position.y=t<.42?Math.max(.064,blend(ballStart.y,.064,t/.42)):.064+.025*Math.sin((t-.42)/.58*Math.PI)*Math.exp(-(t-.42)*6);
   tennis.rotation.x-=delta*6;tennis.rotation.z+=delta*2;
   if(t===1){ballPhase='resting';tennis.position.copy(ballEnd);}
  }
  if(ballPhase==='resting'&&(states.ball==='with-dog'||dog?.activityPose==='fetch')&&mouth&&dog){
   const ground=dog.model.g.position;const gap=Math.hypot(ground.x-tennis.position.x,ground.z-tennis.position.z);
   if(gap<.78){ballPhase='retrieved';tennis.visible=false;}
  }
  if(ballPhase==='retrieved'&&mouth){mouth.visible=true;tennis.visible=false;}
  root.userData.applianceState={stageId,ballPhase,ballVisible:tennis.visible,coffee:coffeeState,coffeeFill:brewFill,microwave:microState,microwaveSeconds:mwRemaining,doorAngle,bowlVisible:bowl.visible,steamVisible:coffeeSteam.some(s=>s.visible)};
 }
 if(software)root.traverse(part=>{if(part.isMesh)part.userData.cacheProjectedVertices=true;});
 reset();
 return {root,setStage,applyProps,bindActor,update,reset,getState:()=>({...root.userData.applianceState}),parts:{brewer,lever,brewLight,water,coffeeNozzle,microwave,door,turntable,bowl,coffeeCup:coffeeCup.g,coffeeStream,prep,pourStream,tennis},dispose(){root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
