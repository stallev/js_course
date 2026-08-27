/**
 * Тема 13 — fetch / JSON как unknown
 */
export type User = { id: number; name: string };

export function parseUser(raw: unknown): User | null {
  // TODO: объект с id: number и name: string, иначе null
  return null;
}

export function runParse(): void {
  console.log(parseUser(JSON.parse('{"id":1,"name":"Анна"}')));
  console.log(parseUser(9));
  console.log(parseUser({}));
}

if (typeof document === "undefined") {
  runParse();
}
