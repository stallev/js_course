/**
 * Тема 14 — export type / import type
 */
import type { Lesson } from "./lesson.js";
import { formatLesson } from "./lesson.js";

export function describeImported(lesson: Lesson): void {
  // TODO: лог через formatLesson
}

export function runImported(): void {
  describeImported({ id: 14, title: "Модули" });
}

if (typeof document === "undefined") {
  runImported();
}
