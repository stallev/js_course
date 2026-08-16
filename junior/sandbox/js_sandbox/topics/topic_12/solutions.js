/**
 * Тема 12 — Стрелки
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function runArrows() {
  const add = (a, b) => {
    return a + b;
  };
  const double = (n) => n * 2;
  const describe = (age) => {
    if (age < 18) {
      return "рано";
    }
    return "можно";
  };
  console.log(add(2, 3));
  console.log(double(4));
  console.log(describe(15));
}
