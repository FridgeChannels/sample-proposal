import {dailyEncounters} from './household-day.js';
import * as THREE from './engine.js';
import {DepthRenderer} from './DepthRenderer.js';
import {nodes,route,tasks,cast,distance} from './simulation.js';
import {profiles,familyScenes} from './family-data.js';
import {createChatPanel} from './chat-panel.js';
import {createHouseholdImpact,renderImpact} from './household-impact.js';
import {createHouseholdDirector} from './household.js';
import {createFirstPerson} from './first-person.js?v=21';
import {createHuman,loadHumanModels} from './characters.js';
import {poseHuman,canMoveHuman,prepareHumanForTravel} from './human-motion.js';
import {createCrowdStepper} from './crowd.js';
import {createDailyObjects} from './daily-objects.js';
import {petFits,wallClearance} from './architecture.js';
import {createDepthOccluders,seatConfig,occlusionPolygonsForActor,obstacleFootprints,pointInPolygon} from './spatial.js';
import {snackStory,SNACK_BRAND} from './snack-story.js';
import {tickPerformance,requestInstallation} from './performance.js';
import {createDeliveryScene} from './delivery-scene.js?v=20';
import {createParcel,attachParcelToHands} from './parcel-model.js';
import {createHouseholdProductProps} from './physical-props.js';
import {createDoorway} from './doorway.js?v=21';
import {householdPlays,nextChapter} from './household-plays.js';
import {createPet,posePet,canMovePet} from './pets.js';
import {createExposureTracker} from './exposure-tracker.js';
import {createStageCamera} from './stage-camera.js';
import {createStoryGuide} from './story-guide.js?v=21';
import {createCharacterBubbles} from './character-bubbles.js';
import {createKitchenProps} from './kitchen-props.js';
import {stageArrived,createStageActions,setActorPose} from './stage-actions.js';
let guide=null,stageCamera=null,garden=null;
let lapPhase='ready',lapClock=7;
let stages=snackStory,currentPlay='enter',enteredBrand='',hasMagnet=false,runId=0;
profiles.forEach((p,i)=>{p.index=i;cast[i].name=p.name;});
const canvas=document.querySelector('#world'), scene=new THREE.Scene();
let renderer,software=false;try{if(new URLSearchParams(location.search).get("render")==="compat")throw new Error("Compatibility rendering selected");renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;}catch(e){software=true;renderer=new DepthRenderer({scale:.85,maxDimension:1000});renderer.setClearColor(0,0);canvas.style.visibility='hidden';renderer.domElement.id='software-world';canvas.after(renderer.domElement);scene.add(new THREE.AmbientLight(0xffffff,.15));}
const camera=new THREE.OrthographicCamera(-11,11,8.25,-8.25,.1,100);camera.position.set(0,20,16);camera.lookAt(0,0,0);camera.updateMatrixWorld();
scene.add(new THREE.HemisphereLight(0xfff3dc,0x73715c,1.35));const sun=new THREE.DirectionalLight(0xffe4b9,2.25);sun.position.set(-8,16,7);if(software)sun.intensity=.65;sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15});sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun);const fill=new THREE.DirectionalLight(0xe4efff,.8);fill.position.set(8,7,-7);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.ShadowMaterial({opacity:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=-.015;ground.receiveShadow=true;if(!software)scene.add(ground);
const ray=new THREE.Raycaster(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),0);function world(x,y){ray.setFromCamera(new THREE.Vector2(x/50-1,1-y/50),camera);return ray.ray.intersectPlane(floor,new THREE.Vector3())}
const materials=new Map();function mat(color,roughness=.85){const key=color+':'+roughness;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness}));return materials.get(key)}
const sphere=new THREE.SphereGeometry(1,software?7:20,software?5:16);
function ell(parent,color,pos,scale){const m=new THREE.Mesh(sphere,mat(color));m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function rod(parent,color,a,b,r1,r2=r1){const len=new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b));const m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,len,software?6:14),mat(color));m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize());m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function segment(parent,color,length,top,bottom){const g=new THREE.Group();parent.add(g);rod(g,color,[0,0,0],[0,-length,0],top,bottom);return g}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
await loadHumanModels({software});
cast.forEach((c,i)=>{c.model=i<4?createHuman(THREE,i,{software}):createPet(THREE,i,{software});if(i<4){c.model.g.scale.setScalar([2.3,2.4,1.85,1.55][i]/c.model.naturalHeight);createDailyObjects(THREE,c.model);}if(i===3){const booster=new THREE.Mesh(new THREE.BoxGeometry(.58,.10,.52),mat(0xc5b69a));booster.scale.setScalar(1/c.model.g.scale.y);booster.position.y=.77/c.model.g.scale.y;booster.visible=false;booster.castShadow=true;c.model.g.add(booster);c.model.booster=booster;}if(i===1){c.model.heldParcel=createParcel(THREE,{software});c.model.heldParcel.visible=false;c.model.rig.add(c.model.heldParcel);}scene.add(c.model.g);if(software){const shadow=new THREE.Mesh(new THREE.CircleGeometry(i<4?.22:.20,18),new THREE.MeshBasicMaterial({color:0x3a3429,transparent:true,opacity:.15,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.y=.62;c.model.contactShadow=shadow;scene.add(shadow);}c.node=c.start;[c.x,c.y]=nodes[c.node];c.state='doing';c.job=c.first;c.remaining=5+i*5;c.speedNow=0;c.phase=i;c.needs=Object.fromEntries(c.jobs.map(j=>[j,Math.random()*15]));c.path=[];c.angle=Math.PI;c.model.g.rotation.y=c.angle;position(c);});
const depthGroup=createDepthOccluders(THREE,world,camera,scene);depthGroup.visible=true;
if(software)renderer.staticOccluders=depthGroup;
const kitchenProps=createKitchenProps(THREE,scene,{software,world});
const householdProps=createHouseholdProductProps(THREE,scene,{software,world});
const stageActions=createStageActions(cast,{onProps:props=>{kitchenProps.applyProps(props);if(props.lunch)householdProps.setLunch(props.lunch);},onPose:orientForActivity,onEvent:applyStoryAction});
function position(c){c.model.g.position.copy(world(c.x,c.y));if(c.outsideBreak&&garden)c.model.g.position.y+=garden.heightAt(c.x,c.y);
 if(c.cell===3&&(c.node==='bedFoot'||c.path?.[0]==='bedFoot'||c.node==='bedEdge')){
  const ascent=Math.max(0,Math.min(1,(nodes.bedEdge[0]-c.x)/(nodes.bedEdge[0]-nodes.bedFoot[0])));
  c.model.g.position.y+=.58*ascent*ascent*(3-2*ascent);
 }if(c.model.contactShadow){c.model.contactShadow.position.copy(world(c.x,c.y));c.model.contactShadow.position.y=c.model.g.position.y+.012;c.model.contactShadow.visible=c.state==='walking'||!String(c.activityPose).startsWith('sit');}}
function pose(c,time,dt){
 const m=c.model,walk=c.state==='walking'&&c.speedNow>.1,activity=walk?'walk':c.activityPose||'stand';
 position(c);if(c.cell===0)householdProps.bindLunchActor(c);if(m.human){householdProps.fridge.bindActor(c);kitchenProps.bindActor(c);}
 let desired=c.angle;
 const seatFacing=!walk&&c.activityPose?.startsWith('sit')&&seatConfig[c.node]?.facing;
 if(seatFacing){const target=world(...seatFacing),base=m.g.position;desired=Math.atan2(target.x-base.x,target.z-base.z);if(!m.motion)m.g.rotation.y=desired;}
 else if(!walk&&c.lookAt){const to=world(...c.lookAt),from=world(c.x,c.y);desired=Math.atan2(to.x-from.x,to.z-from.z);}
 const delta=Math.atan2(Math.sin(desired-m.g.rotation.y),Math.cos(desired-m.g.rotation.y));c.turnLead=delta;const nextAngle=m.g.rotation.y+delta*Math.min(1,dt*7);
 if(m.human||wallClearance(c.x,c.y*.75)>5)m.g.rotation.y=nextAngle;
 else{
  const fits=angle=>petFits(c.cell,c.x,c.y*.75,Math.sin(angle),.781*Math.cos(angle));
  if(fits(nextAngle))m.g.rotation.y=nextAngle;
  else if(fits(desired))m.g.rotation.y=desired;
 }
 if(m.human){poseHuman(c,time,dt,{seatConfig});householdProps.fridge.followHand(c);if(c.cell===0)householdProps.updateLunch(c);if(m.heldParcel){m.heldParcel.visible=!!c.carrying;if(c.carrying)attachParcelToHands(m.heldParcel,m);}if(m.booster)m.booster.visible=c.node==='meal3'&&c.state!=='walking';}else{posePet(c,time,dt);if(c.outsideBreak)c.model.props.ball.visible=lapPhase==='back';}
}
const points=[['Refrigerator',41,27],['Coffee station',55.2,26],['Pantry cabinet',44,20],['Kitchen sink',49,25],['Range hood',58,22],['Laundry',69,24],['Bathroom vanity',30,45],['Pet feeding area',71,36],['Entry hallway',49,81],['Garage workbench',87,9],['Toilet',27,46]];
const spots=document.querySelector('#spots'),status=document.querySelector('#status');
function setMapInteractive(enabled){
 spots.inert=!enabled;
 if(enabled)spots.removeAttribute('aria-hidden');
 else spots.setAttribute('aria-hidden','true');
}
setMapInteractive(false);
points.forEach((p,i)=>{const b=document.createElement('button');b.className='spot';b.style.left=p[1]+'%';b.style.top=p[2]+'%';b.style.animationDelay=-i*.7+'s';b.setAttribute('aria-label',p[0]);b.title=p[0];b.onclick=()=>{if(spots.inert||!brandName())return;spots.querySelectorAll('.spot').forEach(e=>e.classList.remove('selected'));b.classList.add('selected');status.value=p[0];activePoint=i;renderEconomics();};spots.append(b)});
let activePoint=0,period=0;
const panel=document.createElement('section');panel.id='economics';panel.hidden=true;panel.setAttribute('aria-label','Household economics');
panel.innerHTML=`<div class="eco-top"><span class="eco-kicker">IN-HOME ECONOMICS</span><button id="eco-close" aria-label="Close economics">×</button></div><div class="eco-heading"><h2 id="eco-brand"></h2><span id="eco-place"></span></div><div class="eco-tabs" role="group" aria-label="Economics period"><button data-period="0">Year 1</button><button data-period="1">Year 2</button><button data-period="2">2-year total</button></div><div class="eco-hero"><span>Revenue after HOMMIO costs</span><strong id="eco-net"></strong><small>Per repeat-purchase household · before other costs</small></div><div class="eco-metrics"><div><strong id="eco-views"></strong><span>Potential encounters</span></div><div><strong id="eco-taps"></strong><span>Modeled taps</span></div><div><strong id="eco-multiple"></strong><span>Revenue / cost</span></div></div><div class="eco-ledger"><div><span>Attributed revenue <small id="eco-orders"></small></span><b id="eco-revenue"></b></div><div><span>Allocated hardware</span><b id="eco-hardware"></b></div><div><span>HOMMIO commission · 10%</span><b id="eco-commission"></b></div></div><div class="eco-bottom"><span>Illustrative DTC model · not profit ROI</span><a href="https://hommio.ai/assets/hommio_hph_dashboard.html" target="_blank" rel="noopener">Source ↗</a></div><details><summary>Model assumptions</summary><p>One household, not a per-touchpoint forecast. <span id="eco-daily">12</span> opportunities/day, 1 tap/week, 2 attributed orders/year, $50 net AOV. Hardware allocation: 10,000 × $0.60 ÷ (10,000 × 40% × 30%) = $5 per HPH. Year 2 assumes the same household continues, with no attrition or replacement hardware. Product, fulfillment, payment fees, tax and other costs are excluded. Attributed sales are not necessarily incremental.</p></details>`;
const exposure=document.createElement('div');exposure.id='exposure';exposure.hidden=true;exposure.innerHTML=`<span>${dailyEncounters} fridge visits/day</span><small>Modeled household</small>`;
const sceneElement=document.querySelector('#scene'),homeMap=document.querySelector('#home-map'),doorway=createDoorway(sceneElement);sceneElement.append(exposure);const experience=document.querySelector('#experience');stageCamera=createStageCamera(experience,homeMap);stageCamera.viewport.append(panel);panel.querySelector('details').append(panel.querySelector('.eco-ledger'));
function placePanel(){const p=points[activePoint];exposure.style.left=p[1]+'%';exposure.style.top=p[2]+'%';}
function renderEconomics(){const brand=brandName();if(!brand||story&&!story.done)return;setMapInteractive(true);const years=period===2?2:1,hardware=period===1?0:5,revenue=years*100,commission=revenue*.1,cost=hardware+commission;panel.hidden=false;experience.classList.add('has-brand');document.querySelector('#eco-brand').textContent=brand;document.querySelector('#eco-place').textContent=points[activePoint][0];document.querySelector('#eco-daily').textContent=String(activePoint===0?dailyEncounters:5);for(const [id,value] of Object.entries({'eco-net':'$'+(revenue-cost),'eco-views':((activePoint===0?dailyEncounters:5)*365*years).toLocaleString('en-US'),'eco-taps':52*years,'eco-multiple':(revenue/cost).toFixed(1)+'×','eco-orders':2*years+' orders × $50','eco-revenue':'$'+revenue,'eco-hardware':hardware?'−$'+hardware:'$0','eco-commission':'−$'+commission}))document.getElementById(id).textContent=value;panel.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.period)===period)));[...spots.children].forEach((b,i)=>b.classList.toggle('brand-active',i===activePoint));exposure.hidden=activePoint!==0;requestAnimationFrame(placePanel);guide?.brand(brand,points[activePoint][0]);stageCamera?.brand(brand,points[activePoint]);}
function hideEconomics(){panel.hidden=true;experience.classList.add('has-brand');exposure.hidden=true;[...spots.children].forEach(b=>b.classList.remove('brand-active'));}
panel.querySelector('#eco-close').onclick=()=>returnHome();panel.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>{period=Number(b.dataset.period);renderEconomics()});
const board=document.createElement('aside');board.id='whiteboard';experience.append(board);experience.classList.add('has-brand');
let tapPreview=null,lastBrand='',story=null,manualTap=null,povContext=null;
const escapeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brandName=()=>enteredBrand;
let familyOffer={};
const moshImpact=createHouseholdImpact(),otherImpact=createHouseholdImpact();
const ledger=document.querySelector('#mosh-impact');

