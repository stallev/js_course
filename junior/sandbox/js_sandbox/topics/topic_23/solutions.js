/**
 * Тема 23 — fetch
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export async function loadTodo() {
  const out = typeof document !== "undefined" ? document.querySelector("#out") : null;
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");
    if (response.ok === false) {
      throw new Error("HTTP " + response.status);
    }
    const data = await response.json();
    if (out !== null) {
      out.textContent = data.title;
    }
    console.log(data.title);
  } catch (error) {
    const message = error.message;
    if (out !== null) {
      out.textContent = message;
    }
    console.log(message);
  }
}
