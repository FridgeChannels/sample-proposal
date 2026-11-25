// A physical step van: opaque bodywork, separate glazing, open cab, sliding
// passenger door, rotating wheels, suspension and ground-contact shadows.
export function createDeliveryTruck(THREE,{software=false}={}){
 const group=new THREE.Group();group.name='UPS delivery step van';
 const body=new THREE.Group();group.add(body);
 const mat=(color,roughness=.6,metalness=.1,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
 const paint=mat(0x493326,.42,.38),edge=mat(0x594331,.5,.28),dark=mat(0x171a19,.88,.06),rubber=mat(0x202120,.96,0),metal=mat(0x9c9e94,.28,.8),gold=mat(0xd4a64b,.4,.4),black=mat(0x22251f,.7,.18),glass=mat(0x557078,.19,.18,{transparent:true,opacity:software?.83:.57,side:THREE.DoubleSide,depthWrite:false});
 const warmLamp=mat(0xf5e8bd,.25,.1,{emissive:0xe0bf77,emissiveIntensity:.15}),redLamp=mat(0xa32c1e,.35,.1,{emissive:0xbf2916,emissiveIntensity:.08}),amber=mat(0xe5a32c,.35,.1);
 function mesh(geo,material,parent=body,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(w,h,d,material,x=0,y=0,z=0,parent=body){return mesh(new THREE.BoxGeometry(w,h,d),material,parent,x,y,z);}
 function rod(a,b,r,material,parent=body){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),m=mesh(new THREE.CylinderGeometry(r,r,to.distanceTo(from),software?5:10),material,parent);m.position.copy(from).add(to).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.sub(from).normalize());return m;}
 function panel(points,z,material,parent=body,depth=.025){const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return mesh(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:4}),material,parent,0,0,z);}
 function rounded(w,h,d,material,x,y,z,parent=body,r=.045){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const g=new THREE.ExtrudeGeometry(s,{depth:d-r*2,bevelEnabled:true,bevelThickness:r,bevelSize:r*.6,bevelSegments:1,curveSegments:software?1:3});g.translate(0,0,-d/2+r);return mesh(g,material,parent,x,y,z);}
 // Frame, cargo body and shallow rolled roof. Lower side skirts have genuine
 // wheel arches; the wheels are not simply pasted onto a solid box.
 box(6.35,.18,1.86,black,-.03,.54,0);box(4.1,2.08,2.24,paint,1.13,2.26,0);
 rounded(6.0,.16,2.30,edge,.17,3.35,0,body,.055);
 for(const z of [-.72,0,.72])box(3.82,.008,.012,edge,1.15,3.447,z);
 for(const x of [-2.44,2.06])for(const side of [-1,1]){const liner=new THREE.Shape();liner.moveTo(x-.66,.68);liner.absarc(x,.68,.66,Math.PI,0,true);liner.closePath();mesh(new THREE.ExtrudeGeometry(liner,{depth:.025,bevelEnabled:false,curveSegments:software?8:18}),dark,body,0,0,side>.0?.76:-.785);}
 for(const side of [-1,1]){
  const s=new THREE.Shape();s.moveTo(-.92,.68);s.lineTo(1.43,.68);s.absarc(2.06,.68,.63,Math.PI,0,true);s.lineTo(3.19,.68);s.lineTo(3.19,3.32);s.lineTo(-.92,3.32);s.closePath();
  mesh(new THREE.ExtrudeGeometry(s,{depth:.045,bevelEnabled:false,curveSegments:software?8:20}),paint,body,0,0,side>0?1.12:-1.165);
  box(4.05,.046,.018,gold,1.12,1.27,side*1.178);
  for(let x=-.75;x<3.2;x+=.58){box(.009,1.81,.009,edge,x,2.23,side*1.178);for(const y of [1.34,3.19]){const rivet=mesh(new THREE.SphereGeometry(.011,4,3),metal,body,x,y,side*1.184);}}
  // Cargo wheel-arch rolled metal lip.
  const arc=[];for(let i=0;i<=16;i++){const a=Math.PI-i/16*Math.PI;arc.push(new THREE.Vector3(2.06+Math.cos(a)*.655,.68+Math.sin(a)*.655,side*1.19));}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc),software?12:24,.025,software?4:6,false),edge);
 }
 // Cab side quarters, floor and under-door steps leave an actual open volume.
 box(2.22,.13,2.15,metal,-1.99,.79,0);box(.96,.12,.36,metal,-1.30,.52,1.12);box(.90,.10,.28,metal,-1.30,.27,1.30);
 for(const z of [.99,1.08,1.17,1.26])box(.84,.018,.016,black,-1.30,.585,z);
 for(const side of [-1,1]){
  const f=new THREE.Shape();f.moveTo(-3.22,.70);f.lineTo(-3.10,.70);f.absarc(-2.44,.70,.66,Math.PI,0,true);f.lineTo(-1.78,1.91);f.lineTo(-2.55,1.91);f.lineTo(-2.87,1.86);f.lineTo(-3.22,1.44);f.closePath();mesh(new THREE.ExtrudeGeometry(f,{depth:.045,bevelEnabled:false,curveSegments:software?8:20}),paint,body,0,0,side>0?1.07:-1.115);
  box(.055,1.38,.065,edge,-2.54,2.58,side*1.09);box(.055,1.38,.065,edge,-1.86,2.58,side*1.09);box(.72,.055,.065,edge,-2.20,3.24,side*1.09);box(.61,1.24,.018,glass,-2.20,2.57,side*1.10);
  box(.13,2.56,.13,edge,-.91,2.02,side*1.08);
  const curve=[];for(let i=0;i<=16;i++){const a=Math.PI-i/16*Math.PI;curve.push(new THREE.Vector3(-2.44+Math.cos(a)*.68,.70+Math.sin(a)*.68,side*1.17));}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve),software?12:24,.035,5,false),edge);
 }
 // Tapered front face and two windscreen panes with metal mullions/wipers.
 panel([[-3.28,.70],[-3.28,1.48],[-2.88,1.91],[-2.75,1.77],[-3.17,1.42],[-3.17,.70]],-1.08,paint,body,2.16);
 function quad(vertices,material){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();return mesh(g,material);}
 for(const side of [-1,1]){
  const z0=side<0?-.995:.045,z1=side<0?-.045:.995;
  quad([[-2.90,1.90,z0],[-2.90,1.90,z1],[-2.62,3.16,z1],[-2.62,3.16,z0]],glass);
  rod([-2.90,1.90,z0],[-2.62,3.16,z0],.028,edge);rod([-2.90,1.90,z1],[-2.62,3.16,z1],.028,edge);
  rod([-2.91,1.91,(z0+z1)/2],[-2.75,2.44,(z0+z1)/2+.18],.018,black);
 }
 rod([-2.91,1.88,-1.04],[-2.91,1.88,1.04],.035,edge);rod([-2.61,3.19,-1.04],[-2.61,3.19,1.04],.035,edge);
 box(.13,.30,2.0,black,-2.71,1.72,0); // dashboard
 const seat=rounded(.48,.15,.47,dark,-1.84,1.17,-.51,body,.05);rounded(.15,.73,.47,dark,-1.60,1.50,-.51,body,.045);rod([-1.84,.82,-.51],[-1.84,1.15,-.51],.05,metal);
 const steering=mesh(new THREE.TorusGeometry(.19,.025,6,software?10:22),black,body,-2.32,1.73,-.53);steering.rotation.y=Math.PI/2-.28;rod([-2.55,1.45,-.53],[-2.32,1.73,-.53],.035,black);
 // Passenger sliding door. It travels behind the opaque cargo side wall.
 const door=new THREE.Group();door.position.set(-1.36,1.99,1.10);body.add(door);
 rounded(.83,2.37,.055,paint,0,0,0,door,.025);box(.68,1.02,.012,glass,0,.49,.034,door);box(.035,.19,.035,metal,-.28,-.19,.061,door);box(.82,.018,.025,gold,0,-.72,.04,door);
 // Far cab door/window remain closed.
 rounded(.83,2.37,.055,paint,-1.36,1.99,-1.12,body,.025);box(.68,1.02,.012,glass,-1.36,2.48,-1.154);
 // Mirrors, grille, bumpers, lights and antenna.
 rounded(.23,.24,2.30,dark,-3.31,.69,0,body,.04);
 box(.025,.45,1.05,black,-3.30,1.15,0);for(let y=.97;y<1.4;y+=.075)box(.03,.018,1.02,metal,-3.322,y,0);
 for(const side of [-1,1]){
  rounded(.045,.29,.38,metal,-3.30,1.25,side*.77,body,.025);box(.052,.21,.28,warmLamp,-3.331,1.27,side*.77);box(.051,.10,.26,amber,-3.33,1.02,side*.78);
  rod([-2.38,2.20,side*1.12],[-2.37,2.28,side*1.46],.025,black);rod([-2.45,2.72,side*1.12],[-2.37,2.65,side*1.46],.025,black);
  rounded(.08,.52,.24,black,-2.35,2.48,side*1.48,body,.025);box(.014,.43,.18,metal,-2.397,2.48,side*1.48);
  box(.055,.33,.13,redLamp,3.22,1.03,side*.94);box(.13,.11,.21,amber,-2.52,3.41,side*.79);
  box(.15,.07,.20,redLamp,3.13,3.40,side*.87);
 }
 rounded(.21,.18,2.33,dark,3.26,.65,0,body,.025);box(.025,2.43,2.10,paint,3.22,2.0,0);
 box(.035,2.30,.025,metal,3.25,2.0,0);for(const z of [-.89,.89])for(const y of [1.05,2.08,3.10])box(.07,.16,.07,metal,3.27,y,z);
 box(.05,.10,.31,black,3.28,1.65,.15);box(.05,.15,.31,metal,3.28,.89,0);rod([-2.40,3.4,-.88],[-2.38,3.97,-.91],.009,black);
 // Gold shield and lettering consist of geometry, including in SVG fallback.
 function shield(side){const parent=new THREE.Group();parent.position.set(1.13,2.30,side*1.191);if(side<0)parent.rotation.y=Math.PI;body.add(parent);const outline=[[-.67,.69],[.67,.69],[.64,-.28],[.44,-.52],[0,-.80],[-.44,-.52],[-.64,-.28]];panel(outline,0,gold,parent,.012);panel(outline.map(([x,y])=>[x*.94,y*.94]),.014,paint,parent,.012);const strokes=[[[ -.43,.30],[-.43,-.12],[-.37,-.22],[-.22,-.22],[-.15,-.12],[-.15,.30]],[[0,-.24],[0,.30],[.20,.30],[.28,.24],[.28,.07],[.20,.01],[0,.01]],[[.52,.27],[.36,.30],[.31,.21],[.34,.12],[.48,.03],[.52,-.05],[.48,-.18],[.33,-.20]]];strokes.forEach(points=>{const curve=new THREE.CatmullRomCurve3(points.map(([x,y])=>new THREE.Vector3(x,y,.045)));mesh(new THREE.TubeGeometry(curve,software?10:22,.035,5,false),gold,parent);});}
 shield(1);shield(-1);
 const wheels=[];const radius=.52;
 for(const x of [-2.44,2.06])for(const side of [-1,1]){
  const wheel=new THREE.Group();wheel.position.set(x,radius,side*1.09);group.add(wheel);wheels.push(wheel);
  const tire=mesh(new THREE.CylinderGeometry(radius,radius,.32,software?16:36,1),rubber,wheel);tire.rotation.x=Math.PI/2;
  for(const out of [-1,1]){const shoulder=mesh(new THREE.TorusGeometry(.445,.073,software?5:8,software?16:32),rubber,wheel,0,0,out*.13);const rim=mesh(new THREE.CylinderGeometry(.295,.295,.025,software?12:28),metal,wheel,0,0,out*.172);rim.rotation.x=Math.PI/2;const hub=mesh(new THREE.CylinderGeometry(.11,.11,.045,software?8:18),black,wheel,0,0,out*.19);hub.rotation.x=Math.PI/2;for(let i=0;i<6;i++){const a=i*Math.PI/3;const bolt=mesh(new THREE.CylinderGeometry(.025,.025,.025,6),metal,wheel,Math.cos(a)*.18,Math.sin(a)*.18,out*.20);bolt.rotation.x=Math.PI/2;}}
  const treadCount=software?14:30;for(let i=0;i<treadCount;i++){const a=i/treadCount*Math.PI*2;const tread=box(.047,.018,.28,black,Math.cos(a)*.519,Math.sin(a)*.519,0,wheel);tread.rotation.z=a-Math.PI/2;}
 }
 for(const x of [-2.44,2.06])rod([x,.49,-1.05],[x,.49,1.05],.07,black,group);
 const shadow=new THREE.Group();group.add(shadow);for(let i=0;i<3;i++){const s=mesh(new THREE.PlaneGeometry(6.5+i*.22,2.22+i*.20),new THREE.MeshBasicMaterial({color:0x252820,transparent:true,opacity:[.13,.055,.025][i],depthWrite:false}),shadow,0,.016+i*.001,0);s.rotation.x=-Math.PI/2;s.receiveShadow=false;s.castShadow=false;s.renderOrder=-5;}
 let distance=0,lastX=null,lastZ=null,velocity=0,pitch=0,open=0;
 function update({x,z=0,doorOpen=0,dt=0,time=0,moving=false,braking=false}){
  if(lastX===null){lastX=x;lastZ=z;}const dx=x-lastX,dz=z-lastZ,travel=Math.sign(dx)*Math.hypot(dx,dz);lastX=x;lastZ=z;distance+=travel;
  const speed=dt>0?travel/dt:0,accel=dt>0?(speed-velocity)/dt:0;velocity=speed;
  const pitchTarget=Math.max(-.022,Math.min(.025,accel*.003));pitch+=(pitchTarget-pitch)*Math.min(1,dt*7);body.rotation.z=pitch;
  body.position.y=moving?.008*Math.sin(distance*7)+.004*Math.sin(distance*17):0;
  open+=(doorOpen-open)*Math.min(1,dt*8||1);door.position.x=-1.36+open*.91;
  wheels.forEach(w=>w.rotation.z=-distance/radius);redLamp.emissiveIntensity=braking?.8:.08;
 }
 function reset(){distance=0;lastX=null;lastZ=null;velocity=0;pitch=0;open=0;body.rotation.z=0;door.position.x=-1.36;wheels.forEach(w=>w.rotation.z=0);}
 return{group,body,wheels,door,update,reset,radius,dimensions:{length:6.8,width:2.5,height:3.45},cabStep:new THREE.Vector3(-1.36,.52,1.46)};
}
