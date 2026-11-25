// Insulated Gardencup six-cup delivery carton. +Z is the printed front.
export const COLD_PACK_METRES=Object.freeze({width:.355,height:.195,depth:.25});
const LETTERS={
 G:['01110','10001','10000','10111','10001','10001','01110'],
 A:['01110','10001','10001','11111','10001','10001','10001'],
 R:['11110','10001','10001','11110','10100','10010','10001'],
 D:['11110','10001','10001','10001','10001','10001','11110'],
 E:['11111','10000','10000','11110','10000','10000','11111'],
 N:['10001','11001','11001','10101','10011','10011','10001'],
 C:['01111','10000','10000','10000','10000','10000','01111'],
 U:['10001','10001','10001','10001','10001','10001','01110'],
 P:['11110','10001','10001','11110','10000','10000','10000']
};

// The software renderer also uses the same printed lettering at cup scale.
export function eachWordmarkRun(draw){
 const word='GARDENCUP';
 for(let i=0;i<word.length;i++){
  LETTERS[word[i]].forEach((row,y)=>{
   for(let x=0;x<row.length;){
    if(row[x]==='0'){x++;continue;}
    let end=x+1;while(end<row.length&&row[end]==='1')end++;
    draw(i*6+x,y,end-x,word.length*6-1);x=end;
   }
  });
 }
}

export function createParcel(THREE,{software=false,size=1}={}){
 const base=COLD_PACK_METRES;
 const dimensions=typeof size==='number'?{width:base.width*size,height:base.height*size,depth:base.depth*size}:{...base,...size};
 const {width:w,height:h,depth:d}=dimensions;
 const group=new THREE.Group();group.name='Insulated Gardencup delivery carton';
 group.userData.dimensions=dimensions;group.userData.brand='Gardencup';
 const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.94,metalness:0,...extra});
 const kraft=mat(0xb98b55),tape=mat(0x527342),crease=mat(0x946b3d),ink=mat(0x214f3e),cream=mat(0xf3f1df);
 function mesh(geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 function box(width,height,depth,material,x,y,z){return mesh(new THREE.BoxGeometry(width,height,depth),material,x,y,z);}
 const cut=Math.min(w,h)*.018,shape=new THREE.Shape();
 const halfHeight=h/2-cut*.55;
 shape.moveTo(-w/2+cut,-halfHeight);shape.lineTo(w/2-cut,-halfHeight);shape.lineTo(w/2,-halfHeight+cut);shape.lineTo(w/2,halfHeight-cut);shape.lineTo(w/2-cut,halfHeight);shape.lineTo(-w/2+cut,halfHeight);shape.lineTo(-w/2,halfHeight-cut);shape.lineTo(-w/2,-halfHeight+cut);shape.closePath();
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
   ctx.fillStyle='#f3f1df';ctx.fillRect(0,0,1024,640);
   ctx.fillStyle='#214f3e';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 235px Arial, sans-serif';ctx.fillText('GARDENCUP',512,254,900);
   ctx.fillStyle='#263931';ctx.font='600 43px Arial, sans-serif';ctx.fillText('FRESH SALAD PACK',512,418);
   ctx.font='28px Arial, sans-serif';ctx.fillText('KEEP REFRIGERATED',512,488);
   ctx.fillStyle='#214f3e';ctx.fillRect(140,550,744,5);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
   label.material=new THREE.MeshStandardMaterial({map:texture,roughness:.95,metalness:0});group.userData.labelTexture=texture;
   if(typeof Image!=='undefined'){
    const wordmark=new Image();wordmark.onload=()=>{ctx.fillStyle='#f3f1df';ctx.fillRect(90,90,844,280);const ratio=Math.min(760/wordmark.naturalWidth,185/wordmark.naturalHeight);const lw=wordmark.naturalWidth*ratio,lh=wordmark.naturalHeight*ratio;ctx.drawImage(wordmark,(1024-lw)/2,230-lh/2,lw,lh);texture.needsUpdate=true;};wordmark.src=new URL('./assets/gardencup/logo.svg',import.meta.url).href;
   }
  }else addVectorPrint();
 }else addVectorPrint();
 function addVectorPrint(){
  // SVGRenderer cannot display texture maps. This miniature printing consists
  // of real surface triangles, never screen text or a camera-facing billboard.
  const z=labelZ+.00035,unit=w*.014,top=h*.09;
  const positions=[];
  function rect(x,y,rw,rh){positions.push(x,y,z,x+rw,y,z,x+rw,y-rh,z,x,y,z,x+rw,y-rh,z,x,y-rh,z);}
  eachWordmarkRun((x,y,length,total)=>rect((x-total/2)*unit,top-y*unit,length*unit,unit*.95));
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
 parcel.position.y+=(parcel.userData.dimensions?.height??COLD_PACK_METRES.height)*.49;
 parcel.rotation.set(0,0,0);
}
