// Gemeinsamer Namensraum. Wird vor allen Datendateien geladen.
// Fragen: die richtige Antwort steht in den Daten immer an erster Stelle,
// die Reihenfolge wird beim Anzeigen gemischt.
window.FM = {
  CARD_SESSION_MAX: 20, // Karten pro Lerndurchgang
  questions: [],
  cards: [],
  topics: {},
  teile: {
    2: { short: "Teil II", de: "Fachtheorie", ja: "専門理論" },
    3: { short: "Teil III", de: "BWL & Recht", ja: "経営・法律" },
    4: { short: "Teil IV", de: "AEVO", ja: "職業訓練指導員" },
  },
};

// rows: [frage, frageJa, [antworten], [antwortenJa], erklärung, erklärungJa]
FM.addQuestions = function (teil, topic, de, ja, rows) {
  var key = teil + "-" + topic;
  FM.topics[key] = { key: key, teil: teil, de: de, ja: ja };
  rows.forEach(function (r, i) {
    FM.questions.push({
      id: "t" + key + "-" + i,
      teil: teil,
      topic: key,
      q: r[0], qJa: r[1],
      a: r[2], aJa: r[3],
      ex: r[4], exJa: r[5],
    });
  });
};

// rows: [begriff, japanisch, erklärung]
FM.addCards = function (teil, rows) {
  rows.forEach(function (r, i) {
    FM.cards.push({ id: "c" + teil + "-" + i, teil: teil, de: r[0], ja: r[1], ex: r[2] });
  });
};
