/**
 * Пишет exercises.js / solutions.js (и math.js для темы 25).
 * node browser/gen-exercises.mjs
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function header(n, title) {
  return `/**
 * Тема ${n} — ${title}
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */
`;
}

function nodeMain(call) {
  return `
if (typeof document === "undefined") {
  ${call}
}
`;
}

const files = {};

function put(n, name, content) {
  files[`topics/topic_${n}/${name}`] = content;
}

// ── 1
put(1, "exercises.js", header(1, "Как запускается JavaScript") + `
export function hello() {
  // TODO: console.log("Раздел 1, тема 1");
}
` + nodeMain("hello();"));

put(1, "solutions.js", header(1, "Как запускается JavaScript") + `
export function hello() {
  console.log("Раздел 1, тема 1");
}

// Инсайт: язык один, запуск разный — браузер или node.
`);

// ── 2
put(2, "exercises.js", header(2, "let и const") + `
export function printCourse() {
  // TODO: const courseName = "JavaScript Junior";
  // TODO: let lesson = 1; выведи оба; lesson = 2; выведи снова
}
` + nodeMain("printCourse();"));

put(2, "solutions.js", header(2, "let и const") + `
export function printCourse() {
  const courseName = "JavaScript Junior";
  let lesson = 1;
  console.log(courseName);
  console.log(lesson);
  lesson = 2;
  console.log(lesson);
}

// Инсайт: const — не переназначай имя. let — когда значение меняется.
`);

// ── 3
put(3, "exercises.js", header(3, "Выражения") + `
export function printTotal() {
  // TODO: price, count, total = price * count, console.log(total)
}
` + nodeMain("printTotal();"));

put(3, "solutions.js", header(3, "Выражения") + `
export function printTotal() {
  const price = 150;
  const count = 3;
  // сумма к оплате
  const total = price * count;
  console.log(total);
}

// Инсайт: справа от = — выражение (есть результат).
`);

// ── 4
put(4, "exercises.js", header(4, "typeof") + `
export function printTypes() {
  // TODO: строка, число, boolean, let без значения, typeof null
}
` + nodeMain("printTypes();"));

put(4, "solutions.js", header(4, "typeof") + `
export function printTypes() {
  const title = "Курс";
  const year = 2026;
  const ready = true;
  let extra;
  console.log(typeof title, title);
  console.log(typeof year, year);
  console.log(typeof ready, ready);
  console.log(typeof extra);
  console.log(typeof null); // "object" — ошибка языка
}

// Инсайт: тип — у значения, не у имени переменной.
`);

// ── 5
put(5, "exercises.js", header(5, "Строки и числа") + `
export function priceTag() {
  // TODO: priceRaw = "150", count = 2, Number, total, шаблон
}
` + nodeMain("priceTag();"));

put(5, "solutions.js", header(5, "Строки и числа") + `
export function priceTag() {
  const priceRaw = "150";
  const count = 2;
  const price = Number(priceRaw);
  const total = price * count;
  const label = \`\${count} шт. на \${total} ₽\`;
  console.log(typeof priceRaw, typeof price);
  console.log(total);
  console.log(label);
}

// Инсайт: считать числами, человеку показывать строку.
`);

// ── 6
put(6, "exercises.js", header(6, "===") + `
export function strictEq() {
  // TODO: n = 18, asText = "18", четыре сравнения из темы
}
` + nodeMain("strictEq();"));

put(6, "solutions.js", header(6, "===") + `
export function strictEq() {
  const n = 18;
  const asText = "18";
  console.log(n === 18);
  console.log(asText === "18");
  console.log(asText === n);
  console.log(Number(asText) === n);
  console.log(asText !== n);
}

// Инсайт: === не переводит типы за тебя.
`);

// ── 7
put(7, "exercises.js", header(7, "null / undefined") + `
export function emptyValues() {
  // TODO: let title; затем null; "" и 0 — сравнения
}
` + nodeMain("emptyValues();"));

put(7, "solutions.js", header(7, "null / undefined") + `
export function emptyValues() {
  let title;
  console.log(title);
  console.log(title === undefined);
  title = null;
  console.log(title === null);
  console.log(typeof title);
  const emptyText = "";
  const zero = 0;
  console.log(emptyText === null);
  console.log(zero === undefined);
}

// Инсайт: "" и 0 — значения. undefined — не клали. null — положили пусто.
`);

// ── 8
put(8, "exercises.js", header(8, "if / switch") + `
export function access() {
  // TODO: age = 20, hasTicket = true — три ветки
}

export function statusSwitch() {
  // TODO: switch status "ok" | "error" | default, везде break
}
` + nodeMain("access(); statusSwitch();"));

