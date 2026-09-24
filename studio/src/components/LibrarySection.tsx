import React, {useEffect, useId, useState} from 'react';
import {ChevronDown} from 'lucide-react';

export function LibrarySection({name, count, selected, children}: {name: string; count: number; selected?: string; children: React.ReactNode}) {
  const [expanded, setExpanded] = useState(true);
  const id = useId();
  // Selecting a layer or opening a preset exposes its template in the library.
  useEffect(() => {if (selected) setExpanded(true);}, [selected]);
  return <section className="library-section" aria-labelledby={`${id}-heading`}>
    <h3 id={`${id}-heading`}><button className="library-section-toggle" aria-expanded={expanded} aria-controls={`${id}-items`} onClick={() => setExpanded(value => !value)}>
      <ChevronDown size={13} aria-hidden="true"/>
      <span>{name}</span><span className="library-section-count">{count}</span>
      {selected && !expanded && <i className="library-section-selected" aria-label="Contains selected asset"/>}
    </button></h3>
    <div id={`${id}-items`} className="library-section-items" hidden={!expanded}>{expanded && children}</div>
  </section>;
}
