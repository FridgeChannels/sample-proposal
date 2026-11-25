// The upper door openings and vertical handles were surveyed in house.webp,
// on the same 1448 × 1086 plate from which the property map was built.
const image = {width:1448,height:1086,left:563.6,seam:592.05,right:621.5,top:248.5,bottom:306.8};
const visualUnitsY = 3.787 * image.height / 100;
const surveyX = x => x * 100 / image.width;
const smooth = value => {const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
const visits = {
 'coffee-milk':{item:'milk',side:'left',actor:0},
 'leftovers-from-fridge':{item:'leftovers',side:'right',actor:1},
 'milk-and-a-bridge':{item:'milk',side:'left',actor:3}
};
// 9 × 13 samples on each door taken from the existing photograph. Handle pixels
// are replaced with neighbouring steel, because the handles themselves stand proud.
const steelSamples={left:'vaaXwLClvq2jtKSas6CWtKGXsaCWsZqLh3hvrotyp39mmXZdl3Rbnnlho35mo4FovJN2eVhBrYpzqoNnmXdbmXdbo35kp4NoqH9mqH9mblQ/qYhxr4hqnnlfmndfpH9lqIRppYFipYFibFI9poZvsIhqo3ximndfo35kp4NopoJlpoJlclZCpINssYlrpH1knHZhpH1mqIFnqIFjqIFjdVZBo4Jrr4ZponthmnVfpX5nqIFnp4Bip4Bie1tEpYVttItwpH9lm3leoX1iqH9mqYBlqYBlfltFooFqsIdsoHxhm3lcoHxfp35hpn1gpn1gg2BJoYBpr4ZpontfnXhcontfp35jp35hp35heVc+mHtlqoJko3xgn3teo3xgpn1ip35jp35jfVpClnpkqYFjpX9jn3teonxdpn1gqX1huo9whF1BeF1JlG5WlHJZlXVbm3lgo35mo4FotpR3g2FD',right:'g3lzsZ6Vsp2SrZ2RuqGSuJqOs5mNr5iLpIRqZUYxxZRwontfroRj+MeWqX1jk3Zinnlho39gXEExqn9iqn9isYRk/saXtIZhnHxip4FgmHZYVUM1qn5kqn5ksoZl+sKStYZknntio31ckG1SYEk6pHtbpHtbr4Jf9b2MsoJjnnlhqX5fimtPY007qX1hqX1hr4Jh9b2Os4NmnnlhrIFijW1PZk46qn1hqn1hsINj5q5/s4JjnndgqHpejG9QZUw5q35gq35gsIJf9LWGuIdlo3xgqHtaiGpNZUw5q35gq35grn9d8LKCuYZlpn1irH1diGpQZEw2rX9hrX9hrn9d7a5/t4Rhpn1gq4BhjGxQaVE+rYBdrYBdsoNe7a59tYJcnnhcoHZVh2VKZUYxzZZvrINjs4Rg6at5tYBZmnNXonhUh2VMbUoxyJl5sI13rIJpzJpwpXtXkG1UkGdLe1xH'};

const linerSamples={left:'jXdbgmxQg21SgGpPhnFXg25Vg25Vg2xShm1QjnBSpIRkhW5RhG1Ng2tMg2tMhW1LinBNjHFPkHRRknRQj21Gq4pln4JjiG5Le2RGeWNEf2hJgGlLfmhLgWtNiG5QjXFTkHNTspJvmHpXgGdGe2VGg21QhW5QinJUkXZWnn9dkXVUknZVvJt2o4NeiW5Mhm1PjXVYk3pcnoNipIdlqoxpt5VwwJ13xaR/updxknZRkHVVlnxdoIRjqY1qsZJsuZhzw6J8xqV/waB7qIdjh2xOjHNWnYJgpIhjspVxuJl0xaWAzK6M0K6KzKyJnYFbg2tJb1tAfGZKgm1RiHFVjHVXjnVXknhakndXzK2Jr49oinBNiHFUkXlbl39gnodopIxsqI1urZFvr5FtyamFs5JrnYFclHxcm4Nkoolpq5FxsJV1sZd2spd2tJh2zq+NnIFflHpYl39inoZnp45vsJZ3tpt8uZ9/vKKBvaOCyKeDp4pkd2JBhnFTi3ZVk31bmoRjootnooplqpBqspVvxaSBjnRRg2tIg2tLjXRRknlWln1an4NfpIdipodjoINfv59+oYVgiW9LhW1Og2tKbV0uWk0pXlEqdl47mHhTmXhXvp17hGtLjXNOdF5ChmtGNS0XODIWRj4eSkEaPi8TimdGu5t4sZNvb1k9W0wqSEEdRDsaUUghLicWNzAWUkQgiGdEsZNyl3xaY1E4VUcrSD4kSD0kQTckSkIwVksxa1pBlXlcs5R1dF1HbmdmzMC+jYB5XVROWk1FXk5CYE9FgnJr7uXlr5FyinFRfGNCeGBGeWFHfWRJgWhMh25PjnNTkXZVkHRU',right:'pIRkjnFRiXBWiXFXj3VbiXFZhm9Vf2hOgWpPgmtQj3Zbq4plkXBLlHNPjm5LiGlHhGREfmFCeV5BeGBFe2NIhGxRkHNTiW1Pf2VKd19Ec1xCclk/cVk/aVE3blc9f2VJlHpcknZViG5PkXJTgGVKeWFFc1xBcFg/b1g+cFc8iWxNoINkwJ13roxno4Jfh2tMiGxPfWFFd15DeWBFdls/mXlZrY9uxqV/vJpzX0IZaEgcPioPkGQ4i2A2QCYNcE0pq4llxaWA0K6KyKiEc1gpblEjWD8hbE4vclU1bU8wXEEnm3tbxKJ+kndXjnRTgGdKcFo+a1U6aVQ5YEsxW0YtalY7lntXxaR/r5FtqIpooYZmkXhZhm9Uf2lPdF9Fb1pAblk9m35dx6iDtJh2rpJwqY9uoYlpmoFkjnVZgmxQe2RIgmlMpodkw6SBvaOCt518sZh5q5JypIpsl35iinJWgmlMh25QjHNUzK6MspVvo4linINglH1djnhahnNWeGVIcV9DdGBBoYZhyamGoINfnX5alHhWmHxakHVVi3FRhWtLfGNFfGNEkXVUvp57mXhXVSwMUSUFg2dLhmhLim5RhmxOf2dJg2hKnH5dupp4imdGczUGZS0FZEctOyIWYks0dV5Hd2BJim9QlXhYuJh1iGdEZzMHXCsHKAcHMhcULx4SqIdlkHZZiXNdrY5suJZ0lXlcZ0QmXz8lSDEiRDAmRzcmVEMuW0cxTkAugmpOq41u7uXlk4B6bVtOeF9OcF1Pg3Bigm5djHpre2tffGNJqIpskHRUk3ZVjnJTiW9Rg2lNgGdLe2JFdV1Ddl5Ag2hKq4xs'};

export function createFrenchDoorFridge(THREE,root,world,magnet,{software=false}={}){
 const appliance=new THREE.Group();appliance.name='French-door refrigerator';root.add(appliance);
 const leftX=world(surveyX(image.left),32).x,seamX=world(surveyX(image.seam),32).x,rightX=world(surveyX(image.right),32).x;
 const faceZ=magnet.position.z-.0065;
 appliance.position.set(seamX,0,faceZ);
 const low=magnet.position.y-(image.bottom-25.6*image.height/100)/visualUnitsY;
 const high=low+(image.bottom-image.top)/visualUnitsY,h=high-low;
 const sides={},materials=new Map(),facing=[surveyX(image.seam),32.1];
 let unitBox;
 const desiredHold=new THREE.Vector3(),target=new THREE.Vector3(),face=new THREE.Vector3(),homeItem=new THREE.Vector3();
 let active=null,progress=0,angle=0,itemInHand=false,linerMap=null,disposed=false;
 const linerMaterials=[];
 function group(parent,name){const g=new THREE.Group();g.name=name;parent.add(g);return g;}
 function paint(color,{unlit=false,roughness=.69,opacity=1}={}){
  const key=color+':'+unlit+':'+roughness+':'+opacity;if(materials.has(key))return materials.get(key);
  const m=unlit?new THREE.MeshBasicMaterial({color,toneMapped:false}):new THREE.MeshStandardMaterial({color,roughness});
  if(opacity<1){m.transparent=true;m.opacity=opacity;m.depthWrite=false;}
  materials.set(key,m);return m;
 }
 function mesh(parent,geometry,material,name){const obj=new THREE.Mesh(geometry,material);obj.name=name;parent.add(obj);return obj;}
 function box(parent,name,color,x,y,z,w,height,d,options){
  unitBox??=new THREE.BoxGeometry(1,1,1);
  const b=mesh(parent,unitBox,paint(color,options),name);b.position.set(x,y,z);b.scale.set(w,height,d);return b;
 }
 function cylinder(parent,name,color,x,y,z,radius,height,segments=10){
  const b=mesh(parent,new THREE.CylinderGeometry(radius,radius,height,segments),paint(color),name);b.position.set(x,y,z);return b;
 }
 function rod(parent,name,color,a,b,radius){
  const v=new THREE.Vector3(...a),w=new THREE.Vector3(...b),axis=w.clone().sub(v);
  const r=cylinder(parent,name,color,0,0,0,radius,axis.length(),8);
  r.position.copy(v.add(w).multiplyScalar(.5));r.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());
  return r;
 }
 function quad(parent,name,color,points){
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();
  const mat=paint(color,{unlit:true});mat.side=THREE.DoubleSide;
  return mesh(parent,geo,mat,name);
 }
 for(const [side,x,direction] of [['left',leftX,1],['right',rightX,-1]]){
  const hinge=group(appliance,side+' door hinge');hinge.position.x=x-seamX;
  sides[side]={hinge,direction,width:Math.abs(x-seamX),built:false};
 }
 // Reparent the already calibrated magnet, preserving its closed world position.
 // The hinge remains active even when the photographed door supplies all pixels.
 sides.right.hinge.attach(magnet);
 function makeSteel(side,parent,x,width){
  const geo=new THREE.PlaneGeometry(width,h,8,12),colors=new Float32Array(9*13*3);
  const swatch=atob(steelSamples[side]),c=new THREE.Color();
  for(let i=0;i<9*13;i++){
   c.setRGB(swatch.charCodeAt(i*3)/255,swatch.charCodeAt(i*3+1)/255,swatch.charCodeAt(i*3+2)/255,THREE.SRGBColorSpace);
   colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
  }
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const face=mesh(parent,geo,new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false}),'Surveyed brushed-steel outer panel');
  face.position.set(x,(low+high)/2,.001);return face;
 }
 function addRearLiner(side,cab,width){
  const geometry=new THREE.PlaneGeometry(width,h*.848,10,18);
  const bytes=atob(linerSamples[side]),color=new THREE.Color(),data=new Float32Array(11*19*3),uv=geometry.attributes.uv;
  for(let k=0;k<11*19;k++){
   color.setRGB(bytes.charCodeAt(k*3)/255,bytes.charCodeAt(k*3+1)/255,bytes.charCodeAt(k*3+2)/255,THREE.SRGBColorSpace);
   data.set([color.r,color.g,color.b],k*3);
   uv.setX(k,(uv.getX(k)+(side==='right'?1:0))*.5);
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(data,3));
  const m=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
  const rear=mesh(cab,geometry,m,'Photographic interior finish on recessed liner');
  rear.position.set(0,low+h*.491-.222*1.25,-.222);
  if(!software&&typeof document!=='undefined'){
   linerMaterials.push(m);
   if(!linerMap)linerMap=new THREE.TextureLoader().load(new URL('./assets/fridge-liner.webp',import.meta.url).href,map=>{
    if(disposed){map.dispose();return;}
    map.colorSpace=THREE.SRGBColorSpace;
    for(const mat of linerMaterials){mat.map=map;mat.vertexColors=false;mat.needsUpdate=true;}
   },undefined,()=>{});
   else if(linerMap.image){m.map=linerMap;m.vertexColors=false;m.needsUpdate=true;}
  }
 }
 function container(parent,name,color,w,height,depth,radius,y){
  const shape=new THREE.Shape(),x=w/2,z=depth/2,r=radius;
  shape.moveTo(-x+r,-z);shape.lineTo(x-r,-z);shape.quadraticCurveTo(x,-z,x,-z+r);
  shape.lineTo(x,z-r);shape.quadraticCurveTo(x,z,x-r,z);
  shape.lineTo(-x+r,z);shape.quadraticCurveTo(-x,z,-x,z-r);
  shape.lineTo(-x,-z+r);shape.quadraticCurveTo(-x,-z,-x+r,-z);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:1,curveSegments:2});
  geometry.rotateX(-Math.PI/2);
  const piece=mesh(parent,geometry,paint(color),name);piece.position.y=y;return piece;
 }
 function addItem(parent,item){
  const g=group(parent,item==='milk'?'Milk with blue cap':'Leftover rice in lidded lunch container');
  if(item==='milk'){
   box(g,'Carton',0xe9e4d9,0,.085,0,.105,.17,.092);
   box(g,'Blue paper band',0x698a9a,0,.045,0,.108,.037,.095);
   const shoulder=box(g,'Folded carton top',0xdcd4bf,0,.18,0,.103,.044,.077);shoulder.rotation.x=-.2;
   cylinder(g,'Blue cap',0x5284a7,.024,.212,.014,.017,.02,8);
  }else{
   container(g,'Clear-sided lunch tub',0x9b9e8c,.201,.075,.134,.015,.008);
   container(g,'Visible rice and vegetables',0xba995d,.184,.023,.128,.016,.070);
   container(g,'Teal sealing rim',0x547b7c,.210,.015,.143,.021,.091);
   container(g,'Frosted lid',0xa2b2a4,.199,.008,.134,.018,.107);
  }
  return g;
 }
 function build(side){
  const s=sides[side];if(s.built)return;s.built=true;
  const direction=s.direction,w=s.width;
  const cab=group(appliance,side+' illuminated compartment');cab.position.x=s.hinge.position.x+direction*w/2;
  const leaf=group(s.hinge,side+' moving door');
  const mid=direction*w/2;
  box(leaf,'Insulated steel edge',0x8d7763,mid,(low+high)/2,-.021,w,h,.042,{unlit:true});
  makeSteel(side,leaf,mid,w*.995);
  box(leaf,'Moulded inner liner',0xb5b9aa,mid,(low+high)/2,-.045,w*.92,h*.96,.014);
  const inside=mid+direction*.006;
  for(const v of [.23,.61]){
   box(leaf,'Door bin base',0x9daba6,inside,low+h*v,-.087,w*.77,.018,.084,{opacity:.45});
   box(leaf,'Door bin rail',0xafb9b2,inside,low+h*v+.05,-.129,w*.76,.045,.012,{opacity:.58});
  }
  const handleX=direction*(w-.064),handleY=low+h*.50;
  const steel=0xb6a28d;
  const y1=low+h*.16,y2=low+h*.83;
  rod(leaf,'Steel grip',steel,[handleX,y1+.035,.053],[handleX,y2-.035,.053],.012);
  for(const [y,offset] of [[y1,.035],[y2,-.035]]){
   rod(leaf,'Handle return',0x998879,[handleX,y,.009],[handleX,y+offset,.053],.012);
  }
  const grip=group(leaf,'Grip contact');grip.position.set(handleX,handleY,.059);
  // Recess the illuminated rear liner. Its outside contour exactly covers the
  // old front panel in this fixed orthographic view. Shelves and groceries
  // have true world depth, so actors and swinging doors occlude them normally.
  const pt=(x,v,z)=>[x,low+h*v+z*1.25,z];
  const rim=w/2,back=w*.42,zback=-.222;
  const corners=[pt(-rim,0,-.003),pt(rim,0,-.003),pt(rim,1,-.003),pt(-rim,1,-.003)];
  const inner=[pt(-back,.067,zback),pt(back,.067,zback),pt(back,.915,zback),pt(-back,.915,zback)];
  addRearLiner(side,cab,2*back);
  for(const [k,color] of [[0,0xa59e8e],[1,0xc5bdad],[2,0x807c72],[3,0xb5b0a5]]){
   const n=(k+1)%4;quad(cab,'Moulded cavity return',color,[corners[k],corners[n],inner[n],inner[k]]);
  }
  for(const v of [.16,.47,.75]){
   const shelfY=low+h*v;
   box(cab,'Glass shelf',0x929a8c,0,shelfY,-.094,w*.87,.012,.192,{opacity:.19,roughness:.22});
   box(cab,'Shelf front lip',0xadad9b,0,shelfY+.005,.003,w*.91,.022,.013,{opacity:.80});
  }
  box(cab,'Warm interior LED',0xe1d7b9,0,high-.055,-.028,w*.70,.024,.024,{unlit:true});
  const item=addItem(cab,side==='left'?'milk':'leftovers');
  // The milk lives on the lower shelf within Noah’s reach. The adult’s
  // covered meal stays one shelf above it.
  const itemHome=new THREE.Vector3(side==='left'?w*.21:-w*.10,low+h*(side==='left'?.16:.47)+.018,-.038);
  item.position.copy(itemHome);
  Object.assign(s,{cab,leaf,grip,item,itemHome});leaf.visible=cab.visible=false;
 }
 function close(){
  if(active){const s=sides[active.side];s.hinge.rotation.y=0;s.leaf.visible=false;s.cab.visible=false;s.item.position.copy(s.itemHome);s.item.quaternion.identity();}
  active=null;angle=progress=0;itemInHand=false;
 }
 function setVisit(id,p,actor){
  let spec=visits[id];
  if(!spec&&['milk','leftovers'].includes(id)&&Number.isInteger(actor)&&actor>=0&&actor<=3)spec={item:id,side:id==='milk'?'left':'right',actor};
  if(!spec||!Number.isFinite(p)){close();return;}
  if(active&&(spec.side!==active.side||spec.actor!==active.actor))close();
  active=spec;progress=Math.max(0,Math.min(1,p));build(active.side);
  const s=sides[active.side];
  const swing=smooth((progress-.075)/.27)*(1-smooth((progress-.72)/.255));
  angle=swing*(active.actor===3?1.66:1.84);
  s.hinge.rotation.y=-s.direction*angle;
  s.leaf.visible=s.cab.visible=angle>.001;
  s.item.position.copy(s.itemHome);s.item.quaternion.identity();itemInHand=false;
 }
 function bindActor(c){
  if(c.actionHandTargets?.owner==='fridge'){delete c.actionHandTargets;if(c.lookAt===facing)delete c.lookAt;}
  if(!active||active.actor!==c.cell||c.state!=='doing'||!c.model?.g||!c.model.hands)return;
  const s=sides[active.side],doorRight=active.side==='left';
  const station=c.model.g.getWorldPosition(target);
  if(Math.hypot(station.x-appliance.position.x,station.z-faceZ)>1.5)return;
  c.lookAt=facing;
  const grip=s.grip.getWorldPosition(new THREE.Vector3());
  grip.y+=(active.actor===3?-.31:-.04);
  const item=s.item.parent.localToWorld(homeItem.copy(s.itemHome)).clone();item.y+=active.item==='milk'?.095:.070;
  const bodyHeight=c.model.naturalHeight*c.model.g.scale.y;
  const carry=desiredHold.copy(station);carry.x+=doorRight?.115:-.115;carry.y+=bodyHeight*.55;carry.z-=.19;
  const pull=smooth((progress-.55)/.18);
  const retrieval=item.clone().lerp(carry,pull);retrieval.y+=.06*Math.sin(pull*Math.PI);
  const holdDoor=smooth(progress/.11)*(1-smooth((progress-.95)/.05));
  const take=smooth((progress-.25)/.20);
  const contacts={owner:'fridge',left:doorRight?retrieval:grip,right:doorRight?grip:retrieval,leftWeight:doorRight?take:holdDoor,rightWeight:doorRight?holdDoor:take};
  c.actionHandTargets=contacts;
 }
 function followHand(c){
  if(!active||c.cell!==active.actor||progress<.55||c.actionHandTargets?.owner!=='fridge')return;
  const s=sides[active.side],hand=c.model.hands[active.side==='left'?0:1];
  hand.getWorldPosition(face);const pickup=s.item.parent.localToWorld(homeItem.copy(s.itemHome));
  face.y-=active.item==='milk'?.095:.07;
  const t=smooth((progress-.55)/.095);
  s.item.position.copy(s.cab.worldToLocal(pickup.lerp(face,t)));
  itemInHand=true;
 }
 return {setVisit,bindActor,followHand,reset:close,parts:{appliance,sides},
  dispose(){disposed=true;if(linerMap&&!linerMap.image)linerMap.dispose();},
  getState:()=>({item:active?.item||null,actor:active?.actor??null,side:active?.side||null,angle,progress,itemInHand})};
}
