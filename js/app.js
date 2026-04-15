"use strict";

/* =========================================================
   HJÆLPEFUNKTIONER TIL APP STATE
   ========================================================= */

function getSessionsForWeek(week) {
  return plan.sessions.filter(s => s.week === week);
}

function getCurrentSession() {
  const sessions = getSessionsForWeek(selectedWeek);
  if (selectedSessionIndex == null || selectedSessionIndex < 0 || selectedSessionIndex >= sessions.length) {
    return null;
  }
  return sessions[selectedSessionIndex];
}

/* =========================================================
   RENDER MAIN (MIDTERSEKTION)
   ========================================================= */

function renderMain() {
  const main = document.getElementById("main");
  const session = getCurrentSession();

  if (!main) return;

  if (!session) {
    main.innerHTML = `
      <h2>Ingen pas valgt</h2>
      <p>Vælg et pas i listen til venstre eller opret et nyt.</p>
    `;
    return;
  }

  main.innerHTML = `
    <h2>${session.name || "Træningspas"}</h2>
    <div class="step-list">
      ${session.steps.map((step, i) => renderStepCard(step, i)).join("")}
    </div>
    <button type="button" onclick="addStep()">+ Tilføj trin</button>
  `;
}

function renderStepCard(step, index) {
  const colors = {
    warmup: "#fc4c02",   // Strava orange-ish
    run: "#007aff",      // Blå
    cooldown: "#2ecc71"  // Grøn
  };

  const color = colors[step.type] || "#ffffff";

  return `
    <div class="step-card" style="border-left: 6px solid ${color};"
         onclick="editStep(${index})">
      <div class="step-title">${stepTitle(step.type)}</div>
      <div class="step-sub">${stepSubtitle(step)}</div>
    </div>
  `;
}

function stepTitle(type) {
  if (type === "warmup") return "Opvarmning";
  if (type === "run") return "Løb";
  if (type === "cooldown") return "Nedkøling";
  return type;
}

function stepSubtitle(step) {
  if (step.type === "run") {
    const dur = step.duration != null ? step.duration.toFixed(2).replace(".", ",") : "0,00";
    const target = step.target && step.target.from && step.target.to
      ? `Tempo ${step.target.from}–${step.target.to}`
      : "Tempo";
    return `${dur} km • ${target}`;
  }
  return "Tryk på knappen Lap";
}

/* =========================================================
   RENDER EDITOR PANEL (HØJRE SIDE)
   ========================================================= */

function renderEditor() {
  const editorContainer = document.getElementById("sessionEditor");
  if (!editorContainer) return;

  const session = getCurrentSession();

  if (!session) {
    editorContainer.innerHTML = "Vælg et pas…";
    updateJsonPreview(null);
    return;
  }

  // Som udgangspunkt: vis første trin, hvis ingen er valgt
  if (session.steps.length > 0) {
    editStep(0);
  } else {
    editorContainer.innerHTML = "<p>Ingen trin i dette pas endnu.</p>";
    updateJsonPreview(session);
  }
}

/* =========================================================
   TRIN-EDITORER (GARMIN-STIL)
   ========================================================= */

function editStep(index) {
  const session = getCurrentSession();
  if (!session) return;

  const step = session.steps[index];
  if (!step) return;

  const editor = document.getElementById("sessionEditor");
  if (!editor) return;

  if (step.type === "warmup") editor.innerHTML = warmupEditor(step, index);
  else if (step.type === "run") editor.innerHTML = runEditor(step, index);
  else if (step.type === "cooldown") editor.innerHTML = cooldownEditor(step, index);
  else editor.innerHTML = `<p>Ukendt trintype: ${step.type}</p>`;

  updateJsonPreview(session);
}

function warmupEditor(step, index) {
  return `
    <h3>Opvarmning</h3>

    <label>Varighedstype</label>
    <input type="text" value="Tryk på knappen Lap" disabled>

    <label>Intensitetsmål</label>
    <input type="text" value="Intet mål" disabled>

    <label>Noter</label>
    <textarea onchange="updateStep(${index}, 'notes', this.value)">${step.notes || ""}</textarea>
  `;
}

