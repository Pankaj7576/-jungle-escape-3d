import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export function parseReleaseVersion(input) {
  const match = String(input).trim().match(/^(\d+)\.(\d{2,3})$/);
  if (!match) {
    throw new Error(`Unsupported release version "${String(input).trim()}"; expected MAJOR.MINOR with a 2-3 digit MINOR`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const versionCode = major * 1000 + minor;
  if (!Number.isSafeInteger(versionCode) || versionCode < 1 || versionCode > 2100000000) {
    throw new Error(`Release version produces an invalid Android versionCode: ${versionCode}`);
  }

  return { versionName: `${major}.${match[2]}`, versionCode };
}

export function patchGradleDefaultConfig(content, version) {
  const { versionName, versionCode } = typeof version === 'string'
    ? parseReleaseVersion(version)
    : version;
  const blocks = [...content.matchAll(/defaultConfig\s*\{([\s\S]*?)\n\s*\}/g)];
  if (blocks.length !== 1) {
    throw new Error(`Expected exactly one Android defaultConfig block; found ${blocks.length}`);
  }

  let body = blocks[0][1];
  const codeLines = [...body.matchAll(/^([\t ]*versionCode\s*(?:=\s*)?)\d+\s*$/gm)];
  const nameLines = [...body.matchAll(/^([\t ]*versionName\s*(?:=\s*)?)(['"]).*?\2\s*$/gm)];
  if (codeLines.length !== 1 || nameLines.length !== 1) {
    throw new Error(`Expected one versionCode and one versionName in defaultConfig; found ${codeLines.length} and ${nameLines.length}`);
  }

  body = body.replace(/^([\t ]*versionCode\s*(?:=\s*)?)\d+\s*$/m, `$1${versionCode}`);
  body = body.replace(/^([\t ]*versionName\s*(?:=\s*)?)(['"]).*?\2\s*$/m, (_line, prefix) => `${prefix}"${versionName}"`);
  const original = blocks[0][0];
  const updated = original.replace(blocks[0][1], body);
  return content.replace(original, updated);
}

function readBuildInputs(root) {
  const versionText = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim();
  const version = parseReleaseVersion(versionText);
  const config = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
  if (typeof config.appId !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(config.appId)) {
    throw new Error('capacitor.config.json must contain a valid Android appId');
  }
  return { ...version, appId: config.appId };
}

function prepare(root) {
  const metadata = readBuildInputs(root);
  const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
  const original = fs.readFileSync(gradlePath, 'utf8');
  const updated = patchGradleDefaultConfig(original, metadata);
  fs.writeFileSync(gradlePath, updated);
  fs.writeFileSync(path.join(root, '.android-build-metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`Prepared Android APK ${metadata.versionName} (versionCode ${metadata.versionCode}, ${metadata.appId})`);
}

function verify(root, apkArgument) {
  const apkPath = path.resolve(root, apkArgument || 'android/app/build/outputs/apk/debug/app-debug.apk');
  if (!fs.existsSync(apkPath) || !fs.statSync(apkPath).isFile()) throw new Error(`APK not found: ${apkPath}`);
  const metadataPath = path.join(root, '.android-build-metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!sdkRoot) throw new Error('ANDROID_HOME or ANDROID_SDK_ROOT is required to verify the APK');
  const buildTools = process.env.ANDROID_BUILD_TOOLS_VERSION || '35.0.0';
  const toolsDir = path.join(sdkRoot, 'build-tools', buildTools);
  const aapt = path.join(toolsDir, 'aapt');
  const apksigner = path.join(toolsDir, 'apksigner');
  if (!fs.existsSync(aapt) || !fs.existsSync(apksigner)) {
    throw new Error(`Android build tools ${buildTools} (aapt/apksigner) are not installed under ${toolsDir}`);
  }

  const badging = execFileSync(aapt, ['dump', 'badging', apkPath], { encoding: 'utf8' });
  const packageLine = badging.match(/^package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/m);
  if (!packageLine) throw new Error('aapt could not read the APK package metadata');
  if (packageLine[1] !== metadata.appId) throw new Error(`APK package ID mismatch: ${packageLine[1]} != ${metadata.appId}`);
  if (Number(packageLine[2]) !== metadata.versionCode) throw new Error(`APK versionCode mismatch: ${packageLine[2]} != ${metadata.versionCode}`);
  if (packageLine[3] !== metadata.versionName) throw new Error(`APK versionName mismatch: ${packageLine[3]} != ${metadata.versionName}`);

  const manifestTree = execFileSync(aapt, ['dump', 'xmltree', apkPath, 'AndroidManifest.xml'], { encoding: 'utf8' });
  const orientationLine = manifestTree.split(/\r?\n/).find(line => line.includes('android:screenOrientation'));
  if (!orientationLine || !/=(?:\(type 0x10\))?(?:0x1|1)\s*$/.test(orientationLine.trim())) {
    throw new Error('APK manifest does not declare SCREEN_ORIENTATION_PORTRAIT');
  }
  const entries = execFileSync('unzip', ['-Z1', apkPath], { encoding: 'utf8' }).split(/\r?\n/);
  if (!entries.includes('AndroidManifest.xml') || !entries.some(entry => /^classes\d*\.dex$/.test(entry))) {
    throw new Error('APK is missing AndroidManifest.xml or DEX bytecode');
  }
  execFileSync('unzip', ['-tq', apkPath], { stdio: 'pipe' });
  execFileSync(apksigner, ['verify', '--verbose', apkPath], { stdio: 'pipe' });

  const hash = crypto.createHash('sha256').update(fs.readFileSync(apkPath)).digest('hex');
  const outputDir = path.dirname(apkPath);
  const buildInfo = [
    'Jungle Escape 3D — Android Debug APK',
    `versionName=${metadata.versionName}`,
    `versionCode=${metadata.versionCode}`,
    `applicationId=${metadata.appId}`,
    'orientation=portrait',
    'signature=verified (debug signing)',
    'apkIntegrity=verified',
    `sha256=${hash}`
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(outputDir, 'build-info.txt'), buildInfo);
  fs.writeFileSync(path.join(outputDir, 'SHA256SUMS'), `${hash}  ${path.basename(apkPath)}\n`);
  console.log(buildInfo);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const command = process.argv[2];
  const root = process.cwd();
  try {
    if (command === 'prepare') prepare(root);
    else if (command === 'verify') verify(root, process.argv[3]);
    else throw new Error('Usage: node scripts/android-build-metadata.mjs <prepare|verify> [apk-path]');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
