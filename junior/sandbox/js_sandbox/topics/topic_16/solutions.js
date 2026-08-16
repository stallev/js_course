/**
 * Тема 16 — Ссылка
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function copyDemo() {
  const user = { name: "Анна" };
  const alias = user;
  alias.name = "Павел";
  console.log(user.name);
  const independent = { ...user };
  independent.name = "Оля";
  console.log(user.name);
  console.log(independent.name);
  const prices = [1, 2];
  const same = prices;
  same.push(3);
  console.log(prices);
  const other = [...prices];
  other.push(99);
  console.log(prices);
  console.log(other);
}
