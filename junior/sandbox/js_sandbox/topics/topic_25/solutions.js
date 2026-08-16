/**
 * Тема 25 — Модули
 * Эталон: double экспортируется из этого же смысла, что math.js
 */

export function double(n) {
  return n * 2;
}

export function runDouble() {
  console.log(double(4));
}

// Инсайт: export в отдельном файле, import по пути ./math.js
