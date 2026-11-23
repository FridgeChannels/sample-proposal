// A physical action can unlock a scene. Several actions can share one editorial
// photograph so pressing a button or moving a cup does not trigger another cut.
const shots={};
const scenes=new Map();
function scene(ids,file,title,caption,alt,focus='50% 48%'){
 const [first]=ids;
 for(const id of ids){
  shots[id]=Object.freeze({id,file:'mosh-story/'+file+'.webp',title,caption,alt,focus});
  scenes.set(id,first);
 }
}
scene(['truck-arrival'],'driver-driving',"The next order starts in this box.","The Bennetts already buy MOSH. Their usual shipment can bring home a way to order the next box.",'A UPS driver at the wheel of the delivery truck.');
scene(['driver-exit'],'driver-exit',"The next order starts in this box.","The Bennetts already buy MOSH. Their usual shipment can bring home a way to order the next box.",'The driver steps out of the UPS truck with the parcel.');
scene(['driver-carry'],'driver-carry',"What does it cost to get into a kitchen?","HOMMIO models $0.60 per magnet at 10,000 units. This one travels in a box MOSH is already sending.",'The driver carries the MOSH box along the front walk.');
scene(['doorstep','doorbell','driver-return','driver-board','van-departs'],'doorstep',"What does it cost to get into a kitchen?","HOMMIO models $0.60 per magnet at 10,000 units. This one travels in a box MOSH is already sending.",'The UPS driver places the parcel on the front step.','50% 56%');
scene(['door-open'],'door-open',"The bars get MOSH through the door.","Daniel carries the order inside. What could the family still use after the last bar is gone?",'Daniel opens the front door as Cooper watches.');
scene(['carry-inside'],'carry-inside',"The bars get MOSH through the door.","Daniel carries the order inside. What could the family still use after the last bar is gone?",'Daniel carries the MOSH parcel inside.');
scene(['pickup'],'pickup',"The bars get MOSH through the door.","Daniel carries the order inside. What could the family still use after the last bar is gone?",'Daniel bends to pick up the parcel with Cooper beside him.','53% 55%');
scene(['gather'],'gather',"One order reaches a whole family.","Four people share these bars. Putting HOMMIO beside them lets everyone discover how to get another box.",'The family gathers around the parcel at the kitchen island.');
scene(['unbox'],'unbox',"One order reaches a whole family.","Four people share these bars. Putting HOMMIO beside them lets everyone discover how to get another box.",'The family opens the MOSH parcel together.','50% 52%');
scene(['magnet-discover'],'magnet-discover',"Would they give MOSH fridge space?","The family can display the chocolate-chip bar they love. The MOSH logo and tap invitation are on the reverse.",'Daniel lifts the two-sided HOMMIO magnet out of the box.');
scene(['magnet-read'],'magnet-read',"A reason to turn it over.","The back invites the Bennetts to explore MOSH’s brain health mission. They decide whether to open it.",'Daniel turns over the magnet to read the MOSH side.');
scene(['family-keeps-hommio'],'family-keeps-hommio',"The family chooses the spot.","They like the bar photograph. Beside the fridge handle, it will also be useful when Emma packs lunch.",'Noah points to the bar artwork in Daniel’s hand at the kitchen island.');
scene(['install'],'install',"The delivery ends. The placement stays.","Daniel puts HOMMIO beside the handle. Tomorrow, MOSH can come into view again when someone reaches for milk.",'Daniel places HOMMIO beside the refrigerator handle.','42% 37%');
scene(['fridge-ambient'],'magnet-insert',"10+ / Day","The family already comes here for milk and lunch. Each fridge visit gives MOSH a chance to be seen, with no fee per impression.",'The chocolate-chip artwork on the MOSH HOMMIO magnet, beside the handle of the Bennetts’ stainless-steel refrigerator.','54% 49%');
scene(['coffee-wait','emma-coffee-walk','coffee-setup','coffee-press'],'coffee-wait',"What can MOSH learn while coffee brews?","Emma has a minute before her coffee is ready. MOSH can ask about her shopping habits while the brand is already on her mind.",'Emma waits at the coffee maker in her kitchen.','55% 53%');
scene(['coffee-pour'],'coffee-pour',"Emma sets the pace.","She goes back to her coffee. HOMMIO stays within reach for the next time she wants something from MOSH.",'Emma pours milk into her coffee.');
scene(['emma-milk'],'emma-milk',"The fridge does the reminding.","Emma comes for milk. The bar photo is beside the handle, so MOSH can come to mind without sending her a message.",'Emma opens the refrigerator for milk.');
scene(['survey-tap'],'reorder-tap',"Two questions, answered by choice.","Emma can share how often she buys direct and which category interests her. Two answers earn 20 points toward $5 off.",'Emma holds her phone to HOMMIO on the refrigerator.','47% 36%');
scene(['noah-milk'],'noah-milk',"One fridge visit adds one opportunity.","Noah gets a drink. The demo counts a chance to see MOSH. A tap only counts if someone chooses to interact.",'Noah reaches for milk at the refrigerator door.');
scene(['leftovers'],'leftovers',"1,825 chances to be seen in a year.","At five potential views a day for 365 days, that’s HOMMIO’s estimate for one kitchen. Daniel’s lunch is one such opportunity.",'Daniel reaches into the refrigerator for his lunch.');
scene(['microwave','microwave-press','microwave-wait'],'microwave-wait',"Why visit MOSH between orders?","Lunch is heating and the family still has bars. A quick game gives Daniel and Noah a reason to tap today.",'Daniel waits by the microwave, with Olivia at the other end of the kitchen.');
scene(['lunch-ready'],'lunch-ready',"One visit before the next purchase.","Lunch is ready. MOSH earned a moment of attention during the wait, even though the family didn’t need another box.",'Daniel lifts his warm rice bowl out of the microwave.');
scene(['daniel-game-tap'],'daniel-game-tap',"A return visit from the fridge.","Daniel opens the game from the fridge. He can reach MOSH again without a paid click or a reminder.",'Daniel holds his phone to the refrigerator magnet.','42% 40%');
scene(['game'],'game',"What would one tap a week add up to?","At one voluntary tap a week, HOMMIO models 52 visits a year from one engaged household. This round is one visit.",'Daniel and Noah play on one phone by the microwave.','48% 46%');
scene(['lunchbag-detail'],'lunch-insert',"When does Emma actually need more bars?","She finds out while packing lunch. MOSH can be within reach at that moment, however long the last box lasted.",'Two lunch bags and a water bottle ready on the kitchen island.');
scene(['pack-opener'],'lunch-packing',"When does Emma actually need more bars?","She finds out while packing lunch. MOSH can be within reach at that moment, however long the last box lasted.",'Emma places a food container in an open lunch bag on the island.','50% 54%');
scene(['empty-box'],'empty-box',"The empty carton is the reorder signal.","Emma knows exactly which bars she needs. The magnet beside her opens that box at MOSH.",'Emma looks into the empty pink MOSH carton beside her lunch bag.');
scene(['reorder-tap'],'reorder-tap',"From the last bar to the brand’s store.","The sample’s Shop now button takes the family directly to moshlife.com. This story shows how a saved basket could shorten that trip.",'Emma touches her phone to HOMMIO on the refrigerator.','47% 36%');
scene(['reorder-done'],'reorder-tap',"One confirmed demo reorder.","The story counts the sale when Emma confirms her demo basket. Picking up her phone alone earns no revenue.",'Emma holds her phone at the fridge after placing her demo order.');
scene(['lunch-packing'],'lunch-packing',"The next box is already on order.","Emma goes back to packing lunch. MOSH can attribute the confirmed reorder to the magnet that brought her back.",'Emma returns to the lunch bag on the island.','50% 54%');

