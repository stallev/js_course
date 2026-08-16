/**
 * Тема 21 — Promise
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ms), ms);
  });
}

export function runPromises() {
  wait(200).then((ms) => {
    console.log("ждали " + ms);
  });
  Promise.reject(new Error("учебный сбой")).catch((error) => {
    console.log(error.message);
  });
  console.log("сразу");
}
