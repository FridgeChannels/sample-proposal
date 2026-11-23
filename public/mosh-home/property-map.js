// The survey origin is the top-left corner of the original 1448 × 1086 house.
// Actors, seats, door hinges and delivery marks all use this coordinate system.
export const parcel={width:2880,height:2080,houseX:128,houseY:420,houseWidth:1448,houseHeight:1086};
const limit=(value,min,max)=>Math.max(min,Math.min(max,value));

export function propertyFrame(w,h,houseWidth,view,mode){
 const mobile=w<=720;
 const floorHeight=houseWidth*parcel.houseHeight/parcel.houseWidth;
 const cover=Math.max(w/(houseWidth*parcel.width/parcel.houseWidth),h/(floorHeight*parcel.height/parcel.houseHeight));
 const intro=mode==='intro'&&view.name==='home';
 const openWidth=mobile?w:w*.64;
 const scale=intro?Math.max(1,cover):Math.max(cover,Math.min(2.15,openWidth/(houseWidth*view.w/100),h*.82/(floorHeight*view.h/100)));
 const x=intro?(mobile?w*.012:w*.045):openWidth*.5-scale*houseWidth*view.x/100;
 const y=intro?(mobile?h*.22:h*.235):h*(mode==='brand'?.36:.56)-scale*floorHeight*view.y/100;
 const unit=scale*houseWidth/parcel.houseWidth;
 return {scale,x:limit(x,w-(parcel.width-parcel.houseX)*unit,parcel.houseX*unit),y:limit(y,h-(parcel.height-parcel.houseY)*unit,parcel.houseY*unit)};
}
