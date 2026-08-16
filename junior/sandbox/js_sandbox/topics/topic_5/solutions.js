/**
 * Тема 5 — Строки и числа
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function priceTag() {
  const priceRaw = "150";
  const count = 2;
  const price = Number(priceRaw);
  const total = price * count;
  const label = `${count} шт. на ${total} ₽`;
  console.log(typeof priceRaw, typeof price);
  console.log(total);
  console.log(label);
}

// Инсайт: считать числами, человеку показывать строку.
