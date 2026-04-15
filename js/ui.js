"use strict";

/* =========================================================
   UI.JS – Træningsplan Editor UI
   ---------------------------------------------------------
   Denne fil forventer at app.js definerer:
     - let plan = { duration_weeks, sessions: [...] }
     - let selectedWeek = 1;
     - let selectedSessionIndex = null;

   VIGTIGT:
   selectedSessionIndex = index i sessions for valgt uge (FILTERED index)
   (så autoCalc() / editSegments() fortsat virker som før)
   ========================================================= */

/* ---------------------------------------------------------
   SAFE HELPERS
--------------------------------------------------------- */
function ensurePlan() {
  if (typeof window.plan !== "object" || window.plan === null) {
    window.plan = {
      plan_name: "Ny træningsplan",
      duration_weeks: 12,
      race_distance_km: null,
      sessions: []
    };
  }
  if (!Array.isArray(plan.sessions)) plan.sessions = [];
  if (!plan.duration_weeks) plan.duration_weeks = 12;

  if (typeof window.selectedWeek !== "number") window.selectedWeek = 1;
  if (window.selectedWeek < 1) window.selectedWeek = 1;
  if (window.selectedWeek > plan.duration_weeks) window.selectedWeek = plan.duration_weeks;

  if (typeof window.selectedSessionIndex !== "number" && window.selectedSessionIndex !== null) {
    window.selectedSessionIndex = null;
  }
}

function getWeekSessions() {
  // sessions for current week (filtered)
  return plan.sessions.filter(s => s.week === selectedWeek);
}

function getSelectedSession() {
  if (selectedSessionIndex === null) return null;
  const sessions = getWeekSessions();
  return sessions[selectedSessionIndex] || null;
}

function parseFirstNumber(str) {
  if (!str) return null;
  const s = String(str).trim().replace(",", ".");
  const m = s.match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function dayNameFromNumber(n) {
  const map = {
    1: "Mandag",
    2: "Tirsdag",
    3: "Onsdag",
    4: "Torsdag",
    5: "Fredag",
    6: "Lørdag",
    7: "Søndag"
  };
  return map[n] || "Mandag";
}

function clampDay(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 1;
  return Math.min(7, Math.max(1, x));
}

/* ---------------------------------------------------------
   JSON PREVIEW TOGGLE (Advanced)
--------------------------------------------------------- */
let showJsonPreview = true; // default: som nu (synlig). Sæt til false hvis du vil skjule som standard.

function setJsonVisible(visible) {
  showJsonPreview = !!visible;

  const json = document.getElementById("jsonPreview");
  if (!json) return;

  json.style.display = showJsonPreview ? "block" : "none";

  // skjul/vis evt. "JSON" overskrift (h3) hvis den står lige før jsonPreview
  const prev = json.previousElementSibling;
  if (prev && prev.tagName === "H3" && prev.textContent.trim().toLowerCase() === "json") {
    prev.style.display = showJsonPreview ? "block" : "none";
  }
}

/* =========================================================
   RENDER UGER (venstre panel)
--------------------------------------------------------- */
function renderWeeks() {
  ensurePlan();

  const weekList = document.getElementById("weekList");
  if (!weekList) return;

  weekList.innerHTML = "";

  for (let w = 1; w <= plan.duration_weeks; w++) {
    const div = document.createElement("div");
    div.className = "plan-item";
    div.textContent = "Uge " + w;

    div.onclick = () => {
      selectedWeek = w;
      selectedSessionIndex = null;
      renderMain();
      renderEditor();
    };

    weekList.appendChild(div);
  }
}

/* =========================================================
   RENDER MIDTERPANELET (ugevisning + pas)
--------------------------------------------------------- */
function renderMain() {
  ensurePlan();

  const main = document.getElementById("main");
  if (!main) return;

  main.innerHTML = "";

  const weekCard = document.createElement("div");
  weekCard.className = "week-card";

  weekCard.innerHTML = `<h2>Uge ${selectedWeek}</h2>`;

  const sessions = getWeekSessions();

  /* Hvis ingen pas i ugen */
  if (sessions.length === 0) {
    const empty = document.createElement("div");
    empty.style.padding = "10px 0";
    empty.style.color = "#777";
    empty.textContent = "Ingen træningspas i denne uge endnu.";
    weekCard.appendChild(empty);
  }

  /* ---------------------------------------------------------
     VIS PAS I UGEN
  --------------------------------------------------------- */
  sessions.forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "session-row";

    row.innerHTML = `
      <div>
        <div class="session-title">${s.title ?? "Nyt pas"}</div>
        <div class="session-meta">
          ${s.distance_km ?? "-"} km • ${s.duration_min ?? "-"} min
        </div>
      </div>

      <div>
        <div class="edit-btn" onclick="editSession(${i})">Rediger</div>
        <div class="edit-btn" style="background:#d9534f;margin-top:5px"
             onclick="deleteSession(${i})">Slet</div>
      </div>
    `;

    weekCard.appendChild(row);
  });

  /* ---------------------------------------------------------
     TILFØJ PAS
  --------------------------------------------------------- */
  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Tilføj pas";
  addBtn.style.marginTop = "15px";
  addBtn.onclick = addSession;

  weekCard.appendChild(addBtn);

  main.appendChild(weekCard);
}

