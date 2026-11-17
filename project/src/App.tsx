import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, X, Wind, Download, Sparkles } from 'lucide-react';
import { useOrbitals, todayISO, addDaysISO } from './store';
import { SkyJournal } from './SkyJournal';
import { FutureEvents } from './FutureEvents';
import { VoidExplorer } from './VoidExplorer';
import { upcomingOn, rhythmLabel } from './schedule';
import { Recurring } from './Recurring';
import { ToBuy } from './ToBuy';
import { Sky } from './Sky';
import { Evol, type EvolTarget } from './Evol';
import { Iris } from './Iris';
import './iris.css';

type Panel = 'returning' | 'gathering' | 'constellations' | 'events' | null;
export default function App() {
 const o = useOrbitals();
 const [date,setDate]=useState(todayISO);
 const [panel,setPanel]=useState<Panel>(null);
 const [scale,setScale]=useState<'today'|'season'|'years'>('today');
 const [draft,setDraft]=useState('');
 const [selected,setSelected]=useState<string|null>(null);
 const [evol,setEvol]=useState<EvolTarget|null>(null);
 const [study,setStudy]=useState(false);
 const [voidOpen,setVoidOpen]=useState(false);
 const tomorrow=addDaysISO(date,1);
 const upcoming=upcomingOn(o.data,tomorrow);
 const [linkName,setLinkName]=useState('');
 const [linkIds,setLinkIds]=useState<string[]>([]);
 useEffect(()=>{o.materializeRecurring(date)},[date,o.materializeRecurring,o.data.series]);
 const entries=o.data.entries.filter(e=>e.date===date&&!e.orbiting).sort((a,b)=>a.order-b.order);
 const chosen=o.data.entries.find(e=>e.id===selected);
 const format=new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'});
 const add=()=>{if(draft.trim()){o.addEntries(date,draft.split(/\r?\n/));setDraft('')}};
 const exportData=()=>{const blob=new Blob([JSON.stringify({schema:'orbitals.archive',version:1,exportedAt:new Date().toISOString(),...o.data},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='orbitals-archive.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 return <div className="iris-app">
  <aside className="notebook">
   <header className="wordmark">orbitals<span>a life, unfolding</span></header>
   <div className="date-line"><button aria-label="Previous day" onClick={()=>setDate(addDaysISO(date,-1))}><ArrowLeft size={15}/></button><label>{format}<input aria-label="Choose day" type="date" value={date} onChange={e=>e.target.value&&setDate(e.target.value)}/></label><button aria-label="Next day" onClick={()=>setDate(addDaysISO(date,1))}><ArrowRight size={15}/></button></div>
   {date!==todayISO()&&<button className="text-link" onClick={()=>setDate(todayISO())}>return to today</button>}
   <section className="within"><h1>here, today <span/></h1>
    <ul className="daily-list">{entries.map(e=><li key={e.id} className={e.done?'fulfilled':''}><button className="task-light" aria-label={(e.done?'Reopen ':'Complete ')+e.text} aria-pressed={e.done} onClick={()=>o.updateEntry(e.id,{done:!e.done})}/><button className={selected===e.id?'entry-title active':'entry-title'} onClick={()=>setSelected(e.id)}>{e.text}{e.kind==='event'&&<small className="event-tag">{e.time??'event'}</small>}</button></li>)}</ul>
    {!entries.length&&<p className="empty-note">A little space for what calls to you today.</p>}
    <form className="add-line" onSubmit={e=>{e.preventDefault();add()}}><textarea aria-label="New orbitals" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="place something in orbit…" rows={2} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();add()}}}/><button aria-label="Add orbitals" disabled={!draft.trim()}><Plus size={17}/></button></form>
   </section>
   <section className="upcoming-section"><h2><button onClick={()=>setDate(tomorrow)}>within reach</button><span/><button aria-label="Schedule a future event" onClick={()=>setPanel('events')}><Plus size={15}/></button></h2><small className="tomorrow-label">tomorrow · {new Date(tomorrow+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</small>{upcoming.slice(0,4).map(e=><button className="side-item" key={e.id} onClick={()=>{setDate(tomorrow);if(!e.virtual)setSelected(e.id)}}><span className="small-orbit"/>{e.text}</button>)}{!upcoming.length&&<p className="empty-note">An open tomorrow.</p>}<button className="text-link" onClick={()=>setPanel('events')}>place something on the horizon ↗</button></section>
   <section><h2><button onClick={()=>setPanel('returning')}>returning</button><span/><button aria-label="Manage recurring tasks" onClick={()=>setPanel('returning')}><Plus size={15}/></button></h2>{o.data.series.slice(0,3).map(s=><button className="side-item" key={s.id} onClick={()=>setPanel('returning')}><span className="small-orbit"/> {s.title}<small>{s.paused?'resting':rhythmLabel(s)}</small></button>)}{!o.data.series.length&&<button className="empty-note" onClick={()=>setPanel('returning')}>Give something a rhythm.</button>}</section>
   <section><h2><button onClick={()=>setPanel('gathering')}>gathering</button><span/><button aria-label="Manage purchases" onClick={()=>setPanel('gathering')}><Plus size={15}/></button></h2>{o.data.buyItems.filter(b=>!b.bought).slice(0,3).map(b=><button className="side-item" key={b.id} onClick={()=>setPanel('gathering')}><span className="small-orbit"/>{b.text}</button>)}{!o.data.buyItems.some(b=>!b.bought)&&<button className="empty-note" onClick={()=>setPanel('gathering')}>Materials, wishes, things to gather.</button>}</section>
   <section className="weather"><SkyJournal key={date} date={date} logs={o.data.moodJournal} onAdd={o.addMood}/></section>
   <footer className="notebook-footer"><button onClick={()=>setEvol({kind:'day',date})}><Sparkles size={13}/> with Evol</button><button aria-label="Download your archive" onClick={exportData}><Download size={14}/></button></footer>
  </aside>
  <main className="sky-room">
   <div className="sky-top"><span>{date.slice(0,4)} <i>·</i> {study?'a study of a possible sky':'your unfolding sky'}</span><div className="sky-top-actions"><button onClick={()=>setPanel('constellations')}>constellations ↗</button><button onClick={()=>setVoidOpen(true)}>enter the eye ⤢</button></div></div>
   <Iris data={o.data} date={date} selected={selected} onSelect={setSelected} scale={scale} study={study}/>
   <div className="sky-caption"><span>one turn, one year</span><button className="text-link" onClick={()=>setStudy(!study)}>{study?'return to my sky':'explore a sample sky'}</button></div>
   {chosen&&<section className="thread-detail" aria-label="Selected orbital"><button className="detail-close" aria-label="Close orbital" onClick={()=>setSelected(null)}><X size={16}/></button><small>{chosen.orbiting?'undated · in orbit':chosen.date} · {chosen.done?'fulfilled':'unfolding'}</small><input aria-label="Orbital title" value={chosen.text} onChange={e=>o.updateEntry(chosen.id,{text:e.target.value})}/><textarea aria-label="Orbital note" placeholder="leave a little trace…" value={chosen.note??''} onChange={e=>o.updateEntry(chosen.id,{note:e.target.value})}/><div className="detail-actions"><button onClick={()=>o.updateEntry(chosen.id,{done:!chosen.done})}>{chosen.done?'reopen':'mark fulfilled'}</button>{chosen.orbiting?<button onClick={()=>o.recallOrbital(chosen.id,date)}>bring into today</button>:<button onClick={()=>o.letOrbit(chosen.id)}><Wind size={13}/> let orbit</button>}</div><label className="move-date">return on <input aria-label="Move orbital to date" type="date" value={chosen.orbiting?'':chosen.date??''} onChange={e=>{if(e.target.value){if(chosen.orbiting)o.recallOrbital(chosen.id,e.target.value);else o.moveEntry(chosen.id,e.target.value)}}}/></label></section>}
   <footer className="sky-footer"><nav aria-label="Time scale">{(['today','season','years'] as const).map(s=><button key={s} aria-pressed={scale===s} className={scale===s?'active':''} onClick={()=>setScale(s)}>{s}</button>)}</nav><div className="footer-rule"/><p>Nothing disappears. It becomes part of the sky.</p></footer>
  </main>
  {panel&&<div className="drawer-shade" onClick={()=>setPanel(null)}><section className="planner-drawer" role="dialog" aria-modal="true" aria-label={panel} onClick={e=>e.stopPropagation()} onKeyDown={e=>e.key==='Escape'&&setPanel(null)}><button autoFocus className="drawer-close" aria-label="Close panel" onClick={()=>setPanel(null)}><X size={20}/></button>
  {panel==='events'&&<FutureEvents entries={o.data.entries} onAdd={o.addEvent} onOpen={d=>{setDate(d);setPanel(null)}} onUpdate={o.updateEntry}/>}
  {panel==='returning'&&<Recurring series={o.data.series} entries={o.data.entries} onAdd={o.addSeries} onUpdate={o.updateSeries} onDelete={o.deleteSeries}/>}
  {panel==='gathering'&&<ToBuy items={o.data.buyItems} onAdd={o.addBuyItem} onUpdate={o.updateBuyItem} onDelete={o.deleteBuyItem}/>}
  {panel==='constellations'&&<><div className="link-compose"><h2>draw a connection</h2><p>Choose moments that belong together—even across years.</p><input aria-label="Constellation name" placeholder="name this constellation…" value={linkName} onChange={e=>setLinkName(e.target.value)}/><div className="link-choices">{o.data.entries.map(e=><label key={e.id}><input type="checkbox" checked={linkIds.includes(e.id)} onChange={()=>setLinkIds(ids=>ids.includes(e.id)?ids.filter(id=>id!==e.id):[...ids,e.id])}/><span>{e.text}<small>{e.date??'in orbit'}</small></span></label>)}</div><button disabled={!linkName.trim()||linkIds.length<2} onClick={()=>{o.createConstellation(linkName.trim(),linkIds);setLinkIds([]);setLinkName('')}}>connect these moments</button></div><Sky data={o.data} onCreate={o.createConstellation} onUpdate={o.updateConstellation} onDelete={o.deleteConstellation} onOpenDay={d=>{setDate(d);setPanel(null)}} onRecall={o.recallOrbital}/></>}
  </section></div>}
  {voidOpen&&<VoidExplorer data={o.data} date={date} onClose={()=>setVoidOpen(false)} onOpen={setDate} onUpdate={o.updateEntry} onRecall={o.recallOrbital}/>}
  {evol&&<Evol data={o.data} target={evol} onClose={()=>setEvol(null)} onImport={o.importArchive} onApplyPlan={items=>{for(const item of items){const existing=entries.find(e=>e.text.toLowerCase()===item.text.toLowerCase());if(item.op==='remove'){if(existing)o.deleteEntry(existing.id)}else if(existing)o.updateEntry(existing.id,{done:item.op==='complete'});else o.addEntries(date,[item.text],undefined,item.op==='complete')}}}/>}
 </div>
}
