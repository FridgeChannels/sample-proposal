// Gardencup product concept and authored family performance. No affiliation or
// endorsement is implied by the illustrative delivery carrier or product.
import {Gardencup} from './brand-assets.js';
export const SNACK_BRAND = Gardencup.name;
export const HOMMIO_CARD_COPY = Gardencup.missionCTA;

// Clocks begin after required actors arrive; background action runs in parallel.
// The delivery module owns its complete arrival/doorbell/departure sequence.
// The unbox POV owns its causal open -> reveal -> scan -> discovery -> like
// sequence and calls onInstall to release its stage. Do not time-skip that POV.
export const snackStory = [
  {
    id: 'delivery', title: 'A familiar delivery', duration: 4,
    eventkind: 'delivery', awaitEvent: 'doorbell',
    targets: {4:'play'}, waitFor: [],
    poses: {4:'alert',5:'groom'}, gaits: {4:'trot',5:'walk'},
    poseTimeline: [{at:8,actor:4,pose:'greet'}],
    intents: {
      0: 'Finish the current household task until the doorbell rings.',
      1: 'Notice the arriving delivery and listen for the doorbell.',
      2: 'Continue the current activity; the parcel is not open yet.',
      3: 'Hear the van outside and wonder whether the salad delivery has arrived.'
    },
    conversations: [
      {at:1.2,actor:3,kind:'thought',text:'Delivery! Is that our salad pack?'}
    ],
    deliveryBeats: [
      {id:'van-arrives',description:'A UPS-style brown delivery van stops outside the house.'},
      {id:'driver-walks',description:'The delivery driver carries a closed Gardencup parcel to the front door.'},
      {id:'doorbell',description:'The driver places the parcel safely, rings the bell, and steps away.'},
      {id:'driver-departs',description:'The driver returns to the van and leaves. Daniel can collect the parcel as the driver returns.'}
    ]
  },
  {
    id: 'answer-door', title: 'Daniel answers the door', duration: 1.1,
    eventkind: 'answer-door',
    targets: {1:'doorInside',4:'doorApproach'}, waitFor: [1,4],
    poses: {1:'open',4:'alert'}, gaits: {1:'brisk',4:'trot'},
    actionSequence: [{id:'door-open',actor:1,pose:'open',duration:1.1,shot:'door-open'}],
    intents: {1:'Open the front door, with Cooper waiting inside behind him.',4:'Wait behind Daniel, leaving the doorway clear.'},
    conversations: []
  },
  {
    id: 'receive', title: 'Their favorite salads are here', duration: 2.1,
    eventkind: 'receive',
    targets: {1:'pickup',2:'unbox2',4:'doorApproach'}, waitFor: [1,4], poses: {1:'reach',2:'celebrate',4:'greet'}, gaits: {1:'brisk',2:'brisk',4:'trot'},
    actionSequence: [
      {id:'parcel-grip',actor:1,pose:'reach',duration:1.1,shot:'pickup',revealAt:.55,effects:[{at:.55,event:'parcel-picked-up'}]},
      {id:'parcel-held',actor:1,pose:'carry',duration:1,shot:'pickup'}
    ],
    intents: {
      1: 'Go to the front door because the doorbell rang, identify the parcel, and pick it up.'
    },
    conversations: [
      {at:.75,actor:1,kind:'dialogue',text:'Our Gardencup salads are here! Come and see.'},
      {at:1.2,actor:3,kind:'dialogue',text:'Can I help open it?'}
    ]
  },
  {
    id: 'gather', title: 'Everyone wants a look', duration: 2,
    eventkind: 'gather',
    targets: {0:'unbox0',1:'unbox1',2:'unbox2',3:'unbox3'}, waitFor: [0,1,2,3],
    poses: {0:'stand',1:'carry',2:'point-out',3:'jump'},
    gaits: {0:'brisk',1:'brisk',2:'skip',3:'run',4:'trot'},
    travelShot:'carry-inside',
    actionSequence: [
      {id:'parcel-set-down',actor:1,pose:'reach',poses:{2:'peer-in',3:'jump'},duration:1,shot:'gather',revealAt:.6,effects:[{at:.6,event:'parcel-placed'}]},
      {id:'family-gathered',actor:1,pose:'stand',poses:{2:'jump',3:'point-out'},duration:1,shot:'gather'}
    ],
    intents: {
      0: 'Join Daniel and the children at the kitchen island to open the delivery together.',
      1: 'Carry the closed box to the kitchen island and place it within everyone’s view.',
      2: 'Put her sketchbook aside and join the others to see which salads arrived.',
      3: 'Come close enough to see inside, leaving Daniel room to open the box.'
    },
    conversations: [
      {at:.5,actor:2,kind:'dialogue',text:'I saved a spot. Noah, you get the first look!'},
      {at:1.6,actor:0,kind:'dialogue',text:'Let’s open it together.'}
    ]
  },
  {
    id: 'unbox', title: 'Open the box with Daniel', duration: 0,
    eventkind: 'unbox', awaitEvent: 'install', povActor: 1, povMode: 'unbox',
    targets: {0:'unbox0',1:'unbox1',2:'unbox2',3:'unbox3'}, waitFor: [0,1,2,3],
    poses: {0:'stand',1:'open-box',2:'peer-in',3:'peer-in',4:'sniff'},
    gaits: {0:'brisk',1:'brisk',2:'skip',3:'run',4:'trot'},
    actionSequence:[{id:'box-opening',actor:1,pose:'open-box',duration:2.2,shot:'unbox'}],
    intents: {
      0: 'Look into the opened box and share the family’s reaction.',
      1: 'Open the box, find the HOMMIO magnet, read its invitation, tap it with his phone, discover what it opens, and turn HOMMIO over.',
      2: 'Look closely at HOMMIO’s salad design and imagine it on the fridge.',
      3: 'Spot the little card and ask about the game on Daniel’s phone without handling a purchase.'
    },
    conversations: [],
    // Each reaction shares its cue with the close-up and the physical cast.
    familyBeats: {
      card:{poses:['stand','inspect-card','peer-in','jump'],speaker:3,text:'Dad, is that a tiny salad cup?'},
      read:{poses:['peer-in','turn-card','peer-in','stand'],speaker:2,text:'Wait, there’s writing on the back. It says to tap.'},
      phone:{poses:['stand','tap','stand','peer-in'],speaker:1,text:'With my phone? Come here. Let’s try it.'},
      welcome:{poses:['peer-in','tap','peer-in','peer-in'],speaker:0,text:'Oh, there’s our usual box. I can use this when we run out.'},
      beauty:{poses:['stand','inspect-card','jump','peer-in'],speaker:2,text:'Can we keep the salad side showing?'},
      choose:{poses:['stand','show-card','peer-in','point-out'],speaker:0,text:'By the fridge handle? I’ll see it when I pack your lunch.'}
    }
  },
  {
    id: 'install', title: 'They choose to keep it', duration: 2.2,
    eventkind: 'install',
    targets: {0:'fridgeSide',1:'kitchen'}, waitFor: [0,1],
    poses: {0:'reach',1:'reach',2:'open-box',3:'excited',4:'play-bow'}, gaits: {1:'brisk',4:'trot'},
    actionSequence:[{id:'magnet-attached',actor:1,pose:'reach',duration:1.6,shot:'install',revealAt:.6,effects:[{at:.6,event:'magnet-installed'}]}],
    intents: {
      0: 'Stand beside Daniel to see which side he puts on the fridge.',
      1: 'Carry the two-sided HOMMIO magnet to the refrigerator; attach it with its logo-free food photograph facing the room.',
      2: 'Wait with the open salad pack rather than following Daniel into the kitchen.',
      3: 'Help fold the empty packing paper.'
    },
    conversations: [
      {at:.5,actor:1,kind:'dialogue',text:'Here, Noah. Is that straight?'},
      {at:1.8,actor:0,kind:'dialogue',text:'Perfect. Now, who wants the first cup?'}
    ]
  }
];
