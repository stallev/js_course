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
  if (raw === "") {
    return null;
  }
  const age = Number(raw);
  if (Number.isNaN(age)) {
    return null;
  }
  return age;
}

export function accessLabel(age) {
  if (age >= 18) {
    return "можно";
  }
  return "рано";
}

export function describeAge(raw) {
  const age = parseAge(raw);
  if (age === null) {
    return "нет";
  }
  return accessLabel(age);
}

export function runDescribeAge() {
  console.log(describeAge("20"));
  console.log(describeAge(""));
  console.log(describeAge("привет"));
}
