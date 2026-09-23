import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import {ArrowDownToLine, ArrowRight, ArrowUpRight, Check, Download, FolderOpen, Infinity as LoopIcon, Layers3, LoaderCircle, Pause, Play, Plus, RotateCcw, SlidersHorizontal, X} from 'lucide-react';
import {Scene} from './remotion/Scene';
import {AssetControls} from './brand/AssetControls';
import {isColorBar} from './lib/colorBar';
import {ChangeStackGlowThumbnail} from './brand/ChangeStackGlow';
import {assetProject, brandAssetDefaults, brandAssetKinds, brandAssetTemplates, cutFrame, isTransition} from './lib/brandAssets';
import {assetType, heroDefaults} from './lib/looping';
import {projectSchema} from './lib/schema';
import {clamp} from './lib/gesture';
import type {AssetType, BrandAssetKind, Overlay} from './types';
import './asset-studio.css';

type LibraryKind = BrandAssetKind | 'hero';
const catalog = {...brandAssetTemplates, hero: {code: 'BG-02', name: 'Change Stack glow', family: 'Backgrounds', duration: 16, alpha: false, title: '', body: '', titleMax: 40, bodyMax: 0, description: 'The product hero’s drifting light and independently flickering pixels.', usage: 'A quiet background for product stories and supporting titles.'}};
const libraryKinds: LibraryKind[] = [...brandAssetKinds, 'hero'];
const defaults = {...brandAssetDefaults, hero: heroDefaults};
const storageKey = 'coderabbit-brand-asset-presets-v1';
const initialPresets = () => {
  const presets = Object.fromEntries(libraryKinds.map(kind => [kind, {id: kind, ...defaults[kind]}])) as Record<LibraryKind, Overlay>;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    for (const kind of libraryKinds) {
      if (!saved[kind] || saved[kind].kind !== kind) continue;
      const result = projectSchema.safeParse(assetProject({...presets[kind], ...saved[kind]}));
      if (result.success) presets[kind] = result.data.overlays[0];
    }
  } catch { /* Invalid presets leave the bundled assets available. */ }
  return presets;
};
const timecode = (frame: number) => `${String(Math.floor(frame / 30)).padStart(2, '0')}:${String(frame % 30).padStart(2, '0')}`;
type AssetJob = {id: string; status: string; progress: number; url?: string; filename?: string; error?: string; assetName: string};

/** Rest on a useful frame; hover/focus plays the actual asset rather than a mock animation. */
export function AssetThumbnail({kind, animated = false, asset}: {kind: BrandAssetKind; animated?: boolean; asset?: Overlay}) {
  const project = useMemo(() => assetProject({...(asset ?? {id: kind, ...brandAssetDefaults[kind]}), ...(isColorBar(kind) ? {barHeight: 56, barPosition: 'center' as const} : {})}), [kind, asset]);
  const inputProps = useMemo(() => ({project}), [project]);
  return <div className="asset-thumb-player" aria-hidden="true"><Player key={`${kind}-${animated}`} component={Scene} inputProps={inputProps} durationInFrames={Math.ceil(project.duration * 30)} compositionWidth={1280} compositionHeight={720} fps={30} initialFrame={animated ? 0 : Math.floor(project.duration * 30 * (isTransition(kind) ? 0.24 : 0.48))} autoPlay={animated} loop controls={false} clickToPlay={false} style={{width: '100%', pointerEvents: 'none'}}/></div>;
}

