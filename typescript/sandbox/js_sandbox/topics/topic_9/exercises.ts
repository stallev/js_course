/**
 * Тема 9 — any vs unknown, DOM
 */
export function asString(raw: unknown): string {
  // TODO: если строка — верни её, иначе ""
  return "";
}

export function fillTitle(): void {
  // TODO: querySelector("#title"); если нет — return; иначе textContent = "TS"
}

export function runTopic9(): void {
  console.log(asString("ок"));
  console.log(asString(9));
  fillTitle();
}

if (typeof document === "undefined") {
  runTopic9();
}
