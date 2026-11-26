export const MAX_RENDER_PIXEL_RATIO = 1.5;

/**
 * Keep high-density mobile displays within a predictable GPU fill-rate budget.
 * Invalid or unavailable device pixel ratios safely fall back to 1.
 */
export function getRenderPixelRatio(devicePixelRatio) {
  const ratio = Number(devicePixelRatio);
  if (!Number.isFinite(ratio) || ratio <= 0) return 1;
  return Math.min(ratio, MAX_RENDER_PIXEL_RATIO);
}
