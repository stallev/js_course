/**
 * Тема 26 — Аккуратный код
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function parseAge(raw) {
  // TODO: "" или NaN → null, иначе число. Только ===
}

export function accessLabel(age) {
  // TODO: >= 18 «можно», иначе «рано»
}

export function describeAge(raw) {
  // TODO: parseAge + accessLabel
}

export function runDescribeAge() {
  console.log(describeAge("20"));
  console.log(describeAge(""));
  console.log(describeAge("привет"));
}

if (typeof document === "undefined") {
  runDescribeAge();
}
