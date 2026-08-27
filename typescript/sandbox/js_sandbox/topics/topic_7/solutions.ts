/**
 * Тема 8 (сетка) — сужение. Папка topic_7 — старый номер.
 */
export function labelValue(value: string | number): string {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return String(value);
}

export function runLabel(): void {
  console.log(labelValue("курс"));
  console.log(labelValue(7));
}

if (typeof document === "undefined") {
  runLabel();
}

// Инсайт: проверка в runtime — сужение для tsc. Не подменяй as.
