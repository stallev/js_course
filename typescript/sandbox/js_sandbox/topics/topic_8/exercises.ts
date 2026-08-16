/**
 * Тема 8 — Простые дженерики
 */
export function first<T>(items: T[]): T | undefined {
  // TODO: верни первый элемент
  return undefined;
}

export function runFirst(): void {
  console.log(first([3, 1, 2]));
  console.log(first(["б", "а"]));
  console.log(first<number>([]));
}

if (typeof document === "undefined") {
  runFirst();
}
