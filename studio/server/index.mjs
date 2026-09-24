import express from 'express';
import multer from 'multer';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir, access, readFile, writeFile, rename, rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {existsSync} from 'node:fs';
import {bundle} from '@remotion/bundler';
import {makeCancelSignal, renderMedia, selectComposition} from '@remotion/renderer';
import {tsImport} from 'tsx/esm/api';
import {probeVideo} from './media.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {projectSchema} = await tsImport(path.join(root, 'src/lib/schema.ts'), import.meta.url);
const {MAX_UPLOAD_BYTES, MAX_PROJECT_BYTES} = await tsImport(path.join(root, 'src/lib/limits.ts'), import.meta.url);
const repository = path.resolve(root, '..');
const port = Number(process.env.PORT || 4319);
const baseUrl = `http://127.0.0.1:${port}`;
const data = path.resolve(process.env.MOTION_DATA_DIR || path.join(repository, '.studio-data'));
const mediaDir = path.join(data, 'media');
const exportDir = path.resolve(process.env.MOTION_EXPORT_DIR || path.join(repository, 'out/studio'));
await Promise.all([mkdir(mediaDir, {recursive: true}), mkdir(exportDir, {recursive: true})]);
const app = express();
app.use((req, res, next) => {
  const host = req.hostname;
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(host)) return res.status(403).json({error: 'Motion Studio only accepts local connections.'});
  if (req.method !== 'GET' && req.headers.origin && ![baseUrl, `http://localhost:${port}`].includes(req.headers.origin)) return res.status(403).json({error: 'This request must come from the local Motion Studio app.'});
  next();
});
app.use(express.json({limit: MAX_PROJECT_BYTES}));
app.use('/media', express.static(mediaDir), (req, res) => res.sendStatus(404));
app.use('/exports', express.static(exportDir, {setHeaders(res, filename) {res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);}}), (req, res) => res.sendStatus(404));

