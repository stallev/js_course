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
  // TODO
}

export function describe(age) {
  // TODO: "рано" если age < 18 иначе "можно"
}

export function shout(text) {
  // TODO: только console.log, без return
}

export function runFunctions() {
  console.log(add(2, 3));
  console.log(describe(20));
  const out = shout("эй");
  console.log(out);
}

if (typeof document === "undefined") {
  runFunctions();
}
