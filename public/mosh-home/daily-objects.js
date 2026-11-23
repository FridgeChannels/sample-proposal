// Small practical props share materials and geometry. Each follows a real hand.
export function createDailyObjects(T,model){
 const material=color=>new T.MeshStandardMaterial({color,roughness:.85});
 const brown=material(0xaa8153),paper=material(0xe7dfc8),wood=material(0xc99e42),graphite=material(0x393835),blue=material(0x587b87);
 function box(parent,size,at,mat,tilt=0){
  const mesh=new T.Mesh(new T.BoxGeometry(...size),mat);
  mesh.position.set(...at);mesh.rotation.z=tilt;parent.add(mesh);
 }
 function prop(hand,key){
  const g=new T.Group();g.visible=false;model.hands[hand].add(g);model.props[key]=g;return g;
 }
 const pad=prop(0,'notepad');
 box(pad,[.15,.012,.20],[.025,.006,.016],brown);
 box(pad,[.143,.005,.187],[.025,.014,.017],paper);
 const pencil=prop(1,'pencil');
 box(pencil,[.007,.117,.007],[0,.048,0],wood,-.19);
 box(pencil,[.004,.011,.004],[.01,-.015,0],graphite,-.19);
 const span=prop(0,'bridge');
 for(const x of [-.043,.043]){
  box(span,[.009,.045,.18],[x,.022,0],brown);
  box(span,[.012,.008,.19],[x,.048,0],paper);
 }
 box(span,[.097,.008,.18],[0,.013,0],brown);
 const cloth=prop(0,'linen');
 box(cloth,[.083,.009,.115],[.0415,.005,.02],blue);
 const crease=new T.Group();crease.position.set(.083,.011,.02);cloth.add(crease);
 box(crease,[.083,.007,.115],[.0415,0,0],blue);
 model.clothCrease=crease;
}