export function AssetStudio({onOpenComposition, onAddToComposition}: {onOpenComposition: () => void; onAddToComposition: (asset: Overlay) => void}) {
  const [presets, setPresets] = useState(initialPresets);
  const [selected, setSelected] = useState<LibraryKind>('logo-reveal');
  const [group, setGroup] = useState<AssetType>('linear');
  const [hovered, setHovered] = useState<LibraryKind | null>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showAlpha, setShowAlpha] = useState(false);
  const [format, setFormat] = useState<'mp4' | 'alpha'>('mp4');
  const [resolution, setResolution] = useState(1280);
  const [job, setJob] = useState<AssetJob | null>(null);
  const [error, setError] = useState('');
  const player = useRef<PlayerRef>(null);
  const presetInput = useRef<HTMLInputElement>(null);
  const asset = presets[selected], meta = catalog[selected];
  const project = useMemo(() => assetProject(asset), [asset]);
  const inputProps = useMemo(() => ({project, transparent: showAlpha && meta.alpha}), [project, showAlpha, meta.alpha]);
  const frames = Math.ceil(project.duration * 30);
  const transition = isTransition(selected);
  const activeExport = !!job && !['done', 'error'].includes(job.status);
  const choose = (kind: LibraryKind) => {setSelected(kind); setGroup(assetType(kind)); setShowAlpha(false); if (!catalog[kind].alpha) setFormat('mp4');};
  const edit = (patch: Partial<Overlay>) => setPresets(previous => ({...previous, [selected]: {...previous[selected], ...patch}}));
  const seek = (next: number) => {player.current?.pause(); player.current?.seekTo(next); setFrame(next);};

  useEffect(() => {try {localStorage.setItem(storageKey, JSON.stringify(presets));} catch {setError('Could not save edits on this device. Use Save preset to keep this asset.');}}, [presets]);
  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const update = (event: {detail: {frame: number}}) => setFrame(event.detail.frame);
    const play = () => setPlaying(true), pause = () => setPlaying(false);
    p.addEventListener('frameupdate', update); p.addEventListener('play', play); p.addEventListener('pause', pause);
    setFrame(p.getCurrentFrame()); setPlaying(p.isPlaying());
    return () => {p.removeEventListener('frameupdate', update); p.removeEventListener('play', play); p.removeEventListener('pause', pause);};
  }, [selected, frames]);
  useEffect(() => {
    if (!job?.id || ['done', 'error'].includes(job.status)) return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/render/${job.id}`);
        if (!res.ok) throw new Error('Could not read the export status.');
        const next = await res.json();
        setJob(previous => previous?.id === job.id ? {...previous, ...next} : previous);
      } catch (e) {setJob(previous => previous ? {...previous, status: 'error', error: e instanceof Error ? e.message : 'Export connection lost.'} : previous);}
    }, 1000);
    return () => clearInterval(timer);
  }, [job?.id, job?.status]);

  async function exportAsset() {
    if (activeExport) return;
    const assetName = `${meta.code} · ${meta.name}`;
    setJob({id: '', status: 'starting', progress: 0, assetName});
    try {
      const response = await fetch('/api/render', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({project: assetProject(asset, resolution), format})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Export failed.');
      setJob({...result, assetName});
    } catch (e) {setJob({id: '', status: 'error', progress: 0, assetName, error: e instanceof Error ? e.message : 'Export failed.'});}
  }
  function savePreset() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], {type: 'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = `coderabbit-${meta.code.toLowerCase()}-${selected}.json`; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function openPreset(file?: File) {
    if (!file) return;
    try {
      if (file.size > 1000000) throw new Error('Choose an asset preset smaller than 1 MB.');
      const saved = projectSchema.parse(JSON.parse(await file.text()));
      if (saved.mediaUrl || saved.overlays.length !== 1 || !libraryKinds.includes(saved.overlays[0].kind as LibraryKind)) throw new Error('Choose a saved brand asset preset with a single asset.');
      const imported = saved.overlays[0], kind = imported.kind as LibraryKind;
      setPresets(previous => ({...previous, [kind]: {...imported, id: kind, start: 0, enabled: true}})); choose(kind);
    } catch (e) {setError(e instanceof Error ? e.message : 'Could not open the preset.');}
    finally {if (presetInput.current) presetInput.current.value = '';}
  }

  return <div className="asset-studio">
    <input ref={presetInput} type="file" accept="application/json,.json" hidden onChange={e => openPreset(e.target.files?.[0])}/>
    <header className="asset-header"><div className="asset-heading"><span className="asset-wordmark">Brand motion</span><span className="asset-header-divider"/><span className="asset-header-subtitle">CodeRabbit asset library</span></div><div className="asset-header-actions"><button className="button button-light" disabled={activeExport} onClick={onOpenComposition}><Layers3 size={14}/> Composition <ArrowUpRight size={13}/></button><button className="button button-dark" disabled={activeExport} onClick={exportAsset}>{activeExport ? <LoaderCircle className="spin" size={15}/> : <ArrowDownToLine size={15}/>} {activeExport ? `Exporting ${job.progress}%` : 'Export asset'}</button></div></header>
    <div className="asset-layout">
      <aside className="asset-library"><div className="asset-library-heading"><span>Library</span><span>{libraryKinds.length} assets</span></div>
        <div className="kit-switch" role="group" aria-label="Asset playback type">{(['linear', 'looping'] as const).map(type => <button key={type} aria-pressed={group === type} onClick={() => setGroup(type)}>{type === 'linear' ? 'Linear' : 'Looping'}<span>{libraryKinds.filter(kind => assetType(kind) === type).length}</span></button>)}</div>
        <div className="asset-library-cards">{libraryKinds.filter(kind => assetType(kind) === group).map(kind => <button key={kind} className={`asset-card ${selected === kind ? 'is-selected' : ''}`} aria-label={`Preview ${catalog[kind].name}`} aria-pressed={selected === kind} onClick={() => choose(kind)} onMouseEnter={() => setHovered(kind)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(kind)} onBlur={() => setHovered(null)}>
          <div className="asset-card-preview">{kind === 'hero' ? <ChangeStackGlowThumbnail overlay={presets[kind]}/> : <AssetThumbnail kind={kind} asset={presets[kind]} animated={hovered === kind || assetType(kind) === 'looping'}/>}<span className="asset-card-code">{catalog[kind].code}</span></div>
          <div className="asset-card-title"><strong>{catalog[kind].name}</strong>{assetType(kind) === 'looping' ? <LoopIcon size={12}/> : <span>{presets[kind].duration}s</span>}</div><span className="asset-card-family">{catalog[kind].family}</span>
        </button>)}</div>
        <div className="asset-library-bottom"><button className="text-button" onClick={() => presetInput.current?.click()}><FolderOpen size={14}/> Open preset</button><a href="https://www.coderabbit.ai/brand" target="_blank" rel="noreferrer" aria-label="CodeRabbit brand guidelines"><ArrowUpRight size={14}/></a></div>
      </aside>
      <main className="asset-main">
        <div className="asset-title-row"><div><div className="asset-eyebrow">{meta.code}<span>/</span>{meta.family}</div><h1>{meta.name}</h1></div><span className="asset-type-tag">{assetType(selected) === 'looping' ? <LoopIcon size={13}/> : <ArrowRight size={13}/>} {assetType(selected)}<i/>{project.duration}s</span></div>
        <p className="asset-description">{meta.description}</p>
        <div className={`asset-stage ${showAlpha && meta.alpha ? 'asset-checkerboard' : ''}`}><Player key={`${selected}-${frames}`} ref={player} component={Scene} inputProps={inputProps} durationInFrames={frames} compositionWidth={1280} compositionHeight={720} fps={30} autoPlay loop controls={false} clickToPlay={false} style={{width: '100%'}}/></div>
        <div className="asset-transport"><button className="asset-play" aria-label={playing ? 'Pause asset preview' : 'Play asset preview'} onClick={() => playing ? player.current?.pause() : player.current?.play()}>{playing ? <Pause size={15} fill="currentColor"/> : <Play size={15} fill="currentColor"/>}</button><span className="asset-timecode">{timecode(frame)} <span>/ {timecode(frames)}</span></span><input type="range" aria-label="Asset playhead" min={0} max={frames - 1} value={Math.min(frame, frames - 1)} onChange={e => seek(Number(e.target.value))}/><button className="icon-button" title="Replay asset" aria-label="Replay asset" onClick={() => {player.current?.seekTo(0); player.current?.play();}}><RotateCcw size={14}/></button>{meta.alpha && <button className={`asset-alpha-toggle ${showAlpha ? 'is-active' : ''}`} aria-label="Preview transparency" aria-pressed={showAlpha} onClick={() => setShowAlpha(!showAlpha)}><Layers3 size={14}/></button>}</div>
        <div className="asset-motion-strip" aria-label={transition ? 'Cover, cut, clear' : assetType(selected) === 'looping' ? 'Seamless cycle' : isColorBar(selected) ? 'Expand, hold' : 'Reveal, hold, exit'}>{assetType(selected) === 'looping' ? <div className="asset-cycle"><LoopIcon size={15}/><span>One complete cycle</span><span>{project.duration}s</span></div> : isColorBar(selected) ? <><span style={{flex: Math.min(3.2, project.duration)}}>Expand</span>{project.duration > 3.2 && <span style={{flex: project.duration - 3.2}}>Hold</span>}</> : <><span style={{flex: transition ? 36 : 18}}> {transition ? 'Cover' : 'Reveal'}</span><button disabled={!transition} style={{flex: transition ? 28 : 52}} onClick={() => seek(cutFrame(project.duration))}>{transition ? `Cut at ${timecode(cutFrame(project.duration))}` : 'Hold'}{transition && <i/>}</button><span style={{flex: transition ? 36 : 12}}>{transition ? 'Clear' : 'Exit'}</span></>}</div>
        <div className="asset-use-row"><div><span className="asset-eyebrow">Made to reuse</span><p>{meta.usage}</p></div><button className="button button-light" disabled={activeExport} onClick={() => {try {onAddToComposition(project.overlays[0]);} catch (e) {setError(e instanceof Error ? e.message : 'Could not add the asset.');}}}><Plus size={14}/> Add to composition</button></div>
      </main>
      <aside className="asset-inspector"><div className="asset-inspector-heading"><span>Customize</span><SlidersHorizontal size={15}/></div><section className="asset-inspector-section"><AssetControls asset={asset} onChange={edit}/>{assetType(selected) === 'linear' && <label className="field-label">Duration<span className="input-unit"><input type="number" aria-label="Asset duration" min={0.6} max={12} step={0.1} value={asset.duration} onChange={e => edit({duration: clamp(Number(e.target.value), 0.6, 12)})}/><span>s</span></span></label>}<button className="text-button asset-reset" onClick={() => setPresets(previous => ({...previous, [selected]: {id: selected, ...defaults[selected]}}))}><RotateCcw size={12}/> Reset asset</button></section>
        <section className="asset-inspector-section"><div className="asset-section-label">Export</div><label className="field-label">Format<select aria-label="Asset export format" disabled={activeExport} value={format} onChange={e => setFormat(e.target.value as 'mp4' | 'alpha')}><option value="mp4">MP4 · Finished video</option>{meta.alpha && <option value="alpha">ProRes 4444 · Transparent</option>}</select></label><label className="field-label">Resolution<select aria-label="Asset export resolution" disabled={activeExport} value={resolution} onChange={e => setResolution(Number(e.target.value))}><option value={1280}>1280 × 720</option><option value={1920}>1920 × 1080</option></select></label><div className="asset-export-details"><span>30 fps</span><span>{meta.alpha ? 'Alpha available' : 'Full-frame background'}</span></div>{transition && <p className="asset-export-hint">Use ProRes over your edit. The marked cut frame is fully covered.</p>}
          {job && <div className={`asset-job ${job.status === 'error' ? 'asset-job-error' : ''}`} role={job.status === 'error' ? 'alert' : 'status'}><span>{job.assetName}</span>{activeExport ? <><progress max={100} value={job.progress}/><p>{job.status === 'rendering' ? `Rendering ${job.progress}%` : 'Preparing export…'}</p></> : job.status === 'done' ? <a className="button button-dark full-width" href={job.url} download><Download size={13}/> Download asset <Check size={13}/></a> : <p>{job.error}</p>}</div>}
        </section>
        <div className="asset-inspector-bottom"><button className="button button-light full-width" onClick={savePreset}><Download size={14}/> Save preset</button></div>
      </aside>
    </div>
    {error && <div className="toast toast-error" role="alert"><span>{error}</span><button className="icon-button" aria-label="Dismiss message" onClick={() => setError('')}><X size={16}/></button></div>}
  </div>;
}
