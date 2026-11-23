import {introButtons} from './traffic-fit.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function loadMoshIntroStyles(){
 if(document.querySelector('link[data-mosh-intro]'))return;
 const sheet=document.createElement('link');
 sheet.rel='stylesheet';sheet.href=new URL('./mosh-intro.css',import.meta.url).href;sheet.dataset.moshIntro='';
 document.head.append(sheet);
}

/** The customer-facing introduction; the production photo library stays backstage. */
export function renderMoshIntro(asset){
 return `<div class="mosh-intro">
  <figure class="mi-photo">
   <img class="family-detail" src="${esc(asset('mosh-story/family-card.webp'))}" alt="Daniel and Olivia share a drawing. Emma listens to Noah, with Cooper and Maple beside them." width="900" height="675" fetchpriority="high" decoding="async">
   <figcaption>Daniel, Olivia, Noah &amp; Emma · Cooper &amp; Maple</figcaption>
  </figure>
  <div class="mi-copy">
   <h2>MOSH bars in the Bennetts’ home</h2>
   <p class="intro-premise">In this demo, a HOMMIO magnet comes with the family’s MOSH bars. <a class="mi-live-sample" href="https://sample.fridgechannels.com/p/G5QD0W25PM" target="_blank" rel="noopener noreferrer">Try the live MOSH sample.</a></p>

   ${introButtons()}
  </div>
 </div>`;
}
