/**
 * Тема 9 (сетка) — дженерики и Promise<T>. Папка topic_8 — старый номер.
 */
export function first<T>(items: T[]): T | undefined {
  // TODO: верни первый элемент
  return undefined;
}

export function asPromise<T>(value: T): Promise<T> {
  // TODO: Promise.resolve(value)
  throw new Error("TODO: asPromise");
}

export async function runFirst(): Promise<void> {
  console.log(first([3, 1, 2]));
  console.log(first(["б", "а"]));
  console.log(first<number>([]));
  console.log(await asPromise(42));
}

if (typeof document === "undefined") {
  void runFirst();
}
