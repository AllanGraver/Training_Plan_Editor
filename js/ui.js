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
    warmup: "#fc4c02",
    run: "#007aff",
    cooldown: "#2ecc71",
    rest: "#9b59b6",
    recovery: "#16a085",
    other: "#bdc3c7"
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
  return {
    warmup: "Opvarmning",
    run: "Løb",
    recovery: "Restitution",
    rest: "Hvile",
    cooldown: "Nedkøling",
    other: "Andet"
  }[type] || type;
}

function stepSubtitle(step) {
  if (step.durationType === "time") {
    return `${step.hours || 0}t ${step.minutes || 0}m ${step.seconds || 0}s`;
  }
  if (step.durationType === "distance") {
    return `${step.distance || 0} km`;
  }
  return "—";
}

/* =========================================================
   RENDER EDITOR PANEL (HØJRE SIDE)
   ========================================================= */

function renderEditor() {
  const editor = document.getElementById("sessionEditor");
  const session = getCurrentSession();

  if (!session) {
    editor.innerHTML = "Vælg et pas…";
    updateJsonPreview(null);
    return;
  }

  if (session.steps.length > 0) {
    editStep(0);
  } else {
    editor.innerHTML = "<p>Ingen trin endnu.</p>";
    updateJsonPreview(session);
  }
}

/* =========================================================
   ENS EDITOR FOR ALLE TRIN
   ========================================================= */

function editStep(index) {
  const session = getCurrentSession();
  const step = session.steps[index];
  const editor = document.getElementById("sessionEditor");

  editor.innerHTML = `
    <h3>Trinoplysninger</h3>

    <label>Trintype</label>
    <select onchange="updateStep(${index}, 'type', this.value)">
      <option value="warmup" ${step.type === "warmup" ? "selected" : ""}>Opvarmning</option>
      <option value="run" ${step.type === "run" ? "selected" : ""}>Løb</option>
      <option value="recovery" ${step.type === "recovery" ? "selected" : ""}>Restitution</option>
      <option value="rest" ${step.type === "rest" ? "selected" : ""}>Hvile</option>
      <option value="cooldown" ${step.type === "cooldown" ? "selected" : ""}>Nedkøling</option>
      <option value="other" ${step.type === "other" ? "selected" : ""}>Andet</option>
    </select>

    <label>Noter</label>
    <textarea onchange="updateStep(${index}, 'notes', this.value)">${step.notes || ""}</textarea>

    <h3>Varighed</h3>

    <label>Varighedstype</label>
    <select onchange="updateStep(${index}, 'durationType', this.value)">
      <option value="time" ${step.durationType === "time" ? "selected" : ""}>Tid</option>
      <option value="distance" ${step.durationType === "distance" ? "selected" : ""}>Distance</option>
    </select>

    ${renderDurationFields(step, index)}

    <h3>Intensitetsmål</h3>

    <label>Måltype</label>
    <select onchange="updateStep(${index}, 'intensity', this.value)">
      <option value="E" ${step.intensity === "E" ? "selected" : ""}>E: Easy Pace</option>
      <option value="M" ${step.intensity === "M" ? "selected" : ""}>M: Marathon Pace</option>
      <option value="T" ${step.intensity === "T" ? "selected" : ""}>T: Tempo Pace</option>
      <option value="I" ${step.intensity === "I" ? "selected" : ""}>I: Interval Pace</option>
      <option value="R" ${step.intensity === "R" ? "selected" : ""}>R: Restitution Pace</option>
    </select>
  `;

  updateJsonPreview(session);
}

function renderDurationFields(step, index) {
  if (step.durationType === "time") {
    return `
      <label>Varighed</label>
      <div class="duration-row">
        <input type="number" min="0" value="${step.hours || 0}"
               onchange="updateStep(${index}, 'hours', parseInt(this.value))"> t
        <input type="number" min="0" max="59" value="${step.minutes || 0}"
               onchange="updateStep(${index}, 'minutes', parseInt(this.value))"> m
        <input type="number" min="0" max="59" value="${step.seconds || 0}"
               onchange="updateStep(${index}, 'seconds', parseInt(this.value))"> s
      </div>
    `;
  }

  return `
    <label>Distance</label>
    <input type="number" step="0.01" value="${step.distance || 1}"
           onchange="updateStep(${index}, 'distance', parseFloat(this.value))"> km
  `;
}

/* =========================================================
   OPDATERING AF TRIN-DATA
   ========================================================= */

function updateStep(index, key, value) {
  const session = getCurrentSession();
  const step = session.steps[index];

  step[key] = value;

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
      { type: "warmup", durationType: "time", hours: 0, minutes: 5, seconds: 0, notes: "", intensity: "E" },
      { type: "run", durationType: "distance", distance: 1, notes: "", intensity: "T" },
      { type: "cooldown", durationType: "time", hours: 0, minutes: 5, seconds: 0, notes: "", intensity: "E" }
    ]
  };

  plan.sessions.push(newSession);

  const sessions = getSessionsForWeek(selectedWeek);
  selectedSessionIndex = sessions.length - 1;

  if (typeof window.renderWeeks === "function") window.renderWeeks();

  renderMain();
  renderEditor();
}

function addStep() {
  const session = getCurrentSession();
  session.steps.push({
    type: "run",
    durationType: "distance",
    distance: 1,
    notes: "",
    intensity: "E"
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
  container.textContent = JSON.stringify(session, null, 2);
}

/* =========================================================
   EKSPORTER FUNKTIONER
   ========================================================= */

window.renderMain = renderMain;
window.renderEditor = renderEditor;
window.addSession = addSession;
window.editStep = editStep;
window.updateStep = updateStep;
window.addStep = addStep;
