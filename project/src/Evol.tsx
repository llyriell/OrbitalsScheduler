import { useRef, useState } from 'react';
import { Download, FileText, Upload } from 'lucide-react';
import { Modal } from './components/Modal';
import {
  constellationContext,
  dayContext,
  exportArchive,
  parseArchive,
  parsePlan,
  previewPlan,
} from './evolArchive';
import type { AppData, Constellation } from './types';

export type EvolTarget =
  | { kind: 'day'; date: string }
  | { kind: 'constellation'; constellation: Constellation };

interface EvolProps {
  data: AppData;
  target: EvolTarget | null;
  onApplyPlan: (items: { text: string; done: boolean; op: 'add' | 'complete' | 'uncomplete' | 'remove' }[]) => void;
  onImport: (data: AppData) => void;
  onClose: () => void;
}

export function Evol({ data, target, onApplyPlan, onImport, onClose }: EvolProps) {
  const hasDayTarget = target?.kind === 'day';
  const contextText = target
    ? target.kind === 'day'
      ? dayContext(data, target.date)
      : constellationContext(data, target.constellation)
    : '';
  const [tab, setTab] = useState<'copy' | 'paste' | 'archive'>('copy');
  const [copied, setCopied] = useState(false);
  const [planText, setPlanText] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const planItems = planText.trim() ? parsePlan(planText) : [];
  const previews = planItems.length ? previewPlan(planItems, data, target?.kind === 'day' ? target.date : '') : [];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contextText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Copying failed — select the text manually.');
    }
  };

  const download = () => {
    const blob = new Blob([exportArchive(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbitals-archive-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File) => {
    setError('');
    try {
      const text = await file.text();
      onImport(parseArchive(text));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that archive.');
    }
  };

  return (
    <Modal title="Work with Evol" onClose={onClose} wide>
      <div className="mb-5 flex gap-1 rounded-full border border-gold-500/20 bg-ink-950/60 p-1 text-sm">
        {(
          [
            ['copy', 'Copy context'],
            ['paste', 'Paste a plan'],
            ['archive', 'Archive'],
          ] as ['copy' | 'paste' | 'archive', string][]
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => {
              setTab(m);
              setError('');
            }}
            className={`flex-1 rounded-full px-3 py-1.5 transition ${
              tab === m ? 'bg-gold-500/15 text-gold-300' : 'text-ivory-dim hover:text-ivory'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {tab === 'copy' && (
        <div>
          <p className="mb-3 text-sm text-ivory-dim">
            {hasDayTarget
              ? 'A plain-Markdown snapshot of the selected day, ready to paste into chat.'
              : target
                ? 'A plain-Markdown snapshot of this constellation, ready to paste into chat.'
                : 'Open this from a day or a constellation to copy its context.'}
          </p>
          {target && (
            <>
              <textarea
                readOnly
                value={contextText}
                rows={12}
                className="w-full resize-y rounded-xl border border-gold-500/20 bg-ink-950/70 px-3.5 py-3 font-mono text-xs leading-relaxed text-ivory outline-none"
              />
              <button
                onClick={copy}
                className="mt-4 flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/15 px-5 py-2 text-sm text-gold-300 transition hover:bg-gold-500/25"
              >
                <FileText size={14} />
                {copied ? 'Copied' : 'Copy as Markdown'}
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'paste' && (
        <div>
          <p className="mb-3 text-sm text-ivory-dim">
            {hasDayTarget
              ? 'Paste a Markdown plan. You will see a preview before anything is added to the day.'
              : 'Open this from a day to paste a plan into it.'}
          </p>
          {hasDayTarget && (
            <>
              <textarea
                value={planText}
                onChange={(e) => setPlanText(e.target.value)}
                rows={8}
                placeholder={'- water the ferns\n- [x] write the letter\n~ old errand'}
                className="w-full resize-y rounded-xl border border-gold-500/25 bg-ink-950/70 px-3.5 py-3 text-sm text-ivory placeholder:text-ivory-faint/60 outline-none focus:border-gold-500/60"
              />
              {planItems.length > 0 && (
                <div className="mt-4 rounded-xl border border-gold-500/20 bg-ink-950/60 p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gold-500/80">Preview</p>
                  <ul className="space-y-1.5">
                    {planItems.map((it, i) => (
                      <li key={i} className="flex items-baseline gap-2 text-sm">
                        <span className="w-24 shrink-0 text-xs uppercase tracking-wide text-gold-400/80">
                          {previews[i]?.split(' — ')[0]}
                        </span>
                        <span className="text-ivory">{it.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={() => {
                  if (planItems.length) {
                    onApplyPlan(planItems);
                    onClose();
                  }
                }}
                disabled={planItems.length === 0}
                className="mt-4 flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/15 px-5 py-2 text-sm text-gold-300 transition enabled:hover:bg-gold-500/25 disabled:opacity-40"
              >
                <Download size={14} className="hidden" />
                Apply to day
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'archive' && (
        <div>
          <p className="mb-4 text-sm text-ivory-dim">
            Export the full archive as JSON — every entry, trace, series, buy item and
            constellation, with stable IDs and links intact. Import replaces everything, so keep
            a copy first.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={download}
              className="flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/15 px-5 py-2 text-sm text-gold-300 transition hover:bg-gold-500/25"
            >
              <Download size={14} />
              Export JSON
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-full border border-gold-500/25 px-5 py-2 text-sm text-ivory-dim transition hover:border-gold-500/50 hover:text-gold-300"
            >
              <Upload size={14} />
              Import JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
