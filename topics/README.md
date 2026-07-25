# Оглавление — Материалы курса (`topics/`)

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Всего тем:** 45 | **Разделов:** 14

Навигация по всем темам курса. Разделы 1–8 — базовый JavaScript (несколько тем в одном файле). Разделы 9–14 — React и библиотеки управления состоянием (каждая тема в отдельном файле).

---

## Формат каждой темы

Каждая тема раскрыта по единому шаблону из шести блоков:

1. **Теория с аналогиями** — механизм простым языком, аналогия из жизни, ASCII-схемы, код с комментариями
2. **Связь со стеком** — как концепция проявляется в React / Next.js / TypeScript
3. **Лучшие паттерны** — минимум 3 паттерна в формате ❌ антипаттерн → ✅ правильно → почему
4. **Вопросы интервью** — минимум 9 вопросов с развёрнутыми ответами, готовыми к произнесению вслух
5. **Практическое задание** — конкретная задача для написания кода
6. **Решение с инсайтом** — рабочий код + ключевой вывод

Между темами — навигация `← Предыдущая тема` / `→ Следующая тема`, инлайн `🔗 Связь с темой X` внутри объяснений. Подробный стандарт — [`general/01_topic_requirements.md`](../general/01_topic_requirements.md).

---

## Разделы

| № | Раздел | Темы | Файл(ы) |
|---|--------|------|---------|
| 1 | Движок и среда выполнения | 1–3 | [`section_1_engine.md`](section_1_engine.md) |
| 2 | Типы и данные | 4–6 | [`section_2_types.md`](section_2_types.md) |
| 3 | Функции | 7–11 | [`section_3_functions.md`](section_3_functions.md) |
| 4 | ООП и прототипы | 12–14 | [`section_4_oop.md`](section_4_oop.md) |
| 5 | Асинхронность | 15–18 | [`section_5_async.md`](section_5_async.md) |
| 6 | Современный синтаксис | 19–22 | [`section_6_syntax.md`](section_6_syntax.md) |
| 7 | Модули и TypeScript | 23–24 | [`section_7_modules.md`](section_7_modules.md) |
| 8 | Паттерны и архитектура | 25–28 | [`section_8_patterns.md`](section_8_patterns.md) |
| 9 | Компоненты и рендеринг | 29–30 | по одной теме на файл (см. ниже) |
| 10 | Хуки состояния и эффектов | 31–34 | по одной теме на файл (см. ниже) |
| 11 | Производительность, ссылки, контекст | 35–37 | по одной теме на файл (см. ниже) |
| 12 | Конкурентные и специализированные хуки | 38–40 | по одной теме на файл (см. ниже) |
| 13 | Композиция и архитектура React | 41–43 | по одной теме на файл (см. ниже) |
| 14 | Библиотеки управления состоянием | 44–45 | по одной теме на файл (см. ниже) |

---

## Полная таблица тем

### Раздел 1 — Движок и среда выполнения

| № | Тема | Файл |
|---|------|------|
| 1 | Event Loop | [`section_1_engine.md`](section_1_engine.md) |
| 2 | Hoisting и TDZ | ↑ |
| 3 | Scope и замыкания | ↑ |

### Раздел 2 — Типы и данные

| № | Тема | Файл |
|---|------|------|
| 4 | Приведение типов | [`section_2_types.md`](section_2_types.md) |
| 5 | Значение vs Ссылка | ↑ |
| 6 | null / undefined / NaN | ↑ |

### Раздел 3 — Функции

| № | Тема | Файл |
|---|------|------|
| 7 | Контекст `this` | [`section_3_functions.md`](section_3_functions.md) |
| 8 | Замыкания на практике | ↑ |
| 9 | map / filter / reduce | ↑ |
| 10 | Каррирование | ↑ |
| 11 | Генераторы | ↑ |

### Раздел 4 — ООП и прототипы

| № | Тема | Файл |
|---|------|------|
| 12 | Прототипная цепочка | [`section_4_oop.md`](section_4_oop.md) |
| 13 | Классы ES6 | ↑ |
| 14 | Property Descriptors | ↑ |

### Раздел 5 — Асинхронность

| № | Тема | Файл |
|---|------|------|
| 15 | Promise | [`section_5_async.md`](section_5_async.md) |
| 16 | async / await | ↑ |
| 17 | Promise.all / race / any | ↑ |
| 18 | Callbacks | ↑ |

### Раздел 6 — Современный синтаксис

| № | Тема | Файл |
|---|------|------|
| 19 | Деструктуризация и spread | [`section_6_syntax.md`](section_6_syntax.md) |
| 20 | Array API | ↑ |
| 21 | Map, Set, WeakMap | ↑ |
| 22 | Optional Chaining / Nullish | ↑ |

### Раздел 7 — Модули и TypeScript

| № | Тема | Файл |
|---|------|------|
| 23 | ESM vs CommonJS | [`section_7_modules.md`](section_7_modules.md) |
| 24 | TypeScript: основы | ↑ |

### Раздел 8 — Паттерны и архитектура

