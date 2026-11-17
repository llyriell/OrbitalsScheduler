import { ArchiveData, AppData, Entry, Constellation } from './types';
import { formatDateLong } from './store';

export function exportArchive(data: AppData): string {
  const payload: ArchiveData = {
    schema: 'orbitals.archive',
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseArchive(json: string): AppData {
  const raw = JSON.parse(json);
  if (!raw || typeof raw !== 'object') throw new Error('Not an Orbitals archive');
  const d = raw as Partial<ArchiveData>;
  if (!Array.isArray(d.entries) || !Array.isArray(d.buyItems) || !Array.isArray(d.constellations)) {
    throw new Error('Archive is missing required sections');
  }
  return {
    entries: d.entries,
    traces: Array.isArray(d.traces) ? d.traces : [],
    series: Array.isArray(d.series) ? d.series : [],
    buyItems: d.buyItems,
    constellations: d.constellations,
    moods: d.moods && typeof d.moods === 'object' ? d.moods : {},
  };
}

function sortEntries(a: Entry, b: Entry): number {
  return a.order - b.order || a.createdAt - b.createdAt;
}

export function dayContext(data: AppData, date: string): string {
  const lines: string[] = [`# Day — ${formatDateLong(date)}`, ''];
  const mood = data.moods[date];
  if (mood) {
    lines.push(`Mood: **${mood.icon}**${mood.text ? ` — ${mood.text}` : ''}`, '');
  }
  const entries = data.entries.filter((e) => e.date === date).sort(sortEntries);
  if (entries.length) {
    lines.push('## Stack', '');
    for (const e of entries) {
      const marks = [e.done ? 'done' : null, e.seriesId ? 'recurring' : null]
        .filter(Boolean)
        .join(', ');
      lines.push(`- [${e.done ? 'x' : ' '}] ${e.text}${marks ? ` _(${marks})_` : ''}`);
      if (e.note) lines.push(`  - _${e.note}_`);
    }
    lines.push('');
  }
  const traces = data.traces.filter((t) => t.fromDate === date);
  if (traces.length) {
    lines.push('## Traces (moved away from this day)', '');
    for (const t of traces) lines.push(`- ${t.text}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function constellationContext(data: AppData, c: Constellation): string {
  const lines: string[] = [`# Constellation — ${c.name}`, ''];
  const entries = c.entryIds
    .map((id) => data.entries.find((e) => e.id === id))
    .filter((e): e is Entry => Boolean(e))
    .sort((a, b) => a.date.localeCompare(b.date));
  for (const e of entries) {
    lines.push(`- **${e.date}** — ${e.text}${e.done ? ' _(done)_' : ''}`);
    if (e.note) lines.push(`  - _${e.note}_`);
  }
  return lines.join('\n');
}

export interface PlanItem {
  text: string;
  done: boolean;
  op: 'add' | 'complete' | 'uncomplete' | 'remove';
}

/**
 * Parses a pasted Markdown-ish plan. Supported lines:
 *   - [x] text   -> mark existing (by text) done, or add as done
 *   - [ ] text   -> add as open (or un-complete if it exists done)
 *   - "- text"   -> add as open
 *   - "+ text"   -> add as open
 *   - "~ text"   -> remove matching entry by text
 * Plain non-empty lines are ignored so chatter around the plan is safe.
 */
export function parsePlan(text: string): PlanItem[] {
  const items: PlanItem[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    let m = line.match(/^[-+]\s+\[x\]\s+(.+)$/i) ?? line.match(/^\*\*\[x\]\*\*\s+(.+)$/i);
    if (m) {
      items.push({ text: m[1].trim(), done: true, op: 'complete' });
      continue;
    }
    m = line.match(/^[-+]\s+\[ \]\s+(.+)$/) ?? line.match(/^\*\*\[ \]\*\*\s+(.+)$/i);
    if (m) {
      items.push({ text: m[1].trim(), done: false, op: 'add' });
      continue;
    }
    m = line.match(/^[-+]\s+(.+)$/);
    if (m) {
      items.push({ text: m[1].trim(), done: false, op: 'add' });
      continue;
    }
    m = line.match(/^~\s+(.+)$/);
    if (m) {
      items.push({ text: m[1].trim(), done: false, op: 'remove' });
      continue;
    }
    m = line.match(/^\*\*(.+)\*\*$/);
    if (m) {
      items.push({ text: m[1].trim(), done: false, op: 'add' });
    }
  }
  return items;
}

export function previewPlan(items: PlanItem[], data: AppData, date: string): string[] {
  const dayEntries = data.entries.filter((e) => e.date === date);
  return items.map((it) => {
    const existing = dayEntries.find(
      (e) => e.text.toLowerCase() === it.text.toLowerCase() && e.seriesId === undefined,
    );
    switch (it.op) {
      case 'complete':
        return existing ? 'mark done' : 'add (done)';
      case 'add':
        return existing
          ? existing.done
            ? 'reopen'
            : 'skip (already here)'
          : 'add';
      case 'remove':
        return existing ? 'remove' : 'skip (not on this day)';
      default:
        return '';
    }
  });
}
