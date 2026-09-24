import React, {useEffect, useState, type RefObject} from 'react';
import type {PlayerRef} from '@remotion/player';
import {Layers3, Pause, Play, RotateCcw} from 'lucide-react';
import {useReducedMotion} from '../hooks/usePreviewActivity';

export const timecode = (frame: number) => `${String(Math.floor(frame / 30)).padStart(2, '0')}:${String(frame % 30).padStart(2, '0')}`;

/** Subscribe here so 30 fps playback never rerenders the library or inspector. */
export function AssetTransport({player, frames, alpha, showAlpha, onAlphaChange}: {
  player: RefObject<PlayerRef | null>; frames: number; alpha: boolean;
  showAlpha: boolean; onAlphaChange: (show: boolean) => void;
}) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    if (p.getCurrentFrame() >= frames) p.seekTo(frames - 1);
    const update = (event: {detail: {frame: number}}) => setFrame(event.detail.frame);
    const play = () => setPlaying(true), pause = () => setPlaying(false);
    p.addEventListener('frameupdate', update);
    p.addEventListener('seeked', update);
    p.addEventListener('play', play);
    p.addEventListener('pause', pause);
    p.addEventListener('ended', pause);
    setFrame(p.getCurrentFrame());
    setPlaying(p.isPlaying());
    return () => {
      p.removeEventListener('frameupdate', update);
      p.removeEventListener('seeked', update);
      p.removeEventListener('play', play);
      p.removeEventListener('pause', pause);
      p.removeEventListener('ended', pause);
    };
  }, [player, frames]);

  useEffect(() => {if (reduced) player.current?.pause();}, [player, reduced]);
  useEffect(() => {
    const pauseWhenHidden = () => {if (document.hidden) player.current?.pause();};
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, [player]);

  return <div className="asset-transport">
    <div className="asset-transport-controls">
      <div className="asset-transport-playback">
        <button className="asset-play" aria-label={playing ? 'Pause asset preview' : 'Play asset preview'} onClick={() => playing ? player.current?.pause() : player.current?.play()}>{playing ? <Pause size={15} fill="currentColor"/> : <Play size={15} fill="currentColor"/>}</button>
        <span className="asset-timecode">{timecode(frame)} <span>/ {timecode(frames)}</span></span>
      </div>
      <div className="asset-transport-actions">
        <button className="icon-button" title="Replay asset" aria-label="Replay asset" onClick={() => {player.current?.seekTo(0); player.current?.play();}}><RotateCcw size={14}/></button>
        {alpha && <button className={`asset-alpha-toggle ${showAlpha ? 'is-active' : ''}`} aria-label="Preview transparency" aria-pressed={showAlpha} onClick={() => onAlphaChange(!showAlpha)}><Layers3 size={14}/></button>}
      </div>
    </div>
    <input type="range" aria-label="Asset playhead" min={0} max={frames - 1} value={Math.min(frame, frames - 1)} onChange={e => {player.current?.pause(); player.current?.seekTo(Number(e.target.value));}}/>
  </div>;
}
