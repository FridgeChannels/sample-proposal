const status = document.querySelector('#loading-status');
const loading = document.querySelector('#home-loading');
if(new URLSearchParams(location.search).get('embed')==='1')document.documentElement.dataset.embedded='true';
const compatibilityMode = new URLSearchParams(location.search).get('render') === 'compat';
if (compatibilityMode) {
  loading.querySelector('a[hidden]').textContent = 'Retry compatibility mode';
}

const recoveryLink=loading.querySelector('a[hidden]');
const retryURL=new URL(location.href);
retryURL.searchParams.set('render','compat');
recoveryLink.href=retryURL.href;
const fallbackChapters={enter:'arrives',between:'between',reorder:'reorder'};
const fallbackChapter=fallbackChapters[location.hash.slice(1)];
if(typeof fallbackChapter==='string')loading.querySelector('#read-story').href='story.html#'+fallbackChapter;
const earlyButton=document.querySelector('#early-story');
const earlyFit=loading.querySelector('#early-fit');
const earlyPanel=loading.querySelector('#early-fit-panel');
const fitStory=earlyPanel.querySelector('[data-guide-action="start"]');
let requested='',loadMessage='',failed=false;
const buttons=[earlyButton,fitStory];
const buttonLabels=buttons.map(button=>button.innerHTML);
const initialStatus=status.textContent;
function syncPending(){
 const pending=requested==='story';
 buttons.forEach((button,index)=>{
  button.disabled=pending||failed;
  if(pending&&!failed)button.textContent='Preparing the story…';
  else button.innerHTML=buttonLabels[index];
 });
 status.textContent=loadMessage||(pending?'Preparing the story…':initialStatus);
}
function queueStory(){
 if(failed)return;
 requested='story';document.body.dataset.trafficFit='false';syncPending();
}
earlyButton.onclick=queueStory;
earlyFit.onclick=()=>{
 requested='fit';document.body.dataset.trafficFit='true';syncPending();loading.classList.add('show-fit');earlyPanel.hidden=false;
 earlyPanel.querySelector('.placement-back').focus({preventScroll:true});
};
earlyPanel.querySelector('[data-guide-action="fit-back"]').onclick=()=>{
 requested='';document.body.dataset.trafficFit='false';syncPending();earlyPanel.hidden=true;loading.classList.remove('show-fit');earlyFit.focus({preventScroll:true});
};
fitStory.onclick=queueStory;
function showStartupError(message='The interactive home is taking too long to load.',terminal=false) {
  if (document.body.dataset.homeReady === 'true') return;
  failed=failed||terminal;
  loadMessage=message;
  loading.classList.add('is-delayed');
  recoveryLink.hidden=false;
  syncPending();
}

const startupDeadline = setTimeout(showStartupError, 12000);
// The inline photograph remains visible even if the larger image is delayed or fails.
const house=document.querySelector('#house');
async function revealDetail(){
  try{await house.decode();}catch{if(!house.complete||!house.naturalWidth)return;}
  if(house.naturalWidth)house.classList.add('is-decoded');
}
house.addEventListener('load',revealDetail);
if(house.complete)revealDetail();

const layout=document.querySelector('link[data-home-layout]');
const layoutReady=new Promise(resolve=>{
  const apply=()=>{layout.media='all';resolve();};
  if(layout.sheet)apply();else layout.addEventListener('load',apply,{once:true});
  layout.addEventListener('error',()=>{clearTimeout(startupDeadline);showStartupError('The interactive home could not load its layout.',true);},{once:true});
});
window.addEventListener('home-frame-ready', async () => {
  await layoutReady;
  requestAnimationFrame(()=>{
    document.body.dataset.homeReady='true';
    document.querySelector('#experience').setAttribute('aria-busy','false');
    const focused=document.activeElement;
    loading.remove();
    clearTimeout(startupDeadline);
    if(requested==='story')document.querySelector('#whiteboard .mi-start')?.click();
    else if(requested==='fit')document.querySelector('#whiteboard .mi-fit')?.click();
    else if(focused===earlyFit||focused===earlyButton)document.querySelector(focused===earlyFit?'#whiteboard .mi-fit':'#whiteboard .mi-start')?.focus({preventScroll:true});
  });
}, {once:true});

import(document.querySelector('link[data-home-runtime]').href).catch(error => {
  clearTimeout(startupDeadline);
  showStartupError('The interactive home could not start.',true);
  console.error('HOMMIO startup failed', error);
});
