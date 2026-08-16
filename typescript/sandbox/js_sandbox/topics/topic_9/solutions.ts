/**
 * Тема 9 — any vs unknown, DOM
 */
export function asString(raw: unknown): string {
  return typeof raw === "string" ? raw : "";
}

export function fillTitle(): void {
  if (typeof document === "undefined") {
    console.log("открой browser/index.html");
    return;
  }
  const el = document.querySelector("#title");
  if (!el) {
    return;
  }
  el.textContent = "TS";
}

export function runTopic9(): void {
  console.log(asString("ок"));
  console.log(asString(9));
  fillTitle();
}

if (typeof document === "undefined") {
  runTopic9();
}

// Инсайт: unknown и null — честные дыры. any и ! их прячут.
