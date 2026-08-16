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
  // TODO: #title и #out, null-check, textContent, classList.add("ready")
  if (typeof document === "undefined") {
    console.log("Открой browser/index.html");
    return;
  }
}

if (typeof document === "undefined") {
  fillDom();
}
