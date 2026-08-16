/**
 * Тема 20 — setTimeout
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function timeoutOrder() {
  console.log("старт");
  setTimeout(() => {
    console.log("потом");
  }, 500);
  console.log("сразу");
}
