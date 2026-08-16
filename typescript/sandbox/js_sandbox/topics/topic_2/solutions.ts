/**
 * Тема 2 — Запуск
 */
export function printReady(): void {
  console.log("tsx запускает TypeScript");
}

if (typeof document === "undefined") {
  printReady();
}

// Инсайт: .ts — тот же запуск, плюс шаг проверки.
