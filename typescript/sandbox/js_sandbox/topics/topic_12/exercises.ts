/**
 * Тема 12 — Discriminated union и never
 */
export type LoadState =
  | { status: "loading" }
  | { status: "success"; data: string }
  | { status: "error"; message: string };

export function labelState(state: LoadState): string {
  // TODO: switch по status; default → never
  return "";
}

export function runState(): void {
  console.log(labelState({ status: "loading" }));
  console.log(labelState({ status: "success", data: "готово" }));
  console.log(labelState({ status: "error", message: "нет сети" }));
}

if (typeof document === "undefined") {
  runState();
}
