# Living iris

One turn represents a calendar year; the spiral grows outward through later years. Dated moments live on that structure. Loose orbitals remain flagged as undated and render beyond its outer edge until recalled into a day. Their former date is retained as history and excluded from the active daily list and upcoming preview.

The full screen eye unfolds weeks into days, tasks, notes, and mood journal entries.

The eye artwork and motion are reused at Lyriel's request from llyriell/evolresearch: public/assets/The_eye_symbol copy.png, public/assets/the_circle_closes.png, and the eye section of station.js (commit 3b1757af75e16503bfa2f88775bebce1ab9abe4d). EyeAtmosphere adapts the four counter-rotating rings, interaction boost, double heartbeat, and breathing. These are decorative layers; record positions stay still so dates remain legible. Reduced motion disables rotation and pulsing.

Storage remains local to this browser, using the existing orbitals.v1 key. Legacy single-day moods migrate into the journal without inventing timestamps. New journal entries retain date and recording timestamp. Archive export/import preserves this journal. Upcoming is an in-app tomorrow preview, not an external notification service.

Run from project/: npm install, npm run dev. Checks: npm run typecheck, npm run build, node --test tests/planner.test.mjs.
