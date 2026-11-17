import { useEffect,useRef } from 'react';
// Adapted from evolresearch/station.js: counter-rotating rings and a double heartbeat.
export function EyeAtmosphere({zoomLevel=1}:{zoomLevel?:number}){
 const zoomRef=useRef(zoomLevel);zoomRef.current=zoomLevel;
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
 const host=ref.current;if(!host)return;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let raf=0;let last=performance.now();let angle=0;let speed=0;let glow=0;let navigation=0;
 const rings=[{direction:1,factor:.3,opacity:.08},{direction:-1,factor:.45,opacity:.25},{direction:1,factor:.65,opacity:.48},{direction:-1,factor:1.3,opacity:.8}];
 const layers=Array.from(host.querySelectorAll<HTMLImageElement>('.evol-eye-layer'));
 const background=host.querySelector<HTMLElement>('.evol-iris-background');
 const navigate=(event:Event)=>{const delta=(event as CustomEvent<{delta:number}>).detail.delta;navigation=Math.max(-3,Math.min(3,navigation-delta/180))};
 const tick=(now:number)=>{if(motion.matches)return;const dt=Math.min(.05,(now-last)/1000);last=now;navigation*=Math.exp(-dt*2.2);const boost=Math.min(1,Math.abs(navigation));speed+=(1.8+navigation*65-speed)*Math.min(1,dt*8);angle+=speed*dt;glow+=(boost*boost*(3-2*boost)-glow)*Math.min(1,dt*6);
 const phase=now%4200/4200;const beat=Math.max(Math.exp(-Math.pow((phase-.12)/.085,2)),Math.exp(-Math.pow((phase-.22)/.1,2)));
 if(background)background.style.opacity=String(.18+Math.min(.08,Math.max(0,Math.log2(zoomRef.current))*0.02)+beat*.065);
 layers.forEach((el,i)=>{const ring=rings[i];el.style.transform='translate(-50%,-50%) rotate('+ring.direction*angle*ring.factor+'deg)';el.style.opacity=String(Math.min(.9,ring.opacity*(1+1.1*glow)))});
 raf=requestAnimationFrame(tick)};
 const change=()=>{cancelAnimationFrame(raf);if(!motion.matches){last=performance.now();raf=requestAnimationFrame(tick)}};
 window.addEventListener('orbitals:navigate',navigate);motion.addEventListener('change',change);change();
 return()=>{cancelAnimationFrame(raf);window.removeEventListener('orbitals:navigate',navigate);motion.removeEventListener('change',change)}
 },[]);
 return <div className="evol-atmosphere" ref={ref} aria-hidden="true"><img className="evol-iris-background" src="/assets/evol-iris.png" alt=""/><div className="evol-eye-breathe">{[0,1,2,3].map(i=><img key={i} data-ring={i} className="evol-eye-layer" src="/assets/evol-eye.png" alt=""/>)}</div></div>
}
