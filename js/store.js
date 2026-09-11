// Lernstand im localStorage. Alles bleibt auf dem Gerät, nichts wird übertragen.
(function () {
  const KEY = "fm-lernstand-v1";
  // Leitner-Fächer: Tage bis zur nächsten Wiederholung einer Karte
  const BOX_DAYS = [0, 1, 3, 7, 14, 30];
  const LEARNED_BOX = 3;

  let state;

  const blank = () => ({ q: {}, c: {}, days: {}, exams: [], settings: { showJa: false } });
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayNum = (d = new Date()) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5;

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* privater Modus o. Ä. */ }
  }

  function touchDay() {
    const k = dayKey();
    state.days[k] = (state.days[k] || 0) + 1;
  }

  FM.store = {
    BOX_DAYS,
    dayKey,

    load() {
      try {
        const raw = localStorage.getItem(KEY);
        state = raw ? { ...blank(), ...JSON.parse(raw) } : blank();
      } catch (e) {
        state = blank();
      }
    },

    reset() {
      state = blank();
      save();
    },

    setting(key, value) {
      if (arguments.length > 1) {
        state.settings[key] = value;
        save();
      }
      return state.settings[key];
    },

    // ---- Fragen ----
    recordAnswer(id, correct) {
      const s = state.q[id] || (state.q[id] = { n: 0, ok: 0 });
      s.n++;
      if (correct) s.ok++;
      s.last = correct ? 1 : 0;
      touchDay();
      save();
    },

    // Zuletzt falsch beantwortet = Schwachstelle
    isWeak(id) {
      const s = state.q[id];
      return !!s && s.last === 0;
    },

    questionStats(list) {
      let seen = 0, n = 0, ok = 0, mastered = 0;
      for (const q of list) {
        const s = state.q[q.id];
        if (!s) continue;
        seen++;
        n += s.n;
        ok += s.ok;
        if (s.last === 1) mastered++;
      }
      return {
        total: list.length, seen, n, ok, mastered,
        pct: n ? Math.round((ok / n) * 100) : null,
        progress: list.length ? Math.round((mastered / list.length) * 100) : 0,
      };
    },

    // ---- Karten ----
    isDue(id) {
      const s = state.c[id];
      return !s || s.due <= dayNum();
    },

    rateCard(id, knew) {
      const s = state.c[id] || { box: 0, due: 0 };
      s.box = knew ? Math.min(s.box + 1, BOX_DAYS.length - 1) : 0;
      s.due = dayNum() + (knew ? BOX_DAYS[s.box] : 0);
      state.c[id] = s;
      touchDay();
      save();
    },

    cardStats(list) {
      let fresh = 0, due = 0, learned = 0;
      const today = dayNum();
      for (const c of list) {
        const s = state.c[c.id];
        if (!s) { fresh++; continue; }
        if (s.due <= today) due++;
        if (s.box >= LEARNED_BOX) learned++;
      }
      return { total: list.length, fresh, due, learned, open: fresh + due };
    },

    // ---- Probeprüfungen ----
    addExam(result) {
      state.exams.push(result);
      if (state.exams.length > 50) state.exams.shift();
      save();
    },

    exams() {
      return state.exams.slice().reverse();
    },

    // ---- Aktivität ----
    activity(key) {
      return state.days[key] || 0;
    },

    streak() {
      const d = new Date();
      if (!state.days[dayKey(d)]) d.setDate(d.getDate() - 1);
      let count = 0;
      while (state.days[dayKey(d)]) {
        count++;
        d.setDate(d.getDate() - 1);
      }
      return count;
    },
  };
})();
