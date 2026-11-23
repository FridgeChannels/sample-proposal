import {createParcel} from './parcel-model.js';
import {BRAND_ASSETS} from './brand-assets.js';
import {createFrenchDoorFridge} from './french-door-fridge.js';

// Model dimensions are metres; the retained house camera uses a 2.4-unit adult.
// Every tabletop, carried, and doorstep product derives from this same scale.
export const HOUSE_UNITS_PER_METRE=4/3;
export const PHYSICAL_PROP_DIMENSIONS=Object.freeze({
 refrigerator:{width:.9,height:1.8},
 carton:{width:.30,height:.15,depth:.22},
 magnet:{width:.07,height:.13,depth:.002},
 bar:{width:.125,height:.020,depth:.042}
});
export const PRODUCT_PLACEMENT=Object.freeze({
 island:[53.7,34.45],counterHeight:1.35,
 doorstep:[48,89],magnet:[41.65,25.6],magnetCenterHeight:1.72,
 dailyBar:[54.55,34.8],
 // The west edge is reachable from the existing prep station. These are
 // tabletop pixels, not the actor's floor mark or a floating HUD anchor.
 lunchCarton:[45.95,34.35],lunchBag:[46.1,35.65],lunchPacket:[45.75,34.95],
 lunchFacing:[46.0,39.8],lunchStation:'prep'
});
const metres=value=>value*HOUSE_UNITS_PER_METRE;
const VERTICAL_IMAGE_PERCENT=3.787;

