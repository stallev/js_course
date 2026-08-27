# Контент курса — Раздел 5: Контракты на границах

> **Курс:** TypeScript поверх JavaScript  
> **Стек:** TypeScript · без React  
> **Охват:** Темы 12–14 (discriminated union · `fetch` / JSON · `export type`)

---

# Раздел 5 — Контракты на границах

Разделы 1–4 учат описать данные и функции внутри своей программы. Этот раздел про **границы**: состояние с несколькими взаимоисключающими вариантами, данные с сети (🔗 Junior тема 23) и типы, которые уезжают в другой файл (🔗 Junior тема 25).

Без этого Middle тема 24 кажется скачком, а не углублением. React и `infer` сюда не входят.

- [Тема 12 — Discriminated union и `never`](#тема-12--discriminated-union-и-never)
- [Тема 13 — Типизация `fetch` / JSON](#тема-13--типизация-fetch--json)
- [Тема 14 — Модули: `export type`, `import type`](#тема-14--модули-export-type-import-type)

---

## Тема 12 — Discriminated union и `never`

← Предыдущая тема: [11 — DOM-типы](section_4_reuse.md#тема-11--dom-типы-element--null)  
→ Следующая тема: [13 — Типизация `fetch` / JSON](#тема-13--типизация-fetch--json)

---

### Теория с аналогией

**Аналогия: три двери, на каждой своя табличка, в комнате — только вещи этой двери**

Обычный объект `{ data: string | null; error: string | null; loading: boolean }` разрешает враньё: `loading: true` и `data` одновременно. **Discriminated union** (тегированное объединение) — несколько объектных вариантов с общим полем-меткой (дискриминатором), у каждого свои поля.

```typescript
type LoadState =
  | { status: "loading" }
  | { status: "success"; data: string }
  | { status: "error"; message: string };

function labelState(state: LoadState): string {
  switch (state.status) {
    case "loading":
      return "ждём";
    case "success":
      return state.data;
    case "error":
      return state.message;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
```

После `case "success"` компилятор знает: есть `data`, нет `message`. Это сужение темы 8 по литералу поля (тема 3: литералы).

**`never`** — тип, которого не бывает: значение сюда попасть не должно. Если добавишь `{ status: "idle" }` в union и забудешь `case`, присваивание в `never` покраснеет. Это исчерпывание (exhaustiveness), не «магия».

`never` ещё у функции, которая всегда бросает: `function fail(msg: string): never { throw new Error(msg); }`. После `fail` поток не продолжается. Не ядро: условные типы из `never`.

Без Redux и хуков: тот же приём для «загрузка / ок / ошибка» в обычной функции.

### Где это в реальном коде

- Состояние запроса до темы 13: ещё нет данных / есть строка / есть текст ошибки.
- Результат парсера: `{ ok: true; value: T } | { ok: false; error: string }`.
- Статус заказа: `"new" | "paid" | "shipped"` как поле объекта, не три разрозненных boolean.

### Паттерны

❌ `{ data: T | null; error: string | null; loading: boolean }`  
✅ Варианты с `status` (или `kind`, `type`)  
Почему: невалидную комбинацию нельзя собрать.

❌ `as never` чтобы замолчать default  
✅ Реально покрыть все `case`  
Почему: иначе исчерпывание врёт.

❌ Discriminator типа `string` без литералов  
✅ `"loading" | "success" | "error"`  
Почему: иначе `switch` не сузит.

### Вопросы

**Q1: Чем discriminated union отличается от `string | number` темы 5?**  
Там одно значение — примитив одного из видов. Здесь одно значение — *объект одного из вариантов*, и варианты различаются полем-меткой. Сужение идёт не через `typeof`, а через `=== "success"` на метке. Поля, которых нет у варианта, после сужения недоступны.

**Q2: Зачем общее поле `status`, а не три разных ключа?**  
Метка — то, на что смотрит `switch`/`if`. Если у каждого варианта своё уникальное имя поля без общей метки, сужение сложнее. Литерал `"loading"` узкий (тема 3), поэтому ветки взаимоисключающие. Не делай `status: string` — слишком широко.

**Q3: Почему `{ data, error, loading }` плох?**  
Можно собрать `loading: true` и `data: "ок"` вместе. Вызывающий не знает, чему верить. Tagged union делает такую анкету нетипизируемой: либо ждём, либо успех с `data`, либо ошибка с `message`. Это контракт, не вкус.

**Q4: Что такое `never` простыми словами?**  
Тип пустого множества: «сюда значение не кладут». В `default` после полного `switch` оставшийся `state` должен быть `never`. Если union расширили, `state` уже не `never` — красное. Функция `: never` не возвращает нормально: только `throw` или бесконечный цикл (последнее в слое не учим).

**Q5: Обязателен ли `default` с `never`?**  
Не обязателен, если `switch` покрыл все литералы: `tsc` и так может понять исчерпание. Явный `never` делает забытый вариант ошибкой в одном месте. Без `default` новый статус иногда всплывёт только у вызывающего. Для курса пиши `default` + `never`.

**Q6: Это Redux actions?**  
Та же идея метки `type` у действия. Redux и хуки — Middle. Здесь достаточно функции `labelState`. Не тащи `dispatch` в мост.

**Q7: Можно ли сузить `if (state.status === "success")` без `switch`?**  
Да. Внутри `if` доступен `state.data`. `else` — остальные варианты. `switch` удобнее, когда веток три и больше. Это всё ещё тема 8, только дискриминатор — поле объекта.

**Q8: Чем это отличается от пересечения `&` темы 6?**  
`&` требует *все* поля сразу. Union `|` — *один* из вариантов. Склеивать `Loading & Success` бессмысленно: получится противоречивый `status`. Для состояний бери `|`, не `&`.

**Q9: Нужен ли дженерик `LoadState<T>`?**  
Можно: `{ status: "success"; data: T }`. Это тема 9 плюс эта. В упражнении хватит `string`. Не вводи `T` пока все варианты не читаются без буквы.

**Q10: Что ломается, если метка опциональна `status?: "ok"`?**  
Вариант «метки нет» путает сужение: непонятно, какой объект перед тобой. Дискриминатор делают обязательным литералом. Optional оставь для полей вроде `title?` темы 5, не для двери состояния.

### Практическое задание

В `topics/topic_12/exercises.ts`: тип `LoadState` из трёх вариантов. `labelState(state)` возвращает `"ждём"`, `data` или `message`. В `default` присвой `state` к `never`.

### Решение с инсайтом

```typescript
export type LoadState =
  | { status: "loading" }
  | { status: "success"; data: string }
  | { status: "error"; message: string };

export function labelState(state: LoadState): string {
  switch (state.status) {
    case "loading":
      return "ждём";
    case "success":
      return state.data;
    case "error":
      return state.message;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
```

**Инсайт:** метка делает невалидное состояние невыразимым; `never` сторожит забытую ветку.

### Что дальше

Ответ сети — тоже граница, но данные приходят строкой JSON, не твоим `type`. Тема 13.

---

## Тема 13 — Типизация `fetch` / JSON

← Предыдущая тема: [12 — Discriminated union и `never`](#тема-12--discriminated-union-и-never)  
→ Следующая тема: [14 — `export type`, `import type`](#тема-14--модули-export-type-import-type)

---

### Теория с аналогией

**Аналогия: письмо с почты — конверт доставили, содержимое ещё не проверяли**

Как в 🔗 Junior теме 23, `fetch` даёт `Promise<Response>`, `response.json()` — ещё промис с телом. TypeScript **не читает** сеть: после `json()` в строгом мире это нужно считать **`unknown`**, не `User`. Иначе тема 1 врёт: компилятор зелёный, поля нет в runtime.

```typescript
type User = { id: number; name: string };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function parseUser(raw: unknown): User | null {
  if (!isRecord(raw)) {
    return null;
  }
  const { id, name } = raw;
  if (typeof id !== "number" || typeof name !== "string") {
    return null;
  }
  return { id, name };
}

async function loadUser(url: string): Promise<User | null> {
  const res = await fetch(url);
  if (!res.ok) {
    return null;
  }
  const raw: unknown = await res.json();
  return parseUser(raw);
}
```

`Record<string, unknown>` — «объект с какими-то ключами, значения неизвестны». Это не `any`. Дальше — `typeof` темы 8 и guard темы 10.

Не пиши `as User` на результат `json()` (тема 10). `JSON.parse` в упражнении — тот же вход `unknown`, без живой сети.

`res.json()` в некоторых настройках всё ещё `any` — сразу сузь к `unknown`. 404: как в Junior, промис успешен, проверяй `res.ok`.

### Где это в реальном коде

- `fetch` + `response.json()` в браузере и Node 18+.
- `JSON.parse` из `localStorage`.
- Ответ, который кладёшь в `LoadState` темы 12: `success` только после `parseUser`.

### Паттерны

❌ `const user: User = await res.json()`  
✅ `unknown` → `parseUser` → `User | null`  
Почему: сервер не компилируется вместе с тобой.

❌ `as User` «мы же знаем API»  
✅ Проверка полей  
Почему: опечатка в JSON — runtime.

❌ Один гигантский `if` в `loadUser`  
✅ Парсер отдельно от `fetch`  
Почему: парсер тестируют строкой, без сети.

### Вопросы

**Q1: Почему нельзя сразу `await res.json()` как `User`?**  
Типы стираются, сервер их не видит. `json()` говорит «какое-то значение». Если аннотировать `User`, солжёшь. Честный путь: `unknown` и разбор. Это граница программы, не внутренний `const n = 1`.

**Q2: Чем `parseUser` отличается от `as User`?**  
Парсер проверяет runtime и возвращает `null` (или бросает), если форма не та. `as` только уговаривает `tsc`. Для сети нужен парсер. `as` оставь после проверки, не вместо неё.

**Q3: Зачем `Record<string, unknown>`?**  
После «это объект и не null» нужны ключи. `in` темы 8 тоже работает. `Record` удобен, чтобы читать `raw.id` как `unknown`, а не как `any`. Не путай с `User`: это ещё не анкета, а «мешок полей».

**Q4: Куда деть ошибку HTTP, если не `null`?**  
Тема 12: `{ status: "error"; message: string }` или `{ ok: false; error: string }`. `null` в упражнении проще. Главное — не смешивать «нет сети» и «есть User» в одном объекте с тремя boolean.

**Q5: `fetch` типизирован в `lib`?**  
Да, как DOM: `Promise<Response>`. Это не проверка JSON. `Response.json()` — отдельный шаг, тело неизвестно. Junior уже учил `ok` и второй `await`. TS добавляет только честность тела.

**Q6: Нужен ли дженерик `parseJson<T>`?**  
Опасен, если внутри `as T`. Дженерик не умеет сам проверить произвольный `T` без `infer` и схем. В слое пиши парсер под конкретный `User`. Универсальный разбор — не эта тема.

**Q7: `JSON.parse` в упражнении вместо живого `fetch` — это жульничество?**  
Нет. Тот же вход `unknown`. Сеть ломается CORS-ом и офлайном; парсер должен работать на строке. В теории `fetch` остаётся как в Junior. В sandbox достаточно `JSON.parse(...)`.

**Q8: Что, если поле `id` пришло строкой `"1"`?**  
`typeof id !== "number"` → `null`. Не делай `Number(id)` молча, если контракт — число. Иначе снова врать форме. Привести тип — отдельное осознанное решение, не скрытый `as`.

**Q9: Связь с `Promise<T>` темы 9?**  
`loadUser` возвращает `Promise<User | null>`. `T` здесь — результат *после* разбора, не тело HTTP. Не пиши `Promise<User>` если умеешь вернуть `null`. Коробка промиса и коробка JSON — разные слои.

**Q10: Попадёт ли это в тему 24 Middle?**  
Да, глубже и со стеком. Здесь достаточно: сеть ≠ тип в файле; `unknown`; парсер; не `any`. Zod и хуки не тащи. Мост закрывает дыру Junior «я вызвал fetch».

### Практическое задание

В `topics/topic_13/exercises.ts`: `parseUser(raw: unknown): User | null`. Для строк JSON `{"id":1,"name":"Анна"}` верни объект; для `9` и `{}` — `null`. Живой `fetch` не обязателен.

### Решение с инсайтом

```typescript
export type User = { id: number; name: string };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function parseUser(raw: unknown): User | null {
  if (!isRecord(raw)) {
    return null;
  }
  const { id, name } = raw;
  if (typeof id !== "number" || typeof name !== "string") {
    return null;
  }
  return { id, name };
}
```

**Инсайт:** JSON — `unknown`. Тип `User` появляется только после проверки полей.

### Что дальше

Имя формы нужно соседу по папке, без копии анкеты. Тема 14.

---

## Тема 14 — Модули: `export type`, `import type`

← Предыдущая тема: [13 — Типизация `fetch` / JSON](#тема-13--типизация-fetch--json)  
→ Следующая тема: слой [Middle](../../middle/README.md), если нужен React / Next / JS под капотом

---

### Теория с аналогией

**Аналогия: в описи коробки отдельно «вещи» и «чертежи»**

Как в 🔗 Junior теме 25, модуль отдаёт имена через `export` и берёт через `import`. Чертеж (`type` / `interface`) тоже имя, но в runtime его нет (тема 1). **`export type`** и **`import type`** говорят: это только чертёж, в собранном JS импорта не будет.

```typescript
// lesson.ts
export type Lesson = {
  id: number;
  title: string;
};

export function formatLesson(lesson: Lesson): string {
  return `${lesson.id}: ${lesson.title}`;
}
```

```typescript
// exercises.ts
import type { Lesson } from "./lesson.js";
import { formatLesson } from "./lesson.js";

export function describeImported(lesson: Lesson): void {
  console.log(formatLesson(lesson));
}
```

`import { type Lesson, formatLesson }` — смешанная запись: тип и значение в одной строке. Для слоя достаточно раздельных `import type` и обычного `import`.

Если написать `import { Lesson }` без `type`, а `Lesson` — только тип, `tsc` в `verbatimModuleSyntax` / некоторых `module` поругается: в JS нечего импортировать. `import type` снимает двусмысленность.

Реэкспорт: `export type { Lesson } from "./lesson.js"` — отдать чертёж дальше, как `export { add } from` в Junior, только для типа.

Не ядро: `moduleResolution`, ESM vs CJS, `paths` — Middle тема 23.

### Где это в реальном коде

- `types.ts` или `user.ts` рядом с функциями.
- Парсер темы 13 импортирует `User` из модуля модели.
- Публичный API пакета: значения и типы с одной описи.

### Паттерны

❌ Копировать `type User` в пяти файлах  
✅ Один `export type`, остальные `import type`  
Почему: правка поля — в одном месте (как тема 4).

❌ `import { User }` если `User` только тип, и сборка падает  
✅ `import type { User }`  
Почему: честно «чертежа в JS нет».

❌ Экспортировать тип через `export default` «на всякий случай»  
✅ Именованный `export type`  
Почему: как в Junior, именованный экспорт проще искать.

### Вопросы

**Q1: Чем `export type` отличается от `export function`?**  
Функция останется в JS. Тип сотрётся. Оба видны соседу *для компилятора*. Вызывающий `import type` не получит объект в runtime. Не путай с `export const User = ...` — это значение.

**Q2: Зачем `import type`, если обычный `import` иногда работает?**  
Явно: «мне чертёж, не код». Сборщик может выкинуть строку целиком. При `isolatedModules` / `verbatimModuleSyntax` без `type` красное. Привычка моста — писать `import type` для одних типов.

**Q3: Можно ли в одном файле и `export type Lesson`, и `export function`?**  
Да. Файл — и модель, и поведение, как Junior модуль с константой и функцией. Не обязательно `types.ts`. Если функций много, вынести типы удобно.

**Q4: `interface` тоже `export type`?**  
`export interface User` достаточно. `import type { User }` работает и для `interface`, и для `type`. Склейку одноимённых `interface` (тема 6) по-прежнему не используй как приём.

**Q5: Существует ли `Lesson` после стирания, если его импортировали?**  
Нет. `import type` не создаёт переменную. `new Lesson()` нельзя: это не класс. В JS останется только `formatLesson`, если его импортировали как значение.

**Q6: Нужен ли суффикс `.js` в `from "./lesson.js"` при исходнике `.ts`?**  
В ESM-схеме часто да: браузер и Node грузят `.js`, который напишет `tsc`. В sandbox курса смотри рабочий импорт упражнения. Это не смена языка, а соглашение модулей Junior темы 25 плюс компиляция темы 2.

**Q7: Чем это отличается от темы 6 (`type` vs `interface`)?**  
Тема 6 — какой синтаксис формы. Тема 14 — как форму **передать через границу файла**. Можно знать `type` и всё держать в одном `exercises.ts`. Модуль нужен, когда файлов два, как в Junior.

**Q8: `export type { Lesson }` без `from`?**  
Реэкспорт уже объявленного в этом файле имени или `export type { Lesson } from "./lesson.js"`. Не путай с `export { formatLesson }`. Для значений — без слова `type`.

**Q9: Можно ли импортировать тип из `.js` Junior-файла?**  
У чистого JS нет аннотаций. Нужны `.d.ts` или переписать в `.ts`. Это уже край моста, не ядро темы. Не обещай, что `import type` оживит нетипизированный скрипт.

**Q10: Что после темы 14?**  
Слой TypeScript закончен: Junior JS + типы на границах. Дальше [`middle/README.md`](../../middle/README.md): Event Loop, `this`, React, Next, интервью. Тема 24 Middle глубже и со стеком — не повтор тем 1–14.

### Практическое задание

В `topics/topic_14/lesson.ts` экспортируй `type Lesson` и `formatLesson`. В `exercises.ts` — `import type { Lesson }` и вызов `describeImported` с логом через `formatLesson`.

### Решение с инсайтом

```typescript
// lesson.ts
export type Lesson = { id: number; title: string };

export function formatLesson(lesson: Lesson): string {
  return `${lesson.id}: ${lesson.title}`;
}

// exercises.ts
import type { Lesson } from "./lesson.js";
import { formatLesson } from "./lesson.js";

export function describeImported(lesson: Lesson): void {
  console.log(formatLesson(lesson));
}
```

**Инсайт:** чертёж едет через `import type` и исчезает в JS; функция едет обычным `import`.

### Что дальше

Мост закрыт. Если пишешь на React/Next и готовишься к интервью — [`../../middle/README.md`](../../middle/README.md).