| № | Тема | Файл |
|---|------|------|
| 25 | Обработка ошибок | [`section_8_patterns.md`](section_8_patterns.md) |
| 26 | Observer, Factory | ↑ |
| 27 | Иммутабельность | ↑ |
| 28 | SOLID / DRY / KISS | ↑ |

### Раздел 9 — Компоненты и рендеринг

| № | Тема | Файл |
|---|------|------|
| 29 | Компоненты и JSX | [`topic_29_components_and_jsx.md`](topic_29_components_and_jsx.md) |
| 30 | Virtual DOM и реконсиляция (Fiber) | [`topic_30_virtual_dom_and_fiber.md`](topic_30_virtual_dom_and_fiber.md) |

### Раздел 10 — Хуки состояния и эффектов

| № | Тема | Файл |
|---|------|------|
| 31 | useState | [`topic_31_usestate.md`](topic_31_usestate.md) |
| 32 | useReducer | [`topic_32_usereducer.md`](topic_32_usereducer.md) |
| 33 | useEffect | [`topic_33_useeffect.md`](topic_33_useeffect.md) |
| 34 | useLayoutEffect и useInsertionEffect | [`topic_34_uselayouteffect_useinsertioneffect.md`](topic_34_uselayouteffect_useinsertioneffect.md) |

### Раздел 11 — Производительность, ссылки, контекст

| № | Тема | Файл |
|---|------|------|
| 35 | useMemo, useCallback и React.memo | [`topic_35_usememo_usecallback_memo.md`](topic_35_usememo_usecallback_memo.md) |
| 36 | useRef и useImperativeHandle | [`topic_36_useref_useimperativehandle.md`](topic_36_useref_useimperativehandle.md) |
| 37 | useContext | [`topic_37_usecontext.md`](topic_37_usecontext.md) |

### Раздел 12 — Конкурентные и специализированные хуки

| № | Тема | Файл |
|---|------|------|
| 38 | useTransition и useDeferredValue | [`topic_38_usetransition_usedeferredvalue.md`](topic_38_usetransition_usedeferredvalue.md) |
| 39 | useId, useDebugValue, useSyncExternalStore | [`topic_39_useid_usedebugvalue_usesyncexternalstore.md`](topic_39_useid_usedebugvalue_usesyncexternalstore.md) |
| 40 | React 19: use(), useActionState, useOptimistic | [`topic_40_react19_hooks.md`](topic_40_react19_hooks.md) |

### Раздел 13 — Композиция и архитектура React

| № | Тема | Файл |
|---|------|------|
| 41 | Кастомные хуки и композиция логики | [`topic_41_custom_hooks.md`](topic_41_custom_hooks.md) |
| 42 | Server Components и Suspense в Next.js App Router | [`topic_42_server_components_and_suspense.md`](topic_42_server_components_and_suspense.md) |
| 43 | Правила хуков и антипаттерны (сводная тема) | [`topic_43_hooks_rules_and_antipatterns.md`](topic_43_hooks_rules_and_antipatterns.md) |

### Раздел 14 — Библиотеки управления состоянием

| № | Тема | Файл |
|---|------|------|
| 44 | Redux Toolkit | [`topic_44_redux_toolkit.md`](topic_44_redux_toolkit.md) |
| 45 | Zustand | [`topic_45_zustand.md`](topic_45_zustand.md) |

---

## Покрытие хуков React (разделы 9–13)

| Хук | Тема | Глубина раскрытия |
|-----|------|--------------------|
| Компоненты, JSX, `key` | 29 | Средняя |
| Virtual DOM, diffing, Fiber | 30 | Средняя |
| `useState` | 31 | **Максимальная** |
| `useReducer` | 32 | Средняя |
| `useEffect` | 33 | **Максимальная** |
| `useLayoutEffect`, `useInsertionEffect` | 34 | Компактная |
| `useMemo`, `useCallback`, `React.memo` | 35 | **Максимальная** |
| `useRef`, `useImperativeHandle`, `forwardRef` | 36 | **Максимальная** |
| `useContext` | 37 | **Максимальная** |
| `useTransition`, `useDeferredValue` | 38 | Компактная |
| `useId`, `useDebugValue`, `useSyncExternalStore` | 39 | Компактная |
| `use()`, `useActionState`, `useOptimistic` (React 19) | 40 | Компактная |
| Кастомные хуки (композиция) | 41 | Средняя |
| Server Components, Suspense, стриминг | 42 | Средняя |
| Правила хуков и антипаттерны (сводно) | 43 | Сводная |
| Redux Toolkit (`createSlice`, RTK Query) | 44 | Средняя |
| Zustand | 45 | Средняя |

---

## Приоритеты изучения (разделы 9–14)

| Приоритет | Темы |
|-----------|------|
| 🔴 Обязательно | 29, 30, 31, 32, 33, 35, 36, 37 |
| 🟡 Ожидается | 34, 41, 42, 43, 44, 45 |
| 🟢 Бонус | 38, 39, 40 |

Полная сводная таблица приоритетов по всем 45 темам — [`general/02_topic_list.md`](../general/02_topic_list.md).

---

← Назад к [корневому README](../README.md)
