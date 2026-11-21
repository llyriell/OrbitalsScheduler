import type { AppData,FinancialRecord } from './types';
export function preservedFinances(data:Partial<AppData>):FinancialRecord[]{if(Array.isArray(data.financialRecords))return data.financialRecords;return (data.buyItems??[]).filter(i=>i.bought&&typeof i.amount==='number').map(i=>({id:'legacy_'+i.id,text:i.text,kind:i.kind??'expense',amount:i.amount!,createdAt:i.boughtAt??i.createdAt}))}
