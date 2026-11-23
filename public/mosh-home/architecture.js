// Floor-contact measurements in the original house projection. Wall runs end
// at the jambs. The width left between runs is the actual walkable aperture.
export const walls=[];
function wall(name,points,height=1.42){
 for(let i=1;i<points.length;i++){
  walls.push({name,a:points[i-1],b:points[i],height});
 }
}
wall('front west',[[1.3,87.7],[25.5,88.1],[25.5,89.1],[45.85,89.1]],2.35);
wall('front east',[[50.15,89.1],[66.0,89.1],[66.0,87.8],[88.5,87.8]],2.35);
wall('west exterior',[[1.3,87.7],[1.1,62.7],[2.8,41.0],[4.7,18.8]]);
wall('north exterior',[[4.7,18.8],[37.8,18.8],[63.7,18.8],[73.7,18.8]]);
wall('garage interior',[[73.7,18.8],[75.4,32.5],[79.2,32.5],[79.4,37.1],[82.2,37.1],[88.5,87.8]]);
wall('primary bedroom south',[[2.8,41.2],[20.6,41.2],[20.6,42.6],[28.9,42.6]]);
wall('primary bathroom west',[[27.7,19.0],[27.5,30.1],[30.0,30.1]]);
wall('primary bathroom east',[[33.8,34.1],[38.0,34.1],[37.7,18.8]]);
wall('hall bath east',[[28.9,42.6],[32.0,42.6],[31.8,55.4],[26.2,55.4]]);
wall('hall bath west',[[20.6,42.6],[20.5,49.6],[23.1,49.6]]);
wall('kids bedroom divider',[[1.7,62.4],[18.4,62.4],[18.4,63.7],[27.1,63.7]]);
wall('kids bedroom east',[[27.0,69.5],[26.6,80.1],[28.0,81.1],[28.1,88.4]]);
wall('utility rear',[[63.9,19.0],[63.9,29.4]]);
wall('utility front',[[67.2,36.2],[74.9,36.2],[75.4,32.5]],1.04);
wall('kitchen cabinet',[[38.8,31.6],[62.5,31.6]],1.04);

// Each bucket already includes clearance for shoulders, muzzles and haunches.
// Queries use a squared distance to a segment in the same metric as locomotion.
const cellSize=5, width=.18, reach=4;
const buckets=new Map();
const key=(x,y)=>x*256+y;
for(const {a,b} of walls){
 const x=a[0],y=a[1]*.75,dx=b[0]-x,dy=b[1]*.75-y;
 const segment={x,y,dx,dy,length2:dx*dx+dy*dy};
 const minX=Math.floor((Math.min(x,x+dx)-reach)/cellSize),maxX=Math.floor((Math.max(x,x+dx)+reach)/cellSize);
 const minY=Math.floor((Math.min(y,y+dy)-reach)/cellSize),maxY=Math.floor((Math.max(y,y+dy)+reach)/cellSize);
 for(let i=minX;i<=maxX;i++)for(let j=minY;j<=maxY;j++){
  const k=key(i,j);
  if(!buckets.has(k))buckets.set(k,[]);
  buckets.get(k).push(segment);
 }
}
export function wallClearance(x,y){
 const nearby=buckets.get(key(Math.floor(x/cellSize),Math.floor(y/cellSize)));
 if(!nearby)return Infinity;
 let best=Infinity;
 for(const s of nearby){
  const rx=x-s.x,ry=y-s.y;
  const t=Math.max(0,Math.min(1,(rx*s.dx+ry*s.dy)/s.length2));
  const dx=rx-t*s.dx,dy=ry-t*s.dy;
  best=Math.min(best,dx*dx+dy*dy);
 }
 return Math.sqrt(best)-width;
}

// A pet's nose and tail extend beyond the paw footprint. Sample its long
// axis in projected metres, with a narrower clearance at either end.
export function petFits(cell,x,y,dx,dy){
 const meters=Math.hypot(dx*.22,dy*.282);
 if(meters<1e-8)return true;
 const cat=cell===5;
 const front=cat?.37:.70,back=cat?.45:.96;
 dx/=meters;dy/=meters;
 return wallClearance(x+dx*front,y+dy*front)>(cat?.14:.25)
    && wallClearance(x+dx*front*.52,y+dy*front*.52)>(cat?.35:.56)
    && wallClearance(x-dx*back*.51,y-dy*back*.51)>(cat?.32:.57)
    && wallClearance(x-dx*back,y-dy*back)>(cat?.12:.14);
}