/** Products occupy real surfaces and use the scene's furniture depth buffer. */
export function createHouseholdProductProps(THREE,scene,{software=false,world}={}){
 if(typeof world!=='function')throw new TypeError('Product props require the floor projection helper');
 const root=new THREE.Group();root.name='Life-size MOSH products';scene.add(root);
 const resources=new Set(),textures=new Set(),pendingImages=[];
 let disposed=false;
 function material(color,extra={}){const m=new THREE.MeshStandardMaterial({color,roughness:.88,metalness:0,...extra});resources.add(m);return m;}
 function mesh(parent,geometry,m,position=[0,0,0]){resources.add(geometry);const object=new THREE.Mesh(geometry,m);object.position.set(...position);object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;}
 const box=(parent,m,w,h,d,position)=>mesh(parent,new THREE.BoxGeometry(w,h,d),m,position);
 const kraft=material(0xbd9566),edge=material(0xa88252),pink=material(0xf2b4ce),purple=material(0x681cab),dark=material(0x32261e),paper=material(0xe5d5b5);
 function anchor(object,point,height){object.position.copy(world(point[0],point[1]+height*VERTICAL_IMAGE_PERCENT));object.position.y=height;}
 function group(name){const g=new THREE.Group();g.name=name;root.add(g);return g;}
 function shadow(parent,w,d,y=0){
  // A thin contact patch sits on the same surface as the carton base. It does
  // not grow into a floating selection ring and is also depth tested on CPU.
  const mat=new THREE.MeshBasicMaterial({color:0x4d3b26,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide});resources.add(mat);
  const p=mesh(parent,new THREE.PlaneGeometry(w*1.04,d*1.04),mat,[.006,y+.001,.006]);p.rotation.x=-Math.PI/2;p.castShadow=false;return p;
 }
 function artwork(parent,url,w,h,position,rotation=[0,0,0],fallback=0xf2b4ce,grid=[12,8]){
  const geometry=new THREE.PlaneGeometry(w,h,software?grid[0]:1,software?grid[1]:1).toNonIndexed();
  const colors=new Float32Array(geometry.attributes.position.count*3),base=new THREE.Color(fallback);
  for(let i=0;i<colors.length;i+=3){colors[i]=base.r;colors[i+1]=base.g;colors[i+2]=base.b;}
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const mat=material(0xffffff,{vertexColors:software,side:THREE.DoubleSide,transparent:!software,alphaTest:software?0:.08,roughness:.84});
  if(!software)mat.color.setHex(fallback);
  const face=mesh(parent,geometry,mat,position);face.rotation.set(...rotation);face.castShadow=false;
  face.userData.artwork=url;
  face.userData.loadArtwork=()=>{
   if(typeof Image==='undefined'||!face.userData.loadArtwork)return;
   delete face.userData.loadArtwork;
   const img=new Image();pendingImages.push(img);
   img.onload=()=>{
    if(disposed)return;
    if(!software){const texture=new THREE.Texture(img);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;textures.add(texture);mat.map=texture;mat.color.setHex(0xffffff);mat.needsUpdate=true;return;}
    // The CPU renderer supports vertex color, not texture sampling. Bake a
    // small grid from the original artwork, never a screen-facing image.
    const canvas=document.createElement('canvas');canvas.width=grid[0];canvas.height=grid[1];const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.drawImage(img,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data,uv=geometry.attributes.uv,c=new THREE.Color();
    for(let i=0;i<uv.count;i++){
     const x=Math.min(grid[0]-1,Math.max(0,Math.floor(uv.getX(i)*grid[0]))),y=Math.min(grid[1]-1,Math.max(0,Math.floor((1-uv.getY(i))*grid[1]))),j=(y*grid[0]+x)*4;
     if(pixels[j+3]<80)c.copy(base);else c.setRGB(pixels[j]/255,pixels[j+1]/255,pixels[j+2]/255,THREE.SRGBColorSpace);
     geometry.attributes.color.setXYZ(i,c.r,c.g,c.b);
    }
    geometry.attributes.color.needsUpdate=true;
   };
   img.src=url;
  };
  return face;
 }
 function makeBar(parent,name='MOSH protein bar'){
  const g=new THREE.Group();g.name=name;parent.add(g);const d=PHYSICAL_PROP_DIMENSIONS.bar,w=metres(d.width),h=metres(d.height),depth=metres(d.depth);
  box(g,pink,w,h,depth,[0,h/2,0]);
  for(const x of [-1,1])box(g,pink,w*.045,h*.62,depth*.96,[x*w*.49,h*.34,0]);
  const face=artwork(g,BRAND_ASSETS.pouch,w,depth,[0,h+.0003,0],[-Math.PI/2,0,0],0xf2b4ce,[18,6]);
  g.userData.dimensions={width:w,height:h,depth};g.userData.metres=d;return g;
 }
 const d=PHYSICAL_PROP_DIMENSIONS.carton,w=metres(d.width),h=metres(d.height),depth=metres(d.depth);
 const parcelRoot=group('MOSH shipping carton on a real surface');
 const closed=createParcel(THREE,{software,size:{width:w,height:h,depth}});closed.position.y=h/2;parcelRoot.add(closed);
 const open=new THREE.Group();open.name='Open 30 cm MOSH carton';parcelRoot.add(open);
 const wall=.005;
 box(open,kraft,w,wall,depth,[0,wall/2,0]);
 box(open,kraft,w,h,wall,[0,h/2,depth/2-wall/2]);box(open,kraft,w,h,wall,[0,h/2,-depth/2+wall/2]);
 for(const side of [-1,1])box(open,kraft,wall,h,depth,[side*(w/2-wall/2),h/2,0]);
 box(open,paper,w*.94,.014,depth*.94,[0,.025,0]);
 // Lid and side flaps hinge at the rim; a flap raises the silhouette without
 // enlarging the box or detaching the base from the marble countertop.
 const lid=new THREE.Group();lid.position.set(0,h,-depth/2);open.add(lid);lid.rotation.x=-.25;
 box(lid,kraft,w,depth,.004,[0,depth/2,0]);
 box(lid,edge,w*.94,.003,.005,[0,.012,.003]);
 const flaps=[];
 for(const side of [-1,1]){
  const flap=new THREE.Group();flap.position.set(side*w/2,h,0);flap.rotation.z=-side*.25;open.add(flap);flaps.push(flap);
  box(flap,kraft,depth*.5,.004,depth,[side*depth*.25,0,0]);
 }
 const frontArt=artwork(open,new URL('./assets/mosh/logo.svg',import.meta.url).href,w*.55,h*.43,[0,h*.55,depth/2+.0004],[0,0,0],0x681cab,[18,6]);
 const bars=[];for(let row=0;row<3;row++)for(let column=0;column<2;column++){
  const bar=makeBar(open,'Individually wrapped MOSH bar');bar.position.set((column-.5)*w*.47,h*.66,(row-1)*depth*.27);bar.rotation.y=(row%2?.035:-.025);bars.push(bar);
 }
 const contactShadow=shadow(parcelRoot,w,depth);
 const magnet=group('7 × 13 cm HOMMIO refrigerator magnet');const md=PHYSICAL_PROP_DIMENSIONS.magnet,mw=metres(md.width),mh=metres(md.height),mt=metres(md.depth);
 box(magnet,dark,mw,mh,mt,[0,0,0]);
 const magnetFace=artwork(magnet,BRAND_ASSETS.magnet,mw,mh,[0,0,mt/2+.0001],[0,0,0],0xb0865e,[6,12]);
 anchor(magnet,PRODUCT_PLACEMENT.magnet,PRODUCT_PLACEMENT.magnetCenterHeight);
 magnet.userData.dimensions={width:mw,height:mh,depth:mt};magnet.userData.metres=md;
 const fridge=createFrenchDoorFridge(THREE,root,world,magnet,{software});
 const product=group('A single correctly sized MOSH bar');anchor(product,PRODUCT_PLACEMENT.dailyBar,PRODUCT_PLACEMENT.counterHeight+.006);
 const dailyBar=makeBar(product);dailyBar.rotation.y=-.13;const barShadow=shadow(product,metres(PHYSICAL_PROP_DIMENSIONS.bar.width),metres(PHYSICAL_PROP_DIMENSIONS.bar.depth));
 const lunch=group('Lunch packing on the west island edge');
 const lunchBox=new THREE.Group();lunchBox.name='Empty MOSH retail carton';lunch.add(lunchBox);
 anchor(lunchBox,PRODUCT_PLACEMENT.lunchCarton,PRODUCT_PLACEMENT.counterHeight+.004);
 const retailW=metres(.18),retailD=metres(.125),retailH=metres(.09),thin=.004;
 box(lunchBox,pink,retailW,thin,retailD,[0,thin/2,0]);
 box(lunchBox,paper,retailW*.94,.003,retailD*.94,[0,.005,0]);
 for(const side of [-1,1])box(lunchBox,pink,thin,retailH,retailD,[side*(retailW-thin)/2,retailH/2,0]);
 for(const side of [-1,1])box(lunchBox,pink,retailW,retailH,thin,[0,retailH/2,side*(retailD-thin)/2]);
 const retailLid=new THREE.Group();retailLid.position.set(0,retailH,-retailD/2);retailLid.rotation.x=-.28;lunchBox.add(retailLid);
 box(retailLid,pink,retailW,retailD,.004,[0,retailD/2,0]);
 artwork(lunchBox,new URL('./assets/mosh/logo.svg',import.meta.url).href,retailW*.80,retailH*.60,[0,retailH*.55,retailD/2+.001],[0,0,0],0x681cab,[12,4]);
 shadow(lunchBox,retailW,retailD);
 const bag=new THREE.Group();bag.name='Open canvas lunch bag';lunch.add(bag);anchor(bag,PRODUCT_PLACEMENT.lunchBag,PRODUCT_PLACEMENT.counterHeight+.004);
 const canvas=material(0x9aa88e),lining=material(0xd6d4bc),food=material(0xc7b27c),red=material(0xb6503f);
 const bw=metres(.21),bd=metres(.16),bh=metres(.21);
 box(bag,lining,bw,.012,bd,[0,.006,0]);
 for(const side of [-1,1])box(bag,canvas,.012,bh,bd,[side*(bw-.012)/2,bh/2,0]);
 for(const side of [-1,1])box(bag,canvas,bw,bh,.012,[0,bh/2,side*(bd-.012)/2]);
 // The handles are real strips around an open top, leaving the interior visible.
 for(const side of [-1,1]){
  const handle=mesh(bag,new THREE.TorusGeometry(.055,.008,4,10,Math.PI),canvas,[0,bh,side*(bd-.012)/2]);handle.rotation.z=0;
 }
 const container=box(bag,lining,bw*.72,.055,bd*.72,[0,.045,0]);container.name='Packed lunch container';
 const apple=mesh(bag,new THREE.SphereGeometry(.037,8,6),red,[.06,.094,.02]);apple.scale.y=.9;
 shadow(bag,bw,bd);
 const packet=new THREE.Group();packet.name='Paper wrapped lunch snack';lunch.add(packet);anchor(packet,PRODUCT_PLACEMENT.lunchPacket,PRODUCT_PLACEMENT.counterHeight+.008);
 box(packet,food,.115,.045,.08,[0,.0225,0]);box(packet,paper,.028,.046,.082,[0,.0225,0]);
 const packetHome=packet.position.clone(),packetHand=new THREE.Vector3(),packetRotation=new THREE.Quaternion();
 const state={parcel:'hidden',magnet:false,product:'hidden',lunch:'hidden',lunchPacked:false};
 const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
 function setLunch(next='hidden'){
  if(!['hidden','packing','checking','empty','packed'].includes(next))throw new TypeError('Unknown lunch state: '+next);
  if(next==='packing'){state.lunchPacked=false;packet.position.copy(packetHome);packet.rotation.set(0,0,0);}
  if(['checking','empty','packed'].includes(next))state.lunchPacked=true;
  state.lunch=next;lunch.visible=next!=='hidden';packet.visible=next==='packing'&&!state.lunchPacked;
  if(next!=='hidden')lunch.traverse(o=>o.userData.loadArtwork?.());
 }
 function lunchContact(object,offset){object.updateWorldMatrix(true,false);return object.localToWorld(new THREE.Vector3(...offset));}
 function bindLunchActor(c){
  if(c.actionHandTargets?.owner==='lunch')delete c.actionHandTargets;
  if(c.state!=='doing'||c.node!==PRODUCT_PLACEMENT.lunchStation||!['pack-lunch','inspect-empty-carton'].includes(c.activityPose))return;
  c.lookAt=PRODUCT_PLACEMENT.lunchFacing;
  if(!lunch.visible||!(c.actionDuration>0))return;
  const p=Math.max(0,Math.min(1,c.actionProgress||0));
  const left=lunchContact(bag,[-bw*.43,bh-.015,0]);
  let right;
  if(c.activityPose==='inspect-empty-carton'){
   const rim=lunchContact(lunchBox,[-retailW*.12,retailH+.06,0]);
   const bottom=lunchContact(lunchBox,[-retailW*.12,.025,.008]);
   // Reach over the rim, search the empty bottom, then withdraw empty-handed.
   const reach=p<.23?smooth(p/.23):p<.58?1:p<.80?1-smooth((p-.58)/.22):0;
   right=rim.lerp(bottom,reach);left.copy(lunchContact(lunchBox,[-retailW/2,retailH*.60,.025]));
  }else if(state.lunch==='packed'){
   right=lunchContact(bag,[-bw*.12,bh+.025-.065*Math.sin(Math.PI*p),0]);
  }else{
   const start=packetHome.clone().add(new THREE.Vector3(0,.045,0));
   const finish=lunchContact(bag,[-bw*.15,bh+.035,0]);
   const transfer=smooth((p-.27)/.43);right=start.lerp(finish,transfer);right.y+=.14*Math.sin(Math.PI*transfer);
   if(p>.72)right.y-=.11*smooth((p-.72)/.2);
  }
  c.actionHandTargets={owner:'lunch',left,right};
 }
 function updateLunch(c){
  if(!lunch.visible||c?.state!=='doing'||c.node!==PRODUCT_PLACEMENT.lunchStation)return;
  if(c.activityPose==='pack-lunch'&&state.lunch==='packing'){
   const p=c.actionProgress||0;
   if(p>=.28&&p<.92&&c.model?.hands?.[1]){
    c.model.g.updateMatrixWorld(true);c.model.hands[1].getWorldPosition(packetHand);c.model.hands[1].getWorldQuaternion(packetRotation);
    packet.position.copy(lunch.worldToLocal(packetHand));packet.quaternion.copy(packetRotation);packet.visible=true;
   }else if(p>=.92){state.lunchPacked=true;packet.visible=false;}
  }
 }
 function foldCarton(progress){
  const fold=(start,end)=>{const t=Math.min(1,Math.max(0,(progress-start)/(end-start)));return t*t*(3-2*t);};
  lid.rotation.x=Math.PI/2-(Math.PI/2+.25)*fold(.04,.61);
  flaps.forEach((flap,i)=>{
   const side=i===0?-1:1,amount=fold(i?.37:.26,i?.91:.78);
   flap.rotation.z=side*(Math.PI-(Math.PI+.25)*amount);
  });
 }
 function openCarton(progress){
  if(state.parcel==='hidden'||state.parcel==='doorstep')return;
  if(state.parcel!=='open')setParcel('open');
  if(state.cartonOpening===progress)return;
  state.cartonOpening=progress;foldCarton(progress);
 }
 function setParcel(next='hidden'){
  const mode=typeof next==='string'?next:next.mode||'hidden';if(!['hidden','doorstep','closed','open'].includes(mode))throw new TypeError('Unknown parcel placement: '+mode);
  state.cartonOpening=mode==='open'?1:0;
  if(mode==='open'){open.traverse(o=>o.userData.loadArtwork?.());foldCarton(1);}
  state.parcel=mode;parcelRoot.visible=mode!=='hidden';closed.visible=mode!=='open';open.visible=mode==='open';
  if(mode==='doorstep'){anchor(parcelRoot,PRODUCT_PLACEMENT.doorstep,0);parcelRoot.rotation.y=.08;}
  else{anchor(parcelRoot,PRODUCT_PLACEMENT.island,PRODUCT_PLACEMENT.counterHeight+.003);parcelRoot.rotation.y=.05;}
 }
 function setMagnet(visible=false){if(visible)magnetFace.userData.loadArtwork?.();state.magnet=Boolean(visible);magnet.visible=state.magnet;}
 function setProduct(next='hidden'){
  if(!['hidden','full','empty'].includes(next))throw new TypeError('Unknown product state: '+next);
  if(next!=='hidden')product.traverse(o=>o.userData.loadArtwork?.());
  state.product=next;product.visible=next!=='hidden';dailyBar.scale.y=next==='empty'?.12:1;
 }
 setParcel();setMagnet();setProduct();setLunch();
 return {root,fridge,setParcel,openCarton,setMagnet,setProduct,setLunch,bindLunchActor,updateLunch,getState:()=>({...state}),parts:{parcel:parcelRoot,closed,open,lid,bars,magnet,magnetFace,product,dailyBar,contactShadow,barShadow,lunch,lunchBox,retailLid,lunchBag:bag,lunchPacket:packet,lunchContainer:container},dispose(){disposed=true;fridge.dispose();pendingImages.forEach(img=>img.onload=null);root.removeFromParent();root.traverse(o=>{if(o.geometry)resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){resources.add(m);if(m.map)textures.add(m.map);}});resources.forEach(r=>r.dispose());textures.forEach(t=>t.dispose());}};
}
