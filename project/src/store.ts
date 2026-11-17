import { preservedFinances } from './finance';
import { moveBefore } from './commands';
import { seriesOn } from './schedule';
export { recursOn } from './schedule';
import { useCallback, useEffect, useState } from 'react';
import type {
  ArchiveData,
  AppData,
  BuyItem,
  Constellation,
  Entry,
  FinancialRecord,
  LedgerKind,
  Mood,
  RecurringSeries,
  Trace,
} from './types';

const STORAGE_KEY = 'orbitals.v1';

export function uid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return `${prefix}_${rand}`;
}

export function todayISO(): string {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return toISO(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

const emptyData: AppData = {
  financialRecords: [],
  entries: [],
  traces: [],
  series: [],
  buyItems: [],
  constellations: [],
  moods: {},
  moodJournal: [],
};

function sanitize(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') return { ...emptyData };
  const d = raw as Partial<ArchiveData> & Partial<AppData>;
  return {
    financialRecords: preservedFinances(d),
    entries: Array.isArray(d.entries) ? d.entries : [],
    traces: Array.isArray(d.traces) ? d.traces : [],
    series: Array.isArray(d.series) ? d.series : [],
    buyItems: Array.isArray(d.buyItems) ? d.buyItems.map(b=>b.bought&&!b.boughtAt?{...b,boughtAt:Date.now()}:b) : [],
    constellations: Array.isArray(d.constellations) ? d.constellations : [],
    moods: d.moods && typeof d.moods === 'object' ? d.moods : {},
    moodJournal: Array.isArray(d.moodJournal) ? d.moodJournal : Object.entries(d.moods??{}).map(([date,mood])=>({...mood,id:'legacy_'+date,date})),
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyData };
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...emptyData };
  }
}

