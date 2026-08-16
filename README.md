# Курсы JavaScript

Репозиторий разделён на слои. Сначала чистый JavaScript, затем TypeScript, затем подготовка к Middle-интервью на стеке React / Next.js.

| Слой | Каталог | Для кого |
|------|---------|----------|
| **Junior** | [`junior/`](junior/README.md) | Освоить JS без TypeScript и React |
| **TypeScript** | [`typescript/`](typescript/README.md) | Типы поверх уже понятого JS |
| **Middle** | [`middle/`](middle/README.md) | Интервью Middle FullStack: JS под капотом + React + Next + TS |

Стратегия, план переноса и этапы A–H: [`COURSE_ROADMAP.md`](COURSE_ROADMAP.md).

---

## С чего начать

1. **Junior** — [`junior/README.md`](junior/README.md). Теория: разделы [1](junior/topics/section_1_environment.md)–[9](junior/topics/section_9_clean_code.md). Практика: [`junior/sandbox/HOW_TO_PRACTICE.md`](junior/sandbox/HOW_TO_PRACTICE.md).
2. **TypeScript** — [`typescript/README.md`](typescript/README.md) (темы 1–9, без React).
3. **Middle** — если уже пишете на React/Next/TS и готовитесь к интервью: [`middle/README.md`](middle/README.md).

---

## Структура

```
js_course/
├── README.md              ← вы здесь
├── COURSE_ROADMAP.md
├── junior/                ← чистый JavaScript
├── middle/                ← существующий курс Interview
├── typescript/            ← мост: типы без React
```

npm-скрипты в корне: **middle** (`ts:watch`, `next:dev`) и слой TypeScript (`bridge:watch`).
