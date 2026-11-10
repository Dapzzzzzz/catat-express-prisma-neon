const $ = (selector) => document.querySelector(selector);
const form = $("#task-form");
const taskDialog = $("#task-dialog");
const deleteDialog = $("#delete-dialog");
const priorities = { Tinggi: 0, Sedang: 1, Rendah: 2 };
let tasks = [];
let currentView = "Semua";
let editingId = null;
let deletingId = null;
let changedId = null;
let busy = false;
let loading = false;
let hasLoaded = false;
let loadVersion = 0;

const dateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).formatToParts(new Date());
const part = (type) => dateParts.find((value) => value.type === type).value;
const today = `${part("year")}-${part("month")}-${part("day")}`;
$("#today-date").textContent = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showError(node, text = "") {
  node.textContent = text;
  node.hidden = !text;
}

function showMessage(title, description) {
  $("#operation-title").textContent = title;
  $("#operation-description").textContent = description;
  $("#operation-message").hidden = false;
}

async function request(path = "", options = {}) {
  let response;
  try {
    response = await fetch(`/api/tugas${path}`, {
      ...options,
      headers: options.body ? { "Content-Type": "application/json" } : {},
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error(
      "Server belum terhubung. Pastikan aplikasi berjalan, lalu coba lagi.",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Respons server tidak dapat dibaca. Coba muat ulang.");
  }
  if (!response.ok)
    throw new Error(result.message || "Permintaan belum berhasil.");
  return result;
}

function updateBusy() {
  $("#add-task").disabled = busy;
  $("#reload").disabled = busy || loading;
  $("#task-list")
    .querySelectorAll("button,input")
    .forEach((control) => {
      control.disabled = busy;
    });
}

function setBusy(dialog, value) {
  busy = value;
  if (dialog) {
    dialog.dataset.busy = String(value);
    dialog
      .querySelectorAll("input,select,textarea,button")
      .forEach((control) => {
        control.disabled = value;
      });
  }
  updateBusy();
}

function renderListState(title, description, action) {
  const state = element("div", "list-state");
  state.append(element("h2", "", title), element("p", "", description));
  if (action) {
    const button = element("button", "button", action.label);
    button.addEventListener("click", action.run);
    state.append(button);
  }
  $("#task-list").replaceChildren(state);
}

function renderCategories() {
  const selected = $("#category-filter").value;
  const categories = [...new Set(tasks.map((task) => task.kategori))].sort(
    (a, b) => a.localeCompare(b, "id"),
  );
  $("#category-filter").replaceChildren(new Option("Semua kategori", ""));
  $("#categories").replaceChildren();
  categories.forEach((category) => {
    $("#category-filter").append(new Option(category, category));
    $("#categories").append(new Option(category, category));
  });
  $("#category-filter").value = categories.includes(selected) ? selected : "";
}

function deadlineText(task) {
  if (!task.tenggat) return "Tanpa tenggat";
  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${task.tenggat}T00:00:00Z`));
  if (task.status !== "Selesai" && task.tenggat === today) return "Hari ini";
  return formatted;
}

function render() {
  const completed = tasks.filter((task) => task.status === "Selesai").length;
  $("#completion-progress").max = tasks.length || 1;
  $("#completion-progress").value = completed;
  $("#completion-progress").textContent = `${completed} dari ${tasks.length}`;
  $("#completion-text").textContent = tasks.length
    ? `${completed} dari ${tasks.length} tugas selesai.`
    : "Belum ada tugas.";
  $("#heading-summary").textContent = tasks.length
    ? `${tasks.length} tugas, ${completed} selesai`
    : "Tambahkan tugas pertama untuk memulai.";
  document.querySelectorAll("[data-count]").forEach((node) => {
    node.textContent =
      node.dataset.count === "Semua"
        ? tasks.length
        : tasks.filter((task) => task.status === node.dataset.count).length;
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    const selected = button.dataset.view === currentView;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const query = $("#search").value.trim().toLocaleLowerCase("id");
  const category = $("#category-filter").value;
  const sort = $("#sort").value;
  const filtered = tasks.filter(
    (task) =>
      (currentView === "Semua" || task.status === currentView) &&
      (!category || task.kategori === category) &&
      (!query ||
        `${task.judul} ${task.catatan}`
          .toLocaleLowerCase("id")
          .includes(query)),
  );
  filtered.sort((a, b) => {
    const completion =
      Number(a.status === "Selesai") - Number(b.status === "Selesai");
    if (completion) return completion;
    if (sort === "newest") return b.id - a.id;
    if (
      sort === "priority" &&
      priorities[a.prioritas] !== priorities[b.prioritas]
    )
      return priorities[a.prioritas] - priorities[b.prioritas];
    return (
      (a.tenggat || "9999-12-31").localeCompare(b.tenggat || "9999-12-31") ||
      priorities[a.prioritas] - priorities[b.prioritas] ||
      a.id - b.id
    );
  });
  $("#view-title").textContent =
    currentView === "Semua" ? "Semua tugas" : currentView;
  $("#result-count").textContent = `${filtered.length} dari ${tasks.length}`;
  $("#reset-filters").hidden = !query && !category && currentView === "Semua";
  $("#task-list").replaceChildren();
  filtered.forEach((task) => {
    const row = element("article", "task-row");
    row.dataset.id = task.id;
    row.classList.toggle("completed", task.status === "Selesai");
    row.classList.toggle("changed", task.id === changedId);

    const checkboxLabel = element("label", "checkbox task-check");
    checkboxLabel.htmlFor = `check-${task.id}`;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `check-${task.id}`;
    checkbox.checked = task.status === "Selesai";
    checkbox.setAttribute(
      "aria-label",
      `${task.status === "Selesai" ? "Buka kembali" : "Tandai selesai"}: ${task.judul}`,
    );
    checkbox.addEventListener("change", () => toggleComplete(task));
    checkboxLabel.append(checkbox);

    const content = element("div", "task-content");
    const titleLine = element("div");
    titleLine.append(element("h2", "task-title", task.judul));
    content.append(titleLine);
    if (task.catatan)
      content.append(element("p", "task-description", task.catatan));
    const details = element("div", "task-details");
    details.append(
      element("span", "category-tag", task.kategori),
      element(
        "span",
        `status-text${task.status === "Selesai" ? " done" : ""}`,
        task.status,
      ),
    );
    content.append(details);

    const due = element("div", "task-due");
    const deadline = element("span", "", deadlineText(task));
    if (task.tenggat && task.tenggat < today && task.status !== "Selesai") {
      deadline.className = "overdue";
      deadline.textContent += " (lewat)";
    }
    due.append(
      deadline,
      element(
        "span",
        `priority${task.prioritas === "Tinggi" ? " high" : ""}`,
        `Prioritas ${task.prioritas.toLowerCase()}`,
      ),
    );
    const actions = element("div", "task-actions");
    const edit = element("button", "text-button", "Edit");
    edit.setAttribute("aria-label", `Edit: ${task.judul}`);
    edit.addEventListener("click", () => openForm(task));
    const remove = element("button", "text-button danger", "Hapus");
    remove.setAttribute("aria-label", `Hapus: ${task.judul}`);
    remove.addEventListener("click", () => openDelete(task));
    actions.append(edit, remove);
    row.append(checkboxLabel, content, due, actions);
    $("#task-list").append(row);
  });
  if (!filtered.length) {
    renderListState(
      tasks.length ? "Tidak ada tugas yang cocok." : "Daftar masih kosong.",
      tasks.length
        ? "Coba kata kunci atau filter lain."
        : "Tambahkan tugas yang ingin kamu kerjakan.",
      tasks.length
        ? { label: "Reset filter", run: resetFilters }
        : { label: "Tambah tugas", run: () => openForm() },
    );
  }
  updateBusy();
}

async function loadData() {
  const version = ++loadVersion;
  loading = true;
  $("#task-list").setAttribute("aria-busy", "true");
  updateBusy();
  try {
    const result = await request();
    if (version !== loadVersion) return;
    tasks = result.data;
    hasLoaded = true;
    showError($("#load-error"));
    renderCategories();
    render();
  } catch (error) {
    if (version !== loadVersion) return;
    showError(
      $("#load-error"),
      `${error.message} Gunakan Muat ulang untuk mengambil data terbaru.`,
    );
    if (!hasLoaded) {
      $("#heading-summary").textContent = "Daftar belum berhasil dimuat.";
      $("#result-count").textContent = "Belum terhubung";
      renderListState(
        "Data belum dapat dimuat.",
        "Periksa apakah server sedang berjalan.",
        { label: "Coba lagi", run: loadData },
      );
    }
  } finally {
    if (version === loadVersion) {
      loading = false;
      $("#task-list").setAttribute("aria-busy", "false");
      updateBusy();
    }
  }
}

function resetFilters() {
  currentView = "Semua";
  $("#search").value = "";
  $("#category-filter").value = "";
  render();
}

function openForm(task) {
  if (busy) return;
  editingId = task ? task.id : null;
  form.reset();
  showError($("#form-error"));
  $("#form-title").textContent = task ? "Edit tugas" : "Tambah tugas";
  $("#form-description").textContent = task
    ? "Ubah detail tugas, lalu simpan perubahan."
    : "Tentukan apa yang perlu dikerjakan.";
  $("#save-task").textContent = task ? "Simpan perubahan" : "Simpan tugas";
  if (task)
    for (const key of [
      "judul",
      "kategori",
      "tenggat",
      "prioritas",
      "status",
      "catatan",
    ])
      form.elements[key].value = task[key];
  taskDialog.showModal();
  $("#judul").focus();
}

function openDelete(task) {
  if (busy) return;
  deletingId = task.id;
  $("#delete-task-title").textContent = task.judul;
  showError($("#delete-error"));
  deleteDialog.showModal();
  deleteDialog.querySelector(".dialog-actions [data-close]").focus();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy || !form.reportValidity()) return;
  const body = Object.fromEntries(new FormData(form));
  const wasEditing = editingId !== null;
  let savedId = null;
  setBusy(taskDialog, true);
  $("#save-task").textContent = "Menyimpan...";
  showError($("#form-error"));
  try {
    const result = await request(wasEditing ? `/${editingId}` : "", {
      method: wasEditing ? "PUT" : "POST",
      body: JSON.stringify(body),
    });
    if (wasEditing)
      tasks = tasks.map((task) => (task.id === editingId ? result.data : task));
    else tasks.push(result.data);
    changedId = result.data.id;
    savedId = result.data.id;
    renderCategories();
    resetFilters();
    taskDialog.close();
    showMessage(
      wasEditing ? "Perubahan tersimpan." : "Tugas ditambahkan.",
      result.data.judul,
    );
    await loadData();
  } catch (error) {
    showError($("#form-error"), error.message);
  } finally {
    setBusy(taskDialog, false);
    $("#save-task").textContent = wasEditing
      ? "Simpan perubahan"
      : "Simpan tugas";
    if (savedId !== null) {
      const target = wasEditing
        ? document.querySelector(`[data-id="${savedId}"] .task-actions button`)
        : $("#add-task");
      target?.focus({ preventScroll: true });
    }
  }
});

$("#confirm-delete").addEventListener("click", async () => {
  if (busy) return;
  setBusy(deleteDialog, true);
  let deleted = false;
  showError($("#delete-error"));
  try {
    const result = await request(`/${deletingId}`, { method: "DELETE" });
    tasks = tasks.filter((task) => task.id !== deletingId);
    changedId = null;
    renderCategories();
    render();
    deleteDialog.close();
    deleted = true;
    showMessage("Tugas dihapus.", result.data.judul);
    await loadData();
  } catch (error) {
    showError($("#delete-error"), error.message);
  } finally {
    setBusy(deleteDialog, false);
    if (deleted) $("#add-task").focus({ preventScroll: true });
  }
});

async function toggleComplete(task) {
  if (busy) return;
  setBusy(null, true);
  const { id, ...body } = task;
  body.status = task.status === "Selesai" ? "Belum mulai" : "Selesai";
  try {
    const result = await request(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    tasks = tasks.map((row) => (row.id === id ? result.data : row));
    changedId = id;
    render();
    showMessage(
      body.status === "Selesai"
        ? "Tugas ditandai selesai."
        : "Tugas dibuka kembali.",
      result.data.judul,
    );
    await loadData();
  } catch (error) {
    render();
    showError($("#load-error"), error.message);
  } finally {
    setBusy(null, false);
    const target =
      $(`#check-${id}`) ||
      document.querySelector('[data-view][aria-pressed="true"]');
    target?.focus({ preventScroll: true });
  }
}

document.querySelectorAll("[data-view]").forEach((button) =>
  button.addEventListener("click", () => {
    currentView = button.dataset.view;
    render();
  }),
);
document
  .querySelectorAll("[data-close]")
  .forEach((button) =>
    button.addEventListener("click", () => button.closest("dialog").close()),
  );
document.querySelectorAll("dialog").forEach((dialog) =>
  dialog.addEventListener("cancel", (event) => {
    if (dialog.dataset.busy === "true") event.preventDefault();
  }),
);
$("#search").addEventListener("input", render);
$("#category-filter").addEventListener("change", render);
$("#sort").addEventListener("change", render);
$("#reset-filters").addEventListener("click", resetFilters);
$("#reload").addEventListener("click", loadData);
$("#add-task").addEventListener("click", () => openForm());
$("#open-guide").addEventListener("click", () =>
  $("#guide-dialog").showModal(),
);
$("#open-api").addEventListener("click", () => $("#api-dialog").showModal());
$("#dismiss-message").addEventListener("click", () => {
  $("#operation-message").hidden = true;
});
loadData();