const activeImpact=()=>story||!enteredBrand||enteredBrand.trim().toUpperCase()==='MOSH'?moshImpact:otherImpact;
const chat=createChatPanel(board,profiles,{
 onStart:()=>startStory('enter'),
 onPreview:kind=>previewTap(kind||'reorder'),
 onNext:()=>{if(!story||story.done||!story.povDismissed)return;const sc=stages[story.stage];if(!stageArrived(sc,cast))return;story.paused=false;story.pov=true;story.povDismissed=false;if(sc.id==='unbox')openPOV(1,'unboxing');else if(sc.pov)openPOV(sc.pov.actor,sc.pov.kind);showBoard();},
 onEconomics:()=>{renderEconomics();}
});
const characterBubbles=createCharacterBubbles(sceneElement,{profiles,camera,viewport:stageCamera.viewport});
chat.append=line=>{characterBubbles.append(line);guide?.line(line);};
guide=createStoryGuide(board,{onStart:kind=>startStory(kind||'enter'),onHome:returnHome,onSkip:next=>{if(story&&!story.done&&next===nextChapter[currentPlay])startStory(next,true,true);},onPause:()=>{if(story&&!story.done){story.paused=!story.paused;showBoard();}}});
const povHost=document.createElement('div');povHost.id='pov-host';povHost.hidden=true;board.append(povHost);
const pov=createFirstPerson(povHost,{
 onBack:()=>{if(tapPreview){closePreview();return;}if(story&&!story.done){story.povDismissed=true;}closePOV();if(manualTap){manualTap=null;life.resume();}showBoard();},
 onTap:()=>{
  if(tapPreview||povContext?.counted||story&&!story.done&&story.tapCounted)return;
  if(povContext)povContext.counted=true;
  if(story&&!story.done)story.tapCounted=true;
  activeImpact().tap();
  const stage=story&&!story.done?stages[story.stage]:null;
  if(stage?.id!=='unbox'){
   for(const line of stage?.povLines?.tap||[{actor:povContext?.actor??0,text:'One tap. Our usual is right here.'}])chat.append(line);
  }
  showBoard();
 },
 onBeat:beat=>{
  guide?.phoneCaption(beat.kind,beat.id,beat.text);
  if(tapPreview||!story||story.done)return;
  const stage=stages[story.stage],reaction=stage.familyBeats?.[beat.id];
  if(!reaction)return;
  stageActions.present({id:'unbox-'+beat.id,actor:1,pose:reaction.poses[1],shot:{card:'magnet-discover',read:'magnet-read',choose:'family-keeps-hommio'}[beat.id]});
  reaction.poses.forEach((pose,i)=>{
   if(i!==1)setActorPose(cast[i],pose);
   const partner=i===1?(beat.id==='choose'?3:2):1;
   cast[i].lookAt=[cast[partner].x,cast[partner].y];
  });
  characterBubbles.clear();
  cast[reaction.speaker].speakingUntil=performance.now()/1000+3;
  chat.append({actor:reaction.speaker,text:reaction.text});
 },
 onInstall:()=>{if(!story||stages[story.stage].id!=='unbox'||!requestInstallation(story))return;closePOV();setStage(story.stage+1);},
 onComplete:({kind,reason}={})=>{if(tapPreview||!povContext||!story||story.done||povContext.runId!==story.runId||povContext.stage!==story.stage)return;if(stages[story.stage].awaitEvent!=='interaction'||povContext.kind!==kind)return;story.interactionComplete=true;if(kind==='survey'&&reason==='skipped')chat.append({actor:0,text:'Coffee’s ready. Maybe next time.'});else for(const line of stages[story.stage].povLines?.complete||[])chat.append(line);closePOV();showBoard();},
 onOrder:({eventId,amountCents,elapsed})=>{if(tapPreview||!povContext||povContext.ordered||story&&povContext.kind!=='reorder-story')return;if(story&&!story.done&&(povContext.runId!==story.runId||povContext.stage!==story.stage||story.orderCounted))return;if(!activeImpact().order(eventId,amountCents))return;povContext.ordered=true;if(story){story.orderCounted=true;story.reorderSeconds=elapsed;story.reorderCents=amountCents;}chat.append({actor:povContext?.actor??0,text:"That's the demo reorder sorted. Back to the family."});showBoard();}
});
let delivery;
function deliveryScene(){
 if (delivery) return delivery;
 delivery=createDeliveryScene(homeMap,{photographicYard:true,
 onDoorbell:()=>{
  if(!story||stages[story.stage].id!=='delivery')return;
  story.doorbellRang=true;
  chat.append({actor:1,text:"That’ll be our MOSH bars. I’ve got the door."});
 },
 onComplete:()=>delivery.stop(),
 onBeat:beat=>{
  if(!story||stages[story.stage].id!=='delivery')return;
  guide?.deliveryBeat(beat);
  if(beat.id==='exit'){
   story.approachingDoor=true;life.setStageTargets({...stages[story.stage].targets,1:'doorInside',4:'doorApproach'});
   cast[1].gait='brisk';sendTo(cast[1],'doorInside');
   cast[4].gait='trot';sendTo(cast[4],'doorApproach');
   chat.append({actor:1,text:"There's the UPS truck. Cooper, with me."});
  }
 }
});


 return delivery;
}

