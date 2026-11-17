import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve,dirname,relative } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const cache=new Map();
const storage=new Map();
function load(name){
 const filename=resolve('src',name+'.ts');
 if(cache.has(filename))return cache.get(filename).exports;
 const module={exports:{}};cache.set(filename,module);
 const code=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const localRequire=p=>p.startsWith('.')?load(relative(resolve('src'),resolve(dirname(filename),p)).replace(/\.ts$/,'')):require(p);
 vm.runInNewContext(code,{module,exports:module.exports,require:localRequire,Date,Math,JSON,Map,Set,crypto:globalThis.crypto,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}},{filename});
 return module.exports;
}
const {recursOn,upcomingOn}=load('schedule');
const store=load('store');
const archive=load('evolArchive');
const empty={entries:[],traces:[],series:[],buyItems:[],constellations:[],moods:{},moodJournal:[]};
test('every-other-day rhythm crosses DST, month and year boundaries',()=>{
 assert.equal(recursOn('every_other_day','2026-10-31','2026-11-02'),true);
 assert.equal(recursOn('every_other_day','2026-10-31','2026-11-01'),false);
 assert.equal(recursOn('every_other_day','2026-12-31','2027-01-02'),true);
 assert.equal(recursOn('every_other_day','2026-11-17','2026-11-15'),false);
});
test('chosen weekdays respect anchor and empty selections',()=>{
 assert.equal(recursOn('weekdays','2026-11-17','2026-11-18',[1,3,5]),true);
 assert.equal(recursOn('weekdays','2026-11-17','2026-11-19',[1,3,5]),false);
 assert.equal(recursOn('weekdays','2026-11-17','2026-11-18',[]),false);
 assert.equal(recursOn('weekdays','2026-11-17','2026-11-16',[1]),false);
});
test('monthly and leap-day returns clamp to the last valid day',()=>{
 assert.equal(recursOn('monthly','2026-01-31','2026-02-28'),true);
 assert.equal(recursOn('yearly','2024-02-29','2027-02-28'),true);
});
test('upcoming includes dated events and virtual recurrences, excludes loose tasks and duplicates',()=>{
 const series={id:'s',title:'Garden',rule:'every_other_day',anchorDate:'2026-11-16',paused:false,createdAt:0};
 const entry={id:'e',text:'Renewal',date:'2026-11-18',done:false,orbiting:false,order:0,createdAt:0,kind:'event'};
 const data={...empty,series:[series],entries:[entry,{...entry,id:'loose',orbiting:true}]};
 assert.equal(upcomingOn(data,'2026-11-18').length,2);
 assert.equal(upcomingOn({...data,series:[{...series,paused:true}]},'2026-11-18').length,1);
 assert.equal(upcomingOn({...data,series:[{...series,skippedDates:['2026-11-18']}]},'2026-11-18').length,1);
 assert.equal(upcomingOn({...data,entries:[entry,{...entry,id:'actual',seriesId:'s'}]},'2026-11-18').length,2);
});
test('old single-day moods migrate without fabricating a time',()=>{
 storage.set('orbitals.v1',JSON.stringify({...empty,moodJournal:undefined,moods:{'2026-11-17':{icon:'cloudy',text:'An earlier sky'}}}));
 const data=store.loadData();
 assert.equal(data.moodJournal.length,1);
 assert.equal(data.moodJournal[0].text,'An earlier sky');
 assert.equal(data.moodJournal[0].recordedAt,undefined);
});
test('archives retain multiple skies per day, timestamps, and future events',()=>{
 const logs=[{id:'m1',date:'2026-11-17',icon:'clear',text:'Morning',recordedAt:1794920400000},{id:'m2',date:'2026-11-17',icon:'cloudy',text:'Evening',recordedAt:1794960000000}];
 const data={...empty,moodJournal:logs,entries:[{id:'future',date:'2026-12-10',text:'Renewal',kind:'event',done:false,orbiting:false,order:0,createdAt:0}]};
 const parsed=archive.parseArchive(archive.exportArchive(data));
 assert.equal(JSON.stringify(parsed.moodJournal),JSON.stringify(logs));
 assert.equal(parsed.entries[0].date,'2026-12-10');
 assert.match(archive.dayContext(parsed,'2026-11-17'),/Morning/);
 assert.match(archive.dayContext(parsed,'2026-11-17'),/Evening/);
});

