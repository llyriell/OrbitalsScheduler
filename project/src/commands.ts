import type { Entry } from './types';
export type Command={kind:'recall';query:string}|{kind:'add'|'today'|'buy';text:string}|{kind:'go';date:string}|{kind:'help'|'eye'|'orbit'}|{kind:'error';message:string};
export function parseCommand(raw:string):Command{
 const match=raw.trim().match(/^\/?([a-z]+)(?:\s+(.*))?$/i);
 if(!match)return {kind:'help'};
 const verb=match[1].toLowerCase();let value=(match[2]??'').trim();
 if(value.startsWith('[')&&value.endsWith(']'))value=value.slice(1,-1).trim();
 if(verb==='recall')return {kind:'recall',query:value};
 if(verb==='add'||verb==='today'||verb==='buy')return value?{kind:verb,text:value}:{kind:'error',message:verb+' [something to keep]'};
 if(verb==='go'){if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)return {kind:'error',message:'go [YYYY-MM-DD] — choose a valid date'};return {kind:'go',date:value}}
 if(verb==='eye'||verb==='orbit'||verb==='help')return {kind:verb};
 return {kind:'error',message:'Unknown command. Type help to see the available commands.'}
}
export function recallEntries(entries:Entry[],query:string){const q=query.trim().toLocaleLowerCase();return entries.filter(e=>!q||(e.text+'\n'+(e.note??'')).toLocaleLowerCase().includes(q)).slice().sort((a,b)=>b.createdAt-a.createdAt)}
export const COMMAND_HELP=[['recall [word]','search titles and notes; recall [] shows all'],['add [task]','send a new task into undated orbit'],['today [task]','place a task in the everlasting present'],['buy [item]','add to your gathering checklist'],['go [YYYY-MM-DD]','visit a day'],['orbit','recall all loose orbitals'],['eye','enter the remembering eye'],['help','show these commands']];
