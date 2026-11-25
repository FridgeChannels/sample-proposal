import * as THREE from './engine.js';
import {DepthRenderer} from './DepthRenderer.js';
import {createHuman} from './characters.js';
import {poseHuman} from './human-motion.js';
import {createParcel,attachParcelToHands} from './parcel-model.js';
import {createDeliveryTruck} from './truck-model.js';
import {createFrontYard,groundHeightAt} from './yard-scene.js';
import {createDeliveryTimeline,pointAlongRoute,deliveryBeats} from './delivery-timeline.js';
export {deliveryBeats};
const stylesheet=new URL('./delivery-scene.css',import.meta.url).href;
if(!document.querySelector(`link[href="${stylesheet}"]`)){const link=document.createElement('link');link.rel='stylesheet';link.href=stylesheet;document.head.append(link);}
const smooth=t=>t*t*(3-2*t),lerp=(a,b,t)=>a+(b-a)*t;

/** Outdoor action shares the house projection. It never covers the chat panel. */
export function createDeliveryScene(host,{photographicYard=false,onDoorbell=()=>{},onComplete=()=>{},onBeat=()=>{}}={}){
 const root=document.createElement('div');root.className='map-delivery';root.setAttribute('aria-label','Landscaped front yard and three-dimensional UPS delivery');
 root.innerHTML='<canvas class="map-delivery-actors" aria-label="Front yard, moving UPS vehicle and delivery driver"></canvas><i class="map-delivery-bell" aria-hidden="true"></i>';
 host.append(root);
 const canvas=root.querySelector('canvas'),bell=root.querySelector('.map-delivery-bell');
 const scene=new THREE.Scene();let renderer,software=false;
 try{if(new URLSearchParams(location.search).get("render")==="compat")throw new Error("Compatibility rendering selected");renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}
 catch{software=true;renderer=new DepthRenderer({canvas,scale:.72,maxDimension:1100});renderer.setClearColor(0,0);scene.add(new THREE.AmbientLight(0x858b7b,.4));}
 const baseCamera=new THREE.OrthographicCamera(-11,11,8.25,-8.25,.1,100);baseCamera.position.set(0,20,16);baseCamera.lookAt(0,0,0);baseCamera.updateMatrixWorld();
 const camera=baseCamera.clone();scene.add(new THREE.HemisphereLight(0xfff3dc,0x73715c,1.35));const sun=new THREE.DirectionalLight(0xffe4b9,software?.55:2.25);sun.position.set(-8,16,17);sun.target.position.set(0,0,19);scene.add(sun.target);sun.castShadow=!software;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-25,right:25,top:24,bottom:-24});sun.shadow.bias=-.00025;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun);const fill=new THREE.DirectionalLight(0xe4efff,software?.15:.8);fill.position.set(8,7,-7);scene.add(fill);
 const ray=new THREE.Raycaster(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 function world(x,y){ray.setFromCamera(new THREE.Vector2(x/50-1,1-y/50),baseCamera);return ray.ray.intersectPlane(floor,new THREE.Vector3());}
 const yard=photographicYard?null:createFrontYard(THREE,world,{software});if(yard)scene.add(yard.group);
 const truck=createDeliveryTruck(THREE,{software});scene.add(truck.group);truck.group.visible=false;
 if(!software){const a=world(-3,99),b=world(103,153),catcher=new THREE.Mesh(new THREE.PlaneGeometry(b.x-a.x,b.z-a.z),new THREE.ShadowMaterial({opacity:.16}));catcher.rotation.x=-Math.PI/2;catcher.position.copy(a).add(b).multiplyScalar(.5);catcher.position.y=-.01;catcher.receiveShadow=true;scene.add(catcher);}
 const model=createHuman(THREE,1,{software});model.g.scale.setScalar(2.34/model.naturalHeight);scene.add(model.g);
 const colors={0:0xbf9c84,1:0x594634,2:0x51402f,3:0x272826,4:0x34281e};
 model.mesh.material.forEach((m,i)=>{if(colors[i]!==undefined)m.color.setHex(colors[i]);});
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.115,software?8:20,software?5:12,0,Math.PI*2,0,Math.PI*.55),new THREE.MeshStandardMaterial({color:0x584431,roughness:.9}));cap.position.set(0,.12,0);model.head.add(cap);
 const brim=new THREE.Mesh(new THREE.BoxGeometry(.20,.014,.12),cap.material);brim.position.set(0,.115,.095);model.head.add(brim);
 const badge=new THREE.Mesh(new THREE.PlaneGeometry(.047,.056),new THREE.MeshStandardMaterial({color:0xcfa861,side:THREE.DoubleSide,roughness:.8}));badge.position.set(-.13,1.39,.105);model.rig.add(badge);
 const parcel=createParcel(THREE,{software});scene.add(parcel);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.28,software?12:28),new THREE.MeshBasicMaterial({color:0x463e2c,transparent:true,opacity:.12,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.y=.65;scene.add(shadow);
 const actor={cell:6,model,x:75,y:110,speed:5.7,speedNow:0,state:'doing',activityPose:'stand',carrying:false};
 let ratio=1.50,lastRender=-1,stopped=true,lastHeading=Math.PI,parcelHidden=false,environmentTime=0;
 function resize(){
  const house=host.querySelector('#scene'),width=host.clientWidth||800,height=host.clientHeight||744,houseHeight=house?.clientHeight||width*.75;
  ratio=height/houseHeight;camera.top=8.25;camera.bottom=8.25-16.5*ratio;camera.updateProjectionMatrix();renderer.setSize(width,height);root.style.setProperty('--house-ratio',String(1/ratio));
 }
 const observer=new ResizeObserver(()=>{resize();if(!stopped)draw(timeline.getState(),0);else if(yard?.group.visible)renderer.render(scene,camera);});observer.observe(host);
 function position(element,x,y){element.style.left=x+'%';element.style.top=y/ratio+'%';}
 function angleToward(x,y,tx,ty){const a=world(x,y),b=world(tx,ty);return Math.atan2(b.x-a.x,b.z-a.z);}
 function draw(state,dt){
  const {beat,progress:p,elapsed}=state;root.dataset.beat=beat;root.dataset.action=beat;
  yard?.update(environmentTime+elapsed);
  const truckX=beat==='arrival'?lerp(134,38,1-Math.pow(1-p,2.4)):beat==='depart'?lerp(38,-32,p*p):38;
  // Turn gently into the final parking position, then straighten on departure.
  // Yaw is the derivative of this curve, so rotating the van never makes it
  // slide sideways relative to its tyres.
  const turn=Math.max(0,Math.min(1,(50-truckX)/12));
  const parkY=141,approachY=parkY-.75;
  let truckY=parkY,yaw=.12;
  if(beat==='arrival'){truckY=approachY+.75*turn*turn;yaw=Math.atan(1.5*turn/12*.75/.781);}
  if(beat==='depart'){const d=Math.max(0,38-truckX);truckY=parkY+.48*(1-Math.exp(-d/3.8));yaw=Math.atan(.48/3.8*.75/.781*Math.exp(-d/3.8));}
  truck.group.position.copy(world(truckX,truckY));truck.group.rotation.y=Math.min(.16,yaw);truck.group.visible=true;
  const doorOpen=beat==='exit'?smooth(Math.min(1,p*3)):['carry','place','doorbell','return'].includes(beat)?1:beat==='cab'?1-smooth(Math.max(0,(p-.72)/.28)):0;
  truck.update({x:truck.group.position.x,z:truck.group.position.z,doorOpen,dt,time:elapsed,moving:['arrival','depart'].includes(beat),braking:beat==='arrival'&&p>.60});
  model.g.visible=!['arrival','depart'].includes(beat);shadow.visible=model.g.visible;bell.classList.toggle('ringing',beat==='doorbell');position(bell,48.2,84.8);
  actor.carrying=['exit','carry'].includes(beat);actor.state=['exit','carry','return','cab'].includes(beat)?'walking':'doing';actor.speedNow=actor.state==='walking'?5.7:0;actor.activityPose='stand';
  let x=48,y=91,footLift=0,target=[48,84];
  if(beat==='exit'){const t=smooth(Math.max(0,(p-.2)/.8));x=32.7;y=lerp(146.6,149.4,t);footLift=.79*(1-t);target=[32.7,149.4];if(p<.16)model.g.visible=false;}
  if(beat==='carry'||beat==='return'){const pos=pointAlongRoute(p,beat==='return');x=pos.x;y=pos.y;target=pos.target;}
  if(beat==='cab'){const t=smooth(Math.min(1,p/.78));x=32.7;y=lerp(149.4,146.6,t);footLift=.79*t;target=[32.7,146.6];if(p>.78)model.g.visible=false;}
  actor.x=x;actor.y=y;model.g.position.copy(world(x,y));model.g.position.y+=footLift+groundHeightAt(x,y);
  const desired=angleToward(x,y,target[0],target[1]);if(Number.isFinite(desired))lastHeading+=Math.atan2(Math.sin(desired-lastHeading),Math.cos(desired-lastHeading))*Math.min(1,dt*13||1);
  model.g.rotation.y=lastHeading;poseHuman(actor,elapsed,dt,{seatConfig:{}});
  const bend=beat==='place'?Math.sin(Math.PI*p):0;
  if(bend){model.rig.position.y=-.27*bend;model.rig.rotation.x=.10*bend;model.legs.forEach(l=>{l.thigh.rotation.x=-.9*bend;l.knee.rotation.x=1.7*bend;l.foot.rotation.x=-.8*bend;});model.arms.forEach(a=>{a.shoulder.rotation.x=-.1;a.elbow.rotation.x=-1.06*(1-bend)-.15*bend;});model.head.rotation.x=.16*bend;}
  if(beat==='doorbell'){const reach=Math.sin(Math.PI*Math.min(1,p*1.2));model.arms[1].shoulder.rotation.x=-1.24*reach;model.arms[1].elbow.rotation.x=-.12-.15*reach;model.head.rotation.x=-.035;}
  if(beat==='exit'||beat==='cab'){model.arms[0].shoulder.rotation.x=-.8;model.arms[0].elbow.rotation.x=-.45;}
  model.g.updateMatrixWorld(true);
  const atDoor=world(48,89);atDoor.y=(parcel.userData.dimensions.height/2)*model.g.scale.y;
  parcel.visible=beat!=='arrival'&&!parcelHidden;
  if(['exit','carry'].includes(beat)){attachParcelToHands(parcel,model);parcel.scale.setScalar(1);}
  else if(beat==='place'){attachParcelToHands(parcel,model);parcel.scale.setScalar(1);const held=parcel.getWorldPosition(new THREE.Vector3());scene.attach(parcel);parcel.position.lerpVectors(held,atDoor,smooth(Math.min(1,p*1.65)));parcel.rotation.set(0,model.g.rotation.y,0);}
  else{if(parcel.parent!==scene)scene.attach(parcel);parcel.scale.setScalar(model.g.scale.y);parcel.position.copy(atDoor);parcel.rotation.set(0,.08,0);}
  shadow.position.copy(world(x,y));shadow.position.y=.01;shadow.visible=model.g.visible;
  if(model.g.visible)model.update();
  if(!software||elapsed-lastRender>.09||dt===0){renderer.render(scene,camera);lastRender=elapsed;}
 }
 const timeline=createDeliveryTimeline({onBeat,onDoorbell,onComplete});
 model.g.visible=false;parcel.visible=false;shadow.visible=false;resize();if(yard)renderer.render(scene,camera);
 return{
  start(){stopped=false;parcelHidden=false;root.hidden=false;resize();model.motion=null;truck.reset();lastRender=-1;const state=timeline.start();draw(state,0);},
  tick(dt){if(stopped)return;const state=timeline.tick(dt);if(!stopped)draw(state,dt);},
  stop(){if(stopped)return;stopped=true;timeline.stop();truck.group.visible=false;model.g.visible=false;parcel.visible=false;shadow.visible=false;bell.classList.remove('ringing');root.dataset.beat='idle';renderer.render(scene,camera);},
  tickEnvironment(time,dt){environmentTime=time;if(stopped&&yard?.group.visible){yard.update(time);if(!software||time-lastRender>.14){renderer.render(scene,camera);lastRender=time;}}},
  setYardVisible(visible){if(!yard)return;yard.group.visible=Boolean(visible);renderer.render(scene,camera);},
  hideParcel(){parcelHidden=true;parcel.visible=false;},
  isActive(){return timeline.getState().active;},getState(){return timeline.getState();},resize,element:root,duration:timeline.duration
 };
}
