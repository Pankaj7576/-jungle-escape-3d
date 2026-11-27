/**
 * Dispose GPU-side geometry owned by a generated Three.js object tree.
 * Materials and textures are intentionally left alone because the active
 * runner shares them between bridge segments, trees, coins and obstacles.
 */
export function disposeObjectGeometries(root) {
  if (!root || typeof root.traverse !== 'function') return 0;

  const geometries = new Set();
  root.traverse(object => {
    const geometry = object?.geometry;
    if (geometry && typeof geometry.dispose === 'function') geometries.add(geometry);
  });

  for (const geometry of geometries) geometry.dispose();
  return geometries.size;
}

/** Remove one generated object and release its unique geometry resources. */
export function removeAndDisposeObject(parent, object) {
  if (!parent || !object) return 0;
  parent.remove(object);
  return disposeObjectGeometries(object);
}
