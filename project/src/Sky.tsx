import { useMemo, useState } from 'react';
import { Link2, Moon, Star, Trash2, X } from 'lucide-react';
import { Modal } from './components/Modal';
import { MoodGlyph } from './components/Mood';
import { seasonOf } from './store';
import type { AppData, Constellation, Entry } from './types';

interface SkyProps {
  data: AppData;
  onCreate: (name: string, entryIds: string[]) => void;
  onUpdate: (id: string, patch: Partial<Pick<Constellation, 'name' | 'entryIds'>>) => void;
  onDelete: (id: string) => void;
  onOpenDay: (date: string) => void;
  onRecall: (id: string, toDate: string) => void;
}

type Mode = 'map' | 'constellations' | 'browse' | 'undated';

export function Sky({ data, onCreate, onUpdate, onDelete, onOpenDay, onRecall }: SkyProps) {
  const [mode, setMode] = useState<Mode>('map');
  return (
    <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-32 pt-6 sm:pt-10">
      <header className="mb-6 text-center">
        <div className="text-[11px] uppercase tracking-[0.3em] text-gold-500/80">Sky</div>
        <h1 className="mt-1 font-serif text-2xl text-ivory-bright">Everything under the sky</h1>
      </header>

      <div className="mb-6 flex justify-center gap-1 rounded-full glass p-1 text-sm">
        {(
          [
            ['map', 'Sky map'],
            ['constellations', 'Constellations'],
            ['browse', 'By date'],
            ['undated', 'Orbiting'],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1.5 transition ${
              mode === m ? 'bg-gold-500/15 text-gold-300' : 'text-ivory-dim hover:text-ivory'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'map' && <SkyMap data={data} onOpenDay={onOpenDay} />}
      {mode === 'constellations' && (
        <Constellations
          data={data}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onOpenDay={onOpenDay}
        />
      )}
      {mode === 'browse' && <Browse data={data} onOpenDay={onOpenDay} />}
      {mode === 'undated' && <Orbiting data={data} onRecall={onRecall} />}
    </div>
  );
}

/* ---------- Sky map: each day a star, tasks as orbiting moons ---------- */

function SkyMap({ data, onOpenDay }: { data: AppData; onOpenDay: (date: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const dayStars = useMemo(() => {
    const byDate = new Map<string, Entry[]>();
    for (const e of data.entries) {
      if (!e.date) continue;
      const arr = byDate.get(e.date) ?? [];
      arr.push(e);
      byDate.set(e.date, arr);
    }
    const dates = [...byDate.keys()].sort();
    const cx = 50;
    const cy = 52;
    return dates.map((d, i) => {
      const n = dates.length;
      // spiral outward: newest at center
      const ring = n <= 1 ? 0 : i < n - 1 ? 14 + (i / (n - 1)) * 30 : 4;
      const angle = (i / Math.max(n, 1)) * Math.PI * 2.4 - Math.PI / 2;
      const entries = (byDate.get(d) ?? []).sort((a, b) => a.order - b.order);
      const openCount = entries.filter((e) => !e.done).length;
      return {
        date: d,
        x: cx + Math.cos(angle) * ring,
        y: cy + Math.sin(angle) * ring,
        r: 2.2 + Math.min(entries.length, 8) * 0.5 + (openCount > 0 ? 0.8 : 0),
        bright: openCount > 0,
        entries,
        mood: data.moods[d],
      };
    });
  }, [data.entries, data.moods]);

  const selectedStar = dayStars.find((s) => s.date === selected) ?? null;

  return (
    <div>
      <div className="glass rounded-3xl p-2">
        <svg
          viewBox="0 0 100 104"
          className="h-[22rem] w-full sm:h-[26rem]"
          role="img"
          aria-label="Sky map of days"
        >
          {/* orbit rings */}
          {[10, 20, 30, 40].map((r) => (
            <circle
              key={r}
              cx="50"
              cy="52"
              r={r}
              fill="none"
              stroke="rgba(200,168,90,0.09)"
              strokeWidth="0.25"
            />
          ))}

          {/* filaments between consecutive day-stars */}
          {dayStars.slice(1).map((s, i) => {
            const p = dayStars[i];
            return (
              <line
                key={`l-${s.date}`}
                x1={p.x}
                y1={p.y}
                x2={s.x}
                y2={s.y}
                stroke="rgba(216,186,110,0.18)"
                strokeWidth="0.3"
                strokeDasharray="1 1.4"
              />
            );
          })}

          {dayStars.map((s) => {
            const on = selected === s.date;
            return (
              <g key={s.date} onClick={() => setSelected(on ? null : s.date)} className="cursor-pointer">
                <circle cx={s.x} cy={s.y} r={s.r + 4} fill="transparent" />
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={s.r}
                  fill={s.bright ? '#e8d29a' : 'rgba(232,210,154,0.45)'}
                  stroke={on ? '#fffdf6' : 'none'}
                  strokeWidth="0.5"
                />
                {/* task moons on a small orbit ring around the day-star */}
                {s.entries.map((e, mi) => {
                  const ma = (mi / Math.max(s.entries.length, 1)) * Math.PI * 2;
                  const orb = s.r + 2.6;
                  return (
                    <circle
                      key={e.id}
                      cx={s.x + Math.cos(ma) * orb}
                      cy={s.y + Math.sin(ma) * orb}
                      r={e.done ? 0.55 : 0.9}
                      fill={e.done ? 'rgba(185,179,162,0.55)' : '#fffdf6'}
                      opacity={e.done ? 0.5 : 0.95}
                    />
                  );
                })}
                {/* faint orbit line through the moons */}
                {s.entries.length > 0 && (
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={s.r + 2.6}
                    fill="none"
                    stroke="rgba(242,234,217,0.14)"
                    strokeWidth="0.2"
                  />
                )}
                <text
                  x={s.x}
                  y={s.y - s.r - 1.6}
                  textAnchor="middle"
                  fontSize="2.6"
                  fill={on ? '#fffdf6' : 'rgba(242,234,217,0.7)'}
                  className="pointer-events-none select-none"
                >
                  {s.date.slice(5)}
                </text>
              </g>
            );
          })}
          {dayStars.length === 0 && (
            <text x="50" y="53" textAnchor="middle" fontSize="3.5" fill="rgba(125,122,110,0.8)">
              An empty sky — add your first tasks
            </text>
          )}
        </svg>
      </div>

      {/* Detail card under the map */}
      {selectedStar && (
        <div className="glass mt-4 rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MoodGlyph mood={selectedStar.mood} size={15} />
              <h3 className="font-serif text-lg text-ivory-bright">{selectedStar.date}</h3>
              <span className="text-xs text-ivory-faint">{seasonOf(selectedStar.date)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onOpenDay(selectedStar.date)}
                className="rounded-full border border-gold-500/30 px-3 py-1 text-xs text-gold-300 transition hover:bg-gold-500/10"
              >
                Open this day
              </button>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-1 text-ivory-faint transition hover:text-ivory"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <ul className="space-y-1.5">
            {selectedStar.entries.map((e) => (
              <li key={e.id} className="flex items-start gap-2 text-sm">
                <Star
                  size={10}
                  className={`mt-1 shrink-0 ${e.done ? 'text-ivory-faint' : 'text-gold-400'}`}
                  fill="currentColor"
                />
                <span className="min-w-0 flex-1">
                  <span className={e.done ? 'text-ivory-faint line-through' : 'text-ivory'}>
                    {e.text}
                  </span>
                  {e.note && <span className="block text-xs italic text-ivory-faint">{e.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!selectedStar && (
        <p className="mt-4 text-center text-xs italic text-ivory-faint">
          Each day is a star; its tasks orbit like moons. Days with open work glow brightest. Tap a
          star to peek inside.
        </p>
      )}
    </div>
  );
}

/* ---------- Constellations ---------- */

function Constellations({
  data,
  onCreate,
  onUpdate,
  onDelete,
  onOpenDay,
}: {
  data: AppData;
  onCreate: (name: string, entryIds: string[]) => void;
  onUpdate: (id: string, patch: Partial<Pick<Constellation, 'name' | 'entryIds'>>) => void;
  onDelete: (id: string) => void;
  onOpenDay: (date: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = data.constellations.find((c) => c.id === openId) ?? null;

  return (
    <div>
      <ul className="space-y-3">
        {data.constellations.map((c) => {
          const entries = c.entryIds
            .map((id) => data.entries.find((e) => e.id === id))
            .filter((e): e is Entry => Boolean(e));
          return (
            <li key={c.id}>
              <button
                onClick={() => setOpenId(c.id)}
                className="glass-soft flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition hover:border-gold-500/35"
              >
                <MiniConstellation count={entries.length} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-lg text-ivory-bright">{c.name}</span>
                  <span className="text-xs text-ivory-faint">
                    {entries.length} star{entries.length === 1 ? '' : 's'} ·{' '}
                    {entries
                      .map((e) => e.date)
                      .filter((d, i, a) => d && a.indexOf(d) === i)
                      .slice(0, 3)
                      .join(', ')}
                  </span>
                </span>
                <Star size={14} className="shrink-0 text-gold-500/60" />
              </button>
            </li>
          );
        })}
        {data.constellations.length === 0 && (
          <li className="rounded-2xl border border-dashed border-gold-500/15 px-4 py-10 text-center text-sm text-ivory-faint">
            No constellations yet. Connect entries from different days and see what they form.
          </li>
        )}
      </ul>

      <button
        onClick={() => setCreating(true)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-gold-500/25 bg-gold-500/5 px-4 py-3 text-sm tracking-wide text-gold-300 backdrop-blur transition hover:border-gold-500/50 hover:bg-gold-500/10"
      >
        <Link2 size={14} />
        Draw a new constellation
      </button>

      {creating && (
        <ConstellationPicker
          data={data}
          initialName=""
          selected={[]}
          onDone={(name, ids) => {
            if (name.trim() && ids.length >= 2) onCreate(name.trim(), ids);
            setCreating(false);
          }}
          onClose={() => setCreating(false)}
        />
      )}

      {open && (
        <Modal title={open.name} onClose={() => setOpenId(null)} wide>
          <ConstellationDetail
            data={data}
            constellation={open}
            onUpdate={onUpdate}
            onDelete={(id) => {
              onDelete(id);
              setOpenId(null);
            }}
            onOpenDay={(d) => {
              setOpenId(null);
              onOpenDay(d);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function ConstellationDetail({
  data,
  constellation,
  onUpdate,
  onDelete,
  onOpenDay,
}: {
  data: AppData;
  constellation: Constellation;
  onUpdate: (id: string, patch: Partial<Pick<Constellation, 'name' | 'entryIds'>>) => void;
  onDelete: (id: string) => void;
  onOpenDay: (date: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const entries = constellation.entryIds
    .map((id) => data.entries.find((e) => e.id === id))
    .filter((e): e is Entry => Boolean(e));

  return (
    <div>
      <ConstellationSvg
        points={entries.map((e, i) => ({
          id: e.id,
          label: e.text,
          x: starX(i, entries.length),
          y: starY(i, entries.length),
          dim: e.done,
        }))}
        onSelect={(id) => {
          const e = data.entries.find((x) => x.id === id);
          if (e) onOpenDay(e.date);
        }}
      />

      <div className="mt-4 flex items-center justify-between gap-3">
        {renaming ? (
          <input
            autoFocus
            defaultValue={constellation.name}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v) onUpdate(constellation.id, { name: v });
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') setRenaming(false);
            }}
            className="min-w-0 flex-1 rounded border border-gold-500/40 bg-ink-800 px-2 py-1 font-serif text-ivory-bright outline-none"
          />
        ) : (
          <button
            onClick={() => setRenaming(true)}
            className="min-w-0 flex-1 text-left font-serif text-lg text-ivory-bright hover:text-gold-300"
          >
            {constellation.name}
          </button>
        )}
        <button
          onClick={() => setPickerOpen(true)}
          className="shrink-0 rounded-full border border-gold-500/30 px-3 py-1.5 text-xs text-gold-300 transition hover:bg-gold-500/10"
        >
          Edit stars
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="group glass-soft flex items-center gap-3 rounded-xl px-3 py-2.5">
            <Star
              size={11}
              className={`shrink-0 ${e.done ? 'text-ivory-faint' : 'text-gold-400'}`}
              fill="currentColor"
            />
            <button onClick={() => onOpenDay(e.date)} className="min-w-0 flex-1 text-left">
              <span className={`block truncate text-sm ${e.done ? 'text-ivory-faint' : 'text-ivory'}`}>
                {e.text}
              </span>
              <span className="text-xs text-ivory-faint">
                {e.date} · {seasonOf(e.date)}
              </span>
            </button>
            <button
              onClick={() =>
                onUpdate(constellation.id, {
                  entryIds: constellation.entryIds.filter((id) => id !== e.id),
                })
              }
              className="shrink-0 rounded p-1 text-ivory-faint opacity-0 transition hover:text-red-300 group-hover:opacity-100"
              aria-label="Unlink star"
            >
              <X size={13} />
            </button>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="text-sm text-ivory-faint">
            All stars have drifted away. Edit stars to add more.
          </li>
        )}
      </ul>

      <div className="mt-6 border-t border-gold-500/15 pt-4">
        {confirmDelete ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ivory-dim">
              Scatter this constellation? Entries stay in their days.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-full px-3 py-1.5 text-xs text-ivory-dim hover:text-ivory"
              >
                Keep
              </button>
              <button
                onClick={() => onDelete(constellation.id)}
                className="rounded-full border border-red-400/40 bg-red-400/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/20"
              >
                Scatter
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 text-sm text-ivory-faint transition hover:text-red-300"
          >
            <Trash2 size={13} />
            Scatter constellation
          </button>
        )}
      </div>

      {pickerOpen && (
        <ConstellationPicker
          data={data}
          initialName={constellation.name}
          selected={constellation.entryIds}
          onDone={(_name, ids) => {
            onUpdate(constellation.id, { entryIds: ids });
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

/* ---------- Star picker ---------- */

function ConstellationPicker({
  data,
  initialName,
  selected,
  onDone,
  onClose,
}: {
  data: AppData;
  initialName: string;
  selected: string[];
  onDone: (name: string, ids: string[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [picked, setPicked] = useState<string[]>(selected);
  const [filter, setFilter] = useState('');

  const candidates = useMemo(
    () =>
      data.entries
        .filter((e) => e.date || e.orbiting)
        .filter((e) => e.text.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order)
        .slice(0, 120),
    [data.entries, filter],
  );

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Modal title="Draw a constellation" onClose={onClose} wide>
      {!initialName && (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this constellation…"
          className="mb-4 w-full rounded-xl border border-gold-500/25 bg-ink-950/70 px-3.5 py-2.5 font-serif text-ivory-bright placeholder:text-ivory-faint/60 outline-none focus:border-gold-500/60"
        />
      )}
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search entries or notes…"
        className="mb-3 w-full rounded-xl border border-gold-500/20 bg-ink-950/70 px-3.5 py-2 text-sm text-ivory placeholder:text-ivory-faint/60 outline-none focus:border-gold-500/50"
      />
      <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
        {candidates.map((e) => {
          const on = picked.includes(e.id);
          return (
            <li key={e.id}>
              <button
                onClick={() => toggle(e.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                  on ? 'border-gold-500/50 bg-gold-500/10' : 'border-transparent hover:border-gold-500/25'
                }`}
              >
                <Star
                  size={12}
                  className={`shrink-0 ${on ? 'text-gold-300' : 'text-ivory-faint/50'}`}
                  fill={on ? 'currentColor' : 'none'}
                />
                <span className={`min-w-0 flex-1 truncate text-sm ${on ? 'text-ivory-bright' : 'text-ivory-dim'}`}>
                  {e.text}
                </span>
                <span className="shrink-0 text-xs text-ivory-faint">
                  {e.orbiting ? 'orbiting' : e.date}
                </span>
              </button>
            </li>
          );
        })}
        {candidates.length === 0 && (
          <li className="py-6 text-center text-sm text-ivory-faint">No entries match.</li>
        )}
      </ul>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-ivory-faint">
          {picked.length} star{picked.length === 1 ? '' : 's'} picked
        </span>
        <button
          onClick={() => onDone(name, picked)}
          disabled={!name.trim() || picked.length < 2}
          className="rounded-full border border-gold-500/40 bg-gold-500/15 px-5 py-2 text-sm text-gold-300 transition enabled:hover:bg-gold-500/25 disabled:opacity-40"
        >
          {initialName ? 'Save stars' : 'Create constellation'}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Browse by date / season ---------- */

function Browse({ data, onOpenDay }: { data: AppData; onOpenDay: (date: string) => void }) {
  const [season, setSeason] = useState<string>('All');

  const dates = useMemo(() => {
    const set = new Map<string, number>();
    for (const e of data.entries) {
      if (!e.date) continue;
      set.set(e.date, (set.get(e.date) ?? 0) + 1);
    }
    for (const t of data.traces) set.set(t.fromDate, (set.get(t.fromDate) ?? 0) + 1);
    return [...set.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [data.entries, data.traces]);

  const filtered = dates.filter(([d]) => season === 'All' || seasonOf(d) === season).slice(0, 40);

  return (
    <div>
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {['All', 'Spring', 'Summer', 'Autumn', 'Winter'].map((s) => (
          <button
            key={s}
            onClick={() => setSeason(s)}
            className={`rounded-full border px-3.5 py-1 text-xs tracking-wide transition ${
              season === s
                ? 'border-gold-500/60 bg-gold-500/15 text-gold-300'
                : 'border-gold-500/20 text-ivory-dim hover:border-gold-500/45'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.map(([date, count]) => (
          <li key={date}>
            <button
              onClick={() => onOpenDay(date)}
              className="glass-soft flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:border-gold-500/35"
            >
              <span>
                <span className="block font-serif text-ivory">{formatDay(date)}</span>
                <span className="text-xs text-ivory-faint">
                  {seasonOf(date)} · {count} orbital{count === 1 ? '' : 's'}
                </span>
              </span>
              <Star size={12} className="text-gold-500/50" />
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-dashed border-gold-500/15 px-4 py-10 text-center text-sm text-ivory-faint">
            No dated entries here yet.
          </li>
        )}
      </ul>
    </div>
  );
}

/* ---------- Undated / orbiting ---------- */

function Orbiting({ data, onRecall }: { data: AppData; onRecall: (id: string, toDate: string) => void }) {
  const orbiting = data.entries.filter((e) => e.orbiting).sort((a, b) => b.createdAt - a.createdAt);
  const tracedTo = new Map<string, string>();
  for (const t of data.traces) tracedTo.set(t.entryId, t.fromDate);

  return (
    <div>
      <p className="mb-5 text-center text-sm italic text-ivory-faint">
        Orbitals set loose without a date. Bring one back to a day when it's time.
      </p>
      <ul className="space-y-2">
        {orbiting.map((e) => {
          const origin = tracedTo.get(e.id);
          return (
            <li key={e.id} className="glass-soft flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
              <Moon size={13} className="shrink-0 text-gold-400/70" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif text-ivory">{e.text}</span>
                {origin && (
                  <span className="text-xs text-ivory-faint">
                    once on {origin} · {seasonOf(origin)}
                  </span>
                )}
              </span>
              <input
                type="date"
                onChange={(ev) => {
                  if (ev.target.value) onRecall(e.id, ev.target.value);
                }}
                className="shrink-0 rounded-lg border border-gold-500/25 bg-ink-950/70 px-2.5 py-1.5 text-xs text-ivory-dim outline-none focus:border-gold-500/60 [color-scheme:dark]"
                aria-label={`Bring back ${e.text}`}
              />
            </li>
          );
        })}
        {orbiting.length === 0 && (
          <li className="rounded-2xl border border-dashed border-gold-500/15 px-4 py-10 text-center text-sm text-ivory-faint">
            Nothing is orbiting right now.
          </li>
        )}
      </ul>
    </div>
  );
}

/* ---------- SVG helpers ---------- */

function starX(i: number, n: number): number {
  const ring = n <= 3 ? 0.5 : 0.32 + (i % 2) * 0.18;
  const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
  return 50 + Math.cos(angle) * ring * 42;
}

function starY(i: number, n: number): number {
  const ring = n <= 3 ? 0.5 : 0.32 + (i % 2) * 0.18;
  const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
  return 50 + Math.sin(angle) * ring * 42;
}

interface StarPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  dim?: boolean;
}

function ConstellationSvg({ points, onSelect }: { points: StarPoint[]; onSelect?: (id: string) => void }) {
  return (
    <div className="rounded-2xl border border-gold-500/15 bg-gradient-to-b from-ink-950/80 to-ink-800/80 p-2">
      <svg viewBox="0 0 100 100" className="h-64 w-full sm:h-80" role="img" aria-label="Constellation view">
        {[14, 24, 34, 42].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="rgba(200,168,90,0.10)" strokeWidth="0.3" />
        ))}
        {points.slice(1).map((p, i) => {
          const prev = points[i];
          return (
            <line
              key={`l-${p.id}`}
              x1={prev.x}
              y1={prev.y}
              x2={p.x}
              y2={p.y}
              stroke="rgba(216,186,110,0.35)"
              strokeWidth="0.4"
              strokeDasharray="1.2 1.2"
            />
          );
        })}
        {points.map((p) => (
          <g key={p.id} onClick={() => onSelect?.(p.id)} className={onSelect ? 'cursor-pointer' : undefined}>
            <circle cx={p.x} cy={p.y} r="4" fill="transparent" />
            <circle cx={p.x} cy={p.y} r="1.6" fill={p.dim ? 'rgba(185,179,162,0.6)' : '#e8d29a'} />
            <circle cx={p.x} cy={p.y} r="0.6" fill={p.dim ? '#b9b3a2' : '#fffdf6'} />
            <text
              x={p.x}
              y={p.y - 3.2}
              textAnchor="middle"
              fontSize="2.6"
              fill={p.dim ? 'rgba(125,122,110,0.9)' : 'rgba(242,234,217,0.85)'}
              className="pointer-events-none select-none"
            >
              {p.label.length > 18 ? `${p.label.slice(0, 17)}…` : p.label}
            </text>
          </g>
        ))}
        {points.length === 0 && (
          <text x="50" y="51" textAnchor="middle" fontSize="3.5" fill="rgba(125,122,110,0.8)">
            An empty sky
          </text>
        )}
      </svg>
    </div>
  );
}

function MiniConstellation({ count }: { count: number }) {
  const n = Math.min(Math.max(count, 2), 6);
  const pts = Array.from({ length: n }, (_, i) => ({ x: starX(i, n), y: starY(i, n) }));
  return (
    <svg viewBox="0 0 100 100" className="h-10 w-10 shrink-0" aria-hidden>
      {pts.slice(1).map((p, i) => (
        <line
          key={i}
          x1={pts[i].x}
          y1={pts[i].y}
          x2={p.x}
          y2={p.y}
          stroke="rgba(216,186,110,0.4)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      ))}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="#e8d29a" />
      ))}
    </svg>
  );
}

function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
