# The remembering eye

The spiral begins at 2000. Each year completes one outward turn. Wheel scrolling zooms around the pointer; holding the right mouse button and dragging pans the records. The bloom and image follow the translated record center but keep their size. The eye has a slow idle turn plus scroll-responsive rotation. Loose orbitals revolve slowly and pause under the pointer. Reduced motion suppresses animation.

Escape resets record pan and zoom to the overview, returns the planner to today, and dismisses task details. It does not delete records. Main-screen scale tabs are removed: the today/season/years controls remain only in full-screen eye exploration, where they are viewing scales rather than date filters.

Commands:
- today: focus today in both planner and eye
- today [task]: add a task, then focus today
- find [day] or visit [day]: visit and focus a day (ISO, named month/day, today/tomorrow/yesterday)
- recall [key]: search task titles and notes
- add [task]: create a loose orbital
- gather [item]: add to the shopping checklist
- connect: open constellation connections
- orbit, eye, help: exploration and command help

Ordinary typing enters the command line outside explicit editors. Escape closes command output, then clears retained input on another press.

The everlasting present supports task-word completion toggles and drag ordering; Alt+Up/Down also reorders. Iris hover previews are non-interactive ghosts; click a star to pin its right-hand working frame. Journal history uses the same translucent CRT frame. The bottom sky bar holds the starting timestamp while writing, preserving its local date across midnight.

Shopping and finances are independent collections. Item words toggle checked state without asking for money or changing financial totals. The finance form records expense/income amount and a short note such as groceries, materials, selling, TenderMends, or Dash. Existing recorded amounts migrate once into the financial collection; later checklist toggles do not change them. Archives include the independent ledger.

Data remains local to this browser using orbitals.v1. Upcoming is an in-app preview. Visual sources reused at Lyriel's request: evolresearch's eye/iris artwork and animation; lyrielle's CRT transmission frame.

Checks: npm run typecheck; npm run build; node --test tests/planner.test.mjs.
