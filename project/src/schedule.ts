import type { AppData, RecurrenceRule, RecurringSeries } from './types';
export function dayNumber(iso:string){const [y,m,d]=iso.split('-').map(Number);return Date.UTC(y,m-1,d)/86400000}
export function recursOn(rule:RecurrenceRule,anchor:string,date:string,weekdays?:number[]){
 if(!anchor||!date||date<anchor)return false;
 const [ay,am,ad]=anchor.split('-').map(Number);const [y,m,d]=date.split('-').map(Number);
 const dow=new Date(Date.UTC(y,m-1,d)).getUTCDay();
 switch(rule){
 case 'daily':return true;
 case 'every_other_day':return (dayNumber(date)-dayNumber(anchor))%2===0;
 case 'weekdays':return (weekdays??[]).includes(dow);
 case 'weekly':return dow===new Date(Date.UTC(ay,am-1,ad)).getUTCDay();
 case 'monthly':return d===Math.min(ad,new Date(Date.UTC(y,m,0)).getUTCDate());
 case 'yearly':return m===am&&d===Math.min(ad,new Date(Date.UTC(y,m,0)).getUTCDate());
 }
}
export function seriesOn(s:RecurringSeries,date:string){return !s.paused&&!s.skippedDates?.includes(date)&&recursOn(s.rule,s.anchorDate,date,s.weekdays)}
export function upcomingOn(data:AppData,date:string){const actual=data.entries.filter(e=>!e.orbiting&&e.date===date);return [...actual.map(e=>({id:e.id,text:e.text,date,kind:e.kind??'task',virtual:false})),...data.series.filter(s=>seriesOn(s,date)&&!actual.some(e=>e.seriesId===s.id)).map(s=>({id:s.id,text:s.title,date,kind:'task',virtual:true}))]}
export const RULE_LABEL:Record<RecurrenceRule,string>={daily:'Every day',every_other_day:'Every other day',weekdays:'Chosen weekdays',weekly:'Every week',monthly:'Every month',yearly:'Every year'};
export const WEEKDAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export function rhythmLabel(s:RecurringSeries){return s.rule==='weekdays'?(s.weekdays??[]).map(d=>WEEKDAYS[d]).join(' · '):RULE_LABEL[s.rule]}
