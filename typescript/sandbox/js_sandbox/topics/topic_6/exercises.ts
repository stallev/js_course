/**
 * Тема 6 — Типы функций
 */
export function area(width: number, height: number): number {
  // TODO
  return 0;
}

export function logStatus(ready: boolean): void {
  // TODO
}

export function runFns(): void {
  console.log(area(3, 4));
  logStatus(true);
  logStatus(false);
}

if (typeof document === "undefined") {
  runFns();
}
