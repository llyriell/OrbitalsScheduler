import { useRef,useState,type ReactNode } from 'react';
export function Fold({title,count,children,action}:{title:string;count?:number;children:ReactNode;action?:ReactNode}){
 const [hover,setHover]=useState(false);const [focused,setFocused]=useState(false);const [pinned,setPinned]=useState(false);const id=useRef('fold-'+title.replace(/\s/g,'-'));const open=hover||focused||pinned;
 return <section className={'planner-fold '+(open?'is-open':'')} onPointerEnter={e=>{if(e.pointerType!=='touch')setHover(true)}} onPointerLeave={()=>{setHover(false);setPinned(false)}} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)){setFocused(false);setPinned(false)}}}>
 <div className="fold-heading"><button aria-expanded={open} aria-controls={id.current} onClick={()=>setPinned(!pinned)}>{title}<small>{count??''}</small><span aria-hidden="true">{open?'−':'+'}</span></button>{action}</div>
 <div className="fold-reveal" id={id.current} ref={node=>{if(node)node.inert=!open}} aria-hidden={!open}><div className="fold-content">{children}</div></div></section>
}
