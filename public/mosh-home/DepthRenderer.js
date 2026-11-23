import * as THREE from './engine.js';

// Small CPU triangle renderer for environments without WebGL. Unlike SVG's
// painter ordering, every fragment is tested against a real floating-point depth
// buffer. Intended for the isolated outdoor delivery scene, not a WebGL clone.
const STRIDE=16;
const clipCode=(x,y,z,w)=>(x < -w?1:0)|(x>w?2:0)|(y < -w?4:0)|(y>w?8:0)|(z < -w?16:0)|(z>w?32:0);
const linearToSRGB=new Uint8ClampedArray(8193);
for(let i=0;i<linearToSRGB.length;i++){const v=i/8192;linearToSRGB[i]=Math.round(255*(v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055));}
const toByte=v=>linearToSRGB[Math.max(0,Math.min(8192,Math.round(v*8192)))];

export class DepthRenderer {
 constructor({canvas,scale=.72,maxDimension=1200}={}){
  this.domElement=canvas||document.createElement('canvas');
  this.context=this.domElement.getContext('2d',{alpha:true,willReadFrequently:false});
  if(!this.context)throw new Error('Canvas2D is required for DepthRenderer');
  this.scale=scale;this.maxDimension=maxDimension;this.pixelRatio=1;
  this.clearColor=new THREE.Color(0);this.clearAlpha=0;this.autoClear=true;
  this.outputColorSpace=THREE.SRGBColorSpace;this.toneMappingExposure=1;
  this.shadowMap={enabled:false};this.info={render:{triangles:0,calls:0}};
  this._cache=new WeakMap();this._frustum=new THREE.Frustum();this._mvp=new THREE.Matrix4();this._vp=new THREE.Matrix4();this._normal=new THREE.Matrix3();
  this._vector=new THREE.Vector3();this._target=new THREE.Vector3();this._transparent=[];
  this.setSize(1,1,false);
 }
 setPixelRatio(value){this.pixelRatio=Math.max(.25,value||1);this.setSize(this.cssWidth,this.cssHeight);}
 getPixelRatio(){return this.pixelRatio;}
 setPrecision(){} // Drop-in compatibility with the former SVG fallback.
 setClearColor(color,alpha=1){this.clearColor.set(color);this.clearAlpha=alpha;}
 getSize(target){return target.set(this.cssWidth,this.cssHeight);}
 setSize(width,height,updateStyle=true){
  this.cssWidth=Math.max(1,width||1);this.cssHeight=Math.max(1,height||1);
  const ratio=Math.min(this.scale*this.pixelRatio,this.maxDimension/Math.max(this.cssWidth,this.cssHeight));
  const w=Math.max(1,Math.round(this.cssWidth*ratio)),h=Math.max(1,Math.round(this.cssHeight*ratio));
  if(updateStyle){this.domElement.style.width=this.cssWidth+'px';this.domElement.style.height=this.cssHeight+'px';}
  if(w===this.width&&h===this.height)return;
  this.width=w;this.height=h;this.domElement.width=w;this.domElement.height=h;
  this.depth=new Float32Array(w*h);this.color=new Float32Array(w*h*4);
  this.image=this.context.createImageData(w,h);
  this._packedImage=new Uint32Array(this.image.data.buffer,this.image.data.byteOffset,w*h);
  this._dirty=new Uint32Array(Math.min(w*h,16384));this._dirtyCount=0;this._dense=false;
 }
 clear(resetDepth=true){
  if(resetDepth)this.depth.fill(Infinity);
  const colors=this.color;
  if(this.clearAlpha){
   const k=this.clearColor;
   for(let i=0;i<colors.length;i+=4){colors[i]=k.r;colors[i+1]=k.g;colors[i+2]=k.b;colors[i+3]=this.clearAlpha;}
   this._dense=true;
  }else if(this._dense){
   colors.fill(0);this._packedImage.fill(0);this._dense=false;
  }else{
   // Only occupied pixels need clearing. The landscape between a person
   // at the fridge and another in the living room stays transparent.
   for(let i=0;i<this._dirtyCount;i++){
    const pixel=this._dirty[i];colors[pixel*4+3]=0;this._packedImage[pixel]=0;
   }
  }
  this._dirtyCount=0;
 }
 _growDirty(){
  const pixels=new Uint32Array(Math.min(this.width*this.height,this._dirty.length*2));
  pixels.set(this._dirty);this._dirty=pixels;
 }
 _lights(scene){
  const ambient=[.035,.035,.035],hemis=[],directions=[];
  scene.traverseVisible(o=>{
   if(!o.isLight)return;const c=o.color,intensity=o.intensity;
   if(o.isAmbientLight){ambient[0]+=c.r*intensity*.65;ambient[1]+=c.g*intensity*.65;ambient[2]+=c.b*intensity*.65;}
   if(o.isHemisphereLight){o.getWorldPosition(this._vector).normalize();hemis.push({x:this._vector.x,y:this._vector.y,z:this._vector.z,sky:[c.r,c.g,c.b],ground:[o.groundColor.r,o.groundColor.g,o.groundColor.b],intensity:intensity*.5});}
   if(o.isDirectionalLight){o.getWorldPosition(this._vector);o.target.getWorldPosition(this._target);this._vector.sub(this._target).normalize();directions.push({x:this._vector.x,y:this._vector.y,z:this._vector.z,r:c.r*intensity,g:c.g*intensity,b:c.b*intensity});}
  });
  // Hemisphere irradiance is affine in the normal. Combine its constant
  // and directional terms once for the frame, including the reverse face.
  const gradient=new Float64Array(9);
  for(const h of hemis)for(let ch=0;ch<3;ch++){
   const gain=(h.sky[ch]-h.ground[ch])*h.intensity*.5;
   ambient[ch]+=(h.ground[ch]+h.sky[ch])*h.intensity*.5;
   gradient[ch*3]+=gain*h.x;gradient[ch*3+1]+=gain*h.y;gradient[ch*3+2]+=gain*h.z;
  }
  const vertical=gradient[0]===0&&gradient[2]===0&&gradient[3]===0&&gradient[5]===0&&gradient[6]===0&&gradient[8]===0;
  const key=JSON.stringify([ambient,Array.from(gradient),directions]);
  return {ambient,gradient,vertical,directions,key};
 }
 render(scene,camera){
  scene.updateMatrixWorld();camera.updateMatrixWorld();camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  this._vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);this._frustum.setFromProjectionMatrix(this._vp);
  const saved=this._staticDepth;
  const reuseDepth=this.staticOccluders?.visible&&saved&&saved.group===this.staticOccluders&&saved.width===this.width&&saved.height===this.height&&this._vp.elements.every((n,i)=>n===saved.matrix[i]);
  if(this.autoClear)this.clear(!reuseDepth);
  this.info.render={triangles:0,calls:0};this._transparent.length=0;
  const lights=this._lights(scene);
  const meshes=[];scene.traverseVisible(object=>{if(object.isMesh&&object.geometry?.attributes.position&&(object.frustumCulled===false||this._frustum.intersectsObject(object)))meshes.push(object);});
  // Photograph-furniture proxies have renderOrder -100 and colorWrite false.
  // Their depth prepass must precede color so occluded image pixels stay clear.
  meshes.sort((a,b)=>(a.renderOrder||0)-(b.renderOrder||0));
  // The house camera and furniture stay fixed even when the CSS camera pans.
  // Keep their immutable depth prepass and rebuild it on a projection or size change.
  if(this.staticOccluders?.visible){
   const matrix=this._vp.elements;
   if(reuseDepth){
    this.depth.set(saved.depth);
   }else{
    for(const object of meshes)if(object.parent===this.staticOccluders)this._drawMesh(object,camera,lights);
    this._staticDepth={group:this.staticOccluders,width:this.width,height:this.height,matrix:matrix.slice(),depth:this.depth.slice()};
   }
  }
  for(const object of meshes){if(object.parent===this.staticOccluders)continue;if(object.isSkinnedMesh)object.skeleton.update();this._drawMesh(object,camera,lights);}
  this._transparent.sort((a,b)=>b.z-a.z);
  for(const t of this._transparent)this._raster(t.a,t.b,t.c,t.material);
  const c=this.color,pixels=this.image.data,exposure=this.toneMappingExposure||1;
  const count=this._dense?this.width*this.height:this._dirtyCount;
  for(let n=0;n<count;n++){
   const i=(this._dense?n:this._dirty[n])*4;
   pixels[i]=toByte(c[i]*exposure);pixels[i+1]=toByte(c[i+1]*exposure);
   pixels[i+2]=toByte(c[i+2]*exposure);pixels[i+3]=Math.round(Math.min(1,c[i+3])*255);
  }
  this.context.putImageData(this.image,0,0);
 }
 _drawMesh(object,camera,lights){
  const geometry=object.geometry,p=geometry.attributes.position,n=geometry.attributes.normal,vc=geometry.attributes.color,index=geometry.index?.array;
  const count=p.count;let cached=this._cache.get(object);
  if(!cached||cached.length<count*STRIDE){cached=new Float64Array(count*STRIDE);this._cache.set(object,cached);}
  this._mvp.multiplyMatrices(this._vp,object.matrixWorld);const matrix=this._mvp.elements;
  this._normal.getNormalMatrix(object.matrixWorld);const nm=this._normal.elements;
  const {ambient,gradient,vertical,directions}=lights;
  // Only fixed-topology appliance meshes opt in. A hinge or camera move
  // invalidates the projection, while a changed lamp invalidates shading.
  let stamp;
  if(object.userData.cacheProjectedVertices){
   stamp=cached.stamp??={world:new THREE.Matrix4(),view:new THREE.Matrix4()};
   if(stamp.p===p&&stamp.pVersion===p.version&&stamp.n===n&&stamp.nVersion===n?.version&&stamp.vc===vc&&stamp.vcVersion===vc?.version&&stamp.light===lights.key&&stamp.width===this.width&&stamp.height===this.height&&stamp.world.equals(object.matrixWorld)&&stamp.view.equals(this._vp))stamp.valid=true;
   else{
    Object.assign(stamp,{valid:false,p,pVersion:p.version,n,nVersion:n?.version,vc,vcVersion:vc?.version,light:lights.key,width:this.width,height:this.height});
    stamp.world.copy(object.matrixWorld);stamp.view.copy(this._vp);
   }
  }
  if(!stamp?.valid)for(let i=0;i<count;i++){
   let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   if(object.isSkinnedMesh){this._vector.set(x,y,z);object.applyBoneTransform(i,this._vector);x=this._vector.x;y=this._vector.y;z=this._vector.z;}
   const j=i*STRIDE,cx=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],cy=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],cz=matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14],cw=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];
   cached[j]=cx;cached[j+1]=cy;cached[j+2]=cz;cached[j+3]=cw;cached[j+13]=clipCode(cx,cy,cz,cw);
   cached[j+14]=(cx/cw*.5+.5)*this.width;
   cached[j+15]=(.5-cy/cw*.5)*this.height;
   let nx=n?n.getX(i):0,ny=n?n.getY(i):1,nz=n?n.getZ(i):0;
   const tx=nm[0]*nx+nm[3]*ny+nm[6]*nz,ty=nm[1]*nx+nm[4]*ny+nm[7]*nz,tz=nm[2]*nx+nm[5]*ny+nm[8]*nz,len=Math.sqrt(tx*tx+ty*ty+tz*tz)||1;nx=tx/len;ny=ty/len;nz=tz/len;
   let hr=gradient[1]*ny,hg=gradient[4]*ny,hb=gradient[7]*ny;
   if(!vertical){hr+=gradient[0]*nx+gradient[2]*nz;hg+=gradient[3]*nx+gradient[5]*nz;hb+=gradient[6]*nx+gradient[8]*nz;}
   let r=ambient[0]+hr,g=ambient[1]+hg,b=ambient[2]+hb,br=ambient[0]-hr,bg=ambient[1]-hg,bb=ambient[2]-hb;
   for(const l of directions){const dot=nx*l.x+ny*l.y+nz*l.z;if(dot>0){r+=dot*l.r;g+=dot*l.g;b+=dot*l.b;}else{br-=dot*l.r;bg-=dot*l.g;bb-=dot*l.b;}}
   cached[j+4]=r;cached[j+5]=g;cached[j+6]=b;cached[j+7]=br;cached[j+8]=bg;cached[j+9]=bb;
   cached[j+10]=vc?vc.getX(i):1;cached[j+11]=vc?vc.getY(i):1;cached[j+12]=vc?vc.getZ(i):1;
  }
  const groups=Array.isArray(object.material)&&geometry.groups.length?geometry.groups:[{start:0,count:index?index.length:count,materialIndex:0}],materials=Array.isArray(object.material)?object.material:[object.material];
  const drawStart=geometry.drawRange.start||0,drawEnd=drawStart+geometry.drawRange.count,negative=object.matrixWorld.determinant()<0;
  const vertex=(id,material,back)=>{const j=id*STRIDE,k=back?7:4,c=material.color||{r:1,g:1,b:1},e=material.emissive,ei=material.emissiveIntensity??1,unlit=material.isMeshBasicMaterial,colors=material.vertexColors;return [cached[j],cached[j+1],cached[j+2],cached[j+3],c.r*(colors?cached[j+10]:1)*(unlit?1:cached[j+k])+(e?e.r*ei:0),c.g*(colors?cached[j+11]:1)*(unlit?1:cached[j+k+1])+(e?e.g*ei:0),c.b*(colors?cached[j+12]:1)*(unlit?1:cached[j+k+2])+(e?e.b*ei:0)];};
  for(const group of groups){const material=materials[Array.isArray(object.material)?group.materialIndex||0:0];if(!material||!material.visible||material.opacity===0)continue;this.info.render.calls++;
   const start=Math.max(group.start,drawStart),end=Math.min(group.start+group.count,drawEnd,index?index.length:count);
   for(let k=start;k+2<end;k+=3){const ia=index?index[k]:k,ib=index?index[k+1]:k+1,ic=index?index[k+2]:k+2,ja=ia*STRIDE,jb=ib*STRIDE,jc=ic*STRIDE,ca=cached[ja+13],cb=cached[jb+13],cc=cached[jc+13];if(ca&cb&cc)continue;
    // Most distant character triangles fit between pixel centres. Reject those
    // before constructing their shaded vertex arrays. Clipped triangles still
    // go through the full camera-space path, including near-plane crossings.
    if(!(ca|cb|cc)){
     const ax=cached[ja+14],bx=cached[jb+14],cx=cached[jc+14];
     const minX=Math.ceil(Math.min(ax,bx,cx)-.50000001),maxX=Math.floor(Math.max(ax,bx,cx)-.49999999);
     if(minX>maxX)continue;
     const ay=cached[ja+15],by=cached[jb+15],cy=cached[jc+15];
     const minY=Math.ceil(Math.min(ay,by,cy)-.50000001),maxY=Math.floor(Math.max(ay,by,cy)-.49999999);
     if(minY>maxY)continue;
     if(minX===maxX&&minY===maxY){
      const x=minX+.5,y=minY+.5;
      const ab=(bx-ax)*(y-ay)-(by-ay)*(x-ax),bc=(cx-bx)*(y-by)-(cy-by)*(x-bx),ca=(ax-cx)*(y-cy)-(ay-cy)*(x-cx);
      if(Math.min(ab,bc,ca)<-1e-7&&Math.max(ab,bc,ca)>1e-7)continue;
     }
    }
    const determinant=cached[ja]*(cached[jb+1]*cached[jc+3]-cached[jb+3]*cached[jc+1])-cached[ja+1]*(cached[jb]*cached[jc+3]-cached[jb+3]*cached[jc])+cached[ja+3]*(cached[jb]*cached[jc+1]-cached[jb+1]*cached[jc]);
    const front=(determinant>0)!==negative;
    if(material.side===THREE.FrontSide&&!front||material.side===THREE.BackSide&&front)continue;
    const a=vertex(ia,material,!front),b=vertex(ib,material,!front),c=vertex(ic,material,!front);
    if(!(ca|cb|cc))this._triangle(a,b,c,material);else{
     let polygon=[a,b,c];
     for(let plane=0;plane<6&&polygon.length;plane++){
      const axis=plane>>1,sign=plane%2?-1:1,next=[];
      for(let j=0;j<polygon.length;j++){const u=polygon[j],v=polygon[(j+1)%polygon.length],du=u[3]+sign*u[axis],dv=v[3]+sign*v[axis],insideU=du>=0,insideV=dv>=0;if(insideU)next.push(u);if(insideU!==insideV){const t=du/(du-dv);next.push(u.map((x,n)=>x+(v[n]-x)*t));}}polygon=next;
     }
     for(let j=1;j<polygon.length-1;j++)this._triangle(polygon[0],polygon[j],polygon[j+1],material);
    }
   }
  }
 }
 _triangle(a,b,c,material){
  this.info.render.triangles++;
  if(material.transparent&&material.opacity<1)this._transparent.push({a,b,c,material,z:(a[2]/a[3]+b[2]/b[3]+c[2]/c[3])/3});
  else this._raster(a,b,c,material);
 }
 _raster(a,b,c,material){
  const w=this.width,h=this.height;
  let ax=(a[0]/a[3]*.5+.5)*w,ay=(.5-a[1]/a[3]*.5)*h,bx=(b[0]/b[3]*.5+.5)*w,by=(.5-b[1]/b[3]*.5)*h,cx=(c[0]/c[3]*.5+.5)*w,cy=(.5-c[1]/c[3]*.5)*h;
  let area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);if(Math.abs(area)<1e-8)return;
  if(area<0){const temp=b;b=c;c=temp;[bx,cx]=[cx,bx];[by,cy]=[cy,by];area=-area;}
  const minX=Math.max(0,Math.ceil(Math.min(ax,bx,cx)-.50000001)),maxX=Math.min(w-1,Math.floor(Math.max(ax,bx,cx)-.49999999)),minY=Math.max(0,Math.ceil(Math.min(ay,by,cy)-.50000001)),maxY=Math.min(h-1,Math.floor(Math.max(ay,by,cy)-.49999999));if(minX>maxX||minY>maxY)return;
  const invArea=1/area,a0=by-cy,b0=cx-bx,c0=bx*cy-cx*by,a1=cy-ay,b1=ax-cx,c1=cx*ay-ax*cy,a2=ay-by,b2=bx-ax,c2=ax*by-bx*ay;
  const ia=1/a[3],ib=1/b[3],ic=1/c[3],za=a[2]*ia,zb=b[2]*ib,zc=c[2]*ic;
  const perspective=Math.abs(ia-ib)+Math.abs(ia-ic)>1e-9;
  const flat=Math.abs(a[4]-b[4])+Math.abs(a[4]-c[4])+Math.abs(a[5]-b[5])+Math.abs(a[5]-c[5])+Math.abs(a[6]-b[6])+Math.abs(a[6]-c[6])<1e-8;
  const opacity=material.transparent?material.opacity:1,transparent=opacity<1,depthTest=material.depthTest!==false,depthWrite=material.depthWrite!==false,colorWrite=material.colorWrite!==false,zBias=material.polygonOffset?material.polygonOffsetUnits*1e-6:0;
  const depth=this.depth,colors=this.color,tl0=a0>0||(a0===0&&b0>0),tl1=a1>0||(a1===0&&b1>0),tl2=a2>0||(a2===0&&b2>0);
  for(let y=minY;y<=maxY;y++){
   const py=y+.5,px=minX+.5;let e0=a0*px+b0*py+c0,e1=a1*px+b1*py+c1,e2=a2*px+b2*py+c2;
   for(let x=minX;x<=maxX;x++,e0+=a0,e1+=a1,e2+=a2){
    if((e0<=1e-8&&(!tl0||e0 < -1e-8))||(e1<=1e-8&&(!tl1||e1 < -1e-8))||(e2<=1e-8&&(!tl2||e2 < -1e-8)))continue;
    const l0=e0*invArea,l1=e1*invArea,l2=e2*invArea,z=l0*za+l1*zb+l2*zc+zBias,pixel=y*w+x;
    if(depthTest&&z>depth[pixel]+1e-7)continue;
    if(depthWrite)depth[pixel]=z;if(!colorWrite)continue;
    let r,g,blue;
    if(flat){r=a[4];g=a[5];blue=a[6];}
    else if(perspective){const q0=l0*ia,q1=l1*ib,q2=l2*ic,inv=1/(q0+q1+q2);r=(q0*a[4]+q1*b[4]+q2*c[4])*inv;g=(q0*a[5]+q1*b[5]+q2*c[5])*inv;blue=(q0*a[6]+q1*b[6]+q2*c[6])*inv;}
    else{r=l0*a[4]+l1*b[4]+l2*c[4];g=l0*a[5]+l1*b[5]+l2*c[5];blue=l0*a[6]+l1*b[6]+l2*c[6];}
    const offset=pixel*4;
    if(!this._dense&&colors[offset+3]===0){
     if(this._dirtyCount===this._dirty.length)this._growDirty();
     this._dirty[this._dirtyCount++]=pixel;
    }
    if(transparent){const oldAlpha=colors[offset+3],newAlpha=opacity+oldAlpha*(1-opacity),retain=oldAlpha*(1-opacity);colors[offset]=(r*opacity+colors[offset]*retain)/newAlpha;colors[offset+1]=(g*opacity+colors[offset+1]*retain)/newAlpha;colors[offset+2]=(blue*opacity+colors[offset+2]*retain)/newAlpha;colors[offset+3]=newAlpha;}
    else{colors[offset]=r;colors[offset+1]=g;colors[offset+2]=blue;colors[offset+3]=1;}
   }
  }
 }
 dispose(){this._cache=new WeakMap();this.depth=null;this.color=null;this.image=null;}
}

export function createDepthRenderer(canvas,options={}){return new DepthRenderer({...options,canvas});}
