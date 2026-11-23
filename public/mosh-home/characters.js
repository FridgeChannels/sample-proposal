// Anatomical MakeHuman-derived meshes (CC0), clothed, rest-posed and reduced offline.
// These are deforming meshes, not image billboards or primitive body assemblies.
import {loadCharacterMesh,loadCastPack} from './human-assets.js';
import {createHandheldMagnet} from './brand-assets.js';
const modelData=Array.from({length:4},()=>({})),pending=new Map();
export async function loadHumanModels({software=false}={}){
 const key=software?'low':'full';
 if(modelData.every(d=>d[key]))return;
 if(pending.has(key))return pending.get(key);
 const individual=()=>Promise.all([0,1,2,3].map(i=>loadCharacterMesh(i,{software})));
 const canUnpack=typeof DecompressionStream!=='undefined'&&/^https?:$/.test(globalThis.location?.protocol||'');
 const request=(canUnpack?loadCastPack(software).catch(individual):individual()).then(results=>{
  // Commit the cast together. No caller can construct a partial family.
  results.forEach((result,i)=>{if(result)modelData[i][key]=result.data;});
 }).finally(()=>pending.delete(key));
 pending.set(key,request);return request;
}
const boneNames=['body','head','armL','foreL','armR','foreR','thighL','shinL','footL','thighR','shinR','footR','handL','handR','chest'];

// Per-person albedo under daylight. The eye sockets in the actual mesh locate
// the brow, lips and jaw on both resolutions without an extra texture download.
const complexions=[0xd3bca7,0xc0a78f,0xd4baa5,0xcebaa4];
function addFaceTones(THREE,geometry,d,index){
 if(d.albedo){
  const bytes=Uint8Array.from(atob(d.albedo),value=>value.charCodeAt(0));
  geometry.setAttribute('color',new THREE.BufferAttribute(bytes,3,true));
  return;
 }
 const eyes=d.groups.find(([, ,material])=>material===5);
 if(!eyes)return;
 let low=Infinity,high=-Infinity,front=-Infinity;
 const [start,count]=eyes;
 for(let n=start;n<start+count;n++){
  const v=d.indices[n]*3;
  low=Math.min(low,d.positions[v+1]);high=Math.max(high,d.positions[v+1]);
  front=Math.max(front,d.positions[v+2]);
 }
 const eyeY=(low+high)/2,colors=new Uint8Array(d.positions.length).fill(255);
 for(let v=0;v<colors.length;v+=3){
  const x=Math.abs(d.positions[v]),y=d.positions[v+1]-eyeY,z=d.positions[v+2]-front;
  if(y<-.18||y>.09||z<-.10)continue;
  const fade=Math.min(1,Math.max(0,(z+.10)/.07));
  const soft=(dx,dy)=>Math.exp(-dx*dx-dy*dy);
  const brow=soft((x-.031)/.025,(y-.022+.10*Math.abs(x-.031))/.009);
  const lip=soft(x/.030,(y+.056)/.006);
  const jaw=index===1?.12*soft((x-.045)/.045,(y+.084)/.031):0;
  const shade=fade*(brow*[.25,.40,.30,.28][index]+jaw);
  colors[v]=255*(1-shade-.06*lip*fade);
  colors[v+1]=255*(1-shade-.18*lip*fade);
  colors[v+2]=255*(1-shade-.15*lip*fade);
 }
 geometry.setAttribute('color',new THREE.BufferAttribute(colors,3,true));
}

