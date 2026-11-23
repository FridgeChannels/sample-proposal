import {Vector3} from './vendor/three.module.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

// The scene gets a short cue; the full authored line is available on interaction.
function previewFor(value){
 const text=String(value??'').trim().replace(/\s+/g,' ');
 if(text.length<=66)return text;
 const first=text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim()||text;
 let preview=first;
 if(preview.length>66){
  const cut=preview.slice(0,63),clause=Math.max(cut.lastIndexOf('; '),cut.lastIndexOf(', '),cut.lastIndexOf('—'));
  preview=(clause>31?cut.slice(0,clause):cut.slice(0,cut.lastIndexOf(' '))).trim();
 }
 return preview===text?text:preview.replace(/[,.!?;:—\s]+$/,'')+'…';
}

/** A single quiet cue, attached to the speaker's live head position. */
export function createCharacterBubbles(sceneElement,{profiles=[],camera,viewport=sceneElement.closest('#home-stage')}={}){
 if(!viewport)throw new Error('Character bubbles need a visible home stage.');
 if(!document.querySelector('link[data-character-bubbles]')){
  const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./character-bubbles.css',import.meta.url).href;sheet.dataset.characterBubbles='';document.head.append(sheet);
 }
 const root=document.createElement('div');root.className='character-bubbles';root.setAttribute('aria-label','The family, speaking and thinking');root.setAttribute('role','log');root.setAttribute('aria-live','polite');root.setAttribute('aria-relevant','additions text');viewport.append(root);
 const point=new Vector3(),queue=[];
 let active=null,elapsed=0,lastTime=null,paused=false,lastCast=[],lastStart=-10;
 const observer=new ResizeObserver(()=>{if(active)active.measure=true;});observer.observe(viewport);
 function append({actor,kind='dialogue',text}={}){
  text=String(text??'').trim().replace(/\s+/g,' ');
  if(!Number.isInteger(actor)||!profiles[actor]||!text)return;
  kind=actor>3||kind==='thought'?'thought':'dialogue';
  // Keep the newest pending cue from each speaker instead of replaying a backlog.
  const previous=queue.findIndex(item=>item.actor===actor);if(previous>=0)queue.splice(previous,1);
  if(active?.actor===actor&&active.text===text)return;
  queue.push({actor,kind,text,preview:previewFor(text),queuedAt:elapsed});
  if(queue.length>6)queue.shift();
 }
 function headAnchor(actor,sceneRect,stageRect){
  const c=lastCast[actor],m=c?.model;if(!c||!m||m.g?.visible===false)return null;
  let x,y;
  if(camera&&m.head){
   m.head.getWorldPosition(point);point.y+=(m.naturalHeight||1.7)*(m.human?.13:.20)*(m.g.scale.y||1);point.project(camera);
   x=sceneRect.left-stageRect.left+(point.x+1)*sceneRect.width/2;y=sceneRect.top-stageRect.top+(1-point.y)*sceneRect.height/2;
  }else{
   x=sceneRect.left-stageRect.left+c.x*sceneRect.width/100;y=sceneRect.top-stageRect.top+c.y*sceneRect.height/100-sceneRect.height*(actor<2?.108:actor<4?.079:.038);
  }
  return Number.isFinite(x)&&Number.isFinite(y)&&x>=8&&x<=stageRect.width-8&&y>=20&&y<=stageRect.height-20?{x,y}:null;
 }
 function syncExpanded(item){
  const expanded=!item.suppressed&&(item.pinned||item.focused);
  if(item.expanded===expanded)return;item.expanded=expanded;item.measure=true;
  item.lockedPosition=expanded&&item.position?{...item.position}:null;
  item.el.style.maxHeight='';item.el.style.overflow='';
  item.el.setAttribute('aria-expanded',String(expanded));item.el.querySelector('.character-bubble-text').textContent=expanded?item.text:item.preview;
 }
 function start(item){
  const p=profiles[item.actor],el=document.createElement('button');el.type='button';el.className=`character-bubble character-bubble--${item.kind}`;el.dataset.actor=String(item.actor);el.dataset.character=p.id;
  el.setAttribute('aria-label',`${p.name} ${item.kind==='thought'?'thinks':'says'}: ${item.text}`);el.setAttribute('aria-expanded','false');
  const name=document.createElement('b');name.className='character-bubble-name';name.textContent=p.name;
  const text=document.createElement('span');text.className='character-bubble-text';text.textContent=item.preview;
  const copy=document.createElement('span');copy.className='character-bubble-copy';copy.append(name,text);
  const tail=document.createElement('i');tail.className='character-bubble-tail';tail.setAttribute('aria-hidden','true');el.append(copy,tail);root.append(el);
  Object.assign(item,{el,width:0,height:0,measure:true,visible:false,expanded:false,pinned:false,focused:false,pointerIntent:false,suppressed:false,remaining:clamp(2.5+item.preview.split(/\s+/).length*.09,2.8,4),invisibleFor:0});
  // Hover must not resize the target before a pointer can click it. Keyboard
  // focus still reveals the full line; pointer focus waits for the click.
  el.addEventListener('pointerdown',()=>{item.pointerIntent=true;});
  el.addEventListener('pointerup',()=>{item.pointerIntent=false;});
  el.addEventListener('pointercancel',()=>{item.pointerIntent=false;});
  el.addEventListener('focus',()=>{item.focused=!item.pointerIntent;item.suppressed=false;syncExpanded(item);});
  el.addEventListener('blur',()=>{item.focused=false;item.pointerIntent=false;item.suppressed=false;syncExpanded(item);});
  el.addEventListener('click',()=>{item.pointerIntent=false;item.pinned=!item.pinned;item.suppressed=!item.pinned;syncExpanded(item);});
  el.addEventListener('keydown',event=>{if(event.key==='Escape'){item.pinned=false;item.suppressed=true;syncExpanded(item);event.stopPropagation();}});
  active=item;lastStart=elapsed;
 }
 function remove(){active?.el.remove();active=null;}
 function localRect(el,stageRect,pad=0){const r=el.getBoundingClientRect();return {x:r.left-stageRect.left-pad,y:r.top-stageRect.top-pad,w:r.width+pad*2,h:r.height+pad*2};}
 function layout(item,anchor,stageRect,sceneRect){
  if(item.expanded){item.el.style.maxHeight=`${Math.min(240,stageRect.height*.48)}px`;item.el.style.overflow='auto';}
  if(item.measure){item.el.hidden=false;item.width=item.el.offsetWidth;item.height=item.el.offsetHeight;item.measure=false;}
  const w=item.width,h=item.height,pad=9;
  // An opened line remains where it was clicked, even if its speaker walks or
  // a touchpoint enters the area. Clamp it inside the scene instead of hiding it.
  if(item.expanded){
   const origin=item.lockedPosition||item.position||{x:anchor.x-w/2,y:anchor.y-h-11,side:'above'};
   const box={x:clamp(origin.x,pad,Math.max(pad,stageRect.width-w-pad)),y:clamp(origin.y,pad,Math.max(pad,stageRect.height-h-46)),side:origin.side};
   item.position=box;
   item.el.style.transform=`translate3d(${box.x.toFixed(1)}px,${box.y.toFixed(1)}px,0)`;item.el.dataset.side=box.side;
   item.el.style.setProperty('--tail-x',`${clamp(anchor.x-box.x,12,w-12).toFixed(1)}px`);item.el.hidden=false;return true;
  }
  const candidates=[
   {x:anchor.x-w/2,y:anchor.y-h-11,side:'above'},
   {x:anchor.x-w+22,y:anchor.y-h-11,side:'above'},
   {x:anchor.x-22,y:anchor.y-h-11,side:'above'},
   {x:anchor.x+22,y:anchor.y-h*.7,side:'right'},
   {x:anchor.x-w-22,y:anchor.y-h*.7,side:'left'}
  ].map(box=>({...box,w,h}));
  const obstacles=[];
  const heading=viewport.querySelector('.stage-heading');if(heading)obstacles.push(localRect(heading,stageRect,5));
  viewport.querySelectorAll('.spot').forEach(spot=>{if(spot.getClientRects().length)obstacles.push(localRect(spot,stageRect,2));});
  for(let i=0;i<lastCast.length;i++){const a=headAnchor(i,sceneRect,stageRect);if(a)obstacles.push({x:a.x-13,y:a.y+3,w:26,h:38});}
  const box=candidates.find(b=>b.x>=pad&&b.x+b.w<=stageRect.width-pad&&b.y>=pad&&b.y+b.h<=stageRect.height-46&&!obstacles.some(o=>overlaps(b,o)));
  if(!box)return false;
  item.position={x:box.x,y:box.y,side:box.side};
  item.el.style.transform=`translate3d(${box.x.toFixed(1)}px,${box.y.toFixed(1)}px,0)`;item.el.dataset.side=box.side;
  item.el.style.setProperty('--tail-x',`${clamp(anchor.x-box.x,12,w-12).toFixed(1)}px`);item.el.hidden=false;return true;
 }
 function update(cast,time){
  lastCast=cast||lastCast;let dt=0;
  if(Number.isFinite(time)){if(lastTime!==null&&!paused){dt=clamp(time-lastTime,0,.5);elapsed+=dt;}lastTime=time;}
  if(!active&&!queue.length)return;
  const stageRect=viewport.getBoundingClientRect(),sceneRect=sceneElement.getBoundingClientRect();if(!stageRect.width||!stageRect.height)return;
  for(let i=queue.length-1;i>=0;i--)if(elapsed-queue[i].queuedAt>8)queue.splice(i,1);
  if(active){
   if(active.visible&&!active.expanded)active.remaining-=dt;
   active.invisibleFor=active.visible?0:active.invisibleFor+dt;
   if(!active.expanded&&(active.remaining<=0||active.invisibleFor>3))remove();
  }
  if(!active&&!paused&&elapsed-lastStart>.45){
   const visible=item=>!!headAnchor(item.actor,sceneRect,stageRect);
   let next=queue.findIndex(item=>item.kind==='dialogue'&&visible(item));if(next<0)next=queue.findIndex(visible);
   if(next>=0)start(queue.splice(next,1)[0]);
  }
  if(active){
   const currentAnchor=headAnchor(active.actor,sceneRect,stageRect);if(currentAnchor)active.lastAnchor=currentAnchor;
   const anchor=currentAnchor||(active.expanded?active.lastAnchor:null);
   active.visible=!!anchor&&layout(active,anchor,stageRect,sceneRect);active.el.hidden=!active.visible;
  }
 }
 function clear(){queue.length=0;remove();lastStart=-10;}
 return {append,update,clear,pause(value=true){if(paused===!!value)return;paused=!!value;root.dataset.paused=String(paused);},destroy(){clear();observer.disconnect();root.remove();}};
}
