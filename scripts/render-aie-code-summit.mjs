// Render the AIE Code Summit 2026 motion package (src/aie-code-summit-2026): review stills, the three
// program versions and transparent ProRes 4444 overlays.
// Link the clean layers first: node scripts/link-aie-code-summit-media.mjs "<.../Edit-v4-Three-Versions>"
//
//   node scripts/render-aie-code-summit.mjs --stills=45,420,3290 [--version=full]   PNG stills of the program
//   node scripts/render-aie-code-summit.mjs --program [--version=light] [--frames=0-2399]
//   node scripts/render-aie-code-summit.mjs --overlay [--version=full] [--only=card] [--frames=12463-12899]
//   --out=<dir> (default out/aie-code-summit-2026), --concurrency=<n> (default 8)
//
// --program writes AIE26-<Version>.mov (H.264 + 16-bit PCM, Rec.709: the sample-exact master) and then, with
// ffmpeg on PATH, AIE26-<Version>.mp4 (same video, AAC 256k mono, like the v4 delivery). Remotion's own AAC
// output carries no priming edit list, so its audio would decode 2,048 samples (43 ms) late; ffmpeg's does.
import {mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = name => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=')[1];
const flag = name => process.argv.includes(`--${name}`);
const out = path.resolve(arg('out') ?? path.join(root, 'out/aie-code-summit-2026'));
const versions = (arg('version') ?? 'plain,light,full').split(',');
const names = {plain: 'Plain', light: 'Light', full: 'Full'};
const unknown = versions.filter(v => !names[v]);
if (unknown.length) throw new Error(`Unknown version ${unknown.join(', ')} (plain, light, full)`);
const frames = arg('frames')?.split('-').map(Number);
const only = arg('only');
const concurrency = Number(arg('concurrency') ?? 8);
if (!existsSync(path.join(root, 'public/aie-code-summit-2026/SLIDE_PANEL.mp4'))) {
  throw new Error('Media not linked. Run scripts/link-aie-code-summit-media.mjs first.');
}

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browserExecutable = existsSync(chrome) ? chrome : undefined;
const serveUrl = await bundle({entryPoint: path.join(root, 'src/aie-code-summit-2026/index.tsx'), publicDir: path.join(root, 'public')});
await mkdir(out, {recursive: true});
const progress = label => ({progress}) => process.stdout.write(`\r${label} ${(progress * 100).toFixed(1)}%   `);

for (const v of versions) {
  if (arg('stills')) {
    const composition = await selectComposition({serveUrl, id: `AIE26-${names[v]}`, browserExecutable});
    await mkdir(path.join(out, 'stills'), {recursive: true});
    for (const frame of arg('stills').split(',').map(Number)) {
      const output = path.join(out, 'stills', `${v}-${String(frame).padStart(5, '0')}.png`);
      await renderStill({serveUrl, composition, browserExecutable, frame, imageFormat: 'png', output, timeoutInMilliseconds: 120000});
      console.log(output);
    }
  }
  if (flag('program')) {
    const composition = await selectComposition({serveUrl, id: `AIE26-${names[v]}`, browserExecutable});
    const base = path.join(out, `AIE26-${names[v]}${frames ? `-${frames.join('-')}` : ''}`);
    await renderMedia({
      serveUrl, composition, browserExecutable, concurrency, frameRange: frames ? [frames[0], frames[1]] : null,
      codec: 'h264', crf: 16, pixelFormat: 'yuv420p', colorSpace: 'bt709', imageFormat: 'png',
      audioCodec: 'pcm-16', outputLocation: `${base}.mov`, timeoutInMilliseconds: 120000, onProgress: progress(names[v]),
    });
    console.log(`\n${base}.mov`);
    const mux = spawnSync(process.env.FFMPEG ?? 'ffmpeg', ['-v', 'error', '-y', '-i', `${base}.mov`, '-map', '0:v', '-map', '0:a',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ac', '1', '-movflags', '+faststart', `${base}.mp4`], {stdio: 'inherit'});
    console.log(mux.status === 0 ? `${base}.mp4` : `ffmpeg not available or failed; the .mov is the deliverable (${mux.error?.message ?? mux.status})`);
  }
  if (flag('overlay')) {
    const composition = await selectComposition({serveUrl, id: `AIE26-Overlay-${names[v]}`, inputProps: {version: v, only}, browserExecutable});
    const outputLocation = path.join(out, `AIE26-Overlay-${names[v]}${only ? `-${only}` : ''}${frames ? `-${frames.join('-')}` : ''}.mov`);
    await renderMedia({
      serveUrl, composition, browserExecutable, concurrency, inputProps: {version: v, only}, frameRange: frames ? [frames[0], frames[1]] : null,
      codec: 'prores', proResProfile: '4444', pixelFormat: 'yuva444p10le', imageFormat: 'png', muted: true,
      outputLocation, timeoutInMilliseconds: 120000, onProgress: progress(`overlay ${names[v]}`),
    });
    console.log(`\n${outputLocation}`);
  }
}
