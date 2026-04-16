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
  const container = document.getElementById("weekList");
  if (!container) return;

  container.innerHTML = "";

  const maxWeek = getMaxWeekInPlan();

  for (let w = 1; w <= maxWeek; w++) {
    const btn = document.createElement("button");
    btn.className = "week-btn";
    btn.textContent = `Uge ${w}`;

    if (w === selectedWeek) {
      btn.classList.add("selected");
    }

    btn.onclick = () => selectWeek(w);
    container.appendChild(btn);
  }
}

/* ============================
   VÆLG UGE
   ============================ */

function selectWeek(week) {
  selectedWeek = week;
  selectedSessionIndex = null;
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

window.renderWeeks = renderWeeks;
window.selectWeek = selectWeek;
window.renderSessionsForWeek = renderSessionsForWeek;
