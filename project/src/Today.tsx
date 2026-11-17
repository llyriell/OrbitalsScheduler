import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  GripVertical,
  Move,
  NotebookPen,
  Send,
  Sparkles,
  Wind,
} from 'lucide-react';
import { Modal } from './components/Modal';
import { MoodPicker } from './components/Mood';
import { addDaysISO, formatDateLong, todayISO } from './store';
import type { Entry, Mood } from './types';

interface TodayProps {
  entries: Entry[];
  mood?: Mood;
  onAdd: (texts: string[]) => void;
  onToggleDone: (id: string, done: boolean) => void;
  onMove: (id: string, toDate: string) => void;
  onLetOrbit: (id: string) => void;
  onReorder: (date: string, id: string, targetId: string | null) => void;
  onUpdateText: (id: string, text: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onSetMood: (mood: Mood | undefined) => void;
}

export function Today({
  entries,
  mood,
  onAdd,
  onToggleDone,
  onMove,
  onLetOrbit,
  onReorder,
  onUpdateText,
  onUpdateNote,
  onSetMood,
}: TodayProps) {
  const [date, setDate] = useState(() => todayISO());
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<Entry | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dayEntries = useMemo(
    () =>
      entries
        .filter((e) => e.date === date)
        .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt),
    [entries, date],
  );
  const openCount = dayEntries.filter((e) => !e.done).length;

  useEffect(() => {
    if (pasteOpen) textareaRef.current?.focus();
  }, [pasteOpen]);

