/**
 * Тема 10 — any vs unknown, as, type guard
 */
export function isString(x: unknown): x is string {
  return typeof x === "string";
}

export function asString(raw: unknown): string {
  return isString(raw) ? raw : "";
}

export function runGuards(): void {
  console.log(asString("ок"));
  console.log(asString(9));
}

if (typeof document === "undefined") {
  runGuards();
}

// Инсайт: unknown честен; guard сужает; as и any прячут дыру.