function previewTap(kind='reorder'){if(!tapPreview)tapPreview={wasPaused:story?.paused||false};if(story)story.paused=true;openPOV(kind==='game'?1:0,kind,true);}
function closePreview(){const saved=tapPreview;tapPreview=null;closePOV();if(story&&saved)story.paused=saved.wasPaused;showBoard();}
function openPOV(actor,kind,preview=false){povContext={actor,kind,runId:story?.runId,stage:story?.stage,counted:!!story?.tapCounted,ordered:!!story?.orderCounted};chat.hide();povHost.hidden=false;board.hidden=false;panel.hidden=true;pov.open({offer:preview?{}:familyOffer,alreadyTapped:!preview&&kind==='game'&&stages[story?.stage]?.id==='microwave-game',actor:profiles[actor],brand:story?.snapshot||brandName()||SNACK_BRAND,kind,point:kind==='unboxing'?'Family unboxing':'Refrigerator',autoTap:true,preview,showBack:preview||!story||story.done,autoPlay:true,autoInstall:true,autoTapDelay:preview?.6:1.5});guide?.setPOV(true,profiles[actor].name,kind);stageCamera?.setPOV(true);}
function closePOV(){if(!povHost.hidden&&povHost.contains(document.activeElement))guide?.focusPause();pov.close();povHost.hidden=true;povContext=null;chat.show();guide?.setPOV(false);stageCamera?.setPOV(false);}
// The overlay belongs to the demonstration. A pass never opens the family's phone.
const visitTag=document.createElement('div');
visitTag.className='fridge-visit-tag';visitTag.hidden=true;
visitTag.innerHTML='<b>Exposure +1</b><small></small>';
sceneElement.append(visitTag);
const visitDetail=visitTag.querySelector('small');
let visitTime=0;
function hideVisit(){visitTime=0;visitTag.hidden=true;}
const exposureTracker=createExposureTracker({onExposure:(actor,index)=>{
 activeImpact().view();
 const task=story&&!story.done&&stages[story.stage].visitPurposes?.[index];
 visitDetail.textContent=actor.name+' · '+(task||'fridge visit');
 visitTag.hidden=false;visitTime=2.6;
}});
exposureTracker.seed(cast);
const actorNote=document.createElement('div');actorNote.id='actor-line';actorNote.hidden=true;sceneElement.append(actorNote);
function sendTo(c,node,instant=false,via=[]){
 if(!instant&&!via.length&&c.state==='walking'&&c.path.at(-1)===node)return;
 c.lookAt=null;
 if(instant){c.node=node;[c.x,c.y]=nodes[node];c.path=[];c.state='doing';c.speedNow=0;return;}
 const here=[c.x,c.y],path=[];
 let from=c.node;
 for(const stop of [...via,node]){path.push(...route(from,stop));from=stop;}
 const offMark=distance(here,nodes[c.node])>.12;
 if(offMark&&!(c.state==='walking'&&path[0]===c.path[0]))path.unshift(c.node);
 if(path.length){prepareHumanForTravel(c);if(c.state!=='walking')c.speedNow=0;}
 c.path=path;c.state=path.length?'walking':'doing';c.remaining=60;
}
function clearStageProps(){hideVisit();householdProps.fridge.reset();householdProps.setLunch('hidden');delivery?.stop();stageActions.clear();kitchenProps.reset?.();householdProps.setParcel('hidden');householdProps.setProduct('hidden');actorNote.hidden=true;cast.forEach(c=>{c.carrying=false;c.model.g.userData.acting=false;});}
function applyStoryAction(event){
 if(!story)return;
 if(event==='game-link-opened'&&!story.tapCounted){story.tapCounted=true;activeImpact().tap();chat.append({actor:1,text:'Noah, come try this while lunch warms.'});}
 if(event==='parcel-picked-up'){story.pickedUp=true;cast[1].carrying=true;householdProps.setParcel('hidden');}
 if(event==='parcel-placed'){cast[1].carrying=false;householdProps.setParcel('closed');}
 if(event==='magnet-installed'&&!story.installed){story.installed=true;hasMagnet=true;exposureTracker.seed(cast);householdProps.setMagnet(true);spots.children[0].classList.add('brand-active','tap-flash');setTimeout(()=>spots.children[0].classList.remove('tap-flash'),1600);}
}
function setStage(n){
 if(!story)return;closePOV();chat.show();
 story.stage=n;story.stagePropsApplied=false;story.time=0;story.arrivedFor=0;story.lineIndex=0;story.pov=false;story.povDismissed=false;story.interactionComplete=false;story.orderCounted=false;story.tapCounted=false;
 const sc=stages[n];cast.forEach(c=>{c.carrying=false;c.model.g.userData.acting=false;});renderPlayProps(sc);activityToast.querySelector('span').textContent=sc.title;chat.activity(sc.title);guide?.stage(currentPlay,sc.id);stageCamera?.stage(currentPlay,sc);
 life.setStageTargets(sc.targets);
 stageActions.begin(sc);
 Object.entries(sc.targets).forEach(([i,node])=>{if(!sc.poses?.[i])setActorPose(cast[+i],'stand');sendTo(cast[+i],node,false,sc.via?.[i]||[]);if(cast[+i].state==='doing')orientForActivity(cast[+i]);});
 if(sc.id==='delivery'){story.doorbellRang=false;story.approachingDoor=false;householdProps.setMagnet(false);householdProps.setProduct('hidden');householdProps.setParcel('hidden');deliveryScene().start({brand:story.snapshot});}
 if(sc.id==='answer-door'||sc.id==='receive'){story.pickedUp=false;delivery?.hideParcel();householdProps.setParcel('doorstep');}
 if(sc.id==='gather'){householdProps.setParcel('hidden');cast[1].carrying=true;}
 if(sc.id==='unbox')householdProps.setParcel('closed');
 if(sc.id==='enjoy'){householdProps.setParcel('hidden');householdProps.setProduct('full');}
 if(sc.id==='finish')householdProps.setParcel('hidden');
 showBoard();
}
function placeAtChapterOpening(kind){
 const opening=householdPlays[kind].stages[0];
 // A cut to the following morning starts before anyone enters the fridge zone.
 const marks=kind==='between'
  ? {0:'brewer',1:'middle',2:'prep',3:'unbox3',4:'pet',5:'livingWest'}
  : {0:'prep',1:'meal1',2:'meal2',3:'game2',4:'pet',5:'livingWest',...opening.targets};
 for(const [id,node] of Object.entries(marks)){
  const c=cast[Number(id)];
  sendTo(c,node,true);
  setActorPose(c,opening.poses?.[id]||'stand');
 }
}
function startStory(kind='enter',continuation=false,seek=false){
 const pauseOnArrival=!!(seek&&continuation&&story?.paused);
 releaseDog();
 characterBubbles.clear();
 if(typeof kind!=='string'||!householdPlays[kind])kind='enter';
 tapPreview=null;closePOV();manualTap=null;clearStageProps();if(story&&!continuation)life.releaseStage();currentPlay=kind;stages=kind==='enter'?snackStory:householdPlays[kind].stages;
 const newMorning=kind==='between';
 if(seek||newMorning)placeAtChapterOpening(kind);
 if(kind==='enter')hasMagnet=false;else hasMagnet=true;
 story={runId:++runId,play:kind,stage:0,time:0,arrivedFor:0,lineIndex:0,paused:pauseOnArrival,done:false,snapshot:SNACK_BRAND,installed:hasMagnet,tapCounted:false,installRequested:false};
 if(kind==='enter'){moshImpact.reset();familyOffer={};pov.prepareFirstTap();}
 story.startedWithViews=moshImpact.seen;story.startedWithTaps=moshImpact.taps;
 if(!continuation||seek||newMorning)exposureTracker.seed(cast);activePoint=0;panel.hidden=true;board.hidden=false;householdProps.setMagnet(hasMagnet);householdProps.setProduct(kind==='between'?'full':'hidden');lastBoardState='';guide?.begin(kind);stageCamera?.begin(kind);[...spots.children].forEach(b=>b.classList.remove('brand-active','selected'));exposure.hidden=true;setMapInteractive(false);setStage(0);
}
function returnHome(){setMapInteractive(false);releaseDog();characterBubbles.clear();tapPreview=null;manualTap=null;story=null;closePOV();clearStageProps();panel.hidden=true;exposure.hidden=true;enteredBrand='';lastBrand='';[...spots.children].forEach(b=>b.classList.remove('brand-active','selected'));guide?.home();stageCamera?.home();life.releaseStage();lastBoardState='';showBoard();}
function orientForActivity(c){if((c.node==='fridgeSide'||c.node==='fridgeList')&&story&&!story.done&&stages[story.stage]?.visitPurposes?.[c.cell]){c.lookAt=[41.8,27];return;}if(c.node==='watchPhone'&&c.activityPose==='watch-phone'||c.node==='coffee'&&c.activityPose==='tap'){c.lookAt=c.cell===1?[60.9,37.9]:[61.6,35.5];return;}if(['pour','stir','coffee','open','reach','press-button','drink'].includes(c.activityPose)&&c.node==='brewer'){c.lookAt=[55.2,26];return;}if(c.node==='coffee'&&['microwave','microwave-load','microwave-unload','open','reach','press-button','carry'].includes(c.activityPose)){c.lookAt=[61.65,26];return;}if(c.cell===4){
  const landmarks={pet:[71.3,36],doorApproach:[48,84],play:[47,76],east:[68,60],livingEast:[70,68],lounge:[63,76]};
  c.lookAt=landmarks[c.node]||null;return;
 }if(c.node==='sink'){c.lookAt=[49.3,26];return;}if(c.node==='laundry'||c.node==='laundryNoah'){c.lookAt=[70,24];return;}if(c.node==='petDad'||c.node==='petNoah'){c.lookAt=nodes.pet;return;}if(c.node?.startsWith('unbox')){c.lookAt=[51,35];return;}const pose=c.activityPose;if(pose?.startsWith('sit')&&seatConfig[c.node]){c.lookAt=seatConfig[c.node].facing;return;}c.lookAt=['sit-eat','sit-homework'].includes(pose)?[70,49]:pose==='sit-game'?[51,66]:pose==='sit-watch'?[81,65]:pose==='cook'?(c.node?.startsWith('unbox')?[51,35]:[58,23]):pose==='wash'?[30,46]:pose==='tap'?[41,27]:null;}