put(8, "solutions.js", header(8, "if / switch") + `
export function access() {
  const age = 20;
  const hasTicket = true;
  if (age < 18) {
    console.log("рано");
  } else if (hasTicket === false) {
    console.log("нет билета");
  } else {
    console.log("вход");
  }
}

export function statusSwitch() {
  const status = "ok";
  switch (status) {
    case "ok":
      console.log("успех");
      break;
    case "error":
      console.log("сбой");
      break;
    default:
      console.log("неизвестно");
  }
}
`);

// ── 9
put(9, "exercises.js", header(9, "Циклы") + `
export function runLoops() {
  // TODO: for 1..5, while 1..5, for...of "JS", нечётные с continue/break до 7
}
` + nodeMain("runLoops();"));

put(9, "solutions.js", header(9, "Циклы") + `
export function runLoops() {
  for (let i = 1; i <= 5; i = i + 1) {
    console.log(i);
  }
  let n = 1;
  while (n <= 5) {
    console.log(n);
    n = n + 1;
  }
  for (const letter of "JS") {
    console.log(letter);
  }
  for (let i = 1; i <= 10; i = i + 1) {
    if (i % 2 === 0) {
      continue;
    }
    console.log(i);
    if (i === 7) {
      break;
    }
  }
}
`);

// ── 10
put(10, "exercises.js", header(10, "try/catch") + `
export function safeParse() {
  const raw = "{ не json }";
  // TODO: try JSON.parse, catch, затем console.log("готово")
}
` + nodeMain("safeParse();"));

put(10, "solutions.js", header(10, "try/catch") + `
export function safeParse() {
  const raw = "{ не json }";
  try {
    const data = JSON.parse(raw);
    console.log(data);
  } catch (error) {
    console.log("не JSON");
    console.log(error.message);
  }
  console.log("готово");
}

// Инсайт: пустой catch хуже падения.
`);

// ── 11
put(11, "exercises.js", header(11, "Функции") + `
export function add(a, b) {
  // TODO
}

export function describe(age) {
  // TODO: "рано" если age < 18 иначе "можно"
}

export function shout(text) {
  // TODO: только console.log, без return
}

export function runFunctions() {
  console.log(add(2, 3));
  console.log(describe(20));
  const out = shout("эй");
  console.log(out);
}
` + nodeMain("runFunctions();"));

put(11, "solutions.js", header(11, "Функции") + `
export function add(a, b) {
  return a + b;
}

export function describe(age) {
  if (age < 18) {
    return "рано";
  }
  return "можно";
}

export function shout(text) {
  console.log(text);
}

export function runFunctions() {
  console.log(add(2, 3));
  console.log(describe(20));
  const out = shout("эй");
  console.log(out);
}

// Инсайт: return отдаёт значение; log — не возврат.
`);

// ── 12
put(12, "exercises.js", header(12, "Стрелки") + `
export function runArrows() {
  // TODO: const add, double, describe — как в теме 12, выведи три результата
}
` + nodeMain("runArrows();"));

put(12, "solutions.js", header(12, "Стрелки") + `
export function runArrows() {
  const add = (a, b) => {
    return a + b;
  };
  const double = (n) => n * 2;
  const describe = (age) => {
    if (age < 18) {
      return "рано";
    }
    return "можно";
  };
  console.log(add(2, 3));
  console.log(double(4));
  console.log(describe(15));
}
`);

// ── 13
put(13, "exercises.js", header(13, "Область видимости") + `
export function runScope() {
  // TODO: greetPrefix снаружи, greet(name), area(width, height) с unit внутри
}
` + nodeMain("runScope();"));

put(13, "solutions.js", header(13, "Область видимости") + `
export function runScope() {
  const greetPrefix = "Здравствуй";
  function greet(name) {
    console.log(\`\${greetPrefix}, \${name}\`);
  }
  function area(width, height) {
    const unit = "м²";
    return \`\${width * height} \${unit}\`;
  }
  greet("Анна");
  console.log(area(3, 4));
}

// Инсайт: внутри видно коридор. Коридор не видит unit.
`);

// ── 14
put(14, "exercises.js", header(14, "Объекты") + `
export function runUserCard() {
  // TODO: объект user с intro()
}
` + nodeMain("runUserCard();"));

put(14, "solutions.js", header(14, "Объекты") + `
export function runUserCard() {
  const user = {
    name: "Анна",
    age: 20,
    city: "Казань",
    intro() {
      console.log(\`\${this.name} из \${this.city}\`);
    },
  };
  console.log(user.name);
  console.log(user["city"]);
  user.age = 21;
  user.intro();
}
`);

