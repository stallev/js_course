/**
 * Тема 2 — let и const
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function printCourse() {
  const courseName = "JavaScript Junior";
  let lesson = 1;
  console.log(courseName);
  console.log(lesson);
  lesson = 2;
  console.log(lesson);
}

// Инсайт: const — не переназначай имя. let — когда значение меняется.
