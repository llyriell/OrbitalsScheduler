import { useEffect,useRef } from 'react';
// Adapted from evolresearch/station.js: counter-rotating rings and a double heartbeat.
export function EyeAtmosphere(){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
 const host=ref.current;if(!host)return;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let raf=0;let last=performance.now();let angle=0;let speed=360/26;let glow=0;let lastTouch=-10000;
 const rings=[{direction:1,factor:.3,opacity:.08},{direction:-1,factor:.45,opacity:.25},{direction:1,factor:.65,opacity:.48},{direction:-1,factor:1.3,opacity:.8}];
 const layers=Array.from(host.querySelectorAll<HTMLImageElement>('.evol-eye-layer'));
 const background=host.querySelector<HTMLElement>('.evol-iris-background');
 const touch=()=>{lastTouch=performance.now()};
 const tick=(now:number)=>{if(motion.matches)return;const dt=Math.min(.05,(now-last)/1000);last=now;const boost=Math.max(0,1-(now-lastTouch)/1400);speed+=((360/26+(360/9-360/26)*boost)-speed)*Math.min(1,dt*8);angle+=speed*dt;glow+=(boost*boost*(3-2*boost)-glow)*Math.min(1,dt*6);
 const phase=now%4200/4200;const beat=Math.max(Math.exp(-Math.pow((phase-.12)/.085,2)),Math.exp(-Math.pow((phase-.22)/.1,2)));
 if(background)background.style.opacity=String(.17+beat*.04);
 layers.forEach((el,i)=>{const ring=rings[i];el.style.transform='translate(-50%,-50%) rotate('+ring.direction*angle*ring.factor+'deg)';el.style.opacity=String(Math.min(.9,ring.opacity*(1+1.1*glow)))});
 raf=requestAnimationFrame(tick)};
 const change=()=>{cancelAnimationFrame(raf);if(!motion.matches){last=performance.now();raf=requestAnimationFrame(tick)}};
 window.addEventListener('pointermove',touch,{passive:true});window.addEventListener('wheel',touch,{passive:true});motion.addEventListener('change',change);change();
 return()=>{cancelAnimationFrame(raf);window.removeEventListener('pointermove',touch);window.removeEventListener('wheel',touch);motion.removeEventListener('change',change)}
 },[]);
 return <div className="evol-atmosphere" ref={ref} aria-hidden="true"><img className="evol-iris-background" src="/assets/evol-iris.png" alt=""/><div className="evol-eye-breathe">{[0,1,2,3].map(i=><img key={i} data-ring={i} className="evol-eye-layer" src="/assets/evol-eye.png" alt=""/>)}</div></div>
}
