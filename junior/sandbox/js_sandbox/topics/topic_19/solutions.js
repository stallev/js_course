/**
 * Тема 19 — Формы
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function setupForm() {
  if (typeof document === "undefined") {
    console.log("Открой browser/index.html");
    return;
  }
  const form = document.querySelector("#topic-form");
  const titleInput = document.querySelector("#title");
  const out = document.querySelector("#out");
  if (form === null || titleInput === null || out === null) {
    console.log("нет узла");
    return;
  }
  if (form.dataset.bound === "1") {
    console.log("Уже включена");
    return;
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const raw = titleInput.value;
    if (raw === "") {
      out.textContent = "пусто";
      return;
    }
    out.textContent = "Тема: " + raw;
  });
  form.dataset.bound = "1";
  console.log("Форма готова");
}
