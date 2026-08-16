# Контент курса — Раздел 3: Функции и сужение

> **Курс:** TypeScript поверх JavaScript  
> **Стек:** TypeScript · без React  
> **Охват:** Темы 6–7 (типы функций · narrowing)

---

# Раздел 3 — Функции и сужение

Как в 🔗 Junior разделе 4, функция — главный способ собрать шаги. Здесь добавляется контракт: какие аргументы есть, что возвращается, и как после `if` тип становится уже.

---

## Тема 6 — Типы функций

← Предыдущая тема: [5 — Union, optional, `null`](section_2_data.md#тема-5--union-optional-null)  
→ Следующая тема: [7 — Сужение (narrowing)](#тема-7--сужение-narrowing)

---

### Теория с аналогией

**Аналогия: рецепт с перечнем продуктов и блюда на выходе**

Параметры — продукты с типом. `return` — блюдо. `void` — рецепт «сделай побочный эффект, ничего не возвращай» (`console.log`, смена текста в DOM).

```typescript
function area(width: number, height: number): number {
  return width * height;
}

function logStatus(ready: boolean): void {
  console.log(ready ? "готово" : "ждём");
}

const paint = (title: string): string => `Тема: ${title}`;
```

Стрелки — 🔗 Junior тема 12; типы пишутся у параметров и после `=>` для возвращаемого, либо дай вывести из `return`.

Необязательный параметр: `unit?: string` в конце списка. Значение по умолчанию `unit = "м²"` тоже сужает дыру.

Если написал `: number`, а ветка ничего не возвращает — `tsc` красный. Это полезно.

### Где это в реальном коде

Обработчик клика в этом слое типизируй сам: `(event: Event) => void` или проще обёртка без `event`, если не нужен (🔗 Junior тема 18). Колбэк `map`: `(lesson: Lesson) => string`.

### Паттерны

❌ Не указывать возврат и случайно вернуть разное (`number` и `undefined`)  
✅ Явный `: number` или всегда `return`  
Почему: вызов ждал число.

❌ `: any` на параметре «потом разберём»  
✅ Реальный тип или union  
Почему: иначе тема 1 не работает.

❌ Путать `void` и `undefined`  
✅ `void` — «возврат не используй»; функция может не иметь `return`  
Почему: так помечают логгеры и обработчики.

### Вопросы

**Q1: Где обязательна аннотация — у `const n = 1` или у параметра?**  
У параметра: снаружи вывода нет.

**Q2: Можно ли тип функции как `type`?**  
Да: `type Mapper = (n: number) => string`.

**Q3: Что если забыл `return`?**  
При явном `: number` — ошибка. Без аннотации вывод станет `void`.

**Q4: Стрелка и `function` — разные типы?**  
Для этого слоя нет: оба описываются параметрами и возвратом. `this` не ядро (как в Junior).

**Q5: Несколько параметров одного типа?**  
`add(a: number, b: number): number` — каждый параметр отдельно.

### Практическое задание

Экспортируй `area(width: number, height: number): number` и `logStatus(ready: boolean): void`.

### Решение с инсайтом

```typescript
export function area(width: number, height: number): number {
  return width * height;
}

export function logStatus(ready: boolean): void {
  console.log(ready ? "готово" : "ждём");
}
```

**Инсайт:** типы функции — дверь: что входит и что выходит.

### Что дальше

У `string | number` нельзя звать `.toUpperCase`. После проверки — можно. Тема 7.

---

## Тема 7 — Сужение (narrowing)

← Предыдущая тема: [6 — Типы функций](#тема-6--типы-функций)  
→ Следующая тема: [8 — Простые дженерики](section_4_reuse.md#тема-8--простые-дженерики)

---

### Теория с аналогией

**Аналогия: коридор сужается**

Как в 🔗 Junior теме 13, внутри блока видно меньше внешнего мира. Здесь наоборот: внутри `if` мир типа **уже**. Снаружи `id: string | number`, внутри `typeof id === "string"` — это строка.

```typescript
function labelValue(value: string | number): string {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return String(value);
}

function titleOf(el: { textContent: string | null }): string {
  if (el.textContent === null) {
    return "";
  }
  return el.textContent;
}
```

Рабочие проверки этого слоя: `typeof`, `=== null`, `=== undefined`, `Array.isArray`, проверка поля `if (draft.title)`.

Не ядро: discriminated union с полем `kind` — хватит увидеть позже в Middle. Не ядро: `in` на сложных объектах.

### Где это в реальном коде

- JSON: сначала `unknown`, потом проверки (тема 9).
- DOM: `if (!node) return`.
- Ответ API: `if (typeof data.title !== "string") return`.

### Паттерны

❌ `value as string` чтобы замолчать  
✅ `typeof` / `null`  
Почему: `as` не проверяет runtime.

❌ Сужать вложенными `if` на пять этажей  
✅ Ранний `return`  
Почему: читается как Junior-поток (тема 8 Junior).

❌ Проверить `typeof` и забыть `return` в обеих ветках  
✅ Каждая ветка возвращает обещанный тип  
Почему: иначе функция не `string`.

### Вопросы

**Q1: Почему `typeof null` в JS — `"object"`, а для narrowing это ловушка?**  
Как в Junior: `typeof null === "object"`. Для null используй `=== null`, не `typeof`.

**Q2: Сужение работает только в `if`?**  
Ещё `switch`, тернарный, `&&` с осторожностью. Для курса достаточно `if` + early return.

**Q3: После `return` в `if` ниже тип уже без этого варианта?**  
Да. Это early return.

**Q4: `!value` сужает?**  
Для `string | null` — да (пустая строка тоже отсечётся). Для `number` ноль ложноват — осторожно.

**Q5: Нужен ли narrowing, если тип уже `string`?**  
Нет. Он нужен на union и `| null`.

### Практическое задание

`labelValue(value: string | number): string` — строки в верхний регистр, числа через `String`.

### Решение с инсайтом

```typescript
export function labelValue(value: string | number): string {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return String(value);
}
```

**Инсайт:** проверка в runtime — это же сужение для `tsc`. Не подменяй её `as`.

### Что дальше

Одна функция для массива чисел и массива строк без копипасты — дженерик. Тема 8.
