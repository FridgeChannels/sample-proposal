// One committed action drives the actor rig, practical props and photographic cut.
export function requiredTargets(stage){
 const entries=Object.entries(stage.targets||{});
 return stage.waitFor?entries.filter(([i])=>stage.waitFor.includes(Number(i))):entries;
}
export function stageArrived(stage,cast){return requiredTargets(stage).every(([i,node])=>cast[Number(i)]?.node===node&&cast[Number(i)]?.state==='doing');}
export function setActorPose(actor,pose,duration){
 actor.activityPose=pose;actor.actionRevision=(actor.actionRevision||0)+1;actor.actionElapsed=0;actor.actionDuration=duration||0;actor.actionProgress=duration?0:undefined;
}
export function createStageActions(cast,{onProps=()=>{},onPose=()=>{},onEvent=()=>{}}={}){
 let stage=null,poseDone=new Set(),propDone=new Set(),sequenceIndex=-1,action=null,actionTime=0,effectsDone=new Set(),complete=false;
 const atMark=i=>cast[i]?.state==='doing'&&(!stage.targets?.[i]||cast[i].node===stage.targets[i]);
 const readyFor=beat=>(beat?.actor==null||atMark(beat.actor))&&Object.keys(beat?.poses||{}).every(atMark);
 function applyEffect(effect){if(effect.props)onProps(effect.props);if(effect.event)onEvent(effect.event,{stageId:stage.id,actionId:action?.id,actor:action?.actor,progress:action?.duration?actionTime/action.duration:1});}
 function enter(index){
  sequenceIndex=index;action=stage.actionSequence[index];actionTime=0;effectsDone.clear();
  if(action.actor!=null&&action.pose){setActorPose(cast[action.actor],action.pose,action.duration);onPose(cast[action.actor]);}
  for(const [i,pose] of Object.entries(action.poses||{})){setActorPose(cast[+i],pose);onPose(cast[+i]);}
  applyEffect(action);
  for(const [i,effect] of (action.effects||[]).entries())if((effect.at??0)<=0){effectsDone.add(i);applyEffect(effect);}
  complete=sequenceIndex===stage.actionSequence.length-1&&!action.duration;
 }
 function begin(next){stage=next;poseDone.clear();propDone.clear();sequenceIndex=-1;action=null;actionTime=0;effectsDone.clear();complete=!next.actionSequence?.length;
  for(const id of Object.keys(next.targets||{})){
   const c=cast[Number(id)],pose=next.poses?.[id];
   c.gait=next.gaits?.[id]||'walk';
   if(pose){setActorPose(c,pose);onPose(c);}
  }
 }
 function update(elapsed,dt,context={}){if(!stage)return;
  const arrived=context.arrived??stageArrived(stage,cast);
  // Walks never consume action progress, even if the overall scene clock runs.
  if(!arrived)return;
  // A short planted turn can precede a reaching action. It has no photo or
  // prop effects; the actor must first face the surface she will touch.
  if(!action&&elapsed<(stage.actionLeadIn||0))return;
  for(const c of cast)if(stage.targets?.[c.cell]&&c.state==='doing'&&c!==cast[action?.actor]){c.actionElapsed=(c.actionElapsed||0)+dt;if(c.actionDuration)c.actionProgress=Math.min(1,c.actionElapsed/c.actionDuration);}
  if(stage.actionSequence?.length){
   if(!action){if(!readyFor(stage.actionSequence[0]))return;enter(0);}
   if(!readyFor(action))return;
   const duration=action.duration||0;
   actionTime=Math.min(duration,actionTime+Math.max(0,dt));
   const actor=cast[action.actor];if(actor){actor.actionElapsed=actionTime;actor.actionDuration=duration;actor.actionProgress=duration?Math.min(1,actionTime/duration):undefined;}
   const progress=duration?actionTime/duration:1;
   for(const [i,effect] of (action.effects||[]).entries())if(!effectsDone.has(i)&&progress>=(effect.at??0)){effectsDone.add(i);applyEffect(effect);}
   if(duration&&progress>=1){
    if(sequenceIndex===stage.actionSequence.length-1)complete=true;
    else if(readyFor(stage.actionSequence[sequenceIndex+1]))enter(sequenceIndex+1);
   }
  }
  // Timelines are only for supporting actors; a sequence owns its lead actor.
  (stage.poseTimeline||[]).forEach((beat,i)=>{
   const c=cast[beat.actor],target=stage.targets?.[beat.actor];
   if(poseDone.has(i)||elapsed<beat.at||!c||c.state!=='doing'||target&&c.node!==target||stage.actionSequence?.some(a=>a.actor===beat.actor))return;
   poseDone.add(i);setActorPose(c,beat.pose,beat.duration);onPose(c);
  });
  (stage.propTimeline||[]).forEach((beat,i)=>{if(propDone.has(i)||elapsed<beat.at)return;propDone.add(i);onProps(beat.props||{});});
 }
 function snapshot(){
  if(!stage)return {stageId:'',id:'idle',phase:'idle',shot:null,complete:true};
  if(!action){
   const lead=stage.cameraActor??stage.actionSequence?.[0]?.actor,actor=cast[lead];
   return {stageId:stage.id,id:`${stage.id}:travel`,phase:'travel',actor:lead,node:actor?.node,pose:actor?.activityPose,progress:0,shot:stage.travelShot&&actor?.state==='walking'&&actor.carrying?stage.travelShot:null,complete};
  }
  const actor=cast[action.actor],progress=action.duration?Math.min(1,actionTime/action.duration):1;
  const valid=stageArrived(stage,cast)&&readyFor(action)&&(!action.pose||actor?.activityPose===action.pose)&&Object.entries(action.poses||{}).every(([i,p])=>cast[i].activityPose===p);
  return {stageId:stage.id,id:action.id,phase:valid?'action':'blocked',actor:action.actor,node:actor?.node,pose:actor?.activityPose,progress,shot:valid&&progress>=(action.revealAt??0)?action.shot||null:null,complete};
 }
 // A directed close-up can hand its current beat back to the same actor graph.
 // This keeps discovery/reading/phone poses aligned while the phone owns time.
 function present({id,actor,pose,shot}){
  if(!stage||!readyFor({actor}))return;
  action={id,actor,pose,shot,duration:0};actionTime=0;effectsDone.clear();complete=true;
  setActorPose(cast[actor],pose);onPose(cast[actor]);
 }
 return {begin,update,snapshot,present,clear(){for(const id of Object.keys(stage?.targets||{})){const c=cast[Number(id)];c.gait='walk';c.actionProgress=undefined;c.actionDuration=0;}stage=null;poseDone.clear();propDone.clear();action=null;sequenceIndex=-1;complete=true;}};
}
