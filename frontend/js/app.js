/* ============================================================
   Swaradhyayan – Raaga Knowledge Module
   Talks to the BaseX RESTXQ API through Apache reverse proxy at /api/*
   Falls back to static data when API is unavailable.
   ============================================================ */
const API_BASE = "/api";
const DEFAULT_RAAGA = "yaman";
const SWARA_ORDER = ["S", "R", "G", "M", "P", "D", "N"];

let audioCtx = null;
let activeOsc = null;

// ---- Static fallback data (shown when API is not reachable) ----
const FALLBACK_RAAGA = {
  id: "yaman",
  name: "Yaman",
  thaat: "Kalyan",
  jati: "Sampoorna – Sampoorna",
  aroh: "N R G M♯ P D N S'",
  avroh: "S' N D P M♯ G R S",
  vadi: "Gandhar (G)",
  samvadi: "Nishad (N)",
  pakad: "N R G M♯ P, D N S' | S' N D P, M♯ G R S",
  chalan: "N R G M♯, G R S | R G M♯ P, D N D P, M♯ G R",
  nyasSwar: "G, N",
  varjitSwar: "— (None)",
  timeOfPerformance: "Evening (6 PM – 9 PM)",
  season: "All Seasons (Best in Sharad)",
  rasa: "Peaceful, Devotional, Serene",
  signatureNote: "Teevra Ma (Mᵀ) is the signature swara of Raag Yaman.",
  notesUsed: 7,
  practiceFriendly: "Yes",
  learningTips: [
    "Focus on the smooth glide (meend) between N–R and G–Mᵀ.",
    "Do not touch Ma natural; only use Teevra Ma (Mᵀ).",
    "Spend time on the Pakad and Chalan to internalize the identity of Yaman."
  ],
  guruQuote: {
    text: "Yaman is a Raag of light and devotion.\nLet your Riyaz in the evening be your offering.",
    author: "Pt. Omkarnath Thakur"
  }
};

const FALLBACK_SIMILAR = [
  { id: "kalyan",         name: "Kalyan",        relation: "Same Thaat" },
  { id: "puriya-kalyan",  name: "Puriya Kalyan", relation: "Evening Raaga" },
  { id: "shuddha-kalyan", name: "Shuddha Kalyan",relation: "Different Prayog" }
];

document.addEventListener("DOMContentLoaded", () => {
  buildWaveforms();
  wireFilterBar();
  wireSearch();
  wireAudioDemos();
  wireFavoriteButton();
  markActiveSidebarItem();

  const requested = new URLSearchParams(window.location.search).get("raaga");
  loadRaaga(requested || DEFAULT_RAAGA);
});

/* ---- Sidebar active state ---------------------------------- */
function markActiveSidebarItem() {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
    item.classList.remove("active");
  });
  // index.html = raaga-knowledge page in this app
  const match = document.querySelector(`.nav-item[data-page="raaga-knowledge"]`);
  if (match) match.classList.add("active");
}

/* ---- Build decorative waveforms ---------------------------- */
function buildWaveforms() {
  const patterns = [
    [4,7,11,16,20,14,8,18,22,16,10,6,12,20,24,18,12,8,14,22,20,14,10,6,9,15,19,22,17,12,7,10,16,20,18,13,8,5],
    [5,9,14,19,22,16,10,7,13,21,18,12,6,10,17,23,20,15,9,6,11,18,22,16,10,7,12,20,24,18,13,8,5,9,15,19,14,8]
  ];
  [document.getElementById("wave1"), document.getElementById("wave2")].forEach((el, wi) => {
    if (!el) return;
    const heights = patterns[wi];
    el.innerHTML = heights.map((h, i) => {
      const opacity = 0.3 + (h / 28) * 0.6;
      return `<span style="height:${h}px;opacity:${opacity}"></span>`;
    }).join("");
    el.style.flex = "1";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.gap = "2px";
  });
}

