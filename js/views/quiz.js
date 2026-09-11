// Multiple-Choice-Quiz: Auswahl und Durchlauf mit sofortiger Rückmeldung
(function () {
  const pool = (p) =>
    FM.questionsFor(p.teil || "all", p.topic).filter((q) => p.weak !== "1" || FM.store.isWeak(q.id));

  const countOf = (p, available) =>
    !p.n || p.n === "all" ? available : Math.min(Number(p.n), available);

  FM.route("quiz", (el, params) => {
    const opt = { teil: params.teil || "all", topic: "all", n: "10", weak: "0" };

    function draw() {
      const available = pool(opt).length;
      const teilOptions = [{ value: "all", label: "すべて" }]
        .concat([2, 3, 4].map((t) => ({ value: t, label: FM.teile[t].short })));
      const topicOptions = [{ value: "all", label: "すべて" }]
        .concat(FM.topicsFor(opt.teil).map((t) => ({ value: t.key, label: t.de })));

      el.innerHTML = `
        <p class="eyebrow">クイズ</p>
        <h1>4択クイズ</h1>
        <p class="muted">答えるとすぐに正解と解説が表示されます。</p>

        <div class="field-label">試験パート</div>
        ${FM.chips("teil", teilOptions, opt.teil)}

        ${opt.teil !== "all" ? `<div class="field-label">分野</div>${FM.chips("topic", topicOptions, opt.topic)}` : ""}

        <div class="field-label">問題数</div>
        ${FM.chips("n", [{ value: "10", label: "10問" }, { value: "20", label: "20問" }, { value: "all", label: "全部" }], opt.n)}

        <div class="field-label">出題</div>
        ${FM.chips("weak", [{ value: "0", label: "すべての問題" }, { value: "1", label: "苦手な問題だけ" }], opt.weak)}

        <div class="actions">
          ${available
            ? `<button class="btn primary block" data-act="start">スタート（${countOf(opt, available)}問）</button>`
            : `<p class="empty">この条件の苦手な問題はありません 🎉</p>`}
        </div>`;
    }

    el.onclick = (e) => {
      const b = e.target.closest("[data-act]");
      if (!b) return;
      if (b.dataset.act === "chip") {
        opt[b.dataset.name] = b.dataset.value;
        if (b.dataset.name === "teil") opt.topic = "all";
        draw();
      }
      if (b.dataset.act === "start") FM.go("quiz/run?" + new URLSearchParams(opt));
    };

    draw();
  });

  FM.route("quiz/run", (el, params) => {
    const available = FM.shuffle(pool(params));
    const items = available.slice(0, countOf(params, available.length))
      .map((q) => ({ q, order: FM.shuffle([0, 1, 2, 3]) }));
    const wrong = [];
    let i = 0;
    let correct = 0;

    if (!items.length) {
      el.innerHTML = `<div class="empty"><p>出題できる問題がありません。</p><a class="btn" href="#/quiz">設定に戻る</a></div>`;
      return;
    }

    function drawQuestion() {
      const { q, order } = items[i];
      el.innerHTML = `
        <section data-ja-scope>
          <div class="qhead">
            <span>${i + 1} / ${items.length} · ${FM.esc(FM.topics[q.topic].de)}</span>
            ${FM.jaButton()}
          </div>
          ${FM.progress((i / items.length) * 100)}
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
      const { q } = items[i];
      const ok = k === 0;
      FM.store.recordAnswer(q.id, ok);
      if (ok) correct++;
      else wrong.push(q);

      el.querySelectorAll(".option").forEach((b) => {
        const bk = Number(b.dataset.k);
        b.disabled = true;
        b.classList.add(bk === 0 ? "correct" : bk === k ? "wrong" : "dim");
      });

      const after = el.querySelector("#after");
      after.innerHTML = `
        <div class="feedback ${ok ? "ok" : "ng"}">
          <div class="feedback-title">${ok ? "正解！ · Richtig" : "不正解 · Leider falsch"}</div>
          ${FM.bi(q.ex, q.exJa)}
        </div>
        <div class="actions">
          <button type="button" class="btn primary block" data-act="next">${i + 1 < items.length ? "次の問題" : "結果を見る"}</button>
        </div>`;
      after.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function drawResult() {
      const pct = Math.round((correct / items.length) * 100);
      el.innerHTML = `
        <div class="card result-hero">
          <p class="eyebrow">結果</p>
          <div class="big">${pct}%</div>
          <p>${items.length}問中 ${correct}問 正解</p>
        </div>
        ${wrong.length ? `
          <h2>間違えた問題</h2>
          <div class="stack">${wrong.map((q) => `
            <div class="card" data-ja-scope>
              <div class="row spread"><span class="small muted">${FM.esc(FM.topics[q.topic].de)}</span>${FM.jaButton()}</div>
              <div class="review-q">${FM.bi(q.q, q.qJa)}</div>
              <div class="review-a">${FM.bi(q.a[0], q.aJa[0])}</div>
              <details class="review-ex"><summary>解説</summary>${FM.bi(q.ex, q.exJa)}</details>
            </div>`).join("")}
          </div>` : ""}
        <div class="btn-row actions">
          <a class="btn" href="#/quiz">設定に戻る</a>
          <button type="button" class="btn primary" data-act="again">もう一度</button>
        </div>`;
      window.scrollTo(0, 0);
    }

    el.onclick = (e) => {
      const b = e.target.closest("[data-act]");
      if (!b || b.disabled) return;
      if (b.dataset.act === "answer") answer(Number(b.dataset.k));
      if (b.dataset.act === "next") {
        i++;
        if (i < items.length) { drawQuestion(); window.scrollTo(0, 0); } else drawResult();
      }
      if (b.dataset.act === "again") FM.render();
    };

    drawQuestion();
  });
})();
