/**
 * Тема 4 — Объекты, массивы, кортежи, type
 */
export type Lesson = {
  id: number;
  title: string;
};

export function describeLesson(lesson: Lesson): void {
  // TODO: лог «id: title»
}

export function lessonPair(lesson: Lesson): [number, string] {
  // TODO: кортеж [id, title]
  return [0, ""];
}

export function runLesson(): void {
  const lesson = { id: 4, title: "Объекты" };
  describeLesson(lesson);
  console.log(lessonPair(lesson));
}

if (typeof document === "undefined") {
  runLesson();
}
