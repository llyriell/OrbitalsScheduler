import { useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Check, ChevronDown, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { monthKeyOf, monthLabelOf, todayISO } from './store';
import type { BuyItem, LedgerKind } from './types';

interface ToBuyProps {
  items: BuyItem[];
  onAdd: (text: string, kind: LedgerKind, amount?: number, category?: string) => void;
  onUpdate: (id: string, patch: Partial<BuyItem>) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_COLORS = [
  'rgba(216,186,110,0.9)',
  'rgba(140,180,220,0.9)',
  'rgba(190,140,200,0.85)',
  'rgba(140,200,170,0.85)',
  'rgba(220,160,120,0.85)',
  'rgba(160,160,200,0.85)',
];

export function ToBuy({ items, onAdd, onUpdate, onDelete }: ToBuyProps) {
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [kind, setKind] = useState<LedgerKind>('expense');
  const [showHistory, setShowHistory] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => monthKeyOf(todayISO()));

  const open = items.filter((i) => !i.bought);
  const bought = items.filter((i) => i.bought);

  // Ledger for the selected month
  const month = useMemo(() => {
    const inMonth = bought.filter(
      (i) => i.boughtAt && monthKeyOf(new Date(i.boughtAt).toISOString().slice(0, 10)) === monthCursor,
    );
    const expenses = inMonth.filter((i) => i.kind === 'expense');
    const income = inMonth.filter((i) => i.kind === 'income');
    const sum = (arr: BuyItem[]) => arr.reduce((a, i) => a + (i.amount ?? 0), 0);
    const byCategory = new Map<string, number>();
    for (const i of expenses) {
      const c = i.category?.trim() || 'uncatalogued';
      byCategory.set(c, (byCategory.get(c) ?? 0) + (i.amount ?? 0));
    }
    const cats = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
    const totalExp = sum(expenses);
    return {
      expenses,
      income,
      totalExp,
      totalIn: sum(income),
      cats: cats.map(([name, v], idx) => ({
        name,
        value: v,
        share: totalExp ? v / totalExp : 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      })),
    };
  }, [bought, monthCursor]);

  // month navigation: list of months that have activity, plus current
  const months = useMemo(() => {
    const s = new Set<string>([monthKeyOf(todayISO())]);
    for (const i of bought) if (i.boughtAt) s.add(monthKeyOf(new Date(i.boughtAt).toISOString().slice(0, 10)));
    return [...s].sort().reverse();
  }, [bought]);

  const submit = () => {
    if (!text.trim()) return;
    const amt = amount.trim() ? parseFloat(amount.replace(',', '.')) : undefined;
    onAdd(text, kind, Number.isFinite(amt as number) ? amt : undefined, category.trim() || undefined);
    setText('');
    setAmount('');
    setCategory('');
  };

  const shiftMonth = (dir: number) => {
    const idx = months.indexOf(monthCursor);
    const next = months[idx + dir];
    if (next) setMonthCursor(next);
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-xl px-4 pb-32 pt-6 sm:pt-10">
      <header className="mb-6 text-center">
        <div className="text-[11px] uppercase tracking-[0.3em] text-gold-500/80">To Buy</div>
        <h1 className="mt-1 font-serif text-2xl text-ivory-bright">The side ledger</h1>
      </header>

      {/* Add row */}
      <div className="glass rounded-2xl p-3">
        <div className="mb-2 flex gap-1.5">
          {(
            [
              ['expense', 'Going out', ArrowDownCircle],
              ['income', 'Coming in', ArrowUpCircle],
            ] as [LedgerKind, string, typeof ArrowDownCircle][]
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs tracking-wide transition ${
                kind === k
                  ? 'border-gold-500/50 bg-gold-500/12 text-gold-300'
                  : 'border-gold-500/15 text-ivory-faint hover:border-gold-500/35'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-2"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={kind === 'expense' ? 'What are you buying?' : 'Where is it coming from?'}
            className="w-full rounded-xl border border-gold-500/20 bg-ink-950/60 px-3.5 py-2.5 text-ivory-bright placeholder:text-ivory-faint/50 outline-none focus:border-gold-500/50"
          />
          <div className="flex gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="w-24 rounded-xl border border-gold-500/20 bg-ink-950/60 px-3.5 py-2.5 text-ivory-bright placeholder:text-ivory-faint/50 outline-none focus:border-gold-500/50"
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={kind === 'expense' ? 'category — food, rent, joy…' : 'category — salary, gift…'}
              className="min-w-0 flex-1 rounded-xl border border-gold-500/20 bg-ink-950/60 px-3.5 py-2.5 text-ivory-bright placeholder:text-ivory-faint/50 outline-none focus:border-gold-500/50"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex items-center rounded-xl border border-gold-500/40 bg-gold-500/15 px-4 text-sm text-gold-300 transition enabled:hover:bg-gold-500/25 disabled:opacity-40"
              aria-label="Add entry"
            >
              <Plus size={15} />
            </button>
          </div>
        </form>
      </div>

      {/* Open list */}
      <ul className="mt-5 space-y-2">
        {open.map((i) => (
          <li
            key={i.id}
            className="group glass-soft flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:border-gold-500/30"
          >
            <button
              onClick={() =>
                onUpdate(i.id, {
                  bought: true,
                  boughtAt: Date.now(),
                  amount: i.amount ?? 0,
                })
              }
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ivory-faint/60 text-transparent transition hover:border-gold-400 hover:text-gold-500/50 ${
                i.kind === 'income' ? 'border-emerald-300/50' : ''
              }`}
              aria-label="Mark settled"
            >
              <Check size={12} strokeWidth={3} />
            </button>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-serif text-ivory">{i.text}</span>
              {i.category && (
                <span className="text-[11px] text-ivory-faint">{i.category}</span>
              )}
            </span>
            {i.amount !== undefined && (
              <span
                className={`shrink-0 text-sm tabular-nums ${
                  i.kind === 'income' ? 'text-emerald-300/90' : 'text-ivory-dim'
                }`}
              >
                {i.kind === 'income' ? '+' : '−'}
                {i.amount.toFixed(2)}
              </span>
            )}
            <button
              onClick={() => onDelete(i.id)}
              className="shrink-0 rounded p-1.5 text-ivory-faint opacity-0 transition hover:text-red-300 group-hover:opacity-100"
              aria-label="Remove"
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
        {open.length === 0 && (
          <li className="rounded-2xl border border-dashed border-gold-500/15 px-4 py-8 text-center text-sm text-ivory-faint">
            Nothing pending. The ledger rests.
          </li>
        )}
      </ul>

      {/* Monthly flows */}
      <section className="glass mt-8 rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg text-ivory-bright">
            {monthLabelOf(monthCursor)}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => shiftMonth(1)}
              disabled={monthCursor === months[0]}
              className="rounded-full p-1.5 text-ivory-faint transition hover:text-gold-300 disabled:opacity-25"
              aria-label="Newer month"
            >
              <ChevronDown size={15} className="rotate-180" />
            </button>
            <button
              onClick={() => shiftMonth(-1)}
              disabled={monthCursor === months[months.length - 1]}
              className="rounded-full p-1.5 text-ivory-faint transition hover:text-gold-300 disabled:opacity-25"
              aria-label="Older month"
            >
              <ChevronDown size={15} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gold-500/15 bg-ink-950/40 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-ivory-faint">
              <ArrowDownCircle size={12} />
              Going out
            </div>
            <p className="mt-1 font-serif text-xl tabular-nums text-ivory-bright">
              {month.totalExp.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-300/15 bg-ink-950/40 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-ivory-faint">
              <ArrowUpCircle size={12} />
              Coming in
            </div>
            <p className="mt-1 font-serif text-xl tabular-nums text-emerald-300/90">
              {month.totalIn.toFixed(2)}
            </p>
          </div>
        </div>

        {month.cats.length > 0 && (
          <div className="mt-5">
            {/* thin orbit-line bar of categories */}
            <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-gold-500/15">
              {month.cats.map((c) => (
                <div
                  key={c.name}
                  style={{ width: `${c.share * 100}%`, background: c.color }}
                  title={`${c.name}: ${c.value.toFixed(2)}`}
                />
              ))}
            </div>
            <ul className="mt-3 space-y-1.5">
              {month.cats.map((c) => (
                <li key={c.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: c.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-ivory-dim">{c.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-ivory-faint">
                    {Math.round(c.share * 100)}%
                  </span>
                  <span className="w-20 shrink-0 text-right text-sm tabular-nums text-ivory">
                    {c.value.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {month.cats.length === 0 && (
          <p className="mt-4 text-center text-xs italic text-ivory-faint">
            Settled entries with amounts will chart here, month by month.
          </p>
        )}
      </section>

      {/* Bought history */}
      {bought.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="text-xs uppercase tracking-[0.2em] text-gold-500/70 transition hover:text-gold-400"
          >
            {showHistory ? 'Hide' : 'Show'} settled history ({bought.length})
          </button>
          {showHistory && (
            <ul className="mt-3 space-y-1.5">
              {bought.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate text-ivory-faint line-through decoration-gold-500/40">
                    {i.text}
                    {i.category ? ` · ${i.category}` : ''}
                  </span>
                  {i.amount !== undefined && (
                    <span
                      className={`shrink-0 text-xs tabular-nums ${
                        i.kind === 'income' ? 'text-emerald-300/70' : 'text-ivory-faint'
                      }`}
                    >
                      {i.kind === 'income' ? '+' : '−'}
                      {i.amount.toFixed(2)}
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-ivory-faint/70">
                    {i.boughtAt ? new Date(i.boughtAt).toLocaleDateString() : ''}
                  </span>
                  <button
                    onClick={() => onUpdate(i.id, { bought: false, boughtAt: undefined })}
                    className="shrink-0 rounded p-1 text-ivory-faint transition hover:text-gold-300"
                    title="Return to list"
                    aria-label="Return to list"
                  >
                    <RotateCcw size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
