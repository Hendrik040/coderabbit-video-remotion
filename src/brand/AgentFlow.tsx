import React from 'react';

/** Compact overlay adaptation of RabbitAgentLoopV4's orange plan/code/review flow. */
export function AgentFlow({title, labels, progress, accent = '#FF570A'}: {
  title: string; labels: string[]; progress: number; accent?: string;
}) {
  const names = [0, 1, 2].map(i => labels[i]?.trim() || ['Plan', 'Code', 'Review'][i]);
  return <div style={{background: '#171717', border: '1px solid #39342e', borderRadius: 18, padding: 30, color: '#F6F6F1', fontFamily: 'IBM Plex Mono, monospace', boxShadow: '0 22px 70px #0005'}}>
    <div style={{fontSize: 11, letterSpacing: 2, color: accent, marginBottom: 14}}>CODERABBIT / AGENT WORKFLOW</div>
    <div style={{fontSize: 23, lineHeight: 1.4, marginBottom: 32}}>{title}</div>
    <div style={{display: 'flex', alignItems: 'center'}}>
      {names.map((name, i) => {
        const active = progress >= i / 3;
        return <React.Fragment key={i}>
          {i > 0 && <div style={{flex: 1, height: 2, background: '#41403a', position: 'relative'}}>
            <div style={{height: '100%', width: `${Math.min(1, Math.max(0, progress * 3 - (i - 1))) * 100}%`, background: accent}}/>
          </div>}
          <div style={{width: 125, height: 98, borderRadius: 22, border: `1px solid ${active ? accent : '#41403a'}`, background: active ? `${accent}17` : '#20201e', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10}}>
            <span style={{fontSize: 23, color: active ? accent : '#77776f'}}>{['↗', '</>', '✓'][i]}</span>
            <span style={{fontSize: 14, maxWidth: 115, overflowWrap: 'anywhere', textAlign: 'center'}}>{name}</span>
          </div>
        </React.Fragment>;
      })}
    </div>
    <div style={{height: 3, background: '#35342e', marginTop: 30, overflow: 'hidden'}}><div style={{width: `${Math.min(1, Math.max(0, progress)) * 100}%`, height: '100%', background: accent}}/></div>
    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa99c', marginTop: 14}}><span>CONTEXT → ACTION → CONFIDENCE</span><span style={{color: accent}}>{progress > .95 ? 'READY TO SHIP' : 'IN PROGRESS'}</span></div>
  </div>;
}
