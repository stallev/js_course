# TypeScript поверх JavaScript

Мост после Junior: те же программы, что ты уже умеешь писать на `.js`, плюс **проверка типов до запуска**. Без React, Next.js и интервью-головоломок Middle.

**Стек:** TypeScript (`.ts`) · `npx tsx` · `tsc` · браузер после компиляции  
**Вход:** пройден [`../junior/README.md`](../junior/README.md) (темы 1–26).  
**Дальше:** [`../middle/README.md`](../middle/README.md), когда нужен стек React / Next и JS «под капотом».

Стратегия слоёв: [`../COURSE_ROADMAP.md`](../COURSE_ROADMAP.md).

---

## Для кого

- Кто уверенно пишет Junior-JS и хочет, чтобы редактор ловил «передал число вместо строки» до `node`.
- Кто не готов сразу к теме 24 Middle (TS вперемешку с ESM, React и интервью).

---

## Чем слой отличается

| | Junior | Этот слой | Middle |
|--|--------|-----------|--------|
| Язык | только `.js` | `.ts`, типы стираются при запуске | `.ts` + React/Next |
| Цель | написать и прочитать код | описать форму данных | интервью и стек |
| Чего нет | аннотаций | хуков, дженериков уровня `infer` | повторения азбуки JS |

Нумерация тем **своя** (1–9), не совпадает ни с Junior, ни с Middle.

Стандарт темы: [`general/01_topic_requirements.md`](general/01_topic_requirements.md)  
Список тем: [`general/02_topic_list.md`](general/02_topic_list.md)  
Оглавление: [`topics/README.md`](topics/README.md)  
Практика: [`sandbox/HOW_TO_PRACTICE.md`](sandbox/HOW_TO_PRACTICE.md)

---

## Структура

```
typescript/
├── README.md
├── general/
├── topics/                 ← теория, 4 раздела, темы 1–9
└── sandbox/js_sandbox/     ← exercises.ts, solutions.ts, раннер
```

---

## Как проходить

1. Теория по [`topics/README.md`](topics/README.md).
2. `exercises.ts` → `npx tsx` из корня репозитория или Live Server после `npm run bridge:watch`.
3. Сверяйся с `solutions.ts` после своей попытки.
