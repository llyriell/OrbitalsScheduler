export const ORIGIN_YEAR=2000;
export function spiralPoint(date:string,offset=0){const d=new Date(date+'T00:00:00Z');const y=d.getUTCFullYear();const f=(d.getTime()-Date.UTC(y,0,1))/(Date.UTC(y+1,0,1)-Date.UTC(y,0,1));const turn=y-ORIGIN_YEAR+f;const a=f*Math.PI*2-Math.PI/2;const r=Math.max(0,turn*46)+offset;return {x:450+Math.cos(a)*r,y:450+Math.sin(a)*r,a,r}}
export function zoomAt(camera:{k:number;x:number;y:number},delta:number,p:{x:number;y:number}){const k=Math.max(.25,Math.min(24,camera.k*Math.exp(-delta*.0015)));const ratio=k/camera.k;return {k,x:p.x-(p.x-camera.x)*ratio,y:p.y-(p.y-camera.y)*ratio}}
export function shouldCaptureTyping(e:{key:string;ctrlKey:boolean;metaKey:boolean;altKey:boolean;isComposing:boolean},editing:boolean){return !editing&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.isComposing&&e.key.length===1}

export type ViewRequest={kind:'reset'|'day';date?:string;nonce:number};
export function focusCamera(date:string,baseZoom:number,count=1){const p=spiralPoint(date,12+Math.max(0,count-1)*9);const k=Math.min(24,2.2/baseZoom);const zoom=baseZoom*k;return {k,x:-(p.x-450)*zoom,y:-(p.y-450)*zoom}}
