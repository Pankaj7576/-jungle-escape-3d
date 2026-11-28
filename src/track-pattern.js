/**
 * Create a procedural track-piece selector with a short recovery stretch after
 * every gap. This prevents random gap clusters from demanding back-to-back jumps.
 */
export function createTrackPattern({
  random = Math.random,
  turnAfterSegments = 11,
  turnChance = 0.35,
  gapAfterSegments = 3,
  gapChance = 0.14,
  bridgeSegmentsAfterGap = 2
} = {}) {
  if (typeof random !== 'function') {
    throw new TypeError('random must be a function');
  }

  let segmentsSinceTurn = 0;
  let safeBridgeSegments = 0;

  return function nextTrackSegment() {
    segmentsSinceTurn++;

    if (segmentsSinceTurn >= turnAfterSegments && random() < turnChance) {
      segmentsSinceTurn = 0;
      safeBridgeSegments = Math.max(safeBridgeSegments, bridgeSegmentsAfterGap);
      return random() < 0.5 ? 'turnLeft' : 'turnRight';
    }

    if (safeBridgeSegments > 0) {
      safeBridgeSegments--;
      return 'bridge';
    }

    if (segmentsSinceTurn > gapAfterSegments && random() < gapChance) {
      safeBridgeSegments = bridgeSegmentsAfterGap;
      return 'gap';
    }

    return 'bridge';
  };
}
