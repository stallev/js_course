/**
 * Тема 14 — export type / import type
 */
import type { Lesson } from "./lesson.js";
import { formatLesson } from "./lesson.js";

export function describeImported(lesson: Lesson): void {
  console.log(formatLesson(lesson));
}

export function runImported(): void {
  describeImported({ id: 14, title: "Модули" });
}

if (typeof document === "undefined") {
  runImported();
}

// Инсайт: чертёж — import type; функция — обычный import.
