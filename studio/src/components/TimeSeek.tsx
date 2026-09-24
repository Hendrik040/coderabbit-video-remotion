import React, {useState} from 'react';
import {parseTimecode} from '../lib/timecode';

export function TimeSeek({onSeek}: {onSeek: (time: number) => void}) {
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);
  return <form className="time-seek" onSubmit={event => {
    event.preventDefault();
    const time = parseTimecode(value);
    if (time === null) {setInvalid(true); return;}
    onSeek(time); setInvalid(false);
  }}><input aria-label="Jump to time" aria-invalid={invalid} placeholder="mm:ss" value={value} onChange={event => {setValue(event.target.value); setInvalid(false);}}/><button className="text-button" type="submit">Go</button></form>;
}
