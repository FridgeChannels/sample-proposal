// Connected sculpted animal meshes, articulated through a shared skin skeleton.
// Coats are vertex colored so WebGL and the SVG fallback show the same markings.
const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
const smooth=t=>t*t*(3-2*t);

export function createPet(THREE,index,{software=false}={}){
 const cat=index===5,g=new THREE.Group(),rig=new THREE.Group();g.add(rig);
 g.name=cat?'Maple · shorthaired tabby':'Cooper · golden retriever';
 const bones=[],bone=(name,parent,p)=>{const b=new THREE.Bone();b.name=name;b.position.set(...p);parent.add(b);bones.push(b);return b;};
 const root=bone('body',rig,[0,0,0]),pelvis=bone('pelvis',root,[0,0,0]);
 const headPoint=cat?[0,.30,.22]:[0,.57,.36],head=bone('head',root,headPoint);
 const jawPoint=cat?[0,.320,.343]:[0,.632,.605],jaw=bone('jaw',head,jawPoint.map((v,i)=>v-headPoint[i]));
 const ears=[-1,1].map(side=>{const p=cat?[side*.071,.398,.271]:[side*.108,.745,.474];return bone('ear'+side,head,p.map((v,i)=>v-headPoint[i]));});
 const boneId=b=>bones.indexOf(b),positions=[],colors=[],skinIndices=[],skinWeights=[],indices=[];
 const base=cat?new THREE.Color('#988d7c'):new THREE.Color('#baa076');
 const dark=cat?new THREE.Color('#4d493f'):new THREE.Color('#84613b');
 const light=cat?new THREE.Color('#d6caba'):new THREE.Color('#e6d6b9');
 function coat(p,zone='body'){
  let c=base.clone();
  if(zone==='nose')return new THREE.Color(cat?'#7d625b':'#302c28');
  if(zone==='eye')return new THREE.Color('#211d18');
  if(zone==='iris')return new THREE.Color(cat?'#87925b':'#65482b');
  if(zone==='shine')return new THREE.Color('#d4c9b1');
  if(zone==='earInside')return new THREE.Color(cat?'#af9386':'#b38954');
  if(zone==='whisker')return new THREE.Color('#bfb7a8');
  if(zone==='mouth')return new THREE.Color('#4c3d2e');
  if(zone==='tongue')return new THREE.Color('#b77b76');
  if(zone==='collar')return new THREE.Color(cat?'#9d7454':'#627e75');
  if(zone==='tag')return new THREE.Color('#c7a65e');
  if(zone==='paw')return c.lerp(light,cat?.23:.08);
  const underside=cat?.235:.42;
  if(p[1]<underside)c.lerp(light,clamp((underside-p[1])*3,0,.7));
  if(cat){
   // Mackerel stripes wrap the flank and forehead instead of a tiled image.
   const flank=Math.abs(p[0])>.035&&p[2]<.23;
   const stripe=Math.sin(p[2]*49+p[1]*14+Math.sin(p[1]*24)*.55);
   if(flank)c.lerp(dark,.66*smooth(clamp((stripe-.28)/.60,0,1)));
   if(zone==='tail'&&Math.sin(p[2]*75)>.25)c.lerp(dark,.7);
   if(p[1]>.34&&p[2]>.25&&Math.sin(Math.abs(p[0])*115+p[2]*12)>.4)c.lerp(dark,.52);
   if(p[2]>.318&&p[1]<.35)c.lerp(light,.48);
  }else{
   if(p[1]>.50&&p[2]<.25)c.lerp(dark,.18);
   if(p[2]>.22&&p[2]<.43&&p[1]<.48)c.lerp(light,.5);
   if(p[2]>.54&&p[1]<.68)c.lerp(light,.45);
   c.multiplyScalar(1+.025*Math.sin(p[0]*90+p[1]*64+p[2]*73));
  }
  return c;
 }
 function vertex(p,weights,zone){const id=positions.length/3;positions.push(...p);const c=coat(p,zone);colors.push(c.r,c.g,c.b);const w=Object.entries(weights).sort((a,b)=>b[1]-a[1]).slice(0,4);while(w.length<4)w.push([0,0]);const total=w.reduce((n,x)=>n+x[1],0)||1;skinIndices.push(...w.map(x=>+x[0]));skinWeights.push(...w.map(x=>x[1]/total));return id;}
 function quad(a,b,c,d){indices.push(a,b,c,a,c,d);}
 function loft(sections,segments,weightFn,zone='body'){
  const start=positions.length/3;
  sections.forEach((s,i)=>{for(let j=0;j<segments;j++){const a=j*TAU/segments,p=[s[0]+Math.cos(a)*s[3],s[1]+Math.sin(a)*s[4],s[2]];vertex(p,weightFn(p,i),zone);}});
  for(let i=0;i<sections.length-1;i++)for(let j=0;j<segments;j++){const k=(j+1)%segments;quad(start+i*segments+j,start+i*segments+k,start+(i+1)*segments+k,start+(i+1)*segments+j);}
  const cap=(section,ring,reverse)=>{const p=vertex(section.slice(0,3),weightFn(section.slice(0,3),ring),zone);for(let j=0;j<segments;j++){const a=start+ring*segments+j,b=start+ring*segments+(j+1)%segments;indices.push(...(reverse?[p,b,a]:[p,a,b]));}};
  cap(sections[0],0,true);cap(sections.at(-1),sections.length-1,false);
 }
 const sections=cat?[
  [0,.235,-.30,.035,.055],[0,.245,-.265,.075,.09],[0,.245,-.20,.10,.115],[0,.23,-.10,.082,.095],[0,.235,.015,.073,.09],[0,.25,.11,.085,.105],[0,.28,.18,.075,.108],[0,.315,.22,.067,.10],[0,.355,.27,.087,.078],[0,.355,.315,.078,.069],[0,.338,.35,.049,.036],[0,.334,.385,.026,.021]
 ]:[
  [0,.43,-.52,.045,.07],[0,.44,-.46,.14,.18],[0,.43,-.35,.18,.22],[0,.46,-.20,.162,.19],[0,.48,-.05,.142,.17],[0,.465,.09,.17,.205],[0,.47,.23,.19,.23],[0,.52,.32,.167,.23],[0,.605,.38,.13,.195],[0,.695,.44,.116,.15],[0,.724,.50,.119,.125],[0,.704,.565,.098,.105],[0,.669,.61,.080,.065],[0,.657,.675,.073,.054],[0,.655,.715,.057,.045]
 ];
 function bodyWeight(p){
  const headW=clamp((p[2]-(cat?.17:.31))/(cat?.08:.12),0,1)*clamp((p[1]-(cat?.22:.49))/(cat?.06:.10),0,1);
  const rear=clamp((-p[2]-(cat?.05:.12))/(cat?.15:.25),0,1)*.95;
  return {[boneId(root)]:(1-headW)*(1-rear),[boneId(pelvis)]:(1-headW)*rear,[boneId(head)]:headW};
 }
 function smoothSections(source){
  const result=[],steps=software?2:4;
  for(let i=0;i<source.length-1;i++)for(let k=0;k<steps;k++){
   const t=k/steps,a=source[Math.max(0,i-1)],b=source[i],c=source[i+1],d=source[Math.min(source.length-1,i+2)];
   result.push(b.map((value,j)=>.5*((2*value)+(-a[j]+c[j])*t+(2*a[j]-5*value+4*c[j]-d[j])*t*t+(-a[j]+3*value-3*c[j]+d[j])*t*t*t)));
  }result.push(source.at(-1));return result;
 }
 loft(smoothSections(sections),software?14:24,bodyWeight);
 // Feather the retriever's bib and haunches with tapered locks that bend with
 // the coat. They share the body draw call and the same skin weights.
 if(!cat)for(const side of [-1,1]){
  for(const [x,y,z,width,drop] of [[.13,.52,.34,.040,.10],[.152,.49,.29,.041,.12],[.16,.45,.25,.039,.11],[.14,.45,-.37,.048,.12],[.13,.42,-.41,.042,.10]]){
   loft([[side*x,y,z,width,.060],[side*(x+.006),y-.03,z-.018,width*.88,.054],[side*(x+.01),y-drop,z-.04,.004,.006]],software?5:8,bodyWeight);
  }
 }
 function appendEllipsoid(p,r,b,zone,segments=software?8:14,rings=software?5:8){
  const section=[];for(let i=0;i<=rings;i++){const a=i*Math.PI/rings;section.push([p[0],p[1],p[2]+Math.cos(a)*r[2],Math.max(.0003,Math.sin(a)*r[0]),Math.max(.0003,Math.sin(a)*r[1])]);}loft(section,segments,()=>({[boneId(b)]:1}),zone);
 }
 // Small inset eyes, a shaped muzzle/nose and fine lips. No oversized eyeballs.
 for(const side of [-1,1]){
  const eye=cat?[side*.066,.376,.323]:[side*.087,.742,.573];
  appendEllipsoid(eye,cat?[.017,.011,.009]:[.014,.012,.009],head,'eye');
  appendEllipsoid([eye[0],eye[1],eye[2]+.007],cat?[.011,.008,.003]:[.008,.008,.003],head,'iris');
  appendEllipsoid([eye[0],eye[1],eye[2]+.009],cat?[.0025,.007,.002]:[.0048,.006,.002],head,'eye',6,4);
  appendEllipsoid([eye[0]-.003,eye[1]+.004,eye[2]+.011],[.0022,.0022,.0012],head,'shine',5,3);
 }
 appendEllipsoid(cat?[0,.337,.387]:[0,.660,.719],cat?[.018,.011,.012]:[.046,.028,.016],head,'nose');
 // Ear pinnae deform independently, so attention and a quick trot visibly react.
 for(const side of [-1,1]){
  const earBone=ears[side<0?0:1];
  if(cat){
   const outline=[[side*.057,.396,.278],[side*.086,.477,.25],[side*.105,.389,.24],[side*.076,.391,.304]];
   const center=[side*.081,.411,.267],ids=outline.map(p=>vertex(p,{[boneId(earBone)]:1},'body')),mid=vertex(center,{[boneId(earBone)]:1},'earInside');
   for(let j=0;j<4;j++)indices.push(mid,ids[j],ids[(j+1)%4]);
   const back=vertex([side*.082,.414,.247],{[boneId(earBone)]:1},'body');for(let j=0;j<4;j++)indices.push(back,ids[(j+1)%4],ids[j]);
  }else{
   const ear=[[side*.107,.746,.474,.018,.052],[side*.139,.692,.455,.025,.075],[side*.158,.624,.446,.027,.073],[side*.151,.565,.446,.022,.048],[side*.142,.547,.448,.008,.016]];
   // Ear rings follow the vertical fall and have a softly folded front edge.
   const start=positions.length/3,segs=software?8:12;
   ear.forEach(s=>{for(let j=0;j<segs;j++){const a=j*TAU/segs;vertex([s[0]+Math.cos(a)*s[3],s[1],s[2]+Math.sin(a)*s[4]],{[boneId(earBone)]:1},'earInside');}});
   for(let i=0;i<ear.length-1;i++)for(let j=0;j<segs;j++)quad(start+i*segs+j,start+i*segs+(j+1)%segs,start+(i+1)*segs+(j+1)%segs,start+(i+1)*segs+j);
  }
 }
 // The lower lip and tongue sit inside the muzzle while closed; a small
 // independent jaw motion gives Cooper a relaxed pant without a cartoon grin.
 appendEllipsoid(cat?[0,.317,.364]:[0,.631,.659],cat?[.026,.009,.027]:[.058,.014,.066],jaw,'body');
 appendEllipsoid(cat?[0,.326,.371]:[0,.644,.678],cat?[.019,.003,.022]:[.042,.005,.044],jaw,'mouth');
 appendEllipsoid(cat?[0,.326,.378]:[0,.645,.692],cat?[.010,.002,.014]:[.022,.004,.031],jaw,'tongue',software?6:10,4);
 // A narrow fabric collar follows the neck; its small tag swings with the body.
 if(!cat){
  const start=positions.length/3,n=software?14:24;
  for(const y of [.535,.557])for(let i=0;i<n;i++){const a=i*TAU/n;vertex([.151*Math.cos(a),y,.346+.137*Math.sin(a)],{[boneId(root)]:.45,[boneId(head)]:.55},'collar');}
  for(let i=0;i<n;i++)quad(start+i,start+(i+1)%n,start+n+(i+1)%n,start+n+i);
  appendEllipsoid([0,.508,.490],[.019,.024,.004],head,'tag',8,5);
 }
 const legs=[];
 for(const front of [true,false])for(const side of [-1,1]){
  const hipP=cat?[side*.061,.247,front?.145:-.205]:[side*.133,.46,front?.27:-.35];
  const kneeP=cat?[side*.063,.14,front?.145:-.15]:[side*.137,.245,front?.245:-.25];
  const ankleP=cat?[side*.064,.037,front?.18:-.21]:[side*.138,.055,front?.28:-.36];
  const parent=front?root:pelvis,hip=bone((front?'fore':'hind')+side,parent,hipP),knee=bone('knee'+bones.length,hip,kneeP.map((v,i)=>v-hipP[i])),ankle=bone('ankle'+bones.length,knee,ankleP.map((v,i)=>v-kneeP[i]));
  const leg={hip,knee,ankle,front,side,hipY:hipP[1],hipZ:hipP[2],ankleY:ankleP[1],ankleZ:ankleP[2],restKnee:knee.position.clone(),restAnkle:ankle.position.clone(),a:knee.position.length(),b:ankle.position.length()};legs.push(leg);
  // One continuous tapered limb, with volume at the shoulder/haunch and finer
  // wrists/hocks. Smoothly blended bone weights retain uninterrupted contours.
  const points=[new THREE.Vector3(...hipP),new THREE.Vector3(...kneeP),new THREE.Vector3(...ankleP)];
  const radii=cat?(front?[.036,.024,.018]:[.058,.031,.019]):(front?[.066,.041,.027]:[.103,.057,.027]);
  const rings=[{p:points[0].clone().add(new THREE.Vector3(0,cat?.04:.075,0)),r:radii[0]*.42,segment:0,t:0}];
  for(let segment=0;segment<2;segment++)for(let q=0;q<4;q++){
   const t=q/4,p=points[segment].clone().lerp(points[segment+1],t),r=radii[segment]*(1-t)+radii[segment+1]*t;
   rings.push({p,r,segment,t});
  }rings.push({p:points[2],r:radii[2],segment:1,t:1});
  const start=positions.length/3,segs=software?8:12;
  rings.forEach(({p,r,segment,t})=>{const tangent=points[segment+1].clone().sub(points[segment]).normalize(),u=new THREE.Vector3(1,0,0),v=new THREE.Vector3().crossVectors(tangent,u).normalize();for(let j=0;j<segs;j++){const a=j*TAU/segs,pos=p.clone().addScaledVector(u,Math.cos(a)*r).addScaledVector(v,Math.sin(a)*r*.85),joint=segment===0?hip:knee,next=segment===0?knee:ankle,w=clamp((t-.55)/.45,0,1)*.75;vertex(pos.toArray(),{[boneId(joint)]:1-w,[boneId(next)]:w},'body');}});
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<segs;j++)quad(start+i*segs+j,start+i*segs+(j+1)%segs,start+(i+1)*segs+(j+1)%segs,start+(i+1)*segs+j);
  const pawL=cat?.065:.115,pawW=cat?.029:.047,pawH=cat?.024:.038;
  loft([[-0+ankleP[0],pawH,ankleP[2]-.022,pawW*.6,pawH*.65],[ankleP[0],pawH,ankleP[2],pawW,pawH],[ankleP[0],pawH*.85,ankleP[2]+pawL*.55,pawW*.95,pawH*.8],[ankleP[0],pawH*.75,ankleP[2]+pawL*.7,pawW*.40,pawH*.6]],software?8:12,()=>({[boneId(ankle)]:1}),'paw');
 }
 const tailBones=[],tailPoints=cat?[[0,.258,-.29],[0,.30,-.37],[.008,.37,-.43],[.018,.45,-.45],[.026,.49,-.43],[.032,.49,-.39]]:[[0,.48,-.48],[0,.47,-.61],[0,.44,-.75],[0,.40,-.89],[0,.39,-1.0]];
 tailPoints.forEach((p,i)=>tailBones.push(bone('tail'+i,i?tailBones[i-1]:pelvis,i?p.map((v,k)=>v-tailPoints[i-1][k]):p)));
 const ts=positions.length/3,tseg=software?8:12;
 tailPoints.forEach((p,i)=>{const tangent=new THREE.Vector3(...(tailPoints[Math.min(i+1,tailPoints.length-1)].map((v,k)=>v-tailPoints[Math.max(i-1,0)][k]))).normalize(),u=new THREE.Vector3(1,0,0),v=new THREE.Vector3().crossVectors(tangent,u).normalize(),r=(cat?.024:.055)*(1-i/(tailPoints.length-1)*.84);for(let j=0;j<tseg;j++){const a=j*TAU/tseg,q=new THREE.Vector3(...p).addScaledVector(u,r*Math.cos(a)).addScaledVector(v,r*Math.sin(a)*(cat?1:1.45));vertex(q.toArray(),{[boneId(tailBones[i])]:1},'tail');}});
 for(let i=0;i<tailPoints.length-1;i++)for(let j=0;j<tseg;j++)quad(ts+i*tseg+j,ts+i*tseg+(j+1)%tseg,ts+(i+1)*tseg+(j+1)%tseg,ts+(i+1)*tseg+j);
 // Fine tapered fur follows the retriever chest, hindquarters and tail.
 // These are low relief geometry on the coat, not flat image sprites.
 if(!cat){
  function feather(baseP,tipP,width,weights){const a=vertex([baseP[0]-width,baseP[1],baseP[2]],weights,'body'),b=vertex([baseP[0]+width,baseP[1],baseP[2]],weights,'body'),c=vertex(tipP,weights,'body'),d=vertex([baseP[0],baseP[1]+.007,baseP[2]+.008],weights,'body');indices.push(a,b,d,b,c,d,c,a,d);}
  for(const side of [-1,1])for(let i=0;i<7;i++){const z=.14+i*.038;feather([side*(.12-.022*Math.sin(i)),.38+i*.016,z],[side*(.15-.018*Math.sin(i)),.31+i*.012,z+.02],.012,{[boneId(root)]:.6,[boneId(head)]:.4});}
  for(let i=1;i<tailPoints.length-1;i++){const q=tailPoints[i];for(const side of [-1,1])feather([q[0]+side*.025,q[1]-.025,q[2]],[q[0]+side*.04,q[1]-.085,q[2]-.06],.017,{[boneId(tailBones[i])]:1});}
 }
 // Short muzzle/lip curves and feline whiskers are surface details, not UI lines.
 function strand(a,b,r,color){const start=positions.length/3,A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),dir=B.clone().sub(A).normalize(),u=new THREE.Vector3(0,1,0).cross(dir).normalize(),v=dir.clone().cross(u);for(const p of [A,B])for(let i=0;i<4;i++){const th=i*TAU/4;vertex(p.clone().addScaledVector(u,Math.cos(th)*r).addScaledVector(v,Math.sin(th)*r).toArray(),{[boneId(head)]:1},color);}for(let i=0;i<4;i++)quad(start+i,start+(i+1)%4,start+4+(i+1)%4,start+4+i);}
 for(const side of [-1,1]){
  if(cat){strand([0,.323,.388],[side*.031,.318,.37],.0015,'mouth');for(let k=0;k<3;k++)strand([side*.025,.33-k*.005,.371],[side*(.102+k*.007),.334-k*.012,.342-k*.005],.0007,'whisker');}
  else strand([side*.026,.631,.706],[side*.065,.629,.631],.002,'mouth');
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));geometry.setIndex(indices);geometry.computeVertexNormals();
 const material=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.95,metalness:0,side:THREE.DoubleSide});
 const skeleton=new THREE.Skeleton(bones);rig.updateMatrixWorld(true);skeleton.calculateInverses();
 const mesh=software?new THREE.Mesh(geometry,material):new THREE.SkinnedMesh(geometry,material);rig.add(mesh);if(!software)mesh.bind(skeleton);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
 const ball=new THREE.Mesh(new THREE.SphereGeometry(cat?.022:.057,software?9:16,software?6:10),new THREE.MeshStandardMaterial({color:0xb9bf64,roughness:.98}));
 ball.name='Cooper’s tennis ball';ball.position.set(0,cat?-.003:.005,cat?.048:.118);jaw.add(ball);ball.visible=false;
 const original=new Float32Array(positions),tmp=new THREE.Vector3(),out=new THREE.Vector3(),inverse=new THREE.Matrix4(),transforms=bones.map(()=>new THREE.Matrix4());
 function update(){if(!software)return;g.updateMatrixWorld(true);inverse.copy(rig.matrixWorld).invert();bones.forEach((b,i)=>transforms[i].multiplyMatrices(inverse,b.matrixWorld).multiply(skeleton.boneInverses[i]));const p=geometry.attributes.position;for(let i=0;i<p.count;i++){out.set(0,0,0);for(let j=0;j<4;j++){const k=i*4+j,w=skinWeights[k];if(w){tmp.fromArray(original,i*3).applyMatrix4(transforms[skinIndices[k]]);out.addScaledVector(tmp,w);}}p.setXYZ(i,out.x,out.y,out.z);}p.needsUpdate=true;geometry.computeVertexNormals();}
 return {g,rig,root,pelvis,head,jaw,ears,props:{ball},headPoint,legs,tail:tailBones[0],tailBones,mesh,skeleton,update,human:false,cat,naturalHeight:cat?.48:.85,triangleCount:indices.length/3};
}