const upload = multer({
  storage: multer.diskStorage({destination: mediaDir, filename(req, file, done) {
    const filename = `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
    req.uploadPath = path.join(mediaDir, filename);
    done(null, filename);
  }}),
  limits: {fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 0},
  fileFilter(req, file, done) {
    if (!/\.(mp4|mov|webm|m4v)$/i.test(file.originalname)) return done(new Error('Choose an MP4, MOV, M4V, or WebM video.'));
    done(null, true);
  },
});
app.post('/api/upload', (req, res, next) => {
  // Keep cancelled/failed transfers out of the media library, including partial disk files.
  let accepted = false;
  const cleanup = () => {if (!accepted && req.uploadPath) void rm(req.uploadPath, {force: true}).catch(console.error);};
  res.on('close', cleanup);
  upload.single('video')(req, res, async error => {
    if (error) {cleanup(); return next(error);}
    try {
      if (!req.file) throw new Error('No video was provided.');
      const metadata = await probeVideo(req.file.path);
      if (req.aborted || res.destroyed) {cleanup(); return;}
      res.json({url: `/media/${req.file.filename}`, name: req.file.originalname, ...metadata});
      accepted = true;
    } catch (error) {cleanup(); next(error);}
  });
});

const terminalStatuses = ['done', 'error', 'cancelled'];
const jobsFile = path.join(data, 'render-jobs.json');
const jobs = new Map();
try {
  const saved = JSON.parse(await readFile(jobsFile, 'utf8'));
  for (const job of saved.slice(-30)) {
    if (!terminalStatuses.includes(job.status)) {
      job.status = 'error'; job.error = 'The local server stopped before this export finished. Render again to restart.';
      await rm(path.join(exportDir, path.basename(job.filename)), {force: true});
    }
    jobs.set(job.id, job);
  }
} catch (error) {if (error.code !== 'ENOENT') console.error('Could not restore export history:', error.message);}
let journal = Promise.resolve();
function saveJobs() {
  const snapshot = JSON.stringify([...jobs.values()].slice(-30));
  journal = journal.catch(() => {}).then(async () => {
    await writeFile(`${jobsFile}.tmp`, snapshot);
    await rename(`${jobsFile}.tmp`, jobsFile);
  });
  journal.catch(error => console.error('Could not save export status:', error.message));
  return journal;
}
if (jobs.size) await saveJobs();
let activeJob = null;
let cancelActive = null;
const getBundle = () => bundle({entryPoint: path.join(root, 'src/remotion/index.tsx'), outDir: path.join(data, 'render-bundle'), publicDir: path.join(repository, 'public'), webpackOverride(config) {return {...config, cache: false};}});

app.post('/api/render', (req, res) => {
  try {
    // Reserve the slot synchronously, before any asynchronous source checks.
    const id = req.body.id ?? randomUUID();
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) throw new Error('Invalid export ID.');
    if (jobs.has(id)) return res.json(jobs.get(id));
    if (activeJob) return res.status(409).json({error: 'An export is already running.', job: jobs.get(activeJob)});
    const project = projectSchema.parse(req.body.project);
    if (!['mp4', 'alpha'].includes(req.body.format)) throw new Error('Choose MP4 or transparent overlay.');
    const transparent = req.body.format === 'alpha';
    if (!transparent && !project.sampleMode && !project.mediaUrl) throw new Error('Import a source video before rendering.');
    const stem = project.brandAsset ? project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) : 'coderabbit';
    const filename = `${stem}-${id.slice(0, 8)}.${transparent ? 'mov' : 'mp4'}`;
    const job = {id, status: 'bundling', progress: 0, filename, assetName: project.name};
    const {cancel, cancelSignal} = makeCancelSignal();
    jobs.set(id, job); activeJob = id; cancelActive = cancel;
    while (jobs.size > 30) jobs.delete(jobs.keys().next().value);
    void saveJobs();
    res.json(job);
    void (async () => {
      const outputLocation = path.join(exportDir, filename);
      const checkCancelled = () => {if (job.status === 'cancelling') throw new Error('Export cancelled.');};
      try {
        if (!transparent && project.mediaUrl) {
          const source = path.join(mediaDir, path.basename(project.mediaUrl));
          await access(source).catch(() => {throw new Error('Source video is missing. Import it again before exporting.');});
          const metadata = await probeVideo(source);
          if (project.duration > metadata.duration + 1 / project.fps) throw new Error('The project is longer than its source video. Import the source again.');
        }
        checkCancelled();
        const serveUrl = await getBundle();
        checkCancelled();
        const props = {project: {...project, showTracking: project.sampleMode && !transparent ? project.showTracking : false, mediaUrl: !transparent && project.mediaUrl ? `${baseUrl}${project.mediaUrl}` : null}, transparent};
        const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        const browserExecutable = existsSync(chromePath) ? chromePath : undefined;
        const composition = await selectComposition({serveUrl, id: 'CodeRabbitMotion', inputProps: props, browserExecutable});
        checkCancelled(); job.status = 'rendering'; void saveJobs();
        await renderMedia({composition, serveUrl, inputProps: props, outputLocation, browserExecutable, cancelSignal, concurrency: 2,
          offthreadVideoCacheSizeInBytes: 256 * 1024 ** 2,
          codec: transparent ? 'prores' : 'h264',
          ...(transparent ? {proResProfile: '4444', pixelFormat: 'yuva444p10le', imageFormat: 'png', muted: true} : {crf: 20, audioCodec: 'aac'}),
          onProgress({progress}) {job.progress = Math.min(99, Math.round(progress * 100));},
        });
        checkCancelled();
        job.status = 'done'; job.progress = 100; job.url = `/exports/${filename}`;
      } catch (error) {
        job.status = job.status === 'cancelling' ? 'cancelled' : 'error';
        if (job.status === 'error') {job.error = error instanceof Error ? error.message : String(error); console.error('Export failed:', error);}
        await rm(outputLocation, {force: true}).catch(console.error);
      } finally {
        activeJob = null; cancelActive = null; void saveJobs();
      }
    })();
  } catch (error) {res.status(400).json({error: error instanceof Error ? error.message : 'Invalid render request.'});}
});
app.get('/api/render/latest', (req, res) => res.json({job: activeJob ? jobs.get(activeJob) : [...jobs.values()].at(-1) ?? null}));
app.get('/api/render/:id', (req, res) => {const job = jobs.get(req.params.id); job ? res.json(job) : res.status(404).json({error: 'Export not found.'});});
app.post('/api/render/:id/cancel', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({error: 'Export not found.'});
  if (!terminalStatuses.includes(job.status)) {job.status = 'cancelling'; cancelActive?.(); void saveJobs();}
  res.json(job);
});
app.get('/api/health', (req, res) => res.json({ok: true, service: 'CodeRabbit Motion Studio', modelsReady: existsSync(path.join(repository, 'public/models/gesture_recognizer.task'))}));
app.use('/api', (req, res) => res.status(404).json({error: 'API endpoint not found.'}));

if (process.env.NODE_ENV === 'production' || process.argv.includes('--production')) {
  app.use(express.static(path.join(repository, 'public')));
  app.use(express.static(path.join(root, 'dist')));
  app.get('/{*path}', (req, res) => res.sendFile(path.join(root, 'dist/index.html')));
} else {
  const {createServer} = await import('vite');
  const vite = await createServer({root, server: {middlewareMode: true, hmr: {port: port + 1, host: '127.0.0.1'}}, appType: 'spa'});
  app.use(vite.middlewares);
}
app.use((error, req, res, next) => {
  console.error(error.message);
  if (res.headersSent || res.destroyed) return;
  res.status(error.status === 413 || error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({error: error.code === 'LIMIT_FILE_SIZE' ? 'Choose a video up to 4 GB.' : error.message || 'Something went wrong.'});
});
const server = app.listen(port, '127.0.0.1', () => console.log(`CodeRabbit Motion Studio → ${baseUrl}`));
// Streaming multi-gigabyte local uploads can take more than Node's default five minutes.
server.requestTimeout = 0;
