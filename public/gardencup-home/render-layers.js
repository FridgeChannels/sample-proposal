// SVG fallback keeps the same articulated geometry, with per-actor furniture masks.
// WebGL uses real depth-writing proxies instead (spatial.js).
export function createSoftwareCompositor({renderer,scene,camera,cast,canvas,polygonsForActor,depthGroup}){
  const NS='http://www.w3.org/2000/svg',out=document.createElementNS(NS,'svg');
  out.id='software-world';out.setAttribute('aria-label','Animated family with furniture occlusion');
  renderer.domElement.remove();canvas.after(out);
  let width=1,height=1;
  function el(name,attrs={}){const n=document.createElementNS(NS,name);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n;}
  function resize(w,h){width=w;height=h;out.setAttribute('viewBox',`${-w/2} ${-h/2} ${w} ${h}`);out.setAttribute('width',w);out.setAttribute('height',h);}
  function render(){
    const defs=el('defs'),groups=[];depthGroup.visible=false;
    const ordered=[...cast].sort((a,b)=>a.y-b.y);
    cast.forEach(c=>{c.model.g.visible=false;});
    for(const c of ordered){
      c.model.g.visible=true;c.model.update?.();renderer.render(scene,camera);
      const group=el('g',{'data-actor':c.name});
      const drawX=c.x,drawY=c.y,polygons=polygonsForActor({...c,x:drawX,y:drawY});
      if(polygons.length){const mask=el('mask',{id:`furniture-${c.cell}`,maskUnits:'userSpaceOnUse',x:-width/2,y:-height/2,width,height});mask.append(el('rect',{x:-width/2,y:-height/2,width,height,fill:'white'}));for(const points of polygons)mask.append(el('polygon',{points:points.map(([x,y])=>`${(x/100-.5)*width},${(y/100-.5)*height}`).join(' '),fill:'black'}));defs.append(mask);group.setAttribute('mask',`url(#furniture-${c.cell})`);}
      if(c.state==='walking'||!String(c.activityPose).startsWith('sit'))group.append(el('ellipse',{cx:(drawX/100-.5)*width,cy:(drawY/100-.5)*height,rx:width*(c.cell<4?.007:.006),ry:height*.0022,fill:'#423d31',opacity:'.13'}));
      for(const n of renderer.domElement.childNodes)group.append(n.cloneNode(true));
      groups.push(group);c.model.g.visible=false;
    }
    cast.forEach(c=>{c.model.g.visible=true;});out.replaceChildren(defs,...groups);
  }
  return{resize,render,domElement:out};
}
