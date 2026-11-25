import {Gardencup} from './brand-assets.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const surveyQuestions = [
  {key:'frequency', title:'How often have you bought directly from a brand in the last three months?', options:['Once','2–3 times','4 or more times']},
  {key:'category', title:'Which category have you recently bought or considered?', options:['Beauty & skincare','Fashion & accessories','Food & beverage','Pet products']}
];
const startingBalance = 32;
const surveyReward = 20;
const gameReward = 5;
const couponTarget = 100;
const productBox = new URL('./assets/gardencup/box.webp', import.meta.url).href;
const boxCents=Math.round(Gardencup.price*100);
const price=cents=>'$'+(cents/100).toFixed(2);
const brandLogo = new URL('./assets/gardencup/logo.svg', import.meta.url).href;

/** Local concept rewards. Only reorder-story scripts an actor confirming a demo order. */
export function createPhoneExperience(host, {brand='Gardencup', kind='game', actorName='Emma', autoPlay=false, autoInstall=false, canInstall=false, tapElapsed=0, episodeId='pov', offer={}, onReward=()=>{}, onSurveyAnswer=()=>{}, onWelcome=()=>{}, onInstall=()=>{}, onOrder=()=>{}, onComplete=()=>{}, onBack=()=>{}}={}) {
  if(!document.querySelector('link[data-phone-experience]')) {
    const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./phone-experience.css?v=48',import.meta.url).href;link.dataset.phoneExperience='';document.head.append(link);
  }
  const state={page:kind==='unboxing'?'welcome':kind==='survey'?'survey':kind==='reorder-story'?'quickorder':kind==='reorder'?'shop':'home',time:0,pageTime:0,points:0,game:null,completed:false,walletSeen:false,shopSeen:kind==='reorder',installed:false,ordered:false,manual:false,dead:false,cart:kind==='reorder-story',completeSent:false,welcomeNotified:false,surveyStep:0,draft:{},preferences:{},surveySkipped:false,orderedAt:null};
  const surveyAlreadyEarned=Boolean(offer.surveyComplete);
  if(kind==='survey' && surveyAlreadyEarned){
    state.page='surveyDone';
    state.preferences={...offer.preferences};
  }
  const balance=()=>startingBalance+(offer.surveyComplete?surveyReward:0)+(offer.gamePoints||0);
  const fixedOffer=()=>offer.useFive===true && balance()>=couponTarget;
  const code=()=>'DEMO10';
  const discountLabel=()=>fixedOffer()?'$5':'10%';
  const discountCents=()=>fixedOffer()?500:Math.round(boxCents*.10);
  const orderCents=()=>boxCents-discountCents();
  const label=esc(brand);
  const brandMark=String(brand).trim().toUpperCase()==='GARDENCUP'?`<img class="px-brand-logo" src="${brandLogo}" alt="Gardencup">`:label;
  const primary = (text,action,extra='') => `<button type="button" class="px-primary ${extra}" data-action="${action}">${text}</button>`;
  const miniProduct = `<img src="${productBox}" alt="Gardencup Protein Sampler Pack with six chilled salads">`;
  const elapsed=()=>Math.max(0,Number(tapElapsed)||0)+state.time;
  function complete(reason='finished'){if(state.completeSent||state.dead)return;state.completeSent=true;onComplete({kind,reason,eventId:`${episodeId}:complete`});}

  function header(){return `<header class="px-header"><button type="button" class="px-wordmark" data-action="home" aria-label="${label} home">${brandMark}</button><button type="button" class="px-wallet-button" data-action="wallet" aria-label="Gardencup offers">Offers</button></header>`;}
  function pageTitle(text){return `<div class="px-page-title"><button type="button" data-action="home" aria-label="Back to rewards">‹</button><strong>${text}</strong></div>`;}
  function installButton(){return canInstall&&(kind==='unboxing'||state.completed)?primary(kind==='unboxing'?'Keep it on the fridge':'Put it on the fridge','install','px-install'):'';}
  function continueButton(){return kind==='game'&&state.completed?primary('Back to family','complete','px-secondary'):'';}
  function liveLink(url,text,css='px-live-link'){
    return `<a class="${css}" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${text} (opens in a new tab)">${text}</a>`;
  }
  function progress(){
    return `<div class="px-offer-progress"><progress value="${Math.min(balance(),couponTarget)}" max="${couponTarget}" aria-label="Progress toward five dollars off"></progress><span>${balance()} / ${couponTarget} pts</span></div>`;
  }
  function welcome(){
    const unlocked=balance()>=couponTarget;
    return `${header()}<div class="px-scroll px-offers">
      <section class="px-offer-ticket"><small>Demo offer · This pack</small><strong>10% <i>off</i></strong>
        <div class="px-ticket-code"><code>DEMO10</code><button type="button" data-action="copy">Copy</button></div>
        ${liveLink(Gardencup.shopURL,'Shop now','px-shop-live')}</section>
      <button type="button" class="px-next-ticket" data-action="${unlocked?'five-shop':'tasks'}"><small>${unlocked?'Ready to use':'Locked'}</small><strong>$5 off</strong>
        <span>${unlocked?'Use in demo basket':(couponTarget-balance())+' pts to unlock'}</span>${progress()}</button>
      ${installButton()}${continueButton()}
      <div class="px-offer-links">${liveLink(Gardencup.sampleURL,'Build a pack at Gardencup')}${liveLink(Gardencup.missionURL,'How it works','px-mission-link')}</div>
    </div>`;
  }
  function tasks(){
    return `${header()}<div class="px-scroll px-tasks">${pageTitle('Unlock $5 off')}${progress()}
      ${primary(offer.surveyComplete?'Preferences · Completed':'Preferences · 20 pts','take-survey')}
      ${primary('Draw Bridge · 5–100 pts','bridge','px-secondary')}
      ${liveLink(Gardencup.sampleURL,'Explore Gardencup’s pack builder')}${installButton()}</div>`;
  }
  function home(){
    return `<header class="px-direct-header"><span>${brandMark}</span><small>LUNCH BREAK</small></header>
      <div class="px-scroll px-bridge-intro"><div class="px-bridge-thumbnail" aria-hidden="true"><i></i><b></b></div>
      <h3>Draw Bridge</h3><p>Can you get across before lunch is ready?</p>${primary('Play a round','bridge')}${continueButton()}</div>`;
  }
  function shop(){return `${header()}<div class="px-scroll">${pageTitle('The family’s usual pack')}<div class="px-shop-hero">${miniProduct}<span>Six fresh salads.<br>Lunch is ready.</span></div><h3 class="px-product-name">Protein Sampler Pack</h3><p class="px-product-detail">Six ready-to-eat salad cups</p><div class="px-shop-price"><strong>${price(boxCents)}</strong><span>6-cup pack</span></div><div class="px-applied">✓ ${fixedOffer()?'$5 coupon':code()} applied <b>−${discountLabel()}</b></div>${state.cart?`<div class="px-cart-note">1 box in your demo basket <b>${price(orderCents())}</b></div>${primary('Place demo order','order')}`:primary('Add to demo basket','add')}<small class="px-shop-note">Product preview only. No real checkout or payment.</small>${installButton()}${continueButton()}</div>`;}
  // A short, keyboard-playable adaptation of the sample's bridge game.
  const gaps=[36,54,45];
  function game(){
    const g=state.game;
    const gap=gaps[g.hits];
    return `<div class="px-game px-bridge"><header class="px-game-header"><button type="button" data-action="home" aria-label="Exit game">×</button><span>${balance()} pts</span><b data-hits>${g.hits} / 3</b></header>
      <div class="px-game-title"><h3>Draw Bridge</h3><p>Lay the bridge when its tip reaches the next tower.</p></div>
      <div class="px-crossing" style="--gap:${gap}%"><i class="px-bank near"></i><i class="px-bank far"></i><i class="px-span" data-span></i><i class="px-runner" data-runner></i></div>
      ${primary('Lay bridge','lay')}<div class="px-game-feedback" aria-live="polite">${g.feedback}</div></div>`;
  }
  function result(){
    return `<div class="px-game-result"><small>DRAW BRIDGE</small><h3>Made it across!</h3><p>+${gameReward} points · ${balance()} total</p>
      ${progress()}${primary('Play again','home','px-secondary')}${installButton()}${continueButton()}</div>`;
  }
  function survey(){
    const question=surveyQuestions[state.surveyStep];
    return `<header class="px-direct-header"><span>${brandMark}</span><small>20 PTS</small></header><div class="px-scroll px-survey">
      <small class="px-survey-step">PREFERENCES · ${state.surveyStep+1} OF 2</small><h3>${question.title}</h3>
      <div class="px-survey-options">${question.options.map((option,i)=>`<button type="button" data-action="pref-${i}">${esc(option)}</button>`).join('')}</div>
      <button type="button" class="px-survey-skip" data-action="pref-skip">Skip for now</button></div>`;
  }
  function surveyDone(){
    const title=state.surveySkipped?'Maybe next time.':surveyAlreadyEarned?'Already completed.':'Preferences shared.';
    const status=state.surveySkipped?'Your 10% offer is still ready.':`${surveyAlreadyEarned?'20 points already credited':'20 points earned'} · ${balance()} total`;
    return `${header()}<div class="px-game-result px-survey-done"><small>QUICK PREFERENCES</small><h3>${title}</h3><p>${status}</p>
      ${progress()}${primary(kind==='survey'?'Back to family':'Back to offers',kind==='survey'?'complete':'wallet')}</div>`;
  }
  function orderRoute(confirmed){
    return `<ol class="px-order-route" aria-label="Direct reorder path"><li>Fridge tap</li><li ${confirmed?'':'aria-current="step"'}>Demo checkout</li><li ${confirmed?'aria-current="step"':'class="pending"'}>Confirmed</li></ol>`;
  }
  function quickorder(){return `<header class="px-direct-header"><span>${brandMark}</span><small>REORDER CONCEPT</small></header>${orderRoute(false)}<div class="px-reorder-timer"><span>Demo time since tap</span><b><span data-elapsed>${elapsed().toFixed(1)}</span> sec</b><div><i data-elapsed-bar style="width:${Math.min(100,elapsed()*10)}%"></i></div></div><div class="px-scroll px-quickorder"><h3>Reorder the usual box</h3><div class="px-usual-product">${miniProduct}<div><strong>Protein Sampler Pack</strong><small>Six ready-to-eat salads</small><span>1 box · 6 cups</span></div></div><div class="px-usual-basket"><div><span>Usual basket</span><b>${price(boxCents)}</b></div><div><span>Demo coupon · ${discountLabel()}</span><b>−${price(discountCents())}</b></div><div><strong>Demo total</strong><strong>${price(orderCents())}</strong></div></div><div class="px-saved-check">✓ Family’s usual selection</div>${primary(autoPlay&&!state.manual?esc(actorName)+' confirms the demo order…':'Confirm demo reorder','order')}<small class="px-shop-note">Local demonstration only.<br>No payment. No real order is sent.</small>${liveLink(Gardencup.shopURL,'Visit the Gardencup store')}</div>`;}
  function confirmation(){if(kind==='reorder-story')return `<header class="px-direct-header"><span>${brandMark}</span><small>DEMO ORDER CONFIRMED</small></header>${orderRoute(true)}<div class="px-game-result px-reorder-confirmation"><span class="px-result-sun">✓</span><h3>Next box ordered.</h3><strong class="px-reorder-time">${(state.orderedAt??elapsed()).toFixed(1)} seconds</strong><p>From the fridge directly to Gardencup.<br>Protein Sampler Pack · 6 cups · ${price(orderCents())}</p><small>Simulated order · no charge or shipment</small>${primary('Back to family','complete')}</div>`;return `<div class="px-game-result"><span class="px-result-sun">✓</span><h3>Demo order placed.</h3><p>One Protein Sampler Pack · ${price(orderCents())}</p><small>No charge. No real order.</small>${primary('Back to family','back')}</div>`;}

  function render(){if(state.dead)return;host.innerHTML=`<div class="px-app" data-brand="gardencup"><div class="px-browser-bar">Gardencup · HOMMIO preview ${autoPlay&&state.manual&&!state.completeSent?'<button class="px-resume" data-action="resume-demo">Resume story ▸</button>':''}</div>${({welcome,home,wallet:welcome,tasks,shop,game,result,confirmation,survey,surveyDone,quickorder}[state.page]||home)()}</div>`;host.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>act(button.dataset.action,button,true)));}
  function go(page){state.page=page;state.pageTime=0;if(page==='wallet')state.walletSeen=true;if(page==='shop')state.shopSeen=true;render();}
  function startGame(){
    state.game={hits:0,time:0,width:0,crossing:0,feedback:'Aim for the far tower.'};
    go('game');
  }
  function layBridge(){
    const g=state.game;
    if(!g||g.crossing>0)return;
    const gap=gaps[g.hits];
    if(g.width>=gap && g.width<=gap+13){
      g.crossing=.42;
      g.feedback='Across!';
    }else{
      g.feedback=g.width<gap?'A little too short. Try again.':'A little too long. Try again.';
      g.time=0;
    }
    host.querySelector('.px-game-feedback').textContent=g.feedback;
  }
  function tickBridge(dt){
    const g=state.game;
    if(g.crossing>0){
      g.crossing=Math.max(0,g.crossing-dt);
      host.querySelector('[data-runner]').style.left=(16+(gaps[g.hits]+4)*(1-g.crossing/.42))+'%';
      if(g.crossing>0)return;
      g.hits++;
      if(g.hits===gaps.length){
        offer.gamePoints=(offer.gamePoints||0)+gameReward;
        state.points+=gameReward;
        state.completed=true;
        state.game=null;
        go('result');
        onReward({points:state.points,earned:gameReward});
        return;
      }
      g.time=0;g.feedback='Next crossing.';render();
    }
    g.time+=dt;
    g.width=74*(1-Math.abs(1-(g.time*1.05)%2));
    host.querySelector('[data-span]').style.width=g.width+'%';
    if(autoPlay&&!state.manual&&g.width>=gaps[g.hits]+1&&g.width<=gaps[g.hits]+12)layBridge();
  }
  function answer(index){
    const question=surveyQuestions[state.surveyStep];
    if(!question.options[index])return;
    state.draft[question.key]=question.options[index];
    if(state.surveyStep===0){state.surveyStep=1;go('survey');return;}
    state.preferences={...state.draft};
    offer.surveyComplete=true;
    offer.preferences={...state.preferences};
    go('surveyDone');
    onSurveyAnswer(state.preferences.category);
  }
  async function copyCoupon(button){
    if(!button)return;
    try{
      await navigator.clipboard.writeText(code());
      button.textContent='Copied';
    }catch{
      const coupon=button.parentElement?.querySelector('code');
      const selection=globalThis.getSelection?.();
      if(coupon&&selection){
        const range=document.createRange();
        range.selectNodeContents(coupon);
        selection.removeAllRanges();
        selection.addRange(range);
        button.textContent='Code selected';
      }else button.textContent='Copy manually';
    }
  }
  function act(action,button,manual=false){if(state.dead)return;if(manual)state.manual=true;
    if(action==='resume-demo'){
      state.manual=false;
      if(kind==='survey')go(state.surveySkipped||state.preferences.category?'surveyDone':'survey');
      else if(kind==='reorder-story')go(state.ordered?'confirmation':'quickorder');
      else if(kind==='unboxing')go('welcome');
      else if(kind==='game'){if(state.completed)go('result');else if(state.game)go('game');else startGame();}
      else go(state.ordered?'confirmation':'shop');
    }
    else if(action==='home'){state.game=null;go(kind==='game'?'home':'welcome');}
    else if(action==='wallet'||action==='shop'||action==='tasks')go(action);
    else if(action==='five-shop'&&balance()>=couponTarget){offer.useFive=true;go('shop');}
    else if(action==='bridge')startGame();
    else if(action==='lay')layBridge();
    else if(action==='take-survey'){
      state.surveySkipped=false;
      state.surveyStep=0;state.draft={};
      if(offer.surveyComplete){state.preferences={...offer.preferences};go('surveyDone');}
      else go('survey');
    }
    else if(action==='copy')copyCoupon(button);
    else if(action==='add'){state.cart=true;render();}
    else if(action==='order'&&!state.ordered){state.ordered=true;state.orderedAt=elapsed();go('confirmation');onOrder({kind,amountCents:orderCents(),eventId:`${episodeId}:order`,elapsed:state.orderedAt});}
    else if(action==='install'&&canInstall&&(kind==='unboxing'||state.completed)&&!state.installed){state.installed=true;onInstall();}
    else if(/^pref-[0-3]$/.test(action)&&state.page==='survey')answer(Number(action.slice(-1)));
    else if(action==='pref-skip'){state.draft={};state.surveySkipped=true;go('surveyDone');onSurveyAnswer('');}
    else if(action==='complete')complete(state.surveySkipped?'skipped':'finished');
    else if(action==='back')onBack();
  }

  render();
  return {
    tick(dt){if(state.dead||dt<=0)return;state.time+=dt;state.pageTime+=dt;const g=state.game;
      if(state.page==='welcome'&&state.pageTime>=1.8&&!state.welcomeNotified){state.welcomeNotified=true;onWelcome();if(state.dead)return;}
      if(state.page==='quickorder'){const e=host.querySelector('[data-elapsed]'),bar=host.querySelector('[data-elapsed-bar]');if(e)e.textContent=elapsed().toFixed(1);if(bar)bar.style.width=Math.min(100,elapsed()*10)+'%';}
      if((kind==='survey'&&state.page==='surveyDone'||kind==='reorder-story'&&state.page==='confirmation')&&state.pageTime>=2){complete(state.surveySkipped?'skipped':'finished');if(state.dead)return;}
      if(state.page==='game'&&g)tickBridge(dt);
      if(autoPlay&&!state.manual&&!state.completeSent){
        if(kind==='unboxing'&&state.page==='welcome'&&state.pageTime>=4.2&&canInstall&&autoInstall&&!state.installed)act('install');
        else if(kind==='survey'&&state.page==='survey'&&state.pageTime>=2.1)answer(state.surveyStep===0?1:2);
        else if(kind==='reorder-story'&&state.page==='quickorder'&&elapsed()>=8)act('order');
        else if(state.page==='home'&&state.pageTime>=(kind==='game'&&!canInstall?1.4:4))startGame();
        else if(kind==='game'&&!canInstall&&state.page==='result'&&state.pageTime>=1.6)complete();
        else if(kind==='game'&&state.page==='result'&&state.pageTime>=2.8&&canInstall&&autoInstall&&!state.installed)act('install');
      }
    },
    destroy(){state.dead=true;host.innerHTML='';},
    getState(){return {page:state.page,points:state.points,completed:state.completed,walletSeen:state.walletSeen,shopSeen:state.shopSeen,installed:state.installed,ordered:state.ordered,completeSent:state.completeSent,preferences:{...state.preferences},surveySkipped:state.surveySkipped,elapsed:elapsed(),orderedAt:state.orderedAt};}
  };
}
