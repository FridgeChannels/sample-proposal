// A Saturday at the Bennetts' home. The highlighted visits are also performed
// in act two. An ordinary trip to the refrigerator is an opportunity to see it.
function visit(time, person, purpose, group, from, to, scene = null, at = 'fridgeOpen') {
  const id = person.toLowerCase() + '-' + time.replace(':', '');
  return Object.freeze({id, time, person, purpose, group, from, at, to, scene});
}

export const dayVisits = Object.freeze([
  visit('08:05', 'Emma', 'Get milk while her coffee brews.', 'Breakfast', 'coffee', 'cook', 'coffee-milk'),
  visit('08:18', 'Daniel', 'Get eggs for Saturday omelets.', 'Breakfast', 'pickup', 'unbox1'),
  visit('08:30', 'Olivia', 'Get blueberries for her oatmeal.', 'Breakfast', 'girl', 'meal2'),

  visit('12:10', 'Daniel', 'Take out his rice bowl to heat for lunch.', 'Lunch', 'sofa1', 'coffee', 'leftovers-from-fridge'),
  visit('12:11', 'Olivia', 'Fill her soccer bottle with cold water.', 'Lunch', 'meal2', 'meal2', 'microwave-and-water', 'kitchen'),
  visit('12:12', 'Noah', 'Pour a glass of milk during a break from his cardboard bridge.', 'Lunch', 'game2', 'watchPhone', 'milk-and-a-bridge'),
  visit('12:13', 'Daniel', 'Tap HOMMIO for a game with Noah while lunch warms.', 'Lunch', 'coffee', 'coffee', 'game-fridge-tap', 'kitchen'),

  visit('15:05', 'Noah', 'Grab a cheese stick after playing in the yard.', 'Afternoon', 'doorInside', 'play'),
  visit('16:18', 'Emma', 'Put away yogurt from the grocery run.', 'Afternoon', 'pickup', 'unbox0'),

  visit('17:40', 'Daniel', 'Get peppers for the fajitas.', 'Dinner & cleanup', 'unbox1', 'cook'),
  visit('18:06', 'Noah', 'Bring salsa to the dinner table.', 'Dinner & cleanup', 'meal3', 'meal3'),
  visit('19:34', 'Emma', 'Chill leftover fajitas for tomorrow.', 'Dinner & cleanup', 'meal0', 'laundry')
]);

export const dailyEncounters = new Set(dayVisits.map(visit => visit.id)).size;
