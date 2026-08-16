/**
 * Тема 10 — try/catch
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function safeParse() {
  const raw = "{ не json }";
  try {
    const data = JSON.parse(raw);
    console.log(data);
  } catch (error) {
    console.log("не JSON");
    console.log(error.message);
  }
  console.log("готово");
}

// Инсайт: пустой catch хуже падения.
