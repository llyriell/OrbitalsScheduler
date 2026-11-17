import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
export function TransmissionBox({children,className='',onEnter,onLeave,label}:{children:ReactNode;className?:string;onEnter?:()=>void;onLeave?:()=>void;label:string}){
 return createPortal(<section className={'transmission-box '+className} aria-label={label} ><div className="transmission-inner" onPointerEnter={onEnter} onPointerLeave={onLeave} onFocusCapture={onEnter} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))onLeave?.()}}><div className="crt-corners" aria-hidden="true"><i/><i/><i/><i/></div><div className="crt-sweep" aria-hidden="true"/>{children}</div></section>,document.body)
}
