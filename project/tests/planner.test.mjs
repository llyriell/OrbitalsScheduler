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
 assert.equal(parseCommand('go [2026-02-30]').kind,'error');
 assert.equal(parseCommand('go [2026-12-10]').date,'2026-12-10');
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
