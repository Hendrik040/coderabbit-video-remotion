import React from 'react';
import {ArrowUpRight, Layers3, LayoutDashboard, Network, ShieldAlert} from 'lucide-react';
import {changeStackLayers, productViews} from '../lib/productAssets';
import type {Overlay} from '../types';
import './product-controls.css';
import {TriageControls} from './TriageControls';

const icons = {overview: LayoutDashboard, layers: Layers3, architecture: Network, security: ShieldAlert};

export function ProductControls({asset, onChange}: {asset: Overlay; onChange: (patch: Partial<Overlay>) => void}) {
  if (asset.kind === 'triage-board') return <TriageControls asset={asset} onChange={onChange}/>;
  return <>
    <label className="field-label">Playback<select aria-label="Product playback" value={asset.productAnimation ?? 'scene'} onChange={event => onChange({productAnimation: event.target.value as Overlay['productAnimation']})}>
      <option value="walkthrough">Walk through all views</option><option value="scene">Animate selected view</option><option value="still">Still / interactive</option>
    </select></label>
    <div className="field-label"><span>Product view</span><div className="product-view-picker" role="group" aria-label="Change Stack product view">{productViews.map(view => {
      const Icon = icons[view.id];
      return <button key={view.id} aria-pressed={(asset.productView ?? 'overview') === view.id} onClick={() => onChange({productView: view.id})}><Icon size={17}/><strong>{view.name}</strong><small>{view.description}</small></button>;
    })}</div></div>
    {asset.productView === 'layers' && <label className="field-label">Focused layer<select aria-label="Change Stack focused layer" value={asset.productLayer ?? 1} onChange={event => onChange({productLayer: Number(event.target.value)})}>{changeStackLayers.map((layer, index) => <option key={layer.id} value={index}>{index + 1}. {layer.title}</option>)}</select></label>}
    <label className="field-label">Pull request title<textarea aria-label="Product pull request title" rows={2} maxLength={90} value={asset.title} onChange={event => onChange({title: event.target.value})}/></label>
    <label className="field-label">Repository<input aria-label="Product repository" maxLength={60} value={asset.productRepository ?? 'acme/web-app'} onChange={event => onChange({productRepository: event.target.value})}/></label>
    <label className="field-label">Pull request number<input aria-label="Product PR number" maxLength={20} value={asset.productPr ?? '#482'} onChange={event => onChange({productPr: event.target.value})}/></label>
    <label className="field-label">Overview heading<input aria-label="Product overview heading" maxLength={90} value={asset.productOverviewTitle ?? ''} onChange={event => onChange({productOverviewTitle: event.target.value})}/></label>
    {(asset.productView ?? 'overview') === 'overview' && <label className="field-label">Summary<textarea aria-label="Product summary" rows={4} maxLength={1000} value={asset.body} onChange={event => onChange({body: event.target.value})}/></label>}
    <label className="field-label">Context panel<select aria-label="Product context panel" value={asset.productHideContext ? 'hidden' : 'visible'} onChange={event => onChange({productHideContext: event.target.value === 'hidden'})}><option value="visible">Show context</option><option value="hidden">Hide context</option></select></label>
    <p className="hint">Click the product to pause and explore. Edit the title, repository, heading, and summary directly on the canvas.</p>
    <a className="text-button product-reference" href="https://www.coderabbit.ai/change-stack" target="_blank" rel="noreferrer">View product reference <ArrowUpRight size={12}/></a>
  </>;
}
