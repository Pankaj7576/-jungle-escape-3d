import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve('public/assets/models');
await mkdir(root, { recursive: true });

const assets = [
  {
    slug: 'man-base-character',
    output: 'hero.glb',
    page: 'https://grab3d.com/models/characters/man-base-character/',
    role: 'Playable jungle explorer',
  },
  {
    slug: 'orc',
    output: 'guardian.glb',
    page: 'https://grab3d.com/models/characters/orc/',
    role: 'Temple guardian creature',
  },
];

async function getJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'JungleEscape3D-asset-fetch/1.0' } });
  if (!response.ok) throw new Error(`HTTP ${response.status} while requesting ${url}`);
  return response.json();
}

const credits = [
  'Bundled third-party character assets',
  'All downloaded character models below are CC0 1.0 and may be used commercially.',
  '',
];

for (const asset of assets) {
  const destination = resolve(root, asset.output);
  try {
    const existing = await stat(destination);
    if (existing.size > 1_000_000) {
      console.log(`Keeping existing ${asset.output} (${(existing.size / 1048576).toFixed(1)} MiB)`);
      credits.push(`- ${asset.role}: ${asset.slug} — CC0 1.0 — ${asset.page}`);
      continue;
    }
  } catch {}

  const model = await getJson(`https://grab3d.com/api/v1/models/${asset.slug}.json`);
  if (model.license !== 'CC0-1.0') throw new Error(`Unexpected license for ${asset.slug}: ${model.license}`);
  const files = model.rigged?.files ?? [];
  const glb = files.find(file => String(file.format).toLowerCase() === 'glb');
  if (!glb?.url) throw new Error(`No rigged GLB found for ${asset.slug}`);

  const response = await fetch(glb.url, { headers: { 'user-agent': 'JungleEscape3D-asset-fetch/1.0' } });
  if (!response.ok) throw new Error(`Could not download ${asset.slug}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 100_000 || bytes.subarray(0, 4).toString('ascii') !== 'glTF') {
    throw new Error(`Downloaded file is not a valid GLB: ${asset.slug}`);
  }
  await writeFile(destination, bytes);
  console.log(`Downloaded ${asset.output}: ${(bytes.length / 1048576).toFixed(1)} MiB from ${glb.url}`);
  credits.push(`- ${asset.role}: ${asset.slug} — CC0 1.0 — ${asset.page}`);
}

credits.push('', 'Models are loaded locally from /assets/models; the game does not fetch character files at runtime.');
await writeFile(resolve(root, 'CC0_ASSET_LICENSES.txt'), credits.join('\n') + '\n');
