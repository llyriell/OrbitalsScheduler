import type { Entry } from './types';
export type Command={kind:'recall';query:string}|{kind:'add'|'today'|'gather';text:string}|{kind:'visit';date:string}|{kind:'help'|'eye'|'orbit'|'connect'|'constellation'|'horizon'|'return'|'blood-moon'|'rewind'}|{kind:'error';message:string};
export function resolveDay(value:string,base=new Date()):string|null{
 const local=(d:Date)=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const key=value.trim().toLowerCase();const d=new Date(base.getFullYear(),base.getMonth(),base.getDate());
 if(key==='today')return local(d);if(key==='tomorrow'){d.setDate(d.getDate()+1);return local(d)}if(key==='yesterday'){d.setDate(d.getDate()-1);return local(d)}
 if(/^\d{4}-\d{2}-\d{2}$/.test(key)){const t=Date.parse(key);return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===key?key:null}
 const weekdays=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];const weekday=weekdays.findIndex(w=>w===key||w.slice(0,3)===key);if(weekday>=0){const step=(weekday-d.getDay()+7)%7||7;d.setDate(d.getDate()+step);return local(d)}
 const numeric=key.match(/^(\d{1,2})\s+(\d{1,2})$/);if(numeric){const month=Number(numeric[1]);const day=Number(numeric[2]);const year=base.getFullYear();const parsed=new Date(year,month-1,day);return month>=1&&month<=12&&day>=1&&parsed.getMonth()===month-1&&parsed.getDate()===day?local(parsed):null}
 const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
 const m=key.match(/^([a-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?$/);
 if(m){const month=months.findIndex(v=>v===m[1]||v.slice(0,3)===m[1]);if(month<0)return null;const year=m[3]?Number(m[3]):base.getFullYear();const parsed=new Date(year,month,Number(m[2]));return parsed.getFullYear()===year&&parsed.getMonth()===month&&parsed.getDate()===Number(m[2])?local(parsed):null}
 return null
}
export function parseCommand(raw:string):Command{
 if(/^\/?blood\s+moon$/i.test(raw.trim()))return {kind:'blood-moon'};
 const match=raw.trim().match(/^\/?([a-z]+)(?:\s+(.*))?$/i);if(!match)return {kind:'help'};
 const verb=match[1].toLowerCase();let value=(match[2]??'').trim();if(value.startsWith('[')&&value.endsWith(']'))value=value.slice(1,-1).trim();
 if(verb==='recall')return {kind:'recall',query:value};
 if(verb==='today'&&!value)return {kind:'visit',date:resolveDay('today')!};
 if(verb==='add'||verb==='today'||verb==='gather')return value?{kind:verb,text:value}:{kind:'error',message:verb+' [something to keep]'};
 if(verb==='visit'){const date=resolveDay(value);return date?{kind:'visit',date}:{kind:'error',message:'visit [YYYY-MM-DD], visit [MM DD], visit [December 10], or visit [tomorrow]'}}
 if(verb==='constellation'||verb==='constellations')return {kind:'constellation'};
 if(verb==='rewind'&&!value)return {kind:'rewind'};
 if(verb==='horizon'||verb==='return')return {kind:verb};
 if(verb==='eye'||verb==='orbit'||verb==='help'||verb==='connect')return {kind:verb};
 return {kind:'error',message:'Unknown command. Type help to see the available commands.'}
}
export function recallEntries(entries:Entry[],query:string){const q=query.trim().toLocaleLowerCase();return entries.filter(e=>!q||(e.text+'\n'+(e.note??'')).toLocaleLowerCase().includes(q)).slice().sort((a,b)=>b.createdAt-a.createdAt)}
export const COMMAND_HELP=[['recall [key]','search titles and notes; recall [] shows all'],['add [task]','send a new task into undated orbit'],['today','focus today in the list and eye'],['today [task]','add a task and focus today'],['gather [item]','add to your gathering checklist'],['visit [day]','YYYY-MM-DD, MM DD, next weekday, month day, tomorrow, yesterday'],['connect','draw connections between stars'],['constellation','browse all constellations and their details'],['orbit','recall all loose orbitals'],['eye','enter the remembering eye'],['horizon','place a task in the future'],['return','manage returning rhythms'],['blood moon','mark this day with oxblood ink'],['rewind','undo the last task or journal deletion · Ctrl+Z'],['help','show these commands']];
export function moveBefore<T extends {id:string;order:number}>(items:T[],id:string,targetId:string|null):T[]{
 const moving=items.find(e=>e.id===id);if(!moving||id===targetId)return items;const rest=items.filter(e=>e.id!==id);const found=targetId?rest.findIndex(e=>e.id===targetId):rest.length;const idx=found<0?rest.length:found;return [...rest.slice(0,idx),moving,...rest.slice(idx)].map((e,order)=>({...e,order}))
}

export function commandSuggestions(raw:string){const token=raw.trim().replace(/^\//,'').toLowerCase();if(!token)return [];return COMMAND_HELP.filter(([command],i,list)=>{const name=command.replace(/\s*\[.*$/,'');return name.startsWith(token)&&name!==token&&list.findIndex(([other])=>other.replace(/\s*\[.*$/,'')===name)===i})}
export function completedCommand(suggestions:string[][],index:number){if(!suggestions.length)return null;const selected=((index%suggestions.length)+suggestions.length)%suggestions.length;return suggestions[selected][0].replace(/\s*\[.*$/,'')+' '}
