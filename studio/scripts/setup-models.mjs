import {mkdir, copyFile, readdir, writeFile, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const wasmSource = path.join(root, 'node_modules/@mediapipe/tasks-vision/wasm');
await mkdir(path.join(root, 'public/wasm'), {recursive: true});
for (const file of await readdir(wasmSource)) {
  await copyFile(path.join(wasmSource, file), path.join(root, 'public/wasm', file));
}
const destination = path.join(root, 'public/models/gesture_recognizer.task');
await mkdir(path.dirname(destination), {recursive: true});
try { await access(destination); console.log('Gesture model already installed.'); }
catch {
  const response = await fetch('https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task');
  if (!response.ok) throw new Error(`Model download failed: ${response.status}`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  console.log('Gesture model installed locally. Video analysis stays on this computer.');
}
