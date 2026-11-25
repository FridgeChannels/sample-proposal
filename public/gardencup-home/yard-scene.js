// A persistent front yard in the exact house camera projection. Positions are
// expressed in the same house-percentage coordinates as the household agents.
export const yardFootprints=[
 {id:'swing',x:25,y:113,radius:7},
 {id:'oak',x:9,y:115,radius:5},
 {id:'maple',x:75,y:113,radius:5},
 {id:'mailbox',x:42,y:125,radius:1.5}
];
export const groundHeightAt=(x,y)=>y>=122.4&&y<=128.3?.055:x>=45.5&&x<=50.6&&y>=99.9&&y<129.5?.045:0;
export function createFrontYard(THREE,world,{software=false}={}){
 const group=new THREE.Group();group.name='Bennett front yard and residential street';
 const mat=(color,roughness=.96,extra={})=>new THREE.MeshStandardMaterial({color,roughness,...extra});
 const bark=mat(0x695b43),wood=mat(0xa18459),darkWood=mat(0x7a6448),steel=mat(0x8a8b7d,.45,{metalness:.65}),rubber=mat(0x45483c),paving=mat(0xc2bcaa),curbMat=mat(0xd0cbb9),mulch=mat(0x80765a),leafMats=[0x728153,0x869661,0x66794e,0x95a16a,0x7d8c57].map(c=>mat(c));
 let seed=5819;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 function mesh(geo,material,parent=group){const m=new THREE.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(w,h,d,material,pos,parent=group){const m=mesh(new THREE.BoxGeometry(w,h,d),material,parent);m.position.copy(pos);return m;}
 function rod(a,b,r1,r2,material,parent=group){const d=new THREE.Vector3().subVectors(b,a),m=mesh(new THREE.CylinderGeometry(r2,r1,d.length(),software?5:10),material,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
 function rect(x0,y0,x1,y1,height,material){const a=world(x0,y0),b=world(x1,y1),pos=a.clone().add(b).multiplyScalar(.5);pos.y=height/2;const m=box(Math.abs(b.x-a.x),height,Math.abs(b.z-a.z),material,pos);m.renderOrder=-20;m.userData.ground=true;return m;}
 function mottledGround(x0,y0,x1,y1,color,variance,nx,ny){
  const a=world(x0,y0),b=world(x1,y1),geo=new THREE.PlaneGeometry(Math.abs(b.x-a.x),Math.abs(b.z-a.z),nx,ny);geo.rotateX(-Math.PI/2);
  const colors=[],base=new THREE.Color(color);for(let i=0;i<geo.attributes.position.count;i++){const c=base.clone().multiplyScalar(1+(rand()-.5)*variance);colors.push(c.r,c.g,c.b);}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const m=mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));m.position.copy(a).add(b).multiplyScalar(.5);m.position.y=-.006;m.castShadow=false;m.renderOrder=-30;m.userData.ground=true;return m;
 }
 mottledGround(-1,99.9,101,123,0x8c996e,.16,software?30:75,software?9:22);
 mottledGround(-2,129.2,102,153,0x686b65,.095,software?30:85,software?8:20);
 // Segmented sidewalk, poured concrete curb, and a clear path to the door.
 for(let x=-2;x<103;x+=8)rect(x,122.4,x+7.91,128.2,.055,paving);
 rect(-2,128.3,45.5,129.45,.14,curbMat);rect(50.6,128.3,84,129.45,.14,curbMat);
 for(let y=99.9;y<122.4;y+=4.5)rect(45.5,y,50.6,Math.min(y+4.40,122.4),.045,paving);
 // Curb cut at the front walk and the garage driveway. Their slopes have
 // no vertical obstacle for the driver walking back to the parked van.
 const cut=rect(45.5,128.28,50.6,129.5,.145,paving);cut.scale.y=.3;
 rect(84,99.9,101,128.25,.045,paving);
 for(const x of [89.6,95.3])rect(x,100,x+.035,128.25,.05,mat(0xaba794));
 for(const y of [109,118])rect(84,y,101,y+.04,.05,mat(0xaba794));
 // Faint residential lane markings. No fantasy race track or giant labels.
 const stripe=mat(0xcac7ab);for(let x=-1;x<102;x+=15)rect(x,148.5,x+6.5,148.68,.003,stripe);
 // Low planting along the house edge keeps the original porch and walkway open.
 function shrub(x,y,scale=1){const pos=world(x,y);pos.y=.22*scale;const geo=new THREE.SphereGeometry(.30*scale,software?7:12,software?5:8),m=mesh(geo,leafMats[Math.floor(rand()*leafMats.length)]);m.scale.set(1,.68,.9);m.position.copy(pos);}
 for(const x of [4,8,12,16,34,38,58,62,66,80])shrub(x,101.4,.75+rand()*.35);
 const trees=[];
 function tree(x,y,scale=1){
  const root=new THREE.Group();root.position.copy(world(x,y));group.add(root);trees.push(root);
  rod(new THREE.Vector3(0,0,0),new THREE.Vector3(.07,1.85*scale,.02),.13*scale,.07*scale,bark,root);
  const branches=[[-.57,2.32,.20],[.62,2.50,-.19],[-.22,2.77,-.53],[.40,2.82,.48]];
  branches.forEach(([x,y,z],i)=>rod(new THREE.Vector3(.03,1.18*scale+i*.13,0),new THREE.Vector3(x*scale,y*scale,z*scale),.053*scale,.018*scale,bark,root));
  // Irregular clusters form a broad deciduous crown, not a spherical lollipop.
  for(let i=0;i<23;i++){
   const angle=rand()*Math.PI*2,r=.92*Math.sqrt(rand()),height=2.48+(rand()-.5)*.95;
   const geo=new THREE.SphereGeometry((.38+rand()*.24)*scale,software?7:12,software?5:9);
   const positions=geo.attributes.position;for(let v=0;v<positions.count;v++){const mul=.92+rand()*.16;positions.setXYZ(v,positions.getX(v)*mul,positions.getY(v)*mul,positions.getZ(v)*mul);}geo.computeVertexNormals();
   const crown=mesh(geo,leafMats[Math.floor(rand()*leafMats.length)],root);crown.position.set(Math.cos(angle)*r*scale,height*scale,Math.sin(angle)*r*.8*scale);crown.scale.set(1.1,.83,1);crown.userData.leafPhase=rand()*Math.PI*2;
  }
  // Soft shadow footprint also supports the no-WebGL renderer.
  for(let i=0;i<2;i++){const shadow=mesh(new THREE.CircleGeometry(1.12*scale+i*.12,software?10:24),new THREE.MeshBasicMaterial({color:0x465039,transparent:true,opacity:i?.035:.08,depthWrite:false}),root);shadow.rotation.x=-Math.PI/2;shadow.position.set(.32,.012+i*.001,.35);shadow.scale.y=.75;shadow.castShadow=false;shadow.renderOrder=-10;}
 }
 tree(9,115,1.02);tree(75,113,.96);
 // Cedar A-frame swing, chains and a curved rubber seat, placed well away
 // from the shared front path and the driver's return route.
 const swingRoot=new THREE.Group();swingRoot.position.copy(world(25,113));group.add(swingRoot);
 const bed=mesh(new THREE.BoxGeometry(3.5,.035,2.8),mulch,swingRoot);bed.position.y=.01;
 for(const x of [-1.4,1.4]){
  for(const z of [-.83,.83])rod(new THREE.Vector3(x,0,z),new THREE.Vector3(x,2.48,0),.075,.065,wood,swingRoot);
  rod(new THREE.Vector3(x,1.05,-.49),new THREE.Vector3(x,1.05,.49),.045,.045,darkWood,swingRoot);
 }
 rod(new THREE.Vector3(-1.60,2.48,0),new THREE.Vector3(1.60,2.48,0),.095,.095,wood,swingRoot);
 const swing=new THREE.Group();swing.position.y=2.39;swingRoot.add(swing);
 for(const x of [-.35,.35])rod(new THREE.Vector3(x,0,0),new THREE.Vector3(x,-1.81,0),.009,.009,steel,swing);
 const seat=mesh(new THREE.BoxGeometry(.81,.055,.34),rubber,swing);seat.position.y=-1.83;seat.rotation.z=.015;
 for(const x of [-.39,.39]){const lip=mesh(new THREE.BoxGeometry(.055,.09,.34),rubber,swing);lip.position.set(x,-1.80,0);}
 // A small curbside mailbox gives the street scale without blocking passage.
 const mailbox=new THREE.Group();mailbox.position.copy(world(42,125));group.add(mailbox);
 box(.08,1.08,.08,darkWood,new THREE.Vector3(0,.54,0),mailbox);box(.39,.08,.26,darkWood,new THREE.Vector3(.13,1.03,0),mailbox);
 const mailboxMat=mat(0x667565,.65,.2);const housing=mesh(new THREE.BoxGeometry(.43,.26,.25),mailboxMat,mailbox);housing.position.set(.12,1.17,0);const top=mesh(new THREE.CylinderGeometry(.125,.125,.43,software?8:16,1,false,0,Math.PI),mailboxMat,mailbox);top.rotation.z=Math.PI/2;top.rotation.x=Math.PI/2;top.position.set(.12,1.30,0);box(.012,.17,.025,mat(0x963f2c),new THREE.Vector3(.19,1.37,.15),mailbox);
 function update(time){swing.rotation.x=.045*Math.sin(time*.85);trees.forEach((t,i)=>{t.rotation.z=.0025*Math.sin(time*.36+i);});}

 return {group,update,swing,trees,footprints:yardFootprints,groundHeightAt};
}
