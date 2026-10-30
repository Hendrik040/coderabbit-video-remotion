// Render the Antigravity launch inserts (worked example for .claude/skills/product-ui-animations):
// review stills and ProRes masters at 29.97 fps.
// Usage: node scripts/render-antigravity.mjs [--stills] [--only=AGD1PromptLoop,AG05Finding] [--out=/abs/graphics/dir]
import {mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = name => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=')[1];
const output = arg('out') ?? path.join(root, 'out/antigravity');
const stillDir = path.join(output, 'frames');
const only = arg('only')?.split(',');
await mkdir(stillDir, {recursive: true});

// alpha: overlays composited on the presenter; opaque: full-frame stages.
const shots = [
  {id: 'AG08CliInstall', file: '08-cli-install', alpha: true, stills: [60, 110, 170]},
  {id: 'AGD1PromptLoop', file: 'd1-prompt-loop', alpha: true, stills: [45, 130, 200, 300, 420]},
  {id: 'AGD2LoginDemo', file: 'd2-login-demo', alpha: true, stills: [70, 128, 160, 190]},
  {id: 'AG04Questions', file: '04-questions', alpha: true, stills: [40, 130]},
  {id: 'AGD3ReviewRun', file: 'd3-review-run', alpha: true, stills: [40, 110]},
  {id: 'AG05Finding', file: '05-finding', alpha: false, stills: [40, 110, 180, 230, 300]},
  {id: 'AGD4FilesChanged', file: 'd4-files-changed', alpha: true, stills: [20, 50]},
  {id: 'AG07EndCard', file: '07-end', alpha: false, stills: [40, 84]},
].filter(s => !only || only.includes(s.id));
const unknown = only?.filter(id => !shots.some(s => s.id === id)) ?? [];
if (unknown.length) throw new Error(`Not in shots: ${unknown.join(', ')}. Add new inserts to the shots list first.`);

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browserExecutable = existsSync(chrome) ? chrome : undefined;
const serveUrl = await bundle({entryPoint: path.join(root, 'src/antigravity/index.tsx'), publicDir: path.join(root, 'public')});

for (const shot of shots) {
  const composition = await selectComposition({serveUrl, id: shot.id, browserExecutable});
  for (const frame of shot.stills) {
    await renderStill({serveUrl, composition, browserExecutable, frame, imageFormat: 'png', output: path.join(stillDir, `${shot.file}-${String(frame).padStart(3, '0')}.png`)});
  }
  console.log(`stills ${shot.file}`);
  if (process.argv.includes('--stills')) continue;
  await renderMedia({
    serveUrl, composition, browserExecutable, muted: true, concurrency: 4,
    codec: 'prores', proResProfile: shot.alpha ? '4444' : 'hq',
    pixelFormat: shot.alpha ? 'yuva444p10le' : 'yuv422p10le', imageFormat: shot.alpha ? 'png' : 'jpeg', jpegQuality: 95,
    outputLocation: path.join(output, `${shot.file}.mov`),
  });
  console.log(`rendered ${shot.file}.mov (${composition.durationInFrames} frames)`);
}
