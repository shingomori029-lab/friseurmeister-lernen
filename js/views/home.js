// Startseite: Tagesübersicht und Einstieg in die drei Prüfungsteile
FM.route("", (el) => {
  const s = FM.store;
  const cards = s.cardStats(FM.cards);
  const weak = FM.questions.filter((q) => s.isWeak(q.id)).length;

  const tiles = [2, 3, 4].map((t) => {
    const st = s.questionStats(FM.questionsFor(t));
    return `
      <a class="tile" href="#/quiz?teil=${t}">
        <div class="tile-head">
          <span class="tile-title">${FM.esc(FM.teilName(t))}</span>
          <span class="tile-meta">習得 ${st.mastered}/${st.total}</span>
        </div>
        <div class="muted small">${FM.esc(FM.teile[t].ja)}</div>
        ${FM.progress(st.progress)}
      </a>`;
  }).join("");

  el.innerHTML = `
    <p class="eyebrow">Meisterprüfung · Friseurhandwerk</p>
    <h1>今日も一歩ずつ</h1>
    <p class="muted">ドイツ語で解いて、わからなければ「訳」で日本語を確認しましょう。</p>

    <div class="grid3" style="margin-top:16px">
      <div class="stat-box"><div class="stat">${s.streak()}</div><div class="stat-label">連続日数</div></div>
      <div class="stat-box"><div class="stat">${s.activity(s.dayKey())}</div><div class="stat-label">今日の学習</div></div>
      <div class="stat-box"><div class="stat">${cards.open}</div><div class="stat-label">復習カード</div></div>
    </div>

    <h2>今日やること</h2>
    <div class="stack">
      ${cards.open
        ? `<a class="btn primary block" href="#/cards/run?teil=all">単語カードを復習する（${Math.min(cards.open, FM.CARD_SESSION_MAX)}枚）</a>`
        : `<div class="notice">今日のカード復習は完了しました 🎉</div>`}
      ${weak ? `<a class="btn block" href="#/quiz/run?teil=all&weak=1&n=all">苦手な問題をやり直す（${weak}問）</a>` : ""}
      <a class="btn block" href="#/quiz/run?teil=all&n=10">ランダム10問クイズ</a>
    </div>

    <h2>試験パート別</h2>
    <div class="stack">${tiles}</div>

    <p class="notice" style="margin-top:28px">
      問題は学習用に作成したものです。税額・期限などの数値は法改正で変わることがあるため、試験前に最新の情報を確認してください。
    </p>`;
});
