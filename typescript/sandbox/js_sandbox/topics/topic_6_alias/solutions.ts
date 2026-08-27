/**
 * Тема 6 (сетка) — type vs interface
 */
export interface User {
  name: string;
  age: number;
}

export type UserId = string | number;

export type Staff = User & { role: "admin" | "editor" };

export function describeStaff(s: Staff): void {
  console.log(`${s.name}: ${s.role}`);
}

export function runStaff(): void {
  describeStaff({ name: "Анна", age: 20, role: "editor" });
}

if (typeof document === "undefined") {
  runStaff();
}

// Инсайт: объект — interface или type; union — только type; & — обе анкеты.
