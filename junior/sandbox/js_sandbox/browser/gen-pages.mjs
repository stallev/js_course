/**
 * Генерирует browser/index.html для каждой темы.
 * Запуск из js_sandbox: node browser/gen-pages.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function page({ n, title, hint, extra = "", cards }) {
  const cardsHtml = cards
    .map(
      (c) => `
  <div class="ex">
    <div class="ex-head">
      <span class="ex-id">${c.id}</span>
      <span class="ex-title">${c.title}</span>
    </div>
    <p class="ex-desc">${c.desc}</p>
    <div class="ex-actions">
      <button class="btn-run" data-fn="${c.fn}">Запустить</button>
      <button class="btn-clear" data-clear="${c.fn}">Очистить</button>
    </div>
    <pre class="output" id="out-${c.fn}"></pre>
  </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Тема ${n} — ${title}</title>
  <link rel="stylesheet" href="../../../browser/runner.css" />
</head>
<body>
<header class="page-header">
  <h1>Тема ${n} — ${title}</h1>
  <p>Сначала заполни <code>exercises.js</code>. Сверяйся с <code>solutions.js</code> после попытки.</p>
  <span class="hint">${hint}</span>
</header>
${extra}
<section>
  <h2 class="section-title">Задания</h2>
  ${cardsHtml}
</section>
<script type="module">
  import { initRunner } from "../../../browser/runner.js";
  import * as ex from "../exercises.js";
  initRunner(ex);
</script>
</body>
</html>
`;
}

const topics = [
  {
    n: 1,
    title: "Как запускается JavaScript",
    hint: "Терминал: <code>node exercises.js</code> (из папки темы) или кнопка ниже.",
    cards: [
      { id: "1.1", fn: "hello", title: "Сообщение курса", desc: "Напечатай <code>Раздел 1, тема 1</code> через <code>console.log</code>." },
    ],
  },
  {
    n: 2,
    title: "Переменные: let и const",
    hint: "Терминал или кнопка. Не переназначай <code>const</code>.",
    cards: [
      { id: "2.1", fn: "printCourse", title: "Курс и урок", desc: "<code>const courseName</code>, <code>let lesson</code> с 1 на 2, два лога." },
    ],
  },
  {
    n: 3,
    title: "Выражения и инструкции",
    hint: "Сумма — выражение справа от <code>=</code>.",
    cards: [
      { id: "3.1", fn: "printTotal", title: "Цена × количество", desc: "<code>price</code>, <code>count</code>, <code>total</code> — выведи итог." },
    ],
  },
  {
    n: 4,
    title: "Примитивы и typeof",
    hint: "Не верь <code>typeof null</code>.",
    cards: [
      { id: "4.1", fn: "printTypes", title: "Ярлыки", desc: "Строка, число, булево, пустой <code>let</code>, <code>typeof null</code>." },
    ],
  },
  {
    n: 5,
    title: "Строки, числа, булевы",
    hint: "Считать числами, показывать строкой.",
    cards: [
      { id: "5.1", fn: "priceTag", title: "Ценник", desc: "<code>Number</code> из строки, произведение, шаблонная подпись." },
    ],
  },
  {
    n: 6,
    title: "Строгое сравнение",
    hint: "Только <code>===</code> / <code>!==</code>.",
    cards: [
      { id: "6.1", fn: "strictEq", title: "18 и \"18\"", desc: "Сравни число и строку, затем <code>Number(asText) === n</code>." },
    ],
  },
  {
    n: 7,
    title: "null и undefined",
    hint: "Пустая строка и ноль — не пустота.",
    cards: [
      { id: "7.1", fn: "emptyValues", title: "Четыре пустоты", desc: "<code>undefined</code>, <code>null</code>, <code>\"\"</code>, <code>0</code> и строгие сравнения." },
    ],
  },
  {
    n: 8,
    title: "if / else / switch",
    hint: "Фигурные скобки обязательны.",
    cards: [
      { id: "8.1", fn: "access", title: "Вход", desc: "Возраст и билет: рано / нет билета / вход." },
      { id: "8.2", fn: "statusSwitch", title: "switch по статусу", desc: "Ветки <code>ok</code>, <code>error</code>, <code>default</code> с <code>break</code>." },
    ],
  },
  {
    n: 9,
    title: "Циклы",
    hint: "Не забудь шаг в <code>while</code>.",
    cards: [
      { id: "9.1", fn: "runLoops", title: "for, while, for...of, break", desc: "1–5 двумя циклами, буквы <code>JS</code>, нечётные до 7." },
    ],
  },
  {
    n: 10,
    title: "try / catch",
    hint: "После catch скрипт должен жить.",
    cards: [
      { id: "10.1", fn: "safeParse", title: "JSON.parse", desc: "Разбери кривую строку, поймай ошибку, напечатай «готово»." },
    ],
  },
  {
    n: 11,
    title: "Функции",
    hint: "Печать ≠ return.",
    cards: [
      { id: "11.1", fn: "runFunctions", title: "add, describe, shout", desc: "Сумма, рано/можно, shout без return — лог <code>undefined</code>." },
    ],
  },
  {
    n: 12,
    title: "Стрелочные функции",
    hint: "Блок <code>{ }</code> требует явный return.",
    cards: [
      { id: "12.1", fn: "runArrows", title: "Три стрелки", desc: "add с блоком, double короткая, describe с if." },
    ],
  },
  {
    n: 13,
    title: "Лексическое окружение",
    hint: "Снаружи не видно внутренний const.",
    cards: [
      { id: "13.1", fn: "runScope", title: "greet и area", desc: "Префикс снаружи; <code>unit</code> только внутри area." },
    ],
  },
  {
    n: 14,
    title: "Объектные литералы",
    hint: "<code>this</code> — объект до точки.",
    cards: [
      { id: "14.1", fn: "runUserCard", title: "Карточка user", desc: "Поля, точка и скобки, метод intro." },
    ],
  },
  {
    n: 15,
    title: "Массивы",
    hint: "map / filter / find.",
    cards: [
      { id: "15.1", fn: "runPrices", title: "Цены", desc: "push, doubled, cheap, find." },
    ],
  },
  {
    n: 16,
    title: "Ссылка и копия",
    hint: "Новое имя ≠ новый склад.",
    cards: [
      { id: "16.1", fn: "copyDemo", title: "alias vs spread", desc: "Общий объект, <code>{...}</code>, массив и <code>[...]</code>." },
    ],
  },
  {
    n: 17,
    title: "DOM: поиск узлов",
    hint: "Только браузер. Скрипт уже в конце страницы.",
    extra: `<div class="demo">
  <h3>Песочница DOM</h3>
  <h1 id="title">Курс</h1>
  <p id="out"></p>
</div>`,
    cards: [
      { id: "17.1", fn: "fillDom", title: "Найти и заполнить", desc: "Проверь null, лог title, текст в #out, класс ready." },
    ],
  },
  {
    n: 18,
    title: "События",
    hint: "Сначала нажми «Включить счётчик», потом кнопку Жми.",
    extra: `<div class="demo">
  <h3>Песочница событий</h3>
  <button type="button" id="go">Жми</button>
  <p id="out">0</p>
</div>`,
    cards: [
      { id: "18.1", fn: "setupCounter", title: "Клики", desc: "addEventListener, счётчик, textContent, лог event.type." },
    ],
  },
  {
    n: 19,
    title: "Формы",
    hint: "Enter в поле тоже должен сработать.",
    extra: `<div class="demo">
  <h3>Песочница формы</h3>
  <form id="topic-form">
    <input id="title" name="title" type="text" />
    <button type="submit">Ок</button>
  </form>
  <p id="out"></p>
</div>`,
    cards: [
      { id: "19.1", fn: "setupForm", title: "submit", desc: "preventDefault, пусто → «пусто», иначе «Тема: …» через textContent." },
    ],
  },
  {
    n: 20,
    title: "Callbacks / setTimeout",
    hint: "Подожди ~0.5с после кнопки.",
    cards: [
      { id: "20.1", fn: "timeoutOrder", title: "Порядок логов", desc: "старт, setTimeout 500, сразу. Порядок: старт, сразу, потом." },
    ],
  },
  {
    n: 21,
    title: "Promise",
    hint: "«сразу» печатается до wait(200).",
    cards: [
      { id: "21.1", fn: "runPromises", title: "wait и reject", desc: "wait(200).then и Promise.reject + catch, лог «сразу»." },
    ],
  },
  {
    n: 22,
    title: "async / await",
    hint: "Порядок: до, снаружи, после.",
    cards: [
      { id: "22.1", fn: "runAsync", title: "Пауза внутри async", desc: "await wait(200) внутри run, лог снаружи сразу." },
    ],
  },
  {
    n: 23,
    title: "fetch",
    hint: "Нужен интернет. JSONPlaceholder.",
    extra: `<div class="demo">
  <h3>Результат на странице</h3>
  <p id="out"></p>
</div>`,
    cards: [
      { id: "23.1", fn: "loadTodo", title: "GET todo", desc: "fetch todos/1, проверка ok, title в #out или console." },
    ],
  },
  {
    n: 24,
    title: "Event Loop упрощённо",
    hint: "Сначала предскажи, потом жми.",
    cards: [
      { id: "24.1", fn: "loopOrder", title: "1 4 5 3 2", desc: "sync, Promise.then, setTimeout(0)." },
    ],
  },
  {
    n: 25,
    title: "import / export",
    hint: "double живёт в math.js рядом.",
    cards: [
      { id: "25.1", fn: "runDouble", title: "Импорт double", desc: "Выведи double(4). Реализация — в math.js." },
    ],
  },
  {
    n: 26,
    title: "Имена и маленькие функции",
    hint: "Без == и без x != x.",
    cards: [
      { id: "26.1", fn: "runDescribeAge", title: "parseAge + accessLabel", desc: "Прогони \"20\", \"\", \"привет\"." },
    ],
  },
];

for (const t of topics) {
  const dir = join(root, "topics", `topic_${t.n}`, "browser");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "index.html"), page(t), "utf8");
}

console.log("HTML: " + topics.length + " страниц");