  const submitPaste = () => {
    const texts = pasteText.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);
    if (texts.length) {
      onAdd(texts);
      setPasteText('');
      setPasteOpen(false);
    }
  };

  const shiftDate = (days: number) => setDate((d) => addDaysISO(d, days));

  const dropOn = (targetId: string | null) => {
    if (dragId && dragId !== targetId) onReorder(date, dragId, targetId);
    setDragId(null);
    setDragOverId(null);
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-xl px-4 pb-32 pt-6 sm:pt-10">
      {/* Date header */}
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => shiftDate(-1)}
            className="rounded-full p-2 text-ivory-dim transition hover:bg-gold-500/10 hover:text-gold-300"
            aria-label="Previous day"
          >
            <ArrowUp className="h-4 w-4 -rotate-90" />
          </button>
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-[0.3em] text-gold-500/80">
              {date === todayISO() ? 'Today' : 'Viewing'}
            </div>
            <h1 className="mt-1 font-serif text-2xl text-ivory-bright">{formatDateLong(date)}</h1>
          </div>
          <button
            onClick={() => shiftDate(1)}
            className="rounded-full p-2 text-ivory-dim transition hover:bg-gold-500/10 hover:text-gold-300"
            aria-label="Next day"
          >
            <ArrowDown className="h-4 w-4 -rotate-90" />
          </button>
        </div>
        {date !== todayISO() && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setDate(todayISO())}
              className="rounded-full border border-gold-500/25 px-4 py-1 text-xs tracking-wide text-gold-300 transition hover:bg-gold-500/10"
            >
              Return to today
            </button>
          </div>
        )}
      </header>

      {/* Mood */}
      <div className="mb-5">
        <MoodPicker value={mood} onChange={(m) => onSetMood(m)} />
      </div>

      {/* Stack */}
      <ul className="space-y-2">
        {dayEntries.map((e, idx) => (
          <li
            key={e.id}
            draggable
            onDragStart={() => setDragId(e.id)}
            onDragOver={(ev) => {
              ev.preventDefault();
              setDragOverId(e.id);
            }}
            onDragLeave={() => setDragOverId((v) => (v === e.id ? null : v))}
            onDrop={(ev) => {
              ev.preventDefault();
              dropOn(e.id);
            }}
            onDragEnd={() => dropOn(null)}
            className={`group rounded-2xl px-3.5 py-3 transition-all duration-200 glass-soft hover:border-gold-500/30 ${
              e.done ? 'opacity-45' : ''
            } ${dragOverId === e.id && dragId !== e.id ? 'ring-1 ring-gold-400/60' : ''} ${
              dragId === e.id ? 'opacity-30' : ''
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 cursor-grab text-ivory-faint/50 transition hover:text-gold-400/70 active:cursor-grabbing" aria-hidden>
                <GripVertical size={14} />
              </span>

              <button
                onClick={() => onToggleDone(e.id, !e.done)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                  e.done
                    ? 'border-gold-400 bg-gold-500/30 text-gold-300 glow-star'
                    : 'border-ivory-faint/60 text-transparent hover:border-gold-400 hover:text-gold-500/50'
                }`}
                aria-label={e.done ? 'Mark not done' : 'Mark done'}
              >
                <Check size={12} strokeWidth={3} />
              </button>

              <div className="min-w-0 flex-1">
                {editingId === e.id ? (
                  <input
                    autoFocus
                    defaultValue={e.text}
                    onBlur={(ev) => {
                      const v = ev.target.value.trim();
                      if (v) onUpdateText(e.id, v);
                      setEditingId(null);
                    }}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur();
                      if (ev.key === 'Escape') setEditingId(null);
                    }}
                    className="w-full rounded border border-gold-500/40 bg-ink-800/80 px-2 py-1 text-ivory-bright outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setEditingId(e.id)}
                    className={`block w-full text-left font-serif leading-snug ${
                      e.done ? 'text-ivory-dim line-through decoration-gold-500/50' : 'text-ivory'
                    }`}
                  >
                    {e.text}
                  </button>
                )}
                {e.note && (
                  <button
                    onClick={() => setNoteId(e.id)}
                    className="mt-1 flex w-full items-start gap-1.5 text-left text-xs italic leading-snug text-ivory-faint transition hover:text-ivory-dim"
                  >
                    <NotebookPen size={11} className="mt-0.5 shrink-0 text-gold-500/60" />
                    <span className="line-clamp-2">{e.note}</span>
                  </button>
                )}
                {e.seriesId && (
                  <span className="mt-1 inline-block text-[10px] uppercase tracking-[0.2em] text-gold-500/70">
                    recurring
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-60">
                <button
                  disabled={idx === 0}
                  onClick={() => onReorder(date, e.id, dayEntries[idx - 1]?.id ?? null)}
                  className="rounded p-1.5 text-ivory-faint transition hover:text-gold-300 disabled:opacity-25"
                  aria-label="Move up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  disabled={idx === dayEntries.length - 1}
                  onClick={() => onReorder(date, e.id, dayEntries[idx + 2]?.id ?? null)}
                  className="rounded p-1.5 text-ivory-faint transition hover:text-gold-300 disabled:opacity-25"
                  aria-label="Move down"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => onLetOrbit(e.id)}
                  className="rounded p-1.5 text-ivory-faint transition hover:text-gold-300"
                  title="Let orbit — set it loose without a date"
                  aria-label="Let orbit"
                >
                  <Wind size={14} />
                </button>
                <button
                  onClick={() => setMoveTarget(e)}
                  className="rounded p-1.5 text-ivory-faint transition hover:text-gold-300"
                  aria-label="Move to another day"
                >
                  <Move size={14} />
                </button>
              </div>
            </div>
          </li>
        ))}
        {dayEntries.length === 0 && (
          <li className="rounded-2xl border border-dashed border-gold-500/15 px-4 py-10 text-center text-sm text-ivory-faint">
            Nothing in today's stack yet. Paste your list below — each task becomes a star.
          </li>
        )}
      </ul>

      {/* Paste bar */}
      <button
        onClick={() => setPasteOpen(true)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-gold-500/25 bg-gold-500/5 px-4 py-3 text-sm tracking-wide text-gold-300 backdrop-blur transition hover:border-gold-500/50 hover:bg-gold-500/10"
      >
        <Send size={14} />
        Paste a list
      </button>
      <p className="mt-3 text-center text-xs text-ivory-faint">
        {openCount === 0
          ? 'A clear sky.'
          : `${openCount} open orbital${openCount === 1 ? '' : 's'} in the stack.`}
      </p>

      {pasteOpen && (
        <Modal title="Paste today's stack" onClose={() => setPasteOpen(false)}>
          <textarea
            ref={textareaRef}
            value={pasteText}
            onChange={(ev) => setPasteText(ev.target.value)}
            rows={8}
            placeholder={'One per line:\nwater the ferns\nwrite the letter\ncall Alba'}
            className="w-full resize-y rounded-xl border border-gold-500/25 bg-ink-950/70 px-3.5 py-3 text-ivory placeholder:text-ivory-faint/60 outline-none focus:border-gold-500/60"
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-ivory-faint">
              {pasteText.split(/\r?\n/).filter((l) => l.trim()).length} orbital(s)
            </span>
            <button
              onClick={submitPaste}
              disabled={!pasteText.trim()}
              className="flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/15 px-5 py-2 text-sm text-gold-300 transition enabled:hover:bg-gold-500/25 disabled:opacity-40"
            >
              <Sparkles size={14} />
              Add to stack
            </button>
          </div>
        </Modal>
      )}

      {noteId && (
        <NoteModal
          entry={dayEntries.find((e) => e.id === noteId) ?? null}
          onClose={() => setNoteId(null)}
          onSave={(id, note) => {
            onUpdateNote(id, note);
            setNoteId(null);
          }}
        />
      )}

      {moveTarget && (
        <MoveModal
          entry={moveTarget}
          fromDate={date}
          onClose={() => setMoveTarget(null)}
          onMove={(id, toDate) => {
            onMove(id, toDate);
            setMoveTarget(null);
          }}
        />
      )}
    </div>
  );
}

