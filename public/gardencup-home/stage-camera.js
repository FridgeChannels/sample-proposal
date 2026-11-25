import {propertyFrame} from './property-map.js';
const VIEWS={home:{name:'home',x:50,y:48,w:100,h:110},delivery:{x:50,y:115,w:100,h:76},microwave:{x:60,y:32,w:37,h:46},entry:{x:49,y:77,w:66,h:80},island:{x:52,y:38,w:51,h:55},kitchen:{x:54,y:37,w:72,h:72},fridge:{x:44,y:29,w:47,h:51},magnet:{x:42,y:28,w:36,h:41},lunch:{x:45.1,y:35.4,w:31,h:38}};

export function cameraViewForStage(sc){return sc.cameraView||(sc.id==='delivery'?'delivery':sc.id==='microwave-game'?'microwave':['gather','unbox'].includes(sc.id)?'island':['answer-door','receive'].includes(sc.id)?'entry':['install','reorder-at-fridge','reorder-phone','reorder-confirmed'].includes(sc.id)?'magnet':/fridge|milk|survey|game/.test(sc.id)?'fridge':'kitchen');}
export function followedStageView(sc,actor,phase){
 const base=VIEWS[cameraViewForStage(sc)]||VIEWS.kitchen;
 if(sc.cameraActor==null||!actor||!Number.isFinite(actor.x)||!Number.isFinite(actor.y)||!['travel','blocked'].includes(phase))return base;
 // The actor's head/body is above the floor-contact mark. Keep both her and
 // the intended work surface within the unobscured left part of the stage.
 const x=(actor.x+base.x)/2,y=(actor.y-4+base.y)/2;
 return {...base,x,y,w:Math.max(base.w,Math.abs(actor.x-base.x)+18),h:Math.max(base.h,Math.abs(actor.y-4-base.y)+23)};
}

export function createStageCamera(experience,homeMap){
 const viewport=homeMap.closest('#home-stage');
 const camera=homeMap.parentElement;
 let current=VIEWS.home,mode='intro',stage=null,lastFrame='';
 function apply(){
  const w=viewport.clientWidth,h=viewport.clientHeight,basis=homeMap.offsetWidth;
  if(!w||!h||!basis)return;
  const {x,y,scale}=propertyFrame(w,h,basis,current,mode);
  const frame=`translate(${x.toFixed(3)}px,${y.toFixed(3)}px) scale(${scale.toFixed(5)})`;
  if(frame!==lastFrame){camera.style.transform=frame;lastFrame=frame;}
 }
 function view(key){
  experience.dataset.focus=key;
  current=VIEWS[key]||VIEWS.home;apply();
 }
 new ResizeObserver(apply).observe(viewport);
 return {
  viewport,
  home(){stage=null;mode='intro';experience.dataset.storyMode='intro';view('home');},
  begin(kind){mode='story';experience.dataset.storyMode='story';},
  stage(kind,sc){stage=sc;mode='story';view(cameraViewForStage(sc));},
  update(cast,actionState){if(!stage||stage.cameraActor==null)return;current=followedStageView(stage,cast[stage.cameraActor],actionState?.phase);apply();},
  finish(kind){stage=null;mode='outcome';experience.dataset.storyMode='outcome';view('kitchen');},
  brand(name,point){mode='brand';experience.dataset.storyMode='brand';current={x:point[1],y:point[2]+5,w:75,h:100};apply();},
  setPOV(open){viewport.classList.toggle('phone-open',open);},
 };
}
