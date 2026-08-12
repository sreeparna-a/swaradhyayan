/* ============================================================
   Swaradhyayan — Dashboard Page
   Fetches /api/dashboard (proxied to BaseX) and populates the
   student overview. Falls back gracefully when API is offline.
   ============================================================ */
const API_BASE = "/api";

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});

async function loadDashboard() {
  try {
    const res = await fetch(API_BASE + "/dashboard", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("API error " + res.status);
    const d = await res.json();
    hydrate(d);
  } catch (err) {
    console.warn("Dashboard API unavailable — using static fallback:", err);
    // Static content is already in HTML; nothing extra to do.
  }
}

/* Populate dynamic content from API response */
function hydrate(d) {
  const headingEl = document.getElementById("welcome-heading");
  const subEl     = document.getElementById("welcome-sub");

  if (headingEl && d.student) {
    headingEl.textContent = "Welcome back, " + d.student.name.split(" ")[0] + " —";
  }
  if (subEl && d.student) {
    subEl.textContent = `${d.student.level} · Learning since ${formatDate(d.student.joined)}`;
  }

  if (d.stats)   renderStats(d.stats);
  if (d.courses) renderCourses(d.courses);
  if (d.assignments) renderAssignments(d.assignments);
  if (d.recentRaagas)  renderMiniRaagas("recent-raagas",      d.recentRaagas,  (r) => `Last practiced ${formatDate(r.lastPracticed)}`);
  if (d.recommended)   renderMiniRaagas("recommended-raagas", d.recommended,   (r) => r.reason);
}

function renderStats(stats) {
  const row = document.getElementById("stats-row");
  if (!row) return;
  row.innerHTML = "";
  stats.forEach((s) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `
      <div class="stat-icon" aria-hidden="true">${s.icon}</div>
      <div>
        <div class="stat-value">${s.value}${s.unit ? `<span class="stat-unit"> ${s.unit}</span>` : ""}</div>
        <div class="stat-label">${s.label}</div>
      </div>`;
    row.appendChild(card);
  });
}

function renderCourses(courses) {
  const wrap = document.getElementById("courses-list");
  if (!wrap) return;
  wrap.innerHTML = "";
  courses.forEach((c) => {
    const div = document.createElement("div");
    div.className = "course-item";
    div.innerHTML = `
      <div class="course-top">
        <span class="course-title">${c.title}</span>
        <span class="course-pct">${c.progress}%</span>
      </div>
      <div class="course-instructor">with ${c.instructor}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${c.progress}%"></div></div>
      <div class="course-next">Next: <b>${c.nextLesson}</b></div>`;
    wrap.appendChild(div);
  });
}

function renderAssignments(items) {
  const ul = document.getElementById("assignments-list");
  if (!ul) return;
  ul.innerHTML = "";
  items
    .slice()
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "Pending" ? -1 : 1))
    .forEach((a) => {
      const li = document.createElement("li");
      const statusClass = a.status === "Completed" ? "status-completed" : "status-pending";
      li.innerHTML = `
        <div class="assignment-info">
          <div class="assignment-title">${a.title}</div>
          <div class="assignment-course">${a.course}</div>
        </div>
        <div class="assignment-meta">
          <div class="assignment-due">Due ${formatDate(a.due)}</div>
          <span class="status-pill ${statusClass}">${a.status}</span>
        </div>`;
      ul.appendChild(li);
    });
}

function renderMiniRaagas(containerId, items, subtitleFn) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = "";
  items.forEach((r) => {
    const card = document.createElement("a");
    card.className = "mini-raaga-card";
    card.href = `raaga-knowledge.html?raaga=${encodeURIComponent(r.id)}`;
    card.innerHTML = `
      <div>
        <div class="mini-raaga-name">Raag ${r.name}</div>
        <div class="mini-raaga-sub">${subtitleFn(r)}</div>
      </div>
      <span class="mini-raaga-arrow" aria-hidden="true">→</span>`;
    wrap.appendChild(card);
  });
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
