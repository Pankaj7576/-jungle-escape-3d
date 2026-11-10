import * as THREE from 'three';

/**
 * Small, deterministic, tileable procedural PBR surface for Android-safe detail.
 * This is original generated art; it does not use third-party image assets.
 */
export function makePBRMaterial(hex, seed = 1, options = {}) {
  const {
    repeat = 4,
    roughness = 0.88,
    bumpScale = 0.025,
    anisotropy = 2,
    size = 256,
  } = options;

  // CanvasTexture is tagged sRGB, so write sRGB channel values rather than
  // THREE.Color's linearized values.
  const base = { r: ((hex >> 16) & 255) / 255, g: ((hex >> 8) & 255) / 255, b: (hex & 255) / 255 };
  const albedoCanvas = document.createElement('canvas');
  const heightCanvas = document.createElement('canvas');
  albedoCanvas.width = albedoCanvas.height = size;
  heightCanvas.width = heightCanvas.height = size;
  const albedoCtx = albedoCanvas.getContext('2d', { willReadFrequently: true });
  const heightCtx = heightCanvas.getContext('2d', { willReadFrequently: true });
  const albedo = albedoCtx.createImageData(size, size);
  const height = heightCtx.createImageData(size, size);

  const fract = value => value - Math.floor(value);
  const hash = (x, y) => fract(Math.sin((x + seed * 17.17) * 127.1 + (y - seed * 9.23) * 311.7) * 43758.5453);
  const tau = Math.PI * 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const broad = Math.sin(tau * (u * 3 + seed * 0.13)) * Math.cos(tau * (v * 2 - seed * 0.07));
      const mid = Math.sin(tau * (u * 13 + v * 7 + seed)) * 0.45;
      const fine = (hash(x, y) - 0.5) * 0.42;
      const grain = broad * 0.12 + mid * 0.07 + fine;
      const stain = Math.max(0, Math.sin(tau * (u * 2.1 + v * 1.7 + seed)) - 0.68) * 0.08;
      const shade = THREE.MathUtils.clamp(0.91 + grain - stain, 0.62, 1.12);
      const i = (y * size + x) * 4;
      albedo.data[i] = Math.round(THREE.MathUtils.clamp(base.r * shade, 0, 1) * 255);
      albedo.data[i + 1] = Math.round(THREE.MathUtils.clamp(base.g * shade, 0, 1) * 255);
      albedo.data[i + 2] = Math.round(THREE.MathUtils.clamp(base.b * shade, 0, 1) * 255);
      albedo.data[i + 3] = 255;
      const h = THREE.MathUtils.clamp(0.52 + broad * 0.12 + mid * 0.06 + fine * 0.18, 0, 1);
      const g = Math.round(h * 255);
      height.data[i] = height.data[i + 1] = height.data[i + 2] = g;
      height.data[i + 3] = 255;
    }
  }

  albedoCtx.putImageData(albedo, 0, 0);
  heightCtx.putImageData(height, 0, 0);
  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat, repeat);
  map.anisotropy = anisotropy;
  map.generateMipmaps = true;
  const bumpMap = new THREE.CanvasTexture(heightCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(repeat, repeat);
  bumpMap.anisotropy = anisotropy;
  bumpMap.generateMipmaps = true;

  const material = new THREE.MeshStandardMaterial({
    map,
    bumpMap,
    bumpScale,
    roughness,
    metalness: 0,
  });
  material.userData.generatedTextures = [map, bumpMap];
  return material;
}