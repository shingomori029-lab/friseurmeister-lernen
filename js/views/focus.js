// Intensivlernen je Prüfungsteil: Übersicht nach Themen, Drill und Merkliste.
// Im Drill kommt eine falsch beantwortete Frage in derselben Runde wieder, bis sie sitzt.
(function () {
  const REPEAT_AFTER = 3; // falsch beantwortete Frage kommt nach so vielen anderen erneut

  // Zahlen, Fristen, Paragraphen: die richtige Antwort enthält eine Ziffer
  const isNumeric = (q) => /\d/.test(q.a[0]);

  const MODES = {
    all: { label: "すべて", test: () => true },
    zahl: { label: "数字・期限", test: isNumeric },
    weak: { label: "苦手", test: (q) => FM.store.isWeak(q.id) },
  };

  const pool = (teil, topic, mode) => FM.questionsFor(teil, topic).filter((MODES[mode] || MODES.all).test);

  // Reihenfolge: zuletzt falsch → noch nie gesehen → am längsten nicht geübt
  function prioritise(list) {
    const rank = (q) => {
      const s = FM.store.answerState(q.id);
      if (!s) return [1, 0];
      return [s.last === 0 ? 0 : 2, s.d || 0];
    };
    return FM.shuffle(list)
      .map((q) => ({ q, r: rank(q) }))
      .sort((a, b) => a.r[0] - b.r[0] || a.r[1] - b.r[1])
      .map((x) => x.q);
  }

  const counts = (list) => {
    const st = FM.store.questionStats(list);
    return { ...st, weak: st.seen - st.mastered, fresh: st.total - st.seen };
  };

  const countsRow = (c) => `
    <div class="counts">
      <span>習得 <b>${c.mastered}</b>/${c.total}</span>
      <span>未着手 <b>${c.fresh}</b></span>
      <span class="${c.weak ? "is-weak" : ""}">苦手 <b>${c.weak}</b></span>
    </div>`;

  const runUrl = (teil, opt) => "#/focus/run?" + new URLSearchParams({ teil, ...opt });

  // ---- Übersicht ----
  FM.route("focus", (el, params) => {
    let teil = ["2", "3", "4"].includes(params.teil) ? params.teil : "3";

    function draw() {
      const n = FM.store.setting("drillSize") || "10";
      const all = FM.questionsFor(teil);
      const total = counts(all);
      const zahl = all.filter(isNumeric).length;

      el.innerHTML = `
        <p class="eyebrow">集中学習</p>
        <h1>${FM.esc(FM.teilName(teil))}</h1>
        <p class="muted">間違えた問題は、正解できるまで同じ回のうちにもう一度出ます。出題は「苦手 → 未着手 → しばらく解いていない」の順です。</p>

        ${FM.chips("teil", [2, 3, 4].map((t) => ({ value: t, label: FM.teile[t].short })), teil)}

        <div class="field-label">1回の問題数</div>
        ${FM.chips("drillSize", [{ value: "10", label: "10問" }, { value: "20", label: "20問" }, { value: "all", label: "全部" }], n)}

        <div class="stack" style="margin-top:20px">
          <div class="card">
            <div class="tile-title">全分野まとめて</div>
            ${countsRow(total)}
            ${FM.progress(total.progress)}
            <div class="stack actions">
              <a class="btn primary block" href="${runUrl(teil, { n })}">集中ドリルを始める</a>
              <div class="btn-row">
                <a class="btn" href="${runUrl(teil, { mode: "zahl", n })}">数字・期限 ${zahl}</a>
                ${total.weak
                  ? `<a class="btn" href="${runUrl(teil, { mode: "weak", n: "all" })}">苦手 ${total.weak}</a>`
                  : `<span class="btn" aria-disabled="true">苦手なし</span>`}
              </div>
            </div>
          </div>

          ${FM.topicsFor(teil).map((t) => {
            const c = counts(FM.questionsFor(teil, t.key));
            return `
              <div class="card">
                <div class="tile-title" lang="de">${FM.esc(t.de)}</div>
                <div class="muted small">${FM.esc(t.ja)}</div>
                ${countsRow(c)}
                ${FM.progress(c.progress)}
                <div class="btn-row actions">
                  <a class="btn primary" href="${runUrl(teil, { topic: t.key, n })}">集中ドリル</a>
                  <a class="btn" href="#/focus/list?${new URLSearchParams({ topic: t.key })}">一覧で読む</a>
                </div>
              </div>`;
          }).join("")}
        </div>

        <div class="btn-row actions">
          <a class="btn" href="#/cards/run?teil=${teil}">単語カード</a>
          <a class="btn" href="#/exam">模擬試験</a>
        </div>`;
    }

    el.onclick = (e) => {
      const b = e.target.closest("[data-act=chip]");
      if (!b) return;
      if (b.dataset.name === "teil") teil = b.dataset.value;
      else FM.store.setting("drillSize", b.dataset.value);
      draw();
    };

    draw();
  });

  // ---- Drill ----
  FM.route("focus/run", (el, params) => {
    const teil = params.teil || "3";
    const back = "#/focus?teil=" + encodeURIComponent(teil);
    const ordered = prioritise(pool(teil, params.topic, params.mode));
    const size = !params.n || params.n === "all" ? ordered.length : Math.min(Number(params.n) || 10, ordered.length);
    const queue = ordered.slice(0, size).map((q) => ({ q, tries: 0 }));
    const total = queue.length;
    const repeated = [];
    let done = 0;
    let lastOk = false;

    if (!total) {
      el.innerHTML = `
        <div class="empty">
          <p>${params.mode === "weak" ? "苦手な問題はありません 🎉" : "出題できる問題がありません。"}</p>
          <a class="btn" href="${back}">分野一覧に戻る</a>
        </div>`;
      return;
    }

    function drawQuestion() {
      const { q, tries } = queue[0];
      const order = FM.shuffle([0, 1, 2, 3]); // bei jeder Wiederholung neu gemischt
      el.innerHTML = `
        <section data-ja-scope>
          <div class="qhead">
            <span>クリア ${done} / ${total} · ${FM.esc(FM.topics[q.topic].de)}</span>
            ${FM.jaButton()}
          </div>
          ${FM.progress((done / total) * 100)}
          ${tries ? `<p class="retry-note"><span class="badge fail tiny">もう一度</span> さっき間違えた問題です</p>` : ""}
          <div class="question">${FM.bi(q.q, q.qJa)}</div>
          <div class="options">
            ${order.map((k, idx) => `
              <button type="button" class="option" data-act="answer" data-k="${k}">
                <span class="key">${"ABCD"[idx]}</span>
                <span class="txt">${FM.bi(q.a[k], q.aJa[k], "span")}</span>
              </button>`).join("")}
          </div>
          <div id="after"></div>
        </section>`;
    }

    function answer(k) {
      const { q } = queue[0];
      lastOk = k === 0;
      FM.store.recordAnswer(q.id, lastOk);

      el.querySelectorAll(".option").forEach((b) => {
        const bk = Number(b.dataset.k);
        b.disabled = true;
        b.classList.add(bk === 0 ? "correct" : bk === k ? "wrong" : "dim");
      });

      const last = lastOk && queue.length === 1;
      const after = el.querySelector("#after");
      after.innerHTML = `
        <div class="feedback ${lastOk ? "ok" : "ng"}">
          <div class="feedback-title">${lastOk ? "正解！ · Richtig" : "不正解 · Leider falsch"}</div>
          ${FM.bi(q.ex, q.exJa)}
          ${lastOk ? "" : `<p class="small muted" style="margin:10px 0 0">この問題は少しあとでもう一度出ます。</p>`}
        </div>
        <div class="actions">
          <button type="button" class="btn primary block" data-act="next">${last ? "結果を見る" : "次へ"}</button>
        </div>`;
      after.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function next() {
      const item = queue.shift();
      if (lastOk) {
        done++;
        if (item.tries) repeated.push(item);
      } else {
        item.tries++;
        queue.splice(Math.min(REPEAT_AFTER, queue.length), 0, item);
      }
      if (queue.length) drawQuestion();
      else drawResult();
      window.scrollTo(0, 0);
    }

    function drawResult() {
      const firstTry = total - repeated.length;
      const rest = counts(pool(teil, params.topic, params.mode));
      el.innerHTML = `
        <div class="card result-hero">
          <p class="eyebrow">全${total}問クリア</p>
          <div class="big">${firstTry}<small> / ${total}</small></div>
          <p>一回目で正解できた問題</p>
          <p class="muted small" style="margin:0">この範囲の習得 ${rest.mastered}/${rest.total} · 未着手 ${rest.fresh}</p>
        </div>
        ${repeated.length ? `
          <h2>繰り返した問題</h2>
          <p class="muted small">次のセットや翌日にもう一度解くと定着します。</p>
          <div class="stack">${repeated.map(({ q, tries }) => `
            <div class="card" data-ja-scope>
              <div class="row spread"><span class="small muted">間違い ${tries}回</span>${FM.jaButton()}</div>
              <div class="review-q">${FM.bi(q.q, q.qJa)}</div>
              <div class="review-a">${FM.bi(q.a[0], q.aJa[0])}</div>
              <details class="review-ex"><summary>解説</summary>${FM.bi(q.ex, q.exJa)}</details>
            </div>`).join("")}
          </div>` : ""}
        <div class="btn-row actions">
          <a class="btn" href="${back}">分野一覧</a>
          <button type="button" class="btn primary" data-act="again">次のセット</button>
        </div>`;
    }

    el.onclick = (e) => {
      const b = e.target.closest("[data-act]");
      if (!b || b.disabled) return;
      if (b.dataset.act === "answer") answer(Number(b.dataset.k));
      if (b.dataset.act === "next") next();
      if (b.dataset.act === "again") FM.render();
    };

    drawQuestion();
  });

  // ---- Merkliste: Frage, richtige Antwort und Erklärung zum Durchlesen ----
  FM.route("focus/list", (el, params) => {
    const topic = FM.topics[params.topic];
    if (!topic) return FM.go("focus");
    let mode = "all";

    const mark = (q) => {
      const s = FM.store.answerState(q.id);
      if (!s) return `<span class="muted">未着手</span>`;
      return s.last === 1 ? `<span class="status-ok">✓ 習得</span>` : `<span class="status-ng">✗ 苦手</span>`;
    };

    function draw() {
      const list = pool(topic.teil, topic.key, mode);
      el.innerHTML = `
        <p class="eyebrow">${FM.esc(FM.teilName(topic.teil))} · 一覧で読む</p>
        <h1 lang="de">${FM.esc(topic.de)}</h1>
        <p class="muted">問題と正解、解説をまとめて読めます。読んでからドリルで確認しましょう。</p>
        ${FM.chips("mode", ["all", "zahl", "weak"].map((m) => ({ value: m, label: MODES[m].label })), mode)}
        <div class="actions">
          <a class="btn primary block" href="${runUrl(topic.teil, { topic: topic.key, mode, n: FM.store.setting("drillSize") || "10" })}">この範囲をドリルする（${list.length}問）</a>
        </div>
        <div class="stack" style="margin-top:20px">
          ${list.length ? list.map((q, i) => `
            <article class="card" data-ja-scope>
              <div class="row spread"><span class="small">${i + 1}. ${mark(q)}</span>${FM.jaButton()}</div>
              <div class="review-q">${FM.bi(q.q, q.qJa)}</div>
              <div class="review-a">${FM.bi(q.a[0], q.aJa[0])}</div>
              <div class="note-ex">${FM.bi(q.ex, q.exJa)}</div>
            </article>`).join("") : `<p class="empty">この条件の問題はありません。</p>`}
        </div>
        <div class="actions"><a class="btn block" href="#/focus?teil=${topic.teil}">分野一覧に戻る</a></div>`;
    }

    el.onclick = (e) => {
      const b = e.target.closest("[data-act=chip]");
      if (!b) return;
      mode = b.dataset.value;
      draw();
    };

    draw();
  });
})();
