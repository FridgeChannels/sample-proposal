// Map marks and leader endpoints are percentages of the surveyed house.
export const gardencupPlacements = [
 {name:'Refrigerator',rate:'10+',point:[41,27],label:[34,31],side:'left'},
 {name:'Snack pantry',rate:'4+',point:[44,20],label:[39,12],side:'left'},
 {name:'Lunch-packing counter',rate:'3+',point:[50.5,37],label:[56,51],side:'right'},
 {name:'Coffee station',rate:'2+',point:[55.2,26],label:[60,12],side:'right'},
 {name:'Microwave',rate:'5+',point:[61.6,26],label:[68,30],side:'right'},
 {name:'Entryway',rate:'6+',point:[49,81],label:[42,77],side:'left'}
];
export function placementMap(){
 const marks=gardencupPlacements.map(({name,rate,point:[x,y],label:[lx,ly],side},index)=>{
  const dx=lx-x,dy=(ly-y)*.75;
  const guide='left:'+x+'%;top:'+y+'%;width:'+Math.hypot(dx,dy).toFixed(3)+'%;transform:rotate('+Math.atan2(dy,dx)+'rad)';
  return `<i class="fit-leader" style="${guide}"></i><i class="fit-dot" style="left:${x}%;top:${y}%;--delay:-${index*.34}s"></i><span class="fit-tag fit-${side}" style="left:${lx}%;top:${ly}%"><b>${name}</b><small>Gardencup traffic / day <strong>${rate}</strong></small></span>`;
 }).join('');
 return '<div id="fit-map" aria-hidden="true">'+marks+'</div>';
}
export const fitLabel='In-home traffic fit for Gardencup';
export function fitPanel(){
 return `<section class="placement-page" aria-label="${fitLabel}">
  <header class="placement-head"><button type="button" class="placement-back" data-guide-action="fit-back" aria-label="Back to the family">‹ <span>The Bennetts</span></button><img src="assets/gardencup/logo.svg" alt="Gardencup"></header>
  <div class="placement-title"><h2>Where Gardencup fits</h2><p>The pink dots mark six places the family already visits. Compare estimated visits per day for a magnet in each location.</p></div>
  <div class="placement-list"><table><thead><tr><th scope="col">Location</th><th scope="col">Est. visits / day</th></tr></thead><tbody>${gardencupPlacements.map(p=>`<tr><th scope="row">${p.name}</th><td>${p.rate}</td></tr>`).join('')}</tbody></table></div>
  <footer><button type="button" class="mi-start" data-guide-action="start" data-play="enter"><i aria-hidden="true"></i>Watch their story</button></footer>
 </section>`;
}
export function introButtons(early=false){
 return `<div class="mi-actions"><button type="button" class="mi-start" ${early?'id="early-story"':'data-guide-action="start" data-play="enter"'}><i aria-hidden="true"></i>Watch their story</button><button type="button" class="mi-fit" ${early?'id="early-fit"':'data-guide-action="fit"'}>${fitLabel} <span aria-hidden="true">›</span></button></div>`;
}
