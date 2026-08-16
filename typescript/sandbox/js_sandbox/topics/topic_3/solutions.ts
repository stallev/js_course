/**
 * Тема 3 — Примитивы и вывод типов
 */
export function describePrimitives(): number {
  const title = "Курс";
  const year = 2026;
  const ready = true;
  console.log(title, year, ready);
  return title.length;
}

if (typeof document === "undefined") {
  console.log(describePrimitives());
}

// Инсайт: локальным значениям часто хватает вывода.
