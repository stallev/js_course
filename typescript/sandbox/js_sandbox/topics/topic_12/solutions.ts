/**
 * Тема 12 — Discriminated union и never
 */
export type LoadState =
  | { status: "loading" }
  | { status: "success"; data: string }
  | { status: "error"; message: string };

export function labelState(state: LoadState): string {
  switch (state.status) {
    case "loading":
      return "ждём";
    case "success":
      return state.data;
    case "error":
      return state.message;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function runState(): void {
  console.log(labelState({ status: "loading" }));
  console.log(labelState({ status: "success", data: "готово" }));
  console.log(labelState({ status: "error", message: "нет сети" }));
}

if (typeof document === "undefined") {
  runState();
}

// Инсайт: метка делает невалидное состояние невыразимым; never сторожит ветку.
