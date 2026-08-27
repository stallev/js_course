/**
 * Тема 13 — fetch / JSON как unknown
 */
export type User = { id: number; name: string };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function parseUser(raw: unknown): User | null {
  if (!isRecord(raw)) {
    return null;
  }
  const { id, name } = raw;
  if (typeof id !== "number" || typeof name !== "string") {
    return null;
  }
  return { id, name };
}

export function runParse(): void {
  console.log(parseUser(JSON.parse('{"id":1,"name":"Анна"}')));
  console.log(parseUser(9));
  console.log(parseUser({}));
}

if (typeof document === "undefined") {
  runParse();
}

// Инсайт: JSON — unknown. User появляется только после проверки полей.