export const STORY_SHOTS=Object.freeze(shots);
const deliveryMap={arrival:'truck-arrival',arrive:'truck-arrival',exit:'driver-exit',carry:'driver-carry',place:'doorstep',doorbell:'doorbell',bell:'doorbell',return:'driver-return',cab:'driver-board',depart:'van-departs'};
const phoneOpeningActions={'emma-taps-survey':'survey-tap','daniel-opens-game':'daniel-game-tap'};
export function resolveStoryShot({stageId='',actionState=null,deliveryBeat=''}={}){
 if(stageId==='delivery')return shots[deliveryMap[deliveryBeat]||'truck-arrival'];
 if(!actionState||actionState.stageId!==stageId||actionState.phase==='blocked')return null;
 const id=actionState.shot||(actionState.phase==='action'&&phoneOpeningActions[actionState.id]);
 return shots[id]||null;
}
export function resolveEditorialShot(state,previousShot=null){
 const committed=resolveStoryShot(state);
 if(committed)return shots[scenes.get(committed.id)];
 if(previousShot)return previousShot;
 if(state.stageId==='coffee-brewing')return shots['fridge-ambient'];
 if(state.stageId==='empty-pouch')return shots['lunchbag-detail'];
 return null;
}
export function resolvePOVShot(kind,beatId){
 if(kind==='unboxing')return shots[({card:'magnet-discover',read:'magnet-read',phone:'magnet-read',welcome:'magnet-read',beauty:'magnet-discover',choose:'family-keeps-hommio'})[beatId]||'unbox'];
 if(kind==='survey')return shots['survey-tap'];
 if(kind==='game')return shots.game;
 return shots['reorder-tap'];
}
const firstStageShot={
 delivery:'truck-arrival','answer-door':'door-open',receive:'pickup',gather:'gather',unbox:'unbox',install:'install',
 'coffee-brewing':'coffee-wait','coffee-milk':'emma-milk','coffee-survey':'survey-tap','coffee-finish':'coffee-pour',
 'leftovers-from-fridge':'leftovers','microwave-and-water':'microwave','milk-and-a-bridge':'noah-milk',
 'game-fridge-tap':'daniel-game-tap','microwave-game':'game','ordinary-afternoon':'lunch-ready',
 'empty-pouch':'pack-opener','reorder-at-fridge':'reorder-tap','reorder-phone':'reorder-tap','reorder-confirmed':'reorder-done','back-to-lunch-packing':'lunch-packing'
};
export function nextStagePhoto(stageId){return shots[firstStageShot[stageId]]?.file||null;}
