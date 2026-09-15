FM.route("oral", (el) => {
  const questions = FM.questions.filter(q => ["2-oral2026", "2-nonperm2026"].includes(q.topic));
  el.innerHTML = `<p class="eyebrow">Teil II · Mündliche Vorbereitung</p>
    <h1>前回の出題テーマ・口頭練習</h1>
    <p class="notice">ご本人の出題メモをもとにした練習問題です。公式問題・公式模範解答ではありません。まずドイツ語で説明し、その後に回答例を開いてください。</p>
    <p>回答の順序：診断 → 理由・作用 → 手順 → 注意点 → お客様への説明。</p>
    <a class="btn" href="#/quiz?teil=2">4択クイズで練習する</a>
    <div class="stack" style="margin-top:20px">${questions.map((q,i) => `<article class="card">
      <h2 lang="de">${i+1}. ${FM.esc(q.q)}</h2><p>${FM.esc(q.qJa)}</p>
      <details><summary>回答例を見る / Antwortvorschlag</summary>
        <p lang="de">${FM.esc(q.a[0])}. ${FM.esc(q.ex)}</p>
        <p>${FM.esc(q.aJa[0])}。${FM.esc(q.exJa)}</p>
      </details></article>`).join("")}</div>
    <article class="card" style="margin-top:20px"><h2 lang="de">12. Welche acht Punkte prüfen Sie beim Schneiden und Stylen eines Bobs?</h2>
    <p>ボブをカット・スタイリングするとき、8つのポイントを説明してください。</p>
    <p class="notice">出題内容は推定です。以下は練習用に整理した8項目で、授業で指定された正解の8項目は未確認です。採点する4択問題には含めていません。</p>
    <details><summary>練習用の8項目を見る</summary><ol>
      <li>Beratung: Wunschform, Gesicht, Alltag. ／ 希望の形・顔立ち・日常の扱い方。</li>
      <li>Analyse: Dichte, Stärke, Struktur, Wirbel. ／ 密度・太さ・毛質・生え癖。</li>
      <li>Formplanung: Länge, Kontur, Scheitel, Gewicht. ／ 長さ・輪郭・分け目・重さの位置。</li>
      <li>Abteilungen und Führungslinie festlegen. ／ ブロッキングとガイドの設定。</li>
      <li>Kopfhaltung, Spannung und Abhebewinkel kontrollieren. ／ 頭の位置・テンション・引き出し角度。</li>
      <li>Balance und Übergänge im natürlichen Fall prüfen. ／ 自然落下で左右のバランスとつながりを確認。</li>
      <li>Föhnen: Ansatzvolumen, Luftführung, Bürste und Spitzenrichtung. ／ 根元のボリューム・風の方向・ブラシ・毛先の方向。</li>
      <li>Finish, trockene Endkontrolle und Heimpflege erklären. ／ 仕上げ・乾いた状態の最終確認・ホームケア説明。</li>
    </ol><p lang="de">Ich passe diese Punkte an die gewünschte Bobform an. Ein kompakter Bob und ein graduierter Bob benötigen unterschiedliche Winkel und Gewichtsverteilung.</p>
    <p>希望のボブに応じて調整します。ワンレングスとグラデーションでは角度と重さの配分が異なります。</p></details></article>
    <h2>参考資料</h2><p>2026年9月15日確認。回答例は学習用に要約・構成しています。製品固有の手順と保険の補償範囲は各メーカー・契約条件を確認してください。</p>
    <ul>
      <li><a href="https://www.wella.com/international/wella-magazine/read-you-color-your-hair">Wella：カラーとパーマの併用</a></li>
      <li><a href="https://www.wella.com/professional/m/_master/inspiration_gallery/DAWN/LOOKBOOKS-PAGES/Paride/Creatine_SEAL_Technical_Folder.pdf">Wella：パーマの技術資料・結合</a></li>
      <li><a href="https://pubmed.ncbi.nlm.nih.gov/23193691/">毛髪の還元・酸化に関する研究</a></li>
      <li><a href="https://www.hiscox.de/geschaeftskunden/friseure-kosmetik-studios-versicherung/">Hiscox：美容室の賠償責任保険</a></li>
      <li><a href="https://se-en.kryolan.com/blog/posts/color-theory-advanced">Kryolan：光とメイクの色彩</a></li>
      <li><a href="https://www.greatlengths.de/de/fragen_antworten/pflege_haarverlaengerung/">Great Lengths：エクステのケア</a></li>
    </ul><a class="btn" href="#/">ホームへ</a>`;
});
