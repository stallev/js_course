/**
 * Тема 5 — Union, optional, null
 */
export function formatId(id: string | number): string {
  return String(id);
}

export function labelDraft(d: { title?: string }): void {
  console.log(d.title ?? "без названия");
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

// Инсайт: | — список вариантов; ? — поле может не прийти.
