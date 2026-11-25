// Totals describe a single playback of the Gardencup household story.
export function createHouseholdImpact(){
 let seen=0,taps=0,orders=0,revenueCents=0;
 const confirmations=new Set();
 return {
  get seen(){return seen;},get taps(){return taps;},get orders(){return orders;},get revenueCents(){return revenueCents;},
  view(){seen++;},
  tap(){taps++;},
  order(eventId,cents){
   if(!eventId||confirmations.has(eventId)||!Number.isSafeInteger(cents)||cents<0)return false;
   confirmations.add(eventId);orders++;revenueCents+=cents;return true;
  },
  reset(){seen=taps=orders=revenueCents=0;confirmations.clear();}
 };
}
export function renderImpact(ledger,totals){
 const values=[totals.seen,totals.taps,totals.orders,totals.revenueCents];
 ledger.querySelectorAll('[data-live]').forEach((cell,i)=>{
  const value=values[i];
  const display=i===3 && value ? '$'+(value/100).toFixed(2) : (i===3?'$':'')+value;
  if(cell.textContent===display)return;
  const previous=Number(cell.textContent.replace('$',''));
  const gain=value-(i===3?Math.round(previous*100):previous);
  cell.textContent=display;
  const badge=i===0?ledger.querySelector('.impact-gain'):null;
  for(const element of [cell,badge])element?.getAnimations?.().forEach(animation=>animation.cancel());
  if(gain<=0)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  cell.animate?.(reduced?[
   {color:'var(--ledger-purple)'},{color:'inherit'}
  ]:[
   {transform:'translateY(0) scale(1)'},
   {transform:'translateY(-.085em) scale(1.06)',color:'var(--ledger-purple)',offset:.28},
   {transform:'translateY(.018em) scale(.995)',offset:.70},
   {transform:'translateY(0) scale(1)'}
  ],{duration:reduced?320:480,easing:'ease-out'});
  if(badge){
   badge.textContent='+'+gain;
   badge.animate?.(reduced?[
    {opacity:1},{opacity:1,offset:.8},{opacity:0}
   ]:[
    {opacity:0,transform:'translateY(4px)'},
    {opacity:1,transform:'translateY(0)',offset:.16},
    {opacity:1,transform:'translateY(-1px)',offset:.70},
    {opacity:0,transform:'translateY(-8px)'}
   ],{duration:880,easing:'ease-out'});
  }
 });
}
