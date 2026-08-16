/**
 * Тема 6 — ===
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function strictEq() {
  const n = 18;
  const asText = "18";
  console.log(n === 18);
  console.log(asText === "18");
  console.log(asText === n);
  console.log(Number(asText) === n);
  console.log(asText !== n);
}

// Инсайт: === не переводит типы за тебя.
