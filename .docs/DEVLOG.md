# TrackFlow — Development Log

A step-by-step record of every development change made to the TrackFlow project.

---

## v1.0 — Initial Release
- Built monthly activity tracker with activities as rows, days as columns
- 15 default activities with emoji icons
- 3-state checkbox: empty → done → skip → clear
- localStorage persistence (per-month checks, global activities)
- Progress dashboard with stat cards, productivity graph (canvas), activity breakdown, weekly bars
- Dark theme with glassmorphism, scanline overlay, animated logo
- Keyboard shortcuts (N, ←, →, E, T, Esc, ?)
- Month navigation with history badge
- PWA manifest + apple-mobile-web-app support
- Custom 404 page

---

## v1.1 — Quick-Add Bar + Notes Panel
- Inline Quick-Add bar with native emoji input (Win+. support)
- Activity chips with color-coded palettes
- "What I Learned Today" daily journal panel
- Day navigation (prev/next) in notes panel
- Note indicator dots on date header cells
- Auto-save with debounce + "✓ Saved" indicator

---

## v1.2 — Export/Import + Theme Toggle
- Export all data as JSON backup (activities + all months' checks + notes)
- Import from JSON backup with validation
- Light/dark theme toggle with smooth CSS transitions
- Theme preference saved to localStorage
- Light theme comprehensive overrides (header, grid, modals, dashboard, etc.)
- Print styles for clean printing

---

## v1.3 — Fixed 4-Week Layout + Column Alignment Fix
**Date: 2026-07-18**

### Changes:
1. **Fixed 4-week grid layout** — Changed from variable calendar-week grouping (Mon-Sun, 4-5 weeks) to fixed 4-week layout:
   - Week 1: Days 1–7
   - Week 2: Days 8–14
   - Week 3: Days 15–21
   - Week 4: Days 22–end (7-10 days depending on month)
   
   **Files changed:** `app.js` (line 336: weekStart condition, line 937: weekly bars totalWeeks)

2. **Removed 2 phantom stub columns** — Rows 1 (day names) and 2 (date numbers) had redundant `<th>` stub elements that conflicted with the GOALS/DONE `rowSpan=3`, creating 2 extra columns that shifted all day cells out of alignment with week headers.
   
   **Files changed:** `app.js` (lines 376-402: removed thDaynameStub, thCountStub, thDatenumStub, thCountDatenum)

---

## v1.4 — Document Attachments + Drag & Drop (In Progress)
**Date: 2026-07-18**

### Planned Changes:
1. **Drag & drop file attachments** on "What I Learned Today" panel
2. **"Add Document" button** for file picker
3. **Attachment previews** — thumbnails for images, icons for documents
4. **File storage** — base64 data URIs in localStorage (500KB per file limit)
5. **Notes format migration** — backwards-compatible upgrade from string to `{ text, attachments }` object

---

## v1.5 — Streak & Achievement System
**Date: 2026-07-22**

### Changes:
1. **Cross-month streak engine** — `calcStreak(actId)` walks backwards through months using existing `localStorage` check data, counting consecutive 'done' days up to 400 iterations
2. **6-tier badge system** — ⭐ Starter (3d), 🔥 On Fire (7d), ⚡ Unstoppable (14d), 💎 Diamond (30d), 👑 Legend (60d), 🏆 Mythic (100d)
3. **Achievements modal** — Dedicated modal with summary stats, badge tier legend, and per-activity streak display with progress bars and earned/locked badge indicators
4. **Dashboard integration** — "Best Streak" card now shows cross-month streak with badge icon; "Active Habits" card replaced with "Badges Earned" count; Activity breakdown shows badge icon next to streak count
5. **Celebration toasts** — Automatic toast notification when marking a day pushes a streak past a badge threshold (e.g., "🔥 7-day streak on Morning Run! ON FIRE!")
6. **Keyboard shortcut** — `A` opens the Achievements modal; added to shortcuts reference
7. **Removed Drag & Drop** from Phase 4 roadmap (low priority, moved to backlog)

**Files changed:** `app.js`, `index.html`, `style.css`, `.docs/implementation_plan.md`

