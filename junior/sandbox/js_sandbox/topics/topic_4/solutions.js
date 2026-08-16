/**
 * Тема 4 — typeof
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function printTypes() {
  const title = "Курс";
  const year = 2026;
  const ready = true;
  let extra;
  console.log(typeof title, title);
  console.log(typeof year, year);
  console.log(typeof ready, ready);
  console.log(typeof extra);
  console.log(typeof null); // "object" — ошибка языка
}

// Инсайт: тип — у значения, не у имени переменной.
