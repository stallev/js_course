# Курсы JavaScript

Репозиторий разделён на слои. **Порядок:** чистый JavaScript → TypeScript без React → Middle-интервью на стеке React / Next.js.

| Слой | Каталог | Для кого |
|------|---------|----------|
| **Junior** | [`junior/`](junior/README.md) | Освоить JS без TypeScript и React |
| **TypeScript** | [`typescript/`](typescript/README.md) | Типы поверх уже понятого JS |
| **Middle** | [`middle/`](middle/README.md) | Уже пишешь React/Next/TS, готовишься к интервью |

**Middle не дублирует азбуку.** Темы 1–28 там — движок, `this`, паттерны и стек, не «что такое переменная». Азбука JS — Junior; азбука TS — слой TypeScript (тема 24 Middle — углубление и стек).

Стратегия и этапы A–H: [`COURSE_ROADMAP.md`](COURSE_ROADMAP.md).

---

## С чего начать

1. **Junior** — если учишь язык с нуля: [`junior/README.md`](junior/README.md). Теория: разделы [1](junior/topics/section_1_environment.md)–[9](junior/topics/section_9_clean_code.md). Практика: [`junior/sandbox/HOW_TO_PRACTICE.md`](junior/sandbox/HOW_TO_PRACTICE.md).
2. **TypeScript** — после Junior, без React: [`typescript/README.md`](typescript/README.md) (темы 1–14).
3. **Middle** — только если уже пишешь на React/Next/TS и готовишься к интервью: [`middle/README.md`](middle/README.md).

Пропускать Junior и мост можно, если вход Middle для тебя честный: компоненты, TypeScript в проекте, цель — собеседование, не первый `let`.

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
