/**
 * Тема 24 — Event Loop
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function loopOrder() {
  console.log("1");
  setTimeout(() => console.log("2"), 0);
  Promise.resolve().then(() => console.log("3"));
  console.log("4");
  console.log("5");
}

// Вывод: 1 4 5 3 2
