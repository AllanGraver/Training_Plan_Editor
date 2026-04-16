"use strict";
/* =========================================================
   FILE: sessions.js
   PURPOSE:
   - Håndterer træningspas (sessions) i en uge
   - Viser ugens pas i midterpanelet (renderMain)
   - Tilføjer nye træningspas (addSession)
   - Ugedag vælges i midterpanelet
   - Tilføj trin / tilføj interval-blok
   ========================================================= */


/* ============================
   TILFØJ TRÆNINGSPAS
   ============================ */

function addSession() {
  const newSession = {
    id: Date.now(),
    week: selectedWeek,
    name: "Træningspas",
    day: "Mandag",
    steps: [
      {
        type: "warmup",
        durationType: "time",
        hours: 0,
        minutes: 5,
        seconds: 0,
        notes: "",
        intensity: "E"
      },
      {
        type: "run",
        durationType: "distance",
        distance: 1,
        notes: "",
        intensity: "T"
      },
      {
        type: "cooldown",
        durationType: "time",
        hours: 0,
        minutes: 5,
        seconds: 0,
        notes: "",
        intensity: "E"
      }
    ]
  };

  plan.sessions.push(newSession);

  renderMain();
  renderEditor();
}


/* ============================
   HJÆLPER: SESSIONS FOR UGE
   ============================ */

function getSessionsForWeek(week) {
  return plan.sessions.filter(s => s.week === week);
}

function getCurrentSession() {
  const sessions = getSessionsForWeek(selectedWeek);
  return sessions[selectedSessionIndex] || null;
}

function deleteSession(index) {
  const sessions = getSessionsForWeek(selectedWeek);
  const sessionToDelete = sessions[index];
  if (!sessionToDelete) return;

  plan.sessions = plan.sessions.filter(s => s.id !== sessionToDelete.id);

  selectedSessionIndex = 0;
  renderMain();
  renderEditor();
}


/* ============================
   OPDATER UGEDAG
   ============================ */

function updateSessionDay(index, day) {
  const sessions = getSessionsForWeek(selectedWeek);
  const session = sessions[index];
  if (!session) return;

  session.day = day;

  renderMain();
  renderEditor();
}


/* ============================
   HJÆLPER: INDSÆT FØR NEDKØLING
   ============================ */

function insertBeforeCooldown(session, steps) {
  const idx = session.steps.findIndex(s => s.type === "cooldown");
  const insertIndex = idx === -1 ? session.steps.length : idx;
  session.steps.splice(insertIndex, 0, ...steps);
}


/* ============================
   TILFØJ ENKELT TRIN
   ============================ */

function addSingleStepToSession(sessionIndex) {
  const sessions = getSessionsForWeek(selectedWeek);
  const session = sessions[sessionIndex];
  if (!session) return;

  const newStep = {
    type: "run",
    durationType: "time",
    hours: 0,
    minutes: 5,
    seconds: 0,
    intensity: "E",
    notes: ""
  };

  insertBeforeCooldown(session, [newStep]);

  renderMain();
  renderEditor();
}


/* ============================
   TILFØJ INTERVAL-BLOK (2 TRIN)
   ============================ */

function addIntervalToSession(sessionIndex) {
  const sessions = getSessionsForWeek(selectedWeek);
  const session = sessions[sessionIndex];
  if (!session) return;

  const blockId = Date.now();

  const intervalBlock = [
    {
      type: "run",
      durationType: "time",
      hours: 0,
      minutes: 2,
      seconds: 0,
      intensity: "I",
      notes: "Hurtigt",
      blockId
    },
    {
      type: "recovery",
      durationType: "time",
      hours: 0,
      minutes: 1,
      seconds: 0,
      intensity: "E",
      notes: "Roligt",
      blockId
    }
  ];

  insertBeforeCooldown(session, intervalBlock);

  renderMain();
  renderEditor();
}


/* ============================
   STEP TITLER OG SUBTITLER
   ============================ */

function stepTitle(step) {
  switch (step.type) {
    case "warmup": return "Opvarmning";
    case "run": return "Løb";
    case "recovery": return "Restitution";
    case "rest": return "Hvile";
    case "cooldown": return "Nedkøling";
    case "other": return "Andet";
    default: return "Trin";
  }
}

