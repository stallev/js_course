/**
 * Тема 17 — DOM
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function fillDom() {
  if (typeof document === "undefined") {
    console.log("Открой browser/index.html");
    return;
  }
  const title = document.querySelector("#title");
  const out = document.querySelector("#out");
  if (title === null || out === null) {
    console.log("нет узла");
    return;
  }
  console.log(title.textContent);
  out.textContent = "узел найден";
  out.classList.add("ready");
}