/* =========================================================
   SLET PAS
   (beholder din logik – men lidt mere robust)
--------------------------------------------------------- */
function deleteSession(index) {
  ensurePlan();

  if (!confirm("Vil du slette dette pas?")) return;

  const sessions = getWeekSessions();
  const globalIndex = plan.sessions.indexOf(sessions[index]);

  if (globalIndex === -1) return;

  plan.sessions.splice(globalIndex, 1);

  // Justér selectedSessionIndex på en fornuftig måde:
  // Hvis man sletter et pas før det valgte index, så rykker index 1 ned.
  if (selectedSessionIndex !== null) {
    if (index === selectedSessionIndex) {
      selectedSessionIndex = null;
    } else if (index < selectedSessionIndex) {
      selectedSessionIndex--;
    }
  }

  renderMain();
  renderEditor();
}

/* =========================================================
   REDIGER PAS (beholder din semantik: filtered index)
--------------------------------------------------------- */
function editSession(index) {
  selectedSessionIndex = index;
  renderEditor();
}

/* =========================================================
   RENDER EDITOR (højre panel)
   - Tilføjer Varighedstype (Tid/Distance)
   - Ét input "Varighed" gemmer til distance_km eller duration_min
   - Avanceret: Vis/Skjul JSON
--------------------------------------------------------- */
function renderEditor() {
  ensurePlan();

  const editorDiv = document.getElementById("sessionEditor");
  const previewDiv = document.getElementById("jsonPreview");

  if (!editorDiv || !previewDiv) return;

  if (selectedSessionIndex === null) {
    editorDiv.innerHTML = "Vælg et pas…";
    previewDiv.innerHTML = "";
    setJsonVisible(showJsonPreview);
    return;
  }

  const sessions = getWeekSessions();
  const session = sessions[selectedSessionIndex];

  if (!session) {
    // hvis index er out of range (fx efter slet), nulstil
    selectedSessionIndex = null;
    editorDiv.innerHTML = "Vælg et pas…";
    previewDiv.innerHTML = "";
    setJsonVisible(showJsonPreview);
    return;
  }

  // Bestem duration type ud fra data
  // Default: distance (som din reference)
  const inferredType = (session.duration_min != null && session.distance_km == null) ? "time" : "distance";
  const durationValue =
    inferredType === "time"
      ? (session.duration_min ?? "")
      : (session.distance_km ?? "");

  editorDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;">
      <div style="font-weight:800;">Rediger pas</div>
      <button type="button" id="toggleJsonBtn" style="width:auto;margin-top:0;padding:6px 10px;border-radius:6px;">
        ${showJsonPreview ? "Skjul JSON" : "Vis JSON"}
      </button>
    </div>

    <div style="margin-top:14px;">
      <div style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#666;">
        Pasoplysninger
      </div>

      <label>Titel</label>
      <input id="title" value="${session.title ?? "Nyt pas"}" />

      <label>Dag</label>
      <select id="day">
        <option value="1">Mandag</option>
        <option value="2">Tirsdag</option>
        <option value="3">Onsdag</option>
        <option value="4">Torsdag</option>
        <option value="5">Fredag</option>
        <option value="6">Lørdag</option>
        <option value="7">Søndag</option>
      </select>

      <label>Note</label>
      <textarea id="note">${session.note ?? ""}</textarea>
    </div>

    <div style="margin-top:18px;">
      <div style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#666;">
        Varighed
      </div>

      <label>Varighedstype</label>
      <select id="durationType">
        <option value="time">Tid</option>
        <option value="distance">Distance</option>
      </select>

      <label id="durationValueLabel">Varighed</label>
      <input id="durationValue" value="${durationValue}" />
      <small id="durationHelp" style="display:block;margin-top:6px;font-size:12px;opacity:.75;"></small>
    </div>

    <div style="margin-top:18px;">
      <div style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#666;">
        Handlinger
      </div>

      <button type="button" onclick="editSegments()">Rediger segmenter</button>
      <button type="button" onclick="autoCalc()">Beregn km/min</button>
      <button type="button" onclick="saveSession()">Gem</button>
    </div>
  `;

  // Init day
  document.getElementById("day").value = String(clampDay(session.day));

  // Init durationType + help/placeholder
  const durationTypeEl = document.getElementById("durationType");
  const durationValueEl = document.getElementById("durationValue");
  const durationHelpEl = document.getElementById("durationHelp");
  const durationValueLabelEl = document.getElementById("durationValueLabel");

  durationTypeEl.value = inferredType;

  function updateDurationUI() {
    const t = durationTypeEl.value;
    if (t === "time") {
      durationValueEl.placeholder = "fx 30 min";
      durationHelpEl.textContent = "Angiv tid i minutter (fx 30).";
      durationValueLabelEl.textContent = "Varighed";
    } else {
      durationValueEl.placeholder = "fx 5 km";
      durationHelpEl.textContent = "Angiv distance i kilometer (fx 5).";
      durationValueLabelEl.textContent = "Varighed";
    }
  }

  function saveDurationToSession() {
    const t = durationTypeEl.value;
    const raw = durationValueEl.value.trim();

    if (!raw) {
      session.distance_km = null;
      session.duration_min = null;
      return;
    }

    const n = parseFirstNumber(raw);
    if (n == null || n <= 0) {
      session.distance_km = null;
      session.duration_min = null;
      return;
    }

    if (t === "distance") {
      session.distance_km = n;
      session.duration_min = null;
      durationValueEl.value = String(n); // normaliser
    } else {
      session.duration_min = Math.round(n);
      session.distance_km = null;
      durationValueEl.value = String(Math.round(n)); // normaliser
    }
  }

  // Hook: skift type opdaterer UI + gemmer
  durationTypeEl.addEventListener("change", () => {
    updateDurationUI();
    saveDurationToSession();
    previewDiv.textContent = JSON.stringify(session, null, 2);
    renderMain();
  });

  // Hook: input i varighed gemmer live (så midterliste opdateres)
  durationValueEl.addEventListener("input", () => {
    saveDurationToSession();
    previewDiv.textContent = JSON.stringify(session, null, 2);
    renderMain();
  });

  durationValueEl.addEventListener("blur", () => {
    saveDurationToSession();
    previewDiv.textContent = JSON.stringify(session, null, 2);
    renderMain();
  });

  // Toggle JSON
  const toggleJsonBtn = document.getElementById("toggleJsonBtn");
  toggleJsonBtn.addEventListener("click", () => {
    setJsonVisible(!showJsonPreview);
    toggleJsonBtn.textContent = showJsonPreview ? "Skjul JSON" : "Vis JSON";
  });

  // init UI + preview
  updateDurationUI();
  setJsonVisible(showJsonPreview);
  previewDiv.textContent = JSON.stringify(session, null, 2);
}

/* =========================================================
   GEM PAS
   (udvidet: gemmer også varighed-type værdien korrekt)
--------------------------------------------------------- */
function saveSession() {
  ensurePlan();

  const sessions = getWeekSessions();
  const session = sessions[selectedSessionIndex];
  if (!session) return;

  session.title = document.getElementById("title").value;
  session.day = clampDay(document.getElementById("day").value);
  session.note = document.getElementById("note").value;

  // Varighed gemmes her også (så "Gem" altid er sandhed)
  const durationTypeEl = document.getElementById("durationType");
  const durationValueEl = document.getElementById("durationValue");

  if (durationTypeEl && durationValueEl) {
    const t = durationTypeEl.value;
    const raw = durationValueEl.value.trim();
    const n = parseFirstNumber(raw);

    if (!raw || n == null || n <= 0) {
      session.distance_km = null;
      session.duration_min = null;
    } else if (t === "distance") {
      session.distance_km = n;
      session.duration_min = null;
    } else {
      session.duration_min = Math.round(n);
      session.distance_km = null;
    }
  }

  renderMain();
  renderEditor();
}

/* =========================================================
   TILFØJ NYT PAS
   (uændret, men sikrer default distance)
--------------------------------------------------------- */
function addSession() {
  ensurePlan();

  plan.sessions.push({
    week: selectedWeek,
    day: 1,
    title: "Nyt pas",
    distance_km: null,
    duration_min: null,
    note: "",
    segments: []
  });

  // vælg det nyeste pas i ugen (filtered index)
  const sessions = getWeekSessions();
  selectedSessionIndex = sessions.length - 1;

  renderMain();
  renderEditor();
}

/* =========================================================
   EXPORT FUNKTIONER TIL WINDOW
   (så dine inline onclick virker)
========================================================= */
window.renderWeeks = renderWeeks;
window.renderMain = renderMain;
window.renderEditor = renderEditor;
window.editSession = editSession;
window.saveSession = saveSession;
window.addSession = addSession;
window.deleteSession = deleteSession;
``
