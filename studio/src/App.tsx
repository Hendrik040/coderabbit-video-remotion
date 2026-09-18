import React, {useEffect, useRef, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import {ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Code2, Terminal, Workflow, Download, Eye, EyeOff, FileVideo, Film, FolderOpen, GitBranch, Hand, Layers3, Link2, LoaderCircle, MessageSquare, MousePointer2, MoveHorizontal, Pause, Play, Plus, ScanLine, Settings2, ShieldCheck, SlidersHorizontal, Sparkle, Trash2, Undo2, Upload, Volume2, VolumeX, X} from 'lucide-react';
import {Scene} from './remotion/Scene';
import {demoProject, overlayDefaults} from './lib/demo';
import {analyzeVideo} from './lib/analyze';
import {clamp, sampleAt} from './lib/gesture';
import {projectSchema} from './lib/schema';
import {gestureLabel, type Binding, type Overlay, type OverlayKind, type Project} from './types';

const kindNames = {terminal: 'Terminal', agentflow: 'Agent workflow', code: 'Code panel', diagram: 'API flow', callout: 'Callout'};
const kindIcons = {terminal: Terminal, agentflow: Workflow, code: Code2, diagram: GitBranch, callout: MessageSquare};
const colors = ['#FF570A', '#25BAB1', '#F2B8EB', '#F6F6F1', '#91bfff'];
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(Math.floor(seconds) % 60).toString().padStart(2, '0')}.${Math.floor((seconds % 1) * 10)}`;
type Job = {id: string; status: string; progress: number; url?: string; error?: string; filename?: string};

function Miniature({kind}: {kind: OverlayKind}) {
  return <div className={`miniature mini-${kind}`} aria-hidden="true">
    {(kind === 'code' || kind === 'terminal') ? <div className="mini-window"><div className="mini-dots"><i/><i/><i/><span>component.tsx</span></div><div className="mini-lines"><i/><i/><i/><i/></div></div> : (kind === 'diagram' || kind === 'agentflow') ? <div className="mini-nodes"><span>{kind === 'agentflow' ? 'Plan' : 'Client'}</span><i/><span>{kind === 'agentflow' ? 'Code' : 'API'}</span><i/><span>{kind === 'agentflow' ? 'Review' : 'DB'}</span></div> : <div className="mini-note"><span>Something worth explaining.</span><i/><i/></div>}
  </div>;
}

export function App() {
  const [project, setProject] = useState<Project>(() => {try {const saved = localStorage.getItem('coderabbit-motion-project'); return saved ? projectSchema.parse(JSON.parse(saved)) : demoProject();} catch {return demoProject();}});
  const [selectedId, setSelectedId] = useState(() => project.overlays[0]?.id ?? '');
  const [frame, setFrame] = useState(() => project.sampleMode ? Math.min(78, Math.ceil(project.duration * project.fps) - 1) : 0);
  const [playing, setPlaying] = useState(false);
  const [libraryTab, setLibraryTab] = useState<'components' | 'footage'>('components');
  const [savedLocally, setSavedLocally] = useState(true);
  const [busy, setBusy] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'mp4' | 'alpha'>('mp4');
  const [job, setJob] = useState<Job | null>(null);
  const [historyLength, setHistoryLength] = useState(0);
  const player = useRef<PlayerRef>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const projectInput = useRef<HTMLInputElement>(null);
  const history = useRef<Project[]>([]);
  const projectRef = useRef(project);
  projectRef.current = project;
  const abort = useRef<AbortController | null>(null);
  const selected = project.overlays.find(o => o.id === selectedId);
  const time = frame / project.fps;
  const currentHand = sampleAt(project.samples, time);
  const activeExport = job && !['done', 'error'].includes(job.status);

  useEffect(() => {try {localStorage.setItem('coderabbit-motion-project', JSON.stringify(project)); setSavedLocally(true);} catch {setSavedLocally(false);}}, [project]);

  function commit(update: Project | ((previous: Project) => Project)) {
    const previous = projectRef.current;
    history.current = [...history.current.slice(-29), previous];
    setHistoryLength(history.current.length);
    const next = typeof update === 'function' ? update(previous) : update;
    projectRef.current = next;
    setProject(next);
  }
  function updateOverlay(patch: Partial<Overlay>) {commit(p => ({...p, overlays: p.overlays.map(o => o.id === selectedId ? {...o, ...patch} : o)}));}
  function seek(seconds: number) {const f = Math.round(clamp(seconds, 0, project.duration - 1 / 30) * project.fps); player.current?.seekTo(f); setFrame(f);}
  function selectOverlay(overlay: Overlay) {setSelectedId(overlay.id); player.current?.pause(); seek(Math.min(overlay.start + 0.7, project.duration - 0.1));}
  function addOverlay(kind: OverlayKind) {
    if (project.overlays.length >= 12) {setError('This demo supports up to 12 overlays.'); return;}
    const start = clamp(time, 0, Math.max(0, project.duration - 0.1));
    const overlay: Overlay = {...overlayDefaults[kind], id: crypto.randomUUID(), start, duration: Math.min(4, project.duration - start)};
    commit(p => ({...p, overlays: [...p.overlays, overlay]})); setSelectedId(overlay.id); seek(overlay.start + 0.5);
  }
  function duplicateSelected() {
    if (!selected || project.overlays.length >= 12) {setError('This demo supports up to 12 overlays.'); return;}
    const copy = {...selected, id: crypto.randomUUID()};
    commit(p => ({...p, overlays: [...p.overlays, copy]}));
    setSelectedId(copy.id); seek(copy.start + 0.5);
  }
  function resetSample(preset: 'walkthrough' | 'technical' = 'walkthrough') {
    abort.current?.abort(); player.current?.pause(); const next = demoProject(preset); commit(next); setSelectedId(next.overlays[0].id); setFrame(78);
    requestAnimationFrame(() => player.current?.seekTo(78)); setNotice('Sample scene restored.');
  }
  useEffect(() => {
    const p = player.current; if (!p) return;
    const onFrame = (e: {detail: {frame: number}}) => setFrame(e.detail.frame);
    const play = () => setPlaying(true), pause = () => setPlaying(false);
    p.addEventListener('frameupdate', onFrame); p.addEventListener('play', play); p.addEventListener('pause', pause); p.addEventListener('ended', pause);
    return () => {p.removeEventListener('frameupdate', onFrame); p.removeEventListener('play', play); p.removeEventListener('pause', pause); p.removeEventListener('ended', pause);};
  }, [project.mediaUrl, project.duration]);
  useEffect(() => {if (!notice) return; const id = window.setTimeout(() => setNotice(''), 5500); return () => clearTimeout(id);}, [notice]);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    if (!job?.id || ['done', 'error'].includes(job.status)) return;
    const interval = window.setInterval(async () => {
      try {const res = await fetch(`/api/render/${job.id}`); if (!res.ok) throw new Error('Could not read export status.'); const next = await res.json(); setJob(next);}
      catch (e) {setJob(j => j ? {...j, status: 'error', error: e instanceof Error ? e.message : 'Export connection lost.'} : j);}
    }, 1000);
    return () => clearInterval(interval);
  }, [job?.id, job?.status]);

  async function importVideo(file?: File) {
    if (!file) return;
    abort.current?.abort(); setBusy('Importing your video…'); setError(''); player.current?.pause();
    try {
      if (file.size > 300 * 1024 * 1024) throw new Error('Choose a video smaller than 300 MB.');
      const objectUrl = URL.createObjectURL(file);
      const duration = await new Promise<number>((resolve, reject) => {
        const v = document.createElement('video');
        const cleanup = () => {clearTimeout(timeout); URL.revokeObjectURL(objectUrl); v.removeAttribute('src'); v.load();};
        const timeout = window.setTimeout(() => {cleanup(); reject(new Error('Unable to read this video. Try MP4/H.264.'));}, 15000);
        v.onloadedmetadata = () => {const d = v.duration; cleanup(); resolve(d);}; v.onerror = () => {cleanup(); reject(new Error('This browser cannot decode that video. Try MP4/H.264.'));}; v.src = objectUrl;
      });
      if (!Number.isFinite(duration) || duration < 0.1 || duration > 60) throw new Error('For this demo, use a clip between 0.1 and 60 seconds.');
      const data = new FormData(); data.append('video', file);
      const response = await fetch('/api/upload', {method: 'POST', body: data}); const result = await response.json(); if (!response.ok) throw new Error(result.error);
      commit(p => ({...p, mediaUrl: result.url, mediaName: file.name, duration, sampleMode: false, samples: [], cues: [], overlays: p.overlays.map((o, i) => ({...o, start: Math.min(i * duration / Math.max(1, p.overlays.length), Math.max(0, duration - 0.1)), duration: Math.max(0.1, Math.min(o.duration, duration / Math.max(1, p.overlays.length)))}))}));
      setFrame(0); setPlaying(false); setLibraryTab('footage'); setNotice('Video imported. Analyze gestures to create real motion cues.');
    } catch (e) {setError(e instanceof Error ? e.message : 'Import failed.');}
    finally {setBusy(''); if (fileInput.current) fileInput.current.value = '';}
  }

  async function analyze() {
    if (!project.mediaUrl || analysisProgress !== null) return;
    player.current?.pause(); setError(''); setAnalysisProgress(0); abort.current = new AbortController();
    try {
      const result = await analyzeVideo(project.mediaUrl, project.duration, setAnalysisProgress, abort.current.signal);
      commit(p => ({...p, ...result}));
      setNotice(result.cues.length ? `${result.cues.length} gesture cues found. Select an overlay and set its start from a cue.` : 'Analysis complete. No gesture cues found; try a clearer hand pose or set timing manually.');
    } catch (e) {if (!(e instanceof DOMException && e.name === 'AbortError')) setError(e instanceof Error ? e.message : 'Analysis failed.');}
    finally {setAnalysisProgress(null);}
  }

  async function startExport() {
    setError(''); setJob({id: '', status: 'starting', progress: 0});
    try {const response = await fetch('/api/render', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({project, format: exportFormat})}); const result = await response.json(); if (!response.ok) throw new Error(result.error); setJob(result);}
    catch (e) {setJob({id: '', status: 'error', progress: 0, error: e instanceof Error ? e.message : 'Export failed.'});}
  }
  function saveProject() {
    const blob = new Blob([JSON.stringify(project, null, 2)], {type: 'application/json'}); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'coderabbit-motion-project.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice('Project saved, including cue timings, components, and tracking. Source video stays in the local media folder.');
  }
  async function openProject(file?: File) {
    if (!file) return;
    try {if (file.size > 3 * 1024 * 1024) throw new Error('This project file is too large.'); const parsed = projectSchema.parse(JSON.parse(await file.text())); if (parsed.mediaUrl) {const response = await fetch(parsed.mediaUrl, {method: 'HEAD'}); if (!response.ok) throw new Error('This project’s source video is missing from local storage. Import the source clip again.');} abort.current?.abort(); player.current?.pause(); commit(parsed); setSelectedId(parsed.overlays[0]?.id ?? ''); setFrame(0); requestAnimationFrame(() => player.current?.seekTo(0)); setNotice('Project opened.');}
    catch (e) {setError(e instanceof Error ? e.message : 'Invalid Motion Studio project.');}
    finally {if (projectInput.current) projectInput.current.value = '';}
  }

  return <div className="app-shell">
    <input type="file" ref={fileInput} accept="video/mp4,video/quicktime,video/webm,.m4v" hidden onChange={e => importVideo(e.target.files?.[0])}/>
    <input type="file" ref={projectInput} accept="application/json,.json" hidden onChange={e => openProject(e.target.files?.[0])}/>
    <header className="app-header">
      <a className="brand" href="/" aria-label="CodeRabbit Motion Studio home"><img src="/cr-rabbit-orange.png" alt=""/><span>CodeRabbit<small>MOTION STUDIO</small></span></a>
      <div className="header-separator"/><div className="project-heading"><input className="project-name" aria-label="Project name" value={project.name} maxLength={120} onChange={e => commit(p => ({...p, name: e.target.value}))}/><span className="local-indicator"><i/>{savedLocally ? "Saved on this device" : "Save JSON to keep edits"}</span></div>
      <div className="header-actions">
        <button className="icon-button undo" aria-label="Undo last edit" disabled={!historyLength} onClick={() => {const previous = history.current.pop(); if (previous) {projectRef.current = previous; setProject(previous); setHistoryLength(history.current.length); if (!previous.overlays.some(o => o.id === selectedId)) setSelectedId(previous.overlays[0]?.id ?? '');}}}><Undo2 size={17}/></button>
        <button className="button button-light" disabled={!!busy || analysisProgress !== null} onClick={() => fileInput.current?.click()}><Upload size={15}/> Import video</button>
        <button className="button button-dark" onClick={() => setExportOpen(true)}><ArrowUpRight size={17}/>{activeExport ? `Exporting ${job.progress}%` : 'Export video'}</button>
      </div>
    </header>

    <div className="workspace">
      <aside className="library-panel">
        <div className="panel-heading"><span>The brand kit</span><Layers3 size={16}/></div>
        <div className="library-tabs" role="tablist" aria-label="Assets"><button role="tab" aria-selected={libraryTab === 'components'} onClick={() => setLibraryTab('components')}>Components</button><button role="tab" aria-selected={libraryTab === 'footage'} onClick={() => setLibraryTab('footage')}>Footage</button></div>
        {libraryTab === 'components' ? <>
          <p className="panel-intro">CodeRabbit components.<br/>Built for your next walkthrough.</p>
          <div className="component-library">{(['terminal', 'agentflow', 'code', 'diagram', 'callout'] as OverlayKind[]).map(kind => {const Icon = kindIcons[kind]; return <button className={`component-card ${selected?.kind === kind ? 'is-selected' : ''}`} key={kind} aria-label={`Select ${kindNames[kind]} component`} onClick={() => {const existing = project.overlays.find(o => o.kind === kind); existing ? selectOverlay(existing) : addOverlay(kind);}}>
            <Miniature kind={kind}/><div className="component-caption"><Icon size={15}/><span>{kindNames[kind]}</span><span className="component-language">{(kind === 'diagram' || kind === 'agentflow') ? 'FLOW' : 'TEXT'}</span></div>
          </button>;})}</div>
          <button className="button button-light add-layer" disabled={!selected} onClick={() => selected && addOverlay(selected.kind)}><Plus size={14}/> Add {selected ? kindNames[selected.kind].toLowerCase() : "component"}</button><div className="library-note"><Code2 size={16}/><p>Your brand, in motion.<br/><span>Select to edit. Add to repeat.</span></p></div>
        </> : <div className="footage-content">
          <div className="source-card"><Film size={27}/><strong>{project.mediaName}</strong><span>{project.duration.toFixed(1)}s · 30 fps · 720p canvas</span><span className="source-mode">{project.sampleMode ? 'Simulated sample' : 'Local video'}</span></div>
          <button className="button button-light full-width" disabled={!!busy || analysisProgress !== null} onClick={() => fileInput.current?.click()}><FolderOpen size={15}/> Choose a video</button>
          <p className="hint">MP4, MOV, or WebM. Up to 60 seconds and 300 MB. Landscape works best.</p>
          {!project.sampleMode && <button className="button button-purple full-width" disabled={analysisProgress !== null} onClick={analyze}><ScanLine size={16}/>{analysisProgress !== null ? 'Analyzing…' : 'Analyze gestures'}</button>}
          {analysisProgress !== null && <div className="analysis-state"><progress value={analysisProgress} max={1}/><div><span>{Math.round(analysisProgress * 100)}% analyzed</span><button className="text-button" onClick={() => abort.current?.abort()}>Cancel</button></div></div>}
          <div className="privacy-note"><ShieldCheck size={16}/><p>Your video stays on this computer. Tracking runs locally.</p></div>
        </div>}
        <div className="library-bottom"><button className="text-button" onClick={saveProject}><Download size={14}/> Save project</button><button className="icon-button" aria-label="Open a saved Motion Studio project" onClick={() => projectInput.current?.click()}><FolderOpen size={16}/></button></div>
      </aside>

      <main className="editor-main">
        <div className="editor-topbar"><div className="editor-title"><span className="section-eyebrow">PREVIEW</span><span>Make the explanation click.</span></div><div className="stage-actions"><select aria-label="Load studio preset" value="" onChange={e => {if (e.target.value) resetSample(e.target.value as "walkthrough" | "technical");}}><option value="">Load a preset</option><option value="walkthrough">Developer walkthrough</option><option value="technical">Code & API explainer</option></select><button className={`tracking-toggle ${project.showTracking ? 'is-on' : ''}`} aria-pressed={project.showTracking} onClick={() => commit(p => ({...p, showTracking: !p.showTracking}))}><ScanLine size={15}/><span>Tracking</span><i/></button></div></div>
        <div className="preview-space">
          <div className="preview-meta"><span><i/>{project.sampleMode ? 'SAMPLE / SIMULATED MOTION' : project.mediaName}</span><span>1280 × 720 <span className="meta-separator">/</span> 30 FPS</span></div>
          <div className="player-frame">
            <Player key={`${project.mediaUrl}-${project.duration}`} ref={player} component={Scene} inputProps={{project}} durationInFrames={Math.max(1, Math.ceil(project.duration * project.fps))} compositionWidth={project.width} compositionHeight={project.height} fps={project.fps} initialFrame={Math.min(frame, Math.ceil(project.duration * project.fps) - 1)} style={{width: '100%'}} controls={false} clickToPlay={false} loop={false} moveToBeginningWhenEnded={false}/>
            {busy && <div className="preview-busy"><LoaderCircle className="spin" size={24}/><span>{busy}</span></div>}
          </div>
          <div className="transport">
            <div className="transport-left"><button className="icon-button" aria-label={project.mute ? 'Unmute video' : 'Mute video'} onClick={() => commit(p => ({...p, mute: !p.mute}))}>{project.mute ? <VolumeX size={17}/> : <Volume2 size={17}/>}</button><span className="timecode">{formatTime(time)} <span>/ {formatTime(project.duration)}</span></span></div>
            <div className="playback-controls"><button className="icon-button" aria-label="Back one second" onClick={() => seek(time - 1)}><ArrowLeft size={15}/></button><button className="play-button" aria-label={playing ? 'Pause preview' : 'Play preview'} onClick={() => playing ? player.current?.pause() : player.current?.play()}>{playing ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor"/>}</button><button className="icon-button" aria-label="Forward one second" onClick={() => seek(time + 1)}><ArrowRight size={15}/></button></div>
            <div className="gesture-readout"><span className={currentHand?.visible ? 'status-dot' : 'status-dot inactive'}/>{currentHand?.visible ? gestureLabel[currentHand.gesture] === 'No gesture' ? 'Hand tracked' : gestureLabel[currentHand.gesture] : 'No hand tracked'}</div>
          </div>
        </div>
        <section className="timeline-section" aria-label="Gesture and overlay timeline">
          <div className="timeline-heading"><span><SlidersHorizontal size={15}/> Timeline</span><span className="timeline-count">{project.cues.length} cues <span>·</span> {project.overlays.length} layers</span></div>
          <div className="timeline-ruler"><span className="track-label">SECONDS</span><div className="ruler-scale">{Array.from({length: 7}, (_, i) => <span key={i} style={{left: `${i / 6 * 100}%`}}>{(project.duration * i / 6).toFixed(project.duration < 6 ? 1 : 0).padStart(2, '0')}</span>)}</div></div>
          <div className="timeline-tracks">
            <div className="track-row gesture-row"><div className="track-label"><Hand size={14}/> Gestures</div><div className="track-lane cue-lane">{project.cues.map(cue => <button key={cue.id} aria-label={`Seek to ${gestureLabel[cue.gesture]} at ${cue.time.toFixed(1)} seconds`} className="cue-marker" style={{left: `${cue.time / project.duration * 100}%`}} onClick={() => seek(cue.time)}><span>◆</span><em>{gestureLabel[cue.gesture]}</em></button>)}{!project.cues.length && <span className="empty-track">Analyze footage to detect cues</span>}</div></div>
            {project.overlays.map(overlay => {const Icon = kindIcons[overlay.kind]; return <div className={`track-row ${selectedId === overlay.id ? 'selected-track' : ''}`} key={overlay.id}><button className="track-label" onClick={() => selectOverlay(overlay)}><Icon size={14}/><span>{kindNames[overlay.kind]}</span></button><div className="track-lane"><button className={`overlay-clip clip-${overlay.kind} ${overlay.enabled ? '' : 'disabled-clip'}`} aria-label={`Select ${kindNames[overlay.kind]} timeline layer`} onClick={() => selectOverlay(overlay)} style={{left: `${overlay.start / project.duration * 100}%`, width: `${Math.min(overlay.duration, project.duration - overlay.start) / project.duration * 100}%`}}><Link2 size={11}/><span>{overlay.title}</span></button></div></div>;})}
            <div className="playhead-container"><div className="playhead" style={{left: `${time / project.duration * 100}%`}}><span/></div></div>
          </div>
          <div className="scrub-row"><span>SCRUB</span><input aria-label="Video playhead" type="range" min={0} max={Math.max(1, Math.ceil(project.duration * 30) - 1)} value={frame} onChange={e => {player.current?.pause(); seek(Number(e.target.value) / 30);}}/></div>
        </section>
        <div className="editor-footer"><span><ShieldCheck size={13}/> Local by design</span><span>{project.sampleMode ? 'Sample gestures are simulated. Import a video for real tracking.' : 'Hand tracking at 12 samples/sec · one hand · manual cues remain editable'}</span><button className="text-button" onClick={() => resetSample()}>Reset sample <ArrowUpRight size={12}/></button></div>
      </main>

      <aside className="inspector-panel">
        <div className="panel-heading"><span>Layer properties</span><Settings2 size={16}/></div>
        {selected ? <>
          <div className="selected-component"><div className={`selected-icon icon-${selected.kind}`}>{React.createElement(kindIcons[selected.kind], {size: 21})}</div><div><strong>{kindNames[selected.kind]}</strong><span>CodeRabbit brand kit</span></div><button className="icon-button" aria-label={selected.enabled ? 'Hide selected overlay' : 'Show selected overlay'} onClick={() => updateOverlay({enabled: !selected.enabled})}>{selected.enabled ? <Eye size={16}/> : <EyeOff size={16}/>}</button></div>
          <section className="inspector-section"><h2><Hand size={14}/> Gesture binding</h2><label className="field-label">Behavior<select aria-label="Overlay behavior" value={selected.binding} onChange={e => updateOverlay({binding: e.target.value as Binding})}><option value="cue">Reveal on cue</option><option value="progress">Hand position → progress</option><option value="follow">Follow hand</option></select></label>
            <p className="binding-explanation">{selected.binding === 'cue' ? 'Choose a cue below or set the start time. The component holds its position.' : selected.binding === 'progress' ? 'Horizontal hand movement controls the animation progress.' : 'The component follows the hand with an offset and stays inside the frame.'}</p>
            <label className="field-label">Set start from a cue<select aria-label="Bind overlay to gesture cue" value="" onChange={e => {const cue = project.cues.find(c => c.id === e.target.value); if (cue) {const start = clamp(cue.time, 0, project.duration - 0.1); updateOverlay({start, duration: Math.min(selected.duration, project.duration - start)}); seek(start + 0.5);}}}><option value="">Choose a detected cue</option>{project.cues.map(cue => <option key={cue.id} value={cue.id}>{gestureLabel[cue.gesture]} · {cue.time.toFixed(1)}s</option>)}</select></label>
            <div className="two-fields"><label className="field-label">Start <span className="input-unit"><input aria-label="Overlay start time" type="number" min={0} max={project.duration - 0.1} step={0.1} value={Number(selected.start.toFixed(2))} onChange={e => {const start = clamp(Number(e.target.value), 0, project.duration - 0.1); updateOverlay({start, duration: Math.min(selected.duration, project.duration - start)});}}/><span>s</span></span></label><label className="field-label">Duration <span className="input-unit"><input aria-label="Overlay duration" type="number" min={0.1} max={Math.max(0.1, project.duration - selected.start)} step={0.1} value={Number(selected.duration.toFixed(2))} onChange={e => updateOverlay({duration: clamp(Number(e.target.value), 0.1, Math.max(0.1, project.duration - selected.start))})}/><span>s</span></span></label></div>
          </section>
          <section className="inspector-section"><h2><Code2 size={14}/> Content</h2><label className="field-label">{selected.kind === 'code' ? 'Filename' : selected.kind === 'terminal' ? 'Window title' : 'Heading'}<input aria-label="Component title" maxLength={150} value={selected.title} onChange={e => updateOverlay({title: e.target.value})}/></label><label className="field-label">{selected.kind === 'terminal' ? 'Commands, one per line' : selected.kind === 'code' ? 'Code' : (['diagram', 'agentflow'].includes(selected.kind)) ? 'Nodes, separated by commas' : 'Description'}<textarea aria-label="Component content" className={(['code', 'terminal'].includes(selected.kind)) ? 'code-input' : ''} rows={(['code', 'terminal'].includes(selected.kind)) ? 5 : 3} maxLength={3000} value={selected.body} onChange={e => updateOverlay({body: e.target.value})}/></label></section>
          <section className="inspector-section"><h2><Settings2 size={14}/> Appearance</h2><label className="field-label">Placement<div className="placement-picker">{(['left', 'center', 'right'] as const).map(place => <button key={place} disabled={selected.binding === 'follow'} aria-pressed={selected.placement === place} onClick={() => updateOverlay({placement: place})}>{place}</button>)}</div></label><div className="scale-label"><span>Scale</span><span>{Math.round(selected.scale * 100)}%</span></div><input className="scale-slider" aria-label="Component scale" type="range" min={0.5} max={1.3} step={0.05} value={selected.scale} onChange={e => updateOverlay({scale: Number(e.target.value)})}/><div className="accent-row"><span>Accent</span><div>{colors.map(color => <button key={color} aria-label={`Set accent ${color}`} aria-pressed={selected.accent === color} style={{background: color}} onClick={() => updateOverlay({accent: color})}>{selected.accent === color && <Check size={12}/>}</button>)}</div></div></section>
          <div className="inspector-bottom"><button className="text-button" onClick={duplicateSelected}><Plus size={14}/> Duplicate</button><button className="icon-button" aria-label="Remove selected overlay" onClick={() => {commit(p => ({...p, overlays: p.overlays.filter(o => o.id !== selectedId)})); setSelectedId(project.overlays.find(o => o.id !== selectedId)?.id ?? '');}}><Trash2 size={15}/></button></div>
        </> : <div className="empty-inspector"><MousePointer2 size={26}/><p>Select a component to edit its content and gesture binding.</p></div>}
      </aside>
    </div>
    {(error || notice) && <div className={`toast ${error ? 'toast-error' : ''}`} role={error ? 'alert' : 'status'}><span>{error || notice}</span><button className="icon-button" aria-label="Dismiss message" onClick={() => {setError(''); setNotice('');}}><X size={16}/></button></div>}

    {exportOpen && <div className="modal-backdrop" onMouseDown={e => {if (e.target === e.currentTarget) setExportOpen(false);}}><section className="export-modal" role="dialog" aria-modal="true" aria-labelledby="export-title"><div className="modal-heading"><span className="export-icon"><ArrowUpRight size={24}/></span><button className="icon-button" aria-label="Close export dialog" onClick={() => setExportOpen(false)}><X size={19}/></button></div><h1 id="export-title">Ready for the final cut.</h1><p>Render your components exactly as they appear on the timeline.</p>
      <div className="export-formats"><button disabled={!!activeExport} aria-pressed={exportFormat === 'mp4'} onClick={() => setExportFormat('mp4')}><Film size={21}/><strong>Finished video</strong><span>MP4 · H.264 · {project.mute ? 'audio muted' : 'with source audio'}</span></button><button disabled={!!activeExport} aria-pressed={exportFormat === 'alpha'} onClick={() => setExportFormat('alpha')}><Layers3 size={21}/><strong>Transparent overlay</strong><span>ProRes 4444 · alpha · silent</span></button></div>
      <div className="export-summary"><span>1280 × 720</span><span>30 fps</span><span>{project.duration.toFixed(1)} seconds</span><span>{project.overlays.filter(o => o.enabled).length} components</span></div>
      {activeExport && <div className="export-progress" role="status"><progress max={100} value={job.progress}/><span><LoaderCircle size={15} className="spin"/>{job.status === 'bundling' || job.status === 'starting' ? 'Preparing the composition…' : `Rendering frames… ${job.progress}%`}</span></div>}
      {job?.status === 'error' && <p className="export-error" role="alert">{job.error}</p>}
      {job?.status === 'done' && <a className="button button-purple full-width" href={job.url} download><ArrowDownToLine size={16}/> Download {job.filename?.endsWith('.mov') ? 'transparent overlay' : 'video'}</a>}
      {!activeExport && <button className={`button ${job?.status === 'done' ? 'button-light' : 'button-dark'} full-width`} onClick={startExport}><ArrowUpRight size={17}/>{job?.status === 'done' ? 'Render again' : 'Render video'}</button>}
      <div className="export-footnote"><ShieldCheck size={13}/> Rendered locally on your computer.</div>
    </section></div>}
  </div>;
}
