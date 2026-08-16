/**
 * Тема 5 — Union, optional, null
 */
export function formatId(id: string | number): string {
  // TODO: всегда строка
  return "";
}

export function labelDraft(d: { title?: string }): void {
  // TODO: нет title → «без названия»
}

export function runIds(): void {
  console.log(formatId(15));
  console.log(formatId("ab"));
  labelDraft({});
  labelDraft({ title: "Черновик" });
}

if (typeof document === "undefined") {
  runIds();
}
