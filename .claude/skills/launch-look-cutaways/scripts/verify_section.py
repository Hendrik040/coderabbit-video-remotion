"""Check a section render: frame count, stream tags, loudness, and voice sync against the dialogue master.

Usage: python3 -I verify_section.py <section.mp4> <dialogue.wav> <start_seconds> <expected_frames>
"""
import json
import subprocess
import sys

import numpy as np

clip, dialogue, start, expected = sys.argv[1], sys.argv[2], float(sys.argv[3]), int(sys.argv[4])

probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-of', 'json', clip],
                                  capture_output=True, text=True, check=True).stdout)
video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
audio = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
frames = int(video['nb_read_frames'])
print(f"video {video['width']}x{video['height']} {video['r_frame_rate']} {video['pix_fmt']} {video.get('color_space')}/{video.get('color_range')}"
      f" frames={frames} (expected {expected}) {'OK' if frames == expected else 'MISMATCH'}")
print(f"audio {audio['codec_name']} {audio['sample_rate']} Hz, {float(audio['duration']):.3f}s")

decode = subprocess.run(['ffmpeg', '-v', 'error', '-i', clip, '-f', 'null', '-'], capture_output=True, text=True)
print('decode errors:', decode.stderr.strip() or 'none')

loud = subprocess.run(['ffmpeg', '-hide_banner', '-i', clip, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
summary = loud[loud.rfind('Summary:'):]
lufs = [line.split(':')[1].strip() for line in summary.splitlines() if line.strip().startswith(('I:', 'Peak:'))]
print('loudness (integrated, true peak):', ', '.join(lufs))


def pcm(path, offset, seconds):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{offset:.6f}', '-t', f'{seconds:.6f}', '-i', path, '-ac', '1', '-ar', '48000',
                          '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


# Cross-correlate one-second windows of the section's mix with the dialogue master at the same output time.
for at in (1.0, 6.0, 12.0):
    mixed, voice = pcm(clip, at, 1.0), pcm(dialogue, start + at - 0.05, 1.1)
    corr = np.correlate(voice, mixed, mode='valid')
    lag = int(np.argmax(np.abs(corr))) - int(0.05 * 48000)
    print(f'sync at section {at:4.1f}s: {lag:+d} samples')
