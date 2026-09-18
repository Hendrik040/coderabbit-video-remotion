import type {Sample} from '../types';
import {deriveCues, smoothSamples} from './gesture';

export async function analyzeVideo(src: string, duration: number, onProgress: (value: number) => void, signal: AbortSignal) {
  const worker = new Worker(new URL('../workers/tracking.worker.ts', import.meta.url), {type: 'module'});
  const video = document.createElement('video');
  video.muted = true; video.preload = 'auto'; video.crossOrigin = 'anonymous';
  const waitVideo = (event: string) => new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => done(new Error('The video decoder timed out. Try an MP4/H.264 clip.')), 20000);
    const success = () => done();
    const error = () => done(new Error('Could not decode this video. Try an MP4/H.264 clip.'));
    const abort = () => done(new DOMException('Analysis cancelled.', 'AbortError'));
    function done(err?: Error) {clearTimeout(timeout); video.removeEventListener(event, success); video.removeEventListener('error', error); signal.removeEventListener('abort', abort); err ? reject(err) : resolve();}
    video.addEventListener(event, success, {once: true}); video.addEventListener('error', error, {once: true}); signal.addEventListener('abort', abort, {once: true});
  });
  const request = (data: Record<string, unknown>, transfer: Transferable[] = []) => new Promise<any>((resolve, reject) => {
    if (signal.aborted) {reject(new DOMException('Analysis cancelled.', 'AbortError')); return;}
    const timeout = window.setTimeout(() => finish(new Error('Tracking timed out. Make sure local model files are installed.')), 60000);
    const abort = () => finish(new DOMException('Analysis cancelled.', 'AbortError'));
    function finish(err?: Error, result?: unknown) {clearTimeout(timeout); worker.onmessage = null; worker.onerror = null; signal.removeEventListener('abort', abort); err ? reject(err) : resolve(result);}
    worker.onmessage = e => e.data.type === 'error' ? finish(new Error(e.data.message)) : finish(undefined, e.data);
    worker.onerror = e => finish(new Error(e.message || 'Unable to start hand tracking.'));
    signal.addEventListener('abort', abort, {once: true}); worker.postMessage(data, transfer);
  });
  try {
    const loaded = waitVideo('loadeddata'); video.src = src; await loaded;
    await request({type: 'init', baseUrl: window.location.origin});
    const samples: Sample[] = [];
    const total = Math.ceil(duration * 12);
    for (let i = 0; i < total; i++) {
      if (signal.aborted) throw new DOMException('Analysis cancelled.', 'AbortError');
      const time = Math.min(i / 12, video.duration - 0.001);
      if (Math.abs(video.currentTime - time) > 0.0001) {const sought = waitVideo('seeked'); video.currentTime = time; await sought;}
      const bitmap = await createImageBitmap(video, {resizeWidth: Math.min(640, video.videoWidth), resizeQuality: 'low'});
      const response = await request({type: 'frame', time, bitmap}, [bitmap]);
      // Match the preview's object-fit: contain, including portrait letterboxing.
      const scale = Math.min(1280 / video.videoWidth, 720 / video.videoHeight);
      const renderedWidth = video.videoWidth * scale, renderedHeight = video.videoHeight * scale;
      samples.push({...response.sample, x: ((1280 - renderedWidth) / 2 + response.sample.x * renderedWidth) / 1280, y: ((720 - renderedHeight) / 2 + response.sample.y * renderedHeight) / 720}); onProgress((i + 1) / total);
    }
    const smooth = smoothSamples(samples);
    return {samples: smooth, cues: deriveCues(smooth)};
  } finally {worker.terminate(); video.removeAttribute('src'); video.load();}
}
