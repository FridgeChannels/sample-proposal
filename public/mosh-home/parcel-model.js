// Physical MOSH delivery carton. +Z is the printed front; all decoration
// lives on box faces, so the package respects actor and furniture occlusion.
const LETTERS={
 M:['10001','11011','10101','10101','10001','10001','10001'],
 O:['01110','10001','10001','10001','10001','10001','01110'],
 H:['10001','10001','10001','11111','10001','10001','10001'],
 S:['01111','10000','10000','01110','00001','00001','11110'],
 U:['10001','10001','10001','10001','10001','10001','01110'],
 N:['10001','11001','11001','10101','10011','10011','10001'],
 Y:['10001','10001','01010','00100','00100','00100','00100'],
 B:['11110','10001','10001','11110','10001','10001','11110'],
 I:['11111','00100','00100','00100','00100','00100','11111'],
 T:['11111','00100','00100','00100','00100','00100','00100'],
 E:['11111','10000','10000','11110','10000','10000','11111']
};

// Default dimensions are a 30 × 22 × 15 cm snack mailer in actor-local metres.
export function createParcel(THREE,{software=false,size=1}={}){
 const dimensions=typeof size==='number'?{width:.30*size,height:.15*size,depth:.22*size}:{width:size.width??.30,height:size.height??.15,depth:size.depth??.22};
 const {width:w,height:h,depth:d}=dimensions;
 const group=new THREE.Group();group.name='MOSH physical delivery carton';
 group.userData.dimensions=dimensions;group.userData.brand='MOSH';
 const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.94,metalness:0,...extra});
 const kraft=mat(0xb98b55),tape=mat(0xcaa879),crease=mat(0x946b3d),ink=mat(0x681cab),gold=mat(0xeaa9c4),cream=mat(0xf5bfd4);
 function mesh(geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 function box(width,height,depth,material,x,y,z){return mesh(new THREE.BoxGeometry(width,height,depth),material,x,y,z);}
 const cut=Math.min(w,h)*.018,shape=new THREE.Shape();
 shape.moveTo(-w/2+cut,-h/2);shape.lineTo(w/2-cut,-h/2);shape.lineTo(w/2,-h/2+cut);shape.lineTo(w/2,h/2-cut);shape.lineTo(w/2-cut,h/2);shape.lineTo(-w/2+cut,h/2);shape.lineTo(-w/2,h/2-cut);shape.lineTo(-w/2,-h/2+cut);shape.closePath();
 const bodyGeo=new THREE.ExtrudeGeometry(shape,{depth:d-cut*2,steps:1,bevelEnabled:true,bevelThickness:cut,bevelSize:cut*.55,bevelSegments:1,curveSegments:1});
 bodyGeo.translate(0,0,-d/2+cut);mesh(bodyGeo,kraft);
 // Sealed top flaps, wrapping tape and shallow compressed cardboard seams.
 box(w*.16,.0016,d+.001,tape,0,h/2+.001,0);
 box(w*.16,h*.14,.0016,tape,0,h*.43,d/2+.001);
 box(w*.16,h*.14,.0016,tape,0,h*.43,-d/2-.001);
 box(.0012,.002,d*.96,crease,0,h/2+.002,0);
 box(w*.94,.0012,.0015,crease,0,h/2+.001,-d*.34);
 box(w*.94,.0012,.0015,crease,0,h/2+.001,d*.34);
 for(const side of [-1,1]){
  box(.0016,h*.82,.0015,crease,side*w*.497,0,-d*.42);
  const fold=box(.0015,h*.14,.0014,crease,side*w*.497,h*.34,d*.41);fold.rotation.x=side*.58;
 }
 const labelW=w*.86,labelH=h*.68,labelZ=d/2+.0026;
 const label=new THREE.Mesh(new THREE.PlaneGeometry(labelW,labelH),cream);label.position.set(0,-h*.045,labelZ);group.add(label);
 const canTexture=!software&&typeof document!=='undefined';
 if(canTexture){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=640;
  const ctx=canvas.getContext('2d');
  if(ctx){
   ctx.fillStyle='#f5bfd4';ctx.fillRect(0,0,1024,640);
   ctx.fillStyle='#681cab';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 235px Arial, sans-serif';ctx.fillText('MOSH',512,254,900);
   ctx.fillStyle='#281633';ctx.font='600 43px Arial, sans-serif';ctx.fillText('COOKIE DOUGH CRUNCH',512,418);
   ctx.font='28px Arial, sans-serif';ctx.fillText('GOOD THINGS INSIDE',512,488);
   ctx.fillStyle='#681cab';ctx.fillRect(140,550,744,5);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
   label.material=new THREE.MeshStandardMaterial({map:texture,roughness:.95,metalness:0});group.userData.labelTexture=texture;
   if(typeof Image!=='undefined'){
    const wordmark=new Image();wordmark.onload=()=>{ctx.fillStyle='#f5bfd4';ctx.fillRect(90,90,844,280);ctx.drawImage(wordmark,172,120,680,233);texture.needsUpdate=true;};wordmark.src=new URL('./assets/mosh/logo.svg',import.meta.url).href;
   }
  }else addVectorPrint();
 }else addVectorPrint();
 function addVectorPrint(){
  // SVGRenderer cannot display texture maps. This miniature printing consists
  // of real surface triangles, never screen text or a camera-facing billboard.
  const z=labelZ+.00035,unit=w*.028,top=h*.09;
  const positions=[];
  function rect(x,y,rw,rh){positions.push(x,y,z,x+rw,y,z,x+rw,y-rh,z,x,y,z,x+rw,y-rh,z,x,y-rh,z);}
  const word='MOSH',total=(word.length*6-1)*unit;
  [...word].forEach((letter,i)=>LETTERS[letter].forEach((row,ri)=>{
   for(let col=0;col<5;){if(row[col]==='0'){col++;continue;}let end=col+1;while(end<5&&row[end]==='1')end++;rect(-total/2+(i*6+col)*unit,top-ri*unit,(end-col)*unit,unit*.95);col=end;}
  }));
  const textGeo=new THREE.BufferGeometry();textGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));textGeo.computeVertexNormals();mesh(textGeo,ink);
  // A simple printed rule keeps the small parcel legible from the house camera.
  mesh(new THREE.PlaneGeometry(w*.55,h*.014),ink,0,-h*.22,z);

 }
 // Side shipping label is part of the box, with thin physical barcode bars.
 const sideLabel=box(.0018,h*.25,d*.46,cream,-w/2-.0015,-h*.13,0);
 for(let i=0;i<10;i++)box(.002,h*(i%3===0?.13:.11),d*(i%3===0?.009:.005),ink,-w/2-.0026,-h*.13,-d*.18+i*d*.037);
 return group;
}

/** Call after poseHuman. Attaches the box between the actual posed palms. */
export function attachParcelToHands(parcel,model){
 if(!model?.arms?.length||!model.rig)return;
 if(parcel.parent!==model.rig)model.rig.add(parcel);
 model.g.updateMatrixWorld(true);
 const points=model.arms.slice(0,2).map((arm,i)=>{
  const grip=model.hands?.[i]||arm.hand;
  const point=grip?grip.getWorldPosition(grip.position.clone()):arm.elbow.localToWorld(arm.elbow.position.clone().set(0,-arm.length*.92,.025));
  model.rig.worldToLocal(point);return point;
 });
 parcel.position.copy(points[0]).add(points[1]).multiplyScalar(.5);
 parcel.position.y+=(parcel.userData.dimensions?.height??.15)*.49;
 parcel.rotation.set(0,0,0);
}
