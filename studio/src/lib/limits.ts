// Keep import validation, tracking, saved projects, and the render API in agreement.
export const MAX_VIDEO_SECONDS = 60 * 60;
// Containers can include a fraction of a frame of audio/encoder padding.
export const VIDEO_DURATION_TOLERANCE = 1 / 30;
export const MAX_UPLOAD_BYTES = 4 * 1024 ** 3;
export const MAX_PROJECT_BYTES = 32 * 1024 ** 2;
export const TRACKING_FPS = 12;
export const MAX_TRACKING_SAMPLES = MAX_VIDEO_SECONDS * TRACKING_FPS + 1;
export const VIDEO_LIMIT_LABEL = 'Up to 1 hour and 4 GB';
