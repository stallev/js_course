/**
 * Тема 24 — Event Loop
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function loopOrder() {
  // TODO: 1, timeout 0 → 2, Promise.then → 3, 4 и 5 синхронно
  // Ожидаемый порядок в комментарии: 1 4 5 3 2
}

if (typeof document === "undefined") {
  loopOrder();
}
