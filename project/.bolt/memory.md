# Project memory

## Product intent & audience

- Private, single-user web app for daily scheduling, habit/recurring task tracking, and lightweight personal finance flow.
- Core metaphor: each day is a star; tasks are orbiting moons/planets; days collapse into constellation stars over time.
- Combines planner + mood journal + ledger rather than treating to-buy as a standalone checklist.

## Brand personality & voice

- Ethereal, aero, dreamy; "quiet picture of habits" tone.
- Calm, poetic naming: Sky map, Evol, day-stars, born stars, moons, filaments.

## Visual design & UX direction

- Ethereal/aero aesthetic: frosted glass cards with blur + inner light, soft rounded shapes, glowing/twinkling stars, gentle drift/float animations.
- Palette: ink-blue, ivory, gold dusk tones.
- Background: stars born behind glass on each task add; gold bloom animation. Past days collapse to single dim stars on left edge; today's tasks are individual bright stars connected by faint filaments. Done = dim, open = twinkle.
- Sky map: day-stars sized by content load, brighter with open work; tasks orbit as tiny moons on thin orbit rings; newer days spiral outward. Tap star for peek + open day.
- Interactions: hold-and-drag to reorder tasks (grip handle + arrow fallback); swipe left/right anywhere to move between tabs.
- Today view includes mood picker (five weather moods: radiant → stormy) with optional note line; optional notes on every task, visible under task and included in copied context.
- To Buy = ledger: entries money-out/in with optional amount + category; checking settles into monthly flows; month panel navigable through past months showing totals out/in, colored band, category breakdown.
- Tech: Vite + React + JSX, Tailwind, Lucide React icons, `@/` alias to `src/`. No extra UI/icon packages.

## Decisions, constraints & rationale

- All data persists locally (localStorage); JSON export/import in Evol carries tasks, moods, amounts.
- To Buy reframed as ledger with monthly flow + category breakdown so spending habits track over months, not a standalone checklist.
- Tasks carry optional notes to thread related entries across days.
- Drag + swipe implemented at app shell and task list levels.

## Open questions & assumptions

- Assumed swipe uses touch/pointer; desktop drag behavior fallback via arrows confirmed.
- Category list for ledger assumed predefined/internal; custom categories not explicitly confirmed.
- Constellation linking semantics beyond day-collapse filaments still loosely defined.
- Mood-to-visual mapping (does mood affect star color/weather tint?) not specified.