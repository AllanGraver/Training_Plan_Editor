function editSegments() {
  const session = plan.sessions.filter(s => s.week === selectedWeek)[selectedSessionIndex];

  const container = document.createElement("div");
  container.style.height = "400px";

  const modal = window.open("", "Segments", "width=750,height=900");
  modal.document.write("<h2>Rediger segmenter</h2>");
  modal.document.body.appendChild(container);

  const editor = new JSONEditor(container, { mode: "tree" });
  editor.set(session.segments);

  /* -----------------------------
     PRESET HELPERS
  ------------------------------ */
  function addPreset(preset) {
    const segs = editor.get();
    segs.push(preset);
    editor.set(segs);
  }

  /* -----------------------------
     PRESET DEFINITIONS
  ------------------------------ */

  const PRESETS = {
    "30-20-10": {
      type: "interval_block",
      repetitions: 3,
      steps: [
        { duration_min: 0.5, note: "30 sek hårdt" },
        { duration_min: 0.333, note: "20 sek moderat" },
        { duration_min: 0.166, note: "10 sek hurtigt" }
      ]
    },

    "Fartleg": {
      type: "interval_block",
      repetitions: 6,
      steps: [
        { duration_min: 2, note: "2 min hurtigt" },
        { duration_min: 1, note: "1 min roligt" }
      ]
    },

    "Pyramide": {
      type: "interval_block",
      repetitions: 1,
      steps: [
        { duration_min: 1, note: "1 min hårdt" },
        { duration_min: 2, note: "2 min hårdt" },
        { duration_min: 3, note: "3 min hårdt" },
        { duration_min: 2, note: "2 min hårdt" },
        { duration_min: 1, note: "1 min hårdt" }
      ]
    },

    "Progressivt løb": {
      type: "interval_block",
      repetitions: 1,
      steps: [
        { duration_min: 10, note: "Roligt" },
        { duration_min: 10, note: "Moderat" },
        { duration_min: 10, note: "Hårdt" }
      ]
    }
  };

  /* -----------------------------
     BUTTON BAR
  ------------------------------ */

  const bar = modal.document.createElement("div");
  bar.style.margin = "10px 0";

  bar.innerHTML = `
    <button id="addSegmentBtn">+ Tilføj segment</button>
    <button id="addStepBtn">+ Tilføj step</button>
    <button id="deleteStepBtn">Slet sidste step</button>
    <br><br>
    <strong>Interval presets:</strong><br>
    <button class="presetBtn" data-type="30-20-10">30-20-10</button>
    <button class="presetBtn" data-type="Fartleg">Fartleg</button>
    <button class="presetBtn" data-type="Pyramide">Pyramideløb</button>
    <button class="presetBtn" data-type="Progressivt løb">Progressivt løb</button>
    <br><br>
    <button id="saveSegmentsBtn" style="background:#0078d4;color:white;padding:10px 20px;">Gem segmenter</button>
  `;

  modal.document.body.appendChild(bar);

  /* -----------------------------
     BUTTON LOGIC
  ------------------------------ */

  // Tilføj segment
  modal.document.getElementById("addSegmentBtn").onclick = () => {
    const segs = editor.get();
    segs.push({
      type: "interval_block",
      repetitions: 1,
      steps: []
    });
    editor.set(segs);
  };

  // Tilføj step
  modal.document.getElementById("addStepBtn").onclick = () => {
    const segs = editor.get();
    const block = segs.find(s => s.type === "interval_block");

    if (!block) {
      alert("Ingen intervalblok fundet. Tilføj først et segment.");
      return;
    }

    if (!block.steps) block.steps = [];

    block.steps.push({
      duration_min: 1,
      note: "Nyt step"
    });

    editor.set(segs);
  };

  // Slet step
  modal.document.getElementById("deleteStepBtn").onclick = () => {
    const segs = editor.get();
    const block = segs.find(s => s.type === "interval_block");

    if (!block || !block.steps || block.steps.length === 0) {
      alert("Ingen steps at slette.");
      return;
    }

    block.steps.pop();
    editor.set(segs);
  };

  // Presets
  modal.document.querySelectorAll(".presetBtn").forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.type;
      addPreset(PRESETS[type]);
    };
  });

  // Gem
  modal.document.getElementById("saveSegmentsBtn").onclick = () => {
    session.segments = editor.get();
    modal.close();
    renderEditor();
  };
}
