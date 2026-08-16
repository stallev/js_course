/**
 * Тема 11 — Функции
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function add(a, b) {
  return a + b;
}

export function describe(age) {
  if (age < 18) {
    return "рано";
  }
  return "можно";
}

export function shout(text) {
  console.log(text);
}

export function runFunctions() {
  console.log(add(2, 3));
  console.log(describe(20));
  const out = shout("эй");
  console.log(out);
}

// Инсайт: return отдаёт значение; log — не возврат.
