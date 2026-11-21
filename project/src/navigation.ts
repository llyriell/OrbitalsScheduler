export const ORIGIN_YEAR=2000;
export function spiralPoint(date:string,offset=0){const d=new Date(date+'T00:00:00Z');const y=d.getUTCFullYear();const f=(d.getTime()-Date.UTC(y,0,1))/(Date.UTC(y+1,0,1)-Date.UTC(y,0,1));const turn=y-ORIGIN_YEAR+f;const a=f*Math.PI*2-Math.PI/2;const r=Math.max(0,turn*46)+offset;return {x:450+Math.cos(a)*r,y:450+Math.sin(a)*r,a,r}}
export function zoomAt(camera:{k:number;x:number;y:number},delta:number,p:{x:number;y:number}){if(!Number.isFinite(delta)||!Number.isFinite(p.x)||!Number.isFinite(p.y))return camera;const k=Math.max(.25,Math.min(24,camera.k*Math.exp(Math.max(-2,Math.min(2,-delta*.0015)))));const ratio=k/camera.k;return {k,x:p.x-(p.x-camera.x)*ratio,y:p.y-(p.y-camera.y)*ratio}}
export function visibleGathering(item:{bought:boolean;boughtAt?:number},today:string){if(!item.bought||!item.boughtAt)return true;const d=new Date(item.boughtAt);const day=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');return day>=today}
export function matchesLens(date:string,year?:number,season?:number){if(!date)return false;const [y,m]=date.split('-').map(Number);return (year===undefined||y===year)&&(season===undefined||Math.floor((m%12)/3)===season)}
export function shouldCaptureTyping(e:{key:string;ctrlKey:boolean;metaKey:boolean;altKey:boolean;isComposing:boolean},editing:boolean){return !editing&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.isComposing&&e.key.length===1}

export type ViewRequest={kind:'reset'|'day'|'season'|'year'|'entry';date?:string;year?:number;entryId?:string;nonce:number};
export function focusCamera(date:string,baseZoom:number,count=1){const p=spiralPoint(date,12+Math.max(0,count-1)*9);const k=Math.min(24,1.1/baseZoom);const zoom=baseZoom*k;return {k,x:-(p.x-450)*zoom,y:-(p.y-450)*zoom}}

export function seasonCamera(date:string,baseZoom:number){const [year,month]=date.split('-').map(Number);const midMonth=Math.floor((month-1)/3)*3+2;const p=spiralPoint(year+'-'+String(midMonth).padStart(2,'0')+'-15');const zoom=Math.min(.48,400/Math.max(350,p.r));const k=zoom/baseZoom;return {k,x:-(p.x-450)*zoom*.72,y:-(p.y-450)*zoom*.72}}
export function yearCamera(year:number,baseZoom:number){const r=Math.max(46,(year-ORIGIN_YEAR+1)*46);return {k:Math.min(3,320/r)/baseZoom,x:0,y:0}}
