/**
 * Тема 6 (сетка) — type vs interface.
 * Папка topic_6 пока занята старым упражнением про типы функций.
 */
export interface User {
  name: string;
  age: number;
}

export type UserId = string | number;

export type Staff = User & { role: "admin" | "editor" };

export function describeStaff(s: Staff): void {
  // TODO: лог «имя: роль»
}

export function runStaff(): void {
  describeStaff({ name: "Анна", age: 20, role: "editor" });
}

if (typeof document === "undefined") {
  runStaff();
}
