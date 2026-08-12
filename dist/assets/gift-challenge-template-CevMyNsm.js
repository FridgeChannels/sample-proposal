function e(e=`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="FridgeChannel Reward Challenge proposal">
  <title>Reward Challenge Proposal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --cream:#f6f0e6; --paper:#fffaf2; --ink:#251b16; --muted:#74675e;
      --rust:#c6633c; --gold:#e8b847; --forest:#17382b; --line:rgba(37,27,22,.14);
      --shadow:0 28px 80px rgba(68,44,26,.14);
    }
    *{box-sizing:border-box}
    html{font-size:16.4px;scroll-behavior:smooth;scroll-snap-type:y proximity}
    body{margin:0;background:var(--cream);color:var(--ink);font-family:"DM Sans",sans-serif;line-height:1.55}
    body:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.15;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E")}
    a{color:inherit}.wrap{width:min(1180px,calc(100% - 40px));margin:auto}
    .brand{font-family:"Playfair Display",serif;font-size:1.18rem;font-weight:700}
    h1,h2,h3{font-family:"Playfair Display",serif;line-height:1.02;margin:0}
    h1{font-size:clamp(3.1rem,7.2vw,7rem);letter-spacing:-.055em}
    h2{font-size:clamp(2.5rem,5vw,5rem);letter-spacing:-.045em}
    h3{font-size:clamp(1.45rem,2.6vw,2.2rem)}
    p{margin:0}.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:52px;padding:0 22px;border-radius:999px;text-decoration:none;font-weight:700;border:1px solid var(--ink);transition:.2s ease}
    .btn:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(37,27,22,.13)}
    section{padding:110px 0;border-bottom:1px solid var(--line)}
    .hero{min-height:calc(100vh - 72px);padding:42px 0 72px;display:flex;align-items:center}
    .hero-grid{display:grid;grid-template-columns:.86fr 1.14fr;gap:32px;align-items:center}
    .hero-copy{padding:30px 0}.hero-copy h1 em{font-weight:600;color:var(--rust)}
    .hero-sub{font-family:"Playfair Display",serif;font-size:clamp(1.25rem,2vw,1.7rem);margin:26px 0 18px;max-width:650px}
    .hero-body{color:var(--muted);max-width:620px}.flow{display:flex;flex-wrap:wrap;gap:8px;margin:28px 0}
    .flow span{padding:9px 12px;background:rgba(255,255,255,.65);border:1px solid var(--line);border-radius:999px;font-size:16.4px;font-weight:700}
    .flow i{font-style:normal;align-self:center;color:var(--rust)}
    .hero-visual{position:relative;min-height:650px;border-radius:34px;overflow:hidden;background:#d9c6aa}
    .hero-visual img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover}.statement{font-family:"Playfair Display",serif;font-size:clamp(1.8rem,3vw,3rem);text-align:center;max-width:900px;margin:54px auto 0}.reward{padding:16px;border-radius:14px;background:rgba(255,255,255,.1);font-weight:700}
    .progress{margin-top:auto}.track{height:12px;background:rgba(255,255,255,.18);border-radius:99px;overflow:hidden}.track i{display:block;width:10%;height:100%;background:var(--gold);border-radius:99px}.panel{background:var(--paper);border:1px solid var(--line);border-radius:24px;padding:28px}
    .panel h3{font-size:1.65rem;margin-bottom:16px}
    .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.metric{background:var(--paper);padding:22px;border-radius:16px}.metric small{display:block;color:var(--muted);min-height:42px}.metric strong{font-family:"Playfair Display",serif;font-size:2.1rem}.metric em{display:block;font-style:normal;color:var(--forest);font-size:16.4px;margin-top:4px}.physical{background:var(--paper);padding:24px;border-radius:18px}.package{border:1px solid rgba(255,255,255,.2);border-radius:24px;padding:26px;background:rgba(255,255,255,.06)}.package h3{font-size:2rem}
    .package ul{list-style:none;padding:0;margin:22px 0 0}.package li{padding:8px 0;border-top:1px solid currentColor;border-color:rgba(128,128,128,.25);font-size:16.4px}
    label{display:grid;gap:7px;font-size:16.4px;font-weight:700}input{width:100%;height:52px;border:1px solid var(--line);border-radius:12px;background:white;padding:0 14px;font:inherit;font-weight:700}
    button{height:52px;border:0;border-radius:12px;background:var(--rust);color:white;padding:0 22px;font:inherit;font-weight:700;cursor:pointer}
    .footer{padding:90px 0 36px}.footer-box{background:var(--rust);color:white;padding:50px;border-radius:30px;display:flex;justify-content:space-between;align-items:end;gap:30px}.footer-box h2{font-size:clamp(2.5rem,5vw,5.2rem)}.footer-box .btn{background:var(--paper);color:var(--ink);border-color:var(--paper)}
    .reveal{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s ease}.reveal.visible{opacity:1;transform:none}
    @media(max-width:900px){.hero-grid{grid-template-columns:1fr}.hero-visual{min-height:500px}.metrics{grid-template-columns:1fr 1fr}.footer-box{align-items:flex-start;flex-direction:column}}
    @media(max-width:560px){.wrap{width:min(100% - 24px,1180px)}section{padding:74px 0}.hero{padding-top:24px}.hero-visual{min-height:420px}.metrics{grid-template-columns:1fr}.footer-box{padding:30px}}

    /* FridgeChannel proposal visual system — shared with the original Nike deck */
    :root{
      --cream:#050505;--paper:#fff;--ink:#fff;--muted:#888;
      --rust:#ff5a1f;--gold:#d8ff2f;--forest:#050505;
      --brand-dark:#17382b;--brand-light:#f6f0e6;
      --line:rgba(255,255,255,.1);--shadow:0 30px 60px rgba(0,0,0,.42)
    }
    body{background:var(--brand-dark);color:#fff;font-family:"Inter",-apple-system,sans-serif}
    body:before{display:none}
    h1,h2,h3,.brand{font-family:"Inter",-apple-system,sans-serif}
    h1{font-weight:900;line-height:1.06;letter-spacing:-.045em}
    h2{font-weight:800;line-height:1.08;letter-spacing:-.035em}
    h3{font-weight:800}.brand{font-weight:900}
    .btn{border-color:#fff;border-radius:999px;text-transform:uppercase;letter-spacing:.045em;font-size:16.4px}
    section{min-height:100vh;padding:8rem 0;border-color:rgba(255,255,255,.1)}
    .hero{background:radial-gradient(circle at 78% 45%,color-mix(in srgb,var(--gold) 12%,transparent),transparent 46%),var(--brand-dark);padding-top:4rem}
    .hero-grid{grid-template-columns:1fr;gap:3rem}
    .hero-copy{max-width:none;padding-bottom:0}
    .hero-copy h1{max-width:none;font-size:clamp(2.25rem,3.2vw,3.6rem);font-weight:400;line-height:1.04;letter-spacing:-.04em}
    .hero-copy .hero-sub,.hero-copy .hero-body{max-width:650px}
    .hero-copy h1 em{font-style:normal;color:var(--gold)}
    .hero-sub{font-family:"Inter",sans-serif;font-weight:700;color:#fff}
    .hero-body{margin-top:28px;color:#888;line-height:1.65}.flow span{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.12)}.flow i{color:var(--rust)}
    .hero-visual{min-height:0;border-radius:24px;transform:none}
    .hero-visual:hover{transform:none}
    .hero-visual img{position:static;display:block;width:100%;height:auto;object-fit:contain}
    .hero-visual video{position:static;display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;background:#0d1f18}
    .statement{font-family:"Inter",sans-serif;font-weight:900;letter-spacing:-.035em}.reward{border:1px solid rgba(255,255,255,.12);border-radius:10px}
    .panel{background:#fff;border-color:#e5e7eb;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.06)}.panel h3{color:#111}
    .metric,.physical{background:#f7f7f7;border:1px solid #e5e7eb;color:#111;border-radius:12px}
    .metric small{color:#6b7280}.metric em{color:#16a34a}.package{background:#fff;color:#111;border:0;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.06);padding:1.5rem}.package:hover{transform:translateY(-4px);box-shadow:0 24px 70px rgba(0,0,0,.14)}.package li{border-color:#e5e7eb}.package li:before{content:"—";color:var(--rust);margin-right:.5rem}
    label{font-family:"Roboto Mono",monospace;color:var(--rust);text-transform:uppercase}
    input{border:0;border-bottom:2px solid #d1d5db;border-radius:0;font-size:2rem;height:58px;padding:0;background:transparent}
    button{background:var(--gold);color:#000;border-radius:999px;text-transform:uppercase;letter-spacing:.04em}
    .footer{background:var(--brand-dark)}.footer-box{background:transparent;color:#fff;border-radius:0;text-align:center;align-items:center;flex-direction:column;padding:30px 0}.footer-box .btn{background:var(--gold);color:#000;border-color:var(--gold)}
    @media(max-width:900px){.hero-grid{grid-template-columns:1fr}}

    /* How We Work Together — swimlane */

    /* FAQ */

    /* A single neutral canvas across the proposal; the closing CTA remains forest green. */
    main>section{background:#F5F5F5!important;color:#201712!important}
    main>section .hero-body{color:#6b625c}
    main>section .hero-sub{color:#201712}
    main>section .flow span{background:rgba(255,255,255,.72);border-color:rgba(32,23,18,.14)}
    main>section.hero{background:#F5F5F5!important;color:#201712!important}
    main>section.hero h1{text-align:center}
    main>section.hero .hero-sub{max-width:none;color:#201712;font-weight:400;text-align:center}
    .footer{background:var(--brand-dark)}

    /* 7.6 revision — opening, agenda, goals, and closing questions */
    .hero-copy{display:grid;justify-items:center;text-align:center}
    .hero-copy .hero-sub{max-width:980px!important;font-size:clamp(1.05rem,1.8vw,1.45rem);line-height:1.5}

    /* Slide system */
    :root{
      --slide-pad:clamp(72px,10vh,112px);
      --slide-title:clamp(2.75rem,5vw,4.75rem);
      --content-title:clamp(1.65rem,2.6vw,2.25rem);
    }
    .demo-slide{min-height:100svh;padding:var(--slide-pad) 0;display:flex;flex-direction:column;justify-content:center;border-bottom:1px solid rgba(32,23,18,.14)}
    .hero,.demo-slide,#pilot{scroll-snap-align:start;scroll-snap-stop:always}
    h2{font-weight:400!important}
    main>section.footer-slide{background:var(--brand-dark)!important;color:#fff!important}
    .footer-slide .footer-box{width:100%}
    @media(max-width:900px){
      .demo-slide{min-height:100svh;height:auto}
    }
    #moat.comparison-section{min-height:auto;padding:clamp(88px,10vw,140px) 0;border-bottom:1px solid #E5E5E5;scroll-snap-align:start}
    .comparison-intro{max-width:1160px;margin-bottom:clamp(44px,6vw,72px)}
    .comparison-intro h2{margin-top:22px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:clamp(2.7rem,5.4vw,6rem)!important;font-weight:700!important;line-height:.98;letter-spacing:-.058em;color:#0A0A0A}
    .comparison-intro h2 span,.comparison-intro h2 strong{display:block}
    .comparison-intro h2 span{color:#737373}
    .comparison-intro h2 strong{font-weight:750;color:var(--rust)}
    .comparison-axis{padding:28px 20px 28px 0}
    .comparison-axis span{display:block;font-family:"Roboto Mono",monospace;font-size:16.4px;font-weight:700;letter-spacing:.1em;color:var(--rust)}
    .comparison-axis strong{display:block;margin-top:8px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:1.05rem;font-weight:700;color:#0A0A0A}
    .comparison-legacy{background:#FAFAFA;color:#737373}
    .comparison-fc{background:color-mix(in srgb,var(--rust) 9%,#FFFFFF);color:var(--rust);border-left:1px solid color-mix(in srgb,var(--rust) 22%,#FFFFFF)}
    .comparison-fc p{font-weight:750}
    @media(max-width:820px){
      #moat.comparison-section{scroll-snap-align:none}
      .comparison-axis{grid-column:1/-1;padding:28px 0 16px;display:flex;align-items:baseline;gap:12px}
      .comparison-axis strong{margin-top:0}
    }
    @media(max-width:520px){
      .comparison-intro h2{font-size:clamp(2.5rem,12vw,4rem)!important}
    }
    #team.retention-loop-section{position:relative;height:220svh;min-height:0;padding:0!important;border-bottom:1px solid rgba(32,23,18,.14);scroll-snap-align:none}
    .retention-loop-sticky{position:sticky;top:0;display:flex;align-items:center;min-height:100svh;overflow:hidden;padding:clamp(42px,6vh,72px) 0}
    .retention-loop-layout{display:grid;grid-template-columns:minmax(330px,.72fr) minmax(560px,1.28fr);gap:clamp(32px,5vw,80px);align-items:center}
    .retention-loop-copy{position:relative;z-index:2}
    .retention-loop-copy h2{margin-top:22px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:clamp(2.65rem,4.5vw,5.25rem)!important;font-weight:700!important;line-height:.98;letter-spacing:-.055em;color:#0a0a0a}
    .retention-loop-copy p{max-width:34rem;margin-top:28px;font-size:clamp(16.4px,1.35vw,1.18rem);line-height:1.62;color:#64605b}
    .retention-loop-visual{position:relative;width:min(100%,720px,74svh);aspect-ratio:1/1;margin-inline:auto;isolation:isolate}
    .retention-loop-svg{position:absolute;inset:50% auto auto 50%;width:min(100%,720px);height:auto;overflow:visible;transform:translate(-50%,-50%)}
    .retention-loop-track,.retention-loop-progress{fill:none;stroke-width:2}
    .retention-loop-track{stroke:rgba(10,10,10,.1)}
    .retention-loop-progress{stroke:var(--forest);stroke-width:3;stroke-linecap:round;filter:drop-shadow(0 5px 12px rgba(23,56,43,.13))}
    .retention-loop-arrow{fill:var(--forest);opacity:0;transform-box:fill-box;transform-origin:center;transform:scale(.72);transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
    .retention-loop-section.is-complete .retention-loop-arrow{opacity:1;transform:scale(1)}
    .retention-node{--node-opacity:.16;--node-y:18px;--node-scale:.96;position:absolute;z-index:3;width:190px;opacity:var(--node-opacity);transform:translateY(var(--node-y)) scale(var(--node-scale));transition:filter .25s linear;will-change:transform,opacity}
    .retention-node:before{content:"";position:absolute;width:9px;height:9px;border-radius:50%;background:var(--forest);box-shadow:0 0 0 7px #f5f5f5,0 0 0 8px rgba(23,56,43,.18)}
    .retention-node strong{display:flex;align-items:baseline;gap:9px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:clamp(16.4px,1.3vw,1.22rem);font-weight:650;line-height:1.16;letter-spacing:-.025em;color:#0a0a0a}
    .retention-node .retention-index{font-family:"Roboto Mono",monospace;font-size:16.4px;font-weight:700;letter-spacing:.1em;color:var(--rust)}
    .retention-node .retention-metric{display:block;margin-top:12px;color:var(--forest)}
    .retention-loop-center{position:absolute;left:50%;top:50%;z-index:2;width:46%;transform:translate(-50%,-50%);text-align:center}
    .retention-loop-center .retention-metrics{display:flex;flex-direction:column;align-items:center;gap:30px}
    .retention-loop-center .retention-metric{display:flex;flex-direction:column;align-items:center;gap:10px;color:var(--forest)}
    .retention-loop-center .retention-number,.retention-node .retention-number{display:inline-block;margin-right:7px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:clamp(2rem,3vw,3.15rem);font-weight:700;line-height:.85;letter-spacing:-.06em;vertical-align:baseline}
    .retention-loop-center .retention-number{margin-right:0}
    .retention-loop-center .retention-unit,.retention-node .retention-unit{display:inline-block;max-width:110px;font-size:16.4px;font-weight:600;line-height:1.2;vertical-align:baseline}
    .retention-loop-center .retention-unit{max-width:170px}
    .retention-node--presence .retention-metrics{display:none;justify-content:center;gap:22px;margin-top:12px}
    .retention-node--presence .retention-metric{display:flex;align-items:baseline;margin-top:0;text-align:left}
    .retention-node--presence{left:50%;top:auto;bottom:calc(83.06% + 20.5px);width:300px;text-align:center;transform-origin:center bottom;margin-left:-150px}
    .retention-node--presence strong,.retention-node--mission strong{justify-content:center}
    .retention-node--presence:before{left:50%;bottom:-25px;transform:translateX(-50%)}
    .retention-node--tap{left:calc(83.06% + 22.5px);right:auto;top:50%;transform-origin:left center;transform:translateY(calc(var(--node-y) - 50%)) scale(var(--node-scale))}
    .retention-node--tap:before{left:-27px;top:50%;transform:translateY(-50%)}
    .retention-node--mission{left:50%;bottom:auto;top:calc(83.06% + 20.5px);text-align:center;transform-origin:center top;margin-left:-95px}
    .retention-node--mission:before{left:50%;top:-25px;transform:translateX(-50%)}
    .retention-node--behavior{right:calc(83.06% + 22.5px);left:auto;top:50%;text-align:right;transform-origin:right center;transform:translateY(calc(var(--node-y) - 50%)) scale(var(--node-scale))}
    .retention-node--behavior strong{justify-content:flex-end}
    .retention-node--behavior:before{right:-27px;top:50%;transform:translateY(-50%)}
    @media(max-width:980px){
      #team.retention-loop-section{height:auto}
      .retention-loop-sticky{position:relative;min-height:auto;padding:84px 0}
      .retention-loop-layout{grid-template-columns:1fr;gap:64px}
      .retention-loop-visual{min-height:0;max-width:720px;width:min(100%,720px);aspect-ratio:1/1;margin:0 auto}
    }
    @media(max-width:640px){
      .retention-loop-sticky{padding:72px 0}
      .retention-loop-copy h2{font-size:clamp(2.45rem,12vw,4rem)!important}
      .retention-loop-visual{display:grid;min-height:0;gap:0;margin-top:4px}
      .retention-loop-svg{display:none}
      .retention-node{position:relative;left:auto;right:auto;top:auto;bottom:auto;width:100%;min-height:138px;margin:0!important;padding:28px 0 28px 42px;text-align:left;opacity:1;transform:none;border-bottom:1px solid rgba(10,10,10,.12)}
      .retention-node strong,.retention-node--presence strong,.retention-node--mission strong,.retention-node--behavior strong{justify-content:flex-start}
      .retention-node:before{left:5px;right:auto;top:34px;bottom:auto;transform:none;box-shadow:0 0 0 7px #f5f5f5,0 0 0 8px rgba(23,56,43,.18)}
      .retention-node:not(.retention-node--behavior):after{content:"";position:absolute;left:9px;top:46px;bottom:-1px;width:1px;background:rgba(23,56,43,.28)}
      .retention-node .retention-metric{display:flex;align-items:baseline}
      .retention-node--presence .retention-metrics{justify-content:flex-start;gap:18px}
    }
    @media(prefers-reduced-motion:reduce){
      #team.retention-loop-section{height:auto}
      .retention-loop-sticky{position:relative;min-height:100svh}
      .retention-node{--node-opacity:1!important;--node-y:0px!important;--node-scale:1!important}
      .retention-loop-arrow{opacity:1!important;transform:scale(1)!important}
    }
    #fulfillment.pilot-section{min-height:auto;padding:clamp(88px,10vw,140px) 0;border-bottom:1px solid #E5E5E5;scroll-snap-align:start}
    .pilot-module{min-height:0;padding:56px 0;border-top:1px solid #E5E5E5}
    .pilot-module-label{display:flex;align-items:center;gap:12px;margin-bottom:26px;font-family:"Roboto Mono",monospace;font-size:16.4px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--forest)}
    .pilot-module-label span{color:var(--rust)}
    .workflow-label{margin-top:38px;padding-top:30px;border-top:1px solid #E5E5E5}
    .experiment-system{--diagram-line:color-mix(in oklch,var(--forest) 28%,transparent)}
    /* Incrementality test: a readable timeline with a clear parallel branch. */
    .experiment-flow{max-width:720px;margin:0 auto}
    .incrementality-statement{max-width:760px;margin:0 auto;text-align:center}
    .incrementality-statement strong{display:block;color:#0A0A0A;font-size:clamp(1.8rem,3.8vw,3.15rem);font-weight:400;line-height:1.03;letter-spacing:-.045em}
    .incrementality-statement p{max-width:48ch;margin:20px auto 0;color:#737373;font-size:clamp(16.4px,1.5vw,1.25rem);line-height:1.45}
    .incrementality-statement p strong{display:inline;color:#0A0A0A;font-size:inherit;font-weight:700;letter-spacing:normal}
    .blur-word{display:inline-block;filter:blur(8px);opacity:0;transform:translateY(-10px);transition:filter .55s ease,opacity .55s ease,transform .55s ease;transition-delay:calc(var(--word-i,0) * 45ms)}
    .blur-reveal.in-view .blur-word{filter:blur(0);opacity:1;transform:translateY(0)}
    @media(prefers-reduced-motion:reduce){.blur-word{filter:none!important;opacity:1!important;transform:none!important;transition:none!important}}
    /* Keep the pilot story focused on the content, not presentation metadata. */
    main .pilot-module-label{display:none!important}
    .effort-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid #E5E5E5;border-bottom:1px solid #E5E5E5}
    .effort-item{min-height:170px;padding:26px 22px;border-left:1px solid #E5E5E5}
    .effort-item:first-child{border-left:0}
    .effort-item strong{display:block;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:clamp(2rem,3.5vw,3.7rem);font-weight:750;line-height:.92;letter-spacing:-.06em;color:var(--forest)}
    .effort-item--price strong{color:var(--rust)}
    .effort-item span{display:block;margin-top:18px;color:#737373;font-size:16.4px;line-height:1.42}
    .effort-item [data-effort-count]{display:inline!important;margin:0!important;color:inherit!important;font:inherit!important;line-height:inherit!important}
    .responsibility-tabs{border:1px solid #E5E5E5;border-radius:20px;background:#fff;overflow:hidden}
    .responsibility-tablist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;padding:4px;background:#F1F1EE}
    .responsibility-tablist button{min-height:48px;padding:10px 14px;border:0;border-radius:16px;background:transparent;color:#737373;font:inherit;font-size:16.4px;cursor:pointer;transition:background-color .25s ease,color .25s ease,box-shadow .25s ease}
    .responsibility-tablist button[aria-selected="true"]{background:#fff;color:var(--forest);box-shadow:0 1px 5px rgba(0,0,0,.07)}
    .responsibility-panel{padding:24px 28px}
    .responsibility-panel[hidden]{display:none}
    .responsibility-panel ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 28px;margin:0;padding-left:18px;color:#737373;font-size:16.4px;line-height:1.45}
    .responsibility-note{margin:24px 0 0;color:#737373;font-size:13px;line-height:1.45}
    .responsibility-note strong{display:inline;color:var(--forest);font-size:inherit;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    @media(max-width:760px){
      #fulfillment.pilot-section{padding:44px 0;scroll-snap-align:none}
      .pilot-module{padding:24px 0}
      .pilot-module-label{margin-bottom:14px}
      .workflow-label{margin-top:28px;margin-bottom:16px;padding-top:24px}
      .experiment-flow{max-width:none}
      .effort-grid{grid-template-columns:repeat(2,1fr)}
      .effort-item{min-height:102px;padding:14px 12px;border-top:1px solid #E5E5E5}
      .effort-item:nth-child(odd){border-left:0}
      .effort-item:nth-child(-n+2){border-top:0}
      .effort-item strong{font-size:1.75rem}
      .effort-item span{margin-top:8px;font-size:16.4px;line-height:1.3}
      .responsibility-tablist button{height:auto;min-height:0;padding:9px 8px;font-size:16.4px;line-height:1.2}
      .responsibility-panel{padding:18px 16px}
      .responsibility-panel ul{grid-template-columns:1fr;gap:7px;font-size:16.4px}

      /* Give the two closing pilot modules their own mobile screen rhythm. */
      main > section.pilot-continuation[aria-label="Brand effort and pilot cost"],
      main > section.pilot-continuation--workflow[aria-label="Pilot responsibilities"]{
        display:flex;
        min-height:100svh;
        align-items:center;
        box-sizing:border-box;
        padding:56px 0;
        scroll-snap-align:start;
      }
      main > section.pilot-continuation[aria-label="Brand effort and pilot cost"] > .wrap,
      main > section.pilot-continuation--workflow[aria-label="Pilot responsibilities"] > .wrap{
        width:min(100% - 24px,1180px);
      }
      main > section.pilot-continuation[aria-label="Brand effort and pilot cost"] .pilot-module,
      main > section.pilot-continuation--workflow[aria-label="Pilot responsibilities"] .pilot-module{
        width:100%;
        padding:0;
      }
      main > section.pilot-continuation--workflow[aria-label="Pilot responsibilities"] .workflow-label{
        margin-top:0;
        padding-top:0;
        border-top:0;
      }
    }

    .footer-slide .footer-box.closing-box{display:grid;grid-template-columns:minmax(0,.95fr) minmax(420px,1.05fr);gap:clamp(64px,9vw,132px);align-items:center;padding:0;text-align:left}
    .closing-copy h2{margin-top:20px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:clamp(3.2rem,5.8vw,6.6rem)!important;font-weight:700!important;line-height:.96!important;letter-spacing:-.06em;color:#FFFFFF}
    .closing-gains{padding:24px 0 0;border-top:0!important}
    .closing-gains ul{margin:0;padding:0;list-style:none}
    .closing-gains li{display:grid;grid-template-columns:30px 1fr;gap:14px;padding:0 0 18px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:clamp(16.4px,1.45vw,1.3rem);font-weight:650;line-height:1.35;color:#FFFFFF}
    .closing-gains li+li{padding-top:2px}
    .closing-gains li:before{content:"✓";display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--gold);color:#0b3025;font-size:16.4px;font-weight:800}
    .closing-gains .btn{margin-top:32px}
    @media(max-width:760px){
      .footer-slide .footer-box.closing-box{grid-template-columns:1fr;gap:42px;align-items:start}
      .closing-copy h2{font-size:clamp(2.45rem,10.5vw,3.6rem)!important;line-height:1.02!important}
      .closing-gains{padding-top:0}
      .closing-gains li{grid-template-columns:28px 1fr;gap:11px;padding-bottom:17px;font-size:16.4px}
      .closing-gains li:before{width:22px;height:22px;font-size:16.4px}
      .closing-gains .btn{width:100%;justify-content:center;margin-top:24px}
    }

    /* Keep every proposal section on a neutral canvas; reserve forest for the final CTA. */
    body{background:#F5F5F5}
    main>section:not(.footer-slide){background:#F5F5F5!important;color:#201712!important}
    main>section.hero .hero-sub,
    main>section.hero .hero-body{color:#6b625c!important}
    .btn{background:#000!important;color:#fff!important;border-color:#000!important}
    .footer-slide .btn{background:#fff!important;color:#000!important;border-color:#fff!important}

    #mission.fit-section{min-height:100svh;padding:var(--slide-pad) 0;display:flex;align-items:center;border-bottom:1px solid rgba(32,23,18,.14);scroll-snap-align:start}
    .fit-layout{display:grid;grid-template-columns:minmax(300px,.72fr) minmax(540px,1.28fr);gap:clamp(56px,8vw,120px);align-items:start}
    .fit-head h2{margin-top:22px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:clamp(3rem,5.4vw,6rem)!important;font-weight:700!important;line-height:.97;letter-spacing:-.06em;color:#0a0a0a}
    .fit-signals{display:grid;gap:28px;border:0}
    .fit-signal{display:grid;grid-template-columns:48px 1fr;gap:20px;padding:0;border:0}
    .fit-check{display:grid;place-items:center;width:34px;height:34px;margin-top:2px;border-radius:50%;background:var(--forest);color:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:16.4px;font-weight:700}
    .fit-signal h3{margin-top:10px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:clamp(1.35rem,2vw,2rem);font-weight:650;line-height:1.12;letter-spacing:-.035em;color:#0a0a0a}
    .fit-signal p{max-width:55ch;margin-top:12px;color:#64605b;font-size:16.4px;line-height:1.58}
    @media(max-width:900px){
      #mission.fit-section{min-height:auto;scroll-snap-align:none}
      .fit-layout{grid-template-columns:1fr;gap:54px}
    }
    @media(max-width:560px){
      .fit-signal{grid-template-columns:38px 1fr;gap:14px;padding:26px 0}
      .fit-check{width:30px;height:30px}
      .fit-signal p{font-size:16.4px}
    }
    /* Legora UI system — mapped from the attached component library and styles.css. */
    :root{
      --leg-background:oklch(.985 .003 95);
      --leg-foreground:oklch(.17 .012 250);
      --leg-card:oklch(1 0 0);
      --leg-brand:oklch(.32 .055 160);
      --leg-brand-dark:oklch(.24 .045 160);
      --leg-brand-foreground:oklch(.985 .003 95);
      --leg-secondary:oklch(.96 .005 95);
      --leg-muted:oklch(.95 .005 95);
      --leg-muted-foreground:oklch(.5 .01 250);
      --leg-accent:oklch(.94 .01 160);
      --leg-border:oklch(.9 .008 95);
      --leg-font:"Inter Tight","Inter",ui-sans-serif,system-ui,sans-serif;
      --leg-radius:24px;
      --leg-pill:9999px;
      --leg-shadow:0 1px 2px rgba(18,31,27,.05),0 10px 30px rgba(18,31,27,.04);
    }
    html{font-size:16.4px;scroll-snap-type:none}
    body{background:var(--leg-background)!important;color:var(--leg-foreground)!important;font-family:var(--leg-font)!important;font-size:16.4px;font-weight:400;line-height:1.4;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
    .wrap{width:min(1280px,calc(100% - 48px))}
    main>section{min-height:auto!important;padding:clamp(88px,10vw,128px) 0!important;border-color:var(--leg-border)!important;color:var(--leg-foreground)!important}
    main>section:nth-of-type(odd):not(.footer-slide){background:var(--leg-background)!important}
    main>section:nth-of-type(even):not(.footer-slide){background:var(--leg-card)!important}
    h1,h2,h3,.brand,.retention-node strong,.effort-item strong{font-family:var(--leg-font)!important}
    h1,h2,h3{font-weight:400!important}
    .pilot-module-label,.retention-index{font-family:var(--leg-font)!important;font-size:16.4px!important;font-weight:500!important;line-height:1.35!important;letter-spacing:.14em!important;text-transform:uppercase;color:var(--leg-brand)!important}
    .hero{min-height:100svh!important;padding:72px 0 96px!important;background:var(--leg-background)!important}
    .hero-grid{grid-template-columns:1fr;gap:48px}
    .hero-copy{max-width:980px;margin:0 auto;padding:0;text-align:center;justify-items:center}
    .hero-copy h1{font-size:clamp(3rem,5.2vw,3.75rem)!important;font-weight:400!important;line-height:1.05!important;letter-spacing:-.04em!important}
    .hero-copy h1 em{font-style:normal!important;color:inherit!important}
    .hero-copy .hero-sub{max-width:860px!important;margin-top:24px;font-family:var(--leg-font)!important;font-size:clamp(1.18rem,2vw,1.5rem);font-weight:400;line-height:1.5;color:var(--leg-muted-foreground)!important}
    .hero-visual{width:100%;max-width:1180px;margin:0 auto;border:1px solid var(--leg-border);border-radius:var(--leg-radius);background:var(--leg-muted);box-shadow:var(--leg-shadow)}
    .hero-video{aspect-ratio:16/8.4!important}
    .retention-loop-section{height:300svh!important;padding:0!important;background:var(--leg-card)!important}
    .retention-loop-sticky{padding:clamp(72px,9vw,112px) 0!important}
    .retention-loop-layout{grid-template-columns:minmax(300px,.78fr) minmax(560px,1.22fr);gap:clamp(64px,8vw,112px)}
    .retention-loop-copy h2,.fit-head h2,.comparison-intro h2{font-size:clamp(2.75rem,4.4vw,4.25rem)!important;font-weight:400!important;line-height:1.03!important;letter-spacing:-.04em!important}
    .retention-loop-copy p,.fit-signal p,.effort-item span{color:var(--leg-muted-foreground)!important;font-weight:400}
    .retention-loop-track{stroke:var(--leg-border)!important}
    .retention-loop-progress{stroke:var(--leg-brand)!important}
    .retention-loop-arrow,.retention-node:before{fill:var(--leg-brand)!important;background:var(--leg-brand)!important}
    .retention-node:before{box-shadow:0 0 0 7px var(--leg-card),0 0 0 8px var(--leg-border)!important}
    .retention-node strong{font-size:1.15rem;font-weight:500!important;letter-spacing:-.02em}
    .retention-node .retention-number,.retention-loop-center .retention-number{font-weight:400!important;color:var(--rust)!important}
    .retention-node .retention-unit{color:var(--leg-brand);font-weight:500}
    #mission.fit-section{background:var(--leg-background)!important}
    .fit-layout{grid-template-columns:minmax(300px,.72fr) minmax(540px,1.28fr);gap:clamp(64px,8vw,120px)}
    .fit-signals{gap:32px;border:0}
    .fit-signal{grid-template-columns:42px 1fr;gap:18px;padding:0;border:0}
    .fit-check{width:32px;height:32px;background:transparent;color:var(--rust);font-size:1.3rem;font-weight:700}
    [data-fit-checklist] .fit-check{transform:scale(0);opacity:0;transition:transform .6s cubic-bezier(.34,1.56,.64,1),opacity .35s ease;transition-delay:calc(var(--check-i,0) * 500ms)}
    [data-fit-checklist].in-view .fit-check{transform:scale(1);opacity:1}
    @media(prefers-reduced-motion:reduce){[data-fit-checklist] .fit-check{transform:none!important;opacity:1!important;transition:none!important}}
    .fit-signal h3{font-size:clamp(1.5rem,2.4vw,2.25rem);font-weight:400!important;line-height:1.12;letter-spacing:-.03em}
    #moat.comparison-section{background:#454745!important;color:var(--leg-brand-foreground)!important}
    .comparison-intro h2{color:var(--leg-brand-foreground)!important}
    .comparison-intro h2 span{color:color-mix(in oklch,var(--leg-brand-foreground) 60%,transparent)!important}
    .comparison-intro h2 strong{font-weight:400!important;color:var(--leg-brand-foreground)!important}
    .comparison-axis{color:color-mix(in oklch,var(--leg-brand-foreground) 62%,transparent)!important}
    .comparison-axis span{color:var(--leg-brand-foreground)!important}
    .comparison-axis strong{color:var(--leg-brand-foreground)!important;font-weight:400!important}
    .comparison-legacy{background:color-mix(in oklch,var(--leg-brand-dark) 72%,black)!important;color:color-mix(in oklch,var(--leg-brand-foreground) 68%,transparent)!important}
    .comparison-fc{background:var(--leg-brand-foreground)!important;color:var(--leg-brand-dark)!important}
    .comparison-fc p strong{color:var(--rust)!important}
    #fulfillment.pilot-section{background:var(--leg-background)!important;padding:clamp(88px,10vw,128px) 0!important}
    .pilot-module{border-color:var(--leg-border);padding:48px 0}
    .effort-grid{border-color:var(--leg-border)}
    .effort-item{border-color:var(--leg-border)}
    .effort-item strong{font-weight:400!important;color:var(--rust)}
    .effort-item--price strong{color:var(--rust)}
    main>section.footer-slide{min-height:100svh!important;background:var(--leg-brand-dark)!important;color:var(--leg-brand-foreground)!important}
    .closing-copy h2{font-size:clamp(3rem,5.2vw,5.75rem)!important;font-weight:400!important;color:var(--leg-brand-foreground)!important}
    .closing-gains,.closing-gains li{border-color:color-mix(in oklch,var(--leg-brand-foreground) 20%,transparent)!important}
    .closing-gains li{font-weight:400;color:var(--leg-brand-foreground)}
    .closing-gains li:before{color:color-mix(in oklch,var(--leg-brand-foreground) 62%,transparent)}
    .btn,.footer-slide .btn{min-height:44px;padding:8px 10px 8px 20px;border:0!important;border-radius:var(--leg-pill)!important;background:var(--leg-brand)!important;color:var(--leg-brand-foreground)!important;font-family:var(--leg-font);font-size:16.4px;font-weight:500;text-transform:none;letter-spacing:0;box-shadow:none;transition:background-color .2s ease,transform .2s ease}
    .footer-slide .btn{background:var(--rust)!important;color:#fff!important}
    .btn:after{content:"→";display:grid;place-items:center;width:26px;height:26px;margin-left:4px;border-radius:50%;background:var(--leg-brand-foreground);color:var(--leg-brand);font-size:16.4px;transition:transform .2s ease}
    .footer-slide .btn:after{background:#fff;color:var(--rust)}
    .btn:hover{transform:none;box-shadow:none;background:var(--leg-brand-dark)!important}
    .footer-slide .btn:hover{background:color-mix(in oklch,var(--leg-brand-foreground) 90%,transparent)!important}
    .btn:hover:after{transform:translateX(2px)}
    .btn:focus-visible{outline:2px solid currentColor;outline-offset:4px}
    .reveal{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s ease}
    .section-reveal{opacity:0;transform:translateY(28px);transition:opacity .72s cubic-bezier(.22,1,.36,1),transform .72s cubic-bezier(.22,1,.36,1)}
    .section-reveal.visible{opacity:1;transform:none}
    @media(prefers-reduced-motion:reduce){.reveal,.section-reveal{opacity:1!important;transform:none!important;transition:none!important}}
    .comparison-carousel{overflow:hidden}
    .comparison-track{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
    .comparison-slide{min-width:0}
    .comparison-slide .comparison-axis{display:flex;align-items:baseline;gap:10px;padding:0 0 14px}
    .comparison-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));overflow:hidden;border:1px solid color-mix(in oklch,var(--leg-brand-foreground) 18%,transparent);border-radius:var(--leg-radius)}
    .comparison-panel{display:flex;min-height:240px;padding:24px;flex-direction:column;justify-content:space-between;gap:28px}
    .comparison-panel small{font-size:12px;font-weight:600;line-height:1.3;letter-spacing:.14em;text-transform:uppercase;opacity:.6}
    .comparison-panel p{font-family:var(--leg-font);font-size:clamp(1.4rem,2.1vw,1.9rem);font-weight:500;line-height:1.14;letter-spacing:-.03em}
    .comparison-fc p{font-weight:650}
    .comparison-slide--memory .comparison-fc p{font-size:clamp(1.6rem,2.5vw,2.5rem)}
    .comparison-slide--memory .comparison-fc p strong{display:block;margin-top:8px;font-size:1.7em;font-weight:400;color:var(--leg-brand)}
    .comparison-panel.comparison-fc{border-left:1px solid var(--leg-border)}
    .comparison-pager{display:none}
    @media(max-width:980px){
      .retention-loop-section{height:auto!important}
      .retention-loop-sticky{position:relative!important;min-height:auto!important}
      .retention-loop-layout,.fit-layout{grid-template-columns:1fr;gap:56px}
      .retention-loop-svg{display:none}
      .retention-loop-visual{display:grid;width:100%;aspect-ratio:auto;min-height:0;margin:0;gap:0}
      .retention-node{position:relative;left:auto;right:auto;top:auto;bottom:auto;width:100%;min-height:112px;margin:0!important;padding:24px 0 24px 40px;text-align:left;opacity:1;transform:none;border-bottom:1px solid var(--leg-border)}
      .retention-node:before{left:5px;right:auto;top:30px;bottom:auto;transform:none}
      .retention-node:not(.retention-node--behavior):after{content:"";position:absolute;left:9px;top:42px;bottom:-1px;width:1px;background:var(--leg-border)}
      .retention-node strong,.retention-node--presence strong,.retention-node--mission strong,.retention-node--behavior strong{justify-content:flex-start}
      .retention-loop-center{display:none}
      .retention-node--presence .retention-metrics{display:flex;justify-content:flex-start;flex-wrap:wrap}
    }
    @media(max-width:760px){
      .wrap{width:min(100% - 40px,1280px)}
      main>section{padding:88px 0!important}
      .hero{position:relative;min-height:100svh!important;padding:32px 0!important;overflow:hidden}
      .hero-grid{position:relative;display:flex!important;width:min(100% - 40px,680px)!important;min-height:calc(100svh - 64px);flex-direction:column;justify-content:center;gap:28px}
      .hero-copy{position:relative;z-index:2;width:100%;margin:0 auto;padding:0;text-align:center}
      .hero-copy h1{font-size:clamp(2.05rem,9vw,2.35rem)!important;line-height:1.08!important;letter-spacing:-.035em!important}
      .hero-copy .hero-sub{max-width:34ch;margin:28px auto 0;font-size:16.4px;line-height:1.55}
      .hero-visual{position:relative;inset:auto;z-index:1;width:100%;height:auto;aspect-ratio:16/9;border:1px solid var(--leg-border)!important;border-radius:16px!important;box-shadow:var(--leg-shadow)!important;overflow:hidden}
      .hero-visual:after{display:none}
      .hero-video{width:100%!important;height:100%!important;aspect-ratio:16/9!important;border-radius:0!important;object-fit:contain!important;object-position:center;background:#000}
      .retention-loop-section{height:auto!important}
      .retention-loop-sticky{position:relative!important;min-height:auto!important;padding:72px 0 54px!important;overflow:hidden}
      .retention-loop-layout{display:grid;grid-template-columns:1fr;gap:28px}
      .retention-loop-copy h2,.fit-head h2,.comparison-intro h2{font-size:clamp(2.05rem,9vw,2.35rem)!important;line-height:1.07!important;letter-spacing:-.035em!important}
      .retention-loop-copy p{margin-top:18px;font-size:16.4px;line-height:1.5}
      .retention-loop-visual{position:relative;display:block;width:100%;aspect-ratio:auto;min-height:470px;margin:0;overflow:visible}
      .retention-loop-svg{display:block;position:absolute;left:50%;top:50%;width:280px;height:280px;transform:translate(-50%,-50%)}
      .retention-loop-center{display:block;position:absolute;left:50%;top:50%;width:150px;transform:translate(-50%,-50%);text-align:center;padding:0;border:0}
      .retention-loop-center .retention-metrics{flex-direction:column;align-items:center;gap:12px}
      .retention-loop-center .retention-metric{align-items:center;gap:4px;text-align:center}
      .retention-loop-center .retention-number{font-size:1.5rem}
      .retention-loop-center .retention-unit{max-width:120px;font-size:15px;line-height:1.15}
      .retention-node strong{background:var(--leg-card);box-shadow:0 0 0 6px var(--leg-card)}
      .retention-node{position:absolute;min-height:0;padding:0;border:0;opacity:var(--node-opacity,0)!important;transform:none;transition:opacity .55s cubic-bezier(.16,1,.3,1)}
      .retention-node:after{display:none!important}
      .retention-node strong{gap:6px;font-size:16.4px;line-height:1.08}
      .retention-node .retention-index{font-size:16.4px!important}
      .retention-node:before{width:7px;height:7px;box-shadow:0 0 0 5px var(--leg-card),0 0 0 6px var(--leg-border)!important}
      .retention-node--presence{left:50%;top:86px;width:100%;margin:0;transform:translateX(-50%);text-align:center}
      .retention-node--presence strong{justify-content:center}
      .retention-node--presence:before{left:50%;top:auto;bottom:-38px;transform:translateX(-50%)}
      .retention-node--presence .retention-metrics{display:none}
      .retention-node--presence .retention-number{font-size:1.85rem}
      .retention-node--presence .retention-unit{max-width:78px;font-size:16.4px;line-height:1.15}
      .retention-node--tap{left:auto;right:0;top:50%;width:78px;margin:0;transform:translateY(-50%);text-align:left}
      .retention-node--tap:before{left:-17px;right:auto;top:50%;transform:translateY(-50%)}
      .retention-node--mission{left:50%;bottom:88px;width:180px;margin:0;transform:translateX(-50%);text-align:center}
      .retention-node--mission strong{justify-content:center}
      .retention-node--mission:before{left:50%;top:-32px;bottom:auto;transform:translateX(-50%)}
      .retention-node--behavior{left:0;right:auto;top:50%;width:92px;margin:0;transform:translateY(14px);text-align:right}
      .retention-node--behavior strong{display:block}
      .retention-node--behavior .retention-index{display:block;margin-bottom:4px}
      .retention-node--behavior:before{left:auto;right:12px;top:-16px;transform:none}
      .fit-layout{gap:38px}
      .fit-signals{gap:28px}
      .fit-signal{grid-template-columns:34px 1fr;gap:12px;padding:0}
      .fit-check{width:28px;height:28px}
      .fit-signal h3{margin-top:0;font-size:1.42rem}
      .fit-signal p{margin-top:8px;font-size:16.4px;line-height:1.45}
      .comparison-intro{margin-bottom:48px}
      .comparison-carousel{overflow:visible}
      .comparison-track{display:flex;gap:12px;margin-right:-16px;padding-right:24px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-left:0;scrollbar-width:none;-webkit-overflow-scrolling:touch}
      .comparison-track::-webkit-scrollbar{display:none}
      .comparison-slide{width:calc(100% - 24px);min-width:calc(100% - 24px);scroll-snap-align:start}
      .comparison-slide .comparison-axis{padding:0 0 12px}
      .comparison-pair{grid-template-columns:repeat(2,minmax(0,1fr));border-radius:20px}
      .comparison-panel{min-height:220px;padding:18px 14px;gap:20px}
      .comparison-panel small{font-size:11px;letter-spacing:.1em}
      .comparison-panel p{font-size:1.12rem;line-height:1.18}
      .comparison-slide--memory .comparison-fc p{font-size:1.3rem}
      .comparison-pager{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:20px}
      .comparison-pager button{width:6px;height:6px;min-height:0;padding:0;border:0;border-radius:999px;background:color-mix(in oklch,var(--leg-brand-foreground) 28%,transparent);transition:width .35s cubic-bezier(.16,1,.3,1),background-color .35s ease}
      .comparison-pager button.is-active{width:24px;background:var(--leg-brand-foreground)}
      .pilot-module{padding:40px 0}
      .effort-item{min-height:96px}
      .effort-item span{font-size:16.4px}
      .closing-copy h2{font-size:clamp(2.05rem,9vw,2.35rem)!important;line-height:1.07!important;letter-spacing:-.035em!important}
      .footer-slide{padding:88px 0!important}

      /* Mobile presentation rhythm: one logical panel per phone viewport. */
      main>section.hero,
      #team.retention-loop-section,
      #mission.fit-section,
      #moat.comparison-section,
      #fulfillment.pilot-section,
      main>section.pilot-continuation,
      main>section.footer-slide{min-height:100svh!important;box-sizing:border-box}
      #team .retention-loop-sticky{min-height:100svh!important;box-sizing:border-box}
      #mission.fit-section,
      #moat.comparison-section,
      #fulfillment.pilot-section,
      main>section.pilot-continuation{display:flex;align-items:center}
      #fulfillment.pilot-section,
      main>section.pilot-continuation{padding:32px 0!important;background:var(--leg-background)!important}
      #fulfillment .pilot-module{padding:8px 0 0}
      main>section.pilot-continuation .pilot-module{width:100%;padding:0}

      @media(min-height:800px){
        main>section.hero,
        #team.retention-loop-section,
        #mission.fit-section,
        #moat.comparison-section,
        #fulfillment.pilot-section,
        main>section.pilot-continuation,
        main>section.footer-slide{height:100svh!important}
        #moat.comparison-section{padding-top:84px!important;padding-bottom:84px!important}
      }
    }

    .pilot-continuation{background:var(--leg-background)!important}
    .pilot-continuation--workflow .workflow-label{margin-top:0;padding-top:0}

    /* Match section 02's light canvas while preserving comparison contrast. */
    #moat.comparison-section{background:var(--leg-card)!important;color:var(--leg-foreground)!important}
    #moat .comparison-intro h2,
    #moat .comparison-intro h2 strong{color:var(--leg-foreground)!important}
    #moat .comparison-intro h2 span{color:color-mix(in oklch,var(--leg-muted-foreground) 55%,transparent)!important}
    #moat .comparison-axis{color:var(--leg-muted-foreground)!important}
    #moat .comparison-axis span,
    #moat .comparison-axis strong{color:var(--leg-brand)!important}
    #moat .comparison-pager button{background:color-mix(in oklch,var(--leg-brand) 25%,transparent)}
    #moat .comparison-pager button.is-active{background:var(--leg-brand)}

    @media(max-width:760px){
      /* Four viewport-long scroll beats; the diagram itself remains pinned for one screen. */
      #team.retention-loop-section{position:relative;height:400svh!important;min-height:400svh!important}
      #team .retention-loop-sticky{position:sticky!important;top:0;height:100svh!important;min-height:100svh!important;align-items:safe center}
    }
    /* Short phone viewports (collapsed browser chrome): slim the pinned stage so node 03 below the ring is never clipped. */
    @media(max-width:760px) and (max-height:800px){
      #team .retention-loop-sticky{padding:20px 0 12px!important}
      #team .retention-loop-layout{gap:12px}
      #team .retention-loop-copy p{display:none}
      #team .retention-loop-copy h2{margin-top:10px;font-size:clamp(1.7rem,7.5vw,2rem)!important}
    }

    /* Separator-free review mode: keep component outlines and data-visualization lines. */
    main>section,.demo-slide,#team.retention-loop-section,#mission.fit-section,#moat.comparison-section,#fulfillment.pilot-section,.pilot-module,.workflow-label,.effort-grid,.effort-item,.closing-gains,.closing-gains li,.comparison-panel.comparison-fc{
      border-color:transparent!important;
    }
    @media(max-width:760px){
      .effort-grid{gap:0;border-top:0!important;border-bottom:0!important}
      .effort-item{min-height:150px;padding:18px 14px;border:0!important;border-radius:0;background:transparent}
      .effort-item:nth-child(even){border-left:1px solid var(--leg-border)!important}
      .effort-item:nth-child(n+3){border-top:1px solid var(--leg-border)!important}
      .effort-item span{margin-top:12px;font-size:16.4px;line-height:1.4}

      /* Give the responsibilities screen a compact, balanced phone layout. */
      main > section.pilot-continuation--workflow[aria-label="Pilot responsibilities"]{
        display:flex;
        min-height:100svh!important;
        align-items:center;
        padding:56px 0!important;
      }
      main > section.pilot-continuation--workflow[aria-label="Pilot responsibilities"] > .wrap{
        width:min(100% - 32px,1180px);
      }
      .responsibility-tabs{border-radius:20px}
      .responsibility-tablist{gap:6px;padding:6px}
      .responsibility-tablist button{min-height:54px;padding:12px 10px;font-size:16.4px}
      .responsibility-panel{display:flex;min-height:clamp(300px,44svh,480px);flex-direction:column;align-items:stretch;justify-content:center;padding:clamp(28px,6vh,56px) 22px}
      .responsibility-panel ul{width:100%;gap:clamp(12px,3vh,24px);font-size:clamp(16.4px,2.5vw,16.4px);line-height:1.45}
      .responsibility-note{margin-top:clamp(20px,3vh,28px);font-size:12px}
    }
    .closing-gains li:before{background:transparent!important;color:var(--rust)!important}
    h1,h2,h3{max-width:none!important}

    /* Closing decision flow: one flat selector and one primary action. */
    .hero-copy .hero-body{max-width:760px!important;margin:20px auto 0;color:var(--leg-muted-foreground)!important;font-size:16.4px;line-height:1.6}
    .hero-copy .hero-sub.hero-sequence{margin-top:40px}
    .hero-copy .hero-body{margin-top:32px}
    .hero-copy .hero-body strong{font-weight:650;color:var(--leg-foreground)}
    .hero-copy .hero-body em{font-style:italic}
    .hero-sequence{opacity:0;filter:blur(10px);transform:translateY(14px)}
    .hero-sequence.is-visible{animation:heroSentenceReveal .8s cubic-bezier(.16,1,.3,1) forwards}
    .hero-sequence--1.is-visible{animation-delay:.12s}
    .hero-sequence--2.is-visible{animation-delay:.32s}
    .hero-sequence--3.is-visible{animation-delay:.62s}
    .hero-sequence--4.is-visible{animation-delay:.92s}
    .hero-body .hero-sequence{display:block}
    .hero-body .hero-sequence+.hero-sequence{margin-top:16px}
    .hero-visual.reveal{transition-delay:2.05s}
    @keyframes heroSentenceReveal{
      to{opacity:1;filter:blur(0);transform:translateY(0)}
    }
    @media(prefers-reduced-motion:reduce){
      .hero-sequence{opacity:1!important;filter:none!important;transform:none!important;animation:none!important}
      .hero-visual.reveal{transition-delay:0s!important}
    }
    .closing-box--pilot{grid-template-columns:minmax(0,.82fr) minmax(460px,1.18fr)!important}
    .closing-copy-text{max-width:38ch;margin-top:24px;color:color-mix(in oklch,var(--leg-brand-foreground) 76%,transparent);font-size:clamp(16.4px,1.35vw,1.15rem);line-height:1.55}
    .closing-copy-text+.closing-copy-text{margin-top:14px}
    .pilot-design-copy{margin-top:24px;color:color-mix(in oklch,var(--leg-brand-foreground) 76%,transparent);font-size:16.4px;line-height:1.55}
    .pilot-design-copy em{color:var(--leg-brand-foreground)}
    @media(max-width:760px){
      main>section.hero{display:block!important;min-height:auto!important;padding:0!important}
      main>section.hero .hero-grid{display:flex!important;width:100%!important;min-height:0!important;gap:0!important}
      main>section.hero .hero-copy{display:block!important;width:100%;max-width:none;margin:0;text-align:center}
      main>section.hero .hero-copy h1.hero-sequence{display:flex;min-height:100svh;width:min(100% - 40px,680px);margin:0 auto;padding:32px 0;align-items:center;justify-content:center}
      .hero-supporting-copy{width:min(100% - 40px,680px);margin:0 auto;padding:80px 0 48px}
      .hero-copy .hero-sub.hero-sequence{margin-top:0}
      .hero-copy .hero-body{max-width:34ch!important;margin-top:28px;font-size:15px;line-height:1.5}
      .hero-body .hero-sequence+.hero-sequence{margin-top:12px}
      main>section.hero .hero-visual{width:min(100% - 40px,680px)!important;margin:0 auto 32px}
      .closing-box--pilot{grid-template-columns:1fr!important;gap:36px!important;justify-items:center!important;text-align:center!important}
      .closing-box--pilot .closing-copy,.closing-box--pilot .closing-gains{width:100%}
      .closing-copy-text{max-width:34ch;margin:20px auto 0;font-size:16.4px}
      .closing-copy-text+.closing-copy-text{margin-top:14px}
      .pilot-design-copy{margin-top:22px}
      .pilot-design-copy{max-width:34ch;margin-right:auto;margin-left:auto;text-align:center}
      .closing-gains .btn{width:max-content;max-width:100%;min-height:60px;margin-right:auto;margin-left:auto;padding:8px 12px 8px 24px;white-space:nowrap}
      .closing-gains .btn:after{width:32px;height:32px;margin-left:8px}
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy reveal">
          <h1 class="hero-sequence hero-sequence--1"><span>You just tapped a <em>Fridge Channel Magnet.</em></span></h1>
          <div class="hero-supporting-copy">
            <p class="hero-sub hero-sequence hero-sequence--2">This is exactly what your customers will do on their fridge door.</p>
            <p class="hero-body">
              <span class="hero-sequence hero-sequence--3">This <strong>Fridge Channel Magnet</strong> ships inside your orders, lives on the fridge door, and turns everyday taps into repeat purchases.</span>
              <em class="hero-sequence hero-sequence--4">Now watch it work — from your customer’s kitchen, delivery to next order.</em>
            </p>
          </div>
        </div>
        <div class="hero-visual reveal">
          <video
            class="hero-video"
            src="https://amzn-s3-fc-bucket.s3.sa-east-1.amazonaws.com/videos/magnet_unbox_final.mp4"
            poster="/pics/DIsplayProcessPics/dtc-cmo-presence.png"
            autoplay
            muted
            loop
            playsinline
            controls
            preload="auto"
          ></video>
        </div>
      </div>
    </section>

    <section class="retention-loop-section" id="team" aria-labelledby="retention-loop-title">
      <div class="retention-loop-sticky">
        <div class="wrap retention-loop-layout">
          <header class="retention-loop-copy">
            <h2 id="retention-loop-title">Built on a retention moat no digital channel can copy.</h2>
            <p>It starts in the home, earns active participation, and turns everyday attention into profitable next behavior.</p>
          </header>

          <div class="retention-loop-visual" aria-label="Physical presence leads to a customer-initiated tap, an incentive-driven mission, and profitable next behavior before returning to physical presence.">
            <svg class="retention-loop-svg" viewBox="0 0 720 720" aria-hidden="true">
              <circle class="retention-loop-track" cx="360" cy="360" r="238" transform="rotate(-90 360 360)"></circle>
              <circle class="retention-loop-progress" cx="360" cy="360" r="238" transform="rotate(-90 360 360)"></circle>
              <path class="retention-loop-arrow" d="M374 122 L348 108 L348 136 Z"></path>
            </svg>

            <div class="retention-loop-center">
              <span class="retention-metrics">
                <span class="retention-metric"><span class="retention-number" data-loop-count="10">0+</span><span class="retention-unit">Daily family impressions</span></span>
              </span>
            </div>

            <article class="retention-node retention-node--presence" data-loop-node="0">
              <strong><span class="retention-index">01</span>Physical presence</strong>
              <span class="retention-metrics">
                <span class="retention-metric"><span class="retention-number" data-loop-count="10">0+</span><span class="retention-unit">Daily family impressions</span></span>
              </span>
            </article>

            <article class="retention-node retention-node--tap" data-loop-node="1">
              <strong><span class="retention-index">02</span>Tap</strong>
            </article>

            <article class="retention-node retention-node--mission" data-loop-node="2">
              <strong><span class="retention-index">03</span>Mission &amp; reward</strong>
            </article>

            <article class="retention-node retention-node--behavior" data-loop-node="3">
              <strong><span class="retention-index">04</span>Repeat order</strong>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="fit-section" id="mission" aria-labelledby="fit-title">
      <div class="wrap fit-layout reveal">
        <header class="fit-head">
          <h2 id="fit-title">Why Fridge Channel fits your brand?</h2>
        </header>

        <div>
          <div class="fit-signals" aria-label="Three fit signals" data-fit-checklist>
            <article class="fit-signal">
              <span class="fit-check" aria-hidden="true">✓</span>
              <div><h3>Your product is a high-frequency consumable.</h3></div>
            </article>

            <article class="fit-signal">
              <span class="fit-check" aria-hidden="true">✓</span>
              <div><h3>Every new customer is expensive to acquire.</h3></div>
            </article>

            <article class="fit-signal">
              <span class="fit-check" aria-hidden="true">✓</span>
              <div><h3>Most of your profit comes from repeat purchase.</h3></div>
            </article>
          </div>

        </div>
      </div>
    </section>

    <section class="comparison-section" id="moat" aria-labelledby="comparison-title">
      <div class="wrap">
        <header class="comparison-intro reveal">
          <h2 id="comparison-title"><span>Email, SMS, and brochures reach the customer.</span><strong>FC stays with them until the next purchase happens.</strong></h2>
        </header>

        <div class="comparison-carousel reveal" data-comparison-carousel aria-label="Comparison of rented digital channels and Fridge Channel">
          <div class="comparison-track" data-comparison-track>
            <article class="comparison-slide">
              <header class="comparison-axis"><span>01</span><strong>Presence</strong></header>
              <div class="comparison-pair">
                <div class="comparison-panel comparison-legacy"><small>Email · SMS · Ads</small><p>Appears when sent. Buried, filtered, or scrolled past.</p></div>
                <div class="comparison-panel comparison-fc"><small>Fridge Channel</small><p>On the fridge door, seen at every glance. Never needs to be re-sent.</p></div>
              </div>
            </article>

            <article class="comparison-slide comparison-slide--memory">
              <header class="comparison-axis"><span>02</span><strong>Temperature</strong></header>
              <div class="comparison-pair">
                <div class="comparison-panel comparison-legacy"><small>Email · SMS · Ads</small><p>Waits for customers to go cold — then pays to win them back. Win-back is the most expensive touch you’ll ever buy.</p></div>
                <div class="comparison-panel comparison-fc"><small>Fridge Channel</small><p>Keeps customers warm between orders. No cooling, no rescue mission.</p></div>
              </div>
            </article>

            <article class="comparison-slide">
              <header class="comparison-axis"><span>03</span><strong>The reorder moment</strong></header>
              <div class="comparison-pair">
                <div class="comparison-panel comparison-legacy"><small>Email · SMS · Ads</small><p>Tries to <em>predict</em> when they’ll run low.</p></div>
                <div class="comparison-panel comparison-fc"><small>Fridge Channel</small><p>Is already there when they run low. <strong>Tap → next order.</strong></p></div>
              </div>
            </article>
          </div>
          <div class="comparison-pager" role="tablist" aria-label="Comparison topics">
            <button type="button" class="is-active" data-comparison-dot="0" aria-label="Show presence comparison" aria-selected="true"></button>
            <button type="button" data-comparison-dot="1" aria-label="Show temperature comparison" aria-selected="false"></button>
            <button type="button" data-comparison-dot="2" aria-label="Show reorder moment comparison" aria-selected="false"></button>
          </div>
        </div>
      </div>
    </section>

    <section class="pilot-section" id="fulfillment" aria-label="Incremental repeat-purchase lift from FC">
      <div class="wrap">
        <section class="pilot-module reveal" aria-label="How the pilot proves incremental value">
          <div class="pilot-module-label"><span>01</span> Incrementality test</div>
          <div class="experiment-system experiment-flow">
            <div class="incrementality-statement">
              <strong>Measure the incremental repeat-purchase lift from FC.</strong>
              <p class="blur-reveal" data-blur-text><span class="blur-word">Randomly</span> <span class="blur-word">assign</span> <span class="blur-word">eligible</span> <span class="blur-word">customers</span> <span class="blur-word">to</span> <span class="blur-word">FC</span> <span class="blur-word">and</span> <span class="blur-word"><strong>holdout</strong></span> <span class="blur-word"><strong>groups,</strong></span> <span class="blur-word">then</span> <span class="blur-word">compare</span> <span class="blur-word"><strong>incremental</strong></span> <span class="blur-word"><strong>repeat</strong></span> <span class="blur-word"><strong>purchase,</strong></span> <span class="blur-word"><strong>retained</strong></span> <span class="blur-word"><strong>revenue,</strong></span> <span class="blur-word">and</span> <span class="blur-word">contribution</span> <span class="blur-word">over</span> <span class="blur-word">the</span> <span class="blur-word">agreed</span> <span class="blur-word">measurement</span> <span class="blur-word">window.</span></p>
            </div>
          </div>
        </section>
      </div>
    </section>

    <section class="pilot-section pilot-continuation" aria-label="Brand effort and pilot cost">
      <div class="wrap">
        <section class="pilot-module reveal" aria-label="Brand effort and pilot cost">
          <div class="pilot-module-label"><span>03</span> Brand effort + pilot cost</div>
          <div class="effort-grid">
            <article class="effort-item"><strong aria-label="15 minutes"><span data-effort-count="15">0</span> min</strong><span>Guided campaign setup after audience, assets, and access are approved.</span></article>
            <article class="effort-item"><strong>&lt;2 hrs</strong><span>Weekly brand oversight while the pilot is live.</span></article>
            <article class="effort-item"><strong>0 engineers</strong><span>No custom build and no dedicated developer required.</span></article>
            <article class="effort-item effort-item--price"><strong>$5.49+</strong><span>Per magnet, per year, with no hidden fees.</span></article>
          </div>
        </section>
      </div>
    </section>

    <section class="pilot-section pilot-continuation pilot-continuation--workflow" aria-label="Pilot responsibilities">
      <div class="wrap">
        <section class="pilot-module reveal" aria-label="How to work">
          <div class="pilot-module-label workflow-label"><span>04</span> How to work?</div>
          <div class="responsibility-tabs" data-responsibility-tabs>
            <div class="responsibility-tablist" role="tablist" aria-label="Pilot responsibilities">
              <button type="button" role="tab" id="responsibility-tab-brand" aria-controls="responsibility-panel-brand" aria-selected="true" data-responsibility-tab="brand">You provide</button>
              <button type="button" role="tab" id="responsibility-tab-fc" aria-controls="responsibility-panel-fc" aria-selected="false" data-responsibility-tab="fc">FC handles</button>
            </div>
            <div class="responsibility-panel" role="tabpanel" id="responsibility-panel-brand" aria-labelledby="responsibility-tab-brand" data-responsibility-panel="brand">
              <ul>
                <li>Brand assets</li>
                <li>Pilot audience</li>
                <li>Reward approval</li>
                <li>Shopify and Klaviyo account access</li>
              </ul>
              <p class="responsibility-note"><strong>Data &amp; security:</strong> Read-only where possible. No changes to your existing workflows</p>
            </div>
            <div class="responsibility-panel" role="tabpanel" id="responsibility-panel-fc" aria-labelledby="responsibility-tab-fc" data-responsibility-panel="fc" hidden>
              <ul>
                <li>Shopify and Klaviyo data integration</li>
                <li>Customer segmentation and campaign setup</li>
                <li>Mission and reward configuration</li>
                <li>Tracking, attribution, and reporting</li>
                <li>Pilot operations and support</li>
                <li>Magnet design and manufacturing</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </section>

    <section class="footer footer-slide demo-slide" aria-labelledby="closing-title">
      <div class="wrap">
        <div class="footer-box closing-box closing-box--pilot reveal">
          <header class="closing-copy">
            <h2 id="closing-title">One magnet. Every stage of retention.</h2>
            <p class="closing-copy-text">The magnet you’re holding can run any of these — same magnet, different mission.</p>
          </header>
          <div class="closing-gains package-gains">
            <p class="pilot-design-copy">Then one design session is all it takes: your magnet flips from sample to <em>your brand</em> — live before the first 20 minutes are up, built around the problem you picked. No reprint. Nothing to install.</p>
            <a class="btn" href="https://calendly.com/billy-fridgechannels/fridge-channel-pilot-meeting" data-link="footer_button_url" data-pilot-cta>Make it mine — live in 20 minutes</a>
          </div>
        </div>
      </div>
    </section>

  </main>

  <script>
    const pathMatch = /^\\/(?:gift-proposal|p)\\/([^/?#]+)\\/?$/.exec(location.pathname);
    const proposalParams = new URLSearchParams(location.search);
    const proposalId = pathMatch
      ? decodeURIComponent(pathMatch[1])
      : (proposalParams.get('sn') || proposalParams.get('id'));
    const magnetSn = proposalId || '';

    function applyData(data) {
      if (data.template_type && data.template_type !== 'gift_challenge') {
        throw new Error(\`Proposal uses template \${data.template_type}, not gift_challenge\`);
      }
      if (data.brand_primary_color) document.documentElement.style.setProperty('--rust', data.brand_primary_color);
      if (data.brand_second_color) document.documentElement.style.setProperty('--gold', data.brand_second_color);
      if (data.brand_dark_color) {
        document.documentElement.style.setProperty('--forest', data.brand_dark_color);
        document.documentElement.style.setProperty('--brand-dark', data.brand_dark_color);
      }
      if (data.brand_light_color) document.documentElement.style.setProperty('--brand-light', data.brand_light_color);
      const brandName = data.brand_name || 'Brand';
      document.querySelectorAll('[data-link]').forEach(el => {
        const value = data[el.dataset.link];
        if (value) el.href = value;
      });
      document.title = data.page_title || \`\${data.campaign_name || brandName} | Proposal\`;
      const description = document.querySelector('meta[name="description"]');
      if (description) description.content = \`\${data.campaign_name || brandName} proposal\`;
    }

    // Branding from magnet_brand_param via /api/proposal (null fields → server defaults).
    fetch(\`/api/proposal?sn=\${encodeURIComponent(magnetSn)}\`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Proposal not found');
        return data;
      })
      .then(applyData)
      .catch(error => {
        console.error(error);
        document.body.dataset.loadError = 'true';
      });


    const sectionRevealTargets=Array.from(document.querySelectorAll('main>section')).map(section=>section.firstElementChild||section);
    sectionRevealTargets.forEach(el=>el.classList.add('section-reveal'));
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -6%'});
    document.querySelectorAll('.reveal,.section-reveal').forEach(el=>observer.observe(el));

    const heroSentenceObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        heroSentenceObserver.unobserve(entry.target);
      }
    }),{threshold:.3,rootMargin:'0px 0px -8%'});
    document.querySelectorAll('.hero-sequence').forEach(el=>heroSentenceObserver.observe(el));

    document.querySelectorAll('[data-blur-text]').forEach(p => {
      const words = p.querySelectorAll('.blur-word');
      words.forEach((word, i) => word.style.setProperty('--word-i', i));
      const blurObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          blurObserver.unobserve(entry.target);
        }
      }), { threshold: .3, rootMargin: '0px 0px -8%' });
      blurObserver.observe(p);
    });

    document.querySelectorAll('[data-fit-checklist]').forEach(list => {
      const checks = list.querySelectorAll('.fit-check');
      checks.forEach((check, i) => check.style.setProperty('--check-i', i));
      const checklistObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          checklistObserver.unobserve(entry.target);
        }
      }), { threshold: .35, rootMargin: '0px 0px -8%' });
      checklistObserver.observe(list);
    });

    (function(){
      const counter=document.querySelector('[data-effort-count]');
      if(!counter) return;
      const target=Number(counter.dataset.effortCount)||15;
      const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
      let frame=0;

      function reset(){
        cancelAnimationFrame(frame);
        counter.textContent='0';
      }

      function play(){
        cancelAnimationFrame(frame);
        if(reducedMotion.matches){counter.textContent=String(target);return;}
        const started=performance.now();
        const duration=520;
        function tick(now){
          const progress=Math.min(1,(now-started)/duration);
          const eased=1-Math.pow(1-progress,3);
          counter.textContent=String(Math.round(target*eased));
          if(progress<1) frame=requestAnimationFrame(tick);
        }
        frame=requestAnimationFrame(tick);
      }

      const countObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting) play(); else reset();
      }),{threshold:.6});
      countObserver.observe(counter.closest('.effort-item'));
    })();

    (function(){
      const root=document.querySelector('[data-responsibility-tabs]');
      const tabs=root?[...root.querySelectorAll('[data-responsibility-tab]')]:[];
      const panels=root?[...root.querySelectorAll('[data-responsibility-panel]')]:[];
      if(!root||!tabs.length||!panels.length) return;

      function activate(key){
        tabs.forEach(tab=>tab.setAttribute('aria-selected',String(tab.dataset.responsibilityTab===key)));
        panels.forEach(panel=>{panel.hidden=panel.dataset.responsibilityPanel!==key;});
      }

      tabs.forEach((tab,index)=>{
        tab.addEventListener('click',()=>activate(tab.dataset.responsibilityTab));
        tab.addEventListener('keydown',event=>{
          if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight') return;
          event.preventDefault();
          const direction=event.key==='ArrowRight'?1:-1;
          const next=tabs[(index+direction+tabs.length)%tabs.length];
          next.focus();
          activate(next.dataset.responsibilityTab);
        });
      });
    })();

    (function(){
      const carousel=document.querySelector('[data-comparison-carousel]');
      const track=carousel?.querySelector('[data-comparison-track]');
      const slides=track?[...track.children]:[];
      const dots=carousel?[...carousel.querySelectorAll('[data-comparison-dot]')]:[];
      if(!track||!slides.length||!dots.length) return;

      function setActive(index){
        dots.forEach((dot,i)=>{
          const active=i===index;
          dot.classList.toggle('is-active',active);
          dot.setAttribute('aria-selected',String(active));
        });
      }

      function goTo(index){
        const slide=slides[index];
        if(!slide) return;
        track.scrollTo({left:slide.offsetLeft-track.offsetLeft,behavior:'smooth'});
        setActive(index);
      }

      dots.forEach((dot,index)=>dot.addEventListener('click',()=>goTo(index)));
      let carouselTicking=false;
      track.addEventListener('scroll',()=>{
        if(carouselTicking) return;
        carouselTicking=true;
        requestAnimationFrame(()=>{
          const trackLeft=track.getBoundingClientRect().left;
          let nearest=0;
          let distance=Infinity;
          slides.forEach((slide,index)=>{
            const nextDistance=Math.abs(slide.getBoundingClientRect().left-trackLeft);
            if(nextDistance<distance){distance=nextDistance;nearest=index;}
          });
          setActive(nearest);
          carouselTicking=false;
        });
      },{passive:true});
    })();

    (function(){
      const section=document.getElementById('team');
      const progressRing=section?.querySelector('.retention-loop-progress');
      const nodes=section?[...section.querySelectorAll('[data-loop-node]')]:[];
      const counts=section?[...section.querySelectorAll('[data-loop-count]')]:[];
      if(!section||!progressRing||!nodes.length) return;

      const radius=Number(progressRing.getAttribute('r'))||238;
      const circumference=2*Math.PI*radius;
      const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
      progressRing.style.strokeDasharray=\`\${circumference}\`;

      function render(progress){
        const value=Math.max(0,Math.min(1,progress));
        progressRing.style.strokeDashoffset=\`\${circumference*(1-value)}\`;
        nodes.forEach((node,index)=>{
          const start=index*.25+.025;
          const local=Math.max(0,Math.min(1,(value-start)/.13));
          const eased=1-Math.pow(1-local,3);
          const restingOpacity=window.innerWidth<=980?0:.16;
          node.style.setProperty('--node-opacity',\`\${restingOpacity+eased*(1-restingOpacity)}\`);
          node.style.setProperty('--node-y',\`\${(1-eased)*18}px\`);
          node.style.setProperty('--node-scale',\`\${.96+eased*.04}\`);
        });
        counts.forEach(count=>{count.textContent=\`\${Math.round(10*Math.max(0,Math.min(1,(value-.025)/.18)))}+\`;});
        section.classList.toggle('is-complete',value>.94);
      }

      function update(){
        if(reducedMotion.matches){
          render(1);
          return;
        }
        const rect=section.getBoundingClientRect();
        const distance=Math.max(1,section.offsetHeight-window.innerHeight);
        const scrollProgress=Math.max(0,Math.min(1,-rect.top/distance));
        if(window.innerWidth<=980){
          render(.24+scrollProgress*.76);
          section.dataset.loopStage=String(Math.min(4,Math.floor(scrollProgress*3+.08)+1));
        }else{
          render(scrollProgress);
        }
      }

      let ticking=false;
      function requestUpdate(){
        if(ticking) return;
        ticking=true;
        requestAnimationFrame(()=>{update();ticking=false;});
      }
      window.addEventListener('scroll',requestUpdate,{passive:true});
      window.addEventListener('resize',requestUpdate,{passive:true});
      reducedMotion.addEventListener?.('change',requestUpdate);
      update();
    })();

  <\/script>
</body>
</html>
`){let t=new DOMParser().parseFromString(e,`text/html`),n=[...t.querySelectorAll(`style`)].map(e=>e.textContent||``).join(`
`),r=[...t.body.querySelectorAll(`script`)].map(e=>e.textContent||``),i=[...t.head.querySelectorAll(`link[href]`)].map(e=>e.getAttribute(`href`)||``).filter(e=>e.includes(`fonts.googleapis.com`)||e.includes(`fonts.gstatic.com`));return t.body.querySelectorAll(`script`).forEach(e=>e.remove()),{bodyMarkup:t.body.innerHTML,css:n,scripts:r.filter(Boolean),fontLinks:i}}export{e as t};