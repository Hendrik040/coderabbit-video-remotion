import React, {useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {triageViews} from '../lib/productMotion';
import {triagePreviewCards} from '../lib/triageAssets';
import type {Overlay} from '../types';
import type {TriageCardCopy} from './triage/source/TriageEditor';

export function TriageControls({asset, onChange}: {asset: Overlay; onChange: (patch: Partial<Overlay>) => void}) {
  const cards = triagePreviewCards(asset);
  const [selectedId, setSelectedId] = useState(cards[0]?.id);
  const card = cards.find(item => item.id === selectedId) ?? cards[0];
  const view = asset.triageView ?? 'requires-action-view';
  const editCard = (field: keyof TriageCardCopy, value: string) => card && onChange({triageCards: {...asset.triageCards, [card.id]: {...asset.triageCards?.[card.id], [field]: value}}});
  return <>
    <label className="field-label">Playback<select aria-label="Product playback" value={asset.productAnimation ?? 'scene'} onChange={event => onChange({productAnimation: event.target.value as Overlay['productAnimation']})}>
      <option value="walkthrough">Walk through all views</option><option value="scene">Animate selected view</option><option value="still">Still / interactive</option>
    </select></label>
    <div className="field-label"><span>Product view</span><div className="product-view-picker triage-view-picker" role="group" aria-label="Triage product view">{triageViews.map(item => <button key={item.id} aria-pressed={view === item.id} onClick={() => onChange({triageView: item.id, triageUi: {...asset.triageUi, openPanel: null, openReviewerCardId: null}})}><strong>{item.name}</strong></button>)}</div></div>
    <label className="field-label">Layout<select aria-label="Triage layout" value={asset.triageUi?.boardLayout ?? 'board'} onChange={event => onChange({triageUi: {...asset.triageUi, boardLayout: event.target.value as 'board' | 'list'}})}><option value="board">Board</option><option value="list">List</option></select></label>
    <label className="field-label">Grouping<select aria-label="Triage grouping" value={asset.triageUi?.viewGroupings?.[view] ?? (view === 'requires-action-view' ? 'Focus' : 'Inbox')} onChange={event => onChange({triageUi: {...asset.triageUi, collapsedColumnIds: [], viewGroupings: {...asset.triageUi?.viewGroupings, [view]: event.target.value}}})}><option value="Focus">Focus · Now / Next</option><option value="Inbox">Inbox · Priority</option></select></label>
    {card && <>
      <label className="field-label">Edit card<select aria-label="Triage card" value={card.id} onChange={event => setSelectedId(event.target.value)}>{cards.map(item => <option key={item.id} value={item.id}>{item.reference} · {item.title}</option>)}</select></label>
      <label className="field-label">Title<textarea aria-label="Triage card title" rows={2} maxLength={150} value={card.title} onChange={event => editCard('title', event.target.value)}/></label>
      <label className="field-label">Summary<textarea aria-label="Triage card summary" rows={3} maxLength={600} value={card.reason ?? ''} onChange={event => editCard('reason', event.target.value)}/></label>
      <label className="field-label">Repository<input aria-label="Triage card repository" maxLength={60} value={card.repository} onChange={event => editCard('repository', event.target.value)}/></label>
      <label className="field-label">Author<input aria-label="Triage card author" maxLength={90} value={card.author ?? ''} onChange={event => editCard('author', event.target.value)}/></label>
      <button className="text-button" onClick={() => onChange({triageUi: {...asset.triageUi, openReviewerCardId: asset.triageUi?.openReviewerCardId === card.id ? null : card.id, openPanel: null}})}>{asset.triageUi?.openReviewerCardId === card.id ? 'Hide' : 'Show'} reviewer details</button>
    </>}
    <p className="hint">Click the board to pause. Edit card text on the canvas, switch queues, or explore reviewer details. Changes are saved with this product.</p>
    <a className="text-button product-reference" href="https://www.coderabbit.ai/triage" target="_blank" rel="noreferrer">View product reference <ArrowUpRight size={12}/></a>
  </>;
}
