import type {AssetType, OverlayKind} from '../types';

export const assetType = (kind: OverlayKind): AssetType => kind === 'hero' || kind === 'signal-loop' || kind === 'color-bar-loop' ? 'looping' : 'linear';
