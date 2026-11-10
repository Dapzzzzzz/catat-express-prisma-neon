function applyTheme(value) {
  document.documentElement.dataset.theme = value;
  const button = document.querySelector("#theme-toggle");
  if (button) {
    button.textContent = value === "dark" ? "Mode terang" : "Mode gelap";
    button.setAttribute("aria-pressed", String(value === "dark"));
  }
}

let savedTheme = "light";
try {
  savedTheme =
    localStorage.getItem("catat-theme") === "dark" ? "dark" : "light";
} catch {
  /* Tema tetap berfungsi jika penyimpanan browser diblokir. */
}
applyTheme(savedTheme);
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(savedTheme);
  document.querySelector("#theme-toggle")?.addEventListener("click", () => {
    savedTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(savedTheme);
    try {
      localStorage.setItem("catat-theme", savedTheme);
    } catch {
      /* Pilihan berlaku untuk halaman ini. */
    }
  });
});
