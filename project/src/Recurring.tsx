import { useState } from 'react';
import { Pause, Play, Plus, Repeat, SkipForward, Trash2 } from 'lucide-react';
import { Modal } from './components/Modal';
import { recursOn, todayISO } from './store';
import type { RecurrenceRule, RecurringSeries } from './types';

interface RecurringProps {
  series: RecurringSeries[];
  entries: { seriesId?: string; date: string }[];
  onAdd: (s: { title: string; rule: RecurrenceRule; anchorDate: string; paused: boolean }) => void;
  onUpdate: (id: string, patch: Partial<RecurringSeries>) => void;
  onDelete: (id: string) => void;
}

const RULE_LABEL: Record<RecurrenceRule, string> = {
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
  yearly: 'Every year',
};

export function Recurring({ series, entries, onAdd, onUpdate, onDelete }: RecurringProps) {
  const [adding, setAdding] = useState(false);
  const [manageId, setManageId] = useState<string | null>(null);
  const managed = series.find((s) => s.id === manageId) ?? null;

  const occurrencesOf = (id: string) =>
    entries.filter((e) => e.seriesId === id).map((e) => e.date).sort().reverse().slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-6 sm:pt-10">
      <header className="mb-6 text-center">
        <div className="text-[11px] uppercase tracking-[0.3em] text-gold-500/80">Recurring</div>
        <h1 className="mt-1 font-serif text-2xl text-ivory-bright">Things that return</h1>
      </header>

      <ul className="space-y-2">
        {series.map((s) => {
          const today = todayISO();
          const hitsToday = !s.paused && !s.skippedDates?.includes(today) && recursOn(s.rule, s.anchorDate, today);
          return (
            <li
              key={s.id}
              className={`rounded-xl border border-gold-500/12 bg-ink-900/70 px-4 py-3.5 transition hover:border-gold-500/30 ${
                s.paused ? 'opacity-55' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-ivory">{s.title}</p>
                  <p className="mt-0.5 text-xs text-ivory-faint">
                    {RULE_LABEL[s.rule]}
                    {hitsToday && <span className="ml-2 text-gold-400">· lands today</span>}
                    {s.paused && <span className="ml-2 text-ivory-dim">· paused</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => onUpdate(s.id, { paused: !s.paused })}
                    className="rounded p-1.5 text-ivory-faint transition hover:text-gold-300"
                    title={s.paused ? 'Resume' : 'Pause'}
                    aria-label={s.paused ? 'Resume series' : 'Pause series'}
                  >
                    {s.paused ? <Play size={14} /> : <Pause size={14} />}
                  </button>
                  <button
                    onClick={() => setManageId(s.id)}
                    className="rounded p-1.5 text-ivory-faint transition hover:text-gold-300"
                    title="Manage"
                    aria-label="Manage series"
                  >
                    <Repeat size={14} />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {series.length === 0 && (
          <li className="rounded-xl border border-dashed border-gold-500/15 px-4 py-10 text-center text-sm text-ivory-faint">
            No recurring orbits yet. Add something that returns.
          </li>
        )}
      </ul>

      <button
        onClick={() => setAdding(true)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-gold-500/25 bg-gold-500/5 px-4 py-3 text-sm tracking-wide text-gold-300 transition hover:border-gold-500/50 hover:bg-gold-500/10"
      >
        <Plus size={14} />
        New recurring orbital
      </button>

      {adding && (
        <AddSeriesModal
          onClose={() => setAdding(false)}
          onSave={(s) => {
            onAdd(s);
            setAdding(false);
          }}
        />
      )}

      {managed && (
        <ManageSeriesModal
          series={managed}
          recentDates={occurrencesOf(managed.id)}
          onClose={() => setManageId(null)}
          onUpdate={onUpdate}
          onDelete={(id) => {
            onDelete(id);
            setManageId(null);
          }}
        />
      )}
    </div>
  );
}

function AddSeriesModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (s: { title: string; rule: RecurrenceRule; anchorDate: string; paused: boolean }) => void;
}) {
  const [title, setTitle] = useState('');
  const [rule, setRule] = useState<RecurrenceRule>('weekly');
  const [anchorDate, setAnchorDate] = useState(() => todayISO());
  return (
    <Modal title="New recurring orbital" onClose={onClose}>
      <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gold-500/80">Title</label>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Water the ferns"
        className="w-full rounded-xl border border-gold-500/25 bg-ink-950/70 px-3.5 py-2.5 text-ivory-bright placeholder:text-ivory-faint/60 outline-none focus:border-gold-500/60"
      />
      <label className="mb-1 mt-4 block text-xs uppercase tracking-[0.2em] text-gold-500/80">
        Returns
      </label>
      <div className="grid grid-cols-4 gap-2">
        {(['daily', 'weekly', 'monthly', 'yearly'] as RecurrenceRule[]).map((r) => (
          <button
            key={r}
            onClick={() => setRule(r)}
            className={`rounded-lg border px-2 py-2 text-xs capitalize transition ${
              rule === r
                ? 'border-gold-500/60 bg-gold-500/15 text-gold-300'
                : 'border-gold-500/20 text-ivory-dim hover:border-gold-500/40'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <label className="mb-1 mt-4 block text-xs uppercase tracking-[0.2em] text-gold-500/80">
        Anchored to
      </label>
      <input
        type="date"
        value={anchorDate}
        onChange={(e) => setAnchorDate(e.target.value)}
        className="w-full rounded-xl border border-gold-500/25 bg-ink-950/70 px-3.5 py-2.5 text-ivory outline-none focus:border-gold-500/60 [color-scheme:dark]"
      />
      <p className="mt-2 text-xs text-ivory-faint">
        {rule === 'weekly' && 'It will appear each week on this weekday.'}
        {rule === 'monthly' && 'It will appear on this day of each month.'}
        {rule === 'yearly' && 'It will appear on this date each year.'}
        {rule === 'daily' && 'It will appear every day from this date onward.'}
      </p>
      <div className="mt-5 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-full px-4 py-2 text-sm text-ivory-dim transition hover:text-ivory"
        >
          Cancel
        </button>
        <button
          disabled={!title.trim()}
          onClick={() => onSave({ title: title.trim(), rule, anchorDate, paused: false })}
          className="rounded-full border border-gold-500/40 bg-gold-500/15 px-5 py-2 text-sm text-gold-300 transition enabled:hover:bg-gold-500/25 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </Modal>
  );
}

function ManageSeriesModal({
  series,
  recentDates,
  onClose,
  onUpdate,
  onDelete,
}: {
  series: RecurringSeries;
  recentDates: string[];
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<RecurringSeries>) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const skipped = series.skippedDates ?? [];
  const today = todayISO();
  const canSkipToday =
    !skipped.includes(today) && recursOn(series.rule, series.anchorDate, today);

  return (
    <Modal title={series.title} onClose={onClose}>
      <div className="space-y-5">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gold-500/80">
            Returns
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['daily', 'weekly', 'monthly', 'yearly'] as RecurrenceRule[]).map((r) => (
              <button
                key={r}
                onClick={() => onUpdate(series.id, { rule: r })}
                className={`rounded-lg border px-2 py-2 text-xs capitalize transition ${
                  series.rule === r
                    ? 'border-gold-500/60 bg-gold-500/15 text-gold-300'
                    : 'border-gold-500/20 text-ivory-dim hover:border-gold-500/40'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gold-500/80">
            Anchored to
          </label>
          <input
            type="date"
            value={series.anchorDate}
            onChange={(e) => onUpdate(series.id, { anchorDate: e.target.value })}
            className="w-full rounded-xl border border-gold-500/25 bg-ink-950/70 px-3.5 py-2.5 text-ivory outline-none focus:border-gold-500/60 [color-scheme:dark]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onUpdate(series.id, { paused: !series.paused })}
            className="flex items-center gap-2 rounded-full border border-gold-500/25 px-4 py-2 text-sm text-ivory-dim transition hover:border-gold-500/50 hover:text-gold-300"
          >
            {series.paused ? <Play size={13} /> : <Pause size={13} />}
            {series.paused ? 'Resume' : 'Pause'}
          </button>
          {canSkipToday && (
            <button
              onClick={() =>
                onUpdate(series.id, { skippedDates: [...skipped, today] })
              }
              className="flex items-center gap-2 rounded-full border border-gold-500/25 px-4 py-2 text-sm text-ivory-dim transition hover:border-gold-500/50 hover:text-gold-300"
            >
              <SkipForward size={13} />
              Skip today
            </button>
          )}
        </div>

        {skipped.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-[0.2em] text-gold-500/80">
              Skipped days
            </p>
            <div className="flex flex-wrap gap-2">
              {skipped.map((d) => (
                <button
                  key={d}
                  onClick={() =>
                    onUpdate(series.id, {
                      skippedDates: skipped.filter((x) => x !== d),
                    })
                  }
                  className="rounded-full border border-gold-500/25 px-3 py-1 text-xs text-ivory-dim transition hover:border-gold-500/50 hover:text-gold-300"
                  title="Un-skip"
                >
                  {d} ×
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs uppercase tracking-[0.2em] text-gold-500/80">
            Recent occurrences
          </p>
          {recentDates.length ? (
            <ul className="space-y-1 text-sm text-ivory-dim">
              {recentDates.map((d) => (
                <li key={d} className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold-400/70" />
                  {d}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ivory-faint">None yet — occurrences appear on their day.</p>
          )}
          <p className="mt-2 text-xs italic text-ivory-faint/80">
            Each occurrence keeps its own history. Changes here never rewrite past days.
          </p>
        </div>

        <div className="border-t border-gold-500/15 pt-4">
          {confirmDelete ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-ivory-dim">Remove this orbit and all its occurrences?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-full px-3 py-1.5 text-xs text-ivory-dim hover:text-ivory"
                >
                  Keep
                </button>
                <button
                  onClick={() => onDelete(series.id)}
                  className="rounded-full border border-red-400/40 bg-red-400/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/20"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-sm text-ivory-faint transition hover:text-red-300"
            >
              <Trash2 size={13} />
              Remove series
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
