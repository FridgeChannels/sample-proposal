import {snackStory} from './snack-story.js';

// Required actors release the beat while everyone else continues a small,
// purposeful task. Touchpoint counts come from real proximity crossings only.
const line=(at,actor,kind,text)=>({at,actor,kind,text});
const conversation=(at,actor,text)=>line(at,actor,'dialogue',text);
const thought=(at,actor,text)=>line(at,actor,'thought',text);
const interaction=(actor,kind)=>({duration:0,awaitEvent:'interaction',pov:{actor,kind},povActor:actor,povMode:kind,waitFor:[actor]});

export const betweenStory=[
 {
  id:'coffee-brewing',title:'Coffee on. Life carries on.',duration:3.5,actionLeadIn:1.25,eventkind:'household',
  targets:{0:'brewer',1:'fridgeOpen',2:'fridgeList'},waitFor:[0,1,2],
  poses:{0:'reach',1:'reach',2:'point-out'},gaits:{0:'brisk',1:'brisk',2:'skip'},
  visitPurposes:{1:'Milk for his oats',2:'Check practice time'},supportingFridge:{actor:1,item:'milk',seconds:1.45},
  props:{coffee:'loading',pouch:'full',microwave:'off',ball:'play'},
  actionSequence:[
   {id:'coffee-mug-placed',actor:0,pose:'reach',duration:.9,shot:'coffee-setup',props:{coffee:'loading'}},
   {id:'coffee-button-pressed',actor:0,pose:'press-button',duration:.9,shot:'coffee-press',effects:[{at:.55,props:{coffee:'brewing'}}]},
   {id:'coffee-waiting',actor:0,pose:'coffee',duration:1.7,shot:'coffee-wait'}
  ],
  intents:{0:'Set a mug beneath the coffee spout, press the button and leave it brewing while fetching milk.',1:'Finish a work note beside the kitchen, then heat yesterday’s rice bowl.',2:'Finish the bee illustration before soccer.',3:'Roll Cooper’s ball once, then check the cardboard bridge.',4:'Play-bow to Noah, then watch the rolling ball.',5:'Groom quietly near the sofa.'},
  conversations:[conversation(.9,0,'A fresh cup before I start the next chapter.')]
 },
 {
  id:'coffee-milk',title:'Milk while the coffee brews',duration:1.8,eventkind:'fridge-visit',
  targets:{0:'fridgeOpen',1:'unbox1',2:'unbox2',3:'fridgeList'},waitFor:[0,3],
  poses:{0:'reach',1:'stir',2:'sketch',3:'show-card'},gaits:{0:'brisk',1:'brisk',2:'skip',3:'run'},
  visitPurposes:{0:'Milk for her coffee',3:'Put up his bridge drawing'},
  fridgeVisit:{actor:0,reason:'Get milk while the coffee is brewing.'},
  props:{coffee:'brewing',milk:'returned',ball:'with-dog'},
  actionSequence:[{id:'emma-takes-milk',actor:0,pose:'reach',duration:1.8,shot:'emma-milk'}],
  intents:{0:'Open the refrigerator, reach for the milk and notice HOMMIO while the coffee continues.',1:'Close the work notebook and get ready to warm lunch.',2:'Finish the bee’s wing.',3:'Test the bridge while Cooper returns with his ball.',4:'Fetch the toy ball back toward the living room.'},
  conversations:[thought(.45,0,'A minute while it brews. I’ll see what MOSH has on HOMMIO.')]
 },
 {
  id:'coffee-survey',title:'Two questions while it brews',eventkind:'interaction',...interaction(0,'survey'),
  targets:{0:'kitchen',3:'unbox3'},poses:{0:'tap',3:'build'},gaits:{3:'skip'},
  props:{coffee:'brewing'},
  actionSequence:[{id:'emma-taps-survey',actor:0,pose:'tap',duration:0}],
  intents:{0:'Answer two optional shopping questions on her phone before returning to the coffee.',1:'Finish the last note without crowding Emma.',2:'Continue the illustration.',3:'Keep the bridge project on the floor.',4:'Wait for the next throw beside Noah.'},
  conversations:[],
  povLines:{tap:[conversation(0,0,'Bought direct? A couple of times lately.')],complete:[conversation(0,0,'Coffee’s ready. Where’s my mug?')]}
 },
 {
  id:'coffee-finish',title:'A splash of milk.',duration:2.2,eventkind:'household',
  targets:{0:'brewer',2:'fridgeList'},waitFor:[0,2],poses:{0:'pour',2:'reach'},gaits:{0:'brisk',2:'skip'},
  visitPurposes:{2:'Check her snack list'},
  props:{coffee:'ready',milk:'out'},
  actionSequence:[{id:'emma-pours-milk',actor:0,pose:'pour',duration:2.2,shot:'coffee-pour',props:{milk:'pouring'},effects:[{at:.95,props:{milk:'returned',coffee:'served'}}]}],
  intents:{0:'Return to her waiting cup and add a splash of milk.',1:'Finish the work note before fetching his lunch.',2:'Continue the bee drawing at the table.',3:'Keep testing the cardboard bridge.'},
  conversations:[conversation(.5,0,'Coffee, just how I like it.'),conversation(1.6,1,'Is there enough milk for mine?')]
 },
 {
  id:'leftovers-from-fridge',title:'Lunch comes out of the fridge.',duration:1.8,eventkind:'fridge-visit',
  targets:{0:'fridgeSide',1:'fridgeOpen',2:'unbox2'},waitFor:[0,1],
  poses:{0:'reach',1:'reach',2:'pack-lunch'},gaits:{0:'brisk',1:'brisk',2:'brisk'},
  visitPurposes:{0:'Put the milk back',1:'Get his lunch'},
  fridgeVisit:{actor:1,reason:'Take his covered rice bowl from the refrigerator.'},
  props:{coffee:'served',milk:'returned',leftovers:'cold'},
  actionSequence:[{id:'daniel-takes-lunch',actor:1,pose:'reach',duration:1.8,shot:'leftovers'}],
  intents:{0:'Enjoy her finished cup while Daniel gets his lunch.',1:'Open the fridge and lift out his covered rice bowl.',2:'Put the sketch aside to fill her soccer bottle next.',3:'Add one more toy car to the bridge.',4:'Take a drink from his own water bowl.'},
  conversations:[conversation(.5,1,'Rice bowl found.'),conversation(1.6,2,'Dad, leave me the crunchy bits.')]
 },
 {
  id:'microwave-and-water',title:'Lunch in. Water topped up.',duration:3.7,eventkind:'fridge-visit',
  targets:{0:'unbox0',1:'coffee',2:'kitchen'},waitFor:[1,2],visitPurposes:{2:'Fill her soccer bottle'},
  poses:{0:'chop',1:'microwave-load',2:'pour'},gaits:{0:'brisk',1:'brisk',2:'skip'},
  fridgeVisit:{actor:2,reason:'Fill her soccer bottle with cold water before leaving.'},
  props:{microwave:'loading',leftovers:'loading',waterBottle:'filling',coffee:'served',vegetables:'preparing'},
  actionSequence:[
   {id:'microwave-bowl-loaded',actor:1,pose:'microwave-load',duration:1.6,shot:'microwave',props:{microwave:'loading'}},
   {id:'microwave-start-pressed',actor:1,pose:'press-button',duration:.9,shot:'microwave-press',effects:[{at:.55,props:{microwave:'warming',leftovers:'warming'}}]},
   {id:'microwave-waiting',actor:1,pose:'stand',duration:1.2,shot:'microwave-wait',props:{waterBottle:'packed'}}
  ],
  intents:{0:'Chop vegetables at the island with the coffee beside her.',1:'Open the microwave door, place the rice bowl inside, close it and press Start.',2:'Fill her soccer bottle, screw on the lid and take it back to her bag.',3:'Carefully place the next toy car on the bridge.',4:'Finish drinking and look toward the children.'},
  conversations:[conversation(.45,2,'Bottle filled. This time I’m actually taking it.'),conversation(2,1,'Lunch gets thirty seconds. We’ve got time.')]
 },
 {
  id:'milk-and-a-bridge',title:'Milk for the next bridge test',duration:1.8,eventkind:'fridge-visit',
  targets:{0:'fridgeSide',2:'meal2',3:'fridgeOpen'},waitFor:[0,3],
  poses:{0:'reach',2:'sit-sketch',3:'reach'},gaits:{0:'brisk',2:'skip',3:'run'},
  visitPurposes:{0:'Vegetables for lunch',3:'Milk for his glass'},
  fridgeVisit:{actor:3,reason:'Get milk for his glass before returning to the bridge.'},
  props:{milk:'returned',microwave:'warming',vegetables:'preparing',waterBottle:'packed',ball:'with-dog'},
  actionSequence:[{id:'noah-takes-milk',actor:3,pose:'reach',duration:1.8,shot:'noah-milk'}],
  intents:{0:'Keep chopping while Noah gets his own milk.',1:'Let the microwave run while Noah pours a drink.',2:'Put the bottle beside her soccer bag and finish the drawing.',3:'Fetch milk for one glass, keeping it away from the drawing.',4:'Bring the toy ball back and wait on the living-room side of the kitchen.'},
  conversations:[conversation(.4,0,'One glass, Noah. Keep it away from the drawings.'),conversation(1.25,3,'Then my bridge gets its fourth car.')]
 },
 {
  id:'game-fridge-tap',title:'Open the game from the fridge',eventkind:'fridge-visit',duration:1.25,
  targets:{0:'prep',1:'kitchen',3:'watchPhone'},waitFor:[1],poses:{0:'chop',1:'tap',3:'stand'},gaits:{0:'brisk',1:'brisk',3:'skip'},
  visitPurposes:{1:'Open the lunch-break game'},
  actionSequence:[{id:'daniel-opens-game',actor:1,pose:'tap',duration:1.25,effects:[{at:.7,event:'game-link-opened'}]}],
  conversations:[],intents:{0:'Finish chopping.',1:'Open the game from the fridge magnet.',2:'Keep drawing.',3:'Meet Dad beside the microwave.'}
 },
 {
  id:'microwave-game',title:'One round before the microwave dings',eventkind:'interaction',...interaction(1,'game'),
  targets:{1:'coffee',3:'watchPhone'},waitFor:[1,3],povLeadIn:.65,
  poses:{1:'tap',3:'watch-phone'},gaits:{1:'brisk',3:'walk'},
  props:{milk:'returned',microwave:'warming',vegetables:'preparing'},
  actionSequence:[{id:'daniel-and-noah-play',actor:1,pose:'tap',poses:{3:'watch-phone'},duration:0,shot:'game'}],
  intents:{0:'Finish chopping while father and son play one short round.',1:'Hold the open game where Noah can see it while lunch warms.',2:'Finish the caption on the bee drawing.',3:'Watch Dad’s screen from beside him and help place the bridge between towers.',4:'Sit outside the cooking aisle, holding the toy ball nearby.'},
  conversations:[],
  povLines:{tap:[conversation(0,1,'One round before lunch.'),conversation(0,3,'It reaches, Dad! Now!')],complete:[conversation(0,1,'Nice bridge! There’s the microwave.')]}
 },
 {
  id:'ordinary-afternoon',title:'Lunch is ready. Back to the afternoon.',duration:3.6,eventkind:'household',
  targets:{1:'coffee',3:'game2'},waitFor:[1,3],
  poses:{1:'microwave-unload',3:'jump'},gaits:{1:'brisk',3:'run'},
  props:{coffee:'served',microwave:'ready',leftovers:'ready',vegetables:'ready',waterBottle:'packed',ball:'play'},
  poseTimeline:[{at:2.2,actor:3,pose:'throw-ball'}],
  actionSequence:[{id:'daniel-takes-warm-lunch',actor:1,pose:'microwave-unload',duration:2.2,shot:'lunch-ready',effects:[{at:.75,props:{microwave:'served',leftovers:'served'}}]}],
  intents:{0:'Take another sip beside the prepared vegetables.',1:'Open the microwave and lift the warm rice bowl out with both hands.',2:'Finish the bee caption with her filled bottle ready.',3:'Celebrate the fourth car staying up, then roll Cooper’s toy ball.',4:'Play-bow for the next roll, away from the food.'},
  conversations:[conversation(.5,3,'Four cars! It stayed up!'),conversation(2,1,'Nice. Lunch and structural progress.')]
 }
];

