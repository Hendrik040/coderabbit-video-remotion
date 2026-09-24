import {MAX_UPLOAD_BYTES, MAX_VIDEO_SECONDS, VIDEO_DURATION_TOLERANCE, VIDEO_LIMIT_LABEL} from './limits';

export function validateVideoFile(file: Pick<File, 'name' | 'size'>) {
  if (!/\.(mp4|mov|webm|m4v)$/i.test(file.name)) throw new Error('Choose an MP4, MOV, M4V, or WebM video.');
  if (!file.size) throw new Error('This video file is empty.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`${VIDEO_LIMIT_LABEL} per video.`);
}

export function validateVideoDuration(duration: number) {
  if (!Number.isFinite(duration) || duration < 0.1 || duration > MAX_VIDEO_SECONDS + VIDEO_DURATION_TOLERANCE) throw new Error('Choose a video between 0.1 seconds and 1 hour.');
  return Math.min(duration, MAX_VIDEO_SECONDS);
}

export async function readVideoDuration(file: File, signal: AbortSignal) {
  validateVideoFile(file);
  signal.throwIfAborted();
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  try {
    return await new Promise<number>((resolve, reject) => {
      const finish = (error?: Error) => {
        clearTimeout(timer); signal.removeEventListener('abort', abort);
        video.onloadedmetadata = null; video.onerror = null;
        if (error) reject(error);
        else {try {resolve(validateVideoDuration(video.duration));} catch (e) {reject(e);}}
      };
      const abort = () => finish(new DOMException('Import cancelled.', 'AbortError'));
      const timer = window.setTimeout(() => finish(new Error('Unable to read this video. Try MP4 with H.264 video and AAC audio.')), 30000);
      signal.addEventListener('abort', abort, {once: true});
      video.onloadedmetadata = () => finish();
      video.onerror = () => finish(new Error('This browser cannot play that video. Try MP4 with H.264 video and AAC audio.'));
      video.src = url;
    });
  } finally {
    video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url);
  }
}

export function uploadVideo(file: File, signal: AbortSignal, onProgress: (progress: number) => void) {
  signal.throwIfAborted();
  return new Promise<{url: string; duration: number}>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    const finish = (error?: Error, result?: {url: string; duration: number}) => {
      signal.removeEventListener('abort', abort);
      error ? reject(error) : resolve(result!);
    };
    request.open('POST', '/api/upload');
    request.responseType = 'json';
    // The server streams to disk. A large local file must not hit a short request timeout.
    request.upload.onprogress = event => {if (event.lengthComputable) onProgress(event.loaded / event.total);};
    request.onload = () => {
      const result = request.response;
      if (request.status < 200 || request.status >= 300) return finish(new Error(result?.error ?? 'Video import failed.'));
      if (!result?.url || !Number.isFinite(result.duration)) return finish(new Error('The server returned invalid video metadata.'));
      finish(undefined, result);
    };
    request.onerror = () => finish(new Error('Import connection lost. Keep the local studio server running and try again.'));
    request.onabort = () => finish(new DOMException('Import cancelled.', 'AbortError'));
    signal.addEventListener('abort', abort, {once: true});
    const data = new FormData(); data.append('video', file); request.send(data);
  });
}
