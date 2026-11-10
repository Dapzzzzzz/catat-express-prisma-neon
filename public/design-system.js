const demoDialog = document.querySelector("#demo-dialog");
const demoResult = document.querySelector("#demo-result");
document
  .querySelector("#show-demo")
  .addEventListener("click", () => demoDialog.showModal());
document
  .querySelectorAll("#close-demo, #dismiss-demo")
  .forEach((button) =>
    button.addEventListener("click", () => demoDialog.close()),
  );
document.querySelector("#demo-notice").addEventListener("click", () => {
  demoResult.textContent =
    "Notifikasi contoh muncul. Tidak ada tugas yang disimpan.";
  demoResult.hidden = false;
});
document.querySelector("#demo-form").addEventListener("submit", (event) => {
  event.preventDefault();
  demoResult.textContent =
    "Validasi contoh berhasil. Tidak ada tugas yang disimpan.";
  demoResult.hidden = false;
});
