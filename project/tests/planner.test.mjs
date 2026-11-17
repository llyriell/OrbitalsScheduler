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
test('visit replaces find while connect opens constellation work',()=>{
 assert.equal(parseCommand('go [2026-12-10]').kind,'error');assert.equal(parseCommand('find [2026-12-10]').kind,'error');assert.equal(parseCommand('visit [2026-12-10]').date,'2026-12-10');assert.equal(parseCommand('connect').kind,'connect');
});

const {focusCamera}=load('navigation');
const {preservedFinances}=load('finance');
test('day focusing centers the day with a useful close scale',()=>{
 const camera=focusCamera('2026-11-17',.25,5);const point=spiralPoint('2026-11-17',12+4*9);assert.ok(Math.abs((point.x-450)*.25*camera.k+camera.x)<1e-8);assert.ok(Math.abs((point.y-450)*.25*camera.k+camera.y)<1e-8);assert.ok(camera.k>1);
});
test('today focuses without text and visit retains date focus semantics',()=>{
 assert.equal(parseCommand('today').kind,'visit');assert.equal(parseCommand('today [sew]').text,'sew');assert.equal(parseCommand('visit [December 10]').kind,'visit');
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

test('horizon and return open future and recurring panels',()=>{const {parseCommand}=load('commands');assert.equal(parseCommand('horizon').kind,'horizon');assert.equal(parseCommand('return').kind,'return');});

const {carryForward,seedConstellations,orderedDay,moonPhase,planetPoint,escapeAction}=load('celestial');
test('carryover preserves unlit history, repeats across missed days, and is idempotent',()=>{
 const entry={id:'root',text:'Sew',date:'2026-11-15',done:false,orbiting:false,order:0,createdAt:1,note:'keep this'};
 const d={...empty,entries:[entry]};
 const next=carryForward(d,'2026-11-17');assert.equal(next.entries.length,3);assert.equal(next.entries[0].done,false);assert.equal(next.entries[0].date,'2026-11-15');assert.equal(next.entries[2].date,'2026-11-17');assert.equal(next.entries[2].carryRoot,'root');assert.equal(next.entries[2].note,'keep this');assert.equal(carryForward(next,'2026-11-17'),next);
 const completed={...next,entries:next.entries.map(e=>e.date==='2026-11-17'?{...e,done:true}:e)};
 assert.equal(carryForward(completed,'2026-11-18'),completed);
});
test('carryover excludes appointments, loose orbitals, completed tasks, and dismissed roots',()=>{
 const task={id:'a',text:'Task',date:'2026-11-16',done:false,orbiting:false,order:0,createdAt:1};
 for(const change of [{kind:'event'},{orbiting:true},{done:true}]){const d={...empty,entries:[{...task,...change}]};assert.equal(carryForward(d,'2026-11-17'),d)}
 const d={...empty,entries:[task],dismissedCarryRoots:['a']};assert.equal(carryForward(d,'2026-11-17'),d);
});
test('completed tasks stay below open tasks without losing their manual order',()=>{
 const d=[{id:'done',date:'2026-11-17',done:true,order:0},{id:'b',date:'2026-11-17',done:false,order:2},{id:'a',date:'2026-11-17',done:false,order:1}];assert.equal(orderedDay(d,'2026-11-17').map(e=>e.id).join(','),'a,b,done');
});
test('starter constellations are empty, never duplicated, and not recreated after deletion',()=>{
 const d=seedConstellations({...empty,constellations:[{id:'g',name:'Garden',entryIds:[],createdAt:0}]});assert.equal(d.constellations.map(c=>c.name).join(','),'Garden,Home,Evol');assert.equal(seedConstellations(d),d);const removed={...d,constellations:[]};assert.equal(seedConstellations(removed).constellations.length,0);
});
test('orbital rungs slow outwards and come back into alignment',()=>{
 const root={x:0,y:0,a:0};const aligned=planetPoint(root,20,0,9,0);assert.equal(aligned.x,20);assert.equal(aligned.y,0);const inner=planetPoint(root,20,0,Math.PI/6,1);const outer=planetPoint(root,40,1,Math.PI/6,1);assert.ok(Math.atan2(inner.y,inner.x)>Math.atan2(outer.y,outer.x));for(let slot=0;slot<3;slot++){const p=planetPoint(root,20,slot,Math.PI*4,1);assert.ok(Math.abs(p.y)<1e-8)}
});
test('Escape advances through clearing, leaving Connect, full eye, then reset',()=>{
 assert.equal(escapeAction(true,false,true,false),'clear-connect');assert.equal(escapeAction(true,true,true,false),'leave-connect');assert.equal(escapeAction(false,false,true,false),'overview');assert.equal(escapeAction(false,false,true,true),'reset');
});
test('visit is the sole date command and blood moon marks the selected day',()=>{
 assert.equal(parseCommand('find [tomorrow]').kind,'error');assert.equal(parseCommand('visit [yesterday]').kind,'visit');assert.equal(parseCommand('blood moon').kind,'blood-moon');
});
test('lunar phase cycles and new archive metadata survive export and import',()=>{
 const a=moonPhase('2026-11-17');assert.ok(a.index>=0&&a.index<8);assert.ok(a.phase>=0&&a.phase<1);
 const d={...empty,dayMoons:{'2026-11-17':'blood'},starterConstellationsAdded:true,dismissedCarryRoots:['a'],deletedEntries:[]};const out=archive.parseArchive(archive.exportArchive(d));assert.equal(out.dayMoons['2026-11-17'],'blood');assert.equal(out.starterConstellationsAdded,true);assert.equal(out.dismissedCarryRoots[0],'a');
});

test('unfinished recurring occurrences carry forward without duplicating later scheduled returns',()=>{
 const recurring={id:'s1',text:'Water',seriesId:'s',date:'2026-11-15',done:false,orbiting:false,order:0,createdAt:1};
 const d=carryForward({...empty,entries:[recurring]},'2026-11-17');assert.equal(d.entries.length,3);assert.equal(d.entries[2].seriesId,'s');
 const later={...recurring,id:'s2',date:'2026-11-17'};const next=carryForward({...empty,entries:[recurring,later]},'2026-11-18');assert.equal(next.entries.filter(e=>e.date==='2026-11-17').length,1);assert.equal(next.entries.filter(e=>e.date==='2026-11-18').length,1);
});

const {completionChain,updateEntryState,cleanupTestSkies,moonOutline}=load('celestial');
test('completion lights the carried ancestry without rewriting historical completion',()=>{
 const base={id:'seed',text:'Sew the cuff',date:'2026-11-14',done:false,orbiting:false,order:0,createdAt:1};
 const carried=carryForward({...empty,entries:[base,{...base,id:'unrelated'}]},'2026-11-17');
 const final='seed__carry_2026-11-17';const done=updateEntryState(carried,final,{done:true});
 assert.equal(completionChain(done.entries,final).map(e=>e.date).join(','),'2026-11-17,2026-11-16,2026-11-15,2026-11-14');
 assert.equal(done.entries.find(e=>e.id==='seed').done,false);assert.equal(done.entries.find(e=>e.id==='seed').illuminatedBy,final);assert.equal(done.entries.find(e=>e.id==='unrelated').illuminatedBy,undefined);assert.equal(done.entries.find(e=>e.id===final).done,true);
 assert.equal(carryForward(done,'2026-11-18').entries.filter(e=>(e.carryRoot??e.id)==='seed'&&e.date==='2026-11-18').length,0);
});
test('reopening a carried completion reverses only its own illumination',()=>{
 const base={id:'s',text:'Task',date:'2026-11-16',done:false,orbiting:false,order:0,createdAt:1};const carried=carryForward({...empty,entries:[base]},'2026-11-17');const id='s__carry_2026-11-17';const done=updateEntryState(carried,id,{done:true});const opened=updateEntryState(done,id,{done:false});assert.equal(opened.entries[0].illuminatedBy,undefined);assert.equal(opened.entries[1].done,false);assert.equal(carryForward(opened,'2026-11-18').entries.length,3);
 const noted=updateEntryState(done,id,{note:'keep the note'});assert.equal(noted.entries[0].illuminatedBy,id);assert.equal(noted.entries[1].note,'keep the note');
});
test('different recurring occurrences do not illuminate one another',()=>{
 const base={text:'Water',seriesId:'series',done:false,orbiting:false,order:0,createdAt:1};const d={...empty,entries:[{...base,id:'old',date:'2026-11-01'},{...base,id:'new',date:'2026-11-15'},{...base,id:'carry',carryRoot:'new',date:'2026-11-17'}]};const next=updateEntryState(d,'carry',{done:true});assert.equal(next.entries[0].illuminatedBy,undefined);assert.equal(next.entries[1].illuminatedBy,'carry');
});
test('journal cleanup removes existing note-less tests once and preserves written notes',()=>{
 const d={...empty,moods:{'2026-11-15':{icon:'clear'},'2026-11-16':{icon:'cloudy',text:'clouds passed'}},moodJournal:[{id:'a',date:'2026-11-15',icon:'clear'},{id:'b',date:'2026-11-15',icon:'clear',text:'   '},{id:'c',date:'2026-11-16',icon:'cloudy',text:'clouds passed',recordedAt:3}]};const clean=cleanupTestSkies(d);assert.equal(clean.moodJournal.length,1);assert.equal(clean.moodJournal[0].recordedAt,3);assert.equal(clean.moods['2026-11-15'],undefined);assert.equal(clean.moods['2026-11-16'].text,'clouds passed');const later={...clean,moodJournal:[...clean.moodJournal,{id:'later',date:'2026-11-17',icon:'clear'}]};assert.equal(cleanupTestSkies(later),later);
 assert.equal(archive.parseArchive(archive.exportArchive(clean)).journalNotesCleanupV1,true);
});
test('moon outlines have phase-specific terminators and mirror when waning',()=>{
 assert.equal(moonOutline(0).newMoon,true);assert.equal(moonOutline(.5).full,true);assert.match(moonOutline(.25).d,/L0,-5.5/);assert.match(moonOutline(.125).d,/A3\.889/);assert.equal(moonOutline(.125).mirror,1);assert.equal(moonOutline(.875).mirror,-1);assert.equal(moonOutline(.125).d,moonOutline(.875).d);for(let phase=0;phase<1;phase+=.01)assert.ok(!moonOutline(phase).d.includes('NaN'));
});
