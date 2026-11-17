import { EyeAtmosphere } from './EyeAtmosphere';
import { useMemo,useRef,useEffect,useState } from 'react';
import { spiralPoint,zoomAt,ORIGIN_YEAR,focusCamera,type ViewRequest,matchesLens } from './navigation';
import type { AppData } from './types';

const TAU=Math.PI*2;
function hash(s:string){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return (h>>>0)/4294967295}
export function orbitalPoint(date:string,_firstYear:number,offset=0){return spiralPoint(date,offset)}
export function Iris({data,date,selected,onSelect,onHover,onViewChange,viewRequest,recordFilter,connectedIds=[],scale,study}:{data:AppData;date:string;selected:string|null;onSelect:(id:string)=>void;onHover?:(id:string|null)=>void;onViewChange?:(view:{zoom:number;x:number;y:number})=>void;recordFilter?:{year?:number;season?:number};connectedIds?:string[];viewRequest?:ViewRequest;scale:'today'|'season'|'years';study:boolean}){
 const year=Number(date.slice(0,4));
 const dates=[...data.entries.map(e=>e.date??new Date(e.createdAt).toISOString().slice(0,10)),...data.traces.map(t=>t.fromDate)].filter(Boolean);
 const first=ORIGIN_YEAR;
 const last=Math.max(year,...dates.map(d=>Number(d.slice(0,4))));
 const years=last-first+1;
 const field=useRef<HTMLDivElement>(null);
 const [camera,setCamera]=useState({k:1,x:0,y:0});
 const [pixelScale,setPixelScale]=useState(1);
 const pan=useRef<{px:number;py:number;x:number;y:number}|null>(null);
 useEffect(()=>{const host=field.current;if(!host)return;const measure=()=>{const svg=host.querySelector('svg');if(svg){const r=svg.getBoundingClientRect();setPixelScale(Math.min(r.width,r.height)/900)}};const resize=new ResizeObserver(measure);resize.observe(host);measure();return()=>resize.disconnect()},[]);
 const [orbitAngle,setOrbitAngle]=useState(0);
 const [orbitPaused,setOrbitPaused]=useState(false);
 useEffect(()=>{const host=field.current;if(!host)return;const wheel=(e:WheelEvent)=>{e.preventDefault();const svg=host.querySelector('svg');if(!svg)return;const rect=svg.getBoundingClientRect();const ratio=Math.min(rect.width,rect.height)/900;if(!Number.isFinite(ratio)||ratio<=0)return;const p={x:(e.clientX-rect.left-rect.width/2)/ratio,y:(e.clientY-rect.top-rect.height/2)/ratio};const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?600:1);setCamera(c=>zoomAt(c,delta,p));window.dispatchEvent(new CustomEvent('orbitals:navigate',{detail:{delta}}))};host.addEventListener('wheel',wheel,{passive:false});return()=>host.removeEventListener('wheel',wheel)},[]);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');let raf=0;let last=performance.now();let angle=0;let paint=0;const tick=(now:number)=>{const dt=Math.min(.05,(now-last)/1000);last=now;if(!media.matches&&!orbitPaused){angle+=dt*Math.PI*2/180;if(now-paint>45){setOrbitAngle(a=>a+angle);angle=0;paint=now}}raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[orbitPaused]);
 const geometry=useMemo(()=>{
  const paths:string[]=[]; const stars:{x:number;y:number;r:number}[]=[];
  const count=study?340:180;
  for(let i=0;i<count;i++){
   const a=i/count*TAU-Math.PI/2;const seed=hash('branch'+i);
   const start=study?94:100;const end=study?200+seed*125:135+seed*100;
   const points=[{x:450+Math.cos(a)*start,y:450+Math.sin(a)*start}];
   for(let j=1;j<=5;j++){const r=start+(end-start)*j/5;const aa=a+Math.sin(seed*21+j)*.018*j;points.push({x:450+Math.cos(aa)*r,y:450+Math.sin(aa)*r})}
   paths.push('M'+points.map(p=>p.x.toFixed(2)+','+p.y.toFixed(2)).join(' L'));
   if(study){const p=points[5];stars.push({...p,r:.7+seed});for(let k=0;k<3;k++){const p=points[2+k];const aa=a+(k%2?1:-1)*(.025+seed*.07);const r=start+(end-start)*(k+3)/5;const q={x:450+Math.cos(aa)*r,y:450+Math.sin(aa)*r};paths.push('M'+p.x+','+p.y+' Q'+(p.x+q.x)/2+','+p.y+' '+q.x+','+q.y);stars.push({...q,r:.55})}}
  }return {paths,stars}
 },[study]);
 const maxRadius=(years+1)*46;
 const baseZoom=Math.min(1,330/maxRadius)*(scale==='season'?1.2:1);
 const zoom=baseZoom*camera.k;
 useEffect(()=>{if(!viewRequest)return;if(viewRequest.kind==='reset'){pan.current=null;setCamera({k:1,x:0,y:0});return}if(viewRequest.date)setCamera(focusCamera(viewRequest.date,baseZoom,data.entries.filter(e=>!e.orbiting&&e.date===viewRequest.date).length))},[viewRequest]);
 useEffect(()=>{onViewChange?.({zoom,x:camera.x,y:camera.y})},[zoom,camera.x,camera.y,onViewChange]);
 const nodes=data.entries.filter(e=>!recordFilter||matchesLens(e.date,recordFilter.year,recordFilter.season)).map(e=>{const d=e.date??new Date(e.createdAt).toISOString().slice(0,10);if(e.orbiting){const a=hash(e.id)*TAU+orbitAngle;const r=Math.max(335,maxRadius+45)+hash(e.id+'outer')*30;return {x:450+Math.cos(a)*r,y:450+Math.sin(a)*r,a,r,entry:e}}const siblings=data.entries.filter(v=>!v.orbiting&&v.date===e.date);const slot=siblings.findIndex(v=>v.id===e.id);return {...orbitalPoint(d,first,12+slot*18+hash(e.id)*7),entry:e}});
 const byId=new Map(nodes.map(n=>[n.entry.id,n]));
 const active=nodes.find(n=>n.entry.id===selected);
 let spiral='';for(let t=0;t<=years;t+=.008){const a=t*TAU-Math.PI/2;const r=t*46;spiral+=(t===0?'M':'L')+(450+Math.cos(a)*r).toFixed(2)+','+(450+Math.sin(a)*r).toFixed(2)}
 return <div className="iris-field" ref={field} onContextMenu={e=>e.preventDefault()} onPointerDown={e=>{if(e.button!==2)return;e.preventDefault();pan.current={px:e.clientX,py:e.clientY,x:camera.x,y:camera.y};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const anchor=pan.current;if(!anchor||pixelScale<=0)return;const x=anchor.x+(e.clientX-anchor.px)/pixelScale;const y=anchor.y+(e.clientY-anchor.py)/pixelScale;setCamera(c=>({...c,x,y}))}} onPointerUp={e=>{if(pan.current){pan.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}}} onPointerCancel={()=>{pan.current=null}}><div className="camera-atmosphere" style={{transform:'translate('+camera.x*pixelScale+'px,'+camera.y*pixelScale+'px)'}}><EyeAtmosphere zoomLevel={camera.k}/></div><svg viewBox="0 0 900 900" role="group" aria-label="Your orbital sky: each full turn represents a year">
  <defs><filter id="node-glow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="3"/></filter><radialGradient id="halo"><stop offset="0" stopColor="#ddc596" stopOpacity=".055"/><stop offset="1" stopColor="#ddc596" stopOpacity="0"/></radialGradient></defs>
  <circle cx="450" cy="450" r="415" fill="url(#halo)"/>
   <g transform={'translate('+camera.x+' '+camera.y+')'} className={study?'guide-threads study':'guide-threads'}>{geometry.paths.map((d,i)=><path d={d} key={i}/>)}{geometry.stars.map((s,i)=><circle key={'s'+i} cx={s.x} cy={s.y} r={s.r} fill="#eadfc9" stroke="none"/>)}</g>
  <g transform={'translate('+camera.x+' '+camera.y+') translate(450 450) scale('+zoom+') translate(-450 -450)'}>
   <path d={spiral} className="year-spiral"/>
   {Array.from({length:years+1},(_,i)=><g key={i}><circle cx="450" cy={450-i*46} r="2" fill="#a48e63"/><text x="462" y={454-i*46} className="year-label" style={{fontSize:i===0?30:21}}>{first+i}</text></g>)}
   {data.traces.map(t=>{const target=byId.get(t.entryId);if(!target||!t.fromDate)return null;const p=orbitalPoint(t.fromDate,first,hash(t.entryId)*25);return <path className="trace-thread" key={t.id} d={'M'+p.x+','+p.y+' Q450,450 '+target.x+','+target.y}/>})}
   {data.constellations.map(c=>{const ns=c.entryIds.map(id=>byId.get(id)).filter((n):n is NonNullable<typeof n>=>Boolean(n));return <g key={c.id} className="constellation-threads">{ns.slice(1).map((n,i)=><path key={n.entry.id} d={'M'+ns[i].x+','+ns[i].y+' Q'+((ns[i].x+n.x)/2+25)+','+((ns[i].y+n.y)/2-35)+' '+n.x+','+n.y}/>)}{ns[0]&&<text x={ns[0].x+12} y={ns[0].y-15}>{c.name}</text>}</g>})}
   {connectedIds.length>1&&<path className="connection-draft" d={connectedIds.map(id=>byId.get(id)).filter(Boolean).map((n,i)=>(i?'L':'M')+n!.x+','+n!.y).join(' ')}/>}
   {nodes.map(n=>{const lit=n.entry.done;const root=orbitalPoint(n.entry.date??new Date(n.entry.createdAt).toISOString().slice(0,10),first);return <g key={n.entry.id} className={'orbital-node '+(lit?'lit':'unfinished')+(selected===n.entry.id?' attended':'')+(connectedIds.includes(n.entry.id)?' connecting':'')}><path className={n.entry.orbiting?"loose-thread":"entry-thread"} d={'M'+root.x+','+root.y+' Q'+(n.x+15)+','+(n.y-30)+' '+n.x+','+n.y}/><g role="button" tabIndex={0} aria-label={n.entry.text+(n.entry.done?', fulfilled':'')} onPointerEnter={e=>{if(e.pointerType!=='touch'){if(n.entry.orbiting)setOrbitPaused(true);onHover?.(n.entry.id)}}} onPointerLeave={()=>{setOrbitPaused(false);onHover?.(null)}} onFocus={()=>onHover?.(n.entry.id)} onBlur={()=>onHover?.(null)} onClick={()=>onSelect(n.entry.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(n.entry.id)}}}><title>{n.entry.text}</title><circle cx={n.x} cy={n.y} r="13" fill="transparent"/><circle cx={n.x} cy={n.y} r={lit?6:3} className="node-halo" filter="url(#node-glow)"/><circle cx={n.x} cy={n.y} r={lit?3.2:2} className="node-core"/>{(n.entry.orbiting||selected===n.entry.id)&&<text x={n.x+(n.x>650?-14:14)} textAnchor={n.x>650?"end":"start"} y={n.y+4} className="node-label">{(n.entry.orbiting?'◌ ':'')+(n.entry.text.length>30?n.entry.text.slice(0,29)+'…':n.entry.text)}</text>}</g></g>})}
   {!nodes.length&&!study&&<g className="iris-center"><text x="450" y="444" textAnchor="middle">{recordFilter?'a quiet season':'a beginning'}</text><text x="450" y="468" textAnchor="middle" className="center-small">{recordFilter?'no records in this lens':'your first thread starts today'}</text></g>}
   {study&&<g className="sample-labels"><text x="190" y="170">TenderMends</text><text x="700" y="260">garden</text><text x="715" y="590">a home</text><text x="180" y="710">making</text></g>}
   {active&&<circle cx={active.x} cy={active.y} r="10" fill="none" stroke="#d7b77b" strokeWidth=".6"/>}
  </g>
 </svg>{study&&<p className="study-disclosure">Illustrative threads · your own sky grows from your entries</p>}</div>
}