export function useOrbitals() {
  const [data, setData] = useState<AppData>(() => loadData());
  useEffect(()=>{setData(d=>Array.isArray(d.financialRecords)?d:{...d,financialRecords:preservedFinances(d)})},[]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full or unavailable; keep working in memory
    }
  }, [data]);

  const addEntries = useCallback((date: string, texts: string[], seriesId?: string, done = false) => {
    let created: Entry[] = [];
    setData((d) => {
      const base = d.entries.filter((e) => e.date === date).length;
      created = texts
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t, i) => ({
          id: uid('e'),
          text: t,
          date,
          done,
          orbiting: false,
          seriesId,
          order: base + i,
          createdAt: Date.now(),
        }));
      if (!created.length) return d;
      return { ...d, entries: [...d.entries, ...created] };
    });
    return created;
  }, []);

  const addOrbit = useCallback((text:string) => {
    if(!text.trim())return;
    const entry:Entry={id:uid('e'),text:text.trim(),date:todayISO(),orbiting:true,done:false,order:0,createdAt:Date.now()};
    setData(d=>({...d,entries:[...d.entries,entry]}));
  },[]);
  const updateEntry = useCallback((id: string, patch: Partial<Entry>) => {
    setData((d) => ({
      ...d,
      entries: d.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      entries: d.entries.filter((e) => e.id !== id),
    }));
  }, []);

  const moveEntry = useCallback((id: string, toDate: string) => {
    setData((d) => {
      const entry = d.entries.find((e) => e.id === id);
      if (!entry || entry.date === toDate) return d;
      const trace: Trace = {
        id: uid('t'),
        entryId: id,
        text: entry.text,
        fromDate: entry.date,
        movedAt: Date.now(),
        seriesId: entry.seriesId,
      };
      return {
        ...d,
        traces: [...d.traces, trace],
        entries: d.entries.map((e) => (e.id === id ? { ...e, date: toDate, done: false } : e)),
      };
    });
  }, []);

  const letOrbit = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      entries: d.entries.map((e) =>
        e.id === id ? { ...e, orbiting: true } : e,
      ),
    }));
  }, []);

  const recallOrbital = useCallback((id: string, toDate: string) => {
    setData((d) => ({
      ...d,
      entries: d.entries.map((e) =>
        e.id === id ? { ...e, orbiting: false, date: toDate } : e,
      ),
    }));
  }, []);

  const reorderEntry = useCallback((date: string, id: string, targetId: string | null) => {
    setData((d) => {
      const inDay = d.entries
        .filter((e) => e.date === date)
        .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
      const next = moveBefore(inDay,id,targetId);
      const orders = new Map(next.map((e, i) => [e.id, i]));
      return {
        ...d,
        entries: d.entries.map((e) =>
          orders.has(e.id) ? { ...e, order: orders.get(e.id) as number } : e,
        ),
      };
    });
  }, []);

  const setMood = useCallback((date: string, mood: Mood | undefined) => {
    setData((d) => {
      const moods = { ...d.moods };
      if (mood) moods[date] = mood;
      else delete moods[date];
      return { ...d, moods };
    });
  }, []);

  const addMood = useCallback((date: string, mood: Mood, recordedAt = Date.now()) => {
    const log = {...mood,id:uid('m'),date,recordedAt};
    setData(d=>({...d,moods:{...d.moods,[date]:mood},moodJournal:[...d.moodJournal,log]}));
  },[]);
  const addEvent = useCallback((date:string,text:string,time?:string,note?:string)=>{
    const entry:Entry={id:uid('e'),text:text.trim(),date,time,note,kind:'event',done:false,orbiting:false,order:0,createdAt:Date.now()};
    if(entry.text&&date)setData(d=>({...d,entries:[...d.entries,entry]}));
  },[]);
  // Recurring series
  const addSeries = useCallback((series: Omit<RecurringSeries, 'id' | 'createdAt'>) => {
    const s: RecurringSeries = { ...series, id: uid('s'), createdAt: Date.now() };
    setData((d) => ({ ...d, series: [...d.series, s] }));
    return s;
  }, []);

  const updateSeries = useCallback((id: string, patch: Partial<RecurringSeries>) => {
    setData((d) => ({
      ...d,
      series: d.series.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const deleteSeries = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      series: d.series.filter((s) => s.id !== id),
      entries: d.entries,
    }));
  }, []);

  const materializeRecurring = useCallback((date: string) => {
    setData((d) => {
      let changed = false;
      const entries = [...d.entries];
      for (const s of d.series) {
        if (s.paused) continue;
        if (s.skippedDates?.includes(date)) continue;
        if (!seriesOn(s, date)) continue;
        if (entries.some((e) => e.seriesId === s.id && e.date === date)) continue;
        const occ: Entry = {
          id: uid('e'),
          text: s.title,
          date,
          done: false,
          orbiting: false,
          seriesId: s.id,
          order: entries.filter((e) => e.date === date).length,
          createdAt: Date.now(),
        };
        entries.push(occ);
        changed = true;
      }
      return changed ? { ...d, entries } : d;
    });
  }, []);

  // To Buy / ledger
  const addBuyItem = useCallback(
    (text: string, kind: LedgerKind = 'expense', amount?: number, category?: string) => {
      const t = text.trim();
      if (!t) return;
      const item: BuyItem = {
        id: uid('b'),
        text: t,
        bought: false,
        createdAt: Date.now(),
        kind,
        amount,
        category,
      };
      setData((d) => ({ ...d, buyItems: [...d.buyItems, item] }));
    },
    [],
  );

  const addFinancialRecord = useCallback((text:string,kind:LedgerKind,amount:number)=>{
    if(!text.trim()||!Number.isFinite(amount)||amount<0)return;
    const item:FinancialRecord={id:uid('f'),text:text.trim(),kind,amount,createdAt:Date.now()};
    setData(d=>({...d,financialRecords:[...(d.financialRecords??preservedFinances(d)),item]}));
  },[]);
  const updateBuyItem = useCallback((id: string, patch: Partial<BuyItem>) => {
    setData((d) => ({
      ...d,
      buyItems: d.buyItems.map((b) => (b.id === id ? { ...b, ...patch, boughtAt: patch.bought === true ? Date.now() : patch.bought === false ? undefined : b.boughtAt } : b)),
    }));
  }, []);

  const deleteBuyItem = useCallback((id: string) => {
    setData((d) => ({ ...d, buyItems: d.buyItems.filter((b) => b.id !== id) }));
  }, []);

  // Constellations
  const createConstellation = useCallback(
    (name: string, entryIds: string[]): Constellation => {
      const c: Constellation = { id: uid('c'), name, entryIds, createdAt: Date.now() };
      setData((d) => ({ ...d, constellations: [...d.constellations, c] }));
      return c;
    },
    [],
  );

  const updateConstellation = useCallback(
    (id: string, patch: Partial<Pick<Constellation, 'name' | 'entryIds'>>) => {
      setData((d) => ({
        ...d,
        constellations: d.constellations.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
    },
    [],
  );

  const deleteConstellation = useCallback((id: string) => {
    setData((d) => ({ ...d, constellations: d.constellations.filter((c) => c.id !== id) }));
  }, []);

  const importArchive = useCallback((incoming: AppData) => {
    setData(sanitize(incoming));
  }, []);

  return {
    data,
    addEntries,
    addOrbit,
    updateEntry,
    deleteEntry,
    moveEntry,
    letOrbit,
    recallOrbital,
    reorderEntry,
    setMood,
    addMood,
    addEvent,
    addSeries,
    updateSeries,
    deleteSeries,
    materializeRecurring,
    addBuyItem,
    addFinancialRecord,
    updateBuyItem,
    deleteBuyItem,
    createConstellation,
    updateConstellation,
    deleteConstellation,
    importArchive,
  };
}

export function dowOf(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function seasonOf(iso: string): string {
  const [, m] = iso.split('-').map(Number);
  if (m <= 2 || m === 12) return 'Winter';
  if (m <= 5) return 'Spring';
  if (m <= 8) return 'Summer';
  return 'Autumn';
}

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7); // yyyy-mm
}

export function monthLabelOf(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
