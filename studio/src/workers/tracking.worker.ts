import {FilesetResolver, GestureRecognizer} from '@mediapipe/tasks-vision';
import type {Gesture, Sample} from '../types';
let recognizer: GestureRecognizer | null = null;
self.onmessage = async (event: MessageEvent) => {
  const {type, bitmap, time, baseUrl} = event.data;
  try {
    if (type === 'init') {
      const vision = await FilesetResolver.forVisionTasks(`${baseUrl}/wasm`, true);
      recognizer = await GestureRecognizer.createFromOptions(vision, {baseOptions: {modelAssetPath: `${baseUrl}/models/gesture_recognizer.task`, delegate: 'CPU'}, runningMode: 'VIDEO', numHands: 1, minHandDetectionConfidence: 0.5, minTrackingConfidence: 0.5});
      self.postMessage({type: 'ready'});
    } else if (type === 'frame' && recognizer) {
      const result = recognizer.recognizeForVideo(bitmap, time * 1000);
      const landmarks = result.landmarks[0];
      let sample: Sample = {t: time, x: 0.5, y: 0.5, pinch: 1, confidence: 0, gesture: 'None', visible: false};
      if (landmarks) {
        const distance = (a: number, b: number) => Math.hypot(landmarks[a].x - landmarks[b].x, landmarks[a].y - landmarks[b].y);
        const pinch = distance(4, 8) / Math.max(0.01, distance(0, 9));
        const category = result.gestures[0]?.[0];
        let gesture: Gesture = category?.categoryName === 'Open_Palm' ? 'Open_Palm' : category?.categoryName === 'Pointing_Up' ? 'Pointing_Up' : 'None';
        if (pinch < 0.28) gesture = 'Pinch';
        sample = {t: time, x: landmarks[9].x, y: landmarks[9].y, pinch, confidence: gesture === 'Pinch' ? 0.9 : category?.score ?? 0, gesture, visible: true};
      }
      bitmap.close();
      self.postMessage({type: 'sample', sample});
    }
  } catch (error) {
    bitmap?.close();
    self.postMessage({type: 'error', message: error instanceof Error ? error.message : 'Hand tracking failed.'});
  }
};
