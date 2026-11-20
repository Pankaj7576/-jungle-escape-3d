const LANE_COUNT = 3;

/** Apply one explicit horizontal input to the runner's target lane. */
export function applyLaneInput(currentLane, action) {
  if (!Number.isInteger(currentLane) || currentLane < 0 || currentLane >= LANE_COUNT) {
    throw new RangeError('currentLane must be an integer from 0 to 2');
  }

  if (action === 'left') return Math.max(0, currentLane - 1);
  if (action === 'right') return Math.min(LANE_COUNT - 1, currentLane + 1);
  return currentLane;
}
