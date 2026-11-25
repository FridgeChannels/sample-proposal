// The aperture and hinged leaf share the photograph's original 4:3 coordinates.
// A delivery driver waiting on the porch never opens the family's front door.
export function shouldOpenDoor(cast){
 return cast.some(c=>c.cell===4&&c.x>44.8&&c.x<51.2&&c.y>77.5&&c.y<93.5&&(c.state==='walking'||c.node==='threshold'||c.node==='pickup') || c.cell<4 && c.x>42 && c.x<54 && c.y>76.5 && c.y<92 &&
  (c.state==='doing' && ['entry','doorInside'].includes(c.node) && c.activityPose==='open' || c.path?.includes('threshold') || c.path?.includes('pickup') || ['threshold','pickup','doorApproach'].includes(c.node) && c.state==='walking' || c.node==='pickup'));
}

export function createDoorway(sceneElement){
 if(!document.querySelector('link[data-doorway-style]')){
  const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./doorway.css',import.meta.url).href;style.dataset.doorwayStyle='';document.head.append(style);
 }
 const aperture=document.createElement('div');aperture.className='front-door-aperture';aperture.setAttribute('aria-hidden','true');
 const panel=document.createElement('div');panel.className='front-door-leaf';panel.setAttribute('aria-hidden','true');
 const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg'),photo=document.createElementNS(NS,'image');
 svg.setAttribute('viewBox','0 0 58 90');svg.setAttribute('preserveAspectRatio','none');photo.setAttribute('href',new URL('./assets/door-detail.webp',import.meta.url).href);photo.setAttribute('width','58');photo.setAttribute('height','90');svg.append(photo);panel.append(svg);
 const house=sceneElement.querySelector('#house');if(house)house.after(aperture);else sceneElement.prepend(aperture);sceneElement.append(panel);
 let open=false;
 return {update(cast){const next=shouldOpenDoor(cast);if(next!==open){open=next;aperture.classList.toggle('is-open',open);panel.classList.toggle('is-open',open);}},get isOpen(){return open;},destroy(){aperture.remove();panel.remove();}};
}
