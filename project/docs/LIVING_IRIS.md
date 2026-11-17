# The remembering eye

The iris is centered behind a translucent planner. The spiral starts at 2000; each calendar year completes a turn 46 drawing units farther outward. Scroll over the eye to zoom the record layer around the pointer. The image and eye symbol remain fixed in position and size. Only this navigation scroll drives the eye symbol's spinning response.

Loose orbitals rotate around the outer periphery on a three-minute cycle, pausing under the pointer. Reduced motion stops that rotation and eye animation. Incomplete stars remain dimmer than fulfilled ones.

Hover previews are faint, small, and non-interactive at the right. Clicking a star pins the editable transmission frame into the right-hand working area. Leaving that frame or pressing Escape dismisses it. Clicking daily task words toggles completion; dragging reorders the selected day's list. Alt+Up/Down also reorders.

The right-edge drawer holds gathering and finance records. Item words toggle bought/unbought; marking bought also opens the cost field. Unknown costs remain blank until recorded. Completed purchases and settled income/expense records feed the financial totals. Recording an expense never executes a financial transaction.

Ordinary typing goes to the command line unless an input, textarea, selection control, or editable text is focused. Shortcuts and composing text are left alone. Commands execute only on submission:

- recall [key]: search titles and notes; recall [] shows all
- add [task]: create an undated orbital
- today [task]: add to today's list
- gather [item]: add to the shopping checklist
- visit [day]: ISO date, named month/day, or today/tomorrow/yesterday
- connect: open constellation connections
- orbit: recall loose orbitals
- eye: enter full-screen exploration
- help: show commands

Escape closes output first and clears retained input on another press. It also returns the viewed day to today. The bottom sky bar captures the time when writing begins and preserves that local day and timestamp when sent, including across midnight.

Storage uses the existing browser-local orbitals.v1 key. Legacy moods migrate without invented timestamps. Archive import/export includes all journal records and events. Upcoming is an in-app tomorrow preview, not an external notification.

Visual sources reused at Lyriel's request: evolresearch's eye symbol, iris image, counter-rotation and heartbeat; lyrielle's translucent CRT transmission frame, corner marks and expansion. Decorative image layers are separate from navigable records.

Checks from project/: npm run typecheck; npm run build; node --test tests/planner.test.mjs.
