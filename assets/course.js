// Course shell: navigation, progress, theme and interactive widgets.
// Works from file:// so it MUST NOT rely on fetch.

const CHAPTERS = [
  [1, "Building automation fundamentals", "01-fundamentals.html"],
  [2, "Control theory for buildings", "02-control-theory.html"],
  [3, "Networking for OT", "03-networking.html"],
  [4, "Serial and fieldbus protocols", "04-fieldbus.html"],
  [5, "IP and IoT protocols", "05-ip-iot-protocols.html"],
  [6, "MQTT in depth", "06-mqtt.html"],
  [7, "Gateways and integration patterns", "07-integration.html"],
  [8, "Controllers and PLCs", "08-controllers-plcs.html"],
  [9, "Heat generation", "09-heat-generation.html"],
  [10, "Hydronics", "10-hydronics.html"],
  [11, "Ventilation and air handling", "11-ventilation.html"],
  [12, "Cooling and heat pumps", "12-cooling-heat-pumps.html"],
  [13, "Lighting control", "13-lighting.html"],
  [14, "Professional audio and AV over IP", "14-audio-av.html"],
  [15, "Security systems", "15-security.html"],
  [16, "Fire safety systems", "16-fire-safety.html"],
  [17, "Electrical power and UPS", "17-power.html"],
  [18, "Sensors and metering", "18-sensors-metering.html"],
  [19, "BMS software platforms", "19-bms-platforms.html"],
  [20, "Building a custom BMS front end", "20-custom-frontend.html"],
  [21, "Alarm management", "21-alarm-management.html"],
  [22, "Infrastructure: virtualisation, containers, backup", "22-infrastructure.html"],
  [23, "OT cybersecurity", "23-cybersecurity.html"],
  [24, "Energy management", "24-energy.html"],
  [25, "Commissioning, maintenance and troubleshooting", "25-operations.html"],
];

// Section counts per published chapter, so the index can show progress without loading the page.
const SECTION_COUNT = {1: 7, 2: 9, 3: 9, 4: 10, 5: 9, 6: 16, 7: 8, 8: 7, 9: 9, 10: 9, 11: 9, 12: 6, 13: 8, 14: 9, 15: 8, 16: 7, 17: 8, 18: 7, 19: 8, 20: 7, 21: 7, 22: 7, 23: 7, 24: 7, 25: 7};

const STORE_KEY = "bms-course-progress-v1";

const store = {
  read() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
  },
  write(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* private mode */ }
  },
  isDone(id) { return !!this.read()[id]; },
  set(id, value) {
    const d = this.read();
    if (value) d[id] = Date.now(); else delete d[id];
    this.write(d);
  },
};

function chapterProgress(n) {
  const total = SECTION_COUNT[n] || 0;
  if (!total) return 0;
  const done = Object.keys(store.read()).filter((k) => k.startsWith(`c${n}-`)).length;
  return Math.min(1, done / total);
}

/* Theme */
function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem("bms-course-theme"); } catch {}
  if (saved) document.documentElement.dataset.theme = saved;
  document.querySelectorAll("[data-theme-toggle]").forEach((b) =>
    b.addEventListener("click", () => {
      const dark = matchMedia("(prefers-color-scheme: dark)").matches;
      const cur = document.documentElement.dataset.theme || (dark ? "dark" : "light");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("bms-course-theme", next); } catch {}
    })
  );
}

/* Sidebar for a chapter page */
function initChapter() {
  const main = document.querySelector("main[data-chapter]");
  if (!main) return;
  const n = Number(main.dataset.chapter);
  const sections = [...main.querySelectorAll("section.lesson[id]")];

  const side = document.querySelector(".sidebar");
  const here = sections
    .map((s) => {
      const h = s.querySelector("h2");
      return `<li><a href="#${s.id}" data-sec="${s.id}"><span class="num">${s.dataset.num || ""}</span>${h.textContent.replace(/^[\d.]+\s*/, "")}</a></li>`;
    })
    .join("");
  const all = CHAPTERS.map(([num, title, file]) =>
    file
      ? `<li><a href="${file}" class="${num === n ? "active" : ""}"><span class="num">${num}</span>${title}</a></li>`
      : `<li><span title="Coming soon"><span class="num">${num}</span>${title}</span></li>`
  ).join("");
  side.innerHTML = `<h4>This chapter</h4><ol>${here}</ol><h4>All chapters</h4><ol>${all}</ol>`;

  sections.forEach((s) => {
    const id = `c${n}-${s.id}`;
    const row = document.createElement("div");
    row.className = "complete-row";
    const btn = document.createElement("button");
    btn.className = "btn secondary";
    row.appendChild(btn);
    s.appendChild(row);
    const render = () => {
      const done = store.isDone(id);
      btn.textContent = done ? "✓ Completed" : "Mark section complete";
      btn.className = done ? "btn done" : "btn secondary";
      btn.setAttribute("aria-pressed", done);
      side.querySelector(`[data-sec="${s.id}"]`)?.classList.toggle("done", done);
      updateBar(n);
    };
    btn.addEventListener("click", () => { store.set(id, !store.isDone(id)); render(); });
    render();
  });

  // Highlight the section in view.
  const links = side.querySelectorAll("[data-sec]");
  const obs = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.dataset.sec === e.target.id));
    }),
    { rootMargin: "-30% 0px -60% 0px" }
  );
  sections.forEach((s) => obs.observe(s));
  side.addEventListener("click", (e) => { if (e.target.closest("a")) document.body.classList.remove("nav-open"); });
}

