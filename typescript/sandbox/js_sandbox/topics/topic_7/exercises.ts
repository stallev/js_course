/**
 * Тема 8 (сетка) — сужение. Папка topic_7 — старый номер.
 */
export function labelValue(value: string | number): string {
  // TODO: string → toUpperCase, иначе String
  return "";
}

export function runLabel(): void {
  console.log(labelValue("курс"));
  console.log(labelValue(7));
}

if (typeof document === "undefined") {
  runLabel();
}
