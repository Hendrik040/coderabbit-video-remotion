import {RenderInternals} from '@remotion/renderer';
import {tsImport} from 'tsx/esm/api';

const {validateVideoDuration} = await tsImport(new URL('../src/lib/media.ts', import.meta.url).href, import.meta.url);

export function videoMetadata(metadata) {
  const video = metadata.streams?.find(stream => stream.codec_type === 'video' && !stream.disposition?.attached_pic);
  if (!video?.width || !video?.height) throw new Error('This file does not contain a readable video track.');
  const streamDuration = Number(video.duration);
  const duration = validateVideoDuration(Number.isFinite(streamDuration) && streamDuration > 0 ? streamDuration : Number(metadata.format?.duration));
  return {duration, width: video.width, height: video.height, hasAudio: metadata.streams.some(stream => stream.codec_type === 'audio')};
}

export async function probeVideo(filename) {
  let stdout;
  try {
    ({stdout} = await RenderInternals.callFf({bin: 'ffprobe', args: ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', filename], indent: false, logLevel: 'error', binariesDirectory: null, options: {timeout: 120000, maxBuffer: 4 * 1024 * 1024}}));
  } catch {throw new Error('Unable to read this video. Try MP4 with H.264 video and AAC audio.');}
  return videoMetadata(JSON.parse(stdout));
}
