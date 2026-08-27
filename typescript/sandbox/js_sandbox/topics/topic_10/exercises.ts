/**
 * Тема 10 — any vs unknown, as, type guard
 */
export function isString(x: unknown): x is string {
  // TODO: typeof === "string"
  return false;
}

export function asString(raw: unknown): string {
  // TODO: если строка — верни её, иначе ""
  return "";
}

export function runGuards(): void {
  console.log(asString("ок"));
  console.log(asString(9));
}

if (typeof document === "undefined") {
  runGuards();
}
