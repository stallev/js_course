# Контент курса — Раздел 4: Переиспользование

> **Курс:** TypeScript поверх JavaScript  
> **Стек:** TypeScript · без React  
> **Охват:** Темы 8–9 (дженерики · `any`/`unknown` · DOM)

---

# Раздел 4 — Переиспользование и осторожность

Типы уже описывают данные и функции. Осталось не копировать `firstNumber` / `firstString` и не выключать проверку словом `any`. В конце — мост к DOM Junior: `querySelector` возвращает не «точно элемент».

---

## Тема 8 — Простые дженерики

← Предыдущая тема: [7 — Сужение](section_3_functions.md#тема-7--сужение-narrowing)  
→ Следующая тема: [9 — `any` vs `unknown`, DOM-типы](#тема-9--any-vs-unknown-dom-типы)

---

### Теория с аналогией

**Аналогия: коробка с этикеткой «то же, что внутри»**

`Array<number>` — коробка, внутри числа. Буква `T` в `function first<T>(items: T[]): T | undefined` — «положи этикетку с тем типом, что у элементов». Вызов `first([1, 2])` выводит `T = number`.

```typescript
function first<T>(items: T[]): T | undefined {
  return items[0];
}

const n = first([10, 20]);      // number | undefined
const s = first(["a", "b"]);    // string | undefined
```

`Promise<User>` — «когда дождёшься, будет `User`» (🔗 Junior темы 21–22: сам промис ты уже знаешь).

Не ядро слоя: `T extends ...`, несколько параметров `K, V`, условные типы.

### Где это в реальном коде

`Array.prototype.map` уже дженерик. Свои хелперы: `first`, `last`, обёртка `ok<T>(value: T)`. Не пиши дженерик, если функция всегда про `string`.

### Паттерны

❌ `function first(items: any[]): any`  
✅ `function first<T>(items: T[]): T | undefined`  
Почему: связь входа и выхода.

❌ Дженерик «на всякий случай» на каждую функцию  
✅ Только когда тип кочует из аргумента в результат  
Почему: иначе код как шифр.

❌ Игнорировать `undefined` у пустого массива  
✅ `T | undefined` или бросать ошибку осознанно  
Почему: пустой массив законен.

### Вопросы

**Q1: `T` — настоящий тип в JS?**  
Нет. Стирается. В runtime это обычная функция.

**Q2: Чем `T[]` отличается от `Array<T>`?**  
Запись разная, смысл тот же.

**Q3: Зачем `| undefined` у `first`?**  
`items[0]` может не существовать.

**Q4: Можно ли `first<string>([1])`?**  
`tsc` поругается: элементы не `string`.

**Q5: Это те дженерики, что в React `useState<User>`?**  
Та же идея «параметр типа». Хуки — Middle, не этот слой.

### Практическое задание

Реализуй `first<T>(items: T[]): T | undefined` и залогируй первый элемент `[3, 1, 2]` и `["б", "а"]`.

### Решение с инсайтом

```typescript
export function first<T>(items: T[]): T | undefined {
  return items[0];
}
```

**Инсайт:** дженерик связывает тип входа с типом выхода, не копируя функцию.

### Что дальше

Самая частая дыра — `any`. Рядом — честный `unknown` и `null` у DOM. Тема 9, конец слоя.

---

## Тема 9 — `any` vs `unknown`, DOM-типы

← Предыдущая тема: [8 — Простые дженерики](#тема-8--простые-дженерики)  
→ Следующая тема: слой [Middle](../../middle/README.md), если нужен React / Next / JS под капотом

---

### Теория с аналогией

**Аналогия: выключить сигнализацию vs коробка «не открывать без проверки»**

`any` — сигнализация выключена: можно вызывать что угодно, слой TypeScript перестал работать (тема 1).

`unknown` — коробка: значение есть, но пока не сузил (тема 7), нельзя звать методы.

```typescript
function parseTitle(raw: unknown): string {
  if (typeof raw !== "object" || raw === null) {
    return "";
  }
  if (!("title" in raw)) {
    return "";
  }
  const title = (raw as { title: unknown }).title;
  return typeof title === "string" ? title : "";
}
```

В упражнениях достаточно короткого пути: `typeof raw === "string"`.

**DOM** (🔗 Junior тема 17):

```typescript
const el = document.querySelector("#title");
// el: Element | null

if (!el) {
  return;
}
el.textContent = "Готово";
```

`document` есть только в браузере. В Node ветку с DOM не вызывай (как в Junior sandbox).

`JSON.parse` даёт в типах `any` в старых lib — лучше сразу считать результат `unknown`.

### Где это в реальном коде

- `fetch` → `response.json()` → проверка полей.
- `querySelector` / `getElementById`.
- Данные из `localStorage` — строка, потом `unknown`.

### Паттерны

❌ `const data: any = await res.json()`  
✅ `unknown` + сужение или функция-парсер  
Почему: сервер не обязан соблюдать твой `type`.

❌ `document.querySelector("#title")!` везде  
✅ `if (!el) return`  
Почему: `!` — обещание без проверки.

❌ `as Lesson` на любой JSON  
✅ Проверить поля  
Почему: `as` не валидатор.

### Вопросы

**Q1: Когда `any` допустим?**  
Почти никогда в этом слое. Временный костыль на границе старого JS — потом убрать.

**Q2: Чем `unknown` лучше `any`?**  
Заставляет narrowing. `any` заражает вызывающий код.

**Q3: Почему `querySelector` не `HTMLElement` сразу?**  
Селектор может ничего не найти → `null`. Узел может быть не HTMLElement.

**Q4: `lib: DOM` в tsconfig?**  
Чтобы `tsc` знал `document`. В sandbox курса DOM-lib включён.

**Q5: Что после этого слоя?**  
Junior JS + этот мост. Middle — Event Loop, `this`, React, Next, интервью. Тема 24 Middle глубже и вперемешку со стеком — не замена темам 1–9.

### Практическое задание

1. `asString(raw: unknown): string` — если строка, верни её, иначе `""`.
2. В браузере `fillTitle()`: найди `#title`, если нет — return; иначе поставь `textContent` в `"TS"`.

### Решение с инсайтом

```typescript
export function asString(raw: unknown): string {
  return typeof raw === "string" ? raw : "";
}

export function fillTitle(): void {
  if (typeof document === "undefined") {
    console.log("открой browser/index.html");
    return;
  }
  const el = document.querySelector("#title");
  if (!el) {
    return;
  }
  el.textContent = "TS";
}
```

**Инсайт:** `unknown` и `null` — честные дыры. `any` и `!` их прячут.

### Что дальше

Слой TypeScript закончен. Дальше по репозиторию — [`middle/README.md`](../../middle/README.md), когда пишешь на React/Next и готовишься к интервью.
