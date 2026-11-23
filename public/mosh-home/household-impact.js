// Totals describe a single playback of the MOSH household story.
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
 const values=[String(totals.seen),String(totals.taps),String(totals.orders),totals.revenueCents?'$'+(totals.revenueCents/100).toFixed(2):'$0'];
 ledger.querySelectorAll('[data-live]').forEach((cell,i)=>{
  if(cell.textContent===values[i])return;
  const gain=i===0?totals.seen-Number(cell.textContent):0;
  cell.textContent=values[i];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(i===0){
   const badge=ledger.querySelector('.impact-gain');
   for(const element of [badge,cell])element?.getAnimations?.().forEach(animation=>animation.cancel());
   if(gain<=0||!badge)return;
   badge.textContent='+'+gain;
   badge.animate?.(reduced?[
    {opacity:1},{opacity:1,offset:.8},{opacity:0}
   ]:[
    {opacity:0,transform:'translateY(4px) scale(.86)'},
    {opacity:1,transform:'translateY(0) scale(1.08)',offset:.16},
    {opacity:1,transform:'translateY(-1px) scale(1)',offset:.70},
    {opacity:0,transform:'translateY(-9px) scale(.98)'}
   ],{duration:1150,easing:'ease-out'});
   if(!reduced)cell.animate?.([
    {color:'#fff4fa',transform:'scale(1)'},
    {color:'#ffb9da',transform:'scale(1.18)',offset:.2},
    {transform:'scale(1)'}
   ],{duration:610,easing:'ease-out'});
  }else if(!reduced){
   cell.animate?.([{opacity:.58,transform:'translateY(2px)'},{opacity:1,transform:'translateY(0)'}],{duration:370});
  }
 });
}