/* ---- API helpers ------------------------------------------- */
async function apiGet(path) {
  const res = await fetch(API_BASE + path, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("API " + res.status + " on " + path);
  return res.json();
}

/* ---- Filter bar -------------------------------------------- */
function wireFilterBar() {
  const applyBtn = document.getElementById("apply-filters-btn");
  const resetBtn = document.getElementById("reset-filters-btn");
  if (applyBtn) applyBtn.addEventListener("click", applyFilters);
  if (resetBtn) resetBtn.addEventListener("click", resetFilters);
}

async function applyFilters() {
  try {
    const params = buildFilterParams();
    const data = await apiGet("/raagas?" + params.toString());
    renderResultsStrip(data);
    if (data.count > 0) {
      showEmpty(false);
      document.getElementById("raaga-panels").hidden = false;
      loadRaaga(data.results[0].id);
    } else {
      showEmpty(true);
      document.getElementById("raaga-panels").hidden = true;
    }
  } catch (err) {
    console.warn("API unavailable, using fallback:", err);
  }
}

function resetFilters() {
  ["f-search","f-thaat","f-time","f-mood","f-difficulty"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const strip = document.getElementById("results-strip");
  if (strip) strip.hidden = true;
  showEmpty(false);
  const panels = document.getElementById("raaga-panels");
  if (panels) panels.hidden = false;
  loadRaaga(DEFAULT_RAAGA);
}

function buildFilterParams() {
  const p = new URLSearchParams();
  const fields = { q:"f-search", thaat:"f-thaat", time:"f-time", mood:"f-mood", difficulty:"f-difficulty" };
  Object.entries(fields).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el && el.value) p.set(key, el.value);
  });
  return p;
}

function renderResultsStrip(data) {
  const strip = document.getElementById("results-strip");
  if (!strip) return;
  strip.hidden = false;
  const name = data.results?.[0]?.name ?? "";
  strip.textContent = data.count === 1
    ? `1 raaga matches your filters.`
    : `${data.count} raagas match your filters — showing "${name}" first.`;
}

/* ---- Search suggestion box --------------------------------- */
function wireSearch() {
  const input = document.getElementById("f-search");
  const box   = document.getElementById("search-suggest");
  if (!input || !box) return;
  let timer = null;

  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) { box.classList.remove("open"); box.innerHTML = ""; return; }
    timer = setTimeout(async () => {
      try {
        const data = await apiGet("/raagas?q=" + encodeURIComponent(q));
        box.innerHTML = "";
        if (!data.count) {
          box.innerHTML = `<div style="color:var(--ink-faint)">No raagas found</div>`;
        } else {
          data.results.forEach((r) => {
            const row = document.createElement("div");
            row.textContent = `${r.name} · ${r.thaat}`;
            row.setAttribute("role", "option");
            row.addEventListener("click", () => {
              input.value = r.name;
              box.classList.remove("open");
              loadRaaga(r.id);
            });
            box.appendChild(row);
          });
        }
        box.classList.add("open");
      } catch {/* ignore */ }
    }, 250);
  });

  document.addEventListener("click", (e) => {
    if (!box.contains(e.target) && e.target !== input) box.classList.remove("open");
  });
}

/* ---- Load & render raaga ----------------------------------- */
async function loadRaaga(id) {
  try {
    const [detail, similar] = await Promise.all([
      apiGet("/raagas/" + encodeURIComponent(id)),
      apiGet("/raagas/" + encodeURIComponent(id) + "/similar"),
    ]);
    showEmpty(false);
    showError(false);
    renderRaaga(detail, similar.results ?? []);
  } catch (err) {
    console.warn("API unavailable – using fallback data:", err);
    showEmpty(false);
    showError(false);
    renderRaaga(FALLBACK_RAAGA, FALLBACK_SIMILAR);
  }
}

function renderRaaga(r, similar) {
  const nameEl = document.getElementById("raaga-name");
  if (nameEl) {
    nameEl.textContent = "Raag " + r.name;
    document.title = "Raag " + r.name + " — Swaradhyayan";
  }

  renderFields(r);
  const sigEl = document.getElementById("signature-note");
  if (sigEl) sigEl.innerHTML = `ℹ️ ${formatSwaras(r.signatureNote)}`;

  renderNotation(r.aroh, r.avroh);
  renderDistribution(r.aroh, r.avroh, r.nyasSwar);
  renderPhrases(r);
  renderSimilar(similar);
  renderQuickFacts(r);
  renderLearningTips(r);
}

