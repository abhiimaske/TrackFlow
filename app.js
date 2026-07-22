/* ============================================================
   TrackFlow — app.js  v3
   · Activities = rows (left), Days by week = columns
   · ALL dates clickable (no future lock)
   · Inline Quick-Add bar with emoji picker
   · Productivity Graph (canvas) in dashboard
   ============================================================ */
(function () {
  'use strict';

  /* ── Constants ── */
  const STORE_ACTS     = 'trackflow_v5_activities';
  const STORE_CHECKS   = (y, m) => `trackflow_v5_checks_${y}_${String(m+1).padStart(2,'0')}`;
  const STORE_NOTES_K  = (y, m) => `trackflow_v5_notes_${y}_${String(m+1).padStart(2,'0')}`;
  const STORE_LEGACY   = 'trackflow_ref_v4';
  const MAX_ACT        = 30;
  const MAX_ATTACH_SIZE = 512000; // 500KB per file
  const MAX_ATTACHMENTS = 10;    // per day
  const WEEK_CLASSES   = ['w1','w2','w3','w4','w5'];
  const FILL_CLASSES   = ['wf1','wf2','wf3','wf4','wf5'];
  const WEEK_LABELS    = ['Week 1','Week 2','Week 3','Week 4','Week 5'];

  const EMOJIS = [
    '🏃','📚','🧘','💪','🍎','💧','🎵','✍️','🌅','😴',
    '🧠','🎯','🌿','🎨','💼','🚴','🏊','🥗','☕','📝',
    '🎮','🌍','🤸','🛌','🎤','🧹','🐾','🌻','🍵','🎲',
  ];

  const ACT_PALETTES = [
    { bar:'linear-gradient(90deg,#00c8e6,#0ea5e9)', chip:'rgba(0,200,230,0.15)', border:'rgba(0,200,230,0.5)',  text:'#67e8f9' },
    { bar:'linear-gradient(90deg,#a855f7,#ec4899)', chip:'rgba(168,85,247,0.15)',border:'rgba(168,85,247,0.5)', text:'#d8b4fe' },
    { bar:'linear-gradient(90deg,#22c55e,#06b6d4)', chip:'rgba(34,197,94,0.15)', border:'rgba(34,197,94,0.5)',  text:'#86efac' },
    { bar:'linear-gradient(90deg,#3b82f6,#6366f1)', chip:'rgba(59,130,246,0.15)',border:'rgba(59,130,246,0.5)', text:'#93c5fd' },
    { bar:'linear-gradient(90deg,#f59e0b,#f97316)', chip:'rgba(245,158,11,0.15)',border:'rgba(245,158,11,0.5)', text:'#fcd34d' },
    { bar:'linear-gradient(90deg,#06b6d4,#22d3ee)', chip:'rgba(6,182,212,0.15)', border:'rgba(6,182,212,0.5)',  text:'#67e8f9' },
    { bar:'linear-gradient(90deg,#ef4444,#f87171)', chip:'rgba(239,68,68,0.15)', border:'rgba(239,68,68,0.5)',  text:'#fca5a5' },
    { bar:'linear-gradient(90deg,#84cc16,#22c55e)', chip:'rgba(132,204,22,0.15)',border:'rgba(132,204,22,0.5)', text:'#bef264' },
    { bar:'linear-gradient(90deg,#d946ef,#a855f7)', chip:'rgba(217,70,239,0.15)',border:'rgba(217,70,239,0.5)', text:'#f0abfc' },
    { bar:'linear-gradient(90deg,#f43f5e,#fb7185)', chip:'rgba(244,63,94,0.15)', border:'rgba(244,63,94,0.5)',  text:'#fda4af' },
    { bar:'linear-gradient(90deg,#14b8a6,#06b6d4)', chip:'rgba(20,184,166,0.15)',border:'rgba(20,184,166,0.5)', text:'#5eead4' },
    { bar:'linear-gradient(90deg,#fbbf24,#fcd34d)', chip:'rgba(251,191,36,0.15)',border:'rgba(251,191,36,0.5)', text:'#fde68a' },
    { bar:'linear-gradient(90deg,#818cf8,#6366f1)', chip:'rgba(129,140,248,0.15)',border:'rgba(129,140,248,0.5)',text:'#c7d2fe' },
    { bar:'linear-gradient(90deg,#34d399,#10b981)', chip:'rgba(52,211,153,0.15)', border:'rgba(52,211,153,0.5)',text:'#6ee7b7' },
    { bar:'linear-gradient(90deg,#fb923c,#f59e0b)', chip:'rgba(251,146,60,0.15)', border:'rgba(251,146,60,0.5)',text:'#fdba74' },
  ];

  /* ── Streak Badge Tiers ── */
  const STREAK_BADGES = [
    { threshold: 100, icon: '🏆', name: 'Mythic',      color: '#22c55e', glow: 'rgba(34,197,94,0.5)'  },
    { threshold: 60,  icon: '👑', name: 'Legend',       color: '#f59e0b', glow: 'rgba(245,158,11,0.5)' },
    { threshold: 30,  icon: '💎', name: 'Diamond',      color: '#06b6d4', glow: 'rgba(6,182,212,0.5)'  },
    { threshold: 14,  icon: '⚡', name: 'Unstoppable',  color: '#a855f7', glow: 'rgba(168,85,247,0.5)' },
    { threshold: 7,   icon: '🔥', name: 'On Fire',      color: '#f97316', glow: 'rgba(249,115,22,0.5)' },
    { threshold: 3,   icon: '⭐', name: 'Starter',      color: '#fbbf24', glow: 'rgba(251,191,36,0.5)' },
  ];

  const DEFAULT_ACTIVITIES = [
    { name:'Morning Run',           emoji:'🏃' },
    { name:'Read 30 min',           emoji:'📚' },
    { name:'Meditate',              emoji:'🧘' },
    { name:'Workout',               emoji:'💪' },
    { name:'Healthy Eating',        emoji:'🍎' },
    { name:'Drink 8 Glasses Water', emoji:'💧' },
    { name:'Practice Music',        emoji:'🎵' },
    { name:'Journal Writing',       emoji:'✍️' },
    { name:'Wake Up Early',         emoji:'🌅' },
    { name:'Sleep by 11pm',         emoji:'😴' },
    { name:'Study / Learn',         emoji:'🧠' },
    { name:'Set Daily Goals',       emoji:'🎯' },
    { name:'No Social Media',       emoji:'🌿' },
    { name:'Creative Time',         emoji:'🎨' },
    { name:'Deep Work Focus',       emoji:'💼' },
  ];

  /* ── State ── */
  let state = {
    activities: [],
    checks: {},       // values: 'done' | 'skip' | (absent = empty)
    notes:  {},       // key = day number, value = string | { text, attachments[] }
    year: 0, month: 0, daysInMonth: 0,
    todayYear: 0, todayMonth: 0, todayDate: 0,
    selectedDay: 0,   // day currently selected in journal panel
  };

  /* ── DOM ── */
  const $ = id => document.getElementById(id);
  const trackerGrid       = $('trackerGrid');
  const statCards         = $('statCards');
  const activityBreakdown = $('activityBreakdown');
  const weeklyBarRow      = $('weeklyBarRow');
  const monthDisplay      = $('monthDisplay');
  const headerPct         = $('headerPct');
  const toast             = $('toast');
  const prodGraphCanvas   = $('prodGraph');
  const graphXLabels      = $('graphXLabels');
  const clockDate         = $('clockDate');
  const clockTime         = $('clockTime');

  /* Quick-Add bar */
  const qaEmojiInput    = $('qaEmojiInput');   // native OS emoji text field
  const qaNameInput     = $('qaNameInput');
  const qaAddBtn        = $('qaAddBtn');
  const qaChips         = $('qaChips');

  /* Header add modal */
  const openAddModal    = $('openAddModal');
  const addModalOverlay = $('addModalOverlay');
  const closeAddModal   = $('closeAddModal');
  const cancelAddModal  = $('cancelAddModal');
  const confirmAddAct   = $('confirmAddActivity');
  const actNameInput    = $('activityNameInput');
  const modalEmojiInput = $('modalEmojiInput'); // native emoji in modal
  const emojiGrid       = $('emojiGrid');

  /* Reset modal */
  const resetBtn        = $('resetBtn');
  const resetOverlay    = $('resetOverlay');
  const closeResetModal = $('closeResetModal');
  const cancelReset     = $('cancelReset');
  const confirmReset    = $('confirmReset');

  let selectedEmoji = EMOJIS[0];

  /* ── Helpers ── */
  function uid()      { return '_' + Math.random().toString(36).slice(2, 9); }
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function daysInM(y, m)  { return new Date(y, m + 1, 0).getDate(); }
  function dayName(y, m, d) {
    return new Date(y, m, d).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  }
  function isWeekend(y, m, d) { const w = new Date(y,m,d).getDay(); return w===0||w===6; }
  function isToday(y, m, d) {
    const n = new Date();
    return n.getFullYear()===y && n.getMonth()===m && n.getDate()===d;
  }
  function isFuture(y, m, d) {
    const n = new Date(); const t = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return new Date(y,m,d) > t;
  }
  function chkKey(actId, day) { return `${actId}_${day}`; }
  function todayDayNum() {
    if (state.todayYear === state.year && state.todayMonth === state.month)
      return state.todayDate;
    // viewing a past month — all days count as past
    if (new Date(state.year, state.month, 1) < new Date(state.todayYear, state.todayMonth, 1))
      return state.daysInMonth;
    return 0; // future month
  }
  function weekOf(day) { return Math.ceil(day / 7); }

  /* ── Cross-Month Streak Calculator ── */
  function calcStreak(actId) {
    let streak = 0;
    let y = state.year, m = state.month;
    let d = todayDayNum();
    if (d <= 0) return 0;

    // Walk backwards through days and months
    let iterations = 0;
    while (iterations < 400) {
      const checks = (y === state.year && m === state.month)
        ? state.checks
        : loadChecks(y, m);

      while (d >= 1) {
        iterations++;
        if (checks[chkKey(actId, d)] === 'done') { streak++; d--; }
        else return streak;
      }
      // Move to previous month
      m--;
      if (m < 0) { m = 11; y--; }
      d = daysInM(y, m);
    }
    return streak;
  }

  /* ── Get highest badge earned for a streak count ── */
  function getBadge(streak) {
    for (const b of STREAK_BADGES) {
      if (streak >= b.threshold) return b;
    }
    return null;
  }

  /* ── Get all badges earned for a streak count ── */
  function getEarnedBadges(streak) {
    return STREAK_BADGES.filter(b => streak >= b.threshold);
  }

  function isViewingCurrentMonth() {
    return state.year === state.todayYear && state.month === state.todayMonth;
  }

  /* ── Persistence (split: global activities + per-month checks) ── */
  function saveActivities() {
    try { localStorage.setItem(STORE_ACTS, JSON.stringify(state.activities)); } catch(e) {}
  }
  function saveChecks() {
    try { localStorage.setItem(STORE_CHECKS(state.year, state.month), JSON.stringify(state.checks)); } catch(e) {}
  }
  function save() { saveActivities(); saveChecks(); }

  function loadActivities() {
    try {
      const raw = localStorage.getItem(STORE_ACTS);
      if (raw) { const p = JSON.parse(raw); if (p && p.length) state.activities = p; }
    } catch(e) {}
  }
  function loadChecks(y, m) {
    try {
      const raw = localStorage.getItem(STORE_CHECKS(y, m));
      if (!raw) return {};
      const p = JSON.parse(raw);
      // Migrate old boolean true → 'done'
      const out = {};
      Object.entries(p).forEach(([k, v]) => { out[k] = (v === true) ? 'done' : v; });
      return out;
    } catch(e) { return {}; }
  }
  function saveNotes() {
    try { localStorage.setItem(STORE_NOTES_K(state.year, state.month), JSON.stringify(state.notes)); } catch(e) {
      showToast('⚠️ Storage full — try removing some attachments');
    }
  }
  function loadNotes(y, m) {
    try {
      const raw = localStorage.getItem(STORE_NOTES_K(y, m));
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch(e) { return {}; }
  }

  /* ── Note accessors (handles both old string and new {text,attachments} format) ── */
  function getNoteText(day) {
    const n = state.notes[day];
    if (!n) return '';
    if (typeof n === 'string') return n;
    return n.text || '';
  }
  function getNoteAttachments(day) {
    const n = state.notes[day];
    if (!n || typeof n === 'string') return [];
    return n.attachments || [];
  }
  function setNoteText(day, txt) {
    const n = state.notes[day];
    if (!n) {
      if (txt.trim()) state.notes[day] = txt; // store as simple string if no attachments
    } else if (typeof n === 'string') {
      if (txt.trim()) state.notes[day] = txt;
      else delete state.notes[day];
    } else {
      n.text = txt;
      if (!txt.trim() && (!n.attachments || !n.attachments.length)) delete state.notes[day];
    }
  }
  function addNoteAttachment(day, attachment) {
    let n = state.notes[day];
    if (!n) {
      state.notes[day] = { text: '', attachments: [attachment] };
    } else if (typeof n === 'string') {
      state.notes[day] = { text: n, attachments: [attachment] };
    } else {
      if (!n.attachments) n.attachments = [];
      n.attachments.push(attachment);
    }
  }
  function removeNoteAttachment(day, index) {
    const n = state.notes[day];
    if (!n || typeof n === 'string') return;
    if (n.attachments) n.attachments.splice(index, 1);
    if (!n.text && (!n.attachments || !n.attachments.length)) delete state.notes[day];
  }
  function hasNoteContent(day) {
    const n = state.notes[day];
    if (!n) return false;
    if (typeof n === 'string') return !!n.trim();
    return !!(n.text && n.text.trim()) || !!(n.attachments && n.attachments.length);
  }
  function loadLegacy() {
    /* Migrate from old single-key storage */
    try {
      const raw = localStorage.getItem(STORE_LEGACY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p && p.activities && p.activities.length && !state.activities.length)
        state.activities = p.activities;
      if (p && p.checks && p.year === state.year && p.month === state.month
          && Object.keys(state.checks).length === 0)
        state.checks = p.checks;
    } catch(e) {}
  }

  /* ── Init ── */
  function init() {
    const now = new Date();
    state.todayYear  = now.getFullYear();
    state.todayMonth = now.getMonth();
    state.todayDate  = now.getDate();
    state.year  = state.todayYear;
    state.month = state.todayMonth;
    state.daysInMonth = daysInM(state.year, state.month);
    state.selectedDay = state.todayDate;
    loadActivities();
    state.checks = loadChecks(state.year, state.month);
    state.notes  = loadNotes(state.year, state.month);
    if (!state.activities.length) loadLegacy();
    if (!state.activities.length) {
      DEFAULT_ACTIVITIES.forEach((a, i) => {
        state.activities.push({ id:uid(), name:a.name, emoji:a.emoji, paletteIdx: i % ACT_PALETTES.length });
      });
      saveActivities();
    }
    buildModalEmojiPicker();
    startClock();
    renderMonthNav();
    renderAll();
    bindEvents();
  }

  /* ── Live Clock ── */
  function startClock() {
    function tick() {
      const n   = new Date();
      const day = n.toLocaleDateString('en-US', { weekday:'short' }).toUpperCase();
      const dd  = String(n.getDate()).padStart(2,'0');
      const mon = n.toLocaleDateString('en-US', { month:'short' }).toUpperCase();
      const yr  = n.getFullYear();
      const hh  = String(n.getHours()).padStart(2,'0');
      const mm  = String(n.getMinutes()).padStart(2,'0');
      const ss  = String(n.getSeconds()).padStart(2,'0');
      if (clockDate) clockDate.textContent = `${day} ${dd} ${mon} ${yr}`;
      if (clockTime) clockTime.textContent = `${hh}:${mm}:${ss}`;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ── Month Nav & Display ── */
  function renderMonthNav() {
    const d = new Date(state.year, state.month, 1);
    const label = d.toLocaleDateString('en-US', { month:'long', year:'numeric' }).toUpperCase();
    const isCurrent = isViewingCurrentMonth();

    // Disable next if already on current month
    const now = new Date();
    const canGoNext = state.year < now.getFullYear() ||
      (state.year === now.getFullYear() && state.month < now.getMonth());

    monthDisplay.innerHTML = `
      <button class="mnav-btn" id="mnavPrev" title="Previous month">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span class="mnav-label">
        ${label}
        ${!isCurrent ? '<span class="mnav-hist-badge">HISTORY</span>' : '<span class="mnav-now-badge">NOW</span>'}
      </span>
      <button class="mnav-btn ${canGoNext ? '' : 'mnav-disabled'}" id="mnavNext"
        title="${canGoNext ? 'Next month' : 'Already on current month'}" ${canGoNext ? '' : 'disabled'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>`;

    $('mnavPrev').addEventListener('click', () => navigateMonth(-1));
    if (canGoNext) $('mnavNext').addEventListener('click', () => navigateMonth(1));
  }

  function navigateMonth(delta) {
    saveChecks();
    saveNotes();
    let m = state.month + delta;
    let y = state.year;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    const now = new Date();
    if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth())) return;
    state.year  = y;
    state.month = m;
    state.daysInMonth = daysInM(y, m);
    state.checks = loadChecks(y, m);
    state.notes  = loadNotes(y, m);
    // Set selectedDay: today if current month, else last day of viewed month
    state.selectedDay = isViewingCurrentMonth() ? state.todayDate : state.daysInMonth;
    renderMonthNav();
    renderAll();
  }

  /* legacy stub kept for any remaining callers */
  function renderMonthDisplay() { renderMonthNav(); }

  /* ── Render All ── */
  function renderAll() {
    renderChips();
    renderGrid();
    renderNotesPanel();
    renderDashboard();
    saveChecks();
  }


  /* ══════════════════════════════════════════════
     CHIPS (activity list in quick-add bar)
     ══════════════════════════════════════════════ */
  function renderChips() {
    qaChips.innerHTML = '';
    state.activities.forEach(act => {
      const p = ACT_PALETTES[act.paletteIdx % ACT_PALETTES.length];
      const chip = document.createElement('div');
      chip.className = 'qa-chip';
      chip.style.cssText = `background:${p.chip};border-color:${p.border};color:${p.text}`;
      chip.innerHTML = `<span>${act.emoji}</span><span>${escHtml(act.name)}</span><button class="qa-chip-remove" data-act="${act.id}" title="Remove">✕</button>`;
      qaChips.appendChild(chip);
    });
  }

  /* ══════════════════════════════════════════════
     GRID RENDER
     ══════════════════════════════════════════════ */
  function renderGrid() {
    trackerGrid.innerHTML = '';
    const Y = state.year, M = state.month, D = state.daysInMonth;

    // ── Build calendar-week groups (Mon–Sun) ──
    const dayCols = [];
    for (let d = 1; d <= D; d++) {
      const dow = new Date(Y, M, d).getDay(); // 0=Sun,1=Mon..6=Sat
      dayCols.push({
        day: d,
        dname: dayName(Y, M, d),
        weekend:   isWeekend(Y, M, d),
        today:     isToday(Y, M, d),
        future:    isFuture(Y, M, d),
        hasNote:   !!(state.notes[d] && state.notes[d].trim()),
        weekStart: (d === 1 || d === 8 || d === 15 || d === 22), // fixed 4-week layout
      });
    }

    // Group into calendar weeks (split on weekStart)
    const weeks = [];
    let cur = [];
    dayCols.forEach(c => {
      if (c.weekStart && cur.length) { weeks.push(cur); cur = []; }
      c.weekIdx = weeks.length;
      cur.push(c);
    });
    if (cur.length) weeks.push(cur);

    /* ROW 0 — Week colour headers */
    const tr0 = document.createElement('tr');

    const thGoals = document.createElement('th');
    thGoals.className = 'th-goals-main';
    thGoals.rowSpan = 3;
    thGoals.textContent = 'GOALS';
    tr0.appendChild(thGoals);

    const thCount = document.createElement('th');
    thCount.className = 'th-count-main';
    thCount.rowSpan = 3;
    thCount.textContent = 'DONE';
    tr0.appendChild(thCount);

    weeks.forEach((wDays, wi) => {
      const th = document.createElement('th');
      th.className = `th-week ${WEEK_CLASSES[wi % WEEK_CLASSES.length]}`;
      th.colSpan = wDays.length;
      // Dynamic label: "WEEK 1 · 01–07"
      const wStart = String(wDays[0].day).padStart(2,'0');
      const wEnd   = String(wDays[wDays.length - 1].day).padStart(2,'0');
      th.innerHTML = `<span class="wk-num">WEEK ${wi+1}</span><span class="wk-range">${wStart}–${wEnd}</span>`;
      tr0.appendChild(th);
    });

    /* ROW 1 — Day names (no stubs needed — GOALS/DONE rowSpan covers these) */
    const tr1 = document.createElement('tr');

    dayCols.forEach(c => {
      const th = document.createElement('th');
      th.className = 'th-dayname' +
        (c.weekend   ? ' weekend-col'    : '') +
        (c.weekStart ? ' week-start-col' : '');
      th.textContent = c.dname.slice(0,3);
      tr1.appendChild(th);
    });

    /* ROW 2 — Date numbers (no stubs needed — GOALS/DONE rowSpan covers these) */
    const tr2 = document.createElement('tr');

    dayCols.forEach(c => {
      const th = document.createElement('th');
      th.className = 'th-datenum' +
        (c.today     ? ' today-col'       : '') +
        (c.weekend   ? ' weekend-col'     : '') +
        (c.weekStart ? ' week-start-col'  : '');
      th.dataset.day = c.day;
      th.title = `Click to add note for day ${c.day}`;
      // Date number
      const numSpan = document.createElement('span');
      numSpan.textContent = String(c.day).padStart(2,'0');
      th.appendChild(numSpan);
      // Note indicator dot
      if (c.hasNote) {
        const dot = document.createElement('span');
        dot.className = 'note-dot';
        dot.title = 'Has a learning note';
        th.appendChild(dot);
      }
      th.addEventListener('click', () => selectJournalDay(c.day));
      tr2.appendChild(th);
    });

    const thead = document.createElement('thead');
    thead.appendChild(tr0); thead.appendChild(tr1); thead.appendChild(tr2);
    trackerGrid.appendChild(thead);

    /* BODY — Activity rows */
    const tbody = document.createElement('tbody');

    if (state.activities.length === 0) {
      const emptyTr = document.createElement('tr');
      emptyTr.className = 'empty-row';
      const emptyTd = document.createElement('td');
      emptyTd.colSpan = 2 + D;
      emptyTd.innerHTML = `<div class="empty-icon">📋</div><div>No activities yet — use the <strong>Quick Add</strong> bar above!</div>`;
      emptyTr.appendChild(emptyTd);
      tbody.appendChild(emptyTr);
    } else {
      state.activities.forEach(act => {
        const tr = document.createElement('tr');
        tr.className = 'activity-row';
        tr.dataset.actId = act.id;

        /* Sticky label */
        const tdLabel = document.createElement('td');
        tdLabel.className = 'td-label';
        const inner = document.createElement('div');
        inner.className = 'td-label-inner';
        inner.innerHTML = `
          <span class="td-label-emoji">${act.emoji}</span>
          <span class="td-label-text" data-act="${act.id}" title="Double-click to rename">${escHtml(act.name)}</span>
          <button class="td-edit-btn" data-act="${act.id}" title="Rename activity">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="td-remove-btn" data-act="${act.id}" title="Remove">✕</button>`;
        tdLabel.appendChild(inner);
        tr.appendChild(tdLabel);

        /* Count */
        const tdCount = document.createElement('td');
        tdCount.className = 'td-count';
        tdCount.id = `count_${act.id}`;
        tdCount.textContent = countDone(act.id);
        tr.appendChild(tdCount);

        /* Checker cells — ALL clickable now (future dates allowed) */
        dayCols.forEach(c => {
          const td = document.createElement('td');
          td.className = 'td-check' +
            (c.today     ? ' today-col-cell'  : '') +
            (c.weekend   ? ' weekend-cell'    : '') +
            (c.weekStart ? ' week-start-col'  : '');

          const chkVal = state.checks[chkKey(act.id, c.day)]; // 'done'|'skip'|undefined
          const futureCls = c.future ? ' future' : '';

          const btn = document.createElement('button');
          btn.className = 'chk' + (chkVal ? ' ' + chkVal : '') + futureCls;
          btn.dataset.act = act.id;
          btn.dataset.day = c.day;
          btn.setAttribute('aria-label', `${act.name} day ${c.day}`);
          btn.setAttribute('aria-pressed', chkVal === 'done' ? 'true' : 'false');
          btn.title = !chkVal ? 'Mark done' : chkVal === 'done' ? 'Mark skipped' : 'Clear';
          btn.innerHTML = chkVal === 'skip'
            ? `<svg class="chk-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>`
            : `<svg class="chk-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

          btn.addEventListener('click', onCheck);
          td.appendChild(btn);
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });
    }

    trackerGrid.appendChild(tbody);
  }

  /* ── Count 'done' (not skip) for an activity ── */
  function countDone(actId) {
    let n = 0;
    for (let d = 1; d <= state.daysInMonth; d++) {
      if (state.checks[chkKey(actId, d)] === 'done') n++;
    }
    return n;
  }

  /* ── 3-State checkbox: empty → done → skip → empty ── */
  function onCheck(e) {
    const btn   = e.currentTarget;
    const actId = btn.dataset.act;
    const day   = +btn.dataset.day;
    const key   = chkKey(actId, day);
    const cur   = state.checks[key]; // 'done' | 'skip' | undefined

    // Capture streak BEFORE the change for celebration detection
    const streakBefore = (cur !== 'done') ? calcStreak(actId) : -1;

    let next;
    if (!cur)          { next = 'done'; }
    else if (cur==='done') { next = 'skip'; }
    else               { next = undefined; }

    if (next) state.checks[key] = next;
    else delete state.checks[key];

    // Update button classes & icon
    btn.classList.remove('done','skip');
    if (next) btn.classList.add(next);
    btn.setAttribute('aria-pressed', next === 'done' ? 'true' : 'false');
    btn.title = !next ? 'Mark done' : next==='done' ? 'Mark skipped' : 'Clear';
    btn.innerHTML = next === 'skip'
      ? `<svg class="chk-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>`
      : `<svg class="chk-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

    if (next === 'done') {
      btn.style.transform = 'scale(1.35)';
      setTimeout(() => { btn.style.transform = ''; }, 220);
    }

    const countEl = document.getElementById(`count_${actId}`);
    if (countEl) countEl.textContent = countDone(actId);

    saveChecks();
    renderDashboard();

    // ── Celebration toast on badge threshold crossing ──
    if (next === 'done' && streakBefore >= 0) {
      const streakAfter = calcStreak(actId);
      const badgeAfter = getBadge(streakAfter);
      const badgeBefore = getBadge(streakBefore);
      if (badgeAfter && (!badgeBefore || badgeAfter.threshold > badgeBefore.threshold)) {
        const act = state.activities.find(a => a.id === actId);
        const actName = act ? act.name : 'Activity';
        showToast(`${badgeAfter.icon} ${streakAfter}-day streak on ${actName}! ${badgeAfter.name.toUpperCase()}!`);
      }
    }
  }

  /* ══════════════════════════════════════════════
     NOTES PANEL — "What I Learned" + Attachments
     ══════════════════════════════════════════════ */
  const lpEl       = () => $('learningsPanel');
  const lpDateLbl  = () => $('lpDateLabel');
  const lpTextarea = () => $('lpTextarea');
  const lpSaved    = () => $('lpSaved');
  const lpCount    = () => $('lpNoteCount');
  let   noteDebounce = null;
  let   dragCounter  = 0; // track nested dragenter/dragleave

  function selectJournalDay(day) {
    state.selectedDay = day;
    renderNotesPanel();
    // Scroll panel into view smoothly
    const p = lpEl();
    if (p) p.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  function renderNotesPanel() {
    const panel = lpEl();
    if (!panel) return;
    const d = state.selectedDay || (isViewingCurrentMonth() ? state.todayDate : state.daysInMonth);
    state.selectedDay = d;

    const dayName2 = new Date(state.year, state.month, d)
      .toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' });

    if (lpDateLbl()) lpDateLbl().textContent = dayName2.toUpperCase();

    /* ── Textarea ── */
    const ta = lpTextarea();
    if (ta) {
      ta.value = getNoteText(d);
      ta.placeholder = `What did you learn or reflect on — ${dayName2}?`;
      ta.oninput = () => {
        clearTimeout(noteDebounce);
        noteDebounce = setTimeout(() => {
          setNoteText(d, ta.value);
          saveNotes();
          updateNoteDot(d, hasNoteContent(d));
          showSavedIndicator();
          updateNoteCount();
        }, 500);
      };
    }

    /* ── Attachments list ── */
    renderAttachmentsList(d);

    /* ── Attachment info ── */
    const info = $('lpAttachInfo');
    const atts = getNoteAttachments(d);
    if (info) {
      info.textContent = atts.length ? `${atts.length} file${atts.length>1?'s':''} attached` : '';
    }

    /* ── Prev/Next day buttons ── */
    const prevBtn = $('lpPrevDay');
    const nextBtn = $('lpNextDay');
    if (prevBtn) {
      prevBtn.disabled = d <= 1;
      prevBtn.onclick = () => selectJournalDay(d - 1);
    }
    if (nextBtn) {
      nextBtn.disabled = d >= state.daysInMonth;
      nextBtn.onclick = () => selectJournalDay(d + 1);
    }

    updateNoteCount();
  }

  function showSavedIndicator() {
    const s = lpSaved();
    if (s) {
      s.textContent = '✓ Saved';
      s.classList.add('show');
      clearTimeout(s._t);
      s._t = setTimeout(() => s.classList.remove('show'), 1400);
    }
  }

  function updateNoteCount() {
    const c = countNotes();
    if (lpCount()) lpCount().textContent = c + ' note' + (c===1?'':'s') + ' this month';
  }

  function countNotes() {
    return Object.values(state.notes).filter(v => hasNoteContent_raw(v)).length;
  }
  function hasNoteContent_raw(v) {
    if (!v) return false;
    if (typeof v === 'string') return !!v.trim();
    return !!(v.text && v.text.trim()) || !!(v.attachments && v.attachments.length);
  }

  function updateNoteDot(day, has) {
    const th = trackerGrid.querySelector(`.th-datenum[data-day="${day}"]`);
    if (!th) return;
    let dot = th.querySelector('.note-dot');
    if (has && !dot) {
      dot = document.createElement('span');
      dot.className = 'note-dot';
      th.appendChild(dot);
    } else if (!has && dot) {
      dot.remove();
    }
  }

  /* ── Render attachment cards ── */
  function renderAttachmentsList(day) {
    const list = $('lpAttachmentsList');
    if (!list) return;
    list.innerHTML = '';
    const atts = getNoteAttachments(day);
    atts.forEach((att, idx) => {
      const card = document.createElement('div');
      card.className = 'lp-attach-card';
      card.title = `${att.name} (${formatFileSize(att.size)}) — Click to open`;

      // Thumbnail or icon
      if (att.type && att.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.className = 'lp-attach-thumb';
        img.src = att.data;
        img.alt = att.name;
        card.appendChild(img);
      } else {
        const icon = document.createElement('div');
        icon.className = 'lp-attach-icon';
        icon.textContent = getFileEmoji(att.type, att.name);
        card.appendChild(icon);
      }

      // Info
      const info = document.createElement('div');
      info.className = 'lp-attach-info-wrap';
      info.innerHTML = `<span class="lp-attach-name">${escHtml(att.name)}</span><span class="lp-attach-size">${formatFileSize(att.size)}</span>`;
      card.appendChild(info);

      // Remove button
      const rmBtn = document.createElement('button');
      rmBtn.className = 'lp-attach-remove';
      rmBtn.textContent = '✕';
      rmBtn.title = 'Remove attachment';
      rmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeNoteAttachment(day, idx);
        saveNotes();
        updateNoteDot(day, hasNoteContent(day));
        renderAttachmentsList(day);
        const infoEl = $('lpAttachInfo');
        const a2 = getNoteAttachments(day);
        if (infoEl) infoEl.textContent = a2.length ? `${a2.length} file${a2.length>1?'s':''} attached` : '';
        showSavedIndicator();
        showToast(`🗑️ "${att.name}" removed`);
      });
      card.appendChild(rmBtn);

      // Click to preview
      card.addEventListener('click', () => previewAttachment(att));

      list.appendChild(card);
    });
  }

  function getFileEmoji(type, name) {
    if (!type) return '📄';
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📕';
    if (type.includes('word') || (name && name.match(/\.docx?$/i))) return '📝';
    if (type.includes('sheet') || type.includes('excel') || (name && name.match(/\.xlsx?$/i))) return '📊';
    if (type.includes('presentation') || (name && name.match(/\.pptx?$/i))) return '📽️';
    if (type.startsWith('text/') || (name && name.match(/\.(txt|md|csv)$/i))) return '📃';
    return '📎';
  }

  function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function previewAttachment(att) {
    if (att.type && att.type.startsWith('image/')) {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`<html><head><title>${escHtml(att.name)}</title><style>body{margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh}img{max-width:95vw;max-height:95vh;border-radius:8px;box-shadow:0 4px 30px rgba(0,0,0,0.5)}</style></head><body><img src="${att.data}" alt="${escHtml(att.name)}"/></body></html>`);
        win.document.close();
      }
    } else if (att.data) {
      // Open data URI in new tab for PDFs, or trigger download for others
      const link = document.createElement('a');
      link.href = att.data;
      link.download = att.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /* ── File processing (read files as base64 data URIs) ── */
  function processFiles(files, day) {
    const currentAtts = getNoteAttachments(day);
    let added = 0;
    Array.from(files).forEach(file => {
      if (currentAtts.length + added >= MAX_ATTACHMENTS) {
        showToast(`⚠️ Max ${MAX_ATTACHMENTS} attachments per day`);
        return;
      }
      if (file.size > MAX_ATTACH_SIZE) {
        showToast(`⚠️ "${file.name}" is too large (max 500KB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        addNoteAttachment(day, {
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result
        });
        added++;
        saveNotes();
        updateNoteDot(day, true);
        renderAttachmentsList(day);
        const infoEl = $('lpAttachInfo');
        const a2 = getNoteAttachments(day);
        if (infoEl) infoEl.textContent = a2.length ? `${a2.length} file${a2.length>1?'s':''} attached` : '';
        showSavedIndicator();
        showToast(`📎 "${file.name}" attached`);
      };
      reader.onerror = () => showToast(`⚠️ Failed to read "${file.name}"`);
      reader.readAsDataURL(file);
    });
  }

  /* ── Drag & Drop handlers ── */
  function bindDragDrop() {
    const panel = lpEl();
    const dropZone = $('lpDropZone');
    if (!panel || !dropZone) return;

    // Use the entire learnings panel as the drag target
    panel.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      dropZone.classList.add('drag-over');
    });
    panel.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    panel.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        dropZone.classList.remove('drag-over');
      }
    });
    panel.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        processFiles(e.dataTransfer.files, state.selectedDay);
      }
    });
  }

  /* ── Bind attachment button + file input ── */
  function bindAttachmentEvents() {
    const attachBtn = $('lpAttachBtn');
    const fileInput = $('lpFileInput');
    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length) {
          processFiles(e.target.files, state.selectedDay);
          e.target.value = ''; // reset so same file can be re-attached
        }
      });
    }
    bindDragDrop();
  }

  /* ══════════════════════════════════════════════
     DASHBOARD

     ══════════════════════════════════════════════ */
  function renderDashboard() {
    renderStatCards();
    renderProductivityGraph();
    renderActivityBreakdown();
    renderWeeklyBars();
    updateHeaderPct();
  }

  /* ── Global % — only counts 'done', not 'skip' ── */
  function globalPct() {
    if (!state.activities.length) return 0;
    const possible = state.daysInMonth * state.activities.length;
    let done = 0;
    state.activities.forEach(act => {
      for (let d = 1; d <= state.daysInMonth; d++) {
        if (state.checks[chkKey(act.id, d)] === 'done') done++;
      }
    });
    return possible > 0 ? Math.round((done / possible) * 100) : 0;
  }

  function updateHeaderPct() { headerPct.textContent = globalPct() + '%'; }

  function renderStatCards() {
    if (!state.activities.length) { statCards.innerHTML = ''; return; }
    const today  = todayDayNum();
    const daysLeft = Math.max(0, state.daysInMonth - today);
    let totalDone = 0, bestAct = null, bestPct = -1, bestStreak = 0, bestStreakAct = null;
    let totalBadges = 0;

    state.activities.forEach(act => {
      const d = countDone(act.id);
      totalDone += d;
      const p = today > 0 ? Math.round((d / state.daysInMonth) * 100) : 0;
      if (p > bestPct) { bestPct = p; bestAct = act; }
      /* cross-month streak calc */
      const s = calcStreak(act.id);
      if (s > bestStreak) { bestStreak = s; bestStreakAct = act; }
      /* count earned badges */
      totalBadges += getEarnedBadges(s).length;
    });

    const bestBadge = getBadge(bestStreak);

    statCards.innerHTML = `
      <div class="s-card sc-cyan">
        <div class="s-card-icon">✅</div>
        <div class="s-card-val">${totalDone}</div>
        <div class="s-card-lbl">Total Completions</div>
      </div>
      <div class="s-card sc-purple">
        <div class="s-card-icon">📊</div>
        <div class="s-card-val">${globalPct()}<small style="font-size:1rem;color:var(--c-text2)">%</small></div>
        <div class="s-card-lbl">Overall Progress</div>
      </div>
      <div class="s-card sc-green">
        <div class="s-card-icon">🏆</div>
        <div class="s-card-val" style="font-size:0.95rem;line-height:1.4">${bestAct ? escHtml(bestAct.name) : '—'}</div>
        <div class="s-card-lbl">Best Activity (${bestPct}%)</div>
      </div>
      <div class="s-card sc-amber">
        <div class="s-card-icon">${bestBadge ? bestBadge.icon : '🔥'}</div>
        <div class="s-card-val">${bestStreak}<small style="font-size:0.75rem;color:var(--c-text2)">d</small></div>
        <div class="s-card-lbl">Best Streak${bestStreakAct ? ' · '+bestStreakAct.emoji : ''}${bestBadge ? ' · '+bestBadge.name : ''}</div>
      </div>
      <div class="s-card sc-blue">
        <div class="s-card-icon">⏳</div>
        <div class="s-card-val">${daysLeft}</div>
        <div class="s-card-lbl">Days Remaining</div>
      </div>
      <div class="s-card sc-rose">
        <div class="s-card-icon">🎖️</div>
        <div class="s-card-val">${totalBadges}</div>
        <div class="s-card-lbl">Badges Earned</div>
      </div>`;
  }

  /* ══════════════════════════════════════════════
     PRODUCTIVITY GRAPH (Canvas)
     Draws: bar chart per day + line trend + today marker
     ══════════════════════════════════════════════ */
  function renderProductivityGraph() {
    if (!state.activities.length || !prodGraphCanvas) return;

    const D      = state.daysInMonth;
    const today  = todayDayNum();
    const canvas = prodGraphCanvas;
    const wrap   = canvas.parentElement;

    /* Hi-DPI */
    const W = wrap.clientWidth || 800;
    const H = 200;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    /* Colours — theme-aware */
    const isLightTheme = document.documentElement.classList.contains('light');
    const bgColor     = isLightTheme ? '#f7f8fa' : '#161b28';
    const gridColor   = isLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
    const barColor    = 'rgba(0,200,230,0.35)';
    const barDone     = 'rgba(0,200,230,0.75)';
    const lineColor   = '#a855f7';
    const todayColor  = isLightTheme ? '#d97706' : '#f59e0b';
    const textColor   = isLightTheme ? 'rgba(100,116,139,0.8)' : 'rgba(125,143,179,0.8)';
    const futureBar   = isLightTheme ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';

    /* Padding */
    const padL = 36, padR = 16, padT = 16, padB = 28;
    const gW = W - padL - padR;
    const gH = H - padT - padB;

    /* Clear */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    /* ─ Build daily data ─ */
    const dailyPct = []; // index 0 = day 1
    for (let d = 1; d <= D; d++) {
      let done = 0;
      state.activities.forEach(act => {
        if (state.checks[chkKey(act.id, d)]) done++;
      });
      dailyPct.push(state.activities.length > 0 ? (done / state.activities.length) * 100 : 0);
    }

    /* ─ Moving average (5-day) for trend line ─ */
    function movAvg(arr, w) {
      return arr.map((_, i) => {
        const s = Math.max(0, i - Math.floor(w/2));
        const e = Math.min(arr.length, s + w);
        const sl = arr.slice(s, e);
        return sl.reduce((a,b)=>a+b,0) / sl.length;
      });
    }
    const trend = movAvg(dailyPct, 5);

    /* ─ Y-axis grid lines ─ */
    const yTicks = [0, 25, 50, 75, 100];
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    yTicks.forEach(v => {
      const y = padT + gH - (v / 100) * gH;
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, y); ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.fillText(v + '%', padL - 4, y + 3.5);
    });

    /* ─ Bar width ─ */
    const barW = Math.max(2, gW / D - 1.5);
    const barStep = gW / D;

    /* ─ Draw bars ─ */
    for (let i = 0; i < D; i++) {
      const d     = i + 1;
      const x     = padL + i * barStep + barStep * 0.15;
      const pct   = dailyPct[i];
      const barH  = (pct / 100) * gH;
      const y     = padT + gH - barH;
      const isFut = isFuture(state.year, state.month, d);

      /* Bar gradient */
      if (!isFut && pct > 0) {
        const grad = ctx.createLinearGradient(0, y, 0, padT + gH);
        grad.addColorStop(0, 'rgba(0,200,230,0.9)');
        grad.addColorStop(1, 'rgba(0,200,230,0.2)');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = isFut ? futureBar : 'rgba(255,255,255,0.06)';
      }
      const rBar = Math.min(3, barW / 2);
      ctx.beginPath();
      ctx.moveTo(x + rBar, y);
      ctx.lineTo(x + barW - rBar, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + rBar);
      ctx.lineTo(x + barW, padT + gH);
      ctx.lineTo(x, padT + gH);
      ctx.lineTo(x, y + rBar);
      ctx.quadraticCurveTo(x, y, x + rBar, y);
      ctx.closePath();
      ctx.fill();

      /* Today marker (vertical glow line) */
      if (isToday(state.year, state.month, d)) {
        const cx = padL + i * barStep + barStep / 2;
        ctx.strokeStyle = todayColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, padT + 4);
        ctx.lineTo(cx, padT + gH);
        ctx.stroke();
        ctx.setLineDash([]);

        /* "TODAY" label */
        ctx.font = 'bold 9px Orbitron, Inter, sans-serif';
        ctx.fillStyle = todayColor;
        ctx.textAlign = 'center';
        ctx.fillText('TODAY', cx, padT + 11);
        ctx.textAlign = 'right';
        ctx.font = '10px Inter, sans-serif';
      }
    }

    /* ─ Trend line (smooth bezier) ─ */
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = lineColor;
    ctx.shadowBlur = 6;
    ctx.setLineDash([]);
    ctx.beginPath();
    for (let i = 0; i < D; i++) {
      const x = padL + i * barStep + barStep / 2;
      const y = padT + gH - (trend[i] / 100) * gH;
      if (i === 0) ctx.moveTo(x, y);
      else {
        const px = padL + (i-1) * barStep + barStep / 2;
        const py = padT + gH - (trend[i-1] / 100) * gH;
        const cpx = (px + x) / 2;
        ctx.bezierCurveTo(cpx, py, cpx, y, x, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    /* ─ Data point dots on trend ─ */
    for (let i = 0; i < D; i++) {
      const d   = i + 1;
      const x   = padL + i * barStep + barStep / 2;
      const y   = padT + gH - (trend[i] / 100) * gH;
      const isFut = isFuture(state.year, state.month, d);
      if (isFut) continue;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = isToday(state.year, state.month, d) ? todayColor : lineColor;
      ctx.fill();
    }

    /* ─ X-axis date labels (every 5 days) ─ */
    graphXLabels.innerHTML = '';
    /* We build relative positioned labels via DOM */
    const labelFrag = document.createDocumentFragment();
    for (let i = 0; i < D; i++) {
      const d = i + 1;
      if (d === 1 || d % 5 === 0 || d === D) {
        const span = document.createElement('span');
        span.textContent = String(d).padStart(2,'0');
        span.style.position = 'absolute';
        span.style.left = ((padL + i * barStep + barStep / 2) / W * 100) + '%';
        span.style.transform = 'translateX(-50%)';
        span.style.fontSize = '0.6rem';
        span.style.color = isToday(state.year, state.month, d) ? '#f59e0b' : 'rgba(125,143,179,0.6)';
        span.style.fontFamily = 'Orbitron, monospace';
        labelFrag.appendChild(span);
      }
    }
    graphXLabels.style.position = 'relative';
    graphXLabels.style.height = '16px';
    graphXLabels.innerHTML = '';
    graphXLabels.appendChild(labelFrag);
  }

  function renderActivityBreakdown() {
    if (!state.activities.length) { activityBreakdown.innerHTML = ''; return; }
    let html = `<div class="breakdown-label">Activity-by-Activity Breakdown</div><div class="ab-rows">`;
    state.activities.forEach(act => {
      const done = countDone(act.id);
      const pct  = state.daysInMonth > 0 ? Math.round((done / state.daysInMonth) * 100) : 0;
      const p    = ACT_PALETTES[act.paletteIdx % ACT_PALETTES.length];
      const streak = calcStreak(act.id);
      const badge = getBadge(streak);
      html += `
        <div class="ab-row">
          <span class="ab-emoji">${act.emoji}</span>
          <span class="ab-name" title="${escHtml(act.name)}">${escHtml(act.name)}</span>
          <div class="ab-bar-wrap">
            <div class="ab-bar-fill" style="width:${pct}%;background:${p.bar}"></div>
          </div>
          <span class="ab-pct">${pct}%</span>
          <span class="ab-streak">${streak > 0 ? (badge ? badge.icon+' ' : '🔥 ')+streak+'d' : ''}</span>
        </div>`;
    });
    html += `</div>`;
    activityBreakdown.innerHTML = html;
  }

  function renderWeeklyBars() {
    if (!state.activities.length) { weeklyBarRow.innerHTML = ''; return; }
    const D = state.daysInMonth;
    const totalWeeks = 4;
    let html = '';
    for (let w = 0; w < totalWeeks; w++) {
      const start = w * 7 + 1;
      const end   = (w === totalWeeks - 1) ? D : Math.min((w+1)*7, D);
      let possible = 0, done = 0;
      for (let d = start; d <= end; d++) {
        state.activities.forEach(act => {
          possible++;
          if (state.checks[chkKey(act.id, d)]) done++;
        });
      }
      const pct = possible > 0 ? Math.round((done/possible)*100) : 0;
      html += `
        <div class="wb-card">
          <div class="wb-head">
            <span class="wb-name">${WEEK_LABELS[w]}</span>
            <span class="wb-pct">${pct}%</span>
          </div>
          <div class="wb-track">
            <div class="wb-fill ${FILL_CLASSES[w%FILL_CLASSES.length]}" style="height:${pct}%"></div>
          </div>
          <div class="wb-done">${done} / ${possible}</div>
        </div>`;
    }
    weeklyBarRow.innerHTML = html;
  }



  /* ══════════════════════════════════════════════
     MODAL EMOJI PICKER
     ══════════════════════════════════════════════ */
  function buildModalEmojiPicker() {
    emojiGrid.innerHTML = '';
    EMOJIS.forEach(em => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-btn' + (em === selectedEmoji ? ' selected' : '');
      btn.textContent = em;
      btn.addEventListener('click', () => {
        selectedEmoji = em;
        emojiGrid.querySelectorAll('.emoji-btn').forEach(b => b.classList.toggle('selected', b.textContent === em));
      });
      emojiGrid.appendChild(btn);
    });
  }

  /* ── Add activity logic ── */
  function doAddActivity(name, emoji) {
    name = name.trim();
    if (!name) return false;
    if (state.activities.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      showToast('⚠️ Activity already exists!'); return false;
    }
    if (state.activities.length >= MAX_ACT) {
      showToast(`⚠️ Max ${MAX_ACT} activities reached!`); return false;
    }
    state.activities.push({
      id: uid(), name, emoji,
      paletteIdx: state.activities.length % ACT_PALETTES.length,
    });
    saveActivities(); // persist globally
    renderAll();
    showToast(`✅ "${name}" added!`);
    return true;
  }

  /* ── Events ── */
  function bindEvents() {

    /* ─ Quick-Add bar: native emoji input ─ */
    /* Selecting all text on focus so Win+. replaces cleanly */
    qaEmojiInput.addEventListener('focus', () => qaEmojiInput.select());
    /* Trim to first grapheme (emoji) on blur */
    qaEmojiInput.addEventListener('blur', () => {
      const em = getFirstEmoji(qaEmojiInput.value);
      qaEmojiInput.value = em || EMOJIS[0];
    });
    qaEmojiInput.addEventListener('input', () => {
      /* Keep only first grapheme so the field stays compact */
      const em = getFirstEmoji(qaEmojiInput.value);
      if (em) qaEmojiInput.value = em;
    });

    qaAddBtn.addEventListener('click', () => {
      const emoji = getFirstEmoji(qaEmojiInput.value) || EMOJIS[0];
      if (doAddActivity(qaNameInput.value, emoji)) {
        qaNameInput.value = '';
        qaNameInput.focus();
      }
    });
    qaNameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') qaAddBtn.click();
    });

    /* Remove chip from quick-add bar */
    qaChips.addEventListener('click', e => {
      const rb = e.target.closest('.qa-chip-remove');
      if (rb) removeActivity(rb.dataset.act);
    });

    /* Remove from grid */
    trackerGrid.addEventListener('click', e => {
      const rb = e.target.closest('.td-remove-btn');
      if (rb) { removeActivity(rb.dataset.act); return; }

      /* Pencil icon → trigger rename */
      const eb = e.target.closest('.td-edit-btn');
      if (eb) { startRename(eb.dataset.act); return; }
    });

    /* Double-click on name text → rename */
    trackerGrid.addEventListener('dblclick', e => {
      const nameSpan = e.target.closest('.td-label-text');
      if (nameSpan) startRename(nameSpan.dataset.act);
    });

    /* ─ Header Add modal ─ */
    openAddModal.addEventListener('click', () => {
      if (state.activities.length >= MAX_ACT) { showToast(`⚠️ Max ${MAX_ACT}!`); return; }
      actNameInput.value = '';
      selectedEmoji = EMOJIS[state.activities.length % EMOJIS.length];
      if (modalEmojiInput) modalEmojiInput.value = selectedEmoji;
      buildModalEmojiPicker();
      addModalOverlay.classList.add('open');
      setTimeout(() => actNameInput.focus(), 100);
    });
    closeAddModal.addEventListener('click',  () => addModalOverlay.classList.remove('open'));
    cancelAddModal.addEventListener('click', () => addModalOverlay.classList.remove('open'));
    addModalOverlay.addEventListener('click', e => { if (e.target===addModalOverlay) addModalOverlay.classList.remove('open'); });
    actNameInput.addEventListener('keydown', e => { if (e.key==='Enter') confirmAddAct.click(); });

    /* Native emoji input in modal */
    if (modalEmojiInput) {
      modalEmojiInput.addEventListener('focus', () => modalEmojiInput.select());
      modalEmojiInput.addEventListener('input', () => {
        const em = getFirstEmoji(modalEmojiInput.value);
        if (em) { modalEmojiInput.value = em; selectedEmoji = em; }
      });
      modalEmojiInput.addEventListener('blur', () => {
        const em = getFirstEmoji(modalEmojiInput.value);
        selectedEmoji = em || EMOJIS[0];
        modalEmojiInput.value = selectedEmoji;
      });
    }

    confirmAddAct.addEventListener('click', () => {
      const emoji = (modalEmojiInput ? getFirstEmoji(modalEmojiInput.value) : null) || selectedEmoji;
      if (doAddActivity(actNameInput.value, emoji))
        addModalOverlay.classList.remove('open');
    });

    /* ─ Reset ─ */
    resetBtn.addEventListener('click',        () => resetOverlay.classList.add('open'));
    closeResetModal.addEventListener('click', () => resetOverlay.classList.remove('open'));
    cancelReset.addEventListener('click',     () => resetOverlay.classList.remove('open'));
    resetOverlay.addEventListener('click', e => { if (e.target===resetOverlay) resetOverlay.classList.remove('open'); });
    confirmReset.addEventListener('click', () => {
      state.checks = {};
      state.activities = [];
      DEFAULT_ACTIVITIES.forEach((a, i) => {
        state.activities.push({ id:uid(), name:a.name, emoji:a.emoji, paletteIdx:i%ACT_PALETTES.length });
      });
      saveActivities();
      resetOverlay.classList.remove('open');
      qaNameInput.value = '';
      renderAll();
      showToast('🔄 All data reset!');
    });

    /* ─ Redraw graph on resize ─ */
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderProductivityGraph, 150);
    });
  }

  function removeActivity(actId) {
    const act = state.activities.find(a => a.id === actId);
    state.activities = state.activities.filter(a => a.id !== actId);
    // Remove checks for this activity across the current month view
    Object.keys(state.checks).forEach(k => { if (k.startsWith(actId+'_')) delete state.checks[k]; });
    saveActivities();
    renderAll();
    if (act) showToast(`🗑️ "${act.name}" removed`);
  }

  /* ── Get first grapheme cluster (emoji) from a string ── */
  function getFirstEmoji(str) {
    if (!str) return '';
    /* Use Intl.Segmenter if available (modern browsers) */
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const seg = new Intl.Segmenter();
      const first = [...seg.segment(str.trim())][0];
      return first ? first.segment : '';
    }
    /* Fallback: grab first 2 code points (covers most emoji) */
    return [...str.trim()].slice(0, 2).join('');
  }

  /* ── Inline Rename ── */
  function startRename(actId) {
    const act = state.activities.find(a => a.id === actId);
    if (!act) return;

    /* Find the label span in the DOM */
    const nameSpan = trackerGrid.querySelector(`.td-label-text[data-act="${actId}"]`);
    if (!nameSpan) return;

    /* Don't open twice */
    if (nameSpan.querySelector('.inline-rename-input')) return;

    const originalName = act.name;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-rename-input';
    input.value = originalName;
    input.maxLength = 28;

    /* Replace span content with input */
    nameSpan.textContent = '';
    nameSpan.appendChild(input);
    nameSpan.classList.add('renaming');
    input.focus();
    input.select();

    let committed = false;

    function commit() {
      if (committed) return;
      committed = true;
      const newName = input.value.trim();

      if (!newName || newName === originalName) {
        /* Restore original */
        renderAll();
        return;
      }
      if (state.activities.some(a => a.id !== actId && a.name.toLowerCase() === newName.toLowerCase())) {
        showToast('⚠️ Name already exists!');
        renderAll();
        return;
      }
      act.name = newName;
      saveActivities();

      renderAll();
      showToast(`✏️ Renamed to "${newName}"`);
    }

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { committed = true; renderAll(); }
    });
    input.addEventListener('blur', commit);
    /* Stop row-level dblclick from firing again */
    input.addEventListener('dblclick', e => e.stopPropagation());
  }

  /* ══════════════════════════════════════════════
     EXPORT / IMPORT
     ══════════════════════════════════════════════ */
  function exportData() {
    try {
      const payload = {
        _format: 'trackflow_backup_v1',
        _exported: new Date().toISOString(),
        activities: state.activities,
      };

      // Collect all months of check & notes data from localStorage
      const months = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('trackflow_v5_checks_') || key.startsWith('trackflow_v5_notes_')) {
          try { months[key] = JSON.parse(localStorage.getItem(key)); } catch(e) {}
        }
      }
      payload.months = months;

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const d = new Date();
      a.download = `trackflow_backup_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('📥 Data exported successfully!');
    } catch(e) {
      showToast('⚠️ Export failed: ' + e.message);
    }
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (!data._format || !data._format.startsWith('trackflow_backup')) {
          showToast('⚠️ Invalid backup file!');
          return;
        }

        // Restore activities
        if (data.activities && Array.isArray(data.activities) && data.activities.length) {
          state.activities = data.activities;
          saveActivities();
        }

        // Restore all month data
        if (data.months && typeof data.months === 'object') {
          Object.entries(data.months).forEach(([key, value]) => {
            try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
          });
        }

        // Reload current month
        state.checks = loadChecks(state.year, state.month);
        state.notes  = loadNotes(state.year, state.month);
        renderMonthNav();
        renderAll();
        showToast('✅ Data imported successfully!');
      } catch(err) {
        showToast('⚠️ Import failed: invalid JSON');
      }
    };
    reader.readAsText(file);
  }

  /* ══════════════════════════════════════════════
     THEME TOGGLE (Dark / Light)
     ══════════════════════════════════════════════ */
  const STORE_THEME = 'trackflow_theme';

  function initTheme() {
    const saved = localStorage.getItem(STORE_THEME);
    if (saved === 'light') {
      document.documentElement.classList.add('light');
      updateThemeIcons(true);
    }
  }

  function toggleTheme() {
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem(STORE_THEME, isLight ? 'light' : 'dark');
    updateThemeIcons(isLight);
    // Re-render canvas graph since it uses hardcoded colors
    setTimeout(renderProductivityGraph, 50);
    showToast(isLight ? '☀️ Light mode' : '🌙 Dark mode');
  }

  function updateThemeIcons(isLight) {
    const moonIcon = document.querySelector('.theme-icon-moon');
    const sunIcon  = document.querySelector('.theme-icon-sun');
    if (moonIcon) moonIcon.style.display = isLight ? 'none' : 'block';
    if (sunIcon)  sunIcon.style.display  = isLight ? 'block' : 'none';
  }

  /* ══════════════════════════════════════════════
     KEYBOARD SHORTCUTS
     ══════════════════════════════════════════════ */
  function isAnyModalOpen() {
    return document.querySelector('.overlay.open') !== null;
  }

  function closeAllModals() {
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
  }

  function bindKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      // Don't trigger shortcuts when typing in inputs/textareas
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) {
        if (e.key === 'Escape') { e.target.blur(); closeAllModals(); }
        return;
      }

      switch(e.key) {
        case 'Escape':
          closeAllModals();
          break;
        case 'n':
        case 'N':
          if (!isAnyModalOpen()) {
            e.preventDefault();
            openAddModal.click();
          }
          break;
        case 'ArrowLeft':
          if (!isAnyModalOpen()) {
            e.preventDefault();
            navigateMonth(-1);
          }
          break;
        case 'ArrowRight':
          if (!isAnyModalOpen()) {
            e.preventDefault();
            navigateMonth(1);
          }
          break;
        case 'e':
        case 'E':
          if (!isAnyModalOpen()) {
            e.preventDefault();
            exportData();
          }
          break;
        case 't':
        case 'T':
          if (!isAnyModalOpen()) {
            e.preventDefault();
            toggleTheme();
          }
          break;
        case 'a':
        case 'A':
          if (!isAnyModalOpen()) {
            e.preventDefault();
            openAchievementsModal();
          }
          break;
        case '?':
          e.preventDefault();
          const scOverlay = $('shortcutsOverlay');
          if (scOverlay) {
            if (scOverlay.classList.contains('open')) {
              scOverlay.classList.remove('open');
            } else {
              closeAllModals();
              scOverlay.classList.add('open');
            }
          }
          break;
      }
    });
  }

  /* ══════════════════════════════════════════════
     BIND NEW FEATURE EVENTS
     ══════════════════════════════════════════════ */
  function bindNewFeatures() {
    /* Export */
    const exportBtn = $('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportData);

    /* Import */
    const importBtn = $('importBtn');
    const importFileInput = $('importFileInput');
    if (importBtn && importFileInput) {
      importBtn.addEventListener('click', () => importFileInput.click());
      importFileInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
          importData(e.target.files[0]);
          e.target.value = ''; // reset so same file can be re-imported
        }
      });
    }

    /* Theme toggle */
    const themeToggle = $('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    /* Shortcuts modal */
    const shortcutsOverlay = $('shortcutsOverlay');
    const closeShortcuts = $('closeShortcuts');
    if (closeShortcuts) closeShortcuts.addEventListener('click', () => shortcutsOverlay.classList.remove('open'));
    if (shortcutsOverlay) shortcutsOverlay.addEventListener('click', e => {
      if (e.target === shortcutsOverlay) shortcutsOverlay.classList.remove('open');
    });

    /* Keyboard shortcuts */
    bindKeyboardShortcuts();
  }

  /* ══════════════════════════════════════════════
     ACHIEVEMENTS MODAL
     ══════════════════════════════════════════════ */
  function openAchievementsModal() {
    const overlay = $('achievementsOverlay');
    if (!overlay) return;
    renderAchievementsContent();
    closeAllModals();
    overlay.classList.add('open');
  }

  function renderAchievementsContent() {
    const container = $('achievementsContent');
    if (!container) return;

    let longestStreak = 0;
    let longestAct = null;
    let totalBadges = 0;

    // Build per-activity data
    const actData = state.activities.map(act => {
      const streak = calcStreak(act.id);
      const badge = getBadge(streak);
      const earned = getEarnedBadges(streak);
      totalBadges += earned.length;
      if (streak > longestStreak) { longestStreak = streak; longestAct = act; }
      return { act, streak, badge, earned };
    });

    // Sort by streak descending
    actData.sort((a, b) => b.streak - a.streak);

    let html = '';

    // ── Summary stats ──
    const longestBadge = getBadge(longestStreak);
    html += `<div class="ach-summary">`;
    html += `<div class="ach-summary-card">`;
    html += `<span class="ach-summary-val">${longestStreak}<small>d</small></span>`;
    html += `<span class="ach-summary-lbl">Longest Streak${longestAct ? ' · '+longestAct.emoji : ''}${longestBadge ? ' · '+longestBadge.name : ''}</span>`;
    html += `</div>`;
    html += `<div class="ach-summary-card">`;
    html += `<span class="ach-summary-val">${totalBadges}</span>`;
    html += `<span class="ach-summary-lbl">Total Badges Earned</span>`;
    html += `</div>`;
    html += `<div class="ach-summary-card">`;
    html += `<span class="ach-summary-val">${state.activities.length}</span>`;
    html += `<span class="ach-summary-lbl">Active Habits</span>`;
    html += `</div>`;
    html += `</div>`;

    // ── Badge legend ──
    html += `<div class="ach-legend">`;
    html += `<div class="ach-legend-title">Badge Tiers</div>`;
    html += `<div class="ach-legend-grid">`;
    // Reverse so it goes from lowest to highest
    [...STREAK_BADGES].reverse().forEach(b => {
      html += `<div class="ach-legend-item">`;
      html += `<span class="ach-legend-icon">${b.icon}</span>`;
      html += `<span class="ach-legend-name">${b.name}</span>`;
      html += `<span class="ach-legend-days">${b.threshold}d</span>`;
      html += `</div>`;
    });
    html += `</div></div>`;

    // ── Per-activity streaks ──
    html += `<div class="ach-activities-title">Your Streaks</div>`;

    if (actData.length === 0) {
      html += `<div class="ach-empty">No activities yet — add some to start building streaks!</div>`;
    } else {
      html += `<div class="ach-list">`;
      actData.forEach(({ act, streak, badge, earned }) => {
        const p = ACT_PALETTES[act.paletteIdx % ACT_PALETTES.length];
        const barPct = Math.min(100, (streak / 100) * 100);
        html += `<div class="ach-row">`;
        html += `<div class="ach-row-left">`;
        html += `<span class="ach-row-emoji">${act.emoji}</span>`;
        html += `<div class="ach-row-info">`;
        html += `<span class="ach-row-name">${escHtml(act.name)}</span>`;
        html += `<span class="ach-row-streak">${streak > 0 ? streak+' day streak' : 'No active streak'}</span>`;
        html += `</div></div>`;
        html += `<div class="ach-row-center">`;
        html += `<div class="ach-bar-wrap"><div class="ach-bar-fill" style="width:${barPct}%;background:${p.bar}"></div></div>`;
        html += `</div>`;
        html += `<div class="ach-row-badges">`;
        // Show all badge tiers, earned ones highlighted, unearned dimmed
        [...STREAK_BADGES].reverse().forEach(b => {
          const isEarned = streak >= b.threshold;
          html += `<span class="ach-badge${isEarned ? '' : ' ach-badge-locked'}" `;
          html += `style="${isEarned ? 'border-color:'+b.color+';box-shadow:0 0 8px '+b.glow : ''}" `;
          html += `title="${b.name} — ${b.threshold} day streak${isEarned ? ' ✓ Earned!' : ''}">`;
          html += b.icon;
          html += `</span>`;
        });
        html += `</div></div>`;
      });
      html += `</div>`;
    }

    container.innerHTML = html;
  }

  function bindAchievementsModal() {
    const achBtn = $('achievementsBtn');
    const overlay = $('achievementsOverlay');
    const closeBtn = $('closeAchievements');
    if (achBtn) achBtn.addEventListener('click', openAchievementsModal);
    if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
    if (overlay) overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  }

  /* ── Toast ── */
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  /* ── Boot ── */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    init();
    bindNewFeatures();
    bindAchievementsModal();
  });
})();
