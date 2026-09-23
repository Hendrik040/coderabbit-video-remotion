import express from 'express';
import multer from 'multer';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir, access} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {existsSync} from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {tsImport} from 'tsx/esm/api';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {projectSchema} = await tsImport(path.join(root, 'src/lib/schema.ts'), import.meta.url);
const repository = path.resolve(root, '..');
const port = Number(process.env.PORT || 4319);
const baseUrl = `http://127.0.0.1:${port}`;
const data = process.env.MOTION_DATA_DIR || path.join(repository, '.studio-data');
const mediaDir = path.join(data, 'media');
const exportDir = path.join(repository, 'out/studio');
await Promise.all([mkdir(mediaDir, {recursive: true}), mkdir(exportDir, {recursive: true})]);
const app = express();
app.use((req, res, next) => {
  const host = req.hostname;
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(host)) return res.status(403).json({error: 'Motion Studio only accepts local connections.'});
  if (req.method !== 'GET' && req.headers.origin && ![baseUrl, `http://localhost:${port}`].includes(req.headers.origin)) return res.status(403).json({error: 'This request must come from the local Motion Studio app.'});
  next();
});
app.use(express.json({limit: '3mb'}));
app.use('/media', express.static(mediaDir));
app.use('/exports', express.static(exportDir, {setHeaders(res, filename) {res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);}}));
const upload = multer({storage: multer.diskStorage({destination: mediaDir, filename: (req, file, done) => done(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)}), limits: {fileSize: 300 * 1024 * 1024, files: 1}, fileFilter(req, file, done) {if (!/\.(mp4|mov|webm|m4v)$/i.test(file.originalname)) return done(new Error('Choose an MP4, MOV, or WebM video.')); done(null, true);}});
app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({error: 'No video was provided.'});
  res.json({url: `/media/${req.file.filename}`, name: req.file.originalname});
});
const jobs = new Map();
let activeJob = null;
const getBundle = () => bundle({entryPoint: path.join(root, 'src/remotion/index.tsx'), outDir: path.join(data, 'render-bundle'), publicDir: path.join(repository, 'public'), webpackOverride(config) {return {...config, cache: false};}});

app.post('/api/render', async (req, res) => {
  try {
    if (activeJob) return res.status(409).json({error: 'An export is already running. Wait for it to finish.'});
    const project = projectSchema.parse(req.body.project);
    if (project.mediaUrl) await access(path.join(mediaDir, path.basename(project.mediaUrl)));
    if (!project.sampleMode && !project.mediaUrl) return res.status(400).json({error: 'Import a source video before rendering.'});
    if (!['mp4', 'alpha'].includes(req.body.format)) return res.status(400).json({error: 'Choose MP4 or transparent overlay.'});
    const transparent = req.body.format === 'alpha';
    const id = randomUUID();
    const stem = project.brandAsset ? project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) : 'coderabbit';
    const filename = `${stem}-${id.slice(0, 8)}.${transparent ? 'mov' : 'mp4'}`;
    const job = {id, status: 'bundling', progress: 0, filename};
    jobs.set(id, job); activeJob = id;
    res.json(job);
    (async () => {
      try {
        const serveUrl = await getBundle();
        const props = {project: {...project, showTracking: project.sampleMode && !transparent ? project.showTracking : false, mediaUrl: project.mediaUrl ? `${baseUrl}${project.mediaUrl}` : null}, transparent};
        const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        const browserExecutable = existsSync(chromePath) ? chromePath : undefined;
        job.status = 'rendering';
        const composition = await selectComposition({serveUrl, id: 'CodeRabbitMotion', inputProps: props, browserExecutable});
        await renderMedia({composition, serveUrl, inputProps: props, outputLocation: path.join(exportDir, filename), browserExecutable, concurrency: 2, codec: transparent ? 'prores' : 'h264', ...(transparent ? {proResProfile: '4444', pixelFormat: 'yuva444p10le', imageFormat: 'png'} : {crf: 20}), onProgress({progress}) {job.progress = Math.round(progress * 100);}});
        job.status = 'done'; job.progress = 100; job.url = `/exports/${filename}`;
      } catch (error) {job.status = 'error'; job.error = error instanceof Error ? error.message : String(error); console.error('Export failed:', error);}
      finally {activeJob = null;}
    })();
  } catch (error) {res.status(400).json({error: error instanceof Error ? error.message : 'Invalid render request.'});}
});
app.get('/api/render/:id', (req, res) => {const job = jobs.get(req.params.id); job ? res.json(job) : res.status(404).json({error: 'Export not found.'});});
app.get('/api/health', (req, res) => res.json({ok: true, service: 'CodeRabbit Motion Studio', modelsReady: existsSync(path.join(repository, 'public/models/gesture_recognizer.task'))}));

if (process.env.NODE_ENV === 'production' || process.argv.includes('--production')) {
  app.use(express.static(path.join(repository, 'public')));
  app.use(express.static(path.join(root, 'dist')));
  app.get('/{*path}', (req, res) => res.sendFile(path.join(root, 'dist/index.html')));
} else {
  const {createServer} = await import('vite');
  const vite = await createServer({root, server: {middlewareMode: true, hmr: {port: port + 1, host: '127.0.0.1'}}, appType: 'spa'});
  app.use(vite.middlewares);
}
app.use((error, req, res, next) => {console.error(error.message); res.status(400).json({error: error.code === 'LIMIT_FILE_SIZE' ? 'Choose a video smaller than 300 MB.' : error.message || 'Something went wrong.'});});
app.listen(port, '127.0.0.1', () => console.log(`CodeRabbit Motion Studio → ${baseUrl}`));