function stepSubtitle(step) {
  let parts = [];

  if (step.durationType === "time") {
    const h = step.hours || 0;
    const m = step.minutes || 0;
    const s = step.seconds || 0;

    const timeStr = [
      h ? `${h}t` : "",
      m ? `${m}m` : "",
      s ? `${s}s` : ""
    ].filter(Boolean).join(" ");

    if (timeStr) parts.push(timeStr);
  }

  if (step.durationType === "distance" && step.distance) {
    parts.push(`${step.distance} km`);
  }

  if (step.intensity) {
    parts.push(`Intensitet: ${step.intensity}`);
  }

  if (step.notes) {
    parts.push(step.notes);
  }

  return parts.join(" • ");
}


/* ============================
   RENDER STEP CARD
   ============================ */

function renderStepCard(step, index) {
  const colors = {
    warmup: "#fc4c02",
    run: "#007aff",
    cooldown: "#2ecc71",
    recovery: "#16a085",
    rest: "#9b59b6",
    other: "#bdc3c7"
  };

  const color = colors[step.type] || "#ffffff";

  return `
    <div class="step-card" style="border-left: 6px solid ${color};" onclick="editStep(${index})">

      <div class="step-card-header">
        <div class="step-title">${stepTitle(step)}</div>

        <div class="step-actions" onclick="event.stopPropagation()">

          <span class="step-action-btn" onclick="moveStepUp(${index})">▲</span>
          <span class="step-action-btn" onclick="moveStepDown(${index})">▼</span>
          <span class="step-action-btn delete" onclick="deleteStep(${index})">🗑</span>

        </div>
      </div>

      <div class="step-sub">${stepSubtitle(step)}</div>
    </div>
  `;
}


/* ============================
   RENDER MAIN (UGENS PAS)
   ============================ */

function renderMain() {
  const main = document.getElementById("main");
  if (!main) return;

  const sessions = getSessionsForWeek(selectedWeek);

  if (sessions.length === 0) {
    main.innerHTML = "<p>Ingen træningspas i denne uge endnu.</p>";
    document.getElementById("mainTitle").textContent = "Træningspas";
    return;
  }

  let html = "";

  sessions.forEach((session, idx) => {
    const isSelected = idx === selectedSessionIndex;

    html += `
      <div class="session-card ${isSelected ? "selected" : ""}" onclick="selectSession(${idx})">

        <div class="session-header">
          <div class="session-title">Træningspas: ${session.day}</div>

          <select class="session-day-select"
                  onchange="updateSessionDay(${idx}, this.value); event.stopPropagation();">
            ${["Mandag","Tirsdag","Onsdag","Torsdag","Fredag","Lørdag","Søndag"]
              .map(d => `<option value="${d}" ${d === session.day ? "selected" : ""}>${d}</option>`)
              .join("")}
          </select>
        </div>

        <div class="session-steps">
          ${session.steps.map((step, sIdx) => renderStepCard(step, sIdx)).join("")}
        </div>

        <div class="session-actions" onclick="event.stopPropagation();">
          <button onclick="addSingleStepToSession(${idx});">Tilføj trin</button>
          <button onclick="addIntervalToSession(${idx});">Tilføj interval</button>
        </div>

      </div>
    `;
  });

  main.innerHTML = html;

  const current = sessions[selectedSessionIndex];
  if (current) {
    document.getElementById("mainTitle").textContent =
      `Træningspas: ${current.day}`;
  }
}


/* ============================
   VÆLG TRÆNINGSPAS
   ============================ */

function selectSession(index) {
  selectedSessionIndex = index;
  renderMain();
  renderEditor();
}


/* ============================
   WINDOW EXPORTS
   ============================ */

window.addSession = addSession;
window.renderMain = renderMain;
window.selectSession = selectSession;
window.updateSessionDay = updateSessionDay;
window.addSingleStepToSession = addSingleStepToSession;
window.addIntervalToSession = addIntervalToSession;
window.getSessionsForWeek = getSessionsForWeek;
window.getCurrentSession = getCurrentSession;
window.deleteSession = deleteSession;
