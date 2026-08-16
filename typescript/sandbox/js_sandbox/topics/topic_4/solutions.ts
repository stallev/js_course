/**
 * Тема 4 — Объекты, массивы, type
 */
export type Lesson = {
  id: number;
  title: string;
};

export function describeLesson(lesson: Lesson): void {
  console.log(`${lesson.id}: ${lesson.title}`);
}

export function runLesson(): void {
  describeLesson({ id: 4, title: "Объекты" });
}

if (typeof document === "undefined") {
  runLesson();
}

// Инсайт: type — имя формы, не коробка в памяти.