export const reorderStory=[
 {
  id:'empty-pouch',title:'Packing lunch',duration:4.8,eventkind:'empty-pouch',cameraActor:0,cameraView:'lunch',actionLeadIn:.4,
  targets:{0:'prep',2:'meal2'},waitFor:[0],
  poses:{0:'pack-lunch',2:'sit-sketch'},gaits:{0:'brisk',2:'walk'},
  actionSequence:[
   {id:'emma-starts-lunch-packing',actor:0,pose:'pack-lunch',duration:1.8,shot:'pack-opener',revealAt:.12,props:{lunch:'packing'},effects:[{at:.92,event:'lunch-packed'}]},
   {id:'emma-finds-empty-box',actor:0,pose:'inspect-empty-carton',duration:2.6,shot:'empty-box',revealAt:.45,props:{lunch:'checking'},effects:[{at:.45,props:{lunch:'empty'},event:'empty-carton-checked'}]}
  ],
  intents:{0:'Put her wrapped lunch snack in the open bag on the island, then reach inside the MOSH carton and discover it is empty.',1:'Read a short project note at the table.',2:'Add the last words to her drawing caption.',3:'Try the toy truck on the cardboard bridge.',4:'Watch from the dining area, away from the food.'},
  conversations:[conversation(3.4,0,'That was my last bar. I’ll get the same box.'),conversation(4.2,1,'Cookie Dough Crunch again? Yes, please.')]
 },
 {
  id:'reorder-at-fridge',title:'Emma reaches for HOMMIO',duration:.8,eventkind:'fridge-visit',cameraActor:0,cameraView:'magnet',
  targets:{0:'kitchen'},waitFor:[0],poses:{0:'reach'},gaits:{0:'brisk'},
  fridgeVisit:{actor:0,reason:'Tap HOMMIO to replace the finished snack box.'},
  actionSequence:[{id:'emma-reaches-magnet',actor:0,pose:'reach',duration:.8,shot:'reorder-tap',revealAt:.4}],
  intents:{0:'Walk directly to the refrigerator because the snack box needs replacing.',1:'Continue reading.',2:'Continue the drawing while her parents sort the next order.',3:'Keep testing the bridge.',4:'Wait in the dining area rather than crowding Emma.'},
  conversations:[thought(.2,0,'Same box. Right here.')]
 },
 {
  id:'reorder-phone',title:'Reorder in 10 seconds',eventkind:'interaction',...interaction(0,'reorder-story'),interactionSeconds:10,
  targets:{0:'kitchen'},poses:{0:'tap'},
  actionSequence:[{id:'emma-reorders',actor:0,pose:'tap',duration:0,shot:'reorder-tap'}],
  intents:{0:'Review the familiar box and saved reward, then confirm the illustrated order herself.',1:'Continue reading while Emma handles the reorder.',2:'Finish her caption; the purchase is an adult task.',3:'Keep building; the purchase is an adult task.',4:'Watch the family from the dining area.'},
  conversations:[],
  povLines:{tap:[conversation(0,0,'Our usual, with the saved reward.')],complete:[conversation(0,0,'Done. One less thing to remember.')]}
 },
 {
  id:'reorder-confirmed',title:'The next box is sorted',duration:1.7,eventkind:'order-confirmed',cameraActor:0,cameraView:'magnet',
  targets:{0:'kitchen'},waitFor:[0],poses:{0:'tap'},props:{order:'confirmed'},
  actionSequence:[{id:'emma-checks-confirmation',actor:0,pose:'tap',duration:1.7,shot:'reorder-done'}],
  intents:{0:'Check the confirmation, put her phone away and tell the family.',1:'Acknowledge the update while staying with his note.',2:'Close the finished sketchbook.',3:'Check the bridge supports.',4:'Respond to Emma’s voice with a small tail wag.'},
  conversations:[conversation(.4,0,'Snack box sorted.'),conversation(1.1,1,'Thanks. I’ve got dog food on the list.')]
 },
 {
  id:'back-to-lunch-packing',title:'Back to their afternoon',duration:2.2,eventkind:'household',cameraActor:0,cameraView:'lunch',actionLeadIn:.4,
  targets:{0:'prep'},waitFor:[0],poses:{0:'pack-lunch'},gaits:{0:'brisk'},props:{order:'confirmed'},
  actionSequence:[{id:'emma-packs-lunch',actor:0,pose:'pack-lunch',duration:1.8,shot:'lunch-packing',revealAt:.12,props:{lunch:'packed'},effects:[{at:.75,event:'lunch-resumed'}]}],
  intents:{0:'Go straight back to the lunch bags.',1:'Look up from the note to check Noah’s bridge.',2:'Put the finished drawing aside.',3:'Roll the ball to Cooper before testing the heavier toy truck.',4:'Lower into a play-bow and watch Noah’s ball.'},
  conversations:[conversation(.5,0,'Lunch is packed.'),conversation(1.2,1,'I’ll get the bags.')]
 }
];

export const nextChapter = Object.freeze({enter:'between',between:'reorder',reorder:null});

export const householdPlays={
 enter:{id:'enter',title:'Enter the home',description:'Delivery, discovery, and a beautiful place on the fridge.',stages:snackStory,requiresMagnet:false},
 between:{id:'between',title:'Between purchases',description:'Coffee brewing, lunch warming, and small moments the family chooses.',stages:betweenStory,requiresMagnet:true},
 reorder:{id:'reorder',title:'The next purchase',description:'The last bar is gone. A familiar tap takes care of the next box.',phoneSeconds:10,timingStarts:'at-tap',stages:reorderStory,requiresMagnet:true}
};
