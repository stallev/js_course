/**
 * Тема 9 — Циклы
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function runLoops() {
  for (let i = 1; i <= 5; i = i + 1) {
    console.log(i);
  }
  let n = 1;
  while (n <= 5) {
    console.log(n);
    n = n + 1;
  }
  for (const letter of "JS") {
    console.log(letter);
  }
  for (let i = 1; i <= 10; i = i + 1) {
    if (i % 2 === 0) {
      continue;
    }
    console.log(i);
    if (i === 7) {
      break;
    }
  }
}
