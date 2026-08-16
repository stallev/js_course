/**
 * Тема 7 — null / undefined
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function emptyValues() {
  let title;
  console.log(title);
  console.log(title === undefined);
  title = null;
  console.log(title === null);
  console.log(typeof title);
  const emptyText = "";
  const zero = 0;
  console.log(emptyText === null);
  console.log(zero === undefined);
}

// Инсайт: "" и 0 — значения. undefined — не клали. null — положили пусто.
