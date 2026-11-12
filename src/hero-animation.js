// Keep the hero's animation in place so only the gameplay lane controller can
// move the runner left or right. Vertical root motion is preserved for jumps.
export function lockHeroAnimationRootMotion(clips) {
  return clips.map((clip) => {
    const stableClip = clip.clone();
    stableClip.tracks = stableClip.tracks.map((track) => {
      if (!/\.position$/i.test(track.name)) return track;

      const stableTrack = track.clone();
      const values = stableTrack.values;
      if (values.length < 3 || values.length % 3 !== 0) return stableTrack;

      const rootX = values[0];
      const rootZ = values[2];
      for (let i = 0; i < values.length; i += 3) {
        values[i] = rootX;
        values[i + 2] = rootZ;
      }
      return stableTrack;
    });
    return stableClip;
  });
}