let lastBoardState='';
function showBoard(){const {seen,taps,orders}=activeImpact();const key=[story?.runId,story?.stage,story?.paused,story?.done,story?.povDismissed,seen,taps,orders,!!brandName()].join('|');if(key===lastBoardState)return;lastBoardState=key;renderImpact(ledger,moshImpact);guide?.metrics({seen,taps,orders});guide?.setPaused(!!story?.paused);chat.update({story:story?{...story,title:stages[story.stage].title,total:stages.length,canNext:!!story.povDismissed&&(stages[story.stage].id==='unbox'||!!stages[story.stage].pov)}:null,seen,taps,orders,hasBrand:!!brandName()});}
function updateBrand(){
 const brandChanged=lastBrand!==brandName();
 if(tapPreview&&lastBrand!==brandName())closePreview();
 if(lastBrand!==brandName()){lastBrand=brandName();otherImpact.reset();exposureTracker.seed(cast);}
 if(story&&brandChanged){story=null;clearStageProps();householdProps.setProduct('hidden');householdProps.setMagnet(false);hasMagnet=false;closePOV();manualTap=null;life.releaseStage();}
 if(manualTap){closePOV();manualTap=null;life.releaseStage();}
 exposure.hidden=true;[...spots.children].forEach((b,i)=>b.classList.toggle('brand-active',!!brandName()&&i===0));showBoard();
}
const activityProps=document.createElement('div');activityProps.id='activity-props';sceneElement.append(activityProps);
const activityToast=document.createElement('div');activityToast.className='activity-toast';sceneElement.append(activityToast);
function renderPlayProps(sc){
 activityProps.replaceChildren();
 const props=sc.props||{};
 if(props.pouch==='empty')householdProps.setProduct('empty');
 if(props.pouch==='put-away')householdProps.setProduct('hidden');
 if(currentPlay==='between')householdProps.setProduct('full');
}
function renderActivityProps(id){
 activityProps.replaceChildren();
 if(/game/.test(id)){const prop=document.createElement('div');prop.className='game-board-prop';activityProps.append(prop);}
 if(/movie|tv/.test(id)){const prop=document.createElement('div');prop.className='tv-light';activityProps.append(prop);}
}
const life=createHouseholdDirector({
 scenes:familyScenes,cast,sendTo,
 resolveTarget:(task,i)=>{
  if(['sit-eat','sit-homework'].includes(task.pose)||task.job==='set-table')return 'meal'+i;
  if(task.pose==='sit-game')return 'game'+i;
  if(task.pose==='sit-watch')return 'sofa'+i;
  if(task.node==='pet'&&i===1)return 'petDad';
  if(task.node==='pet'&&i===3)return 'petNoah';
  if(task.node==='girl'&&i===5)return 'catSketch';
  if(task.node==='laundry'&&i===3)return 'laundryNoah';
  if(task.job==='wash'&&i===0)return 'sink';
  if(task.job==='cook'&&i===1)return 'prep';
  return task.node;
 },
 onScene:sc=>{chat.activity(sc.title);activityToast.innerHTML='<i></i><span></span>';activityToast.querySelector('span').textContent=sc.title;renderActivityProps(sc.id);cast.forEach(orientForActivity);},
 onTask:c=>{if(c.state==='doing')orientForActivity(c);},
 onLine:line=>{cast[line.actor].speakingUntil=performance.now()/1000+3;chat.append(line);}
});
const localHour=new Date().getHours();
let initial=localHour<11?familyScenes.findIndex(s=>/breakfast/.test(s.id)):localHour<17?familyScenes.findIndex(s=>/homework/.test(s.id)):localHour<20?familyScenes.findIndex(s=>/meal|dinner/.test(s.id)):familyScenes.findIndex(s=>/movie|tv/.test(s.id));
const sceneOverride=familyScenes.findIndex(s=>s.id===document.body.dataset.initialScene);
life.start(sceneOverride>=0?sceneOverride:Math.max(0,initial),true);updateBrand();guide.home();stageCamera.home();
// Cooper leaves his household activity through the front door and rejoins
// whatever the family is doing when he returns. A visitor's story takes priority.
const dog=cast[4];
function releaseDog(){
 dog.outsideBreak=false;dog.gait='walk';lapPhase='ready';lapClock=64;
}
function gardenTick(dt){
 if(!garden||story||manualTap||tapPreview||enteredBrand)return;
 lapClock-=dt;
 if(lapPhase==='ready'&&lapClock<=0){
  dog.outsideBreak=true;dog.gait='run';dog.activityPose='sniff';sendTo(dog,'lawnBall',false,['lawnTurn']);lapPhase='out';
 }else if(lapPhase==='out'&&dog.state==='doing'&&dog.node==='lawnBall'){
  dog.activityPose='sniff';lapPhase='sniff';lapClock=1.4;
 }else if(lapPhase==='sniff'&&lapClock<=0){
  dog.gait='run';dog.activityPose='fetch';sendTo(dog,'doorInside',false,['lawnReturn']);lapPhase='back';
 }else if(lapPhase==='back'&&dog.state==='doing'&&dog.node==='doorInside'){
  releaseDog();life.rejoin(4);
 }
}
function theatreTick(dt){
 if(manualTap&&!manualTap.arrived&&cast[0].node==='kitchen'&&cast[0].state==='doing'){manualTap.arrived=true;openPOV(0,'reorder');}
 if(story&&!story.done){
  const sc=stages[story.stage];
  life.work(dt);
  const arrived=stageArrived(sc,cast);
  if(arrived&&!story.stagePropsApplied){for(const i of sc.waitFor||Object.keys(sc.targets)){const c=cast[+i];if(sc.poses?.[i])setActorPose(c,sc.poses[i]);}kitchenProps.setStage(sc);story.stagePropsApplied=true;}
  stageActions.update(story.arrivedFor,dt,{arrived,pickedUp:!!story.pickedUp,installed:!!story.installed,interactionComplete:!!story.interactionComplete});
  const actionState=stageActions.snapshot();
  if(sc.id==='unbox'&&actionState.phase==='action')householdProps.openCarton(actionState.pose==='open-box'?actionState.progress:1);
  const secondVisitor=sc.supportingFridge;
  if(secondVisitor&&arrived&&story.arrivedFor<secondVisitor.seconds){
   householdProps.fridge.setVisit(secondVisitor.item,story.arrivedFor/secondVisitor.seconds,secondVisitor.actor);
  }else{
   householdProps.fridge.setVisit(actionState.phase==='action'?sc.id:null,actionState.progress,actionState.actor);
  }
  stageCamera.update(cast,actionState);
  if(sc.id==='unbox'&&arrived&&!story.pov&&!story.povDismissed){story.pov=true;cast.forEach((c,i)=>{if(i<4)c.lookAt=[51,35];});openPOV(1,'unboxing');}
  if(sc.pov&&sc.awaitEvent==='interaction'&&arrived&&actionState.phase==='action'&&story.arrivedFor>=(sc.povLeadIn||0)&&!story.pov&&!story.povDismissed){story.pov=true;if(sc.id==='microwave-game')chat.append({actor:3,text:'Dad, build it across!'});openPOV(sc.pov.actor,sc.pov.kind);}
  guide?.performance?.({stageId:sc.id,arrived,arrivedFor:story.arrivedFor,pickedUp:!!story.pickedUp,installed:!!story.installed,interactionComplete:!!story.interactionComplete,actionState});
  const stageView=stageCamera.viewport;stageView.dataset.stage=sc.id;stageView.dataset.action=actionState.id;stageView.dataset.actionPhase=actionState.phase;stageView.dataset.actionShot=actionState.shot||'';
  tickPerformance(story,stages,dt,{isArrived:()=>arrived,isActionComplete:()=>actionState.complete,onLine:line=>{cast[line.actor].speakingUntil=performance.now()/1000+3.5;chat.append({...line,text:line.text.replaceAll('MOSH',story.snapshot)});},onAdvance:setStage,onFinish:()=>{const next=nextChapter[currentPlay];if(next){startStory(next,true);return;}clearStageProps();guide?.finish(currentPlay,{seen:moshImpact.seen-story.startedWithViews,taps:moshImpact.taps-story.startedWithTaps,orders:moshImpact.orders,reorderSeconds:story.reorderSeconds,reorderCents:story.reorderCents});stageCamera?.finish(currentPlay);life.releaseStage();showBoard();}});
 }else if(!manualTap)life.tick(dt);
 if(visitTime>0){visitTime-=dt;if(visitTime<=0)hideVisit();}
 exposureTracker.tick(cast,story?hasMagnet&&!story.done:!!brandName());
 showBoard();
}