export function posePet(c,time,dt){
 const m=c.model;if(!m||m.human)return;
 const delta=clamp(dt,0,.12),wantsWalk=c.state==='walking',walking=wantsWalk&&(c.speedNow||0)>.04,job=c.activityPose||c.job||'idle';
 const state=m.motion||(m.motion={phase:(c.cell||0)*.6,lastX:m.g.position.x,lastZ:m.g.position.z,walk:0,rest:0,sit:0,bow:0,run:0,alert:0});
 const travel=Math.hypot(m.g.position.x-state.lastX,m.g.position.z-state.lastZ);state.lastX=m.g.position.x;state.lastZ=m.g.position.z;
 const running=walking&&(c.gait==='run'||(c.speedNow||0)>(c.speed||3.4)*1.36),trotting=walking&&(running||c.gait==='trot'||(c.speedNow||0)>(c.speed||3.4)*.95);
 state.run=damp(state.run,running?1:0,8,delta);
 const stride=(m.cat?.074:.14)*(1+state.run*.65),scale=m.g.scale.y||1;
 if(walking&&travel<scale*.8)state.phase=(state.phase+travel/(4*stride*scale)*TAU)%TAU;
 state.walk=damp(state.walk,walking?1:0,10,delta);
 const resting=!wantsWalk&&['rest','sleep','relax','lie-rest'].includes(job),sitting=!wantsWalk&&['sit','watch','wait'].includes(job),bowing=!wantsWalk&&['play-bow','stretch'].includes(job),alert=!wantsWalk&&['greet','alert','fetch'].includes(job);
 state.rest=damp(state.rest,resting?1:0,6,delta);state.sit=damp(state.sit,sitting?1:0,6,delta);state.bow=damp(state.bow,bowing?1:0,7,delta);state.alert=damp(state.alert,alert?1:0,8,delta);
 const phase=state.phase,bob=(m.cat?.003:.009)*Math.cos(phase*2)*state.walk;
 const eager=!wantsWalk&&job==='greet',sniff=!wantsWalk&&['eat','sniff','feed','drink'].includes(job),drink=job==='drink';
 const bodyPitch=(m.cat?.14:.21)*state.bow-.022*state.run*state.walk;
 m.rig.rotation.x=damp(m.rig.rotation.x,bodyPitch,9,delta);
 m.rig.rotation.z=damp(m.rig.rotation.z,eager?.025*Math.sin(time*5.6):.007*Math.sin(phase)*state.walk,9,delta);
 m.rig.position.y=-(m.cat?.10:.145)*state.rest-(m.cat?.024:.022)*state.walk+bob-(m.cat?.055:.085)*state.bow+state.run*.018*Math.sin(phase*2);
 m.rig.scale.y=1+(m.cat?.003:.0045)*Math.sin(time*(m.cat?1.8:1.2))*(1-state.walk);
 m.pelvis.position.y=-(m.cat?.08:.18)*state.sit+(m.cat?.065:.12)*state.bow;
 m.pelvis.position.z=(m.cat?.03:.06)*state.sit;
 m.legs.forEach((l,i)=>{
  // Walking uses four separate contacts. Trotting uses diagonal pairs; a
  // quicker run shifts toward a light bound and a longer, distance-driven step.
  const offsets=running?[0,.10,.54,.64]:trotting?[0,.5,.5,0]:[0,.5,.75,.25];
  const cycle=((phase/TAU+offsets[i])%1+1)%1,stance=running?.47:trotting?.60:m.cat?.73:.70;
  let footZ,lift=0;
  if(cycle<stance)footZ=stride*(1-2*cycle/stance);
  else{const t=(cycle-stance)/(1-stance);footZ=stride*(-1+2*smooth(t));lift=(m.cat?.028:.052)*(1+state.run*.6)*Math.sin(Math.PI*t);}
  if(eager&&l.front)lift+=.016*Math.max(0,Math.sin(time*5.6+i*Math.PI));
  const pelvisDrop=l.front?0:m.pelvis.position.y,pelvisZ=l.front?0:m.pelvis.position.z;
  const groomingPaw=m.cat&&!wantsWalk&&job==='groom'&&l.front&&l.side<0;
  const worldY=l.ankleY+lift*state.walk+(eager?lift:0)+(groomingPaw?.13+.008*Math.sin(time*3.1):0),worldZ=l.ankleZ+footZ*state.walk+(l.front?.055:.045)*state.rest+(l.front?0:.065)*state.sit+(l.front?.055:-.025)*state.bow+(groomingPaw?.06:0);
  const cp=Math.cos(m.rig.rotation.x),sp=Math.sin(m.rig.rotation.x);
  const targetY=cp*(worldY-m.rig.position.y)+sp*worldZ-l.hipY-pelvisDrop;
  const targetZ=-sp*(worldY-m.rig.position.y)+cp*worldZ-l.hipZ-pelvisZ;
  const distance=clamp(Math.hypot(targetY,targetZ),Math.abs(l.a-l.b)+.002,l.a+l.b-.00005),theta=Math.atan2(targetZ,-targetY),bend=Math.acos(clamp((l.a*l.a+distance*distance-l.b*l.b)/(2*l.a*distance),-1,1)),kneeBend=Math.PI-Math.acos(clamp((l.a*l.a+l.b*l.b-distance*distance)/(2*l.a*l.b),-1,1));
  const restUpper=Math.atan2(l.restKnee.z,-l.restKnee.y),restLower=Math.atan2(l.restAnkle.z,-l.restAnkle.y),sign=l.front?-1:1;
  const upper=restUpper-theta-sign*bend,lower=restLower-restUpper+sign*kneeBend;
  l.hip.rotation.x=damp(l.hip.rotation.x,upper,20,delta);l.knee.rotation.x=damp(l.knee.rotation.x,lower,20,delta);l.ankle.rotation.x=damp(l.ankle.rotation.x,-upper-lower-m.rig.rotation.x,20,delta);
 });
 const grooming=!wantsWalk&&m.cat&&job==='groom';
 const sniffNod=sniff?.025*Math.sin(time*(drink?8:3.2)):0;
 const headTilt=sniff?(m.cat?.94:1.05)+sniffNod:grooming?.64+Math.sin(time*3.1)*.08:state.rest*.13+state.bow*.16-state.alert*.07;
 m.head.rotation.x=damp(m.head.rotation.x,headTilt,7,delta);
 m.head.position.y=damp(m.head.position.y,m.headPoint[1]-(sniff?(m.cat?.055:.11):0),7,delta);
 m.head.rotation.y=damp(m.head.rotation.y,grooming?.62:sniff?.035*Math.sin(time*2.1):walking?.03*Math.sin(phase):(.07+.09*state.alert)*Math.sin(time*(eager?1.6:.6)+(c.cell||0)),5,delta);
 m.head.rotation.z=damp(m.head.rotation.z,eager?.065*Math.sin(time*2.3):0,6,delta);
 const pant=!m.cat&&!sniff&&!resting&&(walking||eager||job==='play-bow');
 m.jaw.rotation.x=damp(m.jaw.rotation.x,job==='fetch'?.16:pant?.11+.025*Math.sin(time*6):drink?.08+.03*Math.sin(time*9):0,9,delta);
 m.ears.forEach((ear,i)=>{const side=i===0?-1:1;ear.rotation.x=damp(ear.rotation.x,m.cat?-.12*state.alert:.08*Math.sin(phase*2+i)*state.walk+.08*state.run,10,delta);ear.rotation.z=damp(ear.rotation.z,side*(m.cat?-.14*state.alert:.045*Math.sin(time*2.1+i)*state.alert+.10*Math.sin(phase+i)*state.walk),10,delta);});
 const wag=m.cat?.055:eager||job==='play-bow'?.42:alert?.28:sniff?.08:.13;
 m.tailBones.forEach((tail,i)=>{tail.rotation.y=wag*Math.sin(time*(m.cat?.9:eager||job==='play-bow'?7.2:walking?4.5:2.7)-i*.6)*(1-state.rest*.8);tail.rotation.x=(m.cat?.035:.025)*Math.sin(time*.9+i*.5)-state.rest*(i===0?(m.cat?1.25:.35):(m.cat?.06:.015))+state.bow*(i===0?.18:.035);});
 if(m.props?.ball)m.props.ball.visible=!m.cat&&job==='fetch';
 return {walking,running,trotting,resting,sitting,bowing,alert,activity:job};
}

// Let a seated/resting/play-bowing animal get its feet underneath it first.
export function canMovePet(c){const s=c.model?.motion;return !s||(s.rest<.08&&s.sit<.08&&(s.bow||0)<.08);}
