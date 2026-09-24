import React, {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import {ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown, Infinity as LoopIcon, Code2, Terminal, Workflow, Download, Eye, EyeOff, FileVideo, Film, FolderOpen, GitBranch, Hand, Layers3, Link2, LoaderCircle, MessageSquare, MousePointer2, MoveHorizontal, Pause, Play, Plus, ScanLine, Settings2, ShieldCheck, Sparkle, Trash2, Undo2, Upload, Volume2, VolumeX, X} from 'lucide-react';
import {Scene} from './remotion/Scene';
import {AssetStudio} from './AssetStudio';
import {AssetThumbnail} from './components/AssetThumbnail';
import {LibrarySection} from './components/LibrarySection';
import {groupLibraryKinds} from './lib/assetLibrary';
import {isProductAsset, productReference} from './lib/productAssets';
import {productEditFrame} from './lib/productMotion';
import {TimelineCues} from './components/TimelineCues';
import {TimeSeek} from './components/TimeSeek';
import {ExportDialog} from './components/ExportDialog';
import {AssetControls} from './brand/AssetControls';
import {PalettePicker} from './brand/PalettePicker';
import {appendBrandAsset, assetProject, brandAssetDefaults, brandAssetKinds, brandAssetTemplates, isBrandAsset} from './lib/brandAssets';
import {broadcastKinds, broadcastTemplates, isBroadcast, retimeOverlays} from './lib/broadcast';
import {assetCollections, assetType} from './lib/looping';
import {demoProject, overlayDefaults} from './lib/demo';
import {analyzeVideo} from './lib/analyze';
import {clamp, sampleAt} from './lib/gesture';
import {projectSchema} from './lib/schema';
import {MAX_PROJECT_BYTES, VIDEO_LIMIT_LABEL} from './lib/limits';
import {readVideoDuration, uploadVideo} from './lib/media';
import {loadComposition, saveComposition} from './lib/projectStorage';
import {useRenderJob} from './hooks/useRenderJob';
import {gestureLabel, type AssetType, type Binding, type Overlay, type OverlayKind, type Project} from './types';

const brandNames = Object.fromEntries(brandAssetKinds.map(kind => [kind, brandAssetTemplates[kind].name])) as Record<import('./types').BrandAssetKind, string>;
const kindNames: Record<OverlayKind, string> = {...brandNames, ...Object.fromEntries(broadcastKinds.map(k => [k, broadcastTemplates[k].name])) as Record<OverlayKind, string>,hero: 'Change Stack glow', terminal: 'Terminal', agentflow: 'Agent workflow', code: 'Code panel', diagram: 'API flow', callout: 'Callout'};
const kindIcons = {'triage-board': Layers3, 'change-stack': Layers3, 'name-intro': MessageSquare, 'name-intro-wipe': MoveHorizontal, 'color-bar-reveal': MoveHorizontal, 'color-bar-transition': MoveHorizontal, 'color-bar-loop': LoopIcon,'logo-reveal': Sparkle, 'circle-wipe': MoveHorizontal, 'stack-wipe': Layers3, 'color-bar-wipe': Layers3, 'pixel-glow-wipe': ScanLine, 'type-reveal': Code2, 'brand-signoff': Film, 'signal-loop': LoopIcon,hero: LoopIcon, ident: Film, presenter: MessageSquare, headline: Code2, triage: Layers3, stack: GitBranch, ticker: MoveHorizontal, bug: ShieldCheck,terminal: Terminal, agentflow: Workflow, code: Code2, diagram: GitBranch, callout: MessageSquare};
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(Math.floor(seconds) % 60).toString().padStart(2, '0')}.${Math.floor((seconds % 1) * 10)}`;

const Miniature = memo(function Miniature({kind}: {kind: OverlayKind}) {
  if (isBrandAsset(kind) || kind === 'hero') return <div className="miniature"><AssetThumbnail kind={kind}/></div>;
  if (isBroadcast(kind)) return <div className={`miniature broadcast-mini mini-${kind}`} aria-hidden="true"><span>{broadcastTemplates[kind].code}</span><div><i/><strong>{kind === 'presenter' ? 'Presenter name' : kind === 'triage' ? 'Now  /  Next' : kind === 'stack' ? '01  /  02  /  03' : kind === 'ticker' ? 'ON THE DESK —' : kind === 'bug' ? 'CodeRabbit' : 'The Review Desk'}</strong><small>{kind === 'presenter' ? 'Role / organization' : 'DEVELOPER BROADCAST'}</small></div></div>;
  return <div className={`miniature mini-${kind}`} aria-hidden="true">
    {(kind === 'code' || kind === 'terminal') ? <div className="mini-window"><div className="mini-dots"><i/><i/><i/><span>component.tsx</span></div><div className="mini-lines"><i/><i/><i/><i/></div></div> : (kind === 'diagram' || kind === 'agentflow') ? <div className="mini-nodes"><span>{kind === 'agentflow' ? 'Plan' : 'Client'}</span><i/><span>{kind === 'agentflow' ? 'Code' : 'API'}</span><i/><span>{kind === 'agentflow' ? 'Review' : 'DB'}</span></div> : <div className="mini-note"><span>Something worth explaining.</span><i/><i/></div>}
  </div>;
});

const newComposition = (): Project => ({...assetProject({id: 'name-intro', ...brandAssetDefaults['name-intro']}), name: 'CodeRabbit brand composition', duration: 12});
export function App() {
  const [view, setView] = useState<'assets' | 'composition'>('assets');
  const [addedId, setAddedId] = useState<string>();
  const [composition, setComposition] = useState<Project>(newComposition);
  if (view === 'assets') return <AssetStudio onOpenComposition={async () => {setComposition(await loadComposition() ?? newComposition()); setAddedId(undefined); setView('composition');}} onAddToComposition={async asset => {
    const id = crypto.randomUUID();
    const next = appendBrandAsset(await loadComposition() ?? newComposition(), asset, id);
    await saveComposition(next); setComposition(next);
    setAddedId(id); setView('composition');
  }}/>;
  return <CompositionEditor initialProject={composition} initialSelectedId={addedId} onOpenAssets={() => setView('assets')}/>;
}

function CompositionEditor({initialProject, initialSelectedId, onOpenAssets}: {initialProject: Project; initialSelectedId?: string; onOpenAssets: () => void}) {
  const [project, setProject] = useState<Project>(initialProject);
  const [selectedId, setSelectedId] = useState(() => initialSelectedId ?? project.overlays[0]?.id ?? '');
  const [frame, setFrame] = useState(() => project.sampleMode ? Math.min(project.broadcast ? 36 : 78, Math.ceil(project.duration * project.fps) - 1) : 0);
  const [playing, setPlaying] = useState(false);
  const [libraryTab, setLibraryTab] = useState<'components' | 'footage'>('components');
  const [libraryGroup, setLibraryGroup] = useState<AssetType>(() => assetType(project.overlays.find(o => o.id === selectedId)?.kind ?? 'ident'));
  const [busy, setBusy] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'mp4' | 'alpha'>('mp4');
  const {job, activeExport, recovering, connection, start: render, cancel: cancelExport} = useRenderJob();
  const [historyLength, setHistoryLength] = useState(0);
  const player = useRef<PlayerRef>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const projectInput = useRef<HTMLInputElement>(null);
  const history = useRef<Project[]>([]);
  const projectRef = useRef(project);
  const onProductEdit = useCallback((id: string, patch: Partial<Overlay>) => {
    player.current?.pause();
    setSelectedId(id);
    const overlay = projectRef.current.overlays.find(item => item.id === id);
    commit(previous => ({...previous, overlays: previous.overlays.map(item => item.id === id ? {...item, ...patch} : item)}));
    if (overlay && (patch.triageView !== undefined || patch.triageUi !== undefined || patch.triageCards !== undefined || patch.productView !== undefined || patch.productLayer !== undefined || patch.productAnimation !== undefined || patch.duration !== undefined)) player.current?.seekTo(Math.round(overlay.start * projectRef.current.fps) + productEditFrame({...overlay, ...patch}, projectRef.current.fps));
  }, []);
  const sceneProps = useMemo(() => ({project, onProductEdit}), [project, onProductEdit]);
  projectRef.current = project;
  const abort = useRef<AbortController | null>(null);
  const importAbort = useRef<AbortController | null>(null);
  const selected = project.overlays.find(o => o.id === selectedId);
  const brandTemplate = selected && isBrandAsset(selected.kind) ? brandAssetTemplates[selected.kind] : undefined;
  const template = selected && isBroadcast(selected.kind) ? broadcastTemplates[selected.kind] : undefined;
  const onlyLooping = !project.mediaUrl && project.overlays.some(o => o.enabled) && project.overlays.filter(o => o.enabled).every(o => assetType(o.kind) === 'looping');
  const isLooping = selected ? assetType(selected.kind) === 'looping' : false;
  const addKind = selected && assetCollections[libraryGroup].includes(selected.kind) ? selected.kind : assetCollections[libraryGroup][0];
  const time = frame / project.fps;
  const currentHand = sampleAt(project.samples, time);
  useEffect(() => {void saveComposition(project).catch(() => setError('Autosave unavailable. Use Save project to keep your edits.'));}, [project]);

  function commit(update: Project | ((previous: Project) => Project)) {
    const previous = projectRef.current;
    history.current = [...history.current.slice(-29), previous];
    setHistoryLength(history.current.length);
    const next = typeof update === 'function' ? update(previous) : update;
    projectRef.current = next;
    setProject(next);
  }
  function updateOverlay(patch: Partial<Overlay>) {if (selected && isProductAsset(selected.kind)) {onProductEdit(selected.id, patch); return;} commit(p => ({...p, overlays: p.overlays.map(o => o.id === selectedId ? {...o, ...patch} : o)}));}
  const seek = useCallback((seconds: number) => {const f = Math.round(clamp(seconds, 0, project.duration - 1 / project.fps) * project.fps); player.current?.seekTo(f); setFrame(f);}, [project.duration, project.fps]);
  const cueOptions = useMemo(() => project.cues.map(cue => <option key={cue.id} value={cue.id}>{gestureLabel[cue.gesture]} · {formatTime(cue.time)}</option>), [project.cues]);
  function selectOverlay(overlay: Overlay) {setSelectedId(overlay.id); setLibraryGroup(assetType(overlay.kind)); player.current?.pause(); seek(Math.min(overlay.start + 0.7, project.duration - 0.1));}
  function addOverlay(kind: OverlayKind) {
    if (project.overlays.length >= 12) {setError('This demo supports up to 12 overlays.'); return;}
    const start = assetType(kind) === 'looping' ? 0 : clamp(time, 0, Math.max(0, project.duration - 0.1));
    const overlay: Overlay = {...overlayDefaults[kind], id: crypto.randomUUID(), start, duration: assetType(kind) === 'looping' ? project.duration : Math.min(4, project.duration - start)};
    commit(p => ({...p, overlays: [...p.overlays, overlay]})); setSelectedId(overlay.id); seek(overlay.start + 0.5);
  }
  function duplicateSelected() {
    if (!selected || project.overlays.length >= 12) {setError('This demo supports up to 12 overlays.'); return;}
    const copy = {...selected, id: crypto.randomUUID()};
    commit(p => ({...p, overlays: [...p.overlays, copy]}));
    setSelectedId(copy.id); seek(copy.start + 0.5);
  }
  function resetSample(preset: 'broadcast' | 'walkthrough' | 'technical' | 'loop' = 'broadcast') {
    abort.current?.abort(); player.current?.pause(); const next = demoProject(preset); commit(next); setSelectedId(next.overlays[0].id); setFrame(36); setLibraryGroup(preset === 'loop' ? 'looping' : 'linear');
    requestAnimationFrame(() => player.current?.seekTo(36)); setNotice(preset === 'loop' ? 'Seamless background loop loaded.' : preset === 'broadcast' ? 'Broadcast rundown loaded. Edit the sample names and headlines for your show.' : 'Sample scene restored.');
  }
  useEffect(() => {
    const p = player.current; if (!p) return;
    const onFrame = (e: {detail: {frame: number}}) => setFrame(e.detail.frame);
    const play = () => setPlaying(true), pause = () => setPlaying(false);
    p.addEventListener('frameupdate', onFrame); p.addEventListener('play', play); p.addEventListener('pause', pause); p.addEventListener('ended', pause);
    return () => {p.removeEventListener('frameupdate', onFrame); p.removeEventListener('play', play); p.removeEventListener('pause', pause); p.removeEventListener('ended', pause);};
  }, [project.mediaUrl, project.duration]);
  useEffect(() => {if (!notice) return; const id = window.setTimeout(() => setNotice(''), 5500); return () => clearTimeout(id);}, [notice]);
  useEffect(() => () => {abort.current?.abort(); importAbort.current?.abort();}, []);

  async function importVideo(file?: File) {
    if (!file) return;
    abort.current?.abort(); importAbort.current?.abort();
    const controller = new AbortController(); importAbort.current = controller;
    setBusy('Reading your video…'); setError(''); player.current?.pause();
    try {
      await readVideoDuration(file, controller.signal);
      setBusy('Importing video… 0%');
      const result = await uploadVideo(file, controller.signal, progress => setBusy(progress < 1 ? `Importing video… ${Math.round(progress * 100)}%` : 'Checking video…'));
      controller.signal.throwIfAborted();
      const duration = result.duration;
      commit(p => ({...p, mediaUrl: result.url, mediaName: file.name, duration, sampleMode: false, samples: [], cues: [], overlays: retimeOverlays(p.overlays, p.duration, duration)}));
      setFrame(0); setPlaying(false); setLibraryTab('footage'); setNotice('Video imported. Graphic timing is preserved; full-length loops fit the footage.');
    } catch (e) {if (!(e instanceof DOMException && e.name === 'AbortError')) setError(e instanceof Error ? e.message : 'Import failed.');}
    finally {setBusy(''); if (fileInput.current) fileInput.current.value = '';}
  }

  async function analyze() {
    if (!project.mediaUrl || analysisProgress !== null) return;
    player.current?.pause(); setError(''); setAnalysisProgress(0); abort.current = new AbortController();
    try {
      const signal = abort.current.signal;
      const result = await analyzeVideo(project.mediaUrl, project.duration, setAnalysisProgress, signal);
      signal.throwIfAborted();
      commit(p => ({...p, ...result}));
      setNotice(result.cues.length ? `${result.cues.length} gesture cues found. Select an overlay and set its start from a cue.` : 'Analysis complete. No gesture cues found; try a clearer hand pose or set timing manually.');
    } catch (e) {if (!(e instanceof DOMException && e.name === 'AbortError')) setError(e instanceof Error ? e.message : 'Analysis failed.');}
    finally {setAnalysisProgress(null);}
  }

  async function startExport() {
    setError(''); player.current?.pause(); await render(project, exportFormat);
  }
  function saveProject() {
    const blob = new Blob([JSON.stringify(project, null, 2)], {type: 'application/json'}); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'coderabbit-motion-project.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice('Project saved, including cue timings, components, and tracking. Source video stays in the local media folder.');
  }
  async function openProject(file?: File) {
    if (!file) return;
    try {if (file.size > MAX_PROJECT_BYTES) throw new Error('Choose a project file up to 32 MB.'); const parsed = projectSchema.parse(JSON.parse(await file.text())); if (parsed.mediaUrl) {const response = await fetch(parsed.mediaUrl, {method: 'HEAD'}); if (!response.ok) throw new Error('This project’s source video is missing from local storage. Import the source clip again.');} abort.current?.abort(); player.current?.pause(); commit(parsed); setSelectedId(parsed.overlays[0]?.id ?? ''); setFrame(0); requestAnimationFrame(() => player.current?.seekTo(0)); setNotice('Project opened.');}
    catch (e) {setError(e instanceof Error ? e.message : 'Invalid Motion Studio project.');}
    finally {if (projectInput.current) projectInput.current.value = '';}
  }

  return <div className="app-shell">
    <input type="file" ref={fileInput} accept="video/mp4,video/quicktime,video/webm,.m4v" hidden onChange={e => importVideo(e.target.files?.[0])}/>
    <input type="file" ref={projectInput} accept="application/json,.json" hidden onChange={e => openProject(e.target.files?.[0])}/>
    <header className="app-header">
      <button className="button button-light composition-library-link" disabled={!!busy || analysisProgress !== null} onClick={onOpenAssets}><ArrowLeft size={14}/> Asset library</button>
      <div className="header-actions">
        <button className="icon-button undo" aria-label="Undo last edit" disabled={!historyLength || !!busy || analysisProgress !== null} onClick={() => {const previous = history.current.pop(); if (previous) {projectRef.current = previous; setProject(previous); setHistoryLength(history.current.length); if (!previous.overlays.some(o => o.id === selectedId)) setSelectedId(previous.overlays[0]?.id ?? '');}}}><Undo2 size={17}/></button>
        <button className="button button-light" disabled={!!busy || analysisProgress !== null} onClick={() => fileInput.current?.click()}><Upload size={15}/> Import video</button>
        <button className="button button-dark" onClick={() => setExportOpen(true)}><ArrowUpRight size={17}/>{activeExport ? `Exporting ${job?.progress ?? 0}%` : 'Export video'}</button>
      </div>
    </header>

    <div className="workspace">
      <aside className="library-panel">
        <div className="panel-heading"><span>Composition assets</span><Layers3 size={16}/></div>
        <div className="library-tabs" role="tablist" aria-label="Assets"><button role="tab" aria-selected={libraryTab === 'components'} onClick={() => setLibraryTab('components')}>Components</button><button role="tab" aria-selected={libraryTab === 'footage'} onClick={() => setLibraryTab('footage')}>Footage</button></div>
        {libraryTab === 'components' ? <>
          <p className="panel-intro">Select an asset.<br/>Add it to your composition.</p><div className="kit-switch" role="group" aria-label="Asset type"><button aria-pressed={libraryGroup === 'linear'} onClick={() => setLibraryGroup('linear')}>Linear <span>{assetCollections.linear.length}</span></button><button aria-pressed={libraryGroup === 'looping'} onClick={() => setLibraryGroup('looping')}>Looping <span>{assetCollections.looping.length}</span></button></div>
          <div className="component-library component-library-grouped">{groupLibraryKinds(assetCollections[libraryGroup]).map(group => <LibrarySection key={group.id} name={group.name} count={group.kinds.length} selected={selected && group.kinds.includes(selected.kind) ? selected.id : undefined}>{group.kinds.map(kind => {const Icon = kindIcons[kind]; return <button className={`component-card ${selected?.kind === kind ? 'is-selected' : ''}`} key={kind} aria-label={`Select ${kindNames[kind]} component`} onClick={() => {const existing = project.overlays.find(o => o.kind === kind); existing ? selectOverlay(existing) : addOverlay(kind);}}>
            <Miniature kind={kind}/><div className="component-caption"><Icon size={15}/><span>{kindNames[kind]}</span><span className="component-language">{assetType(kind) === 'looping' ? 'LOOP' : isBrandAsset(kind) ? brandAssetTemplates[kind].code : isBroadcast(kind) ? broadcastTemplates[kind].code : (kind === 'diagram' || kind === 'agentflow') ? 'FLOW' : 'TEXT'}</span></div>
          </button>;})}</LibrarySection>)}</div>
          <button className="button button-light add-layer" onClick={() => addOverlay(addKind)}><Plus size={14}/> Add {kindNames[addKind].toLowerCase()}</button>
        </> : <div className="footage-content">
          <div className="source-card"><Film size={27}/><strong>{project.mediaName}</strong><span>{formatTime(project.duration)} · 30 fps · 720p canvas</span><span className="source-mode">{project.broadcast && project.sampleMode ? 'Broadcast sample' : project.sampleMode ? 'Simulated sample' : 'Local video'}</span></div>
          <button className="button button-light full-width" disabled={!!busy || analysisProgress !== null} onClick={() => fileInput.current?.click()}><FolderOpen size={15}/> Choose a video</button>
          <p className="hint">MP4, MOV, M4V, or WebM. {VIDEO_LIMIT_LABEL}. H.264 video with AAC audio works best.</p>
          {!project.sampleMode && <button className="button button-primary full-width" disabled={!!busy || analysisProgress !== null} onClick={analyze}><ScanLine size={16}/>{analysisProgress !== null ? 'Analyzing…' : 'Analyze gestures'}</button>}
          {!project.sampleMode && project.samples.length > 0 && analysisProgress === null && <p className="hint">Gestures analyzed · {project.cues.length} cues</p>}
          {analysisProgress !== null && <div className="analysis-state"><progress value={analysisProgress} max={1}/><div><span>{Math.round(analysisProgress * 100)}% analyzed</span><button className="text-button" onClick={() => abort.current?.abort()}>Cancel</button></div></div>}
          <div className="privacy-note"><ShieldCheck size={16}/><p>Your video stays on this computer. Tracking runs locally.</p></div>
        </div>}
        <div className="library-bottom"><button className="text-button" onClick={saveProject}><Download size={14}/> Save project</button><button className="icon-button" aria-label="Open a saved Motion Studio project" disabled={!!busy || analysisProgress !== null} onClick={() => projectInput.current?.click()}><FolderOpen size={16}/></button></div>
      </aside>

      <main className="editor-main">
        <div className="editor-topbar"><div className="editor-title"><span className="section-eyebrow">PREVIEW</span><span>{onlyLooping ? 'Background loop.' : project.name}</span></div><div className="stage-actions"><select aria-label="Load studio preset" disabled={!!busy || analysisProgress !== null} value="" onChange={e => {if (e.target.value) resetSample(e.target.value as "broadcast" | "walkthrough" | "technical" | "loop");}}><option value="">Load a preset</option><option value="broadcast">Broadcast rundown</option><option value="loop">Change Stack glow loop</option><option value="walkthrough">Developer walkthrough</option><option value="technical">Code & API explainer</option></select><button className={`tracking-toggle ${project.showTracking ? 'is-on' : ''}`} aria-pressed={project.showTracking} onClick={() => commit(p => ({...p, showTracking: !p.showTracking}))}><ScanLine size={15}/><span>Tracking</span><i/></button></div></div>
        <div className="preview-space">
          <div className="preview-meta"><span><i/>{onlyLooping ? 'LOOPING ASSET / SEAMLESS' : project.brandAsset ? 'BRAND ASSETS / COMPOSITION' : project.broadcast && project.sampleMode ? 'BROADCAST / SAMPLE RUNDOWN' : project.sampleMode ? 'SAMPLE / SIMULATED MOTION' : project.mediaName}</span><span>1280 × 720 <span className="meta-separator">/</span> 30 FPS</span></div>
          <div className="player-frame" onPointerDownCapture={() => player.current?.pause()} onFocusCapture={() => player.current?.pause()}>
            <Player key={`${project.mediaUrl}-${project.duration}`} ref={player} component={Scene} inputProps={sceneProps} durationInFrames={Math.max(1, Math.ceil(project.duration * project.fps))} compositionWidth={project.width} compositionHeight={project.height} fps={project.fps} initialFrame={Math.min(frame, Math.ceil(project.duration * project.fps) - 1)} style={{width: '100%'}} controls={false} clickToPlay={false} loop={onlyLooping} moveToBeginningWhenEnded={false}/>
            {busy && <div className="preview-busy"><LoaderCircle className="spin" size={24}/><span role="status">{busy}</span><button className="button button-light" onClick={() => importAbort.current?.abort()}>Cancel import</button></div>}
          </div>
          <div className="transport">
            <div className="transport-left"><button className="icon-button" aria-label={project.mute ? 'Unmute video' : 'Mute video'} onClick={() => commit(p => ({...p, mute: !p.mute}))}>{project.mute ? <VolumeX size={17}/> : <Volume2 size={17}/>}</button><span className="timecode">{formatTime(time)} <span>/ {formatTime(project.duration)}</span></span></div>
            <div className="playback-controls"><button className="icon-button" aria-label="Back one second" onClick={() => seek(time - 1)}><ArrowLeft size={15}/></button><button className="play-button" aria-label={playing ? 'Pause preview' : 'Play preview'} onClick={() => playing ? player.current?.pause() : player.current?.play()}>{playing ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor"/>}</button><button className="icon-button" aria-label="Forward one second" onClick={() => seek(time + 1)}><ArrowRight size={15}/></button></div>
            <TimeSeek onSeek={seconds => {player.current?.pause(); seek(seconds);}}/><div className="gesture-readout"><span className={currentHand?.visible ? 'status-dot' : 'status-dot inactive'}/>{onlyLooping ? 'LOOP / 30 FPS' : project.broadcast ? 'BROADCAST / 30 FPS' : currentHand?.visible ? gestureLabel[currentHand.gesture] === 'No gesture' ? 'Hand tracked' : gestureLabel[currentHand.gesture] : 'No hand tracked'}</div>
          </div>
        </div>
        <section className="timeline-section" aria-label="Gesture and overlay timeline">
          <div className="timeline-heading"><span className="timeline-count">{project.cues.length} cues <span>·</span> {project.overlays.length} layers</span></div>
          <div className="timeline-ruler"><span className="track-label">{project.duration >= 60 ? "MIN:SEC" : "SECONDS"}</span><div className="ruler-scale">{Array.from({length: 7}, (_, i) => <span key={i} style={{left: `${i / 6 * 100}%`}}>{project.duration >= 60 ? formatTime(project.duration * i / 6).split('.')[0] : (project.duration * i / 6).toFixed(project.duration < 6 ? 1 : 0).padStart(2, '0')}</span>)}</div></div>
          <div className="timeline-tracks">
            {(!project.broadcast || project.cues.length > 0) && <div className="track-row gesture-row"><div className="track-label"><Hand size={14}/> Gestures</div><div className="track-lane cue-lane"><TimelineCues cues={project.cues} duration={project.duration} onSeek={seek}/></div></div>}
            {project.overlays.map(overlay => {const Icon = kindIcons[overlay.kind]; return <div className={`track-row ${selectedId === overlay.id ? 'selected-track' : ''}`} key={overlay.id}><button className="track-label" onClick={() => selectOverlay(overlay)}><Icon size={14}/><span>{kindNames[overlay.kind]}</span></button><div className="track-lane"><button className={`overlay-clip clip-${overlay.kind} ${overlay.enabled ? '' : 'disabled-clip'}`} aria-label={`Select ${kindNames[overlay.kind]} timeline layer`} onClick={() => selectOverlay(overlay)} style={{left: `${overlay.start / project.duration * 100}%`, width: `${Math.min(overlay.duration, project.duration - overlay.start) / project.duration * 100}%`}}>{assetType(overlay.kind) === 'looping' ? <LoopIcon size={11}/> : <Link2 size={11}/>}<span>{overlay.title}</span></button></div></div>;})}
            <div className="playhead-container"><div className="playhead" style={{left: `${time / project.duration * 100}%`}}><span/></div></div>
          </div>
          <div className="scrub-row"><span>SCRUB</span><input aria-label="Video playhead" type="range" min={0} max={Math.max(1, Math.ceil(project.duration * 30) - 1)} value={frame} onChange={e => {player.current?.pause(); seek(Number(e.target.value) / 30);}}/></div>
        </section>
      </main>

      <aside className="inspector-panel">
        <div className="panel-heading"><span>Layer properties</span><Settings2 size={16}/></div>
        {selected ? <>
          <div className="selected-component"><div className={`selected-icon icon-${selected.kind}`}>{React.createElement(kindIcons[selected.kind], {size: 21})}</div><div><strong>{kindNames[selected.kind]}</strong><span>{brandTemplate ? `${brandTemplate.code} / ${brandTemplate.family}` : isLooping ? 'BG-02 / Looping background' : template ? `${template.code} / Linear asset` : 'Linear asset'}</span></div><button className="icon-button" aria-label={selected.enabled ? 'Hide selected overlay' : 'Show selected overlay'} onClick={() => updateOverlay({enabled: !selected.enabled})}>{selected.enabled ? <Eye size={16}/> : <EyeOff size={16}/>}</button></div>
          <section className="inspector-section"><h2><Hand size={14}/> {isLooping ? 'Loop timing' : template || brandTemplate ? 'Asset timing' : 'Gesture binding'}</h2>{isLooping ? <p className="binding-explanation">Repeats seamlessly for the layer’s full duration. No entrance or exit fade.</p> : brandTemplate ? <p className="binding-explanation">{brandTemplate.description}</p> : template ? <p className="binding-explanation">18 frames in. Readable hold. 12 frames out. Short clips compress the motion automatically.</p> : <><label className="field-label">Behavior<select aria-label="Overlay behavior" value={selected.binding} onChange={e => updateOverlay({binding: e.target.value as Binding})}><option value="cue">Reveal on cue</option><option value="progress">Hand position → progress</option><option value="follow">Follow hand</option></select></label>
            <p className="binding-explanation">{selected.binding === 'cue' ? 'Choose a cue below or set the start time. The component holds its position.' : selected.binding === 'progress' ? 'Horizontal hand movement controls the animation progress.' : 'The component follows the hand with an offset and stays inside the frame.'}</p></>}
            {!isLooping && !brandTemplate && <label className="field-label">Set start from a cue<select aria-label="Bind overlay to gesture cue" value="" onChange={e => {const cue = project.cues.find(c => c.id === e.target.value); if (cue) {const start = clamp(cue.time, 0, project.duration - 0.1); updateOverlay({start, duration: Math.min(selected.duration, project.duration - start)}); seek(start + 0.5);}}}><option value="">Choose a detected cue</option>{cueOptions}</select></label>}
            <div className="two-fields"><label className="field-label">Start <span className="input-unit"><input aria-label="Overlay start time" type="number" min={0} max={project.duration - 0.1} step={0.1} value={Number(selected.start.toFixed(2))} onChange={e => {const start = clamp(Number(e.target.value), 0, project.duration - 0.1); updateOverlay({start, duration: Math.min(selected.duration, project.duration - start)});}}/><span>s</span></span></label><label className="field-label">Duration <span className="input-unit"><input aria-label="Overlay duration" type="number" min={0.1} max={Math.max(0.1, project.duration - selected.start)} step={0.1} value={Number(selected.duration.toFixed(2))} onChange={e => updateOverlay({duration: clamp(Number(e.target.value), 0.1, Math.max(0.1, project.duration - selected.start))})}/><span>s</span></span></label></div>
          </section>
          {brandTemplate ? <section className="inspector-section"><h2><Settings2 size={14}/> Customize asset</h2><AssetControls asset={selected} onChange={updateOverlay}/></section> : isLooping ? <section className="inspector-section"><h2><LoopIcon size={14}/> Loop controls</h2><AssetControls asset={selected} onChange={updateOverlay}/></section> : <section className="inspector-section"><h2><Code2 size={14}/> Content</h2><label className="field-label">{template ? template.title : selected.kind === 'code' ? 'Filename' : selected.kind === 'terminal' ? 'Window title' : 'Heading'}<input aria-label="Component title" maxLength={template?.titleMax ?? 150} value={selected.title} onChange={e => updateOverlay({title: e.target.value})}/></label><label className="field-label">{template ? template.body : selected.kind === 'terminal' ? 'Commands, one per line' : selected.kind === 'code' ? 'Code' : (['diagram', 'agentflow'].includes(selected.kind)) ? 'Nodes, separated by commas' : 'Description'}<textarea aria-label="Component content" className={(['code', 'terminal'].includes(selected.kind)) ? 'code-input' : ''} rows={(['code', 'terminal'].includes(selected.kind)) ? 5 : 3} maxLength={template?.bodyMax ?? 3000} value={selected.body} onChange={e => updateOverlay({body: e.target.value})}/></label>{template && selected.kind !== 'bug' && <label className="field-label">{template.kicker}<input aria-label="Segment label" maxLength={40} value={selected.kicker ?? ''} onChange={e => updateOverlay({kicker: e.target.value})}/></label>}{template && <p className="hint">{template.description} Text stays within its template; keep each item concise.</p>}</section>}
          <section className="inspector-section"><h2><Settings2 size={14}/> {brandTemplate ? 'Brand system' : isLooping ? 'Background asset' : template ? 'Brand system' : 'Appearance'}</h2>{brandTemplate ? <><p className="binding-explanation">{brandTemplate.usage}</p><a className="text-button" href={isProductAsset(selected.kind) ? productReference(selected.kind) : 'https://www.coderabbit.ai/brand'} target="_blank" rel="noreferrer">{isProductAsset(selected.kind) ? 'Product reference' : 'Brand guidelines'} <ArrowUpRight size={12}/></a></> : isLooping ? <><p className="binding-explanation">A drifting glow and shimmering pixel grid, inspired by the Change Stack hero. Sits behind foreground graphics.</p><p className="hint">For a repeatable video file, export a whole number of cycles. Lower opacity to blend with footage.</p><a className="text-button" href="https://www.coderabbit.ai/change-stack" target="_blank" rel="noreferrer">View reference <ArrowUpRight size={12}/></a></> : template ? <><p className="binding-explanation">Official logo artwork, Geist headings and Hack labels. Orange accents on mauve neutrals.</p><p className="hint">Position, scale and palette are fixed to keep every segment consistent. The studio controls remain monochrome.</p><a className="text-button" href="https://www.coderabbit.ai/brand" target="_blank" rel="noreferrer">Brand guidelines <ArrowUpRight size={12}/></a></> : <><label className="field-label">Placement<div className="placement-picker">{(['left', 'center', 'right'] as const).map(place => <button key={place} disabled={selected.binding === 'follow'} aria-pressed={selected.placement === place} onClick={() => updateOverlay({placement: place})}>{place}</button>)}</div></label><div className="scale-label"><span>Scale</span><span>{Math.round(selected.scale * 100)}%</span></div><input className="scale-slider" aria-label="Component scale" type="range" min={0.5} max={1.3} step={0.05} value={selected.scale} onChange={e => updateOverlay({scale: Number(e.target.value)})}/><PalettePicker label="Overlay accent" value={selected.accent} onChange={accent => updateOverlay({accent})}/></>}</section>
          <div className="inspector-bottom"><button className="text-button" onClick={duplicateSelected}><Plus size={14}/> Duplicate</button><button className="icon-button" aria-label="Remove selected overlay" onClick={() => {commit(p => ({...p, overlays: p.overlays.filter(o => o.id !== selectedId)})); setSelectedId(project.overlays.find(o => o.id !== selectedId)?.id ?? '');}}><Trash2 size={15}/></button></div>
        </> : <div className="empty-inspector"><MousePointer2 size={26}/><p>Select a component to edit its content and gesture binding.</p></div>}
      </aside>
    </div>
    {(error || notice) && <div className={`toast ${error ? 'toast-error' : ''}`} role={error ? 'alert' : 'status'}><span>{error || notice}</span><button className="icon-button" aria-label="Dismiss message" onClick={() => {setError(''); setNotice('');}}><X size={16}/></button></div>}

    {exportOpen && <ExportDialog project={project} format={exportFormat} onFormatChange={setExportFormat} onClose={() => setExportOpen(false)} onExport={startExport} onCancel={cancelExport} job={job} active={activeExport} recovering={recovering} connection={connection} disabled={!!busy || analysisProgress !== null}/>}
  </div>;
}
