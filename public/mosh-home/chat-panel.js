const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const portraitIds=['emma','daniel','olivia','noah','cooper','maple'];
export function avatar(profile) {
  const index=Number.isInteger(profile.index)?profile.index:Math.max(0,portraitIds.indexOf(profile.id));
  return `<span class="family-avatar portrait-${index}" role="img" aria-label="${esc(profile.name)} portrait"></span>`;
}
export function createChatPanel(board, profiles, {onStart,onNext,onEconomics,onPreview=()=>{}}) {
  board.innerHTML=`<section class="conversation"><header class="conversation-header"><button class="family-identity" aria-label="Meet the Bennett family"><span><b>The Bennetts</b><small><i></i><span id="family-activity">At home together</span></small></span></button><button class="quiet-icon" id="family-about" aria-label="Family background"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 10.5v6M12 7.2v.8"/></svg></button></header><div class="chat-stream" role="log" aria-label="Family thoughts and conversation" aria-live="polite" aria-relevant="additions"></div><button class="new-messages" hidden>New messages ↓</button><footer class="conversation-footer conversation-footer--minimal" hidden><div class="small-stats sr-only" aria-label="Simulated household activity"></div><div class="conversation-status"><div class="playback-controls"><span id="story-caption"></span><button id="story-next" aria-label="Next scene">→</button></div><button id="view-economics">Economics ↗</button></div></footer></section>`;
  const stream=board.querySelector('.chat-stream'), newButton=board.querySelector('.new-messages');
  const dialog=document.createElement('dialog');dialog.className='family-dialog';dialog.setAttribute('aria-label','Meet the Bennett family');document.body.append(dialog);
  let selected=0;
  function renderProfile(i) {
    selected=i; const p=profiles[i];
    dialog.innerHTML=`<header><span>MEET THE BENNETTS</span><button aria-label="Close family background">×</button></header><nav aria-label="Family members">${profiles.map((p,n)=>`<button data-profile="${n}" aria-label="About ${esc(p.name)}" aria-pressed="${n===i}">${avatar(p)}<span>${esc(p.name)}</span></button>`).join('')}</nav><div class="profile-bio"><span class="profile-role">${esc(p.role)} · ${esc(p.age)}${typeof p.age==='number'?' years old':''}</span><h2>${esc(p.name)}${i<4?' Bennett':''}</h2><h3>${esc(p.job)}</h3><p class="profile-intro">${esc(p.shortBio)}</p>${p.bio.map(s=>`<p>${esc(s)}</p>`).join('')}<div class="interests">${p.interests.map(s=>`<span>${esc(s)}</span>`).join('')}</div><small class="profile-fiction">Fictional characters and AI-generated portraits, created for the HOMMIO demonstration.</small>`;
    dialog.querySelector('header button').onclick=()=>dialog.close();
    dialog.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>renderProfile(Number(b.dataset.profile)));
  }
  function openProfile(i=selected){renderProfile(i);dialog.showModal();}
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  board.querySelector('.family-identity').onclick=()=>openProfile();board.querySelector('#family-about').onclick=()=>openProfile();
  board.querySelector('#story-next').onclick=onNext;board.querySelector('#view-economics').onclick=onEconomics;
  stream.addEventListener('scroll',()=>{if(stream.scrollHeight-stream.scrollTop-stream.clientHeight<45)newButton.hidden=true;});
  newButton.onclick=()=>{stream.scrollTo({top:stream.scrollHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});newButton.hidden=true;};
  return {
    append({actor,kind='dialogue',text}) {
      const follow=stream.scrollHeight-stream.scrollTop-stream.clientHeight<65;
      const p=profiles[actor], row=document.createElement('article');row.className=`chat-message ${kind}`;
      row.innerHTML=`<button class="avatar-button" aria-label="About ${esc(p.name)}">${avatar(p)}</button><div class="message-content"><div class="message-meta"><b>${esc(p.name)}</b>${kind==='thought'?'<span>thinking</span>':''}</div><p>${esc(text)}</p></div>`;
      row.querySelector('button').onclick=()=>openProfile(actor);stream.append(row);
      if(stream.querySelectorAll('article').length>70)stream.querySelector('article').remove();
      if(follow){stream.scrollTop=stream.scrollHeight;newButton.hidden=true;}else newButton.hidden=false;
    },
    activity(title){board.querySelector('#family-activity').textContent=title;},
    update({story,seen,taps,orders,hasBrand}) {
      board.querySelector('.small-stats').textContent=hasBrand?`${seen} ${seen===1?'view':'views'} · ${taps} ${taps===1?'tap':'taps'} · ${orders} demo ${orders===1?'order':'orders'}`:'';
      board.querySelector('.small-stats').hidden=!hasBrand;
      board.querySelector('.playback-controls').hidden=!story||story.done;
      board.querySelector('#story-caption').textContent=story?`${story.stage+1} / ${story.total||7}`:'';
      board.querySelector('#story-caption').title=story?.title||'';
      const next=board.querySelector('#story-next');next.setAttribute('aria-label',story?.play==='enter'?'Return to unboxing':'Return to phone experience');next.textContent='Continue story  →';next.hidden=!story?.canNext;board.dataset.awaitingResume=String(!!story?.canNext);
      board.querySelector('.conversation-footer').hidden=(!story||story.done)&&!hasBrand;
      board.querySelector('#view-economics').hidden=!hasBrand;
    },
    show(){const conversation=board.querySelector('.conversation'),wasHidden=conversation.hidden;conversation.hidden=false;if(wasHidden)requestAnimationFrame(()=>{stream.scrollTop=stream.scrollHeight;newButton.hidden=true;});},
    hide(){board.querySelector('.conversation').hidden=true;},
    openProfile
  };
}