function runEditor(step, index) {
  const duration = step.duration != null ? step.duration : 0.01;
  const target = step.target || { type: "pace", from: "5:30", to: "6:00" };

  return `
    <h3>Løb</h3>

    <label>Varighedstype</label>
    <select onchange="updateStep(${index}, 'durationType', this.value)">
      <option value="distance" ${step.durationType === "distance" ? "selected" : ""}>Distance</option>
      <option value="time" ${step.durationType === "time" ? "selected" : ""}>Tid</option>
      <option value="lap" ${step.durationType === "lap" ? "selected" : ""}>Lap</option>
    </select>

    <label>Varighed</label>
    <input type="number" step="0.01" value="${duration}"
           onchange="updateStep(${index}, 'duration', parseFloat(this.value))">

    <label>Måltype</label>
    <select onchange="updateStep(${index}, 'target.type', this.value)">
      <option value="pace" ${target.type === "pace" ? "selected" : ""}>Tempo</option>
      <option value="hr" ${target.type === "hr" ? "selected" : ""}>Puls</option>
      <option value="cadence" ${target.type === "cadence" ? "selected" : ""}>Kadence</option>
    </select>

    <label>Tempo (fra)</label>
    <input type="text" value="${target.from || ""}"
           onchange="updateStep(${index}, 'target.from', this.value)">

    <label>Tempo (til)</label>
    <input type="text" value="${target.to || ""}"
           onchange="updateStep(${index}, 'target.to', this.value)">
  `;
}

function cooldownEditor(step, index) {
  return `
    <h3>Nedkøling</h3>

    <label>Varighedstype</label>
    <input type="text" value="Tryk på knappen Lap" disabled>

    <label>Intensitetsmål</label>
    <input type="text" value="Intet mål" disabled>

    <label>Noter</label>
    <textarea onchange="updateStep(${index}, 'notes', this.value)">${step.notes || ""}</textarea>
  `;
}

/* =========================================================
   OPDATERING AF TRIN-DATA
   ========================================================= */

function updateStep(index, path, value) {
  const session = getCurrentSession();
  if (!session) return;

  const step = session.steps[index];
  if (!step) return;

  const parts = path.split(".");
  let obj = step;

  while (parts.length > 1) {
    const key = parts.shift();
    if (!obj[key]) obj[key] = {};
    obj = obj[key];
  }

  obj[parts[0]] = value;

  renderMain();
  editStep(index);
}

/* =========================================================
   TILFØJ NYT PAS / TRIN
   ========================================================= */

function addSession() {
  const sessionsThisWeek = getSessionsForWeek(selectedWeek);

  const newSession = {
    id: Date.now(),
    week: selectedWeek,
    name: `Pas ${sessionsThisWeek.length + 1}`,
    steps: [
      {
        type: "warmup",
        durationType: "lap",
        duration: null,
        notes: "",
        target: null
      },
      {
        type: "run",
        durationType: "distance",
        duration: 0.01,
        notes: "",
        target: {
          type: "pace",
          from: "5:30",
          to: "6:00"
        }
      },
      {
        type: "cooldown",
        durationType: "lap",
        duration: null,
        notes: "",
        target: null
      }
    ]
  };

  plan.sessions.push(newSession);

  const sessions = getSessionsForWeek(selectedWeek);
  selectedSessionIndex = sessions.length - 1;

  if (typeof window.renderWeeks === "function") {
    window.renderWeeks();
  }

  renderMain();
  renderEditor();
}

function addStep() {
  const session = getCurrentSession();
  if (!session) return;

  session.steps.push({
    type: "run",
    durationType: "distance",
    duration: 1,
    notes: "",
    target: {
      type: "pace",
      from: "5:30",
      to: "6:00"
    }
  });

  renderMain();
  renderEditor();
}

/* =========================================================
   JSON PREVIEW
   ========================================================= */

function updateJsonPreview(session) {
  const container = document.getElementById("jsonPreview");
  if (!container) return;

  if (!session) {
    container.textContent = "";
    return;
  }

  container.textContent = JSON.stringify(session, null, 2);
}

/* =========================================================
   EKSPORTER FUNKTIONER TIL GLOBALT NAMESPACE
   ========================================================= */

window.renderMain = renderMain;
window.renderEditor = renderEditor;
window.addSession = addSession;
window.editStep = editStep;
window.updateStep = updateStep;
window.addStep = addStep;
