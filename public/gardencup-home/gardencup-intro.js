import {introButtons} from './traffic-fit.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function loadGardencupIntroStyles(){
 if(document.querySelector('link[data-gardencup-intro]'))return;
 const sheet=document.createElement('link');
 sheet.rel='stylesheet';sheet.href=new URL('./gardencup-intro.css',import.meta.url).href;sheet.dataset.gardencupIntro='';
 document.head.append(sheet);
}

export function renderTrafficPhoto(asset){
 return `<a class="intro-traffic-photo" href="${esc(asset('gardencup-story/household-traffic.webp?v=53'))}" target="_blank" rel="noopener" aria-label="Open the full-size household traffic infographic">
   <img src="${esc(asset('gardencup-story/household-traffic-card.webp?v=53'))}" width="1056" height="594" fetchpriority="high" alt="The Bennett family and their pets in front of five daily touchpoints: the refrigerator, coffee station, microwave, snack pantry and lunch-packing counter.">
  </a>`;
}

/** The customer-facing introduction; the production photo library stays backstage. */
export function renderGardencupIntro(asset){
 return `<div class="gardencup-intro">
  ${renderTrafficPhoto(asset)}
  <div class="mi-copy">
   <h2>Gardencup salads in the Bennetts’ home</h2>
   <p class="intro-premise">In this demo, a HOMMIO magnet comes with the family’s Gardencup salads. <a class="mi-live-sample" href="https://gardencup.com/products/salad-pack-builder" target="_blank" rel="noopener noreferrer">Build a pack at Gardencup.</a></p>

   ${introButtons()}
  </div>
 </div>`;
}
