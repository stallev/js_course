/**
 * Тема 15 — Массивы
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function runPrices() {
  const prices = [150, 200, 90, 40];
  console.log(prices[0], prices.length);
  prices.push(300);
  console.log(prices.length);
  const doubled = prices.map((price) => price * 2);
  const cheap = prices.filter((price) => price < 200);
  const firstLow = prices.find((price) => price < 100);
  console.log(doubled);
  console.log(cheap);
  console.log(firstLow);
}
