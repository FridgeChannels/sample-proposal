// Garden coordinates share the simulation floor with the house, so the porch,
// lawn and fetch ball stay in place as the camera follows Cooper outside.
export function createLivingGarden(T, world, {software=false}={}) {
 const root=new T.Group();
 root.name='Front lawn';
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.96,side:T.DoubleSide});
 const up=new T.Vector3(0,1,0);
 const color=new T.Color();
 let seed=317;
 const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const v=(x,y,z)=>new T.Vector3(x,y,z);
 const heightAt=(x,y)=>Math.max(0,1-Math.hypot((x-61)/13,(y-109)/12))*.065;
 function batch(){return {xyz:[],rgb:[]};}
 function tri(buf,a,b,c,tint){
  color.setHex(tint);
  for(const p of [a,b,c]){buf.xyz.push(p.x,p.y,p.z);buf.rgb.push(color.r,color.g,color.b);}
 }
 function mesh(buf,name){
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(buf.xyz,3));
  g.setAttribute('color',new T.Float32BufferAttribute(buf.rgb,3));
  g.computeVertexNormals();g.computeBoundingSphere();
  const m=new T.Mesh(g,material);m.name=name;root.add(m);return m;
 }
 function limb(buf,a,b,width,tip,tint){
  const dir=b.clone().sub(a).normalize();
  const side=dir.clone().cross(Math.abs(dir.y)>.95?v(1,0,0):up).normalize();
  const cross=dir.clone().cross(side);
  const ring=(i,p,r)=>p.clone().addScaledVector(side,Math.cos(i*Math.PI/2)*r).addScaledVector(cross,Math.sin(i*Math.PI/2)*r);
  for(let i=0;i<4;i++){
   const p=ring(i,a,width),q=ring(i+1,a,width),r=ring(i+1,b,tip),s=ring(i,b,tip);
   tri(buf,p,q,r,tint);tri(buf,p,r,s,tint);
  }
 }
 const planted=batch(),swings=[];
 // Individually folded leaves on two serviceberry saplings. All the leaves
 // of each sapling are submitted together, and sway about their branch joint.
 function sapling(x,y,h){
  const base=world(x,y),fork=base.clone().add(v(.04,h*.48,0));
  limb(planted,base,fork,.056,.033,0x6c6047);
  const buf=batch();
  const greens=[0x536739,0x677f44,0x82924c,0x465b35,0x929c57];
  for(let j=0;j<8;j++){
   const angle=j*2.4,reach=h*(.23+random()*.26),top=v(Math.cos(angle)*reach,h*(.21+random()*.36),Math.sin(angle)*reach);
   limb(buf,v(0,0,0),top,.032,.006,0x786c51);
   for(let k=0;k<(software?12:28);k++){
    const t=.32+random()*.72;
    const p=top.clone().multiplyScalar(t).add(v((random()-.5)*.38,(random()-.5)*.27,(random()-.5)*.39));
    const a=random()*6.28,len=.095+random()*.095,dx=Math.cos(a)*len,dz=Math.sin(a)*len,tip=p.clone().add(v(dx,.018,dz));
    const mid=p.clone().lerp(tip,.5),left=mid.clone().add(v(-dz*.30,.03,dx*.30)),right=mid.clone().add(v(dz*.30,.012,-dx*.30));
    const c=greens[Math.floor(random()*greens.length)];tri(buf,p,left,tip,c);tri(buf,p,tip,right,c);
   }
  }
  const foliage=mesh(buf,'Wind in the serviceberry leaves');foliage.position.copy(fork);swings.push(foliage);
 }
 sapling(65,115,2.35);sapling(33,101,1.7);sapling(26,9,1.9);
 // Irregular stone treads along the curve of the lawn, clear of the front walk.
 for(const [x,y] of [[51.5,104],[54.1,105],[56.8,105.7],[59.5,106.6]]){
  const p=world(x,y);p.y=heightAt(x,y)+.025;
  const ring=Array.from({length:7},(_,i)=>{const a=i*.898;return p.clone().add(v(Math.cos(a)*(.22+random()*.045),0,Math.sin(a)*(.16+random()*.048)));});
  ring.forEach((a,i)=>{const b=ring[(i+1)%ring.length];tri(planted,p,b,a,0x928a76);tri(planted,a,b,a.clone().add(v(0,-.05,0)),0x8a826d);});
 }
 mesh(planted,'Tree trunks and garden stepping stones');
 const ball=new T.Mesh(new T.SphereGeometry(.062,8,6),new T.MeshStandardMaterial({color:0xb9bf64,roughness:.98}));
 ball.name='Fetch ball';ball.position.copy(world(62,107));ball.position.y=heightAt(62,107)+.062;root.add(ball);
 // Transparent vegetation and props sit on the same photographed ground in both renderers.
 return {root,heightAt,update(time,carried,reduced){
  ball.visible=!carried;
  swings.forEach((c,i)=>{c.rotation.z=reduced?0:Math.sin(time*1.4+i*1.9)*.034;c.rotation.x=reduced?0:Math.sin(time*.77+i)*.014;});
 }};
}
