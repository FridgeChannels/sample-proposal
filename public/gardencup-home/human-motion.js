// Distance-driven locomotion plus authored, full-body household actions.
// Canonical model coordinates are Y-up and +Z forward. The world owns travel.
const TAU=Math.PI*2;
// Stride lengths differ even when two people are sent down the same path.
const strideLengths=[.186,.208,.18,.16];
const shoulderSwing=[.085,.11,.095,.13];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const damp=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*dt));
const smooth=t=>t*t*(3-2*t);
const pulse=(t,start,end)=>t<=start||t>=end?0:Math.sin(Math.PI*(t-start)/(end-start));
function setRotation(object,axis,target,dt,snap=false,rate=12){if(object)object.rotation[axis]=snap?target:damp(object.rotation[axis],target,rate,dt);}

export function canMoveHuman(c){return !c.model?.human||!c.model.motion||c.model.motion.seatedBlend<.025;}
export function prepareHumanForTravel(c){if(c.model?.motion)c.model.motion.departing=true;}

function legAngles(leg,targetY,targetZ){
 const a=leg.thighLength,b=leg.shinLength,d=clamp(Math.hypot(targetY,targetZ),.025,a+b-.00002);
 const bend=Math.acos(clamp((a*a+d*d-b*b)/(2*a*d),-1,1));
 const knee=Math.PI-Math.acos(clamp((a*a+b*b-d*d)/(2*a*b),-1,1));
 const restUpper=Math.atan2(leg.restKnee?.z||0,-(leg.restKnee?.y||-a));
 const restLower=Math.atan2(leg.restFoot?.z||0,-(leg.restFoot?.y||-b));
 const upper=restUpper-Math.atan2(targetZ,-targetY)-bend,lower=knee+restLower-restUpper;
 return {upper,lower,foot:-upper-lower};
}
function readingPosture(action){return action==='read'||action==='sit-read'||action==='inspect-card'||action==='sketch'||action==='sit-sketch';}
function seatedLeg(leg,hipY,kind,time,index){
 const a=leg.thighLength,b=leg.shinLength,ankle=leg.ankleHeight||.075;
 const restUpper=Math.atan2(leg.restKnee?.z||0,-(leg.restKnee?.y||-a));
 const restLower=Math.atan2(leg.restFoot?.z||0,-(leg.restFoot?.y||-b));
 let upperAngle,lowerAngle;
 if(kind==='floor'){
  const kneeY=Math.min(.085,hipY-.025);upperAngle=Math.acos(clamp((hipY-kneeY)/a,.06,.9));lowerAngle=-Math.acos(clamp((kneeY-ankle)/b,-.08,.25));
 }else{
  // Stagger the feet slightly. The ankle target is measured up from the floor.
  const stride=a*(kind==='sofa'?.92:.87)+b*(index?.16:-.04);
  return legAngles(leg,ankle-hipY,stride);
 }
 const upper=restUpper-upperAngle,lower=restLower-upper-lowerAngle;return {upper,lower,foot:-upper-lower};
}

const aliases={'press-button':'press','microwave':'press','microwave-load':'load','microwave-unload':'unload','open-box':'unbox','chop':'chop','celebrate':'celebrate','excited':'jump'};
const actionDurations={reach:1.6,open:1.8,press:1.2,load:2.1,unload:2.1,unbox:2.4,pour:2.5,drink:3.1,'throw-ball':1.2,catch:1.3,jump:1.15,celebrate:2.5,wave:2.4};

/** Updates only the local rig. Optional c.actionProgress gives a director-owned
 * 0..1 gesture beat; otherwise activity changes start a local action clock. */
