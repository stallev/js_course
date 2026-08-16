/**
 * Тема 22 — async/await
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ms), ms);
  });
}

export async function runAsync() {
  async function run() {
    console.log("до");
    await wait(200);
    console.log("после");
  }
  run();
  console.log("снаружи");
}
