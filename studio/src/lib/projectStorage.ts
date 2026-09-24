import type {Project} from '../types';
import {projectSchema} from './schema';

const legacyKey = 'coderabbit-motion-project';
let database: Promise<IDBDatabase> | undefined;
function openDatabase() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('coderabbit-motion-studio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('projects');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {database = undefined; reject(request.error);};
  });
}

// Serialize writes so a late, large tracking save cannot overwrite a newer edit.
let pendingSave: Promise<void> = Promise.resolve();
export function saveComposition(project: Project): Promise<void> {
  const next = pendingSave.catch(() => {}).then(async () => {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('projects', 'readwrite');
      transaction.objectStore('projects').put(project, 'current');
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => reject(transaction.error ?? new Error('Project save interrupted.'));
    });
    // Remove the small-storage copy only after the new save has succeeded.
    try {localStorage.removeItem(legacyKey);} catch { /* IndexedDB is the source of truth. */ }
  });
  pendingSave = next;
  return next;
}

export async function loadComposition(): Promise<Project | null> {
  await pendingSave.catch(() => {});
  const db = await openDatabase();
  const saved = await new Promise<unknown>((resolve, reject) => {
    const request = db.transaction('projects', 'readonly').objectStore('projects').get('current');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  if (saved) return projectSchema.parse(saved);
  const legacy = localStorage.getItem(legacyKey);
  if (!legacy) return null;
  const project = projectSchema.parse(JSON.parse(legacy));
  await saveComposition(project);
  return project;
}
