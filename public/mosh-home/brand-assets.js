// MOSH product photography and HOMMIO concept packaging remain independent of the home scene.
const url=file=>new URL(`./assets/${file}`,import.meta.url).href;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const MOSH={name:'MOSH',sampleURL:'https://sample.fridgechannels.com/p/G5QD0W25PM',shopURL:'https://moshlife.com/collections/all',missionURL:'https://moshlife.com/pages/mission',missionCTA:'Tap for our brain health mission',product:'Cookie Dough Crunch',flavor:'Chocolate chip cookie dough',size:'12 protein bars',price:44.99,colors:{purple:'#681cab',pink:'#f5bfd4',cream:'#fff7fa',ink:'#281633'}};
// Legacy export keeps scene extensions compatible; the displayed brand is MOSH.
export const SUNNYBITES=MOSH;
export const BRAND_ASSETS=Object.freeze({
 pouch:url('mosh/bar.webp'),
 box:url('mosh/box.webp'),
 carton:url('mosh/carton.webp'),
 openParcel:url('mosh/open-parcel.webp'),
 magnet:url('mosh/magnet-front.webp'),
 magnetBack:url('mosh/magnet-back.webp')
});
export const BRAND_ASSET_SIZES=Object.freeze({pouch:[3142,1034],box:[1200,1200],carton:[1254,1254],openParcel:[1254,1254],magnet:[420,780],magnetBack:[420,780]});
const descriptions={pouch:'A wrapped MOSH Cookie Dough Crunch protein bar',box:'MOSH Cookie Dough Crunch box of 12 protein bars',carton:'A small sealed MOSH delivery carton',openParcel:'An open MOSH parcel filled with individually wrapped protein bars',magnet:'Unwrapped MOSH Cookie Dough Crunch, photographed close up on the magnet',magnetBack:'MOSH. Tap for our brain health mission. Powered by Hommio.'};
export function loadBrandStyles(){if(document.querySelector('link[data-brand-assets]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./brand-assets.css',import.meta.url).href;link.dataset.brandAssets='';document.head.append(link);}
export function brandProp(kind='pouch',{className='',alt=descriptions[kind],decorative=false}={}) {
 const key=Object.hasOwn(BRAND_ASSETS,kind)?kind:'pouch';
 return `<span class="sb-prop sb-prop--${key} ${escape(className)}"><img src="${BRAND_ASSETS[key]}" alt="${decorative?'':escape(alt||descriptions[key])}" draggable="false" decoding="async"></span>`;
}
export function createBrandProp(kind='pouch',options={}){loadBrandStyles();const holder=document.createElement('div');holder.innerHTML=brandProp(kind,options);return holder.firstElementChild;}
export function productCard({title=MOSH.product,caption=MOSH.flavor,quantity='1 bar',price='',compact=false}={}) {
 return `<div class="sb-product-card${compact?' is-compact':''}">${brandProp('pouch')}<div class="sb-product-info"><span class="sb-wordmark">MOSH</span><h3>${escape(title)}</h3><p>${escape(caption)}</p><div class="sb-product-meta"><span>${escape(quantity)}</span>${price?`<b>${escape(price)}</b>`:''}</div></div></div>`;
}
// Averaged 5 × 9 samples of the two print faces give the small compatibility
// renderer the same colours at tabletop scale without another drawing pass.
const handMagnetSwatches=['1qBnr3lHrnhCy4k9nl8h5rZ/0Zlf15tTz4w+ZjUK6ryF2Z9eoGEmrmsnXi8K672H46plvHk2tHEsilUp6LN3zoY5r2wqtns+tHtH5qlgvns2jE4WvIZQk14x1pFHwn44cz4ShlQpSSQLx4U/mVogWCsKPx0HQiAKpGMkg0gSORkEQSAJZz0d','0qzIvZG33rDM9MLY9b3V8cnc8MPY8sHX8rrT6anJ9Mrc67fR877W6arK8LLP9Mfa8LvU6azL7K3M8bLO4rLM2qXE3qbF7rDN767Lypi6uYSsvoWttHql3Zu+4qzJzJS4zJC14J/A5qDC9bvU87XQ8K7M7ajH66LD77PN6qrH7KjH66TE6Z7B'];
const handMagnetModels=new WeakMap();
export function createHandheldMagnet(THREE,{software=false}={}){
 let models=handMagnetModels.get(THREE);
 if(!models){models={};handMagnetModels.set(THREE,models);}
 const key=software?'low':'full';
 if(!models[key]){
  const geometry=new THREE.BoxGeometry(.07,.13,.0015,5,9,1);
  const materials=[new THREE.MeshStandardMaterial({color:0xc8b7a0,roughness:.84})];
  const colors=new Float32Array(geometry.attributes.position.count*3).fill(1),c=new THREE.Color(),uv=geometry.attributes.uv;
  geometry.groups.forEach((group,index)=>{
   if(index<4){group.materialIndex=0;return;}
   const side=index-4,bytes=atob(handMagnetSwatches[side]);
   for(let k=group.start;k<group.start+group.count;k++){
    const id=geometry.index.getX(k),x=Math.min(4,Math.floor(uv.getX(id)*5)),y=Math.min(8,Math.floor((1-uv.getY(id))*9)),j=3*(y*5+x);
    c.setRGB(bytes.charCodeAt(j)/255,bytes.charCodeAt(j+1)/255,bytes.charCodeAt(j+2)/255,THREE.SRGBColorSpace);
    colors.set([c.r,c.g,c.b],id*3);
   }
   group.materialIndex=side+1;
   materials.push(new THREE.MeshStandardMaterial({color:0xffffff,roughness:.78,vertexColors:true}));
  });
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  models[key]={geometry,materials,requested:false};
 }
 const model=models[key],card=new THREE.Mesh(model.geometry,model.materials);
 card.name='Hommio 7 × 13 cm magnet';card.userData.dimensions={width:.07,height:.13,depth:.0015};
 if(!software)card.onBeforeRender=()=>{
  if(model.requested||typeof document==='undefined')return;
  model.requested=true;
  const loader=new THREE.TextureLoader();
  [BRAND_ASSETS.magnet,BRAND_ASSETS.magnetBack].forEach((href,side)=>{
   loader.load(href,map=>{const material=model.materials[side+1];map.colorSpace=THREE.SRGBColorSpace;material.map=map;material.vertexColors=false;material.needsUpdate=true;},undefined,()=>{});
  });
 };
 return card;
}

/** A small genuine 3D closed parcel. Use the photographic carton fallback for SVG-only rendering. */
export function createPackaging(THREE,{width=.38,height=.23,depth=.27}={}) {
 const group=new THREE.Group();group.name='MOSH small delivery carton';
 const cardboard=new THREE.MeshStandardMaterial({color:0xb68b5b,roughness:.96});
 const kraftTexture=makeTexture(THREE,512,512,ctx=>{ctx.fillStyle='#c39a69';ctx.fillRect(0,0,512,512);let seed=73;for(let i=0;i<13000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%512;seed=(seed*1664525+1013904223)>>>0;const y=seed%512;ctx.fillStyle=i%2?'#9e744119':'#f4d9b926';ctx.fillRect(x,y,1,1);}});
 const bodyMat=new THREE.MeshStandardMaterial({color:0xffffff,map:kraftTexture,roughness:.97});
 const box=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),bodyMat);box.castShadow=true;box.receiveShadow=true;group.add(box);
 const labelTexture=makeTexture(THREE,1024,512,ctx=>{
  ctx.fillStyle=MOSH.colors.pink;ctx.fillRect(0,0,1024,512);
  ctx.textAlign='center';ctx.fillStyle=MOSH.colors.purple;ctx.font='900 220px Arial, sans-serif';ctx.fillText('MOSH',512,280);
  ctx.fillStyle=MOSH.colors.ink;ctx.font='600 34px Arial, sans-serif';ctx.fillText('COOKIE DOUGH CRUNCH',512,380);
  ctx.font='24px Arial, sans-serif';ctx.fillText('GOOD THINGS INSIDE',512,444);
 });
 const labelMat=new THREE.MeshStandardMaterial({map:labelTexture,roughness:.79});
 const label=new THREE.Mesh(new THREE.PlaneGeometry(width*.78,height*.68),labelMat);label.position.set(0,-height*.015,depth/2+.001);group.add(label);
 const tapeMat=new THREE.MeshStandardMaterial({color:0xd7b789,roughness:.48,transparent:true,opacity:.75});
 const tape=new THREE.Mesh(new THREE.BoxGeometry(width*.2,.001,depth+.002),tapeMat);tape.position.y=height/2+.001;group.add(tape);
 const seam=new THREE.Mesh(new THREE.BoxGeometry(.002,.001,depth),cardboard);seam.position.y=height/2+.002;group.add(seam);
 const seal=new THREE.Mesh(new THREE.BoxGeometry(width*.18,.002,depth*.23),new THREE.MeshStandardMaterial({color:0x681cab,roughness:.8}));seal.position.set(0,height/2+.003,depth*.31);group.add(seal);
 group.userData.dimensions={width,height,depth};
 return group;
}
function makeTexture(THREE,width,height,paint){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;paint(canvas.getContext('2d'));const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;}
