export type Gesture = 'Open_Palm' | 'Pointing_Up' | 'Pinch' | 'Swipe' | 'None';
export type BroadcastKind = 'presenter' | 'headline' | 'triage' | 'stack' | 'ticker' | 'bug' | 'ident';
export type OverlayKind = 'code' | 'diagram' | 'callout' | 'terminal' | 'agentflow' | 'hero' | BroadcastKind;
export type AssetType = 'linear' | 'looping';
export type Binding = 'cue' | 'progress' | 'follow';
export type Placement = 'left' | 'right' | 'center';
export type Sample = {t: number; x: number; y: number; pinch: number; confidence: number; gesture: Gesture; visible: boolean};
export type Cue = {id: string; time: number; gesture: Gesture};
export type Overlay = {
  id: string; kind: OverlayKind; enabled: boolean; title: string; body: string;
  start: number; duration: number; binding: Binding; placement: Placement; accent: string; scale: number;
  kicker?: string;
  loopDuration?: number; intensity?: number; opacity?: number;
};
export type Project = {
  name: string; mediaUrl: string | null; mediaName: string; duration: number; fps: number;
  width: number; height: number; samples: Sample[]; cues: Cue[]; overlays: Overlay[];
  sampleMode: boolean; showTracking: boolean; mute: boolean;
  broadcast?: boolean;
};
export type SceneProps = {project: Project; transparent?: boolean};
export const gestureLabel: Record<Gesture, string> = {Open_Palm: 'Open palm', Pointing_Up: 'Point', Pinch: 'Pinch', Swipe: 'Hand sweep', None: 'No gesture'};
