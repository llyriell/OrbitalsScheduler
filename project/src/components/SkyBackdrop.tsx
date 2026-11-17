import { useRef } from 'react';
import type { AppData } from '../types';

/**
 * The living background: one star per task, born when the task is added.
 * Past days collapse into a single dimmer star each; today's tasks stay
 * as individual bright stars connected by faint filament lines.
 */
export function SkyBackdrop({ data, date }: { data: AppData; date: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const stars: { x: number; y: number; r: number; o: number; born?: number; id: string }[] = (() => {
    const out: { x: number; y: number; r: number; o: number; born?: number; id: string }[] = [];
    const dates = [...new Set(data.entries.filter((e) => e.date && e.date !== date).map((e) => e.date))].sort();
    const n = dates.length + data.entries.filter((e) => e.date === date).length;
    if (n === 0) return out;
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    // Collapsed past-day stars along a gentle arc on the left
    dates.forEach((d, i) => {
      const t = dates.length === 1 ? 0.5 : i / (dates.length - 1);
      out.push({
        x: 8 + t * 22 + rnd() * 6,
        y: 18 + t * 58 + rnd() * 10,
        r: 1.1,
        o: 0.45,
        id: `d-${d}`,
      });
    });
    // Today's task stars scattered on the right / center, connected by filaments
    const today = data.entries.filter((e) => e.date === date);
    today.forEach((e) => {
      const h = hashId(e.id);
      out.push({
        x: 38 + (h % 55),
        y: 10 + ((h >> 7) % 72),
        r: e.done ? 1.1 : 1.7,
        o: e.done ? 0.4 : 0.85,
        id: e.id,
      });
    });
    return out;
  })();

  const todayStars = stars.filter((s) => !s.id.startsWith('d-'));

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {/* filaments between today's stars */}
        {todayStars.slice(1).map((s, i) => {
          const p = todayStars[i];
          return (
            <line
              key={`f-${s.id}`}
              x1={p.x}
              y1={p.y}
              x2={s.x}
              y2={s.y}
              stroke="rgba(216,186,110,0.10)"
              strokeWidth="0.15"
              strokeDasharray="0.8 1.2"
            />
          );
        })}
        {stars.map((s) => (
          <g key={s.id} className={s.born ? 'star-born' : s.r > 1.4 ? 'twinkle' : undefined}>
            <circle cx={s.x} cy={s.y} r={s.r} fill="#e8d29a" opacity={s.o} />
            {s.r > 1.4 && <circle cx={s.x} cy={s.y} r={s.r * 2.6} fill="rgba(232,210,154,0.12)" />}
          </g>
        ))}
      </svg>
    </div>
  );
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}