function renderFields(r) {
  const dl = document.getElementById("raaga-fields");
  if (!dl) return;

  const rows = [
    [["Thaat", r.thaat], ["Jati", r.jati]],
    [["Aroh", r.aroh]],
    [["Avroh", r.avroh]],
    [["Vadi", r.vadi], ["Samvadi", r.samvadi]],
    [["Pakad", r.pakad]],
    [["Chalan", r.chalan]],
    [["Nyas Swar", r.nyasSwar], ["Varjit Swar", r.varjitSwar || "—"]],
    [["Time of Performance", r.timeOfPerformance]],
    [["Season", r.season]],
    [["Rasa / Mood", r.rasa]],
  ];

  dl.innerHTML = rows.map((cols) => {
    const cells = cols.map(([k, v]) =>
      `<dt>${k}</dt><dd>${formatSwaras(v || "—")}</dd>`
    ).join("");
    return `<div class="detail-row">${cells}</div>`;
  }).join("");
}

/* ---- Notation staff --------------------------------------- */
function renderNotation(aroh, avroh) {
  const container = document.getElementById("notation-staff");
  if (!container) return;

  const arohToks  = tokenize(aroh);
  const avrohToks = tokenize(avroh);
  const notes = [...arohToks, "|", ...avrohToks];

  const noteSpacing = 37;
  const w = Math.max(560, notes.length * noteSpacing + 98);
  const h = 132;
  const lineYs = [31, 43, 55, 67, 79];

  let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(displaySwaraText(`${aroh} | ${avroh}`))}">`;

  // Staff lines
  lineYs.forEach((y) => {
    svg += `<line x1="16" y1="${y}" x2="${w - 16}" y2="${y}" stroke="#7f7a73" stroke-width="1"/>`;
  });

  svg += `<text x="22" y="80" font-size="59" font-family="'Times New Roman', serif" fill="#191715">𝄞</text>`;

  let x = 72;
  notes.forEach((tok) => {
    if (tok === "|") {
      svg += `<line x1="${x}" y1="25" x2="${x}" y2="84" stroke="#191715" stroke-width="1.5"/>`;
      x += 22;
      return;
    }
    const y = noteY(tok);
    const stemUp = y > 50;
    const stemX = stemUp ? x + 5 : x - 5;
    const stemEnd = stemUp ? y - 27 : y + 27;
    svg += `<ellipse cx="${x}" cy="${y}" rx="6.2" ry="4.5" fill="#191715" transform="rotate(-20 ${x} ${y})"/>`;
    svg += `<line x1="${stemX}" y1="${y}" x2="${stemX}" y2="${stemEnd}" stroke="#191715" stroke-width="1.4"/>`;
    x += noteSpacing;
  });

  svg += `<text x="${w / 2}" y="119" text-anchor="middle" font-size="11" font-weight="600" letter-spacing="1.3" font-family="Inter,sans-serif" fill="#4e4943">${escapeXml(displaySwaraText(`${aroh}  |  ${avroh}`))}</text>`;

  svg += "</svg>";
  container.innerHTML = svg;
}

function noteY(tok) {
  const base = baseSwara(tok);
  const idx  = SWARA_ORDER.indexOf(base);
  let y = 82 - idx * 6;
  if (tok.includes("'")) y -= 26;
  if (/^\.[A-Z]/.test(tok) || /^[a-z]/.test(tok)) y += 18;
  return Math.max(19, Math.min(y, 96));
}

function tokenize(str) {
  if (!str) return [];
  return str.replace(/[,]/g, " ").split(/\s+/).filter(Boolean).filter(t => t !== "|");
}

