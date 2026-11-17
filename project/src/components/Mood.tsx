import { Sun, CloudSun, Cloud, CloudRain, CloudLightning, Moon } from 'lucide-react';
import type { Mood, MoodIcon } from '../types';

export const MOODS: { icon: MoodIcon; label: string; Lucide: typeof Sun }[] = [
  { icon: 'radiant', label: 'Radiant', Lucide: Sun },
  { icon: 'clear', label: 'Clear', Lucide: CloudSun },
  { icon: 'passing', label: 'Passing', Lucide: Cloud },
  { icon: 'cloudy', label: 'Cloudy', Lucide: CloudRain },
  { icon: 'stormy', label: 'Stormy', Lucide: CloudLightning },
];

export function MoodPicker({
  value,
  onChange,
}: {
  value?: Mood;
  onChange: (m: Mood | undefined) => void;
}) {
  return (
    <div className="glass-soft rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.25em] text-gold-500/80">
          {value ? MOODS.find((m) => m.icon === value.icon)?.label : 'Sky within'}
        </span>
        {value && (
          <button
            onClick={() => onChange(undefined)}
            className="text-[11px] text-ivory-faint transition hover:text-ivory-dim"
          >
            clear
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-1">
        {MOODS.map(({ icon, label, Lucide }) => {
          const on = value?.icon === icon;
          return (
            <button
              key={icon}
              onClick={() => onChange({ icon, text: value?.icon === icon ? value.text : undefined })}
              title={label}
              aria-label={label}
              className={`rounded-full p-2 transition ${
                on
                  ? 'bg-gold-500/20 text-gold-300 glow-star'
                  : 'text-ivory-faint/60 hover:bg-gold-500/10 hover:text-gold-400/80'
              }`}
            >
              <Lucide size={17} strokeWidth={on ? 2.2 : 1.6} />
            </button>
          );
        })}
      </div>
      {value && (
        <input
          value={value.text ?? ''}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="a line about the sky within…"
          className="mt-2 w-full rounded-lg border border-gold-500/15 bg-ink-950/50 px-3 py-1.5 text-xs italic text-ivory placeholder:text-ivory-faint/50 outline-none focus:border-gold-500/40"
        />
      )}
    </div>
  );
}

export function MoodGlyph({ mood, size = 14 }: { mood?: Mood; size?: number }) {
  if (!mood) return <Moon size={size} className="text-ivory-faint/40" />;
  const m = MOODS.find((x) => x.icon === mood.icon) ?? MOODS[2];
  const Lucide = m.Lucide;
  return <Lucide size={size} className="text-gold-400/90" />;
}
