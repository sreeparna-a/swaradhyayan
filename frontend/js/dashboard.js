/* Swaradhyayan – Dashboard
 * Fetches /api/dashboard (proxied to BaseX) and renders the overview.
 */
const API_BASE = "/api";

document.addEventListener("DOMContentLoaded", loadDashboard);
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.route === "dashboard"));
});

async function loadDashboard() {
  try {
    const res = await fetch(API_BASE + "/dashboard", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("API error " + res.status);
    const d = await res.json();
    render(d);
  } catch (err) {
    console.error(err);
    document.getElementById("error-state").hidden = false;
  }
}

function render(d) {
  document.title = "Swaradhyayan — Dashboard";
  document.getElementById("welcome-heading").textContent = "Welcome back, " + d.student.name.split(" ")[0] + " —";
  document.getElementById("welcome-sub").textContent =
    `${d.student.level} · Learning since ${formatDate(d.student.joined)}`;

  renderStats(d.stats);
  renderCourses(d.courses);
  renderAssignments(d.assignments);
  renderMiniRaagas("recent-raagas", d.recentRaagas, (r) => `Last practiced ${formatDate(r.lastPracticed)}`);
  renderMiniRaagas("recommended-raagas", d.recommended, (r) => r.reason);
}

function renderStats(stats) {
  const row = document.getElementById("stats-row");
  row.innerHTML = "";
  stats.forEach((s) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `
      <div class="stat-icon">${s.icon}</div>
      <div>
        <div class="stat-value">${s.value}${s.unit ? " " + s.unit : ""}</div>
        <div class="stat-label">${s.label}</div>
      </div>`;
    row.appendChild(card);
  });
}

function renderCourses(courses) {
  const wrap = document.getElementById("courses-list");
  wrap.innerHTML = "";
  courses.forEach((c) => {
    const item = document.createElement("div");
    item.className = "course-item";
    item.innerHTML = `
      <div class="course-top">
        <span class="course-title">${c.title}</span>
        <span class="course-pct">${c.progress}%</span>
      </div>
      <div class="course-instructor">with ${c.instructor}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${c.progress}%"></div></div>
      <div class="course-next">Next: <b>${c.nextLesson}</b></div>`;
    wrap.appendChild(item);
  });
}

function renderAssignments(items) {
  const ul = document.getElementById("assignments-list");
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
  wrap.innerHTML = "";
  items.forEach((r) => {
    const card = document.createElement("div");
    card.className = "mini-raaga-card";
    card.innerHTML = `
      <div>
        <div class="mini-raaga-name">Raag ${r.name}</div>
        <div class="mini-raaga-sub">${subtitleFn(r)}</div>
      </div>
      <span class="mini-raaga-arrow">→</span>`;
    card.addEventListener("click", () => {
      window.location.href = "../index.html?raaga=" + encodeURIComponent(r.id);
    });
    wrap.appendChild(card);
  });
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
