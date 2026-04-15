"use strict";

/* =========================================================
   APP STATE (data model)
   ========================================================= */
let plan = {
  plan_name: "Ny træningsplan",
  duration_weeks: 12,
  race_distance_km: null,
  sessions: []
};

// UI state bruges af ui.js + autocalc.js + segments.js
let selectedWeek = 1;

// VIGTIGT: Dette er index i FILTERED sessions for valgt uge
// dvs: plan.sessions.filter(s => s.week === selectedWeek)[selectedSessionIndex]
let selectedSessionIndex = null;

/* =========================================================
   INIT / BOOTSTRAP
   ========================================================= */
(function initApp() {
  // Sørg for at plan har korrekt shape
  if (!Array.isArray(plan.sessions)) plan.sessions = [];
  if (!plan.duration_weeks) plan.duration_weeks = 12;

  // Kald eksisterende funktioner (de ligger i library.js / ui.js)
  if (typeof window.renderLibrary === "function") {
    window.renderLibrary();
  }

  if (typeof window.renderWeeks === "function") {
    window.renderWeeks();
  }

  if (typeof window.renderMain === "function") {
    window.renderMain();
  }

  // Render editor også (så højre panel er korrekt ved load)
  if (typeof window.renderEditor === "function") {
    window.renderEditor();
  }
})();
