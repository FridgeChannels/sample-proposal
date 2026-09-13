import { extractGiftChallengeConfig } from '../template/gift-challenge-template'

type FcAsinPlusTemplateConfig = {
  bodyMarkup: string
  css: string
  scripts: string[]
  fontLinks: string[]
}

const bodyMarkup = `
    <div class="asin-progress" aria-hidden="true"><i></i></div>
    <section class="asin-hero asin-slide">
      <div class="asin-wrap asin-hero__copy asin-reveal">
          <h1>Make the next purchase happen <em>without search</em>.</h1>
        <p>Every equipped shipment leaves a brand-owned, editable touchpoint in the customer’s home.</p>
      </div>
    </section>
    <section class="asin-hero-media asin-slide">
      <div class="asin-wrap asin-hero__visual asin-reveal" aria-label="A customer opens and uses a Fridge Channel magnet">
        <video class="hero-video" src="/videos/fc-amazon-brb.mp4" autoplay muted loop playsinline preload="metadata"></video>
      </div>
    </section>

    <section class="asin-how asin-slide">
      <div class="asin-wrap asin-how__layout asin-reveal">
        <p class="asin-label">How it compounds</p>
        <h2>How ASIN Plus Creates Compounding Value</h2>
        <div class="asin-steps" aria-label="How ASIN Plus creates compounding value">
          <article><span>01</span><h3>Ship</h3><p>Add another household entry point.</p></article>
          <article><span>02</span><h3>Install &amp; stay visible</h3><p>Keep the brand present in the home.</p></article>
          <article><span>03</span><h3>Tap</h3><p>Turn presence into engagement.</p></article>
          <article><span>04</span><h3>Reorder</h3><p>Create the next purchase opportunity.</p></article>
          <article><span>05</span><h3>Learn</h3><p>Capture attributable behavior and voluntary insight.</p></article>
          <article><span>06</span><h3>Optimize</h3><p>Improve the next destination or offer.</p></article>
        </div>
      </div>
    </section>

    <section class="asin-value asin-slide">
      <div class="asin-wrap asin-value__layout asin-reveal">
        <p class="asin-value__number">01</p>
        <h2>Turn Every Product into a Lasting Brand Asset</h2>
        <p class="asin-value__statement">The sale ends. Your brand’s presence in the home does not.</p>
        <div class="asin-commerce-visual asin-delivery-tag" aria-label="Product delivered, brand presence remains"><span>Order status</span><strong>Delivered</strong><i>Brand presence remains active</i></div>
      </div>
    </section>

    <section class="asin-value asin-slide">
      <div class="asin-wrap asin-value__layout asin-reveal">
        <p class="asin-value__number">02</p>
        <h2>Create a Zero-Search Reorder Path</h2>
        <p class="asin-value__statement">One tap takes the customer back to your Amazon Store—before category search begins.</p>
        <div class="asin-commerce-visual asin-search-path" aria-label="Tap goes directly to the Brand Store"><div class="asin-search-shell"><span>Search Amazon</span><b aria-hidden="true">⌕</b></div><p><strong>Tap</strong><i>→</i><strong>Your Brand Store</strong><i>→</i><strong>Reorder</strong></p></div>
        <p class="asin-disclosure">Competition may still appear on Amazon product detail pages.</p>
      </div>
    </section>

    <section class="asin-value asin-slide">
      <div class="asin-wrap asin-value__layout asin-reveal">
        <p class="asin-value__number">03</p>
        <h2>Unlock Attributable, BRB-Supported Traffic</h2>
        <p class="asin-value__statement">Route taps through Amazon Attribution to measure Store visits, conversions, and eligible BRB value.</p>
        <div class="asin-commerce-visual asin-attribution" aria-label="Attribution event receipt"><span>Attribution event</span><dl><div><dt>Source</dt><dd>FC ASIN+</dd></div><div><dt>Destination</dt><dd>Brand Store</dd></div><div><dt>Outcome</dt><dd>Measurable</dd></div></dl></div>
        <p class="asin-disclosure">BRB credits depend on Amazon eligibility and attribution rules.</p>
      </div>
    </section>

    <section class="asin-value asin-slide">
      <div class="asin-wrap asin-value__layout asin-reveal">
        <p class="asin-value__number">04</p>
        <h2>Build a Permission-Based Customer Learning Channel</h2>
        <p class="asin-value__statement">Use selected taps to collect voluntary feedback, preferences, and replenishment signals.</p>
        <div class="asin-commerce-visual asin-consent" aria-label="Voluntary customer signals"><span>Customer shared</span><p><i>✓</i> Replenishment need</p><p><i>✓</i> Preference</p><p><i>✓</i> Feedback</p></div>
        <p class="asin-disclosure">Information is collected only with appropriate customer consent.</p>
      </div>
    </section>

    <section class="asin-value asin-slide">
      <div class="asin-wrap asin-value__layout asin-reveal">
        <p class="asin-value__number">05</p>
        <h2>Stay Editable After Delivery—and Portable Beyond Amazon</h2>
        <p class="asin-value__statement">Amazon today. A new product, DTC, Walmart, or another destination tomorrow.</p>
        <div class="asin-commerce-visual asin-destinations" aria-label="One magnet can route to many destinations"><span class="is-active">Amazon Store</span><span>DTC</span><span>Walmart</span><span>Next channel</span></div>
      </div>
    </section>

    <section class="asin-value asin-slide">
      <div class="asin-wrap asin-value__layout asin-reveal">
        <p class="asin-value__number">06</p>
        <h2>Make Every Authorized Channel Expand the Brand Network</h2>
        <p class="asin-value__statement">Each participating shipment can install the same brand-owned entry point in another home.</p>
        <div class="asin-commerce-visual asin-network" aria-label="Participating shipments expand the household network"><div><span>Brand</span><span>Authorized seller</span><span>Participating channel</span></div><b></b><p><i>Home</i><i>Home</i><i>Home</i><i>Home</i></p></div>
      </div>
    </section>

    <section class="asin-fit asin-slide">
      <div class="asin-wrap asin-fit__layout asin-reveal">
        <h2>Is FC ASIN+ a fit?</h2>
        <div class="asin-fit__groups">
          <div class="asin-fit__group">
            <p class="asin-fit__label">Strong fit</p>
            <ol>
              <li>Your product has a clear replenishment or repeat-purchase cycle.</li>
              <li>Amazon is an important revenue channel.</li>
              <li>Customer acquisition is expensive relative to repeat-purchase value.</li>
              <li>You can influence production or packaging.</li>
              <li>You have an Amazon Store or Seller Storefront.</li>
              <li>You want attributable engagement beyond the initial transaction.</li>
              <li>You want permission-based customer relationships over time.</li>
            </ol>
          </div>
        </div>
      </div>
    </section>

`