// ── 15
put(15, "exercises.js", header(15, "Массивы") + `
export function runPrices() {
  // TODO: prices, push, map ×2, filter < 200, find < 100
}
` + nodeMain("runPrices();"));

put(15, "solutions.js", header(15, "Массивы") + `
export function runPrices() {
  const prices = [150, 200, 90, 40];
  console.log(prices[0], prices.length);
  prices.push(300);
  console.log(prices.length);
  const doubled = prices.map((price) => price * 2);
  const cheap = prices.filter((price) => price < 200);
  const firstLow = prices.find((price) => price < 100);
  console.log(doubled);
  console.log(cheap);
  console.log(firstLow);
}
`);

// ── 16
put(16, "exercises.js", header(16, "Ссылка") + `
export function copyDemo() {
  // TODO: alias vs { ...user }, same vs [...prices]
}
` + nodeMain("copyDemo();"));

put(16, "solutions.js", header(16, "Ссылка") + `
export function copyDemo() {
  const user = { name: "Анна" };
  const alias = user;
  alias.name = "Павел";
  console.log(user.name);
  const independent = { ...user };
  independent.name = "Оля";
  console.log(user.name);
  console.log(independent.name);
  const prices = [1, 2];
  const same = prices;
  same.push(3);
  console.log(prices);
  const other = [...prices];
  other.push(99);
  console.log(prices);
  console.log(other);
}
`);

// ── 17
put(17, "exercises.js", header(17, "DOM") + `
export function fillDom() {
  // TODO: #title и #out, null-check, textContent, classList.add("ready")
  if (typeof document === "undefined") {
    console.log("Открой browser/index.html");
    return;
  }
}
` + nodeMain("fillDom();"));

put(17, "solutions.js", header(17, "DOM") + `
export function fillDom() {
  if (typeof document === "undefined") {
    console.log("Открой browser/index.html");
    return;
  }
  const title = document.querySelector("#title");
  const out = document.querySelector("#out");
  if (title === null || out === null) {
    console.log("нет узла");
    return;
  }
  console.log(title.textContent);
  out.textContent = "узел найден";
  out.classList.add("ready");
}
`);

// ── 18
put(18, "exercises.js", header(18, "События") + `
export function setupCounter() {
  if (typeof document === "undefined") {
    console.log("Открой browser/index.html");
    return;
  }
  // TODO: #go #out, let clicks, click listener
}
` + nodeMain("setupCounter();"));

put(18, "solutions.js", header(18, "События") + `
export function setupCounter() {
  if (typeof document === "undefined") {
    console.log("Открой browser/index.html");
    return;
  }
  const go = document.querySelector("#go");
  const out = document.querySelector("#out");
  if (go === null || out === null) {
    console.log("нет узла");
    return;
  }
  if (go.dataset.bound === "1") {
    console.log("Уже включён");
    return;
  }
  let clicks = 0;
  function onGoClick(event) {
    console.log(event.type);
    clicks = clicks + 1;
    out.textContent = String(clicks);
  }
  go.addEventListener("click", onGoClick);
  go.dataset.bound = "1";
  console.log("Счётчик включён — нажми «Жми»");
}
`);

// ── 19
put(19, "exercises.js", header(19, "Формы") + `
export function setupForm() {
  if (typeof document === "undefined") {
    console.log("Открой browser/index.html");
    return;
  }
  // TODO: submit, preventDefault, value
}
` + nodeMain("setupForm();"));

put(19, "solutions.js", header(19, "Формы") + `
export function setupForm() {
  if (typeof document === "undefined") {
    console.log("Открой browser/index.html");
    return;
  }
  const form = document.querySelector("#topic-form");
  const titleInput = document.querySelector("#title");
  const out = document.querySelector("#out");
  if (form === null || titleInput === null || out === null) {
    console.log("нет узла");
    return;
  }
  if (form.dataset.bound === "1") {
    console.log("Уже включена");
    return;
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const raw = titleInput.value;
    if (raw === "") {
      out.textContent = "пусто";
      return;
    }
    out.textContent = "Тема: " + raw;
  });
  form.dataset.bound = "1";
  console.log("Форма готова");
}
`);

// ── 20
put(20, "exercises.js", header(20, "setTimeout") + `
export function timeoutOrder() {
  // TODO: старт, setTimeout 500 «потом», сразу
}
` + nodeMain("timeoutOrder();"));

put(20, "solutions.js", header(20, "setTimeout") + `
export function timeoutOrder() {
  console.log("старт");
  setTimeout(() => {
    console.log("потом");
  }, 500);
  console.log("сразу");
}
`);

