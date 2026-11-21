export function journalMoment(timestamp:number){const d=new Date(timestamp);return {recordedAt:timestamp,date:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}}
export function clockText(timestamp:number){const d=new Date(timestamp);return [d.getHours(),d.getMinutes(),d.getSeconds()].map(v=>String(v).padStart(2,'0')).join(':')}
