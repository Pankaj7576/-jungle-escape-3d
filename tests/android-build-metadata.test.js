import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReleaseVersion, patchGradleDefaultConfig } from '../scripts/android-build-metadata.mjs';

const gradle = `android {
    defaultConfig {
        applicationId "com.jungleescape.losttemple"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
    }
    buildTypes {
        debug { }
    }
}
`;

test('maps release 1.009 to a monotonically increasing Android versionCode', () => {
  assert.deepEqual(parseReleaseVersion('1.009\n'), { versionName: '1.009', versionCode: 1009 });
  assert.equal(parseReleaseVersion('1.008').versionCode, 1008);
  assert.equal(parseReleaseVersion('1.00').versionCode, 1000);
});

test('rejects release versions outside the project version format', () => {
  for (const value of ['1.9', 'v1.009', '1.0000', '', '1.abc']) {
    assert.throws(() => parseReleaseVersion(value));
  }
});

test('patches only Android defaultConfig version metadata', () => {
  const updated = patchGradleDefaultConfig(gradle, '1.009');
  assert.match(updated, /versionCode 1009/);
  assert.match(updated, /versionName "1\.009"/);
  assert.match(updated, /applicationId "com\.jungleescape\.losttemple"/);
  assert.match(updated, /debug \{ \}/);
});

test('supports Groovy assignment syntax and preserves indentation', () => {
  const source = gradle.replace('versionCode 1', 'versionCode = 1').replace('versionName "1.0"', "versionName = '1.0'");
  const updated = patchGradleDefaultConfig(source, '1.009');
  assert.match(updated, /versionCode = 1009/);
  assert.match(updated, /versionName = "1\.009"/);
});

test('fails closed if the generated Gradle file does not have one version pair', () => {
  assert.throws(() => patchGradleDefaultConfig('android { defaultConfig { applicationId "x" } }', '1.009'), /Expected exactly one Android defaultConfig block/);
  assert.throws(() => patchGradleDefaultConfig(gradle.replace('versionCode 1', 'versionCode 1\n        versionCode 2'), '1.009'), /Expected one versionCode/);
});