function NoteModal({
  entry,
  onClose,
  onSave,
}: {
  entry: Entry | null;
  onClose: () => void;
  onSave: (id: string, note: string) => void;
}) {
  const [text, setText] = useState(entry?.note ?? '');
  if (!entry) return null;
  return (
    <Modal title="A line to connect it" onClose={onClose}>
      <p className="mb-3 text-sm text-ivory-dim">
        Notes tether this orbital to others across days — a shared thread you can search later.
      </p>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="What does this belong to?"
        className="w-full resize-y rounded-xl border border-gold-500/25 bg-ink-950/70 px-3.5 py-3 text-sm italic text-ivory placeholder:text-ivory-faint/50 outline-none focus:border-gold-500/60"
      />
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => {
            onSave(entry.id, '');
            onClose();
          }}
          className="rounded-full px-4 py-2 text-sm text-ivory-faint transition hover:text-red-300"
        >
          Remove note
        </button>
        <button
          onClick={() => onSave(entry.id, text.trim())}
          className="rounded-full border border-gold-500/40 bg-gold-500/15 px-5 py-2 text-sm text-gold-300 transition hover:bg-gold-500/25"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

function MoveModal({
  entry,
  fromDate,
  onClose,
  onMove,
}: {
  entry: Entry;
  fromDate: string;
  onClose: () => void;
  onMove: (id: string, toDate: string) => void;
}) {
  const [toDate, setToDate] = useState(() => addDaysISO(fromDate, 1));
  return (
    <Modal title="Move to another day" onClose={onClose}>
      <p className="mb-4 text-sm text-ivory-dim">
        Moving <span className="text-gold-300">{entry.text}</span> leaves a quiet trace on{' '}
        {formatDateLong(fromDate)}.
      </p>
      <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gold-500/80">New date</label>
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="w-full rounded-xl border border-gold-500/25 bg-ink-950/70 px-3.5 py-2.5 text-ivory outline-none focus:border-gold-500/60 [color-scheme:dark]"
      />
      <div className="mt-3 flex gap-2">
        {[1, 7].map((n) => (
          <button
            key={n}
            onClick={() => setToDate(addDaysISO(fromDate, n))}
            className="rounded-full border border-gold-500/25 px-3 py-1 text-xs text-ivory-dim transition hover:border-gold-500/50 hover:text-gold-300"
          >
            +{n === 1 ? '1 day' : '1 week'}
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-full px-4 py-2 text-sm text-ivory-dim transition hover:text-ivory"
        >
          Cancel
        </button>
        <button
          onClick={() => onMove(entry.id, toDate)}
          className="rounded-full border border-gold-500/40 bg-gold-500/15 px-5 py-2 text-sm text-gold-300 transition hover:bg-gold-500/25"
        >
          Move
        </button>
      </div>
    </Modal>
  );
}
