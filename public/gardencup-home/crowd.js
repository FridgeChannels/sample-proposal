import {wallClearance,petFits} from './architecture.js';
import {obstacleFootprints,pointInPolygon,seatConfig} from './spatial.js';

// Radii are floor-space body envelopes in the same x / .75*y metric as routes.
// They apply to physical actor positions, including stationary/seated people.
export const actorRadii=[1.12,1.18,.98,.86,.78,.52];
const Y=.75,EPS=1e-6;
const xy=p=>[p[0],p[1]*Y];
const fromXY=p=>[p[0],p[1]/Y];
const length=v=>Math.hypot(v[0],v[1]);
const norm=v=>{const d=length(v);return d>EPS?[v[0]/d,v[1]/d]:[0,0];};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
function closestOnSegment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return[a[0]+dx*t,a[1]+dy*t];}
function pointSegmentDistance(p,a,b){const q=closestOnSegment(p,a,b);return Math.hypot(p[0]-q[0],p[1]-q[1]);}
const obstacles=obstacleFootprints.map(o=>{
 const metric=o.polygon.map(xy),xs=metric.map(p=>p[0]),ys=metric.map(p=>p[1]);
 return {...o,metric,minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
});
const seatFurniture=node=>node?.startsWith('sofa')?(node==='sofa3'?'armchair':'sofa'):node?.startsWith('meal')?'dining-table':null;
function furnitureDistance(point,id){
 const o=obstacles.find(item=>item.id===id);if(!o)return Infinity;
 const q=xy(point);let d=Infinity;for(let i=0;i<o.metric.length;i++)d=Math.min(d,pointSegmentDistance(q,o.metric[i],o.metric[(i+1)%o.metric.length]));
 return pointInPolygon(point,o.polygon)?-d:d;
}
function excluded(c,id){
 const target=c.path?.at(-1)||c.node;
 const nearSeat=c.path?.length<=1||c.state==='doing';
 const seatNode=c.navigationSeat||(seatConfig[c.node]?c.node:nearSeat&&seatConfig[target]?target:null);
 if(!seatNode)return false;
 return seatFurniture(seatNode)===id;
}
export function obstacleClearance(c,p){
 const q=xy(p);let clearance=wallClearance(q[0],q[1]);
 for(const o of obstacles){const dx=Math.max(o.minX-q[0],q[0]-o.maxX,0),dy=Math.max(o.minY-q[1],q[1]-o.maxY,0);
 if((dx||dy)&&dx*dx+dy*dy>=Math.max(0,clearance)**2)continue;
 if(excluded(c,o.id))continue;let d=Infinity;for(let i=0;i<o.metric.length;i++)d=Math.min(d,pointSegmentDistance(q,o.metric[i],o.metric[(i+1)%o.metric.length]));clearance=Math.min(clearance,pointInPolygon(p,o.polygon)?-d:d);}
 return clearance;
}
export function radiusOf(c,index=0){return c.collisionRadius??actorRadii[c.cell??index]??1.0;}

/**
 * Small deterministic crowd solver. All actors are updated together in bounded
 * substeps. Candidate motions are swept against occupied body envelopes and
 * furniture; predictive passing prevents reciprocal head-on deadlocks.
 */
export function createCrowdStepper({cast,nodes,distance,world,orientForActivity=()=>{},canMove=()=>true}){
 let clock=0,stepNumber=0;
 const states=new WeakMap();
 const getState=c=>{if(!states.has(c))states.set(c,{vx:0,vy:0,stalled:0,lastGoal:null,side:1});return states.get(c);};
 const radius=c=>radiusOf(c,cast.indexOf(c));
 function refreshSeatContext(c){
  const target=c.path?.at(-1)||c.node,entering=c.path?.length<=1&&seatConfig[target]?target:null;
  const seat=seatConfig[c.node]?c.node:entering;
  if(seat&&furnitureDistance([c.x,c.y],seatFurniture(seat))<radius(c)+.3)c.navigationSeat=seat;
  // An interrupted seat approach still has to retrace its short safe exit.
  // Remember only that one piece of furniture until the whole body is clear;
  // changing the requested destination must not erase this physical context.
  if(c.navigationSeat&&furnitureDistance([c.x,c.y],seatFurniture(c.navigationSeat))>radius(c)+.3)delete c.navigationSeat;
 }
 function clearSegment(c,a,b,padding=0){
  const r=radius(c),startClear=obstacleClearance(c,fromXY(a)),required=Math.min(r,startClear),samples=Math.max(1,Math.ceil(length([b[0]-a[0],b[1]-a[1]])/.22));
  const dx=b[0]-a[0],dy=b[1]-a[1];
  for(let k=1;k<=samples;k++){
   const t=k/samples,p=[a[0]+dx*t,a[1]+dy*t];
   const gap=wallClearance(p[0],p[1]);
   if(gap<r+padding-1e-6||obstacleClearance(c,fromXY(p))<required+padding-1e-6)return false;
   if(c.cell>=4&&gap<5&&!petFits(c.cell,p[0],p[1],dx,dy))return false;
  }
  for(const other of cast){if(other===c)continue;const rr=r+radius(other)+.035+padding,p=xy([other.x,other.y]);if(pointSegmentDistance(p,a,b)<rr-1e-5)return false;}
  return true;
 }
 function candidateScore(c,pos,goal,dir,v,dt){
  const r=radius(c),end=[pos[0]+v[0]*dt,pos[1]+v[1]*dt];
  if(!clearSegment(c,pos,end))return -Infinity;
  const goalD=length([goal[0]-pos[0],goal[1]-pos[1]]),horizon=Math.min(.55,goalD/(length(v)||1));
  const future=[pos[0]+v[0]*horizon,pos[1]+v[1]*horizon];
  let score=dot(v,dir)*1.3-.045*Math.abs(v[0]*dir[1]-v[1]*dir[0]);
  const current=getState(c);score+=.04*(v[0]*current.vx+v[1]*current.vy);
  const staticClear=obstacleClearance(c,fromXY(future));
  if(staticClear<r)score-=7+(r-staticClear)*4;
  for(const other of cast){if(other===c)continue;const op=xy([other.x,other.y]),os=getState(other),rr=r+radius(other)+.18;
   const rel=[op[0]-pos[0],op[1]-pos[1]],rv=[v[0]-os.vx,v[1]-os.vy],den=dot(rv,rv),t=den>EPS?Math.max(0,Math.min(.65,dot(rel,rv)/den)):0;
   const gap=length([rel[0]-rv[0]*t,rel[1]-rv[1]*t]);
   if(gap<rr)score-=(rr-gap)*7*(t<.2?1.4:1);
   // Each actor keeps right relative to travel, so opposing actors choose
   // opposite physical sides. A stationary body is passed on the same rule.
   if(dot(rel,dir)>-.5&&dot(rel,dir)<rr+3.0&&Math.abs(rel[0]*dir[1]-rel[1]*dir[0])<rr+.5){const right=[-dir[1],dir[0]];score+=dot(v,right)*.32;}
  }
  return score;
 }
 // Search only when local steering has stopped making progress. Every edge uses
 // the same swept-body clearance as actual movement. The authored destination
 // stays reserved while the actor follows temporary passing points.
 function passingRoute(c,start,finish){
  const open=[{p:start,x:0,y:0,cost:0,rank:0,parent:null}],costs=new Map();
  // Additional shallow diagonals let a body back out of a narrow pinch between
  // a seated neighbour and a sofa corner. Eight grid headings can miss that
  // exit cone entirely even though a continuous collision-free path exists.
  const grid=.95,range=8,steps=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1],[-1,-2],[1,-2],[-1,2],[1,2],[-2,-1],[-2,1],[2,-1],[2,1]];
  for(let searched=0;open.length&&searched<150;searched++){
   open.sort((a,b)=>b.rank-a.rank);
   let node=open.pop();
   if(node.parent&&clearSegment(c,node.p,finish)){
    const path=[];while(node.parent){path.unshift(node.p);node=node.parent;}
    return path;
   }
   for(const [dx,dy] of steps){
    const x=node.x+dx,y=node.y+dy,key=x+','+y;
    if(Math.abs(x)>range||Math.abs(y)>range)continue;
    const cost=node.cost+Math.hypot(dx,dy)*grid;
    if(cost>=(costs.get(key)??Infinity)-EPS)continue;
    const p=[start[0]+x*grid,start[1]+y*grid];
    if(!clearSegment(c,node.p,p))continue;
    costs.set(key,cost);open.push({p,x,y,cost,rank:cost+length([finish[0]-p[0],finish[1]-p[1]]),parent:node});
   }
  }
  return [];
 }
 function advance(dt){
  clock+=dt;stepNumber++;
  cast.forEach(refreshSeatContext);
  // Oldest wait has priority, then a stable index; no alternating jitter.
  const moving=cast.filter(c=>c.state==='walking'&&c.path?.length&&canMove(c)).sort((a,b)=>getState(b).stalled-getState(a).stalled||cast.indexOf(a)-cast.indexOf(b));
  for(const c of cast){c.laneX=0;c.laneY=0;if(c.state!=='walking'){const s=getState(c);s.vx=s.vy=0;c.speedNow=0;}}
  for(const c of moving){
   const st=getState(c),name=c.path[0],dest=nodes[name];if(!dest)throw Error('Unknown crowd waypoint '+name);
   const pos=xy([c.x,c.y]),finish=xy(dest),remaining=length([finish[0]-pos[0],finish[1]-pos[1]]);
   if(st.lastGoal!==name){st.lastGoal=name;st.route=[];st.best=remaining;st.checked=clock;}
   if(remaining<st.best-.25){st.best=remaining;st.checked=clock;}
   if(st.route.length&&length([st.route[0][0]-pos[0],st.route[0][1]-pos[1]])<.2)st.route.shift();
   if(clock-st.checked>1.1&&!clearSegment(c,pos,finish)){
    st.route=passingRoute(c,pos,finish);st.checked=clock;st.best=remaining;
   }
   const goal=st.route[0]||finish,delta=[goal[0]-pos[0],goal[1]-pos[1]],d=length(delta),dir=norm(delta);
   const occupiedWaypoint=cast.some(o=>o!==c&&(o.state!=='walking'||o.path?.at(-1)===name)&&distance([o.x,o.y],dest)<radius(c)+radius(o)+.1);
   // A transit waypoint is a turn in the route, not a place that every body
   // must occupy exactly. Two walking residents can otherwise keep claiming
   // the same point forever: neither arrives, so neither counts as a static
   // blocker. Round the corner only when the entire next leg is swept clear.
   // Final action/seat marks are never skipped or declared arrived early.
   const next=c.path.length>1?nodes[c.path[1]]:null;
   // A seat's first exit leg has a deliberate furniture exemption. Keep that
   // leg intact; using its exemption for a shortcut would cut through a sofa.
   const clearNext=next&&!c.navigationSeat&&!seatConfig[c.node]&&!seatConfig[name]&&remaining<radius(c)+2.8&&clearSegment(c,pos,xy(next));
   if(next&&(remaining<.9||clearNext||!c.navigationSeat&&occupiedWaypoint&&remaining<radius(c)+2.8)){c.node=c.path.shift();st.lastGoal=null;continue;}
   if(!st.route.length&&d<.12&&clearSegment(c,pos,goal)){
    [c.x,c.y]=dest;c.node=c.path.shift();st.lastGoal=null;
    if(!c.path.length){c.state='doing';c.speedNow=0;st.vx=st.vy=0;orientForActivity(c);}continue;
   }
   const gaitFactor={walk:1,brisk:1.2,skip:1.38,run:1.65,trot:1.35}[c.gait]||1;
   let speed=Math.min(c.speed*1.25*gaitFactor,Math.sqrt(Math.max(0,d)*(c.gait==='run'?16:13)));
   const acceleration=Math.min(speed,(c.speedNow||0)+dt*(c.gait==='run'?11:8));
   speed=Math.max(.5,acceleration);
   let best=[0,0],bestScore=candidateScore(c,pos,goal,dir,[0,0],dt)-.06;
   // The hard swept test below is the collision guarantee. Sampling wider
   // headings is only steering; it never shifts the rendered model off-route.
   for(const factor of [1,.55])for(const angle of [0,15,-15,30,-30,50,-50,70,-70,90,-90,115,-115,145,-145,180]){
    const a=angle*Math.PI/180,cs=Math.cos(a),sn=Math.sin(a),v=[(dir[0]*cs-dir[1]*sn)*speed*factor,(dir[0]*sn+dir[1]*cs)*speed*factor];
    const score=candidateScore(c,pos,goal,dir,v,dt);
    if(score>bestScore){best=v;bestScore=score;}
   }
   // Move at most to the waypoint, so a fast frame cannot overshoot a seat.
   if(st.route.length){const probe=[pos[0]+dir[0]*Math.min(d,speed*dt),pos[1]+dir[1]*Math.min(d,speed*dt)];if(clearSegment(c,pos,probe))best=dir.map(value=>value*speed);}
   let move=length(best)*dt;if(move>d){best=dir.map(v=>v*d/dt);move=d;}
   if(move>.00001){const next=[pos[0]+best[0]*dt,pos[1]+best[1]*dt];
    if(clearSegment(c,pos,next)){const from=world(c.x,c.y);[c.x,c.y]=fromXY(next);const to=world(c.x,c.y);c.angle=Math.atan2(to.x-from.x,to.z-from.z);c.speedNow=length(best);c.phase=(c.phase||0)+move*1.5;st.vx=best[0];st.vy=best[1];st.stalled=Math.max(0,st.stalled-dt*.3);}else{st.vx=st.vy=0;c.speedNow=0;st.stalled+=dt;}
   }else{st.vx=st.vy=0;c.speedNow=0;st.stalled+=dt;}
  }
 }
 return {tick(dt){if(dt<=0)return;const steps=Math.ceil(Math.min(dt,.3)/.04),sub=Math.min(dt,.3)/steps;for(let i=0;i<steps;i++)advance(sub);},radiusOf:radius,get clock(){return clock;}};
}
