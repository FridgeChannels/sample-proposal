// Ground-contact navigation, calibrated against the fixed house photograph.
// Chair/sofa leaves deliberately end at the floor beneath each seat.
const nodes={
 fridgeSide:[44.9,34.7],fridgeList:[39.65,36.9],fridgeOpen:[40.65,33.5],watchPhone:[59.7,36.6],
 lawnGate:[48,96],lawnTurn:[49,105],lawnBall:[62,107],lawnReturn:[57,115],
 hall:[35.2,44.8],west:[34.9,54.8],south:[32.8,64.5],entry:[48.0,78.0],doorApproach:[50.6,79.2],doorInside:[48.0,81.1],threshold:[48.0,84.5],pickup:[48.0,89.0],
 play:[45.0,74.0],lounge:[66.3,74.0],east:[64.0,61.2],dining:[62.8,48.6],middle:[42.6,46.5],
 kitchen:[42.1,34.4],brewer:[55.2,34.3],cook:[58.4,34.3],coffee:[62.0,34.4],pet:[71.3,38.4],utility:[65.5,36.9],utilityDoor:[65.4,33.5],laundry:[71.2,30.7],
 bath:[29.6,51.4],bathDoor:[23.8,55.5],bathInside:[24.8,52.0],boy:[22.9,57.0],girl:[24.2,72.7],master:[28.7,34.5],
 kitchenAisle:[42.7,41.8],northAisle:[62.4,42.1],livingWest:[39.2,64.0],sofaApproach:[44.1,64.3],
 sofaCenterApproach:[50.4,63.65],livingEast:[66.3,65.8],tableNorth:[65.4,45.0],tableEast:[78.8,49.3],tableSouth:[71.0,61.0],tableNE:[77.7,44.7],tableSE:[79.0,60.9],
 bedEdge:[18.8,54],bedFoot:[15.1,52.3],bedroomNorth:[32.4,37.4],boyHall:[33.5,58.3],boyDoor:[29.0,58.5],girlDoor:[29.6,65.6],girlTurn:[24.7,67.2],
 petDad:[68.2,40.1],petNoah:[73.7,41.0],catSketch:[23.6,76.1],laundryNoah:[68.4,31.8],sink:[49.3,34.3],prep:[43.2,39.8],
 unboxApproach:[58.5,47.5],unbox0:[46.5,44.5],unbox1:[52.0,46.0],unbox2:[60.5,43.5],unbox3:[57,47],
 meal0:[65.65,53.25],meal1:[77.1,53.8],meal2:[68.4,46.3],meal3:[72.7,57.8],
 sofa0:[43.8,60.25],sofa1:[48.8,60.15],sofa2:[54.0,60.3],sofa3:[60.0,69.95],
 game0:[45.6,67.1],game1:[56.1,67.4],game2:[50.8,72.2],game3:[50.4,63.65]
};
// Serve the sink from the fridge side and the range from the dining side.
// The narrow working aisle behind the island has no room for two adults to pass.
const links=[
 ['kitchenAisle','fridgeList'],['prep','fridgeSide'],['kitchen','fridgeSide'],['kitchen','fridgeOpen'],['cook','watchPhone'],['watchPhone','northAisle'],
 ['pickup','lawnGate'],['lawnGate','lawnTurn'],['lawnTurn','lawnBall'],['lawnBall','lawnReturn'],['lawnReturn','lawnGate'],
 ['hall','west'],['west','south'],['south','entry'],['entry','doorApproach'],['play','doorApproach'],['doorApproach','doorInside'],['doorInside','threshold'],['threshold','pickup'],['entry','play'],['play','lounge'],
 ['lounge','livingEast'],['livingEast','east'],['east','dining'],['dining','middle'],['middle','hall'],
 ['middle','unbox0'],['middle','unbox1'],['dining','unboxApproach'],['unboxApproach','unbox3'],['northAisle','unbox2'],['unbox1','unbox3'],['middle','kitchenAisle'],['kitchenAisle','kitchen'],['kitchen','sink'],['sink','brewer'],['cook','coffee'],
 ['coffee','northAisle'],['northAisle','dining'],['northAisle','petDad'],['petDad','pet'],['petDad','utility'],['utility','utilityDoor'],['utilityDoor','laundry'],['utilityDoor','laundryNoah'],
 ['boy','bedEdge'],['bedEdge','bedFoot'],['boy','bathDoor'],['bathDoor','bathInside'],['bathInside','bath'],['west','boyHall'],['boyHall','boyDoor'],['boyDoor','boy'],['south','girlDoor'],['girlDoor','girlTurn'],['girlTurn','girl'],['hall','bedroomNorth'],['bedroomNorth','master'],
 ['pet','petNoah'],['girl','catSketch'],['kitchenAisle','prep'],
 ['dining','meal0'],['dining','tableNorth'],['tableNorth','meal2'],['tableNorth','tableNE'],['tableNE','tableEast'],['tableEast','meal1'],
 ['east','tableSouth'],['tableSouth','meal3'],['tableSouth','tableSE'],['tableSE','tableEast'],
 ['play','livingWest'],['livingWest','sofaApproach'],['sofaApproach','sofa0'],['sofaApproach','sofaCenterApproach'],['sofaApproach','sofa1'],['sofaApproach','sofa2'],
 ['livingEast','sofa3'],['sofaApproach','game0'],['livingEast','game1'],['play','game2'],['sofaCenterApproach','game3']
];
function distance(a,b){return Math.hypot(a[0]-b[0],(a[1]-b[1])*.75)}
function route(from,to){let cost={[from]:0},previous={},open=new Set(Object.keys(nodes));while(open.size){let u=[...open].sort((a,b)=>(cost[a]??Infinity)-(cost[b]??Infinity))[0];open.delete(u);if(u===to)break;for(const e of links){let v=e[0]===u?e[1]:e[1]===u?e[0]:null;if(!v||!open.has(v))continue;let n=cost[u]+distance(nodes[u],nodes[v]);if(n<(cost[v]??Infinity)){cost[v]=n;previous[v]=u}}}let path=[to];while(path[0]!==from){if(!previous[path[0]])throw Error('Unreachable destination');path.unshift(previous[path[0]])}return path.slice(1)}
const tasks={drink:{node:'kitchen',label:'Getting a drink',duration:26},coffee:{node:'coffee',label:'Making coffee',duration:42},cook:{node:'cook',label:'Preparing a meal',duration:65},laundry:{node:'laundry',label:'Sorting laundry',duration:48},wash:{node:'bath',label:'Washing hands',duration:24},play:{node:'play',label:'Playing with blocks',duration:65},read:{node:'girl',label:'Reading in her room',duration:70},tidy:{node:'boy',label:'Tidying his room',duration:48},relax:{node:'lounge',label:'Taking a quiet break',duration:70},feed:{node:'pet',label:'Checking the pet bowls',duration:30},eat:{node:'pet',label:'Eating and drinking',duration:38},rest:{node:'master',label:'Resting in the bedroom',duration:85}};
const cast=[
{name:'Mother',cell:0,size:7.9,speed:4.1,start:'cook',jobs:['cook','coffee','drink','laundry','relax'],first:'cook'},
{name:'Father',cell:1,size:8.3,speed:4.3,start:'lounge',jobs:['relax','feed','drink','laundry','coffee'],first:'relax'},
{name:'Daughter',cell:2,size:6.3,speed:4.4,start:'girl',jobs:['read','play','wash','drink'],first:'read'},
{name:'Son',cell:3,size:5.7,speed:4.5,start:'play',jobs:['play','tidy','wash','drink'],first:'play'},
{name:'Dog',cell:4,size:5.2,speed:4.5,start:'pet',jobs:['eat','relax','play'],first:'eat'},
{name:'Cat',cell:5,size:3.8,speed:3.1,start:'master',jobs:['rest','eat','relax'],first:'rest'}];

export {nodes,links,route,tasks,cast,distance};
