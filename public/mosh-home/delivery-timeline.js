export const deliveryBeats=Object.freeze([
 {id:'arrival',duration:2.1,title:'UPS is arriving'},
 {id:'exit',duration:1.05,title:'The driver steps down'},
 {id:'carry',duration:5.15,title:'A parcel for the Bennetts'},
 {id:'place',duration:1.25,title:'Delivered at the front door'},
 {id:'doorbell',duration:.75,title:'Ding-dong'},
 {id:'return',duration:4.8,title:'The driver walks back to the truck'},
 {id:'cab',duration:1.05,title:'The driver climbs aboard'},
 {id:'depart',duration:2,title:'Delivery complete'}
]);
export const deliveryRoute=Object.freeze([[32.7,149.4],[56,149.4],[56,130],[48,130],[48,116],[48,101],[48,91]]);
// Round the three turns in floor space. A shared arc-length table keeps the
// driver's pace steady through the bends and on the empty-handed return.
const floorLength=(a,b)=>Math.hypot(b[0]-a[0],(b[1]-a[1])*.75);
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const walk=[{p:deliveryRoute[0],s:0}];
function append(p){
 const last=walk.at(-1);
 walk.push({p,s:last.s+floorLength(last.p,p)});
}
for(let i=1;i<deliveryRoute.length-1;i++){
 const [a,b,c]=deliveryRoute.slice(i-1,i+2);
 const trim=Math.min(1.35,floorLength(a,b)/3,floorLength(b,c)/3);
 const before=mix(b,a,trim/floorLength(a,b)),after=mix(b,c,trim/floorLength(b,c));
 append(before);
 for(let j=1;j<=8;j++){
  const t=j/8;
  append(mix(mix(before,b,t),mix(b,after,t),t));
 }
}
append(deliveryRoute.at(-1));
export function pointAlongRoute(progress,reverse=false){
 const t=Math.max(0,Math.min(1,progress)),s=(reverse?1-t:t)*walk.at(-1).s;
 const end=Math.max(1,walk.findIndex(k=>k.s>=s));
 const a=walk[end-1],b=walk[end],p=mix(a.p,b.p,(s-a.s)/(b.s-a.s));
 const direction=reverse?-1:1;
 return {x:p[0],y:p[1],target:[p[0]+direction*(b.p[0]-a.p[0]),p[1]+direction*(b.p[1]-a.p[1])]};
}
export function createDeliveryTimeline({onBeat=()=>{},onDoorbell=()=>{},onComplete=()=>{}}={}){
 let active=false,time=0,index=-1,bell=false,completed=false;
 const total=deliveryBeats.reduce((a,b)=>a+b.duration,0);
 function enter(n){index=n;const beat=deliveryBeats[n];onBeat({...beat,index:n,parcel:{x:48,y:89,state:n>=4?'at-door':n===3?'lowering':n>=1?'carried':'hidden'}});if(beat.id==='doorbell'&&!bell){bell=true;onDoorbell({parcel:{x:48,y:89}});}}
 function state(){let start=0;for(let i=0;i<index;i++)start+=deliveryBeats[i].duration;return {active,elapsed:time,total,index,beat:deliveryBeats[index]?.id,progress:index<0?0:Math.max(0,Math.min(1,(time-start)/deliveryBeats[index].duration)),bellFired:bell,completeFired:completed};}
 return{start(){active=true;time=0;index=-1;bell=false;completed=false;enter(0);return state();},tick(dt){if(!active)return state();time=Math.min(total,time+Math.max(0,dt));let start=0,next=deliveryBeats.length-1;for(let i=0;i<deliveryBeats.length;i++){if(time<start+deliveryBeats[i].duration){next=i;break;}start+=deliveryBeats[i].duration;}for(let i=index+1;i<=next;i++)enter(i);if(time>=total&&!completed){completed=true;active=false;onComplete();}return state();},stop(){active=false;},getState:state,duration:total};
}
