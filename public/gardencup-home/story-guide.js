import {Gardencup} from './brand-assets.js';
import {fitPanel} from './traffic-fit.js';
import {renderGardencupIntro,loadGardencupIntroStyles} from './gardencup-intro.js?v=21';
import {firstCuts} from './story-first-cuts.js';
let cutPreviews=firstCuts;
let allCuts;
function loadCutPreviews(){
 return allCuts??=import(new URL('./story-cut-previews.js?v=41',import.meta.url).href).then(module=>{cutPreviews=module.cutPreviews;},()=>{allCuts=null;});
}
import {resolveEditorialShot,nextStagePhoto} from './storyboard-shots.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asset=name=>new URL(`./assets/${name}`,import.meta.url).href;
const chapters={
 enter:{number:'01',title:'The delivery',next:'between',cta:'A day at home'},
 between:{number:'02',title:'Between purchases',next:'reorder',cta:'When the pack runs out'},
 reorder:{number:'03',title:'The next order',next:null,cta:'Watch again'}
};

const householdEconomics=`<details class="sg-household-model"><summary>What could one repeat household be worth?</summary><p>HOMMIO’s year-one example assumes two attributed orders at $50 each. That’s $100 in sales against $15 in program costs ($5 allocated hardware and $10 commission), before product and fulfillment costs. These are model assumptions.</p><a href="https://hommio.ai/dtcbrands" target="_blank" rel="noopener noreferrer">See the HOMMIO model ↗</a></details>`;

function placementReason(point){
 const p=String(point||'').toLowerCase();
 if(/coffee/.test(p))return ['Beside the first cup.','Coffee brings people back to the same spot every day.'];
 if(/laundry/.test(p))return ['There when the next load starts.','A familiar place to check the product, get help or order more.'];
 if(/pet/.test(p))return ['Part of their feeding routine.','Meals create a natural return to the place where pet supplies are used.'];
 if(/toilet|vanity|bathroom/.test(p))return ['A place in the daily routine.','Useful care products belong near the moments they are needed.'];
 if(/garage|workbench/.test(p))return ['Close to the next job.','The next repair starts where the tools and supplies already live.'];
 if(/entry|hallway/.test(p))return ['On the way in and out.','A useful household touchpoint beside an existing daily route.'];
 if(/pantry/.test(p))return ['Where the favorites are kept.','Opening the cupboard creates a moment to notice, use and return.'];
 if(/hood|sink/.test(p))return ['Close to everyday cooking.','A place beside the routines your product can be part of.'];
 return ['Where the family keeps coming back.','HOMMIO is within reach whenever they want to tap.'];
}


