import {useCallback, useEffect, useRef, useState} from 'react';
import type {Project} from '../types';

export type RenderJob = {id: string; status: string; progress: number; url?: string; filename?: string; error?: string; assetName: string};
const isActive = (job: RenderJob | null) => !!job && !['done', 'error', 'cancelled'].includes(job.status);

/** One local render queue shared by the asset library and composition editor. */
export function useRenderJob() {
  const [job, setJob] = useState<RenderJob | null>(null);
  const [recovering, setRecovering] = useState(true);
  const [connection, setConnection] = useState('');
  const submitting = useRef(false);

  useEffect(() => {
    if (!recovering && !isActive(job)) return;
    let disposed = false;
    let timer: number;
    const poll = async () => {
      if (submitting.current) {timer = window.setTimeout(poll, 1500); return;}
      try {
        const response = await fetch(job?.id ? `/api/render/${job.id}` : '/api/render/latest', {signal: AbortSignal.timeout(10000)});
        if (response.status === 404 && job) {
          if (!disposed) {setJob({...job, status: 'error', error: 'Export not found. Render again to restart.'}); setRecovering(false); setConnection('');}
          return;
        }
        if (!response.ok) throw new Error('Export status unavailable.');
        const result = await response.json();
        if (!disposed && !submitting.current) {
          setJob(job?.id ? result : result.job); setRecovering(false); setConnection('');
        }
      } catch {
        if (!disposed) setConnection('Reconnecting to the local server… Keep it running; your export continues there.');
      }
      if (!disposed) timer = window.setTimeout(poll, 1500);
    };
    void poll();
    return () => {disposed = true; clearTimeout(timer);};
  }, [job?.id, job?.status, recovering]);

  const start = useCallback(async (project: Project, format: 'mp4' | 'alpha') => {
    if (submitting.current || recovering || isActive(job)) return;
    submitting.current = true;
    const id = crypto.randomUUID();
    setJob({id, status: 'starting', progress: 0, assetName: project.name}); setConnection('');
    try {
      const body = JSON.stringify({id, project, format});
      const response = await fetch('/api/render', {method: 'POST', headers: {'Content-Type': 'application/json'}, body, signal: AbortSignal.timeout(30000)});
      const result = await response.json();
      if (!response.ok) {
        if (result.job) {setJob(result.job); return;}
        setJob({id, status: 'error', progress: 0, assetName: project.name, error: result.error ?? 'Export failed.'}); return;
      }
      setJob(result);
    } catch (error) {
      // A lost response may still have started the render. The next status poll recovers it.
      setConnection('Checking whether the server received your export…');
      setRecovering(true);
    } finally {submitting.current = false;}
  }, [job, recovering]);

  const cancel = useCallback(async () => {
    if (!job?.id) return;
    try {
      const response = await fetch(`/api/render/${job.id}/cancel`, {method: 'POST'});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setJob(result); setConnection('');
    } catch {setConnection('Could not cancel the export. Reconnect to the local server and try again.');}
  }, [job?.id]);

  return {job, activeExport: isActive(job), recovering, connection, start, cancel};
}