// ── 21
put(21, "exercises.js", header(21, "Promise") + `
export function wait(ms) {
  // TODO: верни Promise + setTimeout + resolve(ms)
}

export function runPromises() {
  wait(200).then((ms) => {
    console.log("ждали " + ms);
  });
  Promise.reject(new Error("учебный сбой")).catch((error) => {
    console.log(error.message);
  });
  console.log("сразу");
}
` + nodeMain("runPromises();"));

put(21, "solutions.js", header(21, "Promise") + `
export function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ms), ms);
  });
}

export function runPromises() {
  wait(200).then((ms) => {
    console.log("ждали " + ms);
  });
  Promise.reject(new Error("учебный сбой")).catch((error) => {
    console.log(error.message);
  });
  console.log("сразу");
}
`);

// ── 22
put(22, "exercises.js", header(22, "async/await") + `
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ms), ms);
  });
}

export async function runAsync() {
  async function run() {
    // TODO: «до», await wait(200), «после»
  }
  run();
  console.log("снаружи");
}
` + nodeMain("runAsync();"));

put(22, "solutions.js", header(22, "async/await") + `
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ms), ms);
  });
}

export async function runAsync() {
  async function run() {
    console.log("до");
    await wait(200);
    console.log("после");
  }
  run();
  console.log("снаружи");
}
`);

// ── 23
put(23, "exercises.js", header(23, "fetch") + `
export async function loadTodo() {
  // TODO: fetch jsonplaceholder todos/1, ok, json, title
}
` + nodeMain("loadTodo();"));

put(23, "solutions.js", header(23, "fetch") + `
export async function loadTodo() {
  const out = typeof document !== "undefined" ? document.querySelector("#out") : null;
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");
    if (response.ok === false) {
      throw new Error("HTTP " + response.status);
    }
    const data = await response.json();
    if (out !== null) {
      out.textContent = data.title;
    }
    console.log(data.title);
  } catch (error) {
    const message = error.message;
    if (out !== null) {
      out.textContent = message;
    }
    console.log(message);
  }
}
`);

// ── 24
put(24, "exercises.js", header(24, "Event Loop") + `
export function loopOrder() {
  // TODO: 1, timeout 0 → 2, Promise.then → 3, 4 и 5 синхронно
  // Ожидаемый порядок в комментарии: 1 4 5 3 2
}
` + nodeMain("loopOrder();"));

put(24, "solutions.js", header(24, "Event Loop") + `
export function loopOrder() {
  console.log("1");
  setTimeout(() => console.log("2"), 0);
  Promise.resolve().then(() => console.log("3"));
  console.log("4");
  console.log("5");
}

// Вывод: 1 4 5 3 2
`);

// ── 25
put(25, "math.js", `export function double(n) {
  return n * 2;
}
`);

put(25, "exercises.js", header(25, "Модули") + `
import { double } from "./math.js";

export function runDouble() {
  console.log(double(4));
}
` + nodeMain("runDouble();"));

put(25, "solutions.js", header(25, "Модули") + `
import { double } from "./math.js";

export function runDouble() {
  console.log(double(4));
}

// Инсайт: export в math.js, import по пути ./math.js
`);

// ── 26
put(26, "exercises.js", header(26, "Аккуратный код") + `
export function parseAge(raw) {
  // TODO: "" или NaN → null, иначе число. Только ===
}

export function accessLabel(age) {
  // TODO: >= 18 «можно», иначе «рано»
}

export function describeAge(raw) {
  // TODO: parseAge + accessLabel
}

export function runDescribeAge() {
  console.log(describeAge("20"));
  console.log(describeAge(""));
  console.log(describeAge("привет"));
}
` + nodeMain("runDescribeAge();"));

put(26, "solutions.js", header(26, "Аккуратный код") + `
export function parseAge(raw) {
  if (raw === "") {
    return null;
  }
  const age = Number(raw);
  if (Number.isNaN(age)) {
    return null;
  }
  return age;
}

export function accessLabel(age) {
  if (age >= 18) {
    return "можно";
  }
  return "рано";
}

export function describeAge(raw) {
  const age = parseAge(raw);
  if (age === null) {
    return "нет";
  }
  return accessLabel(age);
}

export function runDescribeAge() {
  console.log(describeAge("20"));
  console.log(describeAge(""));
  console.log(describeAge("привет"));
}
`);

for (const [rel, content] of Object.entries(files)) {
  await writeFile(join(root, rel), content, "utf8");
}
console.log("JS файлов: " + Object.keys(files).length);
