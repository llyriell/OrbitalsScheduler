import type { ViewRequest } from './navigation';
import {orderedDay,escapeAction} from './celestial';
import type {Constellation,Entry} from './types';
import { TransmissionBox } from './TransmissionBox';
import { GatheringRail } from './GatheringRail';
import { Fold } from './Fold';
import { CommandLine } from './CommandLine';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Plus, X, Wind, Download, Sparkles } from 'lucide-react';
import { useOrbitals, todayISO, addDaysISO } from './store';
import { SkyJournal } from './SkyJournal';
import { FutureEvents } from './FutureEvents';
import { EyeControls } from './EyeControls';
import { upcomingOn, rhythmLabel } from './schedule';
import { Recurring } from './Recurring';
import { ToBuy } from './ToBuy';
import { ConstellationBrowser } from './ConstellationBrowser';
import { Evol, type EvolTarget } from './Evol';
import { Iris } from './Iris';
import './iris.css';
import './transmission.css';

type Panel = 'returning' | 'gathering' | 'constellations' | 'events' | null;
export default function App() {
 const o = useOrbitals();
 const [date,setDate]=useState(todayISO);
 const [panel,setPanel]=useState<Panel>(null);
 const [viewRequest,setViewRequest]=useState<ViewRequest>({kind:'season',date:todayISO(),nonce:0});
 const [eyeOverview,setEyeOverview]=useState(false);
 const focusDay=(d:string)=>{setDate(d);setLensYear(Number(d.slice(0,4)));setEyeOverview(false);closeNode();setViewRequest(r=>({kind:'day',date:d,nonce:r.nonce+1}))};
 const focusEntry=(e:Entry)=>{setEyeOverview(false);setViewRequest(r=>({kind:'entry',entryId:e.id,date:e.date,nonce:r.nonce+1}))};
 const [draft,setDraft]=useState('');
 const [selected,setSelected]=useState<string|null>(null);
 const [hovered,setHovered]=useState<string|null>(null);
 const hoverTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const clearHover=()=>{if(hoverTimer.current)clearTimeout(hoverTimer.current)};
 const previewNode=(id:string|null)=>{clearHover();if(selected)return;if(id)setHovered(id);else hoverTimer.current=setTimeout(()=>setHovered(null),500)};
 const pinNode=(id:string)=>{clearHover();setHovered(null);setSelected(id);const entry=o.data.entries.find(e=>e.id===id);if(entry)focusEntry(entry)};
 const closeNode=()=>{clearHover();setHovered(null);setSelected(null)};
 const [dragId,setDragId]=useState<string|null>(null);
 const [dragOver,setDragOver]=useState<string|null>(null);
 useEffect(()=>()=>{if(hoverTimer.current)clearTimeout(hoverTimer.current)},[]);
 const [evol,setEvol]=useState<EvolTarget|null>(null);
 const [study,setStudy]=useState(false);
 const [voidOpen,setVoidOpen]=useState(false);
 const [connecting,setConnecting]=useState(false);
 const [connectCleared,setConnectCleared]=useState(false);
 const [editingConstellation,setEditingConstellation]=useState<string|null>(null);
 const [yearOpen,setYearOpen]=useState(false);
 const [dissolving,setDissolving]=useState<{id:string;text:string;x:number;y:number}|null>(null);
 const [journalDragId,setJournalDragId]=useState<string|null>(null);
 const [aligned,setAligned]=useState(false);
 useEffect(()=>{const undo=(event:KeyboardEvent)=>{if(!(event.ctrlKey||event.metaKey)||event.altKey||event.shiftKey||event.key.toLowerCase()!=='z')return;const target=event.target as HTMLElement;if(target.closest('input,textarea,select,[contenteditable=true],[role=textbox]'))return;if(o.canUndoDiscard){event.preventDefault();o.undoDiscard()}};window.addEventListener('keydown',undo);return()=>window.removeEventListener('keydown',undo)},[o.canUndoDiscard,o.undoDiscard]);
 useEffect(()=>{if(!dissolving)return;const timer=setTimeout(()=>setDissolving(null),1200);return()=>clearTimeout(timer)},[dissolving]);
 const [lens,setLens]=useState('all');
 const [lensYear,setLensYear]=useState(new Date().getFullYear());
 const [constellationId,setConstellationId]=useState<string|null>(null);
 const browseConstellations=(id?:string)=>{closeNode();setConstellationId(id??null);setPanel('constellations')};
 const beginConnect=(c?:Constellation)=>{setPanel(null);setVoidOpen(true);setConnecting(true);setConnectCleared(false);setEyeOverview(false);setEditingConstellation(c?.id??null);setLinkName(c?.name??'');setLinkIds(c?.entryIds??[]);closeNode()};
 const enterEye=()=>{closeNode();setVoidOpen(true);setEyeOverview(true);setViewRequest(r=>({kind:'reset',nonce:r.nonce+1}))};
 const selectStar=(id:string)=>{if(connecting&&voidOpen){setConnectCleared(false);setLinkIds(ids=>ids.includes(id)?ids.filter(v=>v!==id):[...ids,id])}else pinNode(id)};
 const recordFilter=voidOpen&&lens!=='all'?{year:lensYear,season:({winter:0,spring:1,summer:2,autumn:3} as Record<string,number>)[lens]}:undefined;
 const tomorrow=addDaysISO(date,1);
 const upcoming=upcomingOn(o.data,tomorrow);
 const [linkName,setLinkName]=useState('');
 const [linkIds,setLinkIds]=useState<string[]>([]);
 useEffect(()=>{o.materializeRecurring(date)},[date,o.materializeRecurring,o.data.series]);
 const entries=orderedDay(o.data.entries,date);
 const chosen=o.data.entries.find(e=>e.id===(selected??hovered));
 const format=new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'});
 const add=()=>{if(draft.trim()){o.addEntries(date,draft.split(/\r?\n/));setDraft('');focusDay(date)}};
 const toggleTask=(entry:Entry)=>{o.updateEntry(entry.id,{done:!entry.done,order:entry.done?-1:Math.max(0,...entries.map(e=>e.order))+1});focusEntry(entry)};
 const saveConstellation=()=>{if(!linkName.trim())return;if(editingConstellation)o.updateConstellation(editingConstellation,{name:linkName.trim(),entryIds:linkIds});else o.createConstellation(linkName.trim(),linkIds);setEditingConstellation(null);setLinkIds([]);setLinkName('');setConnectCleared(false)};
 const escape=()=>{if(panel){setPanel(null);return}if(selected){closeNode();return}const action=escapeAction(connecting,connectCleared,voidOpen,eyeOverview);if(action==='clear-connect'){setLinkIds([]);setLinkName('');setConnectCleared(true);return}if(action==='leave-connect'){setConnecting(false);setEditingConstellation(null);setLinkIds([]);setLinkName('');return}if(action==='overview'){setViewRequest(r=>({kind:'reset',nonce:r.nonce+1}));setEyeOverview(true);return}setDate(todayISO());setLensYear(new Date().getFullYear());setYearOpen(false);setPanel(null);setVoidOpen(false);setConnecting(false);setLens('all');setStudy(false);setAligned(false);closeNode();setViewRequest(r=>({kind:'season',date:todayISO(),nonce:r.nonce+1}))};
 const notebookRef=useRef<HTMLElement>(null);const dayWheel=useRef((direction:number)=>{});dayWheel.current=direction=>focusDay(addDaysISO(date,direction));
 useEffect(()=>{const host=notebookRef.current;if(!host)return;let delta=0;let last=0;const wheel=(e:WheelEvent)=>{if((e.target as HTMLElement).closest('input,textarea,select'))return;e.preventDefault();delta+=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*(e.deltaMode===1?16:1);if(Math.abs(delta)>=55&&performance.now()-last>260){dayWheel.current(delta>0?1:-1);last=performance.now();delta=0}};host.addEventListener('wheel',wheel,{passive:false});return()=>host.removeEventListener('wheel',wheel)},[]);
 useEffect(()=>{const command=document.querySelector('.command-console>form');const sky=document.querySelector('.sky-transmission');const measure=()=>{if(command)document.documentElement.style.setProperty('--command-edge',command.getBoundingClientRect().bottom+'px');if(sky)document.documentElement.style.setProperty('--weather-edge',sky.getBoundingClientRect().top+'px')};const resize=new ResizeObserver(measure);if(command)resize.observe(command);if(sky)resize.observe(sky);window.addEventListener('resize',measure);measure();return()=>{resize.disconnect();window.removeEventListener('resize',measure)}},[]);
 const titleRef=useRef<HTMLInputElement>(null);useEffect(()=>{if(selected){const raf=requestAnimationFrame(()=>{titleRef.current?.focus();const length=titleRef.current?.value.length??0;titleRef.current?.setSelectionRange(length,length)});return()=>cancelAnimationFrame(raf)}},[selected]);
 const years=Array.from({length:Math.max(new Date().getFullYear(),...o.data.entries.map(e=>Number(e.date?.slice(0,4))||2000))-1999},(_,i)=>2000+i).reverse();
 const showYear=(year:number)=>{setLensYear(year);setEyeOverview(false);setViewRequest(r=>({kind:'year',year,nonce:r.nonce+1}))};
 const exportData=()=>{const blob=new Blob([JSON.stringify({schema:'orbitals.archive',version:1,exportedAt:new Date().toISOString(),...o.data},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='orbitals-archive.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 return <div className={'iris-app transmission-layout '+(voidOpen?'eye-mode':'')}>
  <CommandLine entries={o.data.entries} onAddOrbit={text=>{const id=o.addOrbit(text);if(id)setViewRequest(r=>({kind:'entry',entryId:id,nonce:r.nonce+1}))}} onAddToday={t=>{o.addEntries(todayISO(),[t]);focusDay(todayISO())}} onGather={t=>o.addBuyItem(t)} onGo={focusDay} onEye={enterEye} onConnect={()=>beginConnect()} onConstellation={()=>{setVoidOpen(true);browseConstellations()}} onHorizon={()=>setPanel('events')} onReturning={()=>setPanel('returning')} onBloodMoon={()=>o.bloodMoon(date)} onStatic={()=>setAligned(true)} onEscape={escape} onSelect={id=>{pinNode(id);const e=o.data.entries.find(v=>v.id===id);if(e&&!e.orbiting)setDate(e.date)}}/>
  <aside className="notebook" ref={notebookRef}>
   <header className="wordmark">orbitals<span>a life, unfolding</span></header>
   <div className="date-line"><button aria-label="Previous day" onClick={()=>focusDay(addDaysISO(date,-1))}><ArrowLeft size={15}/></button><label>{format}<input aria-label="Choose day" type="date" value={date} onChange={e=>e.target.value&&focusDay(e.target.value)}/></label><button aria-label="Next day" onClick={()=>focusDay(addDaysISO(date,1))}><ArrowRight size={15}/></button></div>
   {date!==todayISO()&&<button className="text-link" onClick={()=>setDate(todayISO())}>return</button>}
   <section className="within"><h1>The everlasting present <span/></h1>
    <ul className="daily-list" onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const id=dragId??event.dataTransfer.getData('text/plain');if(id)o.reorderEntry(date,id,null);setDragId(null);setDragOver(null)}}>{entries.map(e=><li key={e.id} draggable onKeyDown={event=>{if(event.altKey&&(event.key==='ArrowUp'||event.key==='ArrowDown')){event.preventDefault();const idx=entries.findIndex(v=>v.id===e.id);if(event.key==='ArrowUp'&&idx>0)o.reorderEntry(date,e.id,entries[idx-1].id);if(event.key==='ArrowDown'&&idx<entries.length-1)o.reorderEntry(date,e.id,entries[idx+2]?.id??null)}}} onDragStart={event=>{setDragId(e.id);event.dataTransfer.setData('text/plain',e.id);event.dataTransfer.effectAllowed='move'}} onDragOver={event=>{event.preventDefault();setDragOver(e.id)}} onDrop={event=>{event.preventDefault();event.stopPropagation();const id=dragId??event.dataTransfer.getData('text/plain');if(id&&id!==e.id)o.reorderEntry(date,id,e.id);setDragId(null);setDragOver(null)}} onDragEnd={()=>{setDragId(null);setDragOver(null)}} className={(e.done?'fulfilled ':'')+(dragOver===e.id&&dragId!==e.id?'drop-before ':'')+(dragId===e.id?'is-dragging':'')}><span className="task-grip" aria-hidden="true">⠿</span><button className="task-light" aria-label={(e.done?'Reopen ':'Complete ')+e.text} aria-pressed={e.done} onClick={()=>toggleTask(e)}/><button className={selected===e.id?'entry-title active':'entry-title'} onClick={()=>toggleTask(e)}>{e.text}{e.kind==='event'&&<small className="event-tag">{e.time??'event'}</small>}</button></li>)}</ul>
    {!entries.length&&<p className="empty-note">A little space for what calls to you today.</p>}
    <form className="add-line" onSubmit={e=>{e.preventDefault();add()}}><textarea aria-label="New orbitals" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="add to this moment…" rows={2} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();add()}}}/><button aria-label="Add orbitals" disabled={!draft.trim()}><Plus size={17}/></button></form>
   </section>
   <Fold title="within reach" count={upcoming.length} action={<button aria-label="Schedule a future event" onClick={()=>setPanel('events')}><Plus size={13}/></button>}><small className="tomorrow-label">tomorrow · {new Date(tomorrow+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</small>{upcoming.slice(0,4).map(e=><button className="side-item" key={e.id} onClick={()=>{setDate(tomorrow);if(!e.virtual)setSelected(e.id)}}><span className="small-orbit"/>{e.text}</button>)}{!upcoming.length&&<p className="empty-note">An open tomorrow.</p>}<button className="text-link" onClick={()=>setPanel('events')}>place something on the horizon ↗</button><button className="text-link" onClick={()=>setDate(tomorrow)}>visit tomorrow ↗</button></Fold>
   <Fold title="returning" count={o.data.series.length} action={<button aria-label="Manage recurring tasks" onClick={()=>setPanel('returning')}><Plus size={13}/></button>}>{o.data.series.slice(0,3).map(s=><button className="side-item" key={s.id} onClick={()=>setPanel('returning')}><span className="small-orbit"/>{s.title}<small>{s.paused?'resting':rhythmLabel(s)}</small></button>)}<button className="text-link" onClick={()=>setPanel('returning')}>{o.data.series.length?'all rhythms ↗':'give something a rhythm ↗'}</button></Fold>
   <footer className="notebook-footer"><button onClick={()=>setEvol({kind:'day',date})}><Sparkles size={13}/> with Evol</button><button aria-label="Download your archive" onClick={exportData}><Download size={14}/></button></footer>
  </aside>
  <main className="sky-room" onDragOver={event=>{if(dragId||journalDragId)event.preventDefault()}} onDrop={event=>{if(!dragId&&!journalDragId)return;event.preventDefault();const entry=o.data.entries.find(e=>e.id===dragId);const journal=o.data.moodJournal.find(m=>m.id===journalDragId);if(journal){setDissolving({id:journal.id,text:(journal.text??journal.icon).slice(0,80),x:event.clientX,y:event.clientY});o.deleteMoodLog(journal.id)}else if(entry){setDissolving({id:entry.id,text:entry.text.slice(0,80),x:event.clientX,y:event.clientY});o.deleteEntry(entry.id);closeNode()}setJournalDragId(null);setDragId(null);setDragOver(null)}}>
   {(dragId||journalDragId)&&<div className="void-drop-target" aria-label="Drop into the void">release into the void</div>}
   {dissolving&&<div className="void-dissolve" style={{left:dissolving.x,top:dissolving.y}} onAnimationEnd={event=>{if(event.target===event.currentTarget)setDissolving(null)}}>{dissolving.text.split('').map((letter,i)=><span key={i} style={{'--i':i,'--dx':((i*37)%160-80)+'px','--dy':((i*53)%150-75)+'px'} as CSSProperties}>{letter}</span>)}</div>}

   <div className="sky-top"><span className="sky-subject"><div className="year-picker"><button aria-label="Choose a year ring" aria-expanded={yearOpen} onClick={()=>setYearOpen(!yearOpen)}>{lensYear}</button>{yearOpen&&<div className="year-options" onPointerLeave={()=>setYearOpen(false)}>{years.map(y=><button key={y} onPointerEnter={()=>showYear(y)} onClick={()=>{showYear(y);setYearOpen(false)}}>{y}</button>)}</div>}</div><i>·</i><button onClick={()=>setStudy(!study)}>{study?'a possible sky':'your unfolding sky'}</button></span><div className="sky-top-actions"><button className="static-toggle" aria-pressed={aligned} title={aligned?'Let the mini orbitals drift when zoomed out':'Align and hold the mini orbitals'} onClick={()=>setAligned(!aligned)}>{aligned?'Let orbit':'Return to static'}</button><button onClick={()=>{setVoidOpen(true);browseConstellations()}}>constellations ↗</button><button onClick={enterEye}>enter the eye ⤢</button></div></div>
   <Iris aligned={aligned} activeConstellationId={panel==='constellations'?constellationId:null} onSelectDay={focusDay} onCameraGesture={()=>setEyeOverview(false)} onConstellation={browseConstellations} data={o.data} date={date} selected={selected??hovered} onSelect={selectStar} onHover={connecting&&voidOpen?undefined:previewNode} recordFilter={recordFilter} connectedIds={connecting&&voidOpen?linkIds:[]} viewRequest={viewRequest} scale="years" study={study}/>

   {chosen&&!selected&&<div className="ghost-task-preview" aria-hidden="true"><small>{chosen.orbiting?'in orbit':chosen.date} · click star to hold</small><strong>{chosen.text}</strong>{chosen.note&&<p>{chosen.note}</p>}</div>}
   {chosen&&selected&&<TransmissionBox key={chosen.id} className="task-transmission" label="Selected orbital" onEnter={clearHover} onLeave={closeNode}><button className="detail-close" aria-label="Close orbital" onClick={closeNode}><X size={16}/></button><small>{chosen.orbiting?'undated · in orbit':chosen.date} · {chosen.done?'fulfilled':'unfolding'}</small><input ref={titleRef} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();closeNode()}}} aria-label="Orbital title" value={chosen.text} onChange={e=>o.updateEntry(chosen.id,{text:e.target.value})}/><textarea onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();closeNode()}}} aria-label="Orbital note" placeholder="leave a little trace…" value={chosen.note??''} onChange={e=>o.updateEntry(chosen.id,{note:e.target.value})}/><div className="detail-actions"><button onClick={()=>toggleTask(chosen)}>{chosen.done?'reopen':'mark fulfilled'}</button>{chosen.orbiting?<button onClick={()=>o.recallOrbital(chosen.id,date)}>bring into today</button>:<button onClick={()=>o.letOrbit(chosen.id)}><Wind size={13}/> let orbit</button>}</div><label className="move-date">return on <input aria-label="Move orbital to date" type="date" value={chosen.orbiting?'':chosen.date??''} onChange={e=>{if(e.target.value){if(chosen.orbiting)o.recallOrbital(chosen.id,e.target.value);else o.moveEntry(chosen.id,e.target.value)}}}/></label></TransmissionBox>}

  </main>
  <GatheringRail items={o.data.buyItems} records={o.data.financialRecords} onAdd={o.addBuyItem} onUpdate={o.updateBuyItem} onDelete={o.deleteBuyItem} onRecord={o.addFinancialRecord}/>
  <SkyJournal logs={o.data.moodJournal} onAdd={o.addMood} draggingId={journalDragId} onDelete={o.deleteMoodLog} onDragStart={setJournalDragId} onDragEnd={()=>setJournalDragId(null)}/>
  {panel&&panel!=='events'&&panel!=='constellations'&&panel!=='returning'&&<div className="drawer-shade" onClick={()=>setPanel(null)}><section className="planner-drawer" role="dialog" aria-modal="true" aria-label={panel} onClick={e=>e.stopPropagation()} onKeyDown={e=>e.key==='Escape'&&setPanel(null)}><button autoFocus className="drawer-close" aria-label="Close panel" onClick={()=>setPanel(null)}><X size={20}/></button>
  

  {panel==='gathering'&&<ToBuy items={o.data.buyItems} onAdd={o.addBuyItem} onUpdate={o.updateBuyItem} onDelete={o.deleteBuyItem}/>}

  </section></div>}
  {panel==='returning'&&<><div className="returning-backdrop" onClick={()=>setPanel(null)}/><TransmissionBox className="returning-transmission feature-transmission" label="Returning rhythms"><button className="detail-close" aria-label="Close returning" onClick={()=>setPanel(null)}>×</button><Recurring series={o.data.series} entries={o.data.entries} onAdd={o.addSeries} onUpdate={o.updateSeries} onDelete={o.deleteSeries}/></TransmissionBox></>}
  {panel==='constellations'&&<ConstellationBrowser key={constellationId??'all'} initialId={constellationId} onActiveChange={setConstellationId} lens={lens} year={lensYear} onLens={setLens} onYear={setLensYear} onUpdate={o.updateConstellation} onDelete={o.deleteConstellation} onDraw={beginConnect} data={o.data} onClose={()=>setPanel(null)} onOpenDay={d=>{focusDay(d);setPanel(null)}} onSelect={id=>{pinNode(id);setPanel(null)}}/>}
  {panel==='events'&&<TransmissionBox className="event-transmission feature-transmission" label="A place in the future"><button className="detail-close" aria-label="Close future event" onClick={()=>setPanel(null)}><X size={16}/></button><FutureEvents entries={o.data.entries} onAdd={(d,text,time,note)=>{o.addEvent(d,text,time,note);focusDay(d)}} onOpen={d=>{focusDay(d);setPanel(null)}} onUpdate={o.updateEntry}/></TransmissionBox>}
  {voidOpen&&<EyeControls aligned={aligned} onStatic={()=>setAligned(!aligned)} onBrowse={()=>browseConstellations()} connecting={connecting} onConnect={()=>connecting?setConnecting(false):beginConnect()} onExit={()=>{setVoidOpen(false);setConnecting(false);setLens('all');setViewRequest(r=>({kind:'season',date,nonce:r.nonce+1}))}} lens={lens} onLens={setLens} year={lensYear} onYear={setLensYear} ids={linkIds} name={linkName} onName={name=>{setLinkName(name);setConnectCleared(false)}} onSave={saveConstellation} onClear={()=>{setLinkIds([]);setLinkName('');setConnectCleared(true)}}/>}

  {evol&&<Evol data={o.data} target={evol} onClose={()=>setEvol(null)} onImport={o.importArchive} onApplyPlan={items=>{for(const item of items){const existing=entries.find(e=>e.text.toLowerCase()===item.text.toLowerCase());if(item.op==='remove'){if(existing)o.deleteEntry(existing.id)}else if(existing)o.updateEntry(existing.id,{done:item.op==='complete'});else o.addEntries(date,[item.text],undefined,item.op==='complete')}}}/>}
 </div>
}