/** The same observed action drives the live household and its photographic cut. */
export function createStoryGuide(board,{onStart=()=>{},onHome=()=>{},onPause=()=>{},onSkip=()=>{}}={}){
 if(!document.querySelector('link[data-story-guide]')){const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./story-guide.css',import.meta.url).href;sheet.dataset.storyGuide='';document.head.append(sheet);}
 loadGardencupIntroStyles();
 const root=document.createElement('section');root.className='story-guide';root.setAttribute('aria-label','The HOMMIO story');board.append(root);board.classList.add('has-story-guide');
 const beatObject=document.createElement('figure');beatObject.className='sg-beat-object';beatObject.hidden=true;board.append(beatObject);
 let mode='intro',play='enter',stageId='',deliveryShot='',povOpen=false,shot=null,performanceState={},totals={seen:0,taps:0,orders:0},outcomeMetrics={};
 const caption=document.createElement('section');caption.className='sg-caption';caption.hidden=true;
 caption.innerHTML='<div class="sg-caption-chapter"></div><h2></h2><p></p>';board.append(caption);
 const chapterLabel=caption.querySelector('.sg-caption-chapter'),headline=caption.querySelector('h2'),sentence=caption.querySelector('p');
 function writeCaption(title,description){
  if(headline.textContent!==title)headline.textContent=title;
  if(sentence.textContent!==description)sentence.textContent=description;
  chapterLabel.textContent=shot?.id==='fridge-ambient'&&!povOpen?'Estimated fridge visits':chapters[play].title;
 }
 const compact=matchMedia('(max-height:620px)'),images=new Map();
 const syncHeight=()=>board.style.setProperty('--guide-height',compact.matches?'44px':'52px');syncHeight();compact.addEventListener?.('change',syncHeight);
 const homeButton=()=>'<button class="sg-home" type="button" data-guide-action="home" title="Return to the introduction" aria-label="Return to the story introduction"><svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m5 5 10 10m0-10L5 15"/></svg></button>';
 let paused=false;
 function focusPause(){root.querySelector('[data-guide-action="pause"]')?.focus({preventScroll:true});}
 function setPaused(next){
  paused=!!next;
  const button=root.querySelector('[data-guide-action="pause"]');
  if(!button||button.dataset.paused===String(paused))return;
  const label=paused?'Resume story':'Pause story';
  button.dataset.paused=String(paused);
  button.setAttribute('aria-label',label);
  button.title=label;
 }
 let sequence=[], cut=0;
 function preload(file){
  if(!file)return;
  if(images.has(file))return images.get(file);
  const image=new Image();
  image.decoding='async';
  const url=asset(file.replace(/^gardencup-story\//,'story-cuts/'));
  image.src=file==='gardencup-story/coffee-wait.webp'?url+'?portrait=41':url;
  const entry={image,ready:false};
  entry.promise=image.decode().then(()=>{entry.ready=true;return true;},()=>false);
  images.set(file,entry);
  if(images.size>5)images.delete(images.keys().next().value);
  return entry;
 }
 function prepareNext(file){
  const index=sequence.indexOf(file);
  if(index>=0)sequence.slice(index+1,index+3).forEach(preload);
 }
 function bind(){
  root.querySelectorAll('[data-guide-action]').forEach(button=>button.addEventListener('click',()=>{
  const action=button.dataset.guideAction;
  if(action==='start'){onStart(button.dataset.play||'enter');focusPause();}
  if(action==='pause')onPause();
  if(action==='skip'&&chapters[play].next)onSkip(chapters[play].next);
  if(action==='home'){onHome();root.querySelector('.mi-start')?.focus({preventScroll:true});}
  if(action==='fit')fit();
  if(action==='fit-back'){home();root.querySelector('.mi-fit')?.focus?.({preventScroll:true});}
 }));

 }
 function syncBeatObject(){
  beatObject.hidden=mode!=='story'||povOpen;
  if(beatObject.hidden)return;
  if(!shot){
   if(beatObject.dataset.photoKey==='opening-'+play)return;
   cut++;
   beatObject.dataset.photoKey='opening-'+play;
   beatObject.dataset.scene='chapter-opening';
   beatObject.innerHTML='<div class="sg-chapter-opening"><img src="'+asset('gardencup/logo.svg')+'" alt="Gardencup"><span>The Bennetts’ kitchen</span></div>';
   const openings={
    enter:['What will the family keep?','Their usual Gardencup order includes a magnet that can bring them back for the next box.'],
    between:['Why come back between orders?','The family can see Gardencup at the fridge and choose when to tap.'],
    reorder:['Where will the next order go?','When the cups run out, the fridge gives Emma a direct route back to Gardencup.']
   };
   writeCaption(...openings[play]);
   return;
  }
  if(beatObject.dataset.photoKey===shot.id)return;
  beatObject.dataset.photoKey=shot.id;
  const requested=shot, ticket=++cut, entry=preload(shot.file);
  const commit=ok=>{
   if(ticket!==cut)return;

   if(mode!=='story'||povOpen||requested.id!==shot?.id)return;
   if(!ok&&!cutPreviews[requested.file])return;
   beatObject.dataset.scene=requested.id;
   beatObject.dataset.stage=stageId;
   const frame=document.createElement('div');
   frame.className='sg-scene-image';
   const display=ok?entry.image:new Image();
   if(!ok&&cutPreviews[requested.file])display.src=cutPreviews[requested.file];
   if(ok||cutPreviews[requested.file]){display.alt=requested.alt||requested.caption;display.style.objectPosition=requested.focus||"50% 50%";frame.append(display);}
   beatObject.replaceChildren(frame);
   writeCaption(requested.title,requested.caption);
  };
  if(entry.ready)commit(true);
  else{
   commit(false);
   if(!cutPreviews[requested.file])loadCutPreviews().then(()=>{if(!entry.ready&&cutPreviews[requested.file])commit(false);});
   entry.promise.then(ok=>{if(ok)commit(true);});
  }
  prepareNext(requested.file);
 }
 function renderStory(){
  let header=root.querySelector('.sg-story-header');
  if(!header){
   root.innerHTML=`<header class="sg-story-header"><span class="sg-chapter-count" role="img"></span><div class="sg-controls"><button type="button" class="sg-playback" data-guide-action="pause"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20"><path class="sg-pause-icon" d="M7 4v12m6-12v12" fill="none" stroke="currentColor" stroke-width="2"/><path class="sg-play-icon" d="m6 3 10 7-10 7z" fill="currentColor"/></svg></button><button type="button" data-guide-action="skip"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="m4 4 9 6-9 6z"/><path d="M15 4v12" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>${homeButton()}</div></header>`;
   header=root.querySelector('.sg-story-header');
   bind();
   setPaused(paused);
  }
  if(header.dataset.play!==play){
   header.dataset.play=play;
   const chapter=chapters[play],count=header.querySelector('.sg-chapter-count');
   const skip=header.querySelector('[data-guide-action="skip"]');
   if(!chapter.next&&document.activeElement===skip)focusPause();
   skip.hidden=!chapter.next;
   if(chapter.next){
    skip.title='Next chapter: '+chapters[chapter.next].title;
    skip.setAttribute('aria-label',skip.title);
   }
   count.textContent=chapter.number+' / 03';
   count.setAttribute('aria-label',`Chapter ${Number(chapter.number)} of 3. ${chapter.title}.`);
  }
  const marker=header.querySelector('.sg-chapter-count');
  const breakfast=!stageId||['coffee-brewing','coffee-milk','coffee-survey','coffee-finish'].includes(stageId);
  const label=play==='between'?(breakfast?'Coffee time':'Lunch break'):play==='enter'?'Delivery':'The last cup';
  if(marker.dataset.beat!==label){
   marker.dataset.beat=label;
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches)marker.animate?.([{opacity:.25,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:420,easing:'ease-out'});
  }
 }
 function applyShot(next){if(next?.id===shot?.id)return;shot=next;syncBeatObject();}
 function resolve(){applyShot(resolveEditorialShot({...performanceState,stageId,deliveryBeat:deliveryShot},shot));}
 function setMode(next){mode=next;
  if(document.body.dataset.homeReady==='true'||next==='fit')document.body.dataset.trafficFit=String(next==='fit');caption.hidden=next!=='story';board.dataset.guideMode=next;board.dataset.guidePov=String(povOpen);root.classList.toggle('is-pov',povOpen);syncBeatObject();}
 function home(){cut++;povOpen=false;deliveryShot='';performanceState={};setMode('intro');root.innerHTML=renderGardencupIntro(asset);bind();}
 function fit(){
  cut++;povOpen=false;setMode('fit');root.innerHTML=fitPanel();bind();
  root.querySelector('.placement-back')?.focus?.({preventScroll:true});
 }
 function begin(nextPlay){
  loadCutPreviews();
  cut++;delete beatObject.dataset.photoKey;
  play=chapters[nextPlay]?nextPlay:'enter';stageId='';deliveryShot='';povOpen=false;performanceState={};shot=resolveEditorialShot({stageId:{enter:'delivery',between:'coffee-brewing',reorder:'empty-pouch'}[play]});setMode('story');renderStory();
  // Fetch the short action cuts before their corresponding animation begins.
  const files={
   enter:['driver-driving','driver-exit','driver-carry','doorstep','door-open','pickup','carry-inside','gather','unbox','magnet-discover','magnet-read','install'],
   between:['magnet-insert','coffee-wait','emma-milk','reorder-tap','coffee-pour','leftovers','microwave-wait','noah-milk','daniel-game-tap','game'],
   reorder:['lunch-insert','lunch-packing','empty-box','reorder-tap','lunch-packing']
  }[play];
  sequence=files.map(file=>`gardencup-story/${file}.webp`);
  sequence.slice(0,3).forEach(preload);
 }
 function stage(nextPlay,nextStage){
  const changed=play!==nextPlay||stageId!==nextStage;play=chapters[nextPlay]?nextPlay:'enter';stageId=nextStage;
  if(changed){povOpen=false;deliveryShot='';performanceState={arrived:false,arrivedFor:0,pickedUp:false,installed:false,interactionComplete:false};}
  shot=resolveEditorialShot({...performanceState,stageId,deliveryBeat:deliveryShot},shot);setMode('story');renderStory();preload(nextStagePhoto(stageId));
  if(stageId==='install')preload('gardencup-story/magnet-insert.webp');
  if(stageId==='gather')for(const file of ['unbox','magnet-discover','magnet-read','family-keeps-hommio'])preload(`gardencup-story/${file}.webp`);
 }
 function performance(value={}){
  if(mode!=='story'||value.stageId!==stageId)return;
  performanceState={...performanceState,...value};resolve();
 }
 function deliveryBeat(beat){if(stageId!=='delivery')return;deliveryShot=typeof beat==='string'?beat:beat?.id||'';resolve();}
 function finish(nextPlay,metrics={}){
   play=chapters[nextPlay]?nextPlay:'enter';outcomeMetrics={...totals,...metrics};povOpen=false;setMode('outcome');root.classList.remove('is-pov');const chapter=chapters[play];
   const focusReplay=board.contains(document.activeElement);
   const measured=Number(outcomeMetrics.reorderSeconds);
   const cents=outcomeMetrics.reorderCents;
   const orderText=Number.isFinite(measured)&&measured>0&&Number.isInteger(cents) ? `A $${(cents/100).toFixed(2)} demo reorder, confirmed ${measured.toFixed(1)} seconds after Emma’s tap in this playback.` : 'Shop now opens the Gardencup store. The story illustrates a saved-basket reorder.';
   const outcomes={
    enter:{photo:'install',title:'The family gave Gardencup a place on the fridge.',text:'Their first order put HOMMIO in the box. Their own choice keeps it beside the handle.'},
    between:{photo:'game',title:'Attention and intent count separately.',text:`Story totals so far include ${Number(outcomeMetrics.seen)||0} chances to see Gardencup and ${Number(outcomeMetrics.taps)||0} voluntary taps.`},
    reorder:{photo:'lunch-packing',title:'A repeat order in the family story.',text:orderText}
   };
   const ending=outcomes[play];
   root.innerHTML=`<div class="sg-ending"><figure><img src="${asset('story-cuts/'+ending.photo+'.webp')}" alt="${esc(ending.title)}"></figure>${homeButton()}<div class="sg-ending-copy"><div class="sg-caption-chapter">${chapter.title}</div><h2>${ending.title}</h2><p>${ending.text}</p>${play==='reorder'?householdEconomics+'<a class="sg-sample-link" href="'+Gardencup.sampleURL+'" target="_blank" rel="noopener noreferrer">Build a pack at Gardencup</a>':''}<button type="button" class="sg-primary" data-guide-action="start" data-play="${chapter.next||'enter'}"><span>${chapter.cta}</span><span aria-hidden="true">→</span></button></div></div>`;bind();
   if(focusReplay)root.querySelector('[data-guide-action="start"]')?.focus({preventScroll:true});
 }
 function brand(name,pointName){povOpen=false;setMode('brand');root.classList.remove('is-pov');const [title]=placementReason(pointName);root.innerHTML=`<div class="sg-page sg-brand"><div class="sg-chapter"><span>Your brand</span>${homeButton()}</div><h1>${esc(name)}</h1><span class="sg-brand-location">${esc(pointName||'Refrigerator')}</span><h2>${title}</h2><ol class="sg-brand-path"><li><span>01</span><b>Enter home</b></li><li><span>02</span><b>Stay connected</b></li><li><span>03</span><b>Reorder directly</b></li></ol><p class="sg-demo-note">Illustrative placement and economics.</p><button type="button" class="sg-primary" data-guide-action="start" data-play="enter"><span>See the story</span><span aria-hidden="true">→</span></button></div>`;bind();}
 function phoneCaption(kind,id='',value=''){
  if(mode!=='story'||!povOpen)return;
  const lines={
   unboxing:['What will outlast this box?','The salads will be eaten. The Bennetts can keep HOMMIO for the next time they want to reach Gardencup.'],
   card:['Would they put this on their fridge?','The front shows the layered salad the family likes. They can give it a place in the kitchen on its looks alone.'],
   read:['An invitation the family can turn over.','The Gardencup side invites them to tap and see how its fresh cups reach their fridge. The family chooses whether to hear it.'],
   phone:['Daniel chooses to meet the brand.','His tap opens Gardencup’s own experience. That first voluntary visit can happen before anyone is ready to buy again.'],
   welcome:['A reason to keep HOMMIO.','Daniel finds 10% off the next box, ready to use. The family can come back to the same offer from the fridge.'],
   beauty:['Which side earns a place in the kitchen?','The family can face the food photograph outward and still tap through to Gardencup.'],
   choose:['The family chooses where Gardencup belongs.','They pick the fridge handle. Emma can find the same salads from the spot where she packs lunch.'],
   survey:['What can Gardencup learn in a coffee break?','Two optional questions tell Gardencup how a customer shops. Completing them earns 20 points toward a $5 coupon.'],
   'survey-shared':['What else is on her shopping list?',`Emma chose “${value}” and shared how often she buys directly from brands. Gardencup gets two answers she volunteered.`],
   'survey-skipped':['Emma keeps the choice and her 10% offer.','She skipped the questions. Gardencup still gives her a direct way to reorder whenever she wants.'],
   game:['An invitation between purchases.','Daniel and Noah play Draw Bridge while lunch warms. Gardencup earns a voluntary visit even with salads still in the fridge.'],
   reward:['What could one visit a week add up to?','In HOMMIO’s model, one voluntary tap a week means 52 visits a year from one engaged household. Daniel’s game is one visit.'],
   reorder:['From the fridge back to Gardencup.','Shop now opens the family’s pack at Gardencup. This story models a faster return to the family’s usual box.'],
   'order-confirmed':['The demo clock stops at confirmation.','Only Emma’s simulated confirmation adds an order to the story. Her receipt shows its value and elapsed time.']
  };
  const key=Object.hasOwn(lines,id)?id:kind==='reorder-story'?'reorder':kind;
  const [title,text]=lines[key]||lines.unboxing;
  writeCaption(title,text);
 }
 function setPOV(open,name,kind){povOpen=!!open;root.classList.toggle('is-pov',povOpen);board.dataset.guidePov=String(povOpen);syncBeatObject();if(open)phoneCaption(kind);else if(shot&&mode==='story')writeCaption(shot.title,shot.caption);if(mode==='story')renderStory();}
 function metrics(values={}){totals={...totals,...values};}
 function line(){}
 home();
 return {home,fit,begin,stage,finish,brand,setPaused,focusPause,setPOV,phoneCaption,metrics,line,performance,deliveryBeat,destroy(){compact.removeEventListener?.('change',syncHeight);root.remove();beatObject.remove();caption.remove();board.classList.remove('has-story-guide');delete board.dataset.guideMode;delete board.dataset.guidePov;board.style.removeProperty('--guide-height');}};
}
