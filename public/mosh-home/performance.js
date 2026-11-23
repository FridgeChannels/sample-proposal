/** Small deterministic director: stage clocks begin only after actors arrive.
 * External delivery and first-person actions release their own stage gates.
 */
export function tickPerformance(story, stages, dt, {isArrived, isActionComplete=()=>true, onLine, onAdvance, onFinish}) {
  if (!story || story.paused || story.done || dt <= 0) return;
  const stage = stages[story.stage];
  story.time += dt;
  if (!isArrived(stage)) return;
  story.arrivedFor += dt;
  const lines = stage.conversations || [];
  while (story.lineIndex < lines.length && lines[story.lineIndex].at <= story.arrivedFor) {
    onLine(lines[story.lineIndex++]);
  }
  if (stage.awaitEvent === 'doorbell' && !story.doorbellRang) return;
  if (stage.id === 'unbox' && !story.installRequested) return;
  if (stage.awaitEvent === 'interaction' && !story.interactionComplete) return;
  if (story.arrivedFor < stage.duration || !isActionComplete(stage)) return;
  if (story.stage + 1 < stages.length) onAdvance(story.stage + 1);
  else { story.done = true; onFinish(); }
}

export function requestInstallation(story) {
  if (!story || !story.tapCounted || story.installed || story.installRequested) return false;
  story.installRequested = true;
  return true;
}
