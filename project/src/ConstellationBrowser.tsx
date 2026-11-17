import { useState } from 'react';
import type { AppData } from './types';
import { TransmissionBox } from './TransmissionBox';
export function ConstellationBrowser({data,onClose,onOpenDay,onSelect}:{data:AppData;onClose:()=>void;onOpenDay:(d:string)=>void;onSelect:(id:string)=>void}){
 const [active,setActive]=useState<string|null>(null);
 const constellation=data.constellations.find(c=>c.id===active);
 const stars=constellation?.entryIds.map(id=>data.entries.find(e=>e.id===id));
 return <TransmissionBox className="constellation-transmission" label="Constellations"><button className="detail-close" aria-label="Close constellations" onClick={onClose}>×</button><header><small>orbitals / connections remembered</small><h2>{constellation?.name??'Constellations'}</h2></header>
 {constellation?<><button className="constellation-back" onClick={()=>setActive(null)}>← all constellations</button><p className="constellation-meta">{constellation.entryIds.length} stars · connected {new Date(constellation.createdAt).toLocaleDateString()}</p><ol className="constellation-stars">{stars?.map((entry,i)=><li key={constellation.entryIds[i]}>{entry?<><button onClick={()=>onSelect(entry.id)}><strong>{entry.text}</strong><small>{entry.orbiting?'in orbit':entry.date} · {entry.done?'fulfilled':'unfolding'}</small></button>{entry.note&&<p>{entry.note}</p>}{!entry.orbiting&&<button className="text-link" onClick={()=>onOpenDay(entry.date)}>visit this day ↗</button>}</>:<p className="constellation-meta">This star is no longer in the records.</p>}</li>)}</ol></>:<div className="constellation-list">{data.constellations.length?data.constellations.map(c=><button key={c.id} onClick={()=>setActive(c.id)}><strong>{c.name}</strong><small>{c.entryIds.length} stars · {new Date(c.createdAt).toLocaleDateString()}</small></button>):<p>No constellations yet. Type <code>connect</code> to draw your first connection between stars.</p>}</div>}
 </TransmissionBox>
}
