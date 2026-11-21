/**
 * Release GPU resources owned by a removed world-object group.
 * Shared scene materials are never disposed; callers list only materials
 * created exclusively for this object in root.userData.ownedMaterials.
 */
export function disposeWorldObject(root) {
  if (!root || typeof root.traverse !== 'function') return false;
  root.userData ||= {};
  if (root.userData.disposed) return false;

  root.userData.disposed = true;
  const geometries = new Set();
  root.traverse(node => {
    if (node.geometry) geometries.add(node.geometry);
  });

  for (const geometry of geometries) geometry.dispose();

  const ownedMaterials = Array.isArray(root.userData.ownedMaterials)
    ? root.userData.ownedMaterials
    : [];
  for (const material of new Set(ownedMaterials)) {
    if (material && typeof material.dispose === 'function') material.dispose();
  }
  root.userData.ownedMaterials = [];
  return true;
}