function updateBar(n) {
  const bar = document.querySelector(".progress-bar > span");
  if (bar) bar.style.width = `${Math.round(chapterProgress(n) * 100)}%`;
}

/* Index page */
function initIndex() {
  const grid = document.querySelector(".chapter-grid");
  if (!grid) return;
  grid.innerHTML = CHAPTERS.map(([n, t, f]) => {
    const p = Math.round(chapterProgress(n) * 100);
    const inner = `<div class="n">Chapter ${String(n).padStart(2, "0")}</div><div class="t">${t}</div>
      <div class="s">${f ? (p ? `${p}% complete` : "Start") : "Coming soon"}</div>
      ${f ? `<div class="mini-bar"><span style="width:${p}%"></span></div>` : ""}`;
    return f
      ? `<a class="chapter-card" href="chapters/${f}">${inner}</a>`
      : `<div class="chapter-card locked">${inner}</div>`;
  }).join("");
  const total = Object.keys(SECTION_COUNT).reduce((a, k) => a + SECTION_COUNT[k], 0);
  const done = Object.keys(store.read()).length;
  const bar = document.querySelector(".progress-bar > span");
  if (bar && total) bar.style.width = `${Math.round((done / total) * 100)}%`;
}

/* Widget: multiple choice quiz
   <div class="quiz" data-answer="b"><p class="q">…</p>
     <div class="opts"><button class="opt" data-opt="a" data-why="…">…</button>…</div></div> */
function initQuizzes() {
  document.querySelectorAll(".quiz").forEach((quiz) => {
    const fb = document.createElement("div");
    fb.className = "feedback";
    fb.setAttribute("aria-live", "polite");
    quiz.appendChild(fb);
    const opts = quiz.querySelectorAll("button.opt");
    opts.forEach((b) =>
      b.addEventListener("click", () => {
        const ok = b.dataset.opt === quiz.dataset.answer;
        b.classList.add(ok ? "correct" : "wrong");
        fb.className = `feedback ${ok ? "ok" : "bad"}`;
        fb.textContent = (ok ? "Correct. " : "Not quite. ") + (b.dataset.why || "");
        if (ok) opts.forEach((o) => (o.disabled = true));
        else b.disabled = true;
      })
    );
  });
}

/* Widget: classify items into categories
   <div class="classify" data-cats="AI,AO,DI,DO">
     <div class="item" data-cat="AI" data-why="…"><span class="label">…</span></div> */
function initClassify() {
  document.querySelectorAll(".classify").forEach((box) => {
    const cats = box.dataset.cats.split(",");
    const items = box.querySelectorAll(".item");
    const score = document.createElement("div");
    score.className = "score";
    score.setAttribute("aria-live", "polite");
    let right = 0, answered = 0;
    items.forEach((item) => {
      const choices = document.createElement("div");
      choices.className = "choices";
      cats.forEach((c) => {
        const chip = document.createElement("button");
        chip.className = "chip";
        chip.textContent = c;
        chip.addEventListener("click", () => {
          const ok = c === item.dataset.cat;
          chip.classList.add(ok ? "correct" : "wrong");
          if (!item.classList.contains("answered")) {
            answered++;
            if (ok) right++;
            item.classList.add("answered");
          }
          if (ok) choices.querySelectorAll(".chip").forEach((x) => (x.disabled = true));
          else chip.disabled = true;
          score.textContent = `First-try score: ${right} / ${answered}` + (answered === items.length ? ` — done (${items.length} items).` : "");
        });
        choices.appendChild(chip);
      });
      item.appendChild(choices);
      const why = document.createElement("div");
      why.className = "why";
      why.textContent = item.dataset.why || "";
      item.appendChild(why);
    });
    box.appendChild(score);
  });
}

/* Widget: explorer — buttons that swap the content of a panel
   <div class="explorer"><div class="layers"><button class="layer" data-target="id">…</button></div>
     <div class="panel"><template id="id">…</template></div></div> */
function initExplorers() {
  document.querySelectorAll(".explorer").forEach((ex) => {
    const panel = ex.querySelector(".panel");
    const show = (btn) => {
      ex.querySelectorAll(".layer").forEach((b) => b.setAttribute("aria-pressed", b === btn));
      const tpl = ex.querySelector(`template#${btn.dataset.target}`);
      panel.querySelectorAll(":scope > :not(template)").forEach((n) => n.remove());
      panel.appendChild(tpl.content.cloneNode(true));
    };
    const layers = ex.querySelectorAll(".layer");
    layers.forEach((b) => {
      b.addEventListener("click", () => show(b));
      // SVG shapes are not native buttons, so they need keyboard activation.
      b.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(b); }
      });
    });
    if (layers[0]) show(layers[0]);
  });
}

function initMenu() {
  document.querySelector(".menu-btn")?.addEventListener("click", () => document.body.classList.toggle("nav-open"));
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMenu();
  initChapter();
  initIndex();
  initQuizzes();
  initClassify();
  initExplorers();
  document.dispatchEvent(new Event("course:ready"));
});
