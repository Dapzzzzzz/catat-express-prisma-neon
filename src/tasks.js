const priority = { Rendah: "RENDAH", Sedang: "SEDANG", Tinggi: "TINGGI" };
const status = { "Belum mulai": "BELUM_MULAI", Dikerjakan: "DIKERJAKAN", Selesai: "SELESAI" };
const reverse = (values) => Object.fromEntries(Object.entries(values).map(([key, value]) => [value, key]));
const priorityLabel = reverse(priority);
const statusLabel = reverse(status);

export function toDatabase(task) {
  return {
    ...task,
    tenggat: task.tenggat ? new Date(`${task.tenggat}T00:00:00.000Z`) : null,
    prioritas: priority[task.prioritas],
    status: status[task.status],
  };
}

export function toResponse({ id, judul, kategori, tenggat, prioritas, status, catatan }) {
  return {
    id, judul, kategori, catatan,
    tenggat: tenggat ? tenggat.toISOString().slice(0, 10) : "",
    prioritas: priorityLabel[prioritas],
    status: statusLabel[status],
  };
}
