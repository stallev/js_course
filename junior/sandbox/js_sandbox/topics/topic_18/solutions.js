/**
 * Тема 18 — События
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function setupCounter() {
  if (typeof document === "undefined") {
    console.log("Открой browser/index.html");
    return;
  }
  const go = document.querySelector("#go");
  const out = document.querySelector("#out");
  if (go === null || out === null) {
    console.log("нет узла");
    return;
  }
  if (go.dataset.bound === "1") {
    console.log("Уже включён");
    return;
  }
  let clicks = 0;
  function onGoClick(event) {
    console.log(event.type);
    clicks = clicks + 1;
    out.textContent = String(clicks);
  }
  go.addEventListener("click", onGoClick);
  go.dataset.bound = "1";
  console.log("Счётчик включён — нажми «Жми»");
}
