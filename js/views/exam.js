// Probeprüfung: Zeitlimit, Bewertung erst am Ende, Auswertung nach Themen
(function () {
  const PASS = 50;
  const MAX_Q = 30;
  const SECS_PER_Q = 90;

  let session = null; // { teil, items: [{ q, order, pick }], cur, startedAt, endAt }
  let lastResult = null;

  const secondsLeft = () => Math.max(0, Math.round((session.endAt - Date.now()) / 1000));

  function startSession(teil) {
    const qs = FM.shuffle(FM.questionsFor(teil)).slice(0, MAX_Q);
    const now = Date.now();
    session = {
      teil, cur: 0, startedAt: now, endAt: now + qs.length * SECS_PER_Q * 1000,
      items: qs.map((q) => ({ q, order: FM.shuffle([0, 1, 2, 3]), pick: null })),
    };
  }

  function finish(timeout) {
    if (!session) return;
    const s = session;
    session = null;
    s.items.forEach((x) => { if (x.pick !== null) FM.store.recordAnswer(x.q.id, x.pick === 0); });
    const total = s.items.length;
    const correct = s.items.filter((x) => x.pick === 0).length;
    const pct = Math.round((correct / total) * 100);
    const secs = Math.round((Math.min(Date.now(), s.endAt) - s.startedAt) / 1000);
    lastResult = { ...s, total, correct, pct, secs, timeout };
    FM.store.addExam({ teil: s.teil, date: Date.now(), total, correct, pct, secs, passed: pct >= PASS });
    FM.go("exam/result");
  }

  FM.route("exam", (el) => {
    let teil = "2";

    function draw() {
      const n = Math.min(MAX_Q, FM.questionsFor(teil).length);
      const options = [2, 3, 4].map((t) => ({ value: t, label: FM.teile[t].short }))
        .concat([{ value: "all", label: "すべて" }]);

      el.innerHTML = `
        <p class="eyebrow">模擬試験</p>
        <h1>模擬試験モード</h1>
        <p class="muted">制限時間内に解き、最後にまとめて採点します。途中で正解は表示されません。</p>

        ${session ? `
          <div class="card stack" style="margin-top:16px">
            <div class="tile-title">受験中の模擬試験があります</div>
            <div class="muted small">${FM.esc(FM.partName(session.teil))} · 残り ${FM.formatTime(secondsLeft())}</div>
            <a class="btn primary block" href="#/exam/run">続きから解く</a>
          </div>` : ""}

        <div class="field-label">試験パート</div>
        ${FM.chips("teil", options, teil)}

        <div class="card" style="margin-top:16px">
          <ul class="list">
            <li><span>問題数</span><strong>${n}問</strong></li>
            <li><span>制限時間</span><strong>${Math.round((n * SECS_PER_Q) / 60)}分</strong></li>
            <li><span>合格ライン</span><strong>${PASS}%</strong></li>
          </ul>
        </div>
        <p class="notice" style="margin-top:12px">
          本番の出題形式や配点を再現したものではなく、理解度を確認するための練習です。
          マイスター試験では各パートで100点中50点（ausreichend）以上が合格の目安のひとつです。
        </p>
        <div class="actions">
          <button type="button" class="btn ${session ? "" : "primary"} block" data-act="start">${session ? "新しく始める" : "開始する"}</button>
        </div>`;
    }

    el.onclick = (e) => {
      const b = e.target.closest("[data-act]");
      if (!b) return;
      if (b.dataset.act === "chip") { teil = b.dataset.value; draw(); }
      if (b.dataset.act === "start") {
        if (session && !confirm("受験中の模擬試験を破棄して、新しく始めますか？")) return;
        startSession(teil);
        FM.go("exam/run");
      }
    };

    draw();
  });

  FM.route("exam/run", (el) => {
    if (!session) return FM.go("exam");

    function tick() {
      if (!session) return;
      const left = secondsLeft();
      const t = el.querySelector(".timer");
      if (t) {
        t.textContent = FM.formatTime(left);
        t.classList.toggle("low", left <= 300);
      }
      if (left <= 0) finish(true);
    }
    const timer = setInterval(tick, 1000);
    FM.onLeave(() => clearInterval(timer));

    function draw() {
      const { items, cur } = session;
      const { q, order, pick } = items[cur];
      const answered = items.filter((x) => x.pick !== null).length;
      const last = cur === items.length - 1;

      el.innerHTML = `
        <section data-ja-scope>
          <div class="qhead">
            <span>問題 ${cur + 1} / ${items.length}</span>
            <span class="row"><span class="timer" role="timer">--:--</span>${FM.jaButton()}</span>
          </div>
          ${FM.progress((answered / items.length) * 100)}
          <div class="question">${FM.bi(q.q, q.qJa)}</div>
          <div class="options">
            ${order.map((k, idx) => `
              <button type="button" class="option ${pick === k ? "selected" : ""}" data-act="pick" data-k="${k}" aria-pressed="${pick === k}">
                <span class="key">${"ABCD"[idx]}</span>
                <span class="txt">${FM.bi(q.a[k], q.aJa[k], "span")}</span>
              </button>`).join("")}
          </div>
        </section>

        <div class="btn-row actions">
          <button type="button" class="btn" data-act="move" data-to="${cur - 1}" ${cur === 0 ? "disabled" : ""}>← 前へ</button>
          ${last
            ? `<button type="button" class="btn primary" data-act="submit">採点する</button>`
            : `<button type="button" class="btn primary" data-act="move" data-to="${cur + 1}">次へ →</button>`}
        </div>

        <h2>問題一覧 <span class="muted small">${answered}/${items.length} 回答済み</span></h2>
        <div class="navgrid">
          ${items.map((x, idx) => `
            <button type="button" data-act="move" data-to="${idx}"
              class="${x.pick !== null ? "answered" : ""} ${idx === cur ? "current" : ""}">${idx + 1}</button>`).join("")}
        </div>
        <div class="actions">
          <button type="button" class="btn block" data-act="submit">解答を終了して採点する</button>
        </div>`;
      tick();
    }

    el.onclick = (e) => {
      const b = e.target.closest("[data-act]");
      if (!b || b.disabled || !session) return;
      const act = b.dataset.act;
      if (act === "pick") {
        session.items[session.cur].pick = Number(b.dataset.k);
        draw();
      }
      if (act === "move") {
        session.cur = Number(b.dataset.to);
        draw();
        window.scrollTo(0, 0);
      }
      if (act === "submit") {
        const open = session.items.filter((x) => x.pick === null).length;
        if (open && !confirm(`未回答が${open}問あります。採点しますか？`)) return;
        finish(false);
      }
    };

    draw();
  });

  FM.route("exam/result", (el) => {
    const r = lastResult;
    if (!r) return FM.go("exam");
    const passed = r.pct >= PASS;

    const byTopic = {};
    r.items.forEach((x) => {
      const t = byTopic[x.q.topic] || (byTopic[x.q.topic] = { ok: 0, n: 0 });
      t.n++;
      if (x.pick === 0) t.ok++;
    });

    el.innerHTML = `
      <div class="card result-hero">
        <p class="eyebrow">${FM.esc(FM.partName(r.teil))}</p>
        <div class="big">${r.pct}%</div>
        <span class="badge ${passed ? "pass" : "fail"}">${passed ? "合格ライン到達" : "合格ラインに届かず"}</span>
        <p class="muted small" style="margin:12px 0 0">
          ${r.total}問中 ${r.correct}問正解 · 所要時間 ${FM.formatTime(r.secs)}${r.timeout ? " · 時間切れ" : ""}
        </p>
      </div>

      <h2>分野別</h2>
      <div class="card">
        ${Object.entries(byTopic).map(([key, t]) =>
          FM.barRow(FM.esc(FM.topics[key].de), `${t.ok}/${t.n}`, (t.ok / t.n) * 100)).join("")}
      </div>

      <h2>見直し</h2>
      <div class="stack">
        ${r.items.map((x, idx) => {
          const q = x.q;
          const status = x.pick === 0 ? `<span class="status-ok">✓ 正解</span>`
            : x.pick === null ? `<span class="muted">– 未回答</span>`
            : `<span class="status-ng">✗ 不正解</span>`;
          return `
            <div class="card" data-ja-scope>
              <div class="row spread"><span class="small">${idx + 1}. ${status}</span>${FM.jaButton()}</div>
              <div class="review-q">${FM.bi(q.q, q.qJa)}</div>
              ${x.pick !== null && x.pick !== 0 ? `<div class="review-wrong">${FM.bi(q.a[x.pick], q.aJa[x.pick])}</div>` : ""}
              <div class="review-a">${FM.bi(q.a[0], q.aJa[0])}</div>
              <details class="review-ex"><summary>解説</summary>${FM.bi(q.ex, q.exJa)}</details>
            </div>`;
        }).join("")}
      </div>

      <div class="btn-row actions">
        <a class="btn" href="#/exam">模擬試験トップ</a>
        <a class="btn primary" href="#/stats">記録を見る</a>
      </div>`;
  });
})();
