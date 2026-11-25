import {setActorPose} from './stage-actions.js';
import {nodes,distance} from './simulation.js';
import {radiusOf} from './crowd.js';

// One long purpose-driven track per resident. Context/dialogue never replaces
// anyone's active task or route. Explicit start() is the only group reset.
export function createHouseholdDirector({scenes,cast,sendTo,resolveTarget,onScene=()=>{},onLine=()=>{},onTask=()=>{}}){
 let index=0,elapsed=0,line=0,active=null,tracks=[];
 const holds=new Set(),borrowed=new Set(),reservations=new Map();
 let restoringActors=null;
 const goal=c=>c.state==='walking'?c.path?.at(-1):c.node;
 const taskOf=t=>t.tasks[t.step];
 const sharesSpace=(a,b,i,j)=>a===b||nodes[a]&&nodes[b]&&distance(nodes[a],nodes[b])<radiusOf(cast[i])+radiusOf(cast[j])+.12;
 function available(target,actor){
  return [...reservations].every(([i,node])=>i===actor||!sharesSpace(target,node,actor,i))&&
   tracks.every(t=>t.actor===actor||borrowed.has(t.actor)||!sharesSpace(target,t.target,actor,t.actor)||cast[t.actor].outsideBreak)&&
   cast.every((c,i)=>i===actor||borrowed.has(i)||restoringActors?.has(i)||c.outsideBreak||!sharesSpace(target,goal(c),actor,i));
 }
 function assign(track,instant=false,{restore=false}={}){
  const c=cast[track.actor],task=taskOf(track);
  if(c.outsideBreak||holds.has(track.actor)||borrowed.has(track.actor)){track.awaitingAssignment=true;return false;}
  const target=resolveTarget(task,track.actor,active);
  if(!instant&&!available(target,track.actor)){track.awaitingAssignment=true;return false;}
  track.awaitingAssignment=false;track.yielding=false;
  const destinationChanged=track.target!==target;
  track.target=target;
  c.job=task.job;c.destination=target;c.householdPurpose=track.purpose;c.householdStory=track.storyId;c.gait=task.gait||'walk';c.carrying=false;
  if(c.model?.g)c.model.g.userData.acting=false;
  if(!restore||c.activityPose!==task.pose)setActorPose(c,task.pose);
  // Consecutive actions at one counter, or resuming an unchanged walk, never
  // restart the route, acceleration, stand-up animation or limb phase.
  if(instant||goal(c)!==target)sendTo(c,target,instant);
  if(destinationChanged||!restore||c.state==='doing')onTask(c,task);
  return true;
 }
 function start(next=0,instant=false){
  index=(next+scenes.length)%scenes.length;active=scenes[index];elapsed=0;line=0;holds.clear();borrowed.clear();reservations.clear();
  tracks=Object.entries(active.participants).map(([id,first])=>({
   actor:Number(id),tasks:[first,...(first.next||[])],step:0,worked:-(first.offset||0),line:0,target:null,pending:null,cycles:0,
   purpose:first.purpose||first.job,storyId:first.storyId||`${active.id}-${id}`
  }));
  for(const track of tracks)assign(track,instant);
  onScene(active);
 }
 function continueTrack(track){
  const next=(track.step+1)%track.tasks.length;
  const target=resolveTarget(track.tasks[next],track.actor,active);
  if(!available(target,track.actor)){track.pending=next;return false;}
  if(next===0)track.cycles++;
  track.step=next;track.worked=0;track.line=0;track.pending=null;
  return assign(track);
 }
 function work(dt,allowed){
  if(!active||dt<=0)return;
  for(const track of tracks){
   const c=cast[track.actor];
   if(c.outsideBreak||holds.has(track.actor)||borrowed.has(track.actor)||allowed&&!allowed(track.actor))continue;
   // A visitor's performance can borrow this resident. Only resume()/rejoin()
   // restores their personal track; ambient work never fights the performance.
   if(track.awaitingAssignment){assign(track,false,{restore:true});continue;}
   if(c.state!=='doing'||c.node!==track.target||c.destination!==track.target||c.activityPose!==taskOf(track).pose)continue;
   if(track.pending!==null){continueTrack(track);continue;}
   track.worked+=dt;
   const task=taskOf(track),words=task.lines||[];
   while(track.line<words.length&&words[track.line].at<=track.worked){onLine({...words[track.line++],actor:track.actor,task:task.job});}
   if(track.worked>=task.seconds)continueTrack(track);
  }
 }
 function tick(dt){
  if(!active||dt<=0)return;
  work(dt);
  elapsed+=dt;
  while(line<active.lines.length&&active.lines[line].at<=elapsed)onLine(active.lines[line++]);
  // Deliberately no elapsed-duration start(next): six lives do not share a
  // thirty-second destination timer. Each completed personal task advances alone.
 }
 function restore(actor){const track=tracks.find(t=>t.actor===actor);if(track)assign(track,false,{restore:true});}
 function vacateReservedStation(track){
  const c=cast[track.actor];
  const blocks=[...reservations].some(([i,node])=>i!==track.actor&&(sharesSpace(goal(c),node,track.actor,i)||nodes[node]&&distance([c.x,c.y],nodes[node])<radiusOf(c)+radiusOf(cast[i])+.2));
  if(!blocks||c.outsideBreak||holds.has(track.actor))return;
  // A temporarily borrowed station has priority. The resident steps aside via
  // the real graph, retaining their unfinished task and work clock to resume.
  const waiting=['hall','south','entry','lounge','east','middle','livingWest','northAisle'];
  const candidates=waiting.filter(node=>available(node,track.actor)&&cast.every((other,i)=>i===track.actor||distance(nodes[node],[other.x,other.y])>=radiusOf(c)+radiusOf(other)+.25));
  candidates.sort((a,b)=>distance([c.x,c.y],nodes[a])-distance([c.x,c.y],nodes[b]));
  if(!candidates.length)return;
  const node=candidates[0];track.yielding=true;c.destination=node;c.gait='walk';setActorPose(c,'stand');sendTo(c,node);onTask(c,{node,job:'make room at the shared counter',pose:'stand'});
 }
 function restoreUnborrowed(){
  const returning=tracks.filter(t=>!borrowed.has(t.actor));
  // Evaluate the whole handback before assigning any route. Old scripted
  // destinations must not reserve stations after their owners are released.
  restoringActors=new Set(returning.map(t=>t.actor));
  for(const t of returning)if(!assign(t,false,{restore:true}))vacateReservedStation(t);
  restoringActors=null;
 }
 function setStageTargets(targets={}){
  borrowed.clear();reservations.clear();
  for(const [actor,node]of Object.entries(targets)){const i=Number(actor);if(!cast[i]||!nodes[node])throw new TypeError('Unknown directed station '+actor+':'+node);borrowed.add(i);reservations.set(i,node);}
  restoreUnborrowed();
 }
 function releaseStage(){borrowed.clear();reservations.clear();restoreUnborrowed();if(active)onScene(active);}
 return {
  start,tick,work,setStageTargets,releaseStage,
  hold(actor){holds.add(actor);},release(actor){holds.delete(actor);restore(actor);},
  rejoin:restore,
  resume(){restoreUnborrowed();if(active)onScene(active);},
  get current(){return active;},get index(){return index;},get elapsed(){return elapsed;},
  get currentTasks(){return tracks.map(t=>({actor:t.actor,storyId:t.storyId,purpose:t.purpose,step:t.step,job:taskOf(t).job,target:t.target,worked:Math.max(0,t.worked),seconds:taskOf(t).seconds,pending:t.pending,cycles:t.cycles}));},
  get stageTargets(){return Object.fromEntries(reservations);}
 };
}
