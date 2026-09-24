import React, {useEffect, useRef} from 'react';
import {ArrowDownToLine, ArrowUpRight, Film, Layers3, LoaderCircle, ShieldCheck, X} from 'lucide-react';
import type {RenderJob} from '../hooks/useRenderJob';
import type {Project} from '../types';

type ExportFormat = 'mp4' | 'alpha';
type Props = {
  project: Project;
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  onClose: () => void;
  onExport: () => void;
  onCancel: () => void;
  job: RenderJob | null;
  active: boolean;
  recovering: boolean;
  connection: string;
  disabled?: boolean;
  alphaAvailable?: boolean;
  onResolutionChange?: (width: number) => void;
};

/** The same two export choices for a reusable asset and a footage composition. */
export function ExportDialog({project, format, onFormatChange, onClose, onExport, onCancel, job, active, recovering, connection, disabled = false, alphaAvailable = true, onResolutionChange}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);
  const duration = `${Math.floor(project.duration / 60).toString().padStart(2, '0')}:${(project.duration % 60).toFixed(1).padStart(4, '0')}`;
  const downloadedAlpha = job?.filename?.endsWith('.mov');
  return <dialog ref={dialog} className="export-modal export-dialog" aria-labelledby="export-title" onCancel={event => {event.preventDefault(); onClose();}} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }}>
    <div className="modal-heading"><span className="export-icon"><ArrowUpRight size={24}/></span><button autoFocus className="icon-button" aria-label="Close export dialog" onClick={onClose}><X size={19}/></button></div>
    <h1 id="export-title">Export {onResolutionChange ? 'asset' : 'video'}</h1>
    <p>Choose a finished video or a transparent layer for your edit.</p>
    <div className="export-formats" role="group" aria-label="Export type">
      <button aria-label="Video" disabled={active || recovering} aria-pressed={format === 'mp4'} onClick={() => onFormatChange('mp4')}><Film size={21}/><strong>Video</strong><span>MP4 · H.264<br/>{project.mediaUrl && !project.mute ? 'With source audio' : 'Silent video'}</span></button>
      <button aria-label="Transparent background" disabled={active || recovering || !alphaAvailable} aria-pressed={format === 'alpha'} onClick={() => onFormatChange('alpha')}><Layers3 size={21}/><strong>Transparent background</strong><span>{alphaAvailable ? <>MOV · ProRes 4444<br/>Graphics only · no audio</> : 'This asset fills the entire frame.'}</span></button>
    </div>
    {onResolutionChange && <label className="field-label">Resolution<select aria-label="Export resolution" disabled={active || recovering} value={project.width} onChange={event => onResolutionChange(Number(event.target.value))}><option value={1280}>1280 × 720</option><option value={1920}>1920 × 1080</option></select></label>}
    <div className="export-summary"><span>{project.width} × {project.height}</span><span>{project.fps} fps</span><span>{duration}</span><span>{project.overlays.filter(overlay => overlay.enabled).length} components</span></div>
    {job && <p className="hint">{active ? 'Exporting' : 'Last export'}: {job.assetName}</p>}
    {active && <div className="export-progress" role="status"><progress aria-label="Export progress" max={100} value={job?.progress ?? 0}/><span><LoaderCircle size={15} className="spin"/>{job?.status === 'cancelling' ? 'Cancelling export…' : job?.status === 'bundling' || job?.status === 'starting' ? 'Preparing export…' : `Rendering frames… ${job?.progress ?? 0}%`}</span></div>}
    {connection && <p className="hint" role="status">{connection}</p>}
    {active && <button className="button button-light full-width" disabled={job?.status === 'cancelling' || job?.status === 'starting'} onClick={onCancel}>Cancel export</button>}
    {job?.status === 'cancelled' && <p role="status">Export cancelled.</p>}
    {job?.status === 'error' && <p className="export-error" role="alert">{job.error}</p>}
    {job?.status === 'done' && <a className="button button-primary full-width" href={job.url} download><ArrowDownToLine size={16}/> Download {downloadedAlpha ? 'transparent background' : 'video'}</a>}
    {!active && <button className={`button ${job?.status === 'done' ? 'button-light' : 'button-dark'} full-width`} disabled={recovering || disabled || (format === 'alpha' && !alphaAvailable)} onClick={onExport}><ArrowUpRight size={17}/>{recovering ? 'Checking export status…' : `Render ${format === 'alpha' ? 'transparent background' : 'video'}`}</button>}
    <div className="export-footnote"><ShieldCheck size={13}/>{active ? 'You can close this dialog; the export continues.' : 'Rendered locally on your computer.'}</div>
  </dialog>;
}
