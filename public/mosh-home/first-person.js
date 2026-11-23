import {createPhoneExperience} from './phone-experience.js';
import {MOSH} from './brand-assets.js';
const asset = name => new URL(`./assets/${name}`, import.meta.url).href;
/** A directed, illustrated first-person moment; no camera or payment access. */
export function createFirstPerson(container, {onBack = () => {}, onTap = () => {}, onOrder = () => {}, onInstall = () => {}, onBeat = () => {}, onComplete = () => {}} = {}) {
  if (!document.querySelector('link[data-hommio-pov]')) {
    const sheet = document.createElement('link');
    sheet.rel = 'stylesheet';
    sheet.href = new URL('./first-person.css?v=43', import.meta.url).href;
    sheet.dataset.hommioPov = '';
    document.head.append(sheet);
  }
  const root = document.createElement('section');
  root.className = 'first-person';
  root.hidden = true;
  root.setAttribute('aria-label', 'First-person HOMMIO experience');
  container.append(root);
  let state = null;
  let phoneExperience = null;
  let openSequence = 0;

  let firstTapImages;
  function prepareFirstTap() {
    if (firstTapImages || typeof Image === 'undefined') return;
    const files = ['story-cuts/unbox.webp','story-cuts/magnet-discover.webp',
      'story-cuts/magnet-read.webp','hand-card-portrait.webp','hand-phone.webp',
      'mosh/magnet-back.webp','mosh/magnet-front.webp','mosh/phone-bar.webp'];
    firstTapImages = files.map(file => {
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = 'low';
      image.src = asset(file);
      image.decode?.().catch(() => {});
      return image;
    });
  }

  function beat(id,text) {
    if(!state || state.beats.has(id)) return;
    state.beats.add(id);
    onBeat({id,text,actor:state.actor,kind:state.kind});
  }

  function phoneContent() {
    if (!state.scanned) return '';
    return `<div class="pov-lockscreen"><span class="pov-lock-date">Today, at home</span><strong>9:41</strong><button type="button" class="pov-nfc-notification"><span class="pov-nfc-icon">◔</span><span><b>Website NFC Tag</b><small>MOSH</small><i>Tap to open in your browser</i></span></button><small class="pov-nfc-demo">Demo NFC</small></div>`;
  }

  function openPhoneExperience() {
    if(!state || !state.scanned || phoneExperience) return;
    state.opened=true;
    state.phoneStartedAt=state.time;
    const context={actor:state.actor,brand:state.brand,kind:state.kind,episodeId:state.episodeId};
    phoneExperience=createPhoneExperience(root.querySelector('.pov-phone-screen'),{
      brand:state.brand,kind:state.kind,actorName:String(state.actor.name||'Emma').split(' ')[0],episodeId:state.episodeId,offer:state.offer,tapElapsed:state.time-state.scannedAt,autoPlay:state.autoPlay&&!state.preview,autoInstall:state.autoInstall,canInstall:state.kind==='unboxing',
      onReward:()=>{if(!state||state.episodeId!==context.episodeId||context.kind==='unboxing')return;state.rewardAt=state.time;root.querySelector('.pov-caption').textContent='Reward saved.';beat('reward','One round, five points. Lunch is ready.');},
      onSurveyAnswer:category=>{if(context.kind==='survey'&&state?.episodeId===context.episodeId)beat(category?'survey-shared':'survey-skipped',category);},
      onWelcome:()=>{if(!state||state.episodeId!==context.episodeId)return;root.querySelector('.pov-caption').textContent='10% off, ready to use.';beat('welcome','The family’s MOSH offer.');},
      onInstall:install,
      onOrder:event=>{if(!state||state.episodeId!==context.episodeId||state.ordered)return;state.ordered=true;onOrder({...context,...event});if(context.kind==='reorder-story')beat('order-confirmed','');},
      onComplete:event=>{if(!state||state.episodeId!==context.episodeId||state.complete)return;state.complete=true;onComplete({...context,...event});},
      onBack
    });
  }

  function updatePhone() {
    if (!state) return;
    phoneExperience?.destroy();phoneExperience=null;
    root.querySelector('.pov-phone-screen').innerHTML = phoneContent();
    root.querySelector('.pov-nfc-notification')?.addEventListener('click',openPhoneExperience);
    if(state.opened)openPhoneExperience();
  }

  function install() {
    if(!state || state.kind!=='unboxing' || state.installed || state.installRequested || !state.scanned || !state.opened) return;
    state.installRequested=true;
    state.frontRevealAt=state.time;
    root.querySelector('.pov-device').hidden=true;
    root.classList.add('is-card-front','is-presenting-front');
    const card=root.querySelector('.pov-card-copy');
    if(card){card.disabled=true;card.setAttribute('aria-label','The food photograph faces the room');}
    root.querySelector('.pov-caption').textContent='Beautiful side out.';
    beat('beauty','Let’s put HOMMIO on the fridge.');
  }

  function finishInstall() {
    if(!state||!state.installRequested||state.installed)return;
    state.installed=true;
    root.classList.add('is-installing');
    root.querySelector('.pov-caption').textContent='A place on the fridge.';
    onInstall({actor:state.actor, brand:state.brand, kind:state.kind});
  }

  function scan() {
    if (!state || state.scanned) return;
    state.scanned = true;
    state.scannedAt = state.time;
    root.classList.add('is-raised', 'is-scanned');
    root.querySelector('.pov-caption').textContent = state.kind === 'unboxing' ? 'One tap opens MOSH.' : state.kind === 'survey' ? 'Two quick shopping questions.' : state.kind === 'game' ? 'A moment of play.' : 'Reorder directly from MOSH.';
    const hotspot=root.querySelector('.pov-magnet');
    if(hotspot)hotspot.hidden=true;
    root.querySelector('.pov-device').hidden=false;

    updatePhone();
    onTap({actor:state.actor, brand:state.brand, kind:state.kind});
  }

  function open({offer={},alreadyTapped=false,preview=false,showBack=true, autoTapDelay=1.5, autoPlay=true, autoInstall=false, episodeId, actor = {name:'Emma'}, brand = 'MOSH', kind = 'reorder', point = 'Refrigerator', autoTap = true} = {}) {
    phoneExperience?.destroy();phoneExperience=null;
    state = {offer,preview,episodeId:episodeId||`pov-${++openSequence}`,complete:false,autoTapDelay:kind==='unboxing'?Math.max(7.25,autoTapDelay):autoTapDelay,autoPlay,autoInstall,actor, brand:String(brand || 'MOSH'), kind, point, autoTap, time:0, scanned:false, opened:false, ordered:false, installed:false, installRequested:false,frontRevealAt:null,rewardAt:null, stars:new Set(),beats:new Set()};
    root.className = 'first-person'+(kind==='unboxing'?' pov-unboxing':'');
    root.hidden = false;
    const atParcel=kind==='unboxing';
    const shot=atParcel?'unbox':alreadyTapped?'game':kind==='game'?'daniel-game-tap':'reorder-tap';
    const photoAlt=atParcel?'The Bennetts open their MOSH delivery together at the kitchen island':alreadyTapped?'Daniel and Noah stand beside the microwave.':kind==='game'?'Daniel touches his phone to HOMMIO on the refrigerator.':'Emma touches her phone to HOMMIO on the refrigerator.';
    root.innerHTML = `<img class="pov-room" src="${asset('story-cuts/'+shot+'.webp')}" alt="${photoAlt}">
      <header class="pov-header"><button type="button" class="pov-back" aria-label="Back to the family scene">‹</button></header>
      ${preview?'<nav class="pov-modes" aria-label="Tap experience"><button data-mode="reorder" aria-pressed="'+(kind==='reorder')+'">Reorder</button><button data-mode="game" aria-pressed="'+(kind==='game')+'">Game</button></nav>':''}
      ${atParcel?'<div class="pov-approach-hand" aria-hidden="true"><img src="'+asset('hand-phone.webp')+'" alt=""><span>Ready to scan</span></div>':alreadyTapped?'':'<button type="button" class="pov-magnet" aria-label="Tap HOMMIO on the refrigerator"></button>'}
      <div class="pov-device" hidden><div class="pov-phone-screen"></div></div>
      <p class="pov-caption">Tap to explore.</p>`;
    if(!showBack)root.querySelector('.pov-header').remove();
    if(kind==='unboxing') {
      root.dataset.unboxShot='unbox';
      const card=document.createElement('div');
      card.className='pov-card-hand portrait-card';
      card.innerHTML=`<img src="${asset('hand-card-portrait.webp')}" alt="Dad lifts the tall, thin HOMMIO magnet from the parcel"><button type="button" class="pov-card-copy is-art" aria-label="Tap the HOMMIO magnet to open the MOSH preview"><img class="pov-card-back" src="${asset('mosh/magnet-back.webp')}" alt="MOSH. ${MOSH.missionCTA}. Powered by Hommio."><img class="pov-card-front" src="${asset('mosh/magnet-front.webp')}" alt="The front is a beautiful cookie dough bar photograph with no logo or text"></button>`;
      root.append(card);
      const tapBack=()=>{if(!state||state.installRequested)return;if(state.time<7.8)state.time=7.8;scan();};
      root.querySelector('.pov-card-copy').addEventListener('click',tapBack);
      // The early close-up is a photograph of the actual card. Map its printed
      // back to the same in-story tap as the raised card.
      const missionPhoto=document.createElement('div');
      missionPhoto.className='pov-mission-photo';
      missionPhoto.innerHTML=`<div><button type="button" aria-label="Tap the HOMMIO magnet to open the MOSH preview"></button></div>`;
      missionPhoto.querySelector('button').addEventListener('click',tapBack);
      root.append(missionPhoto);
      root.querySelector('.pov-caption').textContent='Their MOSH delivery, opened together.';
    }
    root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{state.kind=b.dataset.mode;root.querySelector('.pov-caption').textContent=state.kind==='game'?'A moment of play.':'Reorder directly from MOSH.';state.ordered=false;state.opened=state.scanned;root.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));updatePhone();});
    root.querySelector('.pov-back')?.addEventListener('click', () => onBack());
    const fridgeMagnet=root.querySelector('.pov-magnet');
    fridgeMagnet?.addEventListener('click',scan);
    if(alreadyTapped){
      state.scanned=true;state.scannedAt=0;
      root.classList.add('is-raised','is-scanned');
      root.querySelector('.pov-device').hidden=false;
      openPhoneExperience();
    }
  }

  return {
    open,prepareFirstTap,
    close() { phoneExperience?.destroy();phoneExperience=null;root.hidden = true; state = null; },
    isOpen() { return !!state; },
    tick(dt) {
      if (!state || dt <= 0) return;
      state.time += dt;
      if(state.kind==='unboxing'&&!state.installRequested) {
        // The same directed clock drives the photo sequence and the actors' beats.
        // Before the phone rises, a third-person close-up explains each discovery.
        const shot=state.time<1.65?'unbox':state.time<3.65?'magnet-discover':state.time<5.85?'magnet-read':'phone';
        if(root.dataset.unboxShot!==shot){
          root.dataset.unboxShot=shot;
          const room=root.querySelector('.pov-room');
          room.setAttribute('src',asset('story-cuts/'+(shot==='phone'?'unbox':shot)+'.webp'));
          room.alt=shot==='magnet-discover'?'Daniel discovers the two-sided HOMMIO magnet inside the MOSH box':shot==='magnet-read'?'Daniel turns over the rectangular magnet and reads the MOSH tap invitation':'The Bennetts explore the MOSH delivery together at the kitchen island';
        }
        if(state.time>=1.65&&!state.beats.has('card')){
          root.classList.add('is-card-out');
          root.querySelector('.pov-caption').textContent='Daniel finds HOMMIO.';
          beat('card','There’s a little card in here, too.');
        }

        if(shot==='magnet-read'&&!state.beats.has('read')){root.querySelector('.pov-caption').textContent=MOSH.missionCTA;beat('read',MOSH.missionCTA);}
        if(state.time>=5.85){root.classList.add('is-raised');beat('phone','Let me grab my phone and try it.');}
      } else if (state.time >= .6) root.classList.add('is-raised');
      if (state?.autoTap && state.time >= state.autoTapDelay) scan();
      if(state?.scanned&&!state.opened&&state.time-state.scannedAt>=1.6)openPhoneExperience();
      if(state&&state.time>state.phoneStartedAt)phoneExperience?.tick(dt);
      if(state?.installRequested&&!state.installed){
        const held=state.time-state.frontRevealAt;
        if(held>=1.75&&!state.beats.has('choose')){
          const room=root.querySelector('.pov-room');
          room.setAttribute('src',asset('story-cuts/family-keeps-hommio.webp'));
          room.alt='Noah points at the chocolate-chip artwork in Daniel’s hand. Emma and Olivia look on at the island.';
          root.dataset.unboxShot='family-keeps-hommio';
          root.classList.add('is-family-choice');
          beat('choose','The family chooses a place by the fridge handle.');
        }
        if(held>=4.25)finishInstall();
      }
    }
  };
}
