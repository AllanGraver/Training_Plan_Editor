function editSegments() {
  const session = plan.sessions.filter(s => s.week === selectedWeek)[selectedSessionIndex];

  const container = document.createElement("div");
  container.style.height = "400px";

  const modal = window.open("", "Segments", "width=600,height=700");
  modal.document.write("<h2>Rediger segmenter</h2>");
  modal.document.body.appendChild(container);

  const editor = new JSONEditor(container, { mode: "tree" });
  editor.set(session.segments);

  const saveBtn = modal.document.createElement("button");
  saveBtn.textContent = "Gem segmenter";
  saveBtn.onclick = () => {
    session.segments = editor.get();
    modal.close();
    renderEditor();
  };

  modal.document.body.appendChild(saveBtn);
}
