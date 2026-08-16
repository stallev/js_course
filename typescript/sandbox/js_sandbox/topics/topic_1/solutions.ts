/**
 * Тема 1 — Зачем TypeScript
 */
export function greet(name: string): string {
  return `Привет, ${name}`;
}

export function runGreet(): void {
  console.log(greet("Анна"));
}

if (typeof document === "undefined") {
  runGreet();
}

// Инсайт: тип на параметре — обещание входа.
