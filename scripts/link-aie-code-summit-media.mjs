// Link the v4 clean layers into public/ so Remotion can serve them: public/aie-code-summit-2026 becomes a
// link to Edit-v4-Three-Versions/media. The link is gitignored and the media (about 2.9 GB) is never copied
// or committed. A directory link is used because Remotion's renderer refuses to serve symlinked files.
// Usage: node scripts/link-aie-code-summit-media.mjs "/path/to/AIE-SF-CodeSummit-206/Edit-v4-Three-Versions"
import {existsSync, lstatSync, readdirSync, rmdirSync, symlinkSync, unlinkSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const v4 = process.argv[2] ?? process.env.AIE_V4_DIR;
if (!v4) throw new Error('Pass the Edit-v4-Three-Versions folder (or set AIE_V4_DIR).');
const media = path.resolve(v4, 'media');
for (const file of ['BG.png', 'SLIDE_PANEL.mp4', 'SPEAKER_PANEL.mp4', 'PROGRAM_AUDIO_V4.wav']) {
  if (!existsSync(path.join(media, file))) throw new Error(`Missing ${path.join(media, file)}`);
}
const dest = path.join(root, 'public/aie-code-summit-2026');
const stat = (p) => { try { return lstatSync(p); } catch { return null; } };
const current = stat(dest);
if (current?.isSymbolicLink()) unlinkSync(dest);
else if (current?.isDirectory()) {   // an older layout with one link per file
  const entries = readdirSync(dest);
  if (!entries.every(e => stat(path.join(dest, e))?.isSymbolicLink())) throw new Error(`${dest} holds real files; leaving it alone.`);
  entries.forEach(e => unlinkSync(path.join(dest, e)));
  rmdirSync(dest);
} else if (current) throw new Error(`${dest} exists; leaving it alone.`);
symlinkSync(media, dest, 'dir');
console.log(`public/aie-code-summit-2026 -> ${media}`);