export function createHuman(THREE,index,{software=false}={}) {
 // The small delivery canvas can choose a different renderer from the house.
 // Reuse an already loaded anatomical LOD rather than losing its driver.
 const d=modelData[index][software?'low':'full']||modelData[index][software?'full':'low'];
 if(!d)throw new Error('Call loadHumanModels for the selected renderer before creating the family');
 const g=new THREE.Group(),rig=new THREE.Group();g.add(rig);
 const bones=boneNames.map(name=>{const bone=new THREE.Bone();bone.name=name;return bone;});
 const byName=Object.fromEntries(bones.map(b=>[b.name,b]));rig.add(byName.body);
 function attach(name,parent,position){const bone=byName[name];parent.add(bone);bone.position.fromArray(position);return bone;}
 function difference(a,b){return d.joints[a].map((v,i)=>v-d.joints[b][i]);}
 const chest=attach('chest',byName.body,d.joints.chest||[0,1.08,0]);
 // Store shoulder and grip coordinates in the original rest-body frame.
 const shoulders=new THREE.Group();shoulders.position.copy(chest.position).negate();chest.add(shoulders);
 const upperParent=d.joints.chest?shoulders:byName.body;
 const head=attach('head',upperParent,d.joints.head);
 const arms=[],hands=[];
 // Existing director uses index 0 for the left side on screen (negative local X).
 const sides=d.joints.armL[0]<0?['L','R']:['R','L'];
 for(const side of sides){
   const shoulder=attach('arm'+side,upperParent,d.joints['arm'+side]);
   const elbow=attach('fore'+side,shoulder,difference('fore'+side,'arm'+side));
   const wrist=attach('hand'+side,elbow,difference('hand'+side,'fore'+side));
   const hand=new THREE.Group();hand.name='Grip '+side;hand.position.set(0,-.055,.018);wrist.add(hand);hands.push(hand);
   const sideSign=Math.sign(shoulder.position.x),upperLength=elbow.position.length(),lowerLength=wrist.position.length();
   const restUpper=elbow.position.clone().normalize(),restLower=wrist.position.clone().normalize();
   const target=new THREE.Vector3(),axis=new THREE.Vector3(),pole=new THREE.Vector3(),elbowPoint=new THREE.Vector3(),upper=new THREE.Vector3(),lower=new THREE.Vector3(),offset=new THREE.Vector3();
   const chestInverse=new THREE.Quaternion(),shoulderQ=new THREE.Quaternion(),lowerQ=new THREE.Quaternion(),elbowQ=new THREE.Quaternion(),wristQ=new THREE.Quaternion(),orientationQ=new THREE.Quaternion(),orientationEuler=new THREE.Euler();
   // Solve in the body's coordinates, with a down/out elbow pole. A grip target
   // controls the actual palm position; adding shoulder/elbow Euler angles did
   // not guarantee that two hands could meet the same phone or work surface.
   function poseGrip(point,{rotation=[0,0,0],elbowOut=.55,rate=14}={},dt=1/60,snap=false){
    orientationQ.setFromEuler(orientationEuler.set(...rotation));
    target.fromArray(point);
    if(d.joints.chest){
     chestInverse.copy(chest.quaternion).invert();
     target.sub(chest.position).applyQuaternion(chestInverse).add(chest.position);
     orientationQ.premultiply(chestInverse);
    }
    target.sub(offset.copy(hand.position).applyQuaternion(orientationQ));
    axis.copy(target).sub(shoulder.position);const distance=Math.max(.0001,axis.length());axis.multiplyScalar(1/distance);
    const reach=Math.max(Math.abs(upperLength-lowerLength)+.002,Math.min(upperLength+lowerLength-.002,distance));
    target.copy(shoulder.position).addScaledVector(axis,reach);
    const along=(upperLength*upperLength-lowerLength*lowerLength+reach*reach)/(2*reach),bend=Math.sqrt(Math.max(0,upperLength*upperLength-along*along));
    pole.set(sideSign*elbowOut,-1,-.16).addScaledVector(axis,-pole.dot(axis)).normalize();
    elbowPoint.copy(shoulder.position).addScaledVector(axis,along).addScaledVector(pole,bend);
    upper.copy(elbowPoint).sub(shoulder.position).normalize();lower.copy(target).sub(elbowPoint).normalize();
    shoulderQ.setFromUnitVectors(restUpper,upper);lowerQ.setFromUnitVectors(restLower,lower);
    elbowQ.copy(shoulderQ).invert().multiply(lowerQ);wristQ.copy(lowerQ).invert().multiply(orientationQ);
    const blend=snap?1:1-Math.exp(-rate*dt);shoulder.quaternion.slerp(shoulderQ,blend);elbow.quaternion.slerp(elbowQ,blend);wrist.quaternion.slerp(wristQ,blend);
   }
   arms.push({shoulder,elbow,wrist,hand,sideSign,length:upperLength,forearmLength:lowerLength,poseGrip});
 }
 const legs=[];
 for(const side of sides){
   const hip=new THREE.Group();hip.position.fromArray(d.joints['thigh'+side]);byName.body.add(hip);
   const thigh=attach('thigh'+side,hip,[0,0,0]);
   const knee=attach('shin'+side,thigh,difference('shin'+side,'thigh'+side));
   const foot=attach('foot'+side,knee,difference('foot'+side,'shin'+side));
   legs.push({hip,thigh,knee,foot,thighLength:knee.position.length(),shinLength:foot.position.length(),restKnee:knee.position.clone(),restFoot:foot.position.clone(),ankleHeight:d.joints['foot'+side][1],hipHeight:d.joints['thigh'+side][1]});
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(d.positions,3));
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(d.normals,3));
 geometry.setIndex(d.indices);
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(d.skinIndices,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(d.skinWeights,4));
 d.groups.forEach(([start,count,materialIndex])=>geometry.addGroup(start,count,materialIndex));
 addFaceTones(THREE,geometry,d,index);
 const materials=d.materials.map((rgba,i)=>{
   const color=new THREE.Color().setRGB(rgba[0],rgba[1],rgba[2],THREE.SRGBColorSpace);
   if(i===0)color.setHex(complexions[index]);
   return new THREE.MeshStandardMaterial({color,vertexColors:i===0||[1,4,11].includes(i)&&!!d.albedo,roughness:i===0?.77:i===4?.72:.92,metalness:0,side:THREE.DoubleSide});
 });
 const skeleton=new THREE.Skeleton(bones);
 rig.updateMatrixWorld(true);
 skeleton.calculateInverses();
 // Both renderers receive the same fully deformed anatomical triangle mesh.
 // This keeps WebGL's lighting and high detail without relying on a separate
 // vertex-texture skinning shader, whose failure can hide people but not pets.
 const mesh=new THREE.Mesh(geometry,materials);rig.add(mesh);
 geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
 geometry.attributes.normal.setUsage(THREE.DynamicDrawUsage);
 mesh.name='Bennett anatomical character';mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
 // Tangible task objects attach to the deforming arm, not to a screen coordinate.
 const material=(color,roughness=.7)=>new THREE.MeshStandardMaterial({color,roughness});
 const ceramic=material(0xe9dfcb,.38),dark=material(0x41473d,.75),steel=material(0xaaaa9a,.28);
 function mug(parent){const group=new THREE.Group();const shell=new THREE.Mesh(new THREE.CylinderGeometry(.036,.030,.075,software?10:20,1,true),ceramic);group.add(shell);const coffee=new THREE.Mesh(new THREE.CircleGeometry(.031,software?10:20),material(0x4a2f1b,.5));coffee.rotation.x=-Math.PI/2;coffee.position.y=.032;group.add(coffee);const handle=new THREE.Mesh(new THREE.TorusGeometry(.023,.006,software?5:8,software?9:14),ceramic);handle.position.set(.041,0,0);group.add(handle);parent.add(group);group.visible=false;return group;}
 const cup=mug(hands[1]),leftCup=mug(hands[0]);
 // Five cross sections describe the spine and curved page blocks in one mesh.
 const paper=material(0xf0e5cb,.94);
 const book=new THREE.Group();book.position.set(.062,0,.03);hands[0].add(book);book.visible=false;
 const profile=[[-.093,.017],[-.053,.022],[0,.004],[.053,.022],[.093,.017]];
 const points=[],faces=[];
 for(const [x,y] of profile)points.push(x,y,-.059,x,y,.059,x,y-.012,-.059,x,y-.012,.059);
 for(let i=0;i<profile.length-1;i++){
  const j=4*i;
  faces.push(j,j+1,j+4,j+1,j+5,j+4,j+1,j+3,j+7,j+1,j+7,j+5,j,j+4,j+6,j,j+6,j+2,j+2,j+6,j+3,j+6,j+7,j+3);
 }
 faces.push(0,2,1,1,2,3,16,17,18,17,19,18);
 const pageBlock=new THREE.BufferGeometry();pageBlock.setAttribute('position',new THREE.Float32BufferAttribute(points,3));pageBlock.setIndex(faces);pageBlock.computeVertexNormals();
 book.add(new THREE.Mesh(pageBlock,paper));
 const leaf=new THREE.PlaneGeometry(.088,.111,2,1);leaf.rotateX(-Math.PI/2);leaf.translate(.044,0,0);
 const leafSurface=leaf.attributes.position;
 for(let i=0;i<leafSurface.count;i++)leafSurface.setY(i,.002+.011*Math.sin(Math.PI*leafSurface.getX(i)/.088));
 leaf.computeVertexNormals();const leafPaper=material(0xf8efdd,.94);leafPaper.side=THREE.DoubleSide;
 const bookPage=new THREE.Mesh(leaf,leafPaper);bookPage.position.y=.011;book.add(bookPage);bookPage.visible=false;
 // A palm-sized portrait magnet: food art faces outward, the pink reverse
 // faces the reader. Its lower left edge rests in the supporting hand.
 const card=createHandheldMagnet(THREE,{software});
 card.position.set(.025,.047,.027);hands[0].add(card);card.visible=false;
 const remote=new THREE.Mesh(new THREE.BoxGeometry(.032,.018,.105),dark);hands[1].add(remote);remote.visible=false;
 const phone=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(.063,.115,.009),dark);body.position.set(0,.025,.018);phone.add(body);const screen=new THREE.Mesh(new THREE.BoxGeometry(.054,.097,.001),material(0xd2dccd,.25));screen.position.set(0,.025,.0235);phone.add(screen);hands[0].add(phone);phone.visible=false;
 const milk=new THREE.Group();const carton=new THREE.Mesh(new THREE.BoxGeometry(.065,.13,.065),material(0xf3eee0,.8));milk.add(carton);const blue=new THREE.Mesh(new THREE.BoxGeometry(.066,.029,.066),material(0x7898af,.85));blue.position.y=.015;milk.add(blue);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.009,8),material(0xe8e5dc));cap.position.set(.015,.071,0);milk.add(cap);hands[1].add(milk);milk.visible=false;
 const bowl=new THREE.Group();const bowlBody=new THREE.Mesh(new THREE.SphereGeometry(.065,software?10:18,software?6:10,0,Math.PI*2,Math.PI/2,Math.PI/2),ceramic);bowlBody.scale.y=.62;bowl.add(bowlBody);const food=new THREE.Mesh(new THREE.CircleGeometry(.056,software?10:18),material(0xa78652,.9));food.rotation.x=-Math.PI/2;food.position.y=-.003;bowl.add(food);hands[0].add(bowl);bowl.visible=false;
 const spoon=new THREE.Group();const stem=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,.115,6),steel);stem.rotation.x=Math.PI/2;stem.position.z=.035;spoon.add(stem);const scoop=new THREE.Mesh(new THREE.SphereGeometry(.014,8,5),steel);scoop.scale.set(.7,.2,1.4);scoop.position.z=.098;spoon.add(scoop);hands[1].add(spoon);spoon.visible=false;
 const restPosition=new Float32Array(d.positions),restNormal=new Float32Array(d.normals);
 const influences=new Uint8Array(d.skinIndices),weights=new Float32Array(d.skinWeights);
 const inverseRig=new THREE.Matrix4(),transforms=bones.map(()=>new THREE.Matrix4());
 function update(){
   g.updateMatrixWorld(true);inverseRig.copy(rig.matrixWorld).invert();
   bones.forEach((bone,i)=>transforms[i].multiplyMatrices(inverseRig,bone.matrixWorld).multiply(skeleton.boneInverses[i]));
   // Joint transforms are rigid. Transform the rest normals with the joint rotations
   // in the same pass, avoiding a second walk of every triangle on every frame.
   const position=geometry.attributes.position,normal=geometry.attributes.normal;
   for(let v=0;v<position.count;v++){
     const p=v*3,start=v*4;
     const x=restPosition[p],y=restPosition[p+1],z=restPosition[p+2];
     const nx=restNormal[p],ny=restNormal[p+1],nz=restNormal[p+2];
     // Most vertices belong entirely to one bone (hair, shoes, shirt and
     // limb interiors). They need one rigid transform and no weight blending.
     if(weights[start]===1){
       const m=transforms[influences[start]].elements;
       position.setXYZ(v,m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]);
       normal.setXYZ(v,m[0]*nx+m[4]*ny+m[8]*nz,m[1]*nx+m[5]*ny+m[9]*nz,m[2]*nx+m[6]*ny+m[10]*nz);
       continue;
     }
     let px=0,py=0,pz=0,dx=0,dy=0,dz=0;
     for(let k=start;k<start+4;k++){
       const w=weights[k];if(!w)break;
       const m=transforms[influences[k]].elements;
       px+=w*(m[0]*x+m[4]*y+m[8]*z+m[12]);py+=w*(m[1]*x+m[5]*y+m[9]*z+m[13]);pz+=w*(m[2]*x+m[6]*y+m[10]*z+m[14]);
       dx+=w*(m[0]*nx+m[4]*ny+m[8]*nz);dy+=w*(m[1]*nx+m[5]*ny+m[9]*nz);dz+=w*(m[2]*nx+m[6]*ny+m[10]*nz);
     }
     position.setXYZ(v,px,py,pz);normal.setXYZ(v,dx,dy,dz);
   }
   position.needsUpdate=normal.needsUpdate=true;
 }
 return {g,rig,head,chest:d.joints.chest?chest:null,arms,hands,handAnchors:hands,legs,mesh,skeleton,bookPage,human:true,props:{cup,leftCup,book,card,remote,phone,milk,bowl,spoon},update,
   naturalHeight:d.height,hipHeight:(d.joints.thighL[1]+d.joints.thighR[1])/2,
   shoulderHeight:(d.joints.armL[1]+d.joints.armR[1])/2,
   thighLength:legs[0].thighLength,shinLength:legs[0].shinLength,
   triangleCount:d.indices.length/3};
}
