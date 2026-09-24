import {useRenderJob} from './hooks/useRenderJob';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import {ArrowDownToLine, ArrowRight, ArrowUpRight, Check, Download, FolderOpen, Infinity as LoopIcon, Layers3, LoaderCircle, Plus, RotateCcw, SlidersHorizontal, X} from 'lucide-react';
import {Scene} from './remotion/Scene';
import {AssetControls} from './brand/AssetControls';
import {colorBarIntroTiming, colorBarRevealTiming, colorBarTransitionTiming, isColorBar} from './lib/colorBar';
import {pixelWipeTiming} from './lib/pixelWipe';
import {AssetThumbnail} from './components/AssetThumbnail';
import {LibrarySection} from './components/LibrarySection';
import {matchingNameIntroPreset} from './lib/nameIntroPresets';
import {groupLibraryKinds} from './lib/assetLibrary';
import {isProductAsset} from './lib/productAssets';
import {productEditFrame, productTimeline, productStepPatch} from './lib/productMotion';
import {assetProject, availableBrandAssetKinds, brandAssetDefaults, brandAssetTemplates, cutFrame, isNameIntro, isTransition} from './lib/brandAssets';
import {assetType, heroDefaults} from './lib/looping';
import {projectSchema} from './lib/schema';
import {clamp} from './lib/gesture';
import {revealTiming} from './lib/motion';
import {useReducedMotion} from './hooks/usePreviewActivity';
import {AssetTransport, timecode} from './components/AssetTransport';
import {ExportDialog} from './components/ExportDialog';
import type {AssetType, BrandAssetKind, Overlay} from './types';
import './asset-studio.css';
import './asset-library.css';

