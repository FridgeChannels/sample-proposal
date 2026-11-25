/**
 * Count simulated fridge-zone entries, not frames or verified attention.
 * Vertical distances scale by 0.75, matching the floor plan. Only cast[0..3]
 * are household humans. onExposure receives (actor, index) once per entry.
 */
export function createExposureTracker({
  center=[42.1,34.4],
  // Keep the lunch-packing counter outside the fridge zone, including on a chapter jump.
  enterRadius=3.2,
  exitRadius=4.05,
  onExposure=()=>{}
}={}) {
  if (!Array.isArray(center) || center.length!==2 || !center.every(Number.isFinite)) {
    throw new TypeError('Exposure center must contain two finite coordinates.');
  }
  if (!Number.isFinite(enterRadius) || !Number.isFinite(exitRadius) || enterRadius<0 || exitRadius<=enterRadius) {
    throw new RangeError('Exposure radii must satisfy 0 <= enterRadius < exitRadius.');
  }
  const [cx,cy]=center, epsilon=1e-9;
  let occupancy=new WeakMap();
  const zoneDistance=actor=>Math.hypot(actor.x-cx,(actor.y-cy)*.75);
  const valid=actor=>actor&&typeof actor==='object'&&Number.isFinite(actor.x)&&Number.isFinite(actor.y);

  function seed(cast=[]) {
    occupancy=new WeakMap();
    cast.slice(0,4).forEach(actor=>{
      if(valid(actor))occupancy.set(actor,zoneDistance(actor)<=enterRadius+epsilon);
    });
  }

  function tick(cast=[],enabled=false) {
    let emitted=0;
    cast.slice(0,4).forEach((actor,index)=>{
      if(!valid(actor))return;
      const distance=zoneDistance(actor);
      // A new actor's current location is its baseline, never an entry event.
      if(!occupancy.has(actor)){occupancy.set(actor,distance<=enterRadius+epsilon);return;}
      if(occupancy.get(actor)) {
        if(distance>=exitRadius-epsilon)occupancy.set(actor,false);
      } else if(distance<=enterRadius+epsilon) {
        // Track occupancy while disabled too: installing a magnet or resuming
        // a display must not count someone who was already standing beside it.
        occupancy.set(actor,true);
        if(enabled){emitted++;onExposure(actor,index);}
      }
    });
    return emitted;
  }

  return {seed,tick};
}
