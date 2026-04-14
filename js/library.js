function loadLibrary() {
  const raw = localStorage.getItem("training_plans_library");
  return raw ? JSON.parse(raw) : {};
}

function saveLibrary(lib) {
  localStorage.setItem("training_plans_library", JSON.stringify(lib));
}

function renderLibrary() {
  const lib = loadLibrary();
  const div = document.getElementById("planLibrary");
  div.innerHTML = "";

  Object.keys(lib).forEach(name => {
    const item = document.createElement("div");
    item.className = "plan-item";
    item.textContent = name;
    item.onclick = () => loadPlan(name);
    div.appendChild(item);
  });
}

function savePlan() {
  const name = plan.plan_name || prompt("Navn på planen:");
  if (!name) return;

  const lib = loadLibrary();
  lib[name] = plan;
  saveLibrary(lib);
  renderLibrary();
}

function savePlanAs() {
  const name = prompt("Navn på ny plan:");
  if (!name) return;

  const lib = loadLibrary();
  lib[name] = plan;
  saveLibrary(lib);
  renderLibrary();
}

function loadPlan(name) {
  const lib = loadLibrary();
  plan = JSON.parse(JSON.stringify(lib[name]));
  selectedWeek = 1;
  selectedSessionIndex = null;
  renderWeeks();
  renderMain();
  renderEditor();
}

function exportPlan() {
  const data = JSON.stringify(plan, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = plan.plan_name + ".json";
  a.click();
}

function importPlan() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      plan = JSON.parse(reader.result);
      savePlan();
      renderLibrary();
      renderWeeks();
      renderMain();
      renderEditor();
    };

    reader.readAsText(file);
  };

  input.click();
}
