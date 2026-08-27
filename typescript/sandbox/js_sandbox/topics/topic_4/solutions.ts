/**
 * Тема 4 — Объекты, массивы, кортежи, type
 */
export type Lesson = {
  id: number;
  title: string;
};

export function describeLesson(lesson: Lesson): void {
  console.log(`${lesson.id}: ${lesson.title}`);
}

export function lessonPair(lesson: Lesson): [number, string] {
  return [lesson.id, lesson.title];
}

export function runLesson(): void {
  const lesson = { id: 4, title: "Объекты" };
  describeLesson(lesson);
  console.log(lessonPair(lesson));
}

if (typeof document === "undefined") {
  runLesson();
}

// Инсайт: type — имя формы; кортеж фиксирует порядок слотов.