function baseSwara(tok) {
  const c = tok.replace(/[.'♯#]/g, "").charAt(0).toUpperCase();
  return SWARA_ORDER.includes(c) ? c : "S";
}

function displaySwaraText(value) {
  return String(value).replace(/M(?:#|♯)/g, "Mᵀ");
}

function formatSwaras(value) {
  return escapeXml(displaySwaraText(value));
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---- Swara distribution wheel ----------------------------- */
function renderDistribution(aroh, avroh, nyas) {
  const svg = document.getElementById("distribution-circle");
  if (!svg) return;

  const arohSet = new Set(tokenize(aroh).map(baseSwara));
  const avrohSet = new Set(tokenize(avroh).map(baseSwara));
  const nyasSet  = new Set((nyas || "").split(/[,\s]+/).map(s => s.trim().charAt(0).toUpperCase()).filter(Boolean));

  const cx = 130, cy = 130, outerR = 106, nodeR = 20;
  // thin guide ring
  let markup = `<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="#e2d8c5" stroke-width="1" stroke-dasharray="3 3"/>`;

  SWARA_ORDER.forEach((s, i) => {
    const angle = (Math.PI * 2 * i) / SWARA_ORDER.length - Math.PI / 2;
    const x = cx + outerR * Math.cos(angle);
    const y = cy + outerR * Math.sin(angle);

    // spoke from centre to near node
    const spokeEnd = outerR - nodeR - 4;
    const sx = cx + spokeEnd * Math.cos(angle);
    const sy = cy + spokeEnd * Math.sin(angle);
    markup += `<line x1="${cx}" y1="${cy}" x2="${sx}" y2="${sy}" stroke="#ddd5c0" stroke-width="1"/>`;

    let fill, stroke, textFill;
    const inAroh  = arohSet.has(s);
    const inAvroh = avrohSet.has(s);
    const isNyas  = nyasSet.has(s);

    if (isNyas) {
      fill = "#fff"; stroke = "#5c5249"; textFill = "#1e1a17";
    } else if (inAroh && inAvroh) {
      fill = "#1a4d4a"; stroke = "#1a4d4a"; textFill = "#fff";
    } else if (inAroh) {
      fill = "#1a4d4a"; stroke = "#1a4d4a"; textFill = "#fff";
    } else if (inAvroh) {
      fill = "#c9a13b"; stroke = "#c9a13b"; textFill = "#fff";
    } else {
      fill = "#f5f0e8"; stroke = "#d4c9b0"; textFill = "#a49080";
    }

    markup += `<circle cx="${x}" cy="${y}" r="${nodeR}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    markup += `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="12" font-weight="700" font-family="Inter,sans-serif" fill="${textFill}">${s}</text>`;
  });

  svg.innerHTML = markup;
}

/* ---- Side panels ------------------------------------------ */
function renderPhrases(r) {
  const list = document.getElementById("phrase-list");
  if (!list) return;
  list.innerHTML = "";
  const phrases = r.id === "yaman"
    ? ["N R G M# P", "G M# P, D N S'", "S' N D P, M# G R", "R G M#, G R S"]
    : [r.pakad, r.chalan].filter(Boolean)
      .flatMap(p => p.split("|").map(s => s.trim()))
      .filter(Boolean)
      .slice(0, 4);
  phrases.forEach(p => {
    const li = document.createElement("li");
    li.className = "phrase-item";
    li.textContent = displaySwaraText(p);
    list.appendChild(li);
  });
}

const CARD_STYLES = ["mini-art-1", "mini-art-2", "mini-art-3"];
const CARD_EMOJIS = ["🪷", "🌸", "🎼"];

function renderSimilar(items) {
  const wrap = document.getElementById("similar-list");
  if (!wrap) return;
  wrap.innerHTML = "";
  items.forEach((s, i) => {
    const card = document.createElement("div");
    card.className = "mini-card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "View " + s.name);
    card.innerHTML = `
      <div class="mini-art ${CARD_STYLES[i % 3]}" aria-hidden="true">${CARD_EMOJIS[i % 3]}</div>
      <div class="mini-name">${s.name}</div>
      <div class="mini-rel">${s.relation}</div>
      <div class="mini-view">View →</div>`;
    const go = () => loadRaaga(s.id);
    card.addEventListener("click", go);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    wrap.appendChild(card);
  });
}

function renderQuickFacts(r) {
  const ul = document.getElementById("quick-facts");
  if (!ul) return;
  const facts = [
    ["🎵", "Thaat",   r.thaat],
    ["🕒", "Time",    r.timeOfPerformance],
    ["📋", "Jati",    r.jati],
    ["⭐", "Vadi",    r.vadi],
    ["🎶", "Notes Used", r.notesUsed],
    ["⭐", "Samvadi", r.samvadi],
    ["#",  "Teevra Swar", r.signatureNote?.includes("Teevra") ? "Ma (Mᵀ)" : "—"],
    ["✅", "Practice Friendly", r.practiceFriendly || "Yes"],
  ];
  ul.innerHTML = facts.map(([icon, label, val]) =>
    `<li><span class="qf-icon" aria-hidden="true">${icon}</span><span>${label}: <b>${val || "—"}</b></span></li>`
  ).join("");
}

function renderLearningTips(r) {
  const ul = document.getElementById("learning-tips");
  if (ul) {
    ul.innerHTML = "";
    (r.learningTips || []).forEach(t => {
      const li = document.createElement("li");
      li.textContent = displaySwaraText(t);
      ul.appendChild(li);
    });
  }
  const qtEl = document.getElementById("guru-quote-text");
  const qaEl = document.getElementById("guru-quote-author");
  if (qtEl && r.guruQuote) {
    qtEl.innerHTML = r.guruQuote.text.replace(/\n/g, "<br>");
  }
  if (qaEl && r.guruQuote) {
    qaEl.textContent = "— " + r.guruQuote.author;
  }
}

/* ---- Audio demos ------------------------------------------ */
function wireAudioDemos() {
  document.querySelectorAll(".audio-item").forEach((item) => {
    const btn  = item.querySelector(".audio-play-btn");
    const freq = Number(item.dataset.freq) || 392;
    let interval = null;
    let pct = 0;
    const tsEl = item.querySelector(".audio-timestamp");
    const totalSecs = tsEl ? parseDuration(tsEl.textContent.split("/")[1]?.trim()) : 204;

    btn.addEventListener("click", () => {
      if (btn.classList.contains("playing")) {
        stopItem();
        return;
      }
      // stop any other playing items
      document.querySelectorAll(".audio-play-btn.playing").forEach(b => b.click());
      startItem();
    });

    function startItem() {
      playTone(freq);
      btn.classList.add("playing");
      btn.textContent = "❚❚";
      btn.setAttribute("aria-label", "Pause");
      interval = setInterval(() => {
        pct += 2;
        animateWave(item, pct / 100);
        if (pct >= 100) stopItem();
      }, totalSecs * 10);
    }

    function stopItem() {
      clearInterval(interval);
      pct = 0;
      btn.classList.remove("playing");
      btn.textContent = "▶";
      btn.setAttribute("aria-label", btn.closest(".audio-item").querySelector(".audio-title").textContent);
      stopAllTones();
      animateWave(item, 0);
    }
  });
}

function animateWave(item, progress) {
  const spans = item.querySelectorAll(".audio-waveform span");
  spans.forEach((s, i) => {
    const frac = i / spans.length;
    s.style.opacity = frac <= progress ? "1" : "0.35";
    s.style.background = frac <= progress
      ? "linear-gradient(180deg,#c9a13b,#e8c96a)"
      : "linear-gradient(180deg,#c9a13b,#e8c96a)";
  });
}

function parseDuration(str) {
  if (!str) return 204;
  const [m, s] = str.split(":").map(Number);
  return (m * 60 + s) || 204;
}

function playTone(freq) {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  stopAllTones();
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  gain.gain.value = 0.04;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  activeOsc = osc;
}

function stopAllTones() {
  if (activeOsc) { try { activeOsc.stop(); } catch (e) {} activeOsc = null; }
}

/* ---- Favourite button ------------------------------------- */
function wireFavoriteButton() {
  const btn = document.getElementById("add-favorite-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const saved = btn.classList.toggle("saved");
    btn.setAttribute("aria-pressed", String(saved));
    const star = btn.querySelector("svg");
    if (saved) {
      btn.innerHTML = btn.innerHTML.replace("Add to My Raagas", "Added to My Raagas");
      if (star) star.setAttribute("fill", "currentColor");
    } else {
      btn.innerHTML = btn.innerHTML.replace("Added to My Raagas", "Add to My Raagas");
      if (star) star.setAttribute("fill", "none");
    }
  });
}

/* ---- Helpers ---------------------------------------------- */
function showEmpty(on = true) {
  const el = document.getElementById("empty-state");
  if (el) el.hidden = !on;
}
function showError(on = true) {
  const el = document.getElementById("error-state");
  if (el) el.hidden = !on;
}
