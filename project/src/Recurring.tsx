import { useState } from 'react';
import type { RecurringSeries } from './types';
import { todayISO } from './store';
import { RULE_LABEL,WEEKDAYS,rhythmLabel } from './schedule';
type NewSeries=Omit<RecurringSeries,'id'|'createdAt'>;
export function Recurring({series,onAdd,onUpdate,onDelete}:{series:RecurringSeries[];entries:{seriesId?:string;date:string}[];onAdd:(s:NewSeries)=>void;onUpdate:(id:string,p:Partial<RecurringSeries>)=>void;onDelete:(id:string)=>void}){
 const blank:NewSeries={title:'',rule:'weekly',anchorDate:todayISO(),paused:false,weekdays:[1,3,5]};
 const [draft,setDraft]=useState(blank);const [editing,setEditing]=useState<string|null>(null);
 const save=()=>{if(!draft.title.trim()||!draft.anchorDate||draft.rule==='weekdays'&&!draft.weekdays?.length)return;if(editing)onUpdate(editing,draft);else onAdd({...draft,title:draft.title.trim()});setDraft(blank);setEditing(null)};
 return <div className="feature-page"><p className="eyebrow">returning</p><h1>Things that return</h1><p className="feature-intro">A rhythm that leaves room for living.</p>
 <form className="quiet-form" onSubmit={e=>{e.preventDefault();save()}}><label>What returns?<input required aria-label="Recurring task title" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="Water the ferns"/></label>
 <label>Rhythm<select value={draft.rule} onChange={e=>setDraft({...draft,rule:e.target.value as NewSeries['rule']})}>{Object.entries(RULE_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
 {draft.rule==='weekdays'&&<fieldset className="weekday-picker"><legend>Choose days</legend>{WEEKDAYS.map((d,i)=><button type="button" key={d} aria-pressed={draft.weekdays?.includes(i)??false} onClick={()=>setDraft({...draft,weekdays:draft.weekdays?.includes(i)?draft.weekdays.filter(n=>n!==i):[...(draft.weekdays??[]),i].sort()})}>{d}</button>)}</fieldset>}
 <label>Starts on<input required type="date" value={draft.anchorDate} onChange={e=>setDraft({...draft,anchorDate:e.target.value})}/></label><div className="form-actions"><button disabled={!draft.title.trim()||draft.rule==='weekdays'&&!draft.weekdays?.length}>{editing?'save rhythm':'add a rhythm'}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setDraft(blank)}}>cancel</button>}</div></form>
 <ul className="feature-list">{series.map(s=><li key={s.id}><div><strong>{s.title}</strong><small>{rhythmLabel(s)} · from {s.anchorDate}{s.paused?' · resting':''}</small></div><div className="inline-actions"><button onClick={()=>{setEditing(s.id);setDraft({...s})}}>edit</button><button onClick={()=>onUpdate(s.id,{paused:!s.paused})}>{s.paused?'resume':'pause'}</button><button onClick={()=>onDelete(s.id)}>remove</button></div></li>)}</ul><p className="fine-note">Changing a rhythm affects future returns. Past entries remain in your sky.</p></div>
}