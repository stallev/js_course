# JavaScript для Middle FullStack Interview

Структурированный курс по JavaScript с фокусом на **теорию под капотом**, **паттерны** и **подготовку к интервью** на позицию Middle FullStack Developer.

**Стек:** Next.js · React · TypeScript  
**Охват:** 45 тем · 14 разделов · ~78–110 часов самостоятельного изучения

---

## Для кого этот курс

- Разработчики, которые уже пишут на React/Next.js, но хотят **уверенно отвечать на JS-вопросы** на интервью
- Кандидаты на Middle FullStack, которым нужна **связная картина** языка, а не разрозненные статьи
- Те, кто готовится к лайв-кодингу и разбору «магического» поведения JS (`==`, Event Loop, `this`, замыкания)

---

## Чем курс отличается

| Принцип | Что это даёт |
|---------|----------------|
| **Сквозная структура** | Темы выстроены по зависимостям: Event Loop → async → Promise; Scope → замыкания → хуки React |
| **Связь со стеком** | В каждой теме — как концепция проявляется в React 18+, Next.js App Router, TypeScript |
| **Интервью-формат** | 9+ вопросов с ответами, готовыми к произнесению вслух |
| **Практика** | Задание + эталонное решение с ключевым инсайтом |
| **Паттерны** | ❌ антипаттерн → ✅ правильно → обоснование |

Подробные требования к содержанию: [`general/01_topic_requirements.md`](general/01_topic_requirements.md)  
Полное оглавление всех тем с навигацией: [`topics/README.md`](topics/README.md)

---

## Структура репозитория

```
js_course/
├── README.md                          ← вы здесь
│
├── general/
│   ├── 01_topic_requirements.md       # стандарт качества каждой темы
│   └── 02_topic_list.md               # сводная таблица тем и приоритетов
│
├── topics/
│   ├── README.md                      # оглавление всех 45 тем с навигацией
│   ├── section_1_engine.md            # темы 1–3: Event Loop, Hoisting, Scope
│   ├── section_2_types.md             # темы 4–6
│   ├── section_3_functions.md         # темы 7–11
│   ├── section_4_oop.md               # темы 12–14
│   ├── section_5_async.md             # темы 15–18
│   ├── section_6_syntax.md            # темы 19–22
│   ├── section_7_modules.md           # темы 23–24
│   ├── section_8_patterns.md          # темы 25–28
│   └── topic_29_*.md … topic_45_*.md  # React + state-менеджмент: темы 29–45, каждая тема — отдельный файл
│
└── sandbox/                           # практические упражнения
    ├── HOW_TO_PRACTICE.md             # инструкция для студентов ← читай первым
    ├── GUIDE.md                       # стандарт создания заданий (для авторов)
    ├── js_sandbox/                    # упражнения: чистый TypeScript
    │   ├── tsconfig.json              # компилятор TS → JS для браузера
    │   └── topics/topic_N/
    │       ├── exercises.ts           # задания с TODO (рабочий файл)
    │       ├── solutions.ts           # решения с объяснениями
    │       └── browser/index.html    # интерактивный раннер (Live Server)
    └── next_sandbox/                  # упражнения: React / Next.js
        └── lessons/topic_N/
            ├── exercises.ts           # задания в контексте React
            └── solutions.tsx          # решения + React-компоненты
```

---

## Программа курса

### Раздел 1 — Движок и среда выполнения
*Фундамент: без этого сложно понять async и хуки*

| № | Тема | Файл |
|---|------|------|
| 1 | Event Loop | [`section_1_engine.md`](topics/section_1_engine.md) |
| 2 | Hoisting и TDZ | ↑ |
| 3 | Scope и замыкания | ↑ |

### Раздел 2 — Типы и данные

| № | Тема | Файл |
|---|------|------|
| 4 | Приведение типов | [`section_2_types.md`](topics/section_2_types.md) |
| 5 | Значение vs Ссылка | ↑ |
| 6 | null / undefined / NaN | ↑ |

### Раздел 3 — Функции

| № | Тема | Файл |
|---|------|------|
| 7 | Контекст `this` | [`section_3_functions.md`](topics/section_3_functions.md) |
| 8 | Замыкания на практике | ↑ |
| 9 | map / filter / reduce | ↑ |
| 10 | Каррирование | ↑ |
| 11 | Генераторы | ↑ |

### Раздел 4 — ООП и прототипы

| № | Тема | Файл |
|---|------|------|
| 12 | Прототипная цепочка | [`section_4_oop.md`](topics/section_4_oop.md) |
| 13 | Классы ES6 | ↑ |
| 14 | Property Descriptors | ↑ |

### Раздел 5 — Асинхронность

| № | Тема | Файл |
|---|------|------|
| 15 | Promise | [`section_5_async.md`](topics/section_5_async.md) |
| 16 | async / await | ↑ |
| 17 | Promise.all / race / any | ↑ |
| 18 | Callbacks | ↑ |

### Раздел 6 — Современный синтаксис

| № | Тема | Файл |
|---|------|------|
| 19 | Деструктуризация и spread | [`section_6_syntax.md`](topics/section_6_syntax.md) |
| 20 | Array API | ↑ |
| 21 | Map, Set, WeakMap | ↑ |
| 22 | Optional Chaining / Nullish | ↑ |

### Раздел 7 — Модули и TypeScript

| № | Тема | Файл |
|---|------|------|
| 23 | ESM vs CommonJS | [`section_7_modules.md`](topics/section_7_modules.md) |
| 24 | TypeScript: основы | ↑ |

### Раздел 8 — Паттерны и архитектура

| № | Тема | Файл |
|---|------|------|
| 25 | Обработка ошибок | [`section_8_patterns.md`](topics/section_8_patterns.md) |
| 26 | Observer, Factory | ↑ |
| 27 | Иммутабельность | ↑ |
| 28 | SOLID / DRY / KISS | ↑ |

### Раздел 9 — Компоненты и рендеринг
*React-специфичные темы начинаются здесь: каждая тема — отдельный файл*

| № | Тема | Файл |
|---|------|------|
| 29 | Компоненты и JSX | [`topic_29_components_and_jsx.md`](topics/topic_29_components_and_jsx.md) |
| 30 | Virtual DOM и реконсиляция (Fiber) | [`topic_30_virtual_dom_and_fiber.md`](topics/topic_30_virtual_dom_and_fiber.md) |

### Раздел 10 — Хуки состояния и эффектов

| № | Тема | Файл |
|---|------|------|
| 31 | useState | [`topic_31_usestate.md`](topics/topic_31_usestate.md) |
| 32 | useReducer | [`topic_32_usereducer.md`](topics/topic_32_usereducer.md) |
| 33 | useEffect | [`topic_33_useeffect.md`](topics/topic_33_useeffect.md) |
| 34 | useLayoutEffect и useInsertionEffect | [`topic_34_uselayouteffect_useinsertioneffect.md`](topics/topic_34_uselayouteffect_useinsertioneffect.md) |

### Раздел 11 — Производительность, ссылки, контекст

| № | Тема | Файл |
|---|------|------|
| 35 | useMemo, useCallback и React.memo | [`topic_35_usememo_usecallback_memo.md`](topics/topic_35_usememo_usecallback_memo.md) |
| 36 | useRef и useImperativeHandle | [`topic_36_useref_useimperativehandle.md`](topics/topic_36_useref_useimperativehandle.md) |
| 37 | useContext | [`topic_37_usecontext.md`](topics/topic_37_usecontext.md) |

### Раздел 12 — Конкурентные и специализированные хуки

| № | Тема | Файл |
|---|------|------|
| 38 | useTransition и useDeferredValue | [`topic_38_usetransition_usedeferredvalue.md`](topics/topic_38_usetransition_usedeferredvalue.md) |
| 39 | useId, useDebugValue, useSyncExternalStore | [`topic_39_useid_usedebugvalue_usesyncexternalstore.md`](topics/topic_39_useid_usedebugvalue_usesyncexternalstore.md) |
| 40 | React 19: use(), useActionState, useOptimistic | [`topic_40_react19_hooks.md`](topics/topic_40_react19_hooks.md) |

### Раздел 13 — Композиция и архитектура React

| № | Тема | Файл |
|---|------|------|
| 41 | Кастомные хуки и композиция логики | [`topic_41_custom_hooks.md`](topics/topic_41_custom_hooks.md) |
| 42 | Server Components и Suspense в Next.js App Router | [`topic_42_server_components_and_suspense.md`](topics/topic_42_server_components_and_suspense.md) |
| 43 | Правила хуков и антипаттерны (сводная тема) | [`topic_43_hooks_rules_and_antipatterns.md`](topics/topic_43_hooks_rules_and_antipatterns.md) |

### Раздел 14 — Библиотеки управления состоянием

| № | Тема | Файл |
|---|------|------|
| 44 | Redux Toolkit | [`topic_44_redux_toolkit.md`](topics/topic_44_redux_toolkit.md) |
| 45 | Zustand | [`topic_45_zustand.md`](topics/topic_45_zustand.md) |

---

## Приоритеты изучения

| Приоритет | Темы | Когда |
|-----------|------|--------|
| 🔴 **Обязательно** | 1–9, 12–13, 15–16, 19–20, 22, 24–25, 29–33, 35–37 | Сначала — без этого часто отсекают на первом этапе |
| 🟡 **Ожидается** | 10, 17–18, 21, 23, 26–27, 34, 41–45 | После обязательных — выделяет на фоне других кандидатов |
| 🟢 **Бонус** | 11, 14, 28, 38–40 | В конце — редко спрашивают, но показывает глубину |

Полная таблица с пояснениями: [`general/02_topic_list.md`](general/02_topic_list.md)

**Рекомендуемый порядок:** разделы 1 → 2 → 3 → 5 → 6 → 4 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14  
*(асинхронность после движка; ООП можно после функций; паттерны — перед React; React-раздел — после освоения базового JS, так как активно ссылается на замыкания, Event Loop, Promise; Redux Toolkit/Zustand — после освоения хуков и Context, так как раскрываются через сравнение с ними)*

---

## Формат каждой темы

В каждом файле раздела темы идут в едином шаблоне:

1. **Теория с аналогиями** — механизм простым языком, схемы, код
2. **Связь со стеком** — React / Next.js / TypeScript
3. **Лучшие паттерны** — антипаттерн vs best practice
4. **Вопросы интервью** — минимум 9, с развёрнутыми ответами
5. **Практическое задание**
6. **Решение с инсайтом**

Между темами — навигация `← Предыдущая` / `→ Следующая` и ссылки `🔗 Связь с темой X`.

---

## Практические упражнения (sandbox)

Каждая тема курса сопровождается практическими заданиями в `sandbox/`.

### Типы заданий

| Тип | Описание |
|---|---|
| **Предсказание вывода** | Угадай порядок `console.log` до запуска |
| **Реализация утилиты** | Напиши функцию по описанию и примеру |
| **Найди и исправь баг** | Объясни причину бага, реализуй исправление |
| **Паттерн** | Реализуй production-паттерн из курса |

### Быстрый старт для sandbox

```bash
# 1. Установить зависимости (один раз)
npm install

# 2. Запустить компилятор TS→JS (в фоне, пока работаешь)
npm run ts:watch

# 3. Открыть browser/index.html через Live Server в VS Code
#    или запустить в терминале:
npx tsx sandbox/js_sandbox/topics/topic_1/exercises.ts
```

Подробная инструкция: [`sandbox/HOW_TO_PRACTICE.md`](sandbox/HOW_TO_PRACTICE.md)

---

## Как проходить курс

```
День 1 — теория
  └── Прочитать тему целиком (topics/section_*.md)
  └── Нарисовать схему механизма от руки

День 2 — практика
  └── Открыть sandbox/js_sandbox/topics/topic_N/exercises.ts
  └── Выполнить задания (браузер или терминал)
  └── Ответить на вопросы интервью вслух без подсказок

День 3 — закрепление
  └── Запустить solutions.ts, сравнить с эталоном
  └── Записать 3 инсайта в свои заметки
```

**Самопроверка:** закройте материал и произнесите ответы на 7–9 вопросов вслух. Если формулировка «плывёт» — вернитесь к теории.

---

## Быстрый старт

```bash
# Клонируй репозиторий
git clone <repo-url>
cd js_course

# Установи зависимости (TypeScript компилятор)
npm install
```

Затем:

1. Открой [`topics/section_1_engine.md`](topics/section_1_engine.md) — тема 1 (Event Loop)
2. Изучи теорию, схемы, примеры кода
3. Перейди в `sandbox/` — прочитай [`HOW_TO_PRACTICE.md`](sandbox/HOW_TO_PRACTICE.md)
4. Запусти упражнения по теме 1: `npm run ts:watch` + Live Server

---

## npm-скрипты

```bash
npm run ts:build      # Скомпилировать все TS-упражнения → JS (разово)
npm run ts:watch      # Компилятор в режиме watch (для браузерного раннера)
npm run next:dev      # Dev-сервер Next.js sandbox
npm run next:build    # Production-сборка Next.js sandbox
```

---

## Лицензия и вклад

Материалы предназначены для личного обучения и подготовки к собеседованиям.  
Предложения по улучшению — через issues / pull requests в репозитории.

---

*Версия курса: 1.1 · Middle FullStack Interview · 2024–2026*
