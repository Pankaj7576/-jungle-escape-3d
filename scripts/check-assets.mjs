import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const required = ['hero.glb', 'guardian.glb'];
let missing = 0;
for (const name of required) {
  const path = resolve('public/assets/models', name);
  if (!existsSync(path)) {
    console.log(`OPTIONAL MODEL MISSING: ${path} (procedural fallback will be used)`);
    missing++;
    continue;
  }
  const header = readFileSync(path).subarray(0, 4).toString('ascii');
  if (header !== 'glTF') {
    console.error(`INVALID GLB HEADER: ${path}`);
    process.exitCode = 1;
    continue;
  }
  console.log(`OK: ${name} ${(statSync(path).size / 1024 / 1024).toFixed(2)} MiB`);
}
if (missing) console.log(`${missing} optional model(s) are not bundled; the game will keep its procedural fallback.`);