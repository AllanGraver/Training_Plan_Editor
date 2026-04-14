function editSegments() {
  const session = plan.sessions.filter(s => s.week === selectedWeek)[selectedSessionIndex];

  const container = document.createElement("div");
  container.style.height = "400px";

  const modal = window.open("", "Segments", "width=700,height=800");
  modal.document.write("<h2>Rediger segmenter</h2>");
  modal.document.body.appendChild(container);

  const editor = new JSONEditor(container, { mode: "tree" });
  editor.set(session.segments);

  // --- Tilføj segment ---
  const addSegmentBtn = modal.document.createElement("button");
  addSegmentBtn.textContent = "+ Tilføj segment";
  addSegmentBtn.style.marginRight = "10px";
  addSegmentBtn.onclick = () => {
    const segs = editor.get();
    segs.push({
      type: "interval_block",
      repetitions: 1,
      steps: []
    });
    editor.set(segs);
  };

  // --- Tilføj step ---
  const addStepBtn = modal.document.createElement("button");
  addStepBtn.textContent = "+ Tilføj step til intervalblok";
  addStepBtn.style.marginRight = "10px";
  addStepBtn.onclick = () => {
    const segs = editor.get();
    const block = segs.find(s => s.type === "interval_block");

    if (!block) {
      alert("Ingen intervalblok fundet. Tilføj først et segment af typen 'interval_block'.");
      return;
    }

    if (!block.steps) block.steps = [];

    block.steps.push({
      duration_min: 1,
      note: "Nyt step"
    });

    editor.set(segs);
  };

  // --- Slet step ---
  const deleteStepBtn = modal.document.createElement("button");
  deleteStepBtn.textContent = "Slet sidste step";
  deleteStepBtn.style.marginRight = "10px";
  deleteStepBtn.onclick = () => {
    const segs = editor.get();
    const block = segs.find(s => s.type === "interval_block");

    if (!block || !block.steps || block.steps.length === 0) {
      alert("Ingen steps at slette.");
      return;
    }

    block.steps.pop();
    editor.set(segs);
  };

  // --- Gem ---
  const saveBtn = modal.document.createElement("button");
  saveBtn.textContent = "Gem segmenter";
  saveBtn.style.marginTop = "10px";
  saveBtn.onclick = () => {
    session.segments = editor.get();
    modal.close();
    renderEditor();
  };

  modal.document.body.appendChild(addSegmentBtn);
  modal.document.body.appendChild(addStepBtn);
  modal.document.body.appendChild(deleteStepBtn);
  modal.document.body.appendChild(saveBtn);
}
