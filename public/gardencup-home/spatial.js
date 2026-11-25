import {walls} from './architecture.js';
/**
 * Spatial calibration for the fixed house photograph.
 * Percent coordinates are projected floor-contact points, never tabletop points.
 * At the current camera, one vertical world unit projects ~3.79% image height.
 * Depth-only proxies preserve the original furniture pixels while occluding actors.
 */
export const seatConfig = {
  meal0:{hipHeight:.72,facing:[70.8,51.9],kind:'chair'},
  meal1:{hipHeight:.72,facing:[70.0,51.9],kind:'chair'},
  meal2:{hipHeight:.72,facing:[70.4,52.5],kind:'chair'},
  meal3:{hipHeight:.82,facing:[70.4,49.8],kind:'chair'},
  sofa0:{hipHeight:.76,facing:[45.2,70.8],kind:'sofa'},
  sofa1:{hipHeight:.76,facing:[49.4,71.0],kind:'sofa'},
  sofa2:{hipHeight:.76,facing:[52.8,71.2],kind:'sofa'},
  sofa3:{hipHeight:.84,facing:[54.0,76.2],kind:'armchair'},
  game0:{hipHeight:.26,facing:[51.1,67.3],kind:'floor'},
  game1:{hipHeight:.26,facing:[51.1,67.3],kind:'floor'},
  game2:{hipHeight:.26,facing:[51.1,67.3],kind:'floor'},
  game3:{hipHeight:.26,facing:[51.1,67.3],kind:'floor'}
};

// The top polygons trace actual furniture pixels in assets/house.png.
export const furnitureOccluders = [
  {id:'island',height:1.35,solid:true,top:[[45.3,32.3],[56.8,32.3],[57.95,36.25],[45.45,36.35]],groundFront:41.5},
  {id:'dining-table',height:1.06,thickness:.10,top:[[67.25,43.3],[72.5,42.9],[76.05,52.65],[68.5,53.15]],legs:true,groundFront:57.2},
  {id:'coffee-table',height:.61,thickness:.09,top:[[48.1,63.1],[50.3,62.6],[52.7,63.2],[54.2,64.5],[54.2,66.0],[52.7,67.1],[49.4,67.4],[47.7,66.4],[47.4,64.8]],legs:true,groundFront:69.7},
  {id:'sofa-seat',height:.64,solid:true,top:[[41.7,56.2],[56.1,56.2],[56.1,59.7],[41.8,59.8]],groundFront:62.2},
  {id:'sofa-back',height:1.33,solid:true,top:[[41.7,51.2],[56.5,51.5],[56.5,53.2],[41.7,52.8]],groundFront:58.2},
  {id:'armchair',height:.65,solid:true,top:[[59.1,64.1],[61.2,64.7],[62.8,66.7],[60.5,68.0],[58.4,66.7]],groundFront:70.5}
];

// Thin rails and slats preserve the photographed chairs in front of seated
// bodies. These are depth/mask contours, not opaque replacement furniture.
function chairRails(corners){
 const [tl,tr,br,bl]=corners;
 const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 const quad=(u0,u1,v0,v1)=>[mix(mix(tl,tr,u0),mix(bl,br,u0),v0),mix(mix(tl,tr,u1),mix(bl,br,u1),v0),mix(mix(tl,tr,u1),mix(bl,br,u1),v1),mix(mix(tl,tr,u0),mix(bl,br,u0),v1)];
 const rails=[quad(0,1,0,.14),quad(0,.085,0,1),quad(.915,1,0,1)];
 for(let i=1;i<=5;i++){const u=i/6;rails.push(quad(u-.026,u+.026,.12,.94));}
 return rails;
}
export const chairOccluders=[
 {id:'chair-front',seat:'meal3',floor:[72.8,60.5],height:.78,frontY:60.9,polygons:chairRails([[71.5,53.7],[74.5,53.45],[74.0,57.8],[71.8,58.0]])},
 {id:'chair-left',seat:'meal0',floor:[65.6,53.0],height:.8,frontY:53.0,polygons:chairRails([[64.7,45.4],[65.5,45.5],[66.5,51.3],[65.8,51.4]])},
 {id:'chair-right',seat:'meal1',floor:[76.5,52.6],height:.8,frontY:52.6,polygons:chairRails([[76.3,44.1],[76.8,44.4],[75.6,50.3],[74.9,50.0]])},
 {id:'chair-back',seat:'meal2',floor:[68.7,44.0],height:.75,frontY:44.0,polygons:chairRails([[67.55,40.65],[69.65,40.55],[69.6,43.1],[67.5,43.2]])}
];

// Ground footprints are for routing, not clipping. Seat leaves enter a cushion
// deliberately, while transit edges remain outside these footprints.
export const obstacleFootprints = [
  {id:'island',polygon:[[45.3,37.4],[56.8,37.4],[57.95,41.36],[45.45,41.46]]},
  {id:'dining-table',polygon:[[67.25,47.3],[72.5,46.9],[76.05,56.65],[68.5,57.15]]},
  {id:'coffee-table',polygon:[[48.1,65.4],[50.3,64.9],[52.7,65.5],[54.2,66.8],[54.2,68.3],[52.7,69.4],[49.4,69.7],[47.7,68.7],[47.4,67.1]]},
  {id:'sofa',polygon:[[41.7,56.2],[56.5,56.5],[56.5,62.2],[41.8,62.2]]},
  {id:'armchair',polygon:[[59.1,66.6],[61.2,67.2],[62.8,69.2],[60.5,70.5],[58.4,69.2]]}
];

