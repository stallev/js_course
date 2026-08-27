/**
 * Тема 11 (сетка) — DOM Element | null. Папка topic_9 — старый номер.
 */
export function fillTitle(): void {
  if (typeof document === "undefined") {
    console.log("открой browser/index.html");
    return;
  }
  const el = document.querySelector("#title");
  if (!el) {
    return;
  }
  el.textContent = "TS";
}

export function runFillTitle(): void {
  fillTitle();
}

if (typeof document === "undefined") {
  runFillTitle();
}

// Инсайт: Element | null — честная дыра поиска. if (!el) сужает.
