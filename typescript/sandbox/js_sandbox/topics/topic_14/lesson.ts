export type Lesson = {
  id: number;
  title: string;
};

export function formatLesson(lesson: Lesson): string {
  return `${lesson.id}: ${lesson.title}`;
}
