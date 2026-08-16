/**
 * Тема 1 — Зачем TypeScript
 * npx tsx typescript/sandbox/js_sandbox/topics/topic_1/exercises.ts
 */
export function greet(name: string): string {
  // TODO: верни приветствие, без any
  return "";
}

export function runGreet(): void {
  console.log(greet("Анна"));
}

if (typeof document === "undefined") {
  runGreet();
}
