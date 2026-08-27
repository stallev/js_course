# Оглавление — TypeScript (`topics/`)

> **Курс:** TypeScript поверх JavaScript  
> **Стек:** TypeScript · без React  
> **Всего тем:** 14 | **Разделов:** 5

Практика: [`../sandbox/HOW_TO_PRACTICE.md`](../sandbox/HOW_TO_PRACTICE.md). Список и зависимости: [`../general/02_topic_list.md`](../general/02_topic_list.md).

Каждая тема: теория, где в коде, паттерны, **10 вопросов**, задание, решение.

**Готовность:** разделы 1–5 (темы 1–14) приведены к сетке. Sandbox: тема 6 — `topic_6_alias`; 7 — `topic_6`; 8 — `topic_7`; 9 — `topic_8`; 10 — `topic_10`; 11 — `topic_9`; 12–14 — одноимённые папки.

---

## Разделы

| № | Раздел | Темы | Файл | Статус |
|---|--------|------|------|--------|
| 1 | Слой поверх JS | 1–2 | [`section_1_setup.md`](section_1_setup.md) | Готов |
| 2 | Данные | 3–6 | [`section_2_data.md`](section_2_data.md) | Готов |
| 3 | Функции и сужение | 7–8 | [`section_3_functions.md`](section_3_functions.md) | Готов |
| 4 | Переиспользование | 9–11 | [`section_4_reuse.md`](section_4_reuse.md) | Готов |
| 5 | Контракты на границах | 12–14 | [`section_5_boundaries.md`](section_5_boundaries.md) | Готов |

---

## Полная таблица тем

| № | Тема | Опирается на | Файл |
|---|------|--------------|------|
| 1 | Зачем TypeScript | Junior 1, 4, 11 | [`section_1_setup.md`](section_1_setup.md) |
| 2 | Запуск: `tsx`, `tsc`, `tsconfig` | 1 | ↑ |
| 3 | Примитивы и вывод типов | 2 | [`section_2_data.md`](section_2_data.md) |
| 4 | Объекты, массивы, кортежи, `type` | 3 | ↑ |
| 5 | Union, optional, `null` | 4 | ↑ |
| 6 | `type` vs `interface`, пересечение `&` | 4 | ↑ |
| 7 | Типы функций | 3, 5 | [`section_3_functions.md`](section_3_functions.md) |
| 8 | Сужение (narrowing) | 5, 7 | ↑ |
| 9 | Простые дженерики и `Promise<T>` | 4, 7 | [`section_4_reuse.md`](section_4_reuse.md) |
| 10 | `any` vs `unknown`, `as`, type guard | 8 | ↑ |
| 11 | DOM-типы: `Element \| null` | 8, 10 | ↑ |
| 12 | Discriminated union и `never` | 5, 8 | [`section_5_boundaries.md`](section_5_boundaries.md) |
| 13 | Типизация `fetch` / JSON | 9–10 | ↑ |
| 14 | Модули: `export type`, `import type` | 4, 6 | ↑ |

После темы 14 — слой Middle, если нужен React / Next и JS под капотом: [`../../middle/README.md`](../../middle/README.md).
