import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Moon, Repeat, Settings2, ShoppingCart, Star } from 'lucide-react';
import { Today } from './Today';
import { Recurring } from './Recurring';
import { ToBuy } from './ToBuy';
import { Sky } from './Sky';
import { Evol, type EvolTarget } from './Evol';
import { SkyBackdrop } from './components/SkyBackdrop';
import { useSwipe } from './components/useSwipe';
import { useOrbitals, todayISO } from './store';
import type { AppData } from './types';

type Tab = 'today' | 'recurring' | 'buy' | 'sky';
const TAB_ORDER: Tab[] = ['today', 'recurring', 'buy', 'sky'];

export default function App() {
  const o = useOrbitals();
  const [tab, setTab] = useState<Tab>('today');
  const [evolTarget, setEvolTarget] = useState<EvolTarget | null>(null);
  const [viewDate, setViewDate] = useState<string | null>(null);

  const orbitingCount = useMemo(
    () => o.data.entries.filter((e) => e.orbiting).length,
    [o.data.entries],
  );

  const openDay = (date: string) => {
    setViewDate(date);
    setTab('today');
  };

  const swipe = useSwipe(
    () => setTab((t) => TAB_ORDER[Math.min(TAB_ORDER.indexOf(t) + 1, TAB_ORDER.length - 1)]),
    () => setTab((t) => TAB_ORDER[Math.max(TAB_ORDER.indexOf(t) - 1, 0)]),
  );

  const applyPlan: React.ComponentProps<typeof Evol>['onApplyPlan'] = (items) => {
    if (!evolTarget || evolTarget.kind !== 'day') return;
    const date = evolTarget.date;
    const dayEntries = o.data.entries.filter((e) => e.date === date);
    const toAdd: string[] = [];
    for (const it of items) {
      const existing = dayEntries.find(
        (e) => e.text.toLowerCase() === it.text.toLowerCase() && e.seriesId === undefined,
      );
      switch (it.op) {
        case 'add':
          if (existing) o.updateEntry(existing.id, { done: false });
          else toAdd.push(it.text);
          break;
        case 'complete':
          if (existing) o.updateEntry(existing.id, { done: true });
          else toAdd.push(it.text);
          break;
        case 'remove':
          if (existing) o.deleteEntry(existing.id);
          break;
        default:
          break;
      }
    }
    if (toAdd.length) o.addEntries(date, toAdd);
  };

  // Yesterday's unfinished tasks notice
  const yesterday = useMemo(() => {
    const t = todayISO();
    const [y, m, d] = t.split('-').map(Number);
    const dt = new Date(y, m - 1, d - 1);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }, []);
  const yesterdayUnfinished = useMemo(
    () => o.data.entries.filter((e) => e.date === yesterday && !e.done).length,
    [o.data.entries, yesterday],
  );

  const counts = {
    buyOpen: o.data.buyItems.filter((b) => !b.bought).length,
  };

  const activeDate = viewDate ?? todayISO();

  return (
    <div className="sky-bg min-h-screen" {...swipe}>
      <SkyBackdrop data={o.data} date={activeDate} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gold-500/10 bg-ink-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Star size={15} className="text-gold-400 glow-star" fill="currentColor" />
            <span className="font-serif text-lg tracking-wide text-ivory-bright">Orbitals</span>
          </div>
          <button
            onClick={() => setEvolTarget({ kind: 'day', date: activeDate })}
            className="flex items-center gap-1.5 rounded-full border border-gold-500/25 px-3 py-1.5 text-xs tracking-wide text-gold-300 backdrop-blur transition hover:border-gold-500/50 hover:bg-gold-500/10"
          >
            <Settings2 size={13} />
            Evol
          </button>
        </div>
      </header>

      <main>
        {tab === 'today' && (
          <Today
            key={activeDate}
            entries={o.data.entries}
            mood={o.data.moods[activeDate]}
            onAdd={(texts) => o.addEntries(activeDate, texts)}
            onToggleDone={(id, done) => o.updateEntry(id, { done })}
            onMove={(id, toDate) => o.moveEntry(id, toDate)}
            onLetOrbit={(id) => o.letOrbit(id)}
            onReorder={(date, id, targetId) => o.reorderEntry(date, id, targetId)}
            onUpdateText={(id, text) => o.updateEntry(id, { text })}
            onUpdateNote={(id, note) => o.updateEntry(id, { note: note || undefined })}
            onSetMood={(m) => o.setMood(activeDate, m)}
          />
        )}
        {tab === 'recurring' && (
          <Recurring
            series={o.data.series}
            entries={o.data.entries}
            onAdd={(s) => o.addSeries(s)}
            onUpdate={(id, patch) => o.updateSeries(id, patch)}
            onDelete={(id) => o.deleteSeries(id)}
          />
        )}
        {tab === 'buy' && (
          <ToBuy
            items={o.data.buyItems}
            onAdd={(t, kind, amount, category) => o.addBuyItem(t, kind, amount, category)}
            onUpdate={(id, patch) => o.updateBuyItem(id, patch)}
            onDelete={(id) => o.deleteBuyItem(id)}
          />
        )}
        {tab === 'sky' && (
          <Sky
            data={o.data}
            onCreate={(name, ids) => o.createConstellation(name, ids)}
            onUpdate={(id, patch) => o.updateConstellation(id, patch)}
            onDelete={(id) => o.deleteConstellation(id)}
            onOpenDay={openDay}
            onRecall={(id, toDate) => o.recallOrbital(id, toDate)}
          />
        )}
      </main>

      <Materialize onTick={() => o.materializeRecurring(todayISO())} />

      {/* Yesterday notice */}
      {tab === 'today' && !viewDate && yesterdayUnfinished > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4">
          <button
            onClick={() => {
              setViewDate(yesterday);
              setTab('today');
            }}
            className="glass pointer-events-auto rounded-full px-4 py-2 text-xs text-ivory-dim transition hover:text-gold-300"
          >
            {yesterdayUnfinished} unfinished from yesterday — decide what to do with them
          </button>
        </div>
      )}

      {/* Bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-500/10 bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around px-2 py-1.5">
          {(
            [
              ['today', 'Today', CalendarDays],
              ['recurring', 'Recurring', Repeat],
              ['buy', 'To Buy', ShoppingCart],
              ['sky', 'Sky', Moon],
            ] as [Tab, string, typeof CalendarDays][]
          ).map(([t, label, Icon]) => {
            const active = tab === t;
            const badge =
              t === 'sky' && orbitingCount > 0
                ? orbitingCount
                : t === 'buy' && counts.buyOpen > 0
                  ? counts.buyOpen
                  : undefined;
            return (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  if (t === 'today') setViewDate(null);
                }}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] tracking-wide transition ${
                  active ? 'text-gold-300' : 'text-ivory-faint hover:text-ivory-dim'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.7} />
                {label}
                {badge !== undefined && (
                  <span className="absolute right-2 top-0.5 rounded-full bg-gold-500/20 px-1.5 text-[9px] text-gold-300">
                    {badge}
                  </span>
                )}
                {active && <span className="absolute inset-x-6 top-0 h-px bg-gold-400/70" />}
              </button>
            );
          })}
        </div>
      </nav>

      {evolTarget && (
        <Evol
          data={o.data}
          target={evolTarget}
          onApplyPlan={applyPlan}
          onImport={(d: AppData) => o.importArchive(d)}
          onClose={() => setEvolTarget(null)}
        />
      )}
    </div>
  );
}

function Materialize({ onTick }: { onTick: () => void }) {
  useEffect(() => {
    onTick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
