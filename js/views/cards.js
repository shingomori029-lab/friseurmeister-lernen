// Lernkarten mit Leitner-System: gewusste Karten kommen in wachsenden Abständen wieder
(function () {
  const SESSION_MAX = FM.CARD_SESSION_MAX;

  FM.route("cards", (el) => {
    const decks = ["all", 2, 3, 4];

    el.innerHTML = `
      <p class="eyebrow">単語カード</p>
      <h1>専門用語カード</h1>
      <p class="muted">「覚えた」カードは 1日 → 3日 → 7日 → 14日 → 30日 と間隔をあけて再出題。「もう一度」のカードはすぐにまた出ます。</p>
      <div class="stack" style="margin-top:16px">
        ${decks.map((teil) => {
          const st = FM.store.cardStats(FM.cardsFor(teil));
          return `
            <div class="card">
              <div class="tile-head">
                <span class="tile-title">${FM.esc(FM.partName(teil))}</span>
                <span class="tile-meta">覚えた ${st.learned}/${st.total}</span>
              </div>
              <div class="muted small">今日の復習 ${st.due}枚 · 新しいカード ${st.fresh}枚</div>
              ${FM.progress((st.learned / st.total) * 100)}
              <div class="btn-row actions">
                <a class="btn primary" href="#/cards/run?teil=${teil}">学習する（${Math.min(st.open, SESSION_MAX)}）</a>
                <a class="btn" href="#/cards/run?teil=${teil}&mode=all">全部めくる</a>
              </div>
            </div>`;
        }).join("")}
      </div>`;
  });

  FM.route("cards/run", (el, params) => {
    const teil = params.teil || "all";
    const all = FM.cardsFor(teil);
    const queue = params.mode === "all"
      ? FM.shuffle(all)
      : FM.shuffle(all.filter((c) => FM.store.isDue(c.id))).slice(0, SESSION_MAX);
    let done = 0;

    if (!queue.length) {
      el.innerHTML = `
        <div class="empty">
          <p>今日の復習はすべて終わりました 🎉</p>
          <a class="btn" href="#/cards/run?teil=${teil}&mode=all">全部めくる</a>
        </div>`;
      return;
    }

    function draw() {
      if (!queue.length) return drawDone();
      const c = queue[0];
      el.innerHTML = `
        <div class="qhead">
          <span>${FM.esc(FM.partName(teil))}</span>
          <span>残り ${queue.length}</span>
        </div>
        ${FM.progress((done / (done + queue.length)) * 100)}
        <div class="flash" data-act="flip" role="button" tabindex="0" aria-label="カードをめくる">
          <div class="flash-inner">
            <div class="flash-face flash-front">
              <div class="term" lang="de">${FM.esc(c.de)}</div>
              <div class="flash-hint">タップしてめくる</div>
            </div>
            <div class="flash-face flash-back" aria-hidden="true">
              <div class="small muted" lang="de">${FM.esc(c.de)}</div>
              <div class="term-ja" lang="ja">${FM.esc(c.ja)}</div>
              <div class="muted" lang="de">${FM.esc(c.ex)}</div>
            </div>
          </div>
        </div>
        <div class="btn-row actions">
          <button type="button" class="btn" data-act="rate" data-knew="0" disabled>もう一度</button>
          <button type="button" class="btn primary" data-act="rate" data-knew="1" disabled>覚えた</button>
        </div>`;
    }

    function flip() {
      const f = el.querySelector(".flash");
      const on = f.classList.toggle("flipped");
      f.querySelector(".flash-front").setAttribute("aria-hidden", String(on));
      f.querySelector(".flash-back").setAttribute("aria-hidden", String(!on));
      el.querySelectorAll("[data-act=rate]").forEach((b) => { b.disabled = false; });
    }

    function drawDone() {
      el.innerHTML = `
        <div class="card result-hero">
          <p class="eyebrow">おつかれさま</p>
          <div class="big">${done}</div>
          <p>枚のカードを復習しました</p>
        </div>
        <div class="btn-row actions">
          <a class="btn" href="#/cards">デッキ一覧</a>
          <a class="btn primary" href="#/">ホーム</a>
        </div>`;
    }

    el.onclick = (e) => {
      const b = e.target.closest("[data-act]");
      if (!b || b.disabled) return;
      if (b.dataset.act === "flip") flip();
      if (b.dataset.act === "rate") {
        const c = queue.shift();
        const knew = b.dataset.knew === "1";
        FM.store.rateCard(c.id, knew);
        if (knew) done++;
        else queue.splice(Math.min(3, queue.length), 0, c); // nach ein paar Karten erneut
        draw();
      }
    };

    el.onkeydown = (e) => {
      if ((e.key === " " || e.key === "Enter") && e.target.closest(".flash")) {
        e.preventDefault();
        flip();
      }
    };

    draw();
  });
})();