export function pointInPolygon(point, polygon) {
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const a=polygon[i],b=polygon[j];
    if((a[1]>point[1])!==(b[1]>point[1]) && point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}

export function segmentIntersectsInterior(a,b,polygon) {
  // Sample the entire segment sufficiently densely for small image-space obstacles.
  const count=Math.max(2,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*10));
  for(let i=1;i<count;i++){const t=i/count;if(pointInPolygon([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],polygon))return true;}
  return false;
}

export function createDepthOccluders(THREE,world,camera,scene) {
  const group=new THREE.Group();group.name='Photograph furniture depth';group.renderOrder=-100;
  const material=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:true,depthTest:true,side:THREE.DoubleSide});
  const ray=new THREE.Raycaster();
  function atHeight(point,height){ray.setFromCamera(new THREE.Vector2(point[0]/50-1,1-point[1]/50),camera);return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-height),new THREE.Vector3());}
  function mesh(vertices,indices){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flatMap(v=>v.toArray()),3));geometry.setIndex(indices);geometry.computeVertexNormals();const m=new THREE.Mesh(geometry,material);m.renderOrder=-100;group.add(m);return m;}
  for(const run of walls){
    const a=world(...run.a),b=world(...run.b);
    const topA=a.clone(),topB=b.clone();topA.y=topB.y=run.height;
    mesh([a,b,topB,topA],[0,1,2,0,2,3]).name=run.name+' wall';
  }
  for(const item of furnitureOccluders){
    const top=item.top.map(p=>atHeight(p,item.height));
    const lower=top.map(v=>new THREE.Vector3(v.x,item.solid?0:item.height-item.thickness,v.z));
    const triangles=THREE.ShapeUtils.triangulateShape(item.top.map(p=>new THREE.Vector2(...p)),[]).flat();
    mesh(top,triangles).name=item.id+' top';
    for(let i=0;i<top.length;i++){const j=(i+1)%top.length;mesh([top[i],top[j],lower[j],lower[i]],[0,1,2,0,2,3]).name=item.id+' edge';}
    if(item.legs){
      const corners=item.id==='coffee-table'?[0,2,4,6]:[0,1,2,3];
      for(const k of corners){const v=top[k];const leg=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,item.height,6),material);leg.position.set(v.x,item.height/2,v.z);leg.renderOrder=-100;group.add(leg);}
    }
  }
  // Tall foreground vase/flowers are included, so a person behind the island
  // does not render over the flowers from the fixed photograph.
  const decorations=[
    {polygon:[[47.15,32.7],[47.25,31.8],[48.2,30.6],[49.2,31.4],[49.55,32.9],[48.95,34.15],[48.05,34.5]],height:1.8},
    {polygon:[[70.5,44.2],[70.65,42.5],[71.5,41.6],[72.65,42.2],[73.4,43.4],[72.85,45.1],[72.4,47.1],[71.3,47.2]],height:1.55}
  ];
  // A camera-facing contour at a representative depth matches the raster silhouette.
  const towardCamera=camera.position.clone().sub(world(50,50)).normalize();
  for(const d of decorations){const center=d.polygon.reduce((s,p)=>[s[0]+p[0]/d.polygon.length,s[1]+p[1]/d.polygon.length],[0,0]);const anchor=atHeight(center,d.height);const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(towardCamera,anchor);const vertices=d.polygon.map(p=>{ray.setFromCamera(new THREE.Vector2(p[0]/50-1,1-p[1]/50),camera);return ray.ray.intersectPlane(plane,new THREE.Vector3());});mesh(vertices,THREE.ShapeUtils.triangulateShape(d.polygon.map(p=>new THREE.Vector2(...p)),[]).flat()).name='Flowers depth';}
  for(const chair of chairOccluders){
    const anchor=world(...chair.floor).clone();anchor.y=chair.height;
    const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(towardCamera,anchor);
    for(const polygon of chair.polygons){const vertices=polygon.map(p=>{ray.setFromCamera(new THREE.Vector2(p[0]/50-1,1-p[1]/50),camera);return ray.ray.intersectPlane(plane,new THREE.Vector3());});mesh(vertices,[0,1,2,0,2,3]).name=chair.id;}
  }
  scene.add(group);return group;
}

/**
 * SVGRenderer has no depth buffer. Render actors individually and subtract these
 * percent polygons from each actor's mask. Ground-y threshold chooses whether
 * this actor is behind the furniture; foreground actors stay fully visible.
 */
export function occlusionPolygonsForActor(actor) {
  const out=[];
  for(const item of furnitureOccluders){
    const minX=Math.min(...item.top.map(p=>p[0]))-2.6,maxX=Math.max(...item.top.map(p=>p[0]))+2.6;
    if(actor.x<minX||actor.x>maxX||actor.y>=item.groundFront-.15)continue;
    // Seated occupants are in front of their own sofa back, but above the seat.
    if(actor.node?.startsWith('sofa')&&['sofa-seat','sofa-back','armchair'].includes(item.id))continue;
    out.push(item.top);
    const drop=item.solid?item.height*3.787:item.thickness*3.787;
    for(let i=0;i<item.top.length;i++){const a=item.top[i],b=item.top[(i+1)%item.top.length];out.push([a,b,[b[0],b[1]+drop],[a[0],a[1]+drop]]);}
  }
  for(const chair of chairOccluders){
    const minX=Math.min(...chair.polygons.flat().map(p=>p[0]))-2,maxX=Math.max(...chair.polygons.flat().map(p=>p[0]))+2;
    if(actor.x<minX||actor.x>maxX)continue;
    // The near dining-chair back is between the camera and its occupant.
    if(actor.node===chair.seat&&chair.id==='chair-front'||actor.y<chair.frontY-.3)out.push(...chair.polygons);
  }
  return out;
}