const sampleTemplate = extractGiftChallengeConfig()

const pageCss = `
  html:has(.asin-page),body:has(.asin-page){overflow-x:clip;-webkit-text-size-adjust:100%;text-size-adjust:100%}
  .asin-page{--amazon-navy:#131921;--amazon-orange:#FF9900;--amazon-link:#007185;--amazon-surface:#F3F3F3;--amazon-border:#E0E0E0;overflow-x:clip}
  .asin-wrap{width:min(1280px,calc(100% - 48px - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px)));margin:0 auto}
  .asin-page h1,.asin-page h2,.asin-page h3{font-family:var(--leg-font)!important;font-weight:600!important}
  .asin-page h1,.asin-page h2{margin:0;letter-spacing:-.03em;line-height:1.06}
  .asin-label,.asin-value__number{margin:0;color:var(--amazon-orange);font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}

  .asin-hero,.asin-hero-media{min-height:100svh!important;display:flex;align-items:center;padding:72px 0 96px!important;background:var(--leg-background)!important}
  .asin-hero__copy{display:grid;max-width:960px;margin:0 auto;justify-items:center;text-align:center}
  .asin-hero h1{max-width:16ch;margin:0;font-size:clamp(3rem,5.2vw,4.1rem)!important}
  .asin-hero h1 em{font-style:normal;color:var(--amazon-orange)}
  .asin-hero__copy>p{max-width:60ch;margin:28px auto 0;color:#6b7280;font-size:clamp(1.05rem,1.6vw,1.25rem);font-weight:400;line-height:1.55}
  .asin-hero__visual{width:min(1180px,100%);margin:0 auto;overflow:hidden;border-radius:20px;background:#fff;box-shadow:0 1px 2px rgba(19,25,33,.05),0 18px 40px rgba(19,25,33,.08)}
  .asin-hero__visual video{display:block;width:100%;max-height:78svh;aspect-ratio:16/9;object-fit:cover;background:#000}

  .asin-how{padding:clamp(88px,10vw,128px) 0!important}
  .asin-how h2{max-width:860px;font-size:clamp(2.75rem,4.4vw,4.25rem)!important}
  .asin-steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:32px;margin-top:72px}
  .asin-step article,.asin-steps article{position:relative;padding-top:64px}
  .asin-steps article:before{content:"→";position:absolute;left:34px;right:-32px;top:0;height:30px;display:grid;place-items:center;color:var(--amazon-orange);font-size:18px;font-weight:500;line-height:1}
  .asin-steps article:last-child:before{display:none}
  .asin-steps span{position:absolute;left:0;top:0;display:grid;width:30px;height:30px;place-items:center;border-radius:50%;background:var(--amazon-navy);color:#fff;font-size:11px;font-weight:600}
  .asin-steps h3{margin:0 0 8px;font-size:1.15rem;letter-spacing:-.025em}
  .asin-steps p{max-width:24ch;margin:0;color:#6b7280;font-size:15px;line-height:1.5;font-weight:400}

  main>section.asin-value{min-height:68svh!important;display:flex;align-items:center;padding:clamp(88px,10vw,128px) 0!important}
  .asin-value__layout{display:grid;grid-template-columns:minmax(0,.8fr) minmax(420px,1.2fr);grid-template-areas:"number title" ". statement" ". cue" ". disclosure";column-gap:clamp(64px,8vw,120px);align-items:start}
  .asin-value__number{grid-area:number;padding-top:12px}
  .asin-value h2{grid-area:title;max-width:860px;font-size:clamp(2.9rem,4.8vw,4.9rem)!important}
  .asin-value__statement{grid-area:statement;max-width:62ch;margin:28px 0 0;color:#6b7280;font-size:clamp(1.05rem,1.6vw,1.3rem);font-weight:400;line-height:1.55}
  .asin-commerce-visual{grid-area:cue;width:min(100%,680px);margin-top:48px}
  .asin-delivery-tag{display:grid;grid-template-columns:1fr auto;grid-template-areas:"label status" "active active";gap:10px 24px;padding:20px 22px;background:var(--amazon-surface);border-left:6px solid var(--amazon-orange)}
  .asin-delivery-tag span{grid-area:label;color:#757575;font-size:13px}
  .asin-delivery-tag strong{grid-area:status;color:var(--amazon-link);font-size:16.4px;font-weight:600}
  .asin-delivery-tag i{grid-area:active;color:var(--leg-brand);font-size:clamp(1.15rem,2vw,1.45rem);font-style:normal;font-weight:500}
  .asin-search-path{display:grid;gap:18px}
  .asin-search-shell{display:grid;grid-template-columns:1fr 48px;overflow:hidden;border:1px solid var(--amazon-border);border-radius:12px;background:#fff;color:#757575}
  .asin-search-shell span{padding:12px 16px}
  .asin-search-shell b{display:grid;place-items:center;background:var(--amazon-orange);color:var(--amazon-navy);font-size:1.5rem;font-weight:400}
  .asin-search-path p{display:flex;flex-wrap:wrap;gap:10px 14px;margin:0;color:var(--amazon-navy);font-size:clamp(1.05rem,1.8vw,1.35rem)}
  .asin-search-path p strong{font-weight:500}.asin-search-path p i{color:var(--amazon-orange);font-style:normal}
  .asin-attribution{padding:22px 24px;background:var(--amazon-surface);box-shadow:none;border-radius:16px}
  .asin-attribution>span{display:block;margin-bottom:14px;color:#757575;font-size:13px}
  .asin-attribution dl{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:0}
  .asin-attribution dl div{min-width:0}.asin-attribution dt{color:#757575;font-size:12px}.asin-attribution dd{margin:5px 0 0;color:var(--amazon-navy);font-size:16.4px;font-weight:500}
  .asin-consent{display:flex;flex-wrap:wrap;gap:12px 22px;align-items:center}
  .asin-consent>span{width:100%;color:#757575;font-size:13px}
  .asin-consent p{margin:0;color:var(--amazon-navy);font-size:16.4px}.asin-consent i{display:inline-grid;width:22px;height:22px;margin-right:7px;place-items:center;border-radius:50%;background:#E8F5E9;color:#2E7D32;font-size:12px;font-style:normal}
  .asin-destinations{display:flex;flex-wrap:wrap;gap:10px}
  .asin-destinations span{padding:10px 16px;border-radius:999px;background:var(--amazon-surface);color:#424242;font-size:14px}
  .asin-destinations .is-active{background:var(--amazon-navy);color:#fff;box-shadow:inset 0 -4px 0 var(--amazon-orange)}
  .asin-network{display:grid;gap:18px}
  .asin-network>div,.asin-network>p{display:flex;justify-content:space-between;gap:10px;margin:0}
  .asin-network>div span{color:#424242;font-size:13px;text-align:center}
  .asin-network>b{display:block;height:3px;background:linear-gradient(90deg,transparent,var(--amazon-orange) 10%,var(--amazon-orange) 90%,transparent);position:relative}
  .asin-network>b:after{content:"";position:absolute;left:12%;right:12%;top:3px;height:28px;border-right:2px solid var(--amazon-orange);border-bottom:2px solid var(--amazon-orange);border-left:2px solid var(--amazon-orange);border-radius:0 0 20px 20px}
  .asin-network>p{padding-top:24px}.asin-network>p i{padding:8px 12px;border-radius:4px;background:var(--amazon-navy);color:#fff;font-size:12px;font-style:normal}
  .asin-disclosure{grid-area:disclosure;max-width:620px;margin:18px 0 0;color:var(--leg-muted-foreground);font-size:12px;line-height:1.45}

  .asin-fit{padding:clamp(88px,10vw,128px) 0!important}
  .asin-fit__layout{display:grid;grid-template-columns:minmax(300px,.64fr) minmax(620px,1.36fr);gap:clamp(64px,8vw,120px)}
  .asin-fit h2{font-size:clamp(2.75rem,4.4vw,4.25rem)!important}
  .asin-fit__groups{display:grid;max-width:720px}
  .asin-fit__label{margin:0 0 28px;color:#6b7280;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
  .asin-fit__group ol{counter-reset:fit;display:grid;gap:18px;margin:0;padding:0;list-style:none}
  .asin-fit__group li{counter-increment:fit;display:grid;grid-template-columns:30px 1fr;gap:12px;color:#131921;font-size:16px;font-weight:400;line-height:1.45}
  .asin-fit__group li:before{content:"✓";display:grid;width:22px;height:22px;place-items:center;border-radius:50%;background:var(--amazon-orange);color:var(--amazon-navy);font-size:12px;font-weight:700}

  .asin-page>section.asin-cta.asin-cta{min-height:100svh!important;display:flex;align-items:center;background:var(--leg-brand-dark)!important;color:var(--leg-brand-foreground)!important;text-align:center}
  .asin-cta__inner{display:flex;flex-direction:column;align-items:center}
  .asin-cta h2{max-width:960px;color:var(--leg-brand-foreground);font-size:clamp(3rem,5.2vw,5.75rem)!important}
  .asin-cta__inner>p:not(.asin-email){max-width:620px;margin:28px auto 0;color:color-mix(in oklch,var(--leg-brand-foreground) 68%,transparent);font-size:16.4px;line-height:1.55}
  .asin-code-label{display:flex;align-items:center;gap:16px;margin-top:30px;padding:10px 12px 10px 16px;border-radius:6px;background:#fff;color:var(--amazon-navy);box-shadow:0 8px 24px rgba(0,0,0,.14)}
  .asin-code-label span{color:#757575;font-size:12px}.asin-code-label strong{padding:7px 12px;border-radius:4px;background:var(--amazon-orange);font-size:16.4px;font-weight:600}
  .asin-button{display:inline-flex;min-height:44px;align-items:center;gap:10px;margin-top:20px;padding:8px 10px 8px 20px;border-radius:var(--leg-pill);background:var(--amazon-orange);color:var(--amazon-navy);font-size:16.4px;font-weight:600;text-decoration:none;touch-action:manipulation;transition:transform 100ms ease-out}
  .asin-button:active{transform:scale(.97)}
  .asin-button span{display:grid;width:28px;height:28px;place-items:center;border-radius:50%;background:var(--amazon-navy);color:#fff}
  .asin-email{margin:18px 0 0;color:color-mix(in oklch,var(--leg-brand-foreground) 62%,transparent);font-size:13px}
  .asin-email a{color:#fff}
  .asin-slides{display:contents}
  .asin-progress{display:none}
  .asin-how__layout .asin-label{margin-bottom:16px}

  .asin-ready .asin-hero__copy>*,
  .asin-ready .asin-hero__visual,
  .asin-ready .asin-how__layout>.asin-label,
  .asin-ready .asin-how__layout>h2,
  .asin-ready .asin-steps article,
  .asin-ready .asin-value__layout>*,
  .asin-ready .asin-fit__layout>h2,
  .asin-ready .asin-fit__label,
  .asin-ready .asin-fit__group li{
    opacity:0;
    transform:translate3d(0,18px,0);
    transition:opacity 1.05s cubic-bezier(.32,.08,.24,1),transform 1.05s cubic-bezier(.32,.08,.24,1)
  }
  .asin-ready .asin-hero__visual{transform:translate3d(0,22px,0) scale(.975)}
  .asin-ready .asin-slide.is-seen .asin-hero__copy>*,
  .asin-ready .asin-slide.is-seen .asin-hero__visual,
  .asin-ready .asin-slide.is-seen .asin-how__layout>.asin-label,
  .asin-ready .asin-slide.is-seen .asin-how__layout>h2,
  .asin-ready .asin-slide.is-seen .asin-steps article,
  .asin-ready .asin-slide.is-seen .asin-value__layout>*,
  .asin-ready .asin-slide.is-seen .asin-fit__layout>h2,
  .asin-ready .asin-slide.is-seen .asin-fit__label,
  .asin-ready .asin-slide.is-seen .asin-fit__group li{
    opacity:1;
    transform:none
  }
  .asin-ready .asin-hero__copy>:nth-child(1){transition-delay:.08s}
  .asin-ready .asin-hero__copy>:nth-child(2){transition-delay:.28s}
  .asin-ready .asin-hero__visual{transition-delay:.14s}
  .asin-ready .asin-how__layout>h2{transition-delay:.2s}
  .asin-ready .asin-steps article:nth-child(1){transition-delay:.28s}
  .asin-ready .asin-steps article:nth-child(2){transition-delay:.42s}
  .asin-ready .asin-steps article:nth-child(3){transition-delay:.56s}
  .asin-ready .asin-steps article:nth-child(4){transition-delay:.7s}
  .asin-ready .asin-steps article:nth-child(5){transition-delay:.84s}
  .asin-ready .asin-steps article:nth-child(6){transition-delay:.98s}
  .asin-ready .asin-value__number{transition-delay:.08s}
  .asin-ready .asin-value h2{transition-delay:.24s}
  .asin-ready .asin-value__statement{transition-delay:.44s}
  .asin-ready .asin-commerce-visual{transition-delay:.66s}
  .asin-ready .asin-disclosure{transition-delay:.86s}
  .asin-ready .asin-fit__label{transition-delay:.26s}
  .asin-ready .asin-fit__group li:nth-child(1){transition-delay:.36s}
  .asin-ready .asin-fit__group li:nth-child(2){transition-delay:.5s}
  .asin-ready .asin-fit__group li:nth-child(3){transition-delay:.64s}
  .asin-ready .asin-fit__group li:nth-child(4){transition-delay:.78s}
  .asin-ready .asin-fit__group li:nth-child(5){transition-delay:.92s}
  .asin-ready .asin-fit__group li:nth-child(6){transition-delay:1.06s}
  .asin-ready .asin-fit__group li:nth-child(7){transition-delay:1.2s}
  .asin-cta .asin-footer{width:min(100%,620px);margin-top:48px;padding:0;background:transparent;color:color-mix(in oklch,var(--leg-brand-foreground) 44%,transparent)}
  .asin-footer p{max-width:1000px;margin:0;font-size:11px;line-height:1.5}

  @media(max-width:980px){
    .asin-value__layout,.asin-fit__layout{display:block}
    .asin-value__number{padding:0}
    .asin-fit__layout{display:grid;grid-template-columns:1fr;gap:48px}
  }

  @media(max-width:760px){
    html:has(.asin-page),body:has(.asin-page),#root{height:100%;max-height:100dvh;overflow:hidden}
    .asin-page{height:100dvh!important;min-height:100dvh!important;overflow-x:clip;overflow-y:auto;scroll-snap-type:y mandatory;scroll-snap-stop:always;overscroll-behavior-y:contain;-webkit-overflow-scrolling:touch}
    .asin-page>section{height:auto!important;min-height:0!important;padding:0!important}
    .asin-progress{display:block;position:sticky;top:0;z-index:8;height:2px;background:transparent}
    .asin-progress i{display:block;height:100%;transform:scaleX(var(--asin-progress,.07));transform-origin:left center;background:var(--amazon-orange);transition:transform .35s cubic-bezier(.22,1,.36,1)}
    .asin-slide{box-sizing:border-box;display:flex;min-height:100dvh;align-items:center;padding:max(32px,env(safe-area-inset-top,0px)) 0 max(28px,env(safe-area-inset-bottom,0px));scroll-snap-align:start;scroll-snap-stop:always}
    .asin-wrap{width:min(100% - 40px - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px),1280px)}
    .asin-page h1,.asin-page h2{letter-spacing:-.03em;line-height:1.1}
    .asin-label,.asin-value__number{font-size:12px;letter-spacing:.14em;text-transform:uppercase}
    .asin-slide.is-active .asin-label,.asin-slide.is-active .asin-value__number{animation:asin-breathe 5.8s ease-in-out infinite}
    .asin-hero,.asin-hero-media{background:var(--leg-background)!important}
    .asin-hero h1{max-width:14ch;margin:0;font-size:clamp(2.15rem,8.4vw,2.6rem)!important;line-height:1.1!important}
    .asin-hero__copy>p{max-width:28ch;margin-top:20px;font-size:17px;line-height:1.47;letter-spacing:0}
    .asin-hero__visual{width:min(100% - 40px,1280px);border-radius:16px;box-shadow:0 1px 2px rgba(19,25,33,.06),0 12px 32px rgba(19,25,33,.08)}
    .asin-hero__visual video{max-height:72dvh;aspect-ratio:16/10;object-fit:cover}
    .asin-how.asin-slide{align-items:flex-start;overflow-y:auto;-webkit-overflow-scrolling:touch}
    .asin-how__layout{width:min(100% - 40px,1280px);margin:0 auto;padding:4px 0 12px}
    .asin-how h2{max-width:16ch;margin:12px 0 0;font-size:clamp(1.7rem,7.2vw,2.1rem)!important;line-height:1.14!important}
    .asin-steps{display:grid;grid-template-columns:1fr;gap:0;margin-top:20px}
    .asin-steps article{display:grid;grid-template-columns:32px minmax(0,1fr);grid-template-areas:"num title" "num copy";column-gap:12px;row-gap:2px;padding:8px 0 26px;box-shadow:none}
    .asin-steps article:last-child{padding-bottom:8px}
    .asin-steps article:before{display:grid;content:"↓";left:0;right:auto;top:auto;bottom:2px;width:28px;height:18px;color:var(--amazon-orange);font-size:14px;font-weight:600}
    .asin-steps span{position:static;grid-area:num;width:28px;height:28px;margin:2px 0 0;font-size:11px}
    .asin-steps h3{grid-area:title;margin:0;font-size:16px;letter-spacing:-.015em;line-height:1.3}
    .asin-steps p{grid-area:copy;max-width:none;margin:0;font-size:14px;line-height:1.4;letter-spacing:0}
    main>section.asin-value{min-height:100dvh!important}
    .asin-value .asin-wrap{width:min(36ch,calc(100% - 40px));max-width:36ch;margin-left:auto;margin-right:auto;text-align:center}
    .asin-value h2{max-width:14ch;margin:12px auto 0;font-size:clamp(1.85rem,7.6vw,2.25rem)!important;line-height:1.14!important}
    .asin-value__statement{max-width:28ch;margin:16px auto 0;font-size:17px;line-height:1.47;letter-spacing:0}
    .asin-commerce-visual{width:100%;margin-top:28px}
    .asin-value .asin-consent,
    .asin-value .asin-destinations,
    .asin-value .asin-search-path p,
    .asin-value .asin-network>div,
    .asin-value .asin-network>p{justify-content:center}
    .asin-delivery-tag{padding:20px;border-radius:12px}
    .asin-search-shell{grid-template-columns:1fr 48px;min-height:48px}
    .asin-search-shell b{min-height:48px}
    .asin-attribution{padding:20px;border-radius:12px}
    .asin-attribution dl{grid-template-columns:1fr;gap:16px}
    .asin-consent{gap:12px 16px}
    .asin-destinations span{min-height:44px;display:inline-flex;align-items:center;padding:12px 16px}
    .asin-network>div,.asin-network>p{flex-wrap:wrap;justify-content:center}
    .asin-network>div span{font-size:12px}
    .asin-network>p i{min-height:32px;padding:8px 12px;font-size:12px}
    .asin-disclosure{display:none}
    .asin-fit.asin-slide{align-items:flex-start;overflow-y:auto;-webkit-overflow-scrolling:touch}
    .asin-fit .asin-wrap{max-width:38ch;padding:4px 0 12px}
    .asin-fit h2{max-width:12ch;font-size:clamp(1.7rem,7.2vw,2.1rem)!important;line-height:1.14!important}
    .asin-fit__layout{gap:18px}
    .asin-fit__label{margin-bottom:12px}
    .asin-fit__group ol{gap:8px}
    .asin-fit__group li{grid-template-columns:28px 1fr;min-height:36px;align-items:flex-start;font-size:15px;line-height:1.35}
    .asin-page>section.asin-cta.asin-cta{min-height:100dvh!important;padding:0!important}
    .asin-cta h2{max-width:12ch;font-size:clamp(2rem,8.4vw,2.5rem)!important;line-height:1.12!important}
    .asin-cta__inner>p:not(.asin-email){max-width:28ch;margin-top:16px;font-size:17px;line-height:1.47}
    .asin-code-label{margin-top:24px;min-height:48px}
    .asin-button{width:100%;min-height:52px;justify-content:center;margin-top:16px}
    .asin-email{margin-top:16px;font-size:15px}
    .asin-email a{display:inline-flex;min-height:44px;align-items:center}
    .asin-cta .asin-footer{margin-top:28px}
    .asin-footer p{font-size:11px;line-height:1.5}
  }

  @keyframes asin-breathe{
    0%,100%{transform:scale(1);opacity:1}
    50%{transform:scale(1.04);opacity:.78}
  }

  @media(prefers-reduced-motion:reduce){
    .asin-button{transition:none}
    .asin-button:active{transform:none}
    .asin-hero__visual video{display:block}
    .asin-ready .asin-hero__copy>*,
    .asin-ready .asin-hero__visual,
    .asin-ready .asin-how__layout>.asin-label,
    .asin-ready .asin-how__layout>h2,
    .asin-ready .asin-steps article,
    .asin-ready .asin-value__layout>*,
    .asin-ready .asin-fit__layout>h2,
    .asin-ready .asin-fit__label,
    .asin-ready .asin-fit__group li,
    .asin-ready .asin-slide.is-seen .asin-hero__copy>*,
    .asin-ready .asin-slide.is-seen .asin-hero__visual,
    .asin-ready .asin-slide.is-seen .asin-how__layout>.asin-label,
    .asin-ready .asin-slide.is-seen .asin-how__layout>h2,
    .asin-ready .asin-slide.is-seen .asin-steps article,
    .asin-ready .asin-slide.is-seen .asin-value__layout>*,
    .asin-ready .asin-slide.is-seen .asin-fit__layout>h2,
    .asin-ready .asin-slide.is-seen .asin-fit__label,
    .asin-ready .asin-slide.is-seen .asin-fit__group li{opacity:1;transform:none;transition:none}
    .asin-slide.is-active .asin-label,.asin-slide.is-active .asin-value__number{animation:none}
    .asin-page{scroll-snap-type:none}
  }
`

export function createFcAsinPlusSampleConfig(): FcAsinPlusTemplateConfig {
  return {
    bodyMarkup,
    css: `${sampleTemplate.css}\n${pageCss}`,
    scripts: [],
    fontLinks: sampleTemplate.fontLinks,
  }
}
