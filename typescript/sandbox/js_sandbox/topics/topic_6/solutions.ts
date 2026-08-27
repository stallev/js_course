/**
 * Тема 7 (сетка) — типы функций. Папка topic_6 — старый номер.
 */
export function area(width: number, height: number): number {
  return width * height;
}

export function logStatus(ready: boolean): void {
  console.log(ready ? "готово" : "ждём");
}

export function runFns(): void {
  console.log(area(3, 4));
  logStatus(true);
  logStatus(false);
}

if (typeof document === "undefined") {
  runFns();
}

// Инсайт: типы функции — что входит и что выходит.
