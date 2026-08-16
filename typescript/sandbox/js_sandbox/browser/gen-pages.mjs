import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const pages = [
  {
    n: 1,
    title: "Тема 1 — Зачем TypeScript",
    fn: "runGreet",
    id: "1.1",
    name: "greet",
    desc: "Реализуй greet(name: string) и залогируй результат для «Анна».",
  },
  {
    n: 2,
    title: "Тема 2 — Запуск",
    fn: "printReady",
    id: "2.1",
    name: "printReady",
    desc: "Залогируй, что tsx запускает этот файл.",
  },
  {
    n: 3,
    title: "Тема 3 — Примитивы и вывод",
    fn: "describePrimitives",
    id: "3.1",
    name: "describePrimitives",
    desc: "Залогируй строку, число, boolean; верни длину строки.",
  },
  {
    n: 4,
    title: "Тема 4 — Объекты и type",
    fn: "runLesson",
    id: "4.1",
    name: "describeLesson",
    desc: "type Lesson и лог «id: title».",
  },
  {
    n: 5,
    title: "Тема 5 — Union и optional",
    fn: "runIds",
    id: "5.1",
    name: "formatId / labelDraft",
    desc: "Строка из id; черновик без названия.",
  },
  {
    n: 6,
    title: "Тема 6 — Типы функций",
    fn: "runFns",
    id: "6.1",
    name: "area / logStatus",
    desc: "Площадь 3×4 и лог статуса.",
  },
  {
    n: 7,
    title: "Тема 7 — Сужение",
    fn: "runLabel",
    id: "7.1",
    name: "labelValue",
    desc: "Строка в верхний регистр, число через String.",
  },
  {
    n: 8,
    title: "Тема 8 — Дженерики",
    fn: "runFirst",
    id: "8.1",
    name: "first",
    desc: "Первый элемент массива чисел и строк.",
  },
  {
    n: 9,
    title: "Тема 9 — unknown и DOM",
    fn: "runTopic9",
    id: "9.1",
    name: "asString / fillTitle",
    desc: "asString для unknown; #title → «TS».",
    demo: `<h3>Песочница DOM</h3>\n  <h1 id="title">Курс</h1>`,
  },
];

function html(p) {
  const demo = p.demo
    ? `<div class="demo">\n  ${p.demo}\n</div>\n`
    : "";
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${p.title}</title>
  <link rel="stylesheet" href="../../../browser/runner.css" />
</head>
<body>
<header class="page-header">
  <h1>${p.title}</h1>
  <p>Исходник — <code>exercises.ts</code>. Для вкладки нужен <code>npm run bridge:watch</code>.</p>
  <span class="hint">Терминал: <code>npx tsx</code> из корня репозитория.</span>
</header>
${demo}<section>
  <h2 class="section-title">Задания</h2>
  <div class="ex">
    <div class="ex-head">
      <span class="ex-id">${p.id}</span>
      <span class="ex-title">${p.name}</span>
    </div>
    <p class="ex-desc">${p.desc}</p>
    <div class="ex-actions">
      <button class="btn-run" data-fn="${p.fn}">Запустить</button>
      <button class="btn-clear" data-clear="${p.fn}">Очистить</button>
    </div>
    <pre class="output" id="out-${p.fn}"></pre>
  </div>
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

for (const p of pages) {
  const dir = join(root, "topics", `topic_${p.n}`, "browser");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html(p), "utf8");
}

console.log("pages:", pages.length);