const {parseCommand,recallEntries}=load('commands');
const {journalMoment,clockText}=load('journalTime');
test('commands accept bracket syntax, preserve text, and reject impossible dates',()=>{
 assert.equal(parseCommand('add [Sew the cuff]').text,'Sew the cuff');
 assert.equal(parseCommand('recall []').query,'');
 assert.equal(parseCommand('recall [LAVENDER]').query,'LAVENDER');
 assert.equal(parseCommand('visit [2026-02-30]').kind,'error');
 assert.equal(parseCommand('visit [2026-12-10]').date,'2026-12-10');
 assert.equal(parseCommand('add []').kind,'error');
});
test('recall finds task titles and notes without changing entries',()=>{
 const entries=[{id:'a',text:'Make milk',note:'Dried lavender stalks',createdAt:1},{id:'b',text:'Lavender garden',note:'',createdAt:2}];
 assert.equal(recallEntries(entries,'LAVENDER').length,2);
 assert.equal(recallEntries(entries,'stalks')[0].id,'a');
 assert.equal(recallEntries(entries,'').length,2);
 assert.equal(entries[0].id,'a');
});
test('journal moment preserves local date and second at the start, across midnight',()=>{
 const captured=new Date(2026,10,17,23,59,58).getTime();
 assert.equal(journalMoment(captured).date,'2026-11-17');
 assert.equal(journalMoment(captured).recordedAt,captured);
 assert.equal(clockText(captured),'23:59:58');
 assert.equal(journalMoment(captured+5000).date,'2026-11-18');
});
test('store saves held timestamps and creates command orbitals as undated',()=>{
 let snapshot={...empty};
 const module={exports:{}};
 const code=ts.transpileModule(readFileSync(resolve('src/store.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const fakeReact={useCallback:f=>f,useEffect:()=>{},useState:init=>{snapshot=init();return [snapshot,update=>{snapshot=typeof update==='function'?update(snapshot):update}]}};
 vm.runInNewContext(code,{module,exports:module.exports,require:p=>p==='react'?fakeReact:load(p.slice(2)),Date,Math,JSON,crypto:globalThis.crypto,localStorage:{getItem:()=>null}});
 const o=module.exports.useOrbitals();const timestamp=new Date(2026,10,17,23,59,58).getTime();
 o.addMood('2026-11-17',{icon:'clear',text:'A held moment'},timestamp);
 o.addMood('2026-11-18',{icon:'cloudy'},timestamp+5000);
 assert.equal(snapshot.moodJournal.length,2);
 assert.equal(snapshot.moodJournal[0].recordedAt,timestamp);
 assert.equal(snapshot.moodJournal[0].date,'2026-11-17');
 o.addOrbit('A future possibility');
 assert.equal(snapshot.entries[0].orbiting,true);
 assert.equal(upcomingOn(snapshot,snapshot.entries[0].date).length,0);
});

const {resolveDay,moveBefore}=load('commands');
test('gather replaces buy and find resolves named and relative dates',()=>{
 assert.equal(parseCommand('gather [linen]').kind,'gather');
 assert.equal(parseCommand('buy [linen]').kind,'error');
 const base=new Date(2026,10,17,12);
 assert.equal(resolveDay('December 10',base),'2026-12-10');
 assert.equal(resolveDay('tomorrow',base),'2026-11-18');
 assert.equal(resolveDay('yesterday',base),'2026-11-16');
 assert.equal(resolveDay('November 31',base),null);
 assert.equal(resolveDay('2026-02-30',base),null);
});
test('drag reordering moves in both directions and supports dropping at the end',()=>{
 const items=[{id:'a',order:0,note:'keep'},{id:'b',order:1},{id:'c',order:2}];
 assert.equal(moveBefore(items,'c','a').map(e=>e.id).join(','),'c,a,b');
 assert.equal(moveBefore(items,'a','c').map(e=>e.id).join(','),'b,a,c');
 assert.equal(moveBefore(items,'a',null).map(e=>e.id).join(','),'b,c,a');
 assert.equal(moveBefore(items,'a','a').map(e=>e.id).join(','),'a,b,c');
 assert.equal(moveBefore(items,'c','a')[1].note,'keep');
 assert.equal(items[0].id,'a');
});
test('store reordering preserves other days and financial records settle immediately',()=>{
 let snapshot;const module={exports:{}};
 const code=ts.transpileModule(readFileSync(resolve('src/store.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const fakeReact={useCallback:f=>f,useEffect:()=>{},useState:init=>{snapshot=init();return [snapshot,update=>{snapshot=typeof update==='function'?update(snapshot):update}]}};
 vm.runInNewContext(code,{module,exports:module.exports,require:p=>p==='react'?fakeReact:load(p.slice(2)),Date,Math,JSON,crypto:globalThis.crypto,localStorage:{getItem:()=>null}});
 const o=module.exports.useOrbitals();o.addEntries('2026-11-17',['first','second','third']);o.addEntries('2026-11-18',['tomorrow']);
 const first=snapshot.entries.find(e=>e.text==='first');const third=snapshot.entries.find(e=>e.text==='third');
 o.reorderEntry('2026-11-17',third.id,first.id);
 assert.equal(snapshot.entries.filter(e=>e.date==='2026-11-17').sort((a,b)=>a.order-b.order).map(e=>e.text).join(','),'third,first,second');
 assert.equal(snapshot.entries.find(e=>e.text==='tomorrow').order,0);
 o.addFinancialRecord('Materials','expense',12.5);o.addFinancialRecord('Sale','income',25);
 assert.equal(snapshot.financialRecords.length,2);assert.ok(snapshot.financialRecords[0].createdAt);assert.equal(snapshot.financialRecords[1].amount,25);
 o.addFinancialRecord('Invalid','expense',-1);assert.equal(snapshot.financialRecords.length,2);o.addBuyItem('Oats');const shopping=snapshot.buyItems[0];o.updateBuyItem(shopping.id,{bought:true});assert.ok(snapshot.buyItems[0].boughtAt);o.updateBuyItem(shopping.id,{bought:false});assert.equal(snapshot.buyItems[0].boughtAt,undefined);
});

const {spiralPoint,zoomAt,shouldCaptureTyping}=load('navigation');
test('the spiral starts at 2000 and completes one outward turn each year',()=>{
 const center=spiralPoint('2000-01-01');assert.ok(Math.abs(center.r)<.1);
 const a=spiralPoint('2026-01-01');const b=spiralPoint('2027-01-01');assert.ok(Math.abs((b.r-a.r)-46)<.01);assert.ok(Math.abs(a.a-b.a)<.001);
});
test('wheel zoom anchors at the pointer and respects bounds',()=>{
 const c={k:1,x:10,y:-20};const p={x:150,y:60};const z=zoomAt(c,-300,p);assert.ok(z.k>1);
 assert.ok(Math.abs((p.x-z.x)/z.k-(p.x-c.x)/c.k)<1e-8);
 assert.ok(zoomAt(c,-1e6,p).k<=24);assert.ok(zoomAt(c,1e6,p).k>=.25);
});
test('type-to-command excludes editors, shortcuts, and composing text',()=>{
 const e={key:'r',ctrlKey:false,metaKey:false,altKey:false,isComposing:false};
 assert.equal(shouldCaptureTyping(e,false),true);assert.equal(shouldCaptureTyping(e,true),false);assert.equal(shouldCaptureTyping({...e,ctrlKey:true},false),false);assert.equal(shouldCaptureTyping({...e,isComposing:true},false),false);assert.equal(shouldCaptureTyping({...e,key:'ArrowLeft'},false),false);
});
test('visit and find focus dates while connect opens constellation work',()=>{
 assert.equal(parseCommand('go [2026-12-10]').kind,'error');assert.equal(parseCommand('find [2026-12-10]').date,'2026-12-10');assert.equal(parseCommand('visit [2026-12-10]').date,'2026-12-10');assert.equal(parseCommand('connect').kind,'connect');
});

const {focusCamera}=load('navigation');
const {preservedFinances}=load('finance');
test('day focusing centers the day with a useful close scale',()=>{
 const camera=focusCamera('2026-11-17',.25,5);const point=spiralPoint('2026-11-17',12+4*9);assert.ok(Math.abs((point.x-450)*.25*camera.k+camera.x)<1e-8);assert.ok(Math.abs((point.y-450)*.25*camera.k+camera.y)<1e-8);assert.ok(camera.k>1);
});
test('today focuses without text and find retains date focus semantics',()=>{
 assert.equal(parseCommand('today').kind,'visit');assert.equal(parseCommand('today [sew]').text,'sew');assert.equal(parseCommand('find [December 10]').kind,'visit');
});
test('legacy amounts migrate once and shopping checks cannot alter the ledger',()=>{
 const data={buyItems:[{id:'a',text:'Materials',kind:'expense',amount:12,bought:true,createdAt:1}]};const records=preservedFinances(data);assert.equal(records.length,1);assert.equal(records[0].amount,12);data.buyItems[0].bought=false;assert.equal(records[0].amount,12);assert.equal(preservedFinances({...data,financialRecords:records}).length,1);
});

test('upcoming weekdays are strictly upcoming and yesterday remains available',()=>{
 const base=new Date(2026,10,17,12);assert.equal(resolveDay('Sunday',base),'2026-11-22');assert.equal(resolveDay('Tuesday',base),'2026-11-24');assert.equal(resolveDay('yesterday',base),'2026-11-16');
});
test('focused scale is half the previous scale and invalid zoom input is ignored',()=>{
 const c=focusCamera('2026-11-17',.25);assert.ok(Math.abs(c.k*.25-1.1)<1e-8);const camera={k:1,x:0,y:0};assert.equal(zoomAt(camera,NaN,{x:0,y:0}),camera);assert.equal(zoomAt(camera,10,{x:Infinity,y:0}),camera);
});
const {visibleGathering,matchesLens}=load('navigation');
test('completed gathering leaves the next day while unchecked items persist',()=>{
 const boughtAt=new Date(2026,10,17,13).getTime();assert.equal(visibleGathering({bought:true,boughtAt},'2026-11-17'),true);assert.equal(visibleGathering({bought:true,boughtAt},'2026-11-18'),false);assert.equal(visibleGathering({bought:false,boughtAt},'2026-11-18'),true);
});
test('season and year lenses filter actual records',()=>{
 assert.equal(matchesLens('2026-11-17',2026,3),true);assert.equal(matchesLens('2026-11-17',2026,1),false);assert.equal(matchesLens('2025-11-17',2026),false);assert.equal(matchesLens('2026-12-10',2026,0),true);
});

test('constellation command opens saved connections with singular and plural aliases',()=>{const {parseCommand}=load('commands');assert.equal(parseCommand('constellation').kind,'constellation');assert.equal(parseCommand('constellations').kind,'constellation');});
