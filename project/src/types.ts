export type MoodIcon = 'radiant' | 'clear' | 'passing' | 'cloudy' | 'stormy';

export interface Mood {
  icon: MoodIcon;
  text?: string;
}

export interface MoodLog extends Mood { id: string; date: string; recordedAt?: number; }

export interface Entry {
  kind?: 'task' | 'event';
  time?: string;
  id: string;
  text: string;
  date: string; // ISO yyyy-mm-dd; undefined when orbiting
  done: boolean;
  orbiting: boolean;
  seriesId?: string;
  note?: string;
  order: number;
  createdAt: number;
}

export interface Trace {
  id: string;
  entryId: string;
  text: string;
  fromDate: string;
  movedAt: number;
  seriesId?: string;
}

export type RecurrenceRule = 'daily' | 'every_other_day' | 'weekdays' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringSeries {
  id: string;
  title: string;
  rule: RecurrenceRule;
  anchorDate: string;
  paused: boolean;
  weekdays?: number[];
  skippedDates?: string[];
  createdAt: number;
}

export type LedgerKind = 'expense' | 'income';

export interface BuyItem {
  id: string;
  text: string;
  bought: boolean;
  createdAt: number;
  boughtAt?: number;
  kind: LedgerKind;
  amount?: number;
  category?: string;
  note?: string;
}

export interface Constellation {
  id: string;
  name: string;
  entryIds: string[];
  createdAt: number;
}

export interface AppData {
  entries: Entry[];
  traces: Trace[];
  series: RecurringSeries[];
  buyItems: BuyItem[];
  constellations: Constellation[];
  moods: Record<string, Mood>;
  moodJournal: MoodLog[];
}

export interface ArchiveData extends AppData {
  schema: 'orbitals.archive';
  version: 1;
  exportedAt: string;
}