export function poseHuman(c,time,dt,{seatConfig={}}={}){
 const m=c.model;if(!m?.human)return;
 const wantsWalk=c.state==='walking';
 const activity=wantsWalk?'walk':c.activityPose||'stand';
 const seat=seatConfig[c.node],seated=!wantsWalk&&!!seat&&activity.startsWith('sit');
 const kind=seat?.kind||(activity==='sit-game'?'floor':'chair'),scale=m.g.scale.y||1;
 const desiredHip=(seat?.hipHeight??(kind==='floor'?.26:.68))/scale,first=!m.motion;
 const state=m.motion||(m.motion={phase:Math.PI*(c.cell||0)*.5,walkBlend:0,runBlend:0,seatedBlend:seated?1:0,lastX:m.g.position.x,lastZ:m.g.position.z,departing:false,activity,actionElapsed:0});
 if(dt<=0&&!first)return;
 const delta=Math.min(.12,Math.max(0,dt));
 if(state.activity!==activity||state.actionRevision!==c.actionRevision){state.activity=activity;state.actionRevision=c.actionRevision;state.actionElapsed=0;}else state.actionElapsed+=delta;
 const elapsed=state.actionElapsed;
 // Noah lands between two little mattress bounces, then searches the quilt.
 const bedPlay=activity==='bed-play',secondHop=elapsed>=1.45;
 const action=bedPlay?(elapsed<2.6?'jump':'reach'):(aliases[activity]||activity);
 const actionElapsed=bedPlay?Math.max(0,elapsed-(action==='reach'?2.6:secondHop?1.45:0)):elapsed;
 const readingBook=action==='read'||action==='sit-read'||action==='sit-homework';
 const pageTurn=readingBook?clamp(((elapsed%7.6)-4.65)/1.05,0,1):0;
 if(m.bookPage){
  m.bookPage.visible=pageTurn>0&&pageTurn<1;
  if(m.bookPage.visible)m.bookPage.rotation.z=.13+(Math.PI-.26)*smooth(pageTurn);
 }
 const foldAngle=action==='fold'||action==='sit-fold'?Math.PI*.94*(.5-.5*Math.cos(elapsed*1.42)):0;
 if(m.clothCrease)m.clothCrease.rotation.z=foldAngle;
 const actionDuration=c.actionDuration||actionDurations[action]||2;
 const progress=Number.isFinite(c.actionProgress)?clamp(c.actionProgress,0,1):clamp(actionElapsed/actionDuration,0,1);
 const beat=Number.isFinite(c.actionProgress)?c.actionProgress*actionDuration:elapsed;
 const travel=Math.hypot(m.g.position.x-state.lastX,m.g.position.z-state.lastZ);
 state.lastX=m.g.position.x;state.lastZ=m.g.position.z;
 state.seatedBlend=first?(seated?1:0):damp(state.seatedBlend,seated?1:0,9,delta);
 if(!wantsWalk)state.departing=false;
 const ready=state.seatedBlend<.025,speedRatio=(c.speedNow||0)/Math.max(1,c.speed||2.8);
 const desiredWalk=wantsWalk&&ready?clamp(speedRatio/1.05,0,1):0;
 const desiredRun=wantsWalk&&ready&&(c.gait==='run'||(!c.gait&&speedRatio>1.55))?1:0;
 state.walkBlend=damp(state.walkBlend,desiredWalk,12,delta);state.runBlend=damp(state.runBlend||0,desiredRun,7,delta);
 const gait=state.walkBlend,run=state.runBlend,stride=(strideLengths[c.cell]||.19)+.09*run;
 if(wantsWalk&&ready&&travel<scale*.7)state.phase=(state.phase+travel/(4*stride*scale)*TAU)%TAU;
 const phase=state.phase;
 // Running changes both support time and flight; it is not a fast walk loop.
 const skipping=wantsWalk&&c.cell>=2&&c.cell<=3&&c.gait==='skip';
 const skipLift=skipping ? .063*Math.pow(Math.max(0,Math.sin(phase)),2)*gait:0;
 const walkPelvis=skipLift+((-0.012+.009*Math.cos(2*phase))*(1-run)+(.028-.028*Math.cos(2*phase))*run)*gait;
 let jumpY=0,jumpBend=0;
 if(!wantsWalk&&action==='jump'){
  if(progress<.18){jumpY=-.052*Math.sin(progress/.18*Math.PI/2);jumpBend=progress/.18;}
  else if(progress<.73){const f=(progress-.18)/.55;jumpY=.17*Math.sin(Math.PI*f);jumpBend=.28*Math.sin(Math.PI*f);}
  else if(progress<1){const f=(progress-.73)/.27;jumpY=-.038*Math.sin(Math.PI*f);jumpBend=.7*Math.sin(Math.PI*f);}
 }
 const seatedOffset=desiredHip-m.hipHeight;
 m.rig.position.x=damp(m.rig.position.x,.007*Math.sin(phase)*gait,10,delta);
 setRotation(m.rig,'z',(.012+.014*run+(skipping ? .022 : 0))*Math.sin(phase)*gait,delta,first);
 setRotation(m.rig,'y',(.022+.025*run)*Math.sin(phase)*gait,delta,first);
 let lean=(.035+.075*run)*gait;
 if(seated)lean=kind==='sofa'?[-.07,-.12,.05][c.cell%3]:kind==='armchair'?-.055:kind==='floor'?.10:.035;
 if(action==='watch-phone'||action==='peer-in')lean=.09;
 if(!wantsWalk&&['cook','chop','wash','fold','stir','load','unload','unbox','pack-lunch','inspect-empty-carton'].includes(action))lean=.055;
 if(!wantsWalk&&action==='pet')lean=.24;
 if(!wantsWalk&&action==='jump')lean=.1*jumpBend;
 setRotation(m.rig,'x',lean,delta,first);
 // Bend at the hips rather than tipping the entire figure onto its toes.
 // The inverse leg rotation below keeps soles planted under the same hip.
 const bodyLean=m.rig.rotation.x;
 const targetY=seatedOffset*state.seatedBlend+(walkPelvis+jumpY)*(1-state.seatedBlend)+m.hipHeight*(1-Math.cos(bodyLean));
 m.rig.position.y=first?targetY:damp(m.rig.position.y,targetY,20,delta);
 m.rig.position.z=-m.hipHeight*Math.sin(bodyLean);
 m.legs.forEach((leg,i)=>{
  const cycle=((phase/TAU+i*.5)%1+1)%1,support=.6-.18*run;
  let footZ=0,lift=0,anklePitch=0;
  if(cycle<support){
   const t=cycle/support;footZ=stride*(1-2*t);anklePitch=t<.12?-.12*(1-t/.12):t>.82?.2*(t-.82)/.18:0;
  }else{
   const t=(cycle-support)/(1-support);footZ=stride*(-1+2*smooth(t));lift=(.075+.09*run+(skipping ? .048 : 0))*Math.pow(Math.sin(Math.PI*t),1.2);anklePitch=(.12+.12*run)*Math.sin(Math.PI*t);
  }
  const ankle=leg.ankleHeight||.075,contactLift=cycle<support?(Math.max(0,anklePitch)*.15+Math.max(0,-anklePitch)*.06):0;
  const walking=legAngles(leg,ankle-m.hipHeight-walkPelvis+lift+contactLift,footZ),sitting=seatedLeg(leg,desiredHip,kind,time,i);
  let u=walking.upper*gait*(1-state.seatedBlend)+sitting.upper*state.seatedBlend;
  let k=walking.lower*gait*(1-state.seatedBlend)+sitting.lower*state.seatedBlend;
  let f=(walking.foot+anklePitch)*gait*(1-state.seatedBlend)+sitting.foot*state.seatedBlend;
  if(!wantsWalk&&action==='jump'&&progress<1){
   if(jumpY<=0){const grounded=legAngles(leg,ankle-m.hipHeight-jumpY,0);u=grounded.upper;k=grounded.lower;f=grounded.foot;}
   else{u=-.19*jumpBend;k=.62*jumpBend;f=-u-k;}
  }
  setRotation(leg.thigh,'x',u-bodyLean,delta,first,20);setRotation(leg.knee,'x',k,delta,first,20);setRotation(leg.foot,'x',f,delta,first,20);
  setRotation(leg.hip,'z',0,delta,first);setRotation(leg.thigh,'y',(i?1:-1)*(kind==='floor'?.45:kind==='sofa'?.095:.045)*state.seatedBlend,delta,first);setRotation(leg.knee,'z',0,delta,first);
 });
 // The rib cage counters the hips. Keep the palm targets in the body
 // frame so shifting weight never drags a cup or slides a hand off a door.
 const gazeLead=clamp(c.turnLead||0,-.46,.46);
 if(m.chest){
  const breathing=Math.sin(time*(1.48+(c.cell||0)*.11)+(c.cell||0)*1.8);
  const walkTwist=(shoulderSwing[c.cell]||.09)*Math.cos(phase)*gait;
  const work=action==='open'||action==='press'||action==='unbox'?pulse(progress,.02,.95):0;
  const page=action==='read'||action==='sit-read'?Math.sin(beat*.62):0;
  setRotation(m.chest,'y',walkTwist+gazeLead*.24-work*.09+page*.028,delta,first);
  setRotation(m.chest,'x',breathing*.012+work*.09+jumpBend*.12+(readingPosture(action) ? .048 : 0),delta,first);
  setRotation(m.chest,'z',-.035*Math.sin(phase)*gait+page*.017,delta,first);
 }
 const carrying=!!c.carrying||c.activityPose==='carry';
 const speaking=!wantsWalk&&(c.speakingUntil||0)>time;
 m.arms.forEach((arm,i)=>{
  const sign=arm.sideSign||Math.sign(arm.shoulder.position.x)||(i===0?-1:1),dominant=i===1,armPhase=phase+i*Math.PI;
  // Locomotion keeps the shoulders free, with the opposite arm accompanying
  // each leg. Running bends the elbows instead of swinging straight arms.
  if(wantsWalk&&!carrying){
   const shoulder=-.025+(.34+.21*run)*Math.cos(armPhase)*gait;
   const elbow=-.12-gait*(.14+.14*Math.max(0,-Math.cos(armPhase)))-run*.61;
   setRotation(arm.shoulder,'x',shoulder,delta,first);setRotation(arm.shoulder,'y',0,delta,first);setRotation(arm.shoulder,'z',sign*(.035+.045*gait),delta,first);
   setRotation(arm.elbow,'x',elbow,delta,first);setRotation(arm.elbow,'y',0,delta,first);setRotation(arm.elbow,'z',sign*.015,delta,first);
   setRotation(arm.wrist,'x',-.025,delta,first);setRotation(arm.wrist,'y',0,delta,first);setRotation(arm.wrist,'z',0,delta,first);
   return;
  }
  // All household targets are palm positions relative to the torso. The two
  // arms have different jobs; they no longer hold a symmetric raised V pose.
  const restY=arm.shoulder.position.y-arm.length-arm.forearmLength-.035;
  let point=[arm.shoulder.position.x+sign*.075,restY,.065],rotation=[.04,-sign*.12,sign*.035],elbowOut=.65;
  const breath=.003*Math.sin(time*1.6+(c.cell||0));point[1]+=breath;
  const gesture=pulse(progress,0,1),cyc=Math.sin(beat*5),height=m.shoulderHeight-1.36;
  const target=(x,y,z,rx=0,ry=0,rz=0)=>{point=[x,y+height,z];rotation=[rx,ry,rz];};
  if(carrying){target(sign*(c.carrying?(m.heldParcel?.userData?.dimensions?.width||.30)*.49:.105),1.055,.25,0,0,0);}
  else switch(action){
   case 'tap': {
    // One hand supports the phone; the other makes a small, visible tap.
    const touch=.5+.5*Math.sin(beat*4.7);
    if(dominant)target(.028,1.125+.008*touch,.255-.018*touch,-.95,-.08,-.12);
    else target(-.055,1.10,.245,-.18,.08,.02);
    elbowOut=.8;break;
   }
   case 'read':case 'sit-read':case 'sit-homework': {
    const flip=dominant?Math.sin(Math.PI*pageTurn):0;
    target(sign*.09-.09*flip,1.06+.06*flip,.25+.015*flip,-.18-.25*flip,-sign*.18,0);break;
   }
   case 'sketch':case 'sit-sketch':case 'measure': {
    const stroke=action==='measure'?.038*Math.sin(beat*1.5):.015*Math.sin(beat*6)+.013*Math.sin(beat*2.2);
    if(dominant)target(-.014+stroke,1.06+.007*Math.cos(beat*3),.29+.02*Math.cos(beat*2.8),-.65,.06,-.08);
    else target(-.069,1.025,.285,-.13,.02,.02);
    break;
   }
   case 'build':case 'sit-build':
    if(dominant)target(.005+.037*Math.sin(beat*2),1.005+.035*(.5+.5*Math.cos(beat*2)),.285,-.82,0,-.12);
    else target(-.055,1.005,.275,-.2,0,0);
    break;
   case 'pack':
    if(dominant)target(.10+.075*Math.sin(beat*2),.99+.065*Math.cos(beat*2),.32-.045*Math.sin(beat*2),-.85,0,.04);
    else target(-.105,.98,.29,-.75,0,0);
    break;
   case 'point-out':
    if(dominant)target(.11,1.09,.34,-.57,.04,-.1);
    elbowOut=.44;break;
   case 'show-card':
    if(dominant)target(.06,1.12,.31,-.7,-.22,-.08);
    else target(-.06,1.1,.29,.06,.11,.02);
    elbowOut=.65;break;
   case 'turn-card':
   case 'inspect-card':
    // Support the lower corner in the left hand; the right fingertips steady
    // the opposite edge. The small magnet stays below the chest, not overhead.
    if(dominant)target(.052,1.105,.245,-.72,-.16,-.08);
    else target(-.065,1.08,.235,.08,.05,.02);
    elbowOut=.75;break;
   case 'cook':case 'chop':
    if(dominant)target(.085,1.005+.05*(.5+.5*Math.sin(beat*7)),.365,-1.35,0,.045*Math.sin(beat*7));
    else target(-.10,.995,c.cell===3?.338:.365,-1.38,0,.08);
    break;
   case 'unbox': {
    const open=pulse(progress,.08,.9),flap=pulse(progress,.18,.78);
    target(sign*(.115+.11*open),1.015+.035*flap+(dominant?.014*Math.sin(beat*4):0),.31+.02*Math.sin(beat*2+i),-1.05,-sign*.16,sign*.12*open);break;
   }
   case 'pour': {
    const tip=pulse(progress,.12,.92);
    if(dominant)target(.065,1.17+.025*tip,.275,0,0,-.1*tip);
    else target(-.065,1.035,.29,0,0,0);
    break;
   }
   case 'stir':
    if(dominant)target(.015+.025*Math.cos(beat*5),1.105,.255+.025*Math.sin(beat*5),-1.12,0,.1*Math.cos(beat*5));
    else target(-.055,1.025,.31,0,0,0);
    break;
   case 'load':case 'unload': {
    const extend=pulse(progress,.06,.94);target(sign*.115,1.015+.025*extend,.24+.09*extend,0,0,0);break;
   }
   case 'reach':case 'open':case 'press': {
    const extend=pulse(progress,.05,.95);
    if(dominant)target(.08,1.05+.15*extend,.21+.22*extend,-.9,0,0);
    break;
   }
   case 'wash': {
    const stroke=Math.sin(beat*3.3),turn=Math.cos(beat*1.65);
    if(dominant)target(.012+.046*stroke,1.025+.023*turn,.35+.026*Math.cos(beat*3.3),-1.18,.23*turn,.15*stroke);
    else target(-.055,1.002,.322,-.9,-.18*turn,.05);
    break;
   }
   case 'sit-fold':case 'fold': {
    if(dominant)target(.008+.083*Math.cos(foldAngle),1.016+.083*Math.sin(foldAngle),.293,-1.05-.20*Math.sin(foldAngle),0,0);
    else target(-.075,1.005,.273,-1.05,0,0);
    break;
   }
   case 'drink':case 'sit-eat': {
    const sip=pulse((beat%(action==='drink'?4.4:5.3))/(action==='drink'?4.4:5.3),.16,.69);
    if(dominant)target(.14-.065*sip,1.01+.43*sip,.245-.085*sip,-.14*sip,0,0);
    else if(action==='sit-eat')target(-.13,.98,.22,-.2,0,0);
    break;
   }
   case 'pet':if(dominant)target(.19,.77,.29+.045*Math.sin(beat*4),-1.1,0,0);break;
   case 'sit-game':target(sign*.1,.95+.018*Math.sin(beat*2.1+i),.28,-.42,0,0);break;
   case 'sit-watch': {
    const lap=m.hipHeight+.105;
    point=[sign*.115,lap,.22];rotation=[-.24,sign*.18,0];elbowOut=.24;
    if(c.cell===0&&!dominant)point=[-.24,lap+.08,.035];
    if(c.cell===1&&dominant)point=[.10,lap+.115,.29];
    if(c.cell===2)point=[sign*.07,lap+.025,.20];
    if(c.cell===3&&!dominant)point=[-.20,lap+.06,.08];
    break;
   }
   case 'watch-phone':if(dominant)target(.10,1.03,.23,-.42,0,0);break;
   case 'wave': {
    const hello=pulse(progress,.04,.96);
    if(dominant)target(.27+.025*Math.sin(beat*9)*hello,restY+(1.46-restY)*hello,.08+.10*hello,-2.6*hello,0,-.20*Math.sin(beat*9)*hello);
    break;
   }
   case 'celebrate': {
    // A brief, asymmetric response, then relaxed hands again.
    const happy=pulse(progress,.08,.92);
    if(dominant)target(.22,restY+.42*happy,.07+.12*happy,-.8*happy,0,-.18*happy);
    else target(-.23,restY+.13*happy,.08+.07*happy,-.2,0,0);
    break;
   }
   case 'jump': {
    const lift=pulse(progress,.12,.88);target(sign*(.25+.025*lift),restY+.23*lift,.055+.12*lift,-.65*lift,0,sign*.04);break;
   }
   case 'throw-ball': {
    const wind=pulse(progress,0,.4),release=pulse(progress,.3,.84);
    if(dominant)target(.24,restY+.14*wind+.23*release,.06-.16*wind+.31*release,-.7*release,0,0);
    break;
   }
   case 'catch':target(sign*(.15+.045*gesture),1.04+.075*gesture,.23+.13*gesture,-.2,0,0);break;
   default:if(speaking&&dominant){const chat=.5+.5*Math.sin(beat*2.2);target(.22+.035*chat,.99+.055*chat,.17+.035*chat,-.45,.18,.08);}
  }
  // These prop-owned contacts are measured in world space, so the reaching
  // palm meets the actual carton/bag even while Emma turns toward the island.
  // The same rig and physical geometry are used by WebGL and DepthRenderer.
  const contacts=c.actionHandTargets;
  const fridgeContact=contacts?.owner==='fridge';
  if(!wantsWalk&&(fridgeContact||contacts?.owner==='appliance'||contacts?.owner==='lunch'&&['pack-lunch','inspect-empty-carton'].includes(action))){
   const side=dominant?'right':'left',contact=contacts[side],amount=contacts[side+'Weight']??1;
   if(contact&&amount>0){
    m.rig.updateWorldMatrix(true,false);
    const local=m.rig.worldToLocal(contact.clone()).toArray();
    point=point.map((v,k)=>v+(local[k]-v)*amount);
    if(contacts.owner!=='appliance')rotation=fridgeContact?[-.25,dominant?-.1:.1,0]:[-1.05,0,dominant?-.08:.08];
    elbowOut=.48;
   }
  }
  arm.poseGrip(point,{rotation,elbowOut},delta,first);
 });
 const reading=['read','sit-read','sit-homework','sit-game','inspect-card','sketch','sit-sketch','measure','sit-build','build'].includes(activity),lookingDown=['pour','stir','cook','chop','wash','unbox','pet','tap','pack-lunch','inspect-empty-carton'].includes(action);
 setRotation(m.head,'x',(action==='peer-in'?.20:action==='watch-phone'?.19:action==='inspect-card'||action==='turn-card'?.18:reading?.13:lookingDown?.11:0)+(speaking?.04*Math.sin(beat*3.2):0)-.035*run*gait,delta,first);
 const attention=action==='inspect-card'?-.025:wantsWalk?gazeLead*.75-.05*Math.cos(phase):activity==='sit-watch'?.18+.06*Math.sin(time*.31+c.cell):.055*Math.sin(time*.35+(c.cell||0));
 setRotation(m.head,'y',attention,delta,first,8);
 setRotation(m.head,'z',speaking?.035*Math.sin(beat*2.1):-.015*Math.sin(phase)*gait,delta,first,7);
 if(m.props){
  const explicit=String(c.handProp||''),external=new Set(c.externalHandProps||[]);
  const managed=(key,object)=>external.has(key)||external.has(object);
  for(const [key,object] of Object.entries(m.props)){if(!object||typeof object.visible!=='boolean')continue;object.visible=!managed(key,object)&&explicit===key;}
  const show=key=>{if(m.props[key]&&!managed(key,m.props[key]))m.props[key].visible=true;};
  if(c.activityPose==='carry'&&!c.carrying)show('bowl');
  if(!wantsWalk&&!carrying){
   if(activity==='sit-eat'||activity==='drink')show('cup');
   if(['read','sit-read','sit-homework','pack'].includes(activity))show('book');
   if(['sketch','sit-sketch','measure'].includes(activity)){show('notepad');show('pencil');}
   if(['build','sit-build'].includes(activity))show('bridge');
   if(['fold','sit-fold'].includes(activity))show('linen');
   if(['inspect-card','turn-card','show-card'].includes(action))show('card');
   if(activity==='sit-watch'&&c.cell===1)show('remote');
   if(action==='pour'){show('milk');show('leftCup');}
   if(action==='stir'){show('bowl');show('spoon');}
   if(action==='cook'||action==='chop')show('spoon');
   if(action==='load'&&progress<=.4||action==='unload'&&progress>=.45)show('bowl');
   if(action==='tap')show('phone');
  }
  // The hand solver places palms; props retain their own orientation. Using
  // the full parent quaternion also works when elbows cross toward a phone.
  const level=(key,index,tilt=0)=>{
   const prop=m.props[key];if(!prop?.visible||!prop.quaternion||managed(key,prop))return;
   const rotation=prop.userData.levelQuaternion||(prop.userData.levelQuaternion=prop.quaternion.clone());
   m.g.getWorldQuaternion(rotation);prop.parent.getWorldQuaternion(prop.quaternion).invert().multiply(rotation);
   prop.rotateX(tilt);
  };
  const sip=(action==='drink'||activity==='sit-eat')?pulse((beat%(action==='drink'?4.4:5.3))/(action==='drink'?4.4:5.3),.16,.69):0;
  level('cup',1,.23*sip);level('leftCup',0);level('bowl',0,.025);level('phone',0,-.18);level('book',0,-.16);level('notepad',0,-.15);level('bridge',0);level('linen',0);level('card',0,.35);
  if(action==='turn-card'&&m.props.card?.visible)m.props.card.rotateY(Math.PI*Math.min(1,beat/.7));
  level('milk',1,action==='pour'?1.12*pulse(progress,.12,.92):0);
 }
 return {readyToWalk:ready,activity,seatedBlend:state.seatedBlend,walkBlend:gait,runBlend:run,actionProgress:progress,jumpHeight:jumpY};
}
