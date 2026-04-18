"use strict";
/* =========================================================
   FILE: weeks.js
   PURPOSE:
   - Håndterer uge-listen i venstre panel
   - Viser uger baseret på plan.sessions
   - Skift af selectedWeek og kald til renderSessionsForWeek()
   ========================================================= */

/* ============================
   BEREGN ANTAL UGER
   ============================ */

function getMaxWeekInPlan() {
  if (!plan.sessions || plan.sessions.length === 0) return 1;
  return Math.max(...plan.sessions.map(s => s.week || 1));
}

/* ============================
   RENDER UGE-LISTE
   ============================ */

function renderWeeks() {
  const container = document.getElementById("weekButtons");
  if (!container) return;

  container.innerHTML = "";

  const maxWeek = Number(plan.duration_weeks || 12);

  for (let w = 1; w <= maxWeek; w++) {
    const row = document.createElement("div");
    row.className = "week-item-row";

    const item = document.createElement("div");
    item.className = "week-item";
    item.textContent = `Træningsuge ${w}`;
    if (w === selectedWeek) item.classList.add("selected");

    item.onclick = () => selectWeek(w);

    row.appendChild(item);
    row.appendChild(del);
    container.appendChild(row);
  }
}

/* ============================
   VÆLG UGE
   ============================ */

function selectWeek(week) {
  selectedWeek = week;
  selectedSessionIndex = null;
  
  // ✅ vigtig: opdater ugeknappernes "selected" visuelt
  renderWeeks();

  // fortsæt som før

  renderSessionsForWeek();
}

/* ============================
   RENDER SESSIONS FOR UGE
   ============================ */

function renderSessionsForWeek() {
  const sessions = getSessionsForWeek(selectedWeek);

  if (sessions.length === 0) {
    selectedSessionIndex = null;
    renderMain();
    renderEditor();
    return;
  }

  if (selectedSessionIndex == null || selectedSessionIndex >= sessions.length) {
    selectedSessionIndex = 0;
  }

  renderMain();
  renderEditor();
}

/* ============================
   WINDOW EXPORTS
   ============================ */
/* ============================
   TILFØJ NY TRÆNINGSUGE
   ============================ */

function addWeek() {
  const maxWeek = getMaxWeekInPlan();
  const newWeek = maxWeek + 1;

  // Tilføj en tom uge (ingen pas endnu)
  plan.sessions.push({
    id: Date.now(),
    week: newWeek,
    name: "Pas 1",
    steps: []
  });

  selectedWeek = newWeek;
  selectedSessionIndex = null;

  renderWeeks();
  renderMain();
  renderEditor();
}
window.renderWeeks = renderWeeks;
window.selectWeek = selectWeek;
window.renderSessionsForWeek = renderSessionsForWeek;
window.addWeek = addWeek;

