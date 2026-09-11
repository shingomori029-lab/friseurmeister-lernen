// Lernstatistik, Prüfungsverlauf und Einstellungen
FM.route("stats", (el) => {
  const s = FM.store;
  const overall = s.questionStats(FM.questions);
  const cards = s.cardStats(FM.cards);
  const exams = s.exams();

  const days = [];
  const d = new Date();
  d.setDate(d.getDate() - 13);
  for (let i = 0; i < 14; i++) {
    const key = s.dayKey(d);
    const v = s.activity(key);
    const level = v >= 30 ? "l3" : v >= 10 ? "l2" : v > 0 ? "l1" : "";
    days.push(`<span class="${level}" title="${key}: ${v}"></span>`);
    d.setDate(d.getDate() + 1);
  }

  const teilCards = [2, 3, 4].map((t) => `
    <div class="card" style="margin-top:10px">
      <div class="tile-title">${FM.esc(FM.teilName(t))}</div>
      ${FM.topicsFor(t).map((tp) => {
        const st = s.questionStats(FM.questionsFor(t, tp.key));
        const weak = st.n >= 3 && st.pct < 60 ? ` <span class="badge fail tiny">苦手</span>` : "";
        const value = `${st.mastered}/${st.total}${st.pct !== null ? ` · ${st.pct}%` : ""}`;
        return FM.barRow(FM.esc(tp.de) + weak, value, st.progress);
      }).join("")}
    </div>`).join("");

  el.innerHTML = `
    <p class="eyebrow">学習の記録</p>
    <h1>記録</h1>

    <div class="grid3" style="margin-top:16px">
      <div class="stat-box"><div class="stat">${s.streak()}</div><div class="stat-label">連続日数</div></div>
      <div class="stat-box"><div class="stat">${overall.pct ?? "–"}${overall.pct !== null ? "<small>%</small>" : ""}</div><div class="stat-label">正答率</div></div>
      <div class="stat-box"><div class="stat">${cards.learned}</div><div class="stat-label">覚えた用語</div></div>
    </div>

    <h2>最近14日間</h2>
    <div class="card">
      <div class="days">${days.join("")}</div>
      <div class="row spread small muted" style="margin-top:8px"><span>2週間前</span><span>今日</span></div>
    </div>

    <h2>分野別の習得度</h2>
    <p class="muted small">バーは「最後に正解した問題」の割合、%は累計の正答率です。3回以上解いて正答率60%未満の分野に「苦手」が付きます。</p>
    ${teilCards}

    <h2>模擬試験の履歴</h2>
    <div class="card">
      ${exams.length ? `<ul class="list">${exams.map((x) => `
        <li>
          <span>${new Date(x.date).toLocaleDateString("ja-JP")} · ${FM.esc(FM.partName(x.teil))}</span>
          <span><strong>${x.pct}%</strong> <span class="badge ${x.passed ? "pass" : "fail"} tiny">${x.passed ? "合格" : "不合格"}</span></span>
        </li>`).join("")}</ul>`
        : `<p class="empty">まだ模擬試験を受けていません</p>`}
    </div>

    <h2>設定</h2>
    <div class="card stack">
      <div class="row spread">
        <span>日本語訳を常に表示</span>
        ${FM.chips("showJa", [{ value: "0", label: "オフ" }, { value: "1", label: "オン" }], s.setting("showJa") ? "1" : "0")}
      </div>
      <button type="button" class="btn danger block" data-act="reset">学習データをすべて消去</button>
      <p class="muted small">学習データはこの端末のブラウザにだけ保存されています。</p>
    </div>`;

  el.onclick = (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    if (b.dataset.act === "chip") {
      s.setting("showJa", b.dataset.value === "1");
      FM.applyLang();
      FM.render();
    }
    if (b.dataset.act === "reset" && confirm("学習データをすべて消去します。元に戻せません。よろしいですか？")) {
      s.reset();
      FM.applyLang();
      FM.render();
    }
  };
});