const crowd=createCrowdStepper({cast,nodes,distance,world,orientForActivity,canMove:c=>c.model?.human?canMoveHuman(c):canMovePet(c)});
// One fixed camera includes the lawn beneath the family. The survey camera is
// still the reference for furniture, walking routes and speech anchors.
const actorCamera=camera.clone();
const actorSpan=1.26;
actorCamera.bottom=camera.top-(camera.top-camera.bottom)*actorSpan;
actorCamera.updateProjectionMatrix();
renderer.domElement.style.height=(100*actorSpan)+'%';
const rasterScale=1/Math.sqrt(actorSpan);
let renderAfterResize=true;
new ResizeObserver(()=>{
 const width=sceneElement.clientWidth,height=sceneElement.clientHeight;
 if(!width||!height)return;
 renderer.setSize(Math.round(width*rasterScale),Math.round(height*actorSpan*rasterScale),false);
 renderAfterResize=true;
}).observe(sceneElement);
let previous=0,lastSoftwareRender=0,firstFrameSent=false,inView=true;
document.addEventListener('visibilitychange',()=>{previous=0;});
if(typeof IntersectionObserver!=='undefined'){
 new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;previous=0;},{rootMargin:'100px'}).observe(experience);
}
function frame(ms){
 if(document.hidden||(!inView&&firstFrameSent)){previous=0;requestAnimationFrame(frame);return;}
 // Recover up to half a second of foreground delay. Keep every movement step
 // small so a slower display cannot skip contacts or collide through a wall.
 const dt=previous?Math.min(Math.max(0,(ms-previous)/1000),.5):0;previous=ms;
 const paused=!!story?.paused;
 characterBubbles.pause(paused);
 if(!paused){
  if(story&&!story.done&&delivery?.isActive())delivery.tick(dt);
  const steps=Math.max(1,Math.ceil(dt/.12)),step=dt/steps;
  for(let i=0;i<steps;i++){
   const time=ms/1000-(steps-1-i)*step;
   // Compress the walk between marks. Physical gestures, offers and the checkout clock keep their own timing.
   const movingToScene=story&&!story.done&&!pov.isOpen()&&!stageArrived(stages[story.stage],cast);
   gardenTick(step);crowd.tick(step*(movingToScene?1.65:1));theatreTick(step);
   cast.forEach(c=>pose(c,time,step));doorway.update(cast);kitchenProps.update(time,step,cast);
   if(pov.isOpen())pov.tick(step);
  }
  delivery?.tickEnvironment?.(ms/1000,dt);
 }else if(tapPreview&&pov.isOpen())pov.tick(dt);
 if(!paused||renderAfterResize)characterBubbles.update(cast,ms/1000);
 if((!paused||renderAfterResize)&&(!software||ms-lastSoftwareRender>=32)){renderAfterResize=false;cast.forEach(c=>c.model.update?.());
  if(garden){garden.update(ms/1000,lapPhase==='back',reduced);}
  renderer.render(scene,actorCamera);
  lastSoftwareRender=ms;if(!firstFrameSent){firstFrameSent=true;window.dispatchEvent(new Event('home-frame-ready'));
    setTimeout(()=>import(new URL('./living-garden.js?v=32',import.meta.url).href).then(({createLivingGarden})=>{
     garden=createLivingGarden(THREE,world,{software});scene.add(garden.root);
    }).catch(()=>{life.rejoin(4);}),0);}}
 requestAnimationFrame(frame);
}
// A case-study link can open the corresponding scene without playing earlier chapters.
function openLinkedChapter(){
 const chapter=location.hash.slice(1);
 if(Object.hasOwn(householdPlays,chapter)){
  startStory(chapter,false,chapter!=='enter');return;
 }
 const placement=new URLSearchParams(location.search).get('brand')?.trim().slice(0,100);
 if(placement&&!chapter){
  enteredBrand=placement;
  updateBrand();
  activePoint=0;
  renderEconomics();
 }
}
window.addEventListener('hashchange',openLinkedChapter);
openLinkedChapter();
requestAnimationFrame(frame);
