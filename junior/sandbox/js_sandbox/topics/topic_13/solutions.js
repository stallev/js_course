/**
 * Тема 13 — Область видимости
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function runScope() {
  const greetPrefix = "Здравствуй";
  function greet(name) {
    console.log(`${greetPrefix}, ${name}`);
  }
  function area(width, height) {
    const unit = "м²";
    return `${width * height} ${unit}`;
  }
  greet("Анна");
  console.log(area(3, 4));
}

// Инсайт: внутри видно коридор. Коридор не видит unit.
