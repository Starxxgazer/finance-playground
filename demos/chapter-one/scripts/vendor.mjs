// Reproducible local runtime; no CDN or external assets at play time.
import { build } from 'esbuild';
import { copyFile } from 'node:fs/promises';
await build({ stdin: { contents: `export * from 'three';
export { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
export { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
export { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
export { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
export { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
export { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';`, resolveDir: process.cwd() }, bundle: true, minify: true, format: 'esm', outfile: 'vendor/three.js', legalComments: 'inline' });
await copyFile('node_modules/three/LICENSE', 'vendor/THREE-LICENSE.txt');