type LibraryKind = BrandAssetKind | 'hero';
const catalog = {...brandAssetTemplates, hero: {code: 'BG-02', name: 'Change Stack glow', family: 'Backgrounds', duration: 16, alpha: false, title: '', body: '', titleMax: 40, bodyMax: 0, description: 'The product hero’s drifting light and independently flickering pixels.', usage: 'A quiet background for product stories and supporting titles.'}};
const libraryKinds: LibraryKind[] = [...availableBrandAssetKinds, 'hero'];
const defaults = {...brandAssetDefaults, hero: heroDefaults};
const storageKey = 'coderabbit-brand-asset-presets-v1';
const initialPresets = () => {
  const presets = Object.fromEntries(libraryKinds.map(kind => [kind, {id: kind, ...defaults[kind]}])) as Record<LibraryKind, Overlay>;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    for (const kind of libraryKinds) {
      if (!saved[kind] || saved[kind].kind !== kind) continue;
      const result = projectSchema.safeParse(assetProject({...presets[kind], ...saved[kind]}));
      if (result.success) {
        const restored = result.data.overlays[0];
        presets[kind] = {...restored, id: kind, kind};
        // Keep the original intro's content and seed the new card from the former wipe option.
        if (kind === 'name-intro' && restored.kind === 'name-intro-wipe') {
          presets['name-intro-wipe'] = {...restored, id: 'name-intro-wipe'};
        }
      }
    }
  } catch { /* Invalid presets leave the bundled assets available. */ }
  return presets;
};
export function AssetStudio({onOpenComposition, onAddToComposition}: {onOpenComposition: () => Promise<void>; onAddToComposition: (asset: Overlay) => Promise<void>}) {
  const [presets, setPresets] = useState(initialPresets);
  const [selected, setSelected] = useState<LibraryKind>('name-intro');
  const [filter, setFilter] = useState<AssetType | 'all' | 'products'>('all');
  const reducedMotion = useReducedMotion();
  const [showAlpha, setShowAlpha] = useState(false);
  const [format, setFormat] = useState<'mp4' | 'alpha'>('mp4');
  const [exportOpen, setExportOpen] = useState(false);
  const [resolution, setResolution] = useState(1280);
  const {job, activeExport, recovering, connection, start: render, cancel: cancelExport} = useRenderJob();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const player = useRef<PlayerRef>(null);
  const presetInput = useRef<HTMLInputElement>(null);
  const asset = presets[selected], meta = catalog[selected];
  const project = useMemo(() => assetProject(asset), [asset]);
  const frames = Math.ceil(project.duration * 30);
  const timing = selected === 'name-intro-wipe' ? colorBarIntroTiming(project.duration) : revealTiming(project.duration);
  const transition = isTransition(selected);
  const particleTransition = selected === 'pixel-glow-wipe';
  const barTransition = selected === 'color-bar-transition';
  const choose = (kind: LibraryKind) => {setSelected(kind); setFilter(previous => previous === 'all' ? previous : isProductAsset(kind) ? 'products' : assetType(kind)); setShowAlpha(false); if (!catalog[kind].alpha) setFormat('mp4');};
  const libraryGroups = groupLibraryKinds(libraryKinds.filter(kind => filter === 'all' || (isProductAsset(kind) ? filter === 'products' : assetType(kind) === filter)));
  const introPreset = isNameIntro(selected) ? matchingNameIntroPreset(asset) : undefined;
  const edit = useCallback((patch: Partial<Overlay>) => {
    setPresets(previous => ({...previous, [selected]: {...previous[selected], ...patch}}));
    if (isProductAsset(selected)) {
      player.current?.pause();
      if (patch.triageView !== undefined || patch.triageUi !== undefined || patch.triageCards !== undefined || patch.productView !== undefined || patch.productLayer !== undefined || patch.productAnimation !== undefined || patch.duration !== undefined) player.current?.seekTo(productEditFrame({...asset, ...patch}));
    }
  }, [asset, selected]);
  const onProductEdit = useCallback((_id: string, patch: Partial<Overlay>) => edit(patch), [edit]);
  const inputProps = useMemo(() => ({project, transparent: showAlpha && meta.alpha, onProductEdit, reduceMotion: reducedMotion}), [project, showAlpha, meta.alpha, onProductEdit, reducedMotion]);
  const seek = (next: number) => {player.current?.pause(); player.current?.seekTo(next);};

  useEffect(() => {try {localStorage.setItem(storageKey, JSON.stringify(presets));} catch {setError('Could not save edits on this device. Use Save preset to keep this asset.');}}, [presets]);
  async function openComposition(asset?: Overlay) {
    if (opening) return;
    setOpening(true);
    try {if (asset) await onAddToComposition(asset); else await onOpenComposition();}
    catch (error) {setError(error instanceof Error ? error.message : 'Could not open the composition.');}
    finally {setOpening(false);}
  }
  async function exportAsset() {
    player.current?.pause();
    await render(assetProject(asset, resolution), format);
  }
  function savePreset() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], {type: 'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = `coderabbit-${meta.code.toLowerCase()}-${selected}${introPreset ? `-${introPreset.id}` : ''}.json`; a.click();
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
    <header className="asset-header"><div className="asset-heading"><span className="asset-wordmark">Brand motion</span><span className="asset-header-divider"/><span className="asset-header-subtitle">CodeRabbit asset library</span></div><div className="asset-header-actions"><button className="button button-light" disabled={opening} onClick={() => openComposition()}><Layers3 size={14}/> Composition <ArrowUpRight size={13}/></button><button className="button button-dark" onClick={() => {player.current?.pause(); setExportOpen(true);}}>{activeExport ? <LoaderCircle className="spin" size={15}/> : <ArrowDownToLine size={15}/>} {activeExport ? `Exporting ${job?.progress ?? 0}%` : 'Export asset'}</button></div></header>
    <div className="asset-layout">
      <aside className="asset-library" aria-label="Asset library"><div className="asset-library-heading"><span>Library</span><span>{libraryKinds.length} assets</span></div>
        <div className="library-filter" role="group" aria-label="Library category">{(['all', 'linear', 'looping', 'products'] as const).map(type => <button key={type} aria-pressed={filter === type} onClick={() => setFilter(type)}>{type === 'all' ? 'All' : type === 'linear' ? 'Linear' : type === 'looping' ? 'Looping' : 'Products'}</button>)}</div>
        <div className="asset-library-groups">{libraryGroups.map(group => <LibrarySection key={group.id} name={group.name} count={group.kinds.length} selected={group.kinds.includes(selected) ? selected : undefined}>
          {group.kinds.map(kind => <button key={kind} className={`asset-card ${selected === kind ? 'is-selected' : ''}`} aria-label={`Preview ${catalog[kind].name}`} aria-pressed={selected === kind} onClick={() => choose(kind)}>
            <div className="asset-card-preview"><AssetThumbnail kind={kind}/></div>
            <div className="asset-card-label"><strong>{catalog[kind].name}</strong><span className="asset-card-meta"><span>{catalog[kind].code}</span><span>{assetType(kind) === 'looping' ? <><LoopIcon size={11} aria-hidden="true"/> Loop</> : <>{presets[kind].duration}s</>}</span></span></div>
          </button>)}
        </LibrarySection>)}</div>
        <div className="asset-library-bottom"><button className="text-button" onClick={() => presetInput.current?.click()}><FolderOpen size={14}/> Open preset</button><a href="https://www.coderabbit.ai/brand" target="_blank" rel="noreferrer" aria-label="CodeRabbit brand guidelines"><ArrowUpRight size={14}/></a></div>
      </aside>
      <main className="asset-main">
        <div className="asset-title-row"><div><div className="asset-eyebrow">{meta.code}<span>/</span>{meta.family}</div><h1>{meta.name}</h1></div><div className="asset-title-actions"><span className="asset-type-tag">{assetType(selected) === 'looping' ? <LoopIcon size={13}/> : <ArrowRight size={13}/>} {assetType(selected)}<i/>{project.duration}s</span><button className="button button-light" disabled={opening} onClick={() => openComposition(project.overlays[0])}><Plus size={14}/> Add to composition</button></div></div>
        <p className="asset-description">{meta.description}</p>
        <div className="asset-preview-area" onPointerDownCapture={() => {if (isProductAsset(selected)) player.current?.pause();}} onFocusCapture={() => {if (isProductAsset(selected)) player.current?.pause();}}><div className={`asset-stage ${showAlpha && meta.alpha ? 'asset-checkerboard' : ''}`}><Player key={selected} ref={player} component={Scene} inputProps={inputProps} durationInFrames={frames} compositionWidth={1280} compositionHeight={720} fps={30} initialFrame={reducedMotion && isProductAsset(selected) ? Math.min(30, Math.floor(frames / 2)) : 0} autoPlay={!reducedMotion} initiallyMuted loop controls={false} clickToPlay={false} style={{width: '100%'}}/></div></div>
        <div className="asset-playback-dock" role="region" aria-label="Playback and timing">
        <AssetTransport key={selected} player={player} frames={frames} alpha={meta.alpha} showAlpha={showAlpha} onAlphaChange={setShowAlpha}/>
        <div className="asset-motion-strip" aria-label={particleTransition ? 'Reveal, full screen, fade out' : transition ? 'Cover, cut, clear' : assetType(selected) === 'looping' ? 'Seamless cycle' : barTransition ? 'Reveal, drift, exit' : isColorBar(selected) ? 'Expand, drift' : 'Reveal, hold, exit'}>
          {isProductAsset(selected) ? productTimeline(asset).map((step, index) => <button key={index} style={{flex: step.end - step.start}} onClick={() => {edit(productStepPatch(step)); seek(Math.min(step.end - 1, step.start + Math.round((step.end - step.start) * .72)));}}>{step.label}</button>) : assetType(selected) === 'looping' ? <div className="asset-cycle"><LoopIcon size={15}/><span>One complete cycle</span><span>{project.duration}s</span></div>
            : particleTransition ? <><span style={{flex: pixelWipeTiming.revealEnd}}>Reveal</span><button style={{flex: pixelWipeTiming.fadeStart - pixelWipeTiming.revealEnd}} onClick={() => seek(cutFrame(project.duration))}>Full screen {timecode(cutFrame(project.duration))}<i/></button><span style={{flex: 1 - pixelWipeTiming.fadeStart}}>Fade out</span></>
            : barTransition ? <><span style={{flex: colorBarTransitionTiming.reveal}}>Reveal</span><span style={{flex: colorBarTransitionTiming.exit - colorBarTransitionTiming.reveal}}>Drift</span><span style={{flex: 1 - colorBarTransitionTiming.exit}}>Exit</span></>
            : isColorBar(selected) ? <><span style={{flex: colorBarRevealTiming.expand}}>Expand</span><span style={{flex: 1 - colorBarRevealTiming.expand}}>Drift</span></>
            : <><span style={{flex: transition ? 36 : timing.enter}}> {transition ? 'Cover' : 'Reveal'}</span>{(transition || timing.hold > 0) && <button disabled={!transition} style={{flex: transition ? 28 : timing.hold}} onClick={() => seek(cutFrame(project.duration))}>{transition ? `Cut at ${timecode(cutFrame(project.duration))}` : 'Hold'}{transition && <i/>}</button>}<span style={{flex: transition ? 36 : timing.exit}}>{transition ? 'Clear' : 'Exit'}</span></>}
        </div>
        </div>
      </main>
      <aside className="asset-inspector"><div className="asset-inspector-heading"><span>Customize</span><SlidersHorizontal size={15}/></div><section className="asset-inspector-section"><AssetControls asset={asset} onChange={edit}/>{assetType(selected) === 'linear' && <label className="field-label">Duration<span className="input-unit"><input type="number" aria-label="Asset duration" min={0.6} max={isProductAsset(selected) ? 30 : 12} step={0.1} value={asset.duration} onChange={e => edit({duration: clamp(Number(e.target.value), 0.6, isProductAsset(selected) ? 30 : 12)})}/><span>s</span></span></label>}<button className="text-button asset-reset" onClick={() => setPresets(previous => ({...previous, [selected]: {id: selected, ...defaults[selected]}}))}><RotateCcw size={12}/> Reset asset</button></section>
        <section className="asset-inspector-section"><div className="asset-section-label">Export</div><div className="asset-export-details"><span>{format === 'alpha' ? 'Transparent background' : 'Video'}</span><span>{resolution} × {resolution * 9 / 16}</span></div><button className="button button-light full-width asset-export-settings" onClick={() => {player.current?.pause(); setExportOpen(true);}}>Export options <ArrowUpRight size={13}/></button>{transition && <p className="asset-export-hint">{particleTransition ? 'Choose Transparent background to layer the fine pixels over your edit.' : 'Choose Transparent background to layer over your edit. The marked cut frame is fully covered.'}</p>}
          {connection && <p className="hint" role="status">{connection}</p>}{job && <div className={`asset-job ${job.status === 'error' ? 'asset-job-error' : ''}`} role={job.status === 'error' ? 'alert' : 'status'}><span>{job.assetName}</span>{activeExport ? <><progress max={100} value={job.progress}/><p>{job.status === 'cancelling' ? 'Cancelling export…' : job.status === 'rendering' ? `Rendering ${job.progress}%` : 'Preparing export…'}</p><button className="button button-light full-width" disabled={job.status === 'cancelling' || job.status === 'starting'} onClick={cancelExport}>Cancel export</button></> : job.status === 'done' ? <a className="button button-dark full-width" href={job.url} download><Download size={13}/> Download asset <Check size={13}/></a> : <p>{job.status === "cancelled" ? "Export cancelled." : job.error}</p>}</div>}
        </section>
        <div className="asset-inspector-bottom"><button className="button button-light full-width" onClick={savePreset}><Download size={14}/> Save preset</button></div>
      </aside>
    </div>
    {exportOpen && <ExportDialog project={assetProject(asset, resolution)} format={format} onFormatChange={setFormat} onResolutionChange={setResolution} alphaAvailable={meta.alpha} onClose={() => setExportOpen(false)} onExport={exportAsset} onCancel={cancelExport} job={job} active={activeExport} recovering={recovering} connection={connection}/>}
    {error && <div className="toast toast-error" role="alert"><span>{error}</span><button className="icon-button" aria-label="Dismiss message" onClick={() => setError('')}><X size={16}/></button></div>}
  </div>;
}
