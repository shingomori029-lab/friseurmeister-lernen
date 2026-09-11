// Kern: Router, Hilfsfunktionen, Übersetzungsschalter
(function () {
  const routes = {};
  let app;
  let cleanup = null;

  // ---- Hilfsfunktionen ----
  const ENT = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  FM.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ENT[c]);

  FM.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  FM.teilName = (teil) => `${FM.teile[teil].short} · ${FM.teile[teil].de}`;

  FM.questionsFor = (teil, topic) =>
    FM.questions.filter((q) =>
      (teil === "all" || q.teil === Number(teil)) && (!topic || topic === "all" || q.topic === topic));

  FM.cardsFor = (teil) => FM.cards.filter((c) => teil === "all" || c.teil === Number(teil));

  FM.topicsFor = (teil) => Object.values(FM.topics).filter((t) => teil === "all" || t.teil === Number(teil));

  // Deutscher Text mit ausblendbarer japanischer Übersetzung
  FM.bi = (de, ja, tag = "div") =>
    `<${tag} class="de" lang="de">${FM.esc(de)}</${tag}><${tag} class="ja" lang="ja">${FM.esc(ja)}</${tag}>`;

  FM.jaButton = () =>
    `<button type="button" class="ja-btn" data-ja-toggle aria-pressed="false">日本語訳</button>`;

  FM.chips = (name, options, selected) =>
    `<div class="chips" role="group">${options.map((o) =>
      `<button type="button" class="chip" data-act="chip" data-name="${name}" data-value="${FM.esc(o.value)}"
        aria-pressed="${String(o.value) === String(selected)}">${FM.esc(o.label)}</button>`).join("")}</div>`;

  FM.progress = (pct) => `<div class="progress"><span style="width:${Math.max(0, Math.min(100, pct))}%"></span></div>`;

  FM.formatTime = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  FM.partName = (teil) => (teil === "all" ? "すべてのパート" : FM.teilName(teil));

  // label wird als HTML eingesetzt – vorher escapen
  FM.barRow = (label, value, pct) => `
    <div class="bar-row">
      <span class="bar-label">${label}</span><span class="bar-value">${FM.esc(value)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>
    </div>`;

  // ---- Router ----
  // Views: FM.route("quiz/run", (el, params) => { ... }). Eine View setzt el.innerHTML
  // und el.onclick selbst; mit FM.onLeave(fn) räumt sie beim Verlassen auf (z. B. Timer).
  FM.route = (name, fn) => { routes[name] = fn; };
  FM.go = (path) => { location.hash = "#/" + path; };
  FM.onLeave = (fn) => { cleanup = fn; };

  function parse() {
    const [path, query] = location.hash.replace(/^#\/?/, "").split("?");
    return { path: path || "", params: Object.fromEntries(new URLSearchParams(query || "")) };
  }

  function render() {
    if (cleanup) { cleanup(); cleanup = null; }
    const { path, params } = parse();
    app.onclick = null;
    app.onkeydown = null;
    app.innerHTML = "";
    (routes[path] || routes[""])(app, params);
    const tab = path.split("/")[0] || "home";
    document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
    window.scrollTo(0, 0);
  }
  FM.render = render;

  // ---- Übersetzung ----
  function applyLang() {
    const on = !!FM.store.setting("showJa");
    document.body.classList.toggle("show-ja", on);
    document.getElementById("langToggle").setAttribute("aria-pressed", String(on));
  }
  FM.applyLang = applyLang;

  FM.start = () => {
    FM.store.load();
    app = document.getElementById("app");
    applyLang();

    document.getElementById("langToggle").addEventListener("click", () => {
      FM.store.setting("showJa", !FM.store.setting("showJa"));
      applyLang();
    });

    // Übersetzung nur für einen Bereich einblenden
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-ja-toggle]");
      const scope = btn && btn.closest("[data-ja-scope]");
      if (!scope) return;
      scope.classList.toggle("reveal-ja");
      btn.setAttribute("aria-pressed", String(scope.classList.contains("reveal-ja")));
    });

    window.addEventListener("hashchange", render);
    render();

    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
    }
  };
})();
