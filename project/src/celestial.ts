import type {AppData,Entry} from './types';
export function orderedDay(entries:Entry[],date:string){return entries.filter(e=>!e.orbiting&&e.date===date).slice().sort((a,b)=>Number(a.done)-Number(b.done)||a.order-b.order||a.createdAt-b.createdAt)}
export function carryForward(data:AppData,today:string):AppData{
 const blocked=new Set(data.dismissedCarryRoots??[]);const groups=new Map<string,Entry[]>();
 for(const e of data.entries){if(e.orbiting||e.kind==='event'||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||e.date>today)continue;const root=e.carryRoot??e.id;if(blocked.has(root))continue;const chain=groups.get(root);if(chain)chain.push(e);else groups.set(root,[e])}
 const added:Entry[]=[];const ids=new Set(data.entries.map(e=>e.id));const orders=new Map<string,number>();for(const e of data.entries)orders.set(e.date,(orders.get(e.date)??0)+1);
 for(const [root,chain] of groups){chain.sort((a,b)=>a.date.localeCompare(b.date));const last=chain[chain.length-1];if(last.done||last.date>=today)continue;const cutoff=last.seriesId?data.entries.filter(e=>e.seriesId===last.seriesId&&!e.carryRoot&&e.id!==root&&e.date>chain[0].date).map(e=>e.date).sort()[0]:undefined;const dt=new Date(last.date+'T12:00:00Z');while(true){dt.setUTCDate(dt.getUTCDate()+1);const date=dt.toISOString().slice(0,10);if(date>today||(cutoff&&date>=cutoff))break;const id=root+'__carry_'+date;if(ids.has(id))continue;added.push({...last,id,date,carryRoot:root,done:false,order:orders.get(date)??0});ids.add(id);orders.set(date,(orders.get(date)??0)+1)}}
 return added.length?{...data,entries:[...data.entries,...added]}:data;
}
export function seedConstellations(data:AppData):AppData{if(data.starterConstellationsAdded)return data;const names=['Garden','Home','Evol'];return {...data,starterConstellationsAdded:true,constellations:[...data.constellations,...names.filter(name=>!data.constellations.some(c=>c.name.toLowerCase()===name.toLowerCase())).map(name=>({id:'starter_'+name.toLowerCase(),name,entryIds:[],createdAt:Date.now()}))]}}
export function moonPhase(date:string){const days=(Date.parse(date+'T12:00:00Z')-Date.UTC(2000,0,6,18,14))/86400000;const phase=((days/29.530588853)%1+1)%1;const index=Math.round(phase*8)%8;return {index,phase,symbol:['○','◔','◐','◕','●','◕','◑','◔'][index],name:['new moon','waxing crescent','first quarter','waxing gibbous','full moon','waning gibbous','last quarter','waning crescent'][index]}}
export function planetPoint(root:{x:number;y:number;a:number},radius:number,slot:number,angle:number,freedom:number){const phase=angle*3/(slot+1);const wrapped=((phase+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;const a=root.a+wrapped*freedom;return {x:root.x+Math.cos(a)*radius,y:root.y+Math.sin(a)*radius}}
export function escapeAction(connecting:boolean,cleared:boolean,eye:boolean,overview:boolean){return connecting?(cleared?'leave-connect':'clear-connect'):eye?(overview?'reset':'overview'):'reset'}

// Carried instances remain historical records; resolution illuminates their stars.
export function completionChain(entries:Entry[],id:string){const target=entries.find(e=>e.id===id);if(!target)return [];const root=target.carryRoot??target.id;return entries.filter(e=>(e.carryRoot??e.id)===root&&e.date<=target.date&&!e.orbiting).sort((a,b)=>b.date.localeCompare(a.date)||Number(b.id===id)-Number(a.id===id))}
export function updateEntryState(data:AppData,id:string,patch:Partial<Entry>):AppData{
 const target=data.entries.find(e=>e.id===id);if(!target)return data;
 const predecessors=new Set(patch.done===true?completionChain(data.entries,id).map(e=>e.id):[]);
 return {...data,entries:data.entries.map(e=>{let next=e;if(e.id===id)next={...e,...patch};if(patch.done===true&&e.id!==id&&predecessors.has(e.id))next={...next,illuminatedBy:id};if(patch.done===false&&e.illuminatedBy===id)next={...next,illuminatedBy:undefined};return next})};
}
export function cleanupTestSkies(data:AppData):AppData{
 if(data.journalNotesCleanupV1)return data;
 const moodJournal=data.moodJournal.filter(m=>!!m.text?.trim());const moods={...data.moods};for(const [date,mood] of Object.entries(moods))if(!mood.text?.trim())delete moods[date];
 for(const log of moodJournal.slice().sort((a,b)=>(a.recordedAt??0)-(b.recordedAt??0)))moods[log.date]={icon:log.icon,text:log.text};
 return {...data,journalNotesCleanupV1:true,moodJournal,moods};
}
export function moonOutline(phase:number,r=5.5){const f=((phase%1)+1)%1;const waxing=f<=.5;const t=waxing?f:1-f;const c=Math.cos(t*Math.PI*2);const rx=Math.abs(c)*r;const terminator=rx<.015?'L0,'+(-r):'A'+rx+','+r+' 0 0 '+(c>=0?'0':'1')+' 0,'+(-r);return {d:'M0,'+(-r)+' A'+r+','+r+' 0 0 1 0,'+r+' '+terminator+' Z',mirror:waxing?1:-1,full:Math.abs(f-.5)<.008,newMoon:f<.008||f>.992}}
