# Контент курса — Раздел 1: Движок и среда выполнения

> **Курс:** JavaScript для Middle FullStack Interview  
> **Стек:** Next.js · React · TypeScript  
> **Охват:** Раздел 1 — Темы 1–3 (Event Loop · Hoisting и TDZ · Scope и замыкания)

---

# Раздел 1 — Движок и среда выполнения

**Вход в слой Middle.** Курс не учит `let`, DOM и `fetch` с нуля. Если ещё не пишешь на React/TypeScript — сначала [`junior/`](../../junior/README.md) и мост [`typescript/`](../../typescript/README.md). Тема 1 сразу про Event Loop и интервью; тексты тем 1–28 не «опускаются» под junior.

---

## Тема 1 — Event Loop

---

### Теория

**Аналогия: ресторан с одним официантом**

Представь ресторан, где работает ровно один официант. Он может делать только одно дело одновременно: принять заказ, отнести блюдо, принести счёт. Сам он еду не готовит — он передаёт заказ на кухню (браузерные Web API: таймеры, сеть, DOM-события) и идёт обслуживать следующих гостей. Когда кухня приготовила блюдо — она ставит его на раздачу (очередь задач). Официант, завершив текущее дело, подходит к раздаче и несёт блюдо гостю.

Этот официант — главный поток JavaScript. Раздача — Event Loop.

**Как устроен Event Loop**

```
┌──────────────────────────────────────────────┐
│               Call Stack                     │  ← Официант работает здесь
│   (одна задача за раз, LIFO)                 │
└────────────────────┬─────────────────────────┘
                     │ стек пуст?
                     ▼
┌──────────────────────────────────────────────┐
│            Microtask Queue                   │  ← VIP-очередь
│   Promise.then / queueMicrotask /            │     Опустошается ПОЛНОСТЬЮ
│   MutationObserver                           │     перед следующей macrotask
└────────────────────┬─────────────────────────┘
                     │ microtasks пусты?
                     ▼
┌──────────────────────────────────────────────┐
│            Macrotask Queue                   │  ← Обычная очередь
│   setTimeout / setInterval / I/O /           │     Берётся ОДНА задача
│   requestAnimationFrame                      │     за итерацию
└──────────────────────────────────────────────┘
```

**Microtasks vs Macrotasks — аналогия с банком**

Представь очередь в банке. Macrotasks — обычные клиенты. Microtasks — VIP-клиенты с правом внеочередного обслуживания. Как только кассир освобождается, он сначала обслуживает всех VIP-клиентов сколько бы их ни было, и только потом берёт следующего из обычной очереди.

```
Microtask Queue (VIP):     Macrotask Queue (обычные):
  Promise.then               setTimeout / setInterval
  Promise.catch              I/O операции (файлы, сеть)
  Promise.finally            requestAnimationFrame
  queueMicrotask()           DOM события (click, keypress)
  MutationObserver
  await (продолжение)
```

**Пошаговый разбор кода**

```javascript
console.log('1');                           // → Call Stack → вывод: 1

setTimeout(() => console.log('2'), 0);     // → Web API → Macrotask Queue

Promise.resolve()
  .then(() => console.log('3'));            // → Microtask Queue

console.log('4');                           // → Call Stack → вывод: 4

// Синхронный код завершён, стек пуст.
// Event Loop:
//   Microtask Queue: Promise.then → выполняем → вывод: 3
//   Microtask Queue: пуста
//   Macrotask Queue: setTimeout → выполняем → вывод: 2

// Итоговый вывод: 1, 4, 3, 2
```

**Бюджет кадра: 16ms**

Браузер перерисовывает экран ~60 раз в секунду (каждые ~16ms). Рендер происходит как macrotask. Если macrotask или синхронный код выполняется дольше 16ms — рендер откладывается, страница "зависает" для пользователя.

```
Каждые ~16ms:
  ┌───────────────────────────────────┐
  │ Macrotask │ Microtasks │  Render  │
  │ (твой код)│ (Promises) │   (UI)   │
  └───────────────────────────────────┘
```

---

### Связь со стеком

**React 18 и автоматический батчинг**

До React 18 обновления state внутри `setTimeout` обрабатывались по одному. React 18 использует `queueMicrotask` для батчинга: несколько `setState` объединяются в одно обновление независимо от контекста вызова.

```javascript
// React 18: оба setState → один ре-рендер
setTimeout(() => {
  setCount(c => c + 1);
  setName('Alice');
}, 0);
```

**Next.js Server Components**

Server Components выполняются в Node.js на сервере. `await` в Server Component — это обычный await промиса в Node.js Event Loop. Проблемы "главный поток заблокирован" нет — тяжёлая работа уходит на сервер, браузер не страдает.

```typescript
// app/page.tsx — Server Component
export default async function Page() {
  const data = await fetchFromDB(); // await на сервере, не в браузере
  return <div>{data.title}</div>;
}
```

---

### Лучшие паттерны

**✅ Паттерн 1: Разбивка тяжёлых вычислений на чанки**

```javascript
// ❌ Плохо: блокирует UI полностью
function processHeavy(arr) {
  return arr.map(item => heavyComputation(item));
}

// ✅ Хорошо: отдаём управление браузеру между чанками
async function processInChunks(arr, chunkSize = 100) {
  const results = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    results.push(...chunk.map(heavyComputation));
    // setTimeout(fn, 0) → Macrotask Queue
    // Браузер успевает перерисовать страницу между чанками
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  return results;
}
```

*Почему best practice:* `setTimeout(fn, 0)` даёт браузеру возможность выполнить рендер между чанками. Без этого страница зависает на всё время обработки — пользователь думает что сайт завис.

**✅ Паттерн 2: queueMicrotask для гарантированно-асинхронного кода**

```javascript
// ❌ Проблема "Zalgo": функция ведёт себя непредсказуемо
function getData(id, callback) {
  if (cache.has(id)) {
    callback(cache.get(id)); // СИНХРОННО — неожиданно!
  } else {
    fetch('/api').then(r => r.json()).then(callback); // асинхронно
  }
}

// ✅ Хорошо: всегда асинхронно через microtask
function getData(id, callback) {
  if (cache.has(id)) {
    queueMicrotask(() => callback(cache.get(id))); // всегда async ✓
  } else {
    fetch('/api').then(r => r.json()).then(callback);
  }
}
```

*Почему:* "Zalgo" — антипаттерн: функция иногда синхронна, иногда нет. `queueMicrotask` гарантирует асинхронность без overhead macrotask.

**✅ Паттерн 3: Promise.all вместо последовательных await**

```javascript
// ❌ Плохо: последовательно — сумма всех задержек
async function loadDashboard(userId) {
  const user  = await fetchUser(userId);  // 300ms
  const posts = await fetchPosts(userId); // 400ms
  const stats = await fetchStats(userId); // 200ms
  return { user, posts, stats };          // ~900ms
}

// ✅ Хорошо: параллельно — максимум из задержек
async function loadDashboard(userId) {
  const [user, posts, stats] = await Promise.all([
    fetchUser(userId),   // ┐
    fetchPosts(userId),  // │ одновременно → ~400ms
    fetchStats(userId),  // ┘
  ]);
  return { user, posts, stats };
}
```

*Почему:* Три независимых запроса не зависят друг от друга. `Promise.all` экономит 500ms на каждой загрузке дашборда.

---

### Вопросы для интервью

**Q1: Что такое Event Loop и зачем он нужен?**

Event Loop — механизм, позволяющий однопоточному JavaScript выполнять асинхронные операции без блокировки. Он постоянно проверяет: пуст ли Call Stack? Если да — берёт задачу из очереди. Сначала полностью опустошает microtask queue, затем берёт одну macrotask.

**Q2: В чём разница между microtask и macrotask? Приведи примеры.**

Microtasks: `Promise.then/catch/finally`, `queueMicrotask()`, `MutationObserver`. Выполняются сразу после синхронного кода, до любой macrotask, опустошаются полностью за одну итерацию. Macrotasks: `setTimeout`, `setInterval`, I/O, `requestAnimationFrame`. Берутся по одной за итерацию; между ними браузер может перерисовать страницу.

**Q3: Что выведет код и почему?**

```javascript
setTimeout(() => console.log('A'), 0);
Promise.resolve().then(() => console.log('B'));
console.log('C');
```

Вывод: `C`, `B`, `A`. C — синхронно (Call Stack). B — microtask, выполняется до macrotask. A — macrotask, последний.

**Q4: Что произойдёт при бесконечной microtask-цепочке?**

```javascript
function loop() { return Promise.resolve().then(loop); }
loop();
```

Страница зависнет. Microtask queue никогда не опустеет — Event Loop не сможет взять macrotask (рендеринг браузера). Браузер не отрисует ни одного нового кадра.

**Q5: Как Event Loop связан с рендерингом браузера?**

Рендер происходит как macrotask (~60fps, каждые 16ms). Если синхронный код или macrotask выполняется дольше 16ms — рендер откладывается, страница "зависает". Поэтому тяжёлые операции нужно дробить или выносить в Web Worker.

**Q6: Почему `await` не блокирует главный поток?**

`await expression` приостанавливает только текущую async-функцию и помещает продолжение в microtask queue. Остальной код на Call Stack продолжает выполняться. Это фундаментальное отличие от синхронного блокирующего кода.

**Q7: Почему `async/await` внутри `forEach` не работает как ожидается?**

`forEach` не ждёт async-коллбэки — вызывает их и не ожидает возвращаемого Promise. Все итерации стартуют параллельно без ожидания. Для последовательного: `for...of` с `await`. Для параллельного: `await Promise.all(arr.map(async fn))`.

**Q8: Что такое "starvation" в контексте Event Loop?**

Если microtask queue постоянно пополняется (Promise-цепочка порождает следующую Promise) — macrotasks не получают управление. Рендер браузера перестаёт происходить. Решение: переключаться на `setTimeout` для длинных async-пайплайнов.

---

### Практическое задание

Реализуй три функции:

1. `delay(ms)` — Promise, резолвящийся через `ms` миллисекунд
2. `runSequentially(tasks)` — запускает массив async-функций строго по очереди
3. `runWithConcurrency(tasks, limit)` — параллельно, но не более `limit` одновременно

---

### Решение

```javascript
// 1. delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 2. runSequentially — for...of гарантирует порядок
async function runSequentially(tasks) {
  const results = [];
  for (const task of tasks) {
    results.push(await task()); // следующая стартует только после завершения
  }
  return results;
}

// 3. runWithConcurrency — pool воркеров
async function runWithConcurrency(tasks, limit) {
  const results = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const current = index++; // захватываем индекс (JS однопоточный — безопасно)
      results[current] = await tasks[current]();
    }
  }

  // Запускаем limit воркеров, каждый сам берёт следующую задачу
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, () => worker())
  );

  return results;
}

// Тест
const tasks = Array.from({ length: 6 }, (_, i) => async () => {
  await delay(Math.random() * 200);
  return i;
});

await runSequentially(tasks);        // [0,1,2,3,4,5] — ~сумма задержек
await runWithConcurrency(tasks, 2);  // [0,1,2,3,4,5] — быстрее
```

> **Инсайт:** Паттерн worker pool — основа библиотеки `p-limit`, которую используют в production для ограничения параллелизма API-запросов. `index++` в JS безопасен без мьютексов: воркеры переключаются только на `await`, гонки данных нет.

---

## Тема 2 — Hoisting и TDZ

---

### Теория

**Аналогия: подготовка к вечеринке**

Перед тем как гости придут (код начнёт выполняться), ты проходишь по всем комнатам и составляешь список всего что есть: "В гостиной есть стол" — ты знаешь что стол существует, но не знаешь что на нём лежит. JavaScript делает то же: перед выполнением движок сканирует код и "поднимает" объявления переменных и функций наверх текущего контекста. Это не физическое перемещение — это фаза компиляции.

**Две фазы выполнения**

```
Фаза 1: Компиляция (Hoisting)
  var a     → объявляется + инициализируется: undefined
  let b     → объявляется, НЕ инициализируется → TDZ
  const c   → объявляется, НЕ инициализируется → TDZ
  function  → объявляется + инициализируется ПОЛНОСТЬЮ

Фаза 2: Выполнение (строка за строкой)
  a = 1    → присваивание (var уже был undefined)
  b = 2    → инициализация, TDZ снята
  c = 3    → инициализация, TDZ снята
```

**TDZ — Temporal Dead Zone**

Аналогия: номер в отеле. Ты забронировал (переменная объявлена), но заселение только в 14:00 (строка инициализации). Попытка войти раньше — охрана не пустит (`ReferenceError`).

```javascript
console.log(varA);  // undefined — var hoisted с undefined ✓
console.log(letB);  // ReferenceError: Cannot access 'letB' before initialization
console.log(fn());  // 'hello' — function declaration hoisted целиком ✓

var varA = 1;
let letB = 2;
function fn() { return 'hello'; }
```

**Полная таблица**

```
Объявление           Hoisting?          До строки объявления
──────────────────────────────────────────────────────────────
var x = 1           да (undefined)      undefined
let x = 1           да (TDZ)            ReferenceError
const x = 1         да (TDZ)            ReferenceError
function f() {}     да (полностью)      вызов работает
const f = () => {}  да (TDZ для const)  ReferenceError
var f = function()  да (undefined)      TypeError: f is not a function
class MyClass {}    да (TDZ)            ReferenceError
```

**Классическая ловушка: var в цикле**

```javascript
// ❌ var не имеет блочного scope
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// Вывод: 3, 3, 3 — все замыкают ОДНУ переменную i = 3

// ✅ let создаёт новый binding на каждой итерации
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// Вывод: 0, 1, 2 ✓
```

---

### Связь со стеком

**TypeScript и const**

TypeScript компилирует в JS с `let`/`const` — TDZ сохраняется в runtime. `const` выражает намерение "значение не изменится".

```typescript
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
} as const;
// Тип: { readonly apiUrl: string }
// Попытка config.apiUrl = '...' → ошибка TypeScript
```

**Правило хуков React**

Хуки нельзя вызывать в условиях — React использует порядковый индекс для сопоставления хуков между рендерами. Изменение порядка вызовов → React перепутает состояния. Это не прямой TDZ, но та же идея: состояние зарезервировано заранее по порядку.

---

### Лучшие паттерны

**✅ Паттерн 1: `const` по умолчанию, `let` только при переприсвоении**

```javascript
// ❌ Плохо
var total = 0;
var users = [];

// ✅ Хорошо
const MAX_RETRIES = 3;      // не изменится — const
let currentRetry = 0;       // изменяется — let
const users = [];           // ссылка не изменится, push разрешён
```

*Почему:* `const` — сигнал читателю: "это не изменяется". Убирает класс багов со случайным переприсвоением. ESLint `prefer-const` автоматизирует это.

**✅ Паттерн 2: Объявление рядом с инициализацией**

```javascript
// ❌ Плохо — объявление далеко от использования (var-стиль)
function process(id) {
  var result;
  validate(id);
  const data = fetch(id);
  result = transform(data); // где объявлен result? прокручивай вверх
  return result;
}

// ✅ Хорошо
function process(id) {
  validate(id);
  const data = fetch(id);
  const result = transform(data); // объявление + инициализация вместе
  return result;
}
```

*Почему:* Уменьшает когнитивную нагрузку. Нет нужды искать где переменная объявлена.

**✅ Паттерн 3: Function declaration для публичных экспортов**

```javascript
// Hoisting позволяет: главная логика сверху, вспомогательная — снизу

export function handleSubmit(data) {
  const validated = validate(data); // вызов до объявления — работает ✓
  return save(validated);
}

function validate(data) { /* ... */ }
function save(data)     { /* ... */ }
```

*Почему:* Файл читается сверху вниз в порядке важности: сначала публичный API, потом детали реализации.

---

### Вопросы для интервью

**Q1: Что такое hoisting?**

Hoisting — поведение JavaScript, при котором объявления переменных и функций обрабатываются на фазе компиляции до выполнения кода. `var` hoists с инициализацией `undefined`, `let`/`const` — без инициализации (TDZ), function declaration — полностью.

**Q2: Что такое TDZ?**

Temporal Dead Zone — временной промежуток от начала блока до строки инициализации `let`/`const`. Переменная существует (объявлена), но недоступна. Обращение выбрасывает `ReferenceError`. Создан намеренно: делает ошибки use-before-initialization явными.

**Q3: Чем отличается hoisting `var` от `let`?**

`var` hoists с инициализацией `undefined` — обращение до строки даёт `undefined`. `let`/`const` hoists без инициализации — обращение выбрасывает `ReferenceError`. Это делает `let`/`const` безопаснее: ошибка немедленная и явная.

**Q4: Почему `var` в цикле создаёт проблемы?**

`var` не имеет блочного scope — поднимается до уровня функции. Все итерации работают с одной переменной. К моменту выполнения async-коллбэка цикл завершён, переменная равна конечному значению. `let` создаёт новый binding на каждой итерации.

**Q5: Какие функции НЕ hoisted полностью?**

Function Expression (`const fn = function() {}`) и стрелки (`const fn = () => {}`) — hoisted только как переменные. Вызов до объявления: `TypeError` (для `var`) или `ReferenceError` (для `let`/`const`). Только function declaration hoisted целиком.

**Q6: Как hoisting работает в классах?**

Классы в TDZ — как `let`/`const`. `new MyClass()` до `class MyClass {}` → `ReferenceError`. Предотвращает использование класса до полного определения.

**Q7: Что выведет код?**

```javascript
var x = 1;
function test() {
  console.log(x);
  var x = 2;
  console.log(x);
}
test();
```

`undefined`, `2`. Внутри `test()` объявление `var x` поднимается наверх функции. Первый log видит локальный `x` (hoisted, не инициализирован = `undefined`). После `x = 2` — второй log видит `2`.

**Q8: Зачем TDZ если можно было инициализировать `let` как `undefined`?**

TDZ — намеренное архитектурное решение TC39. Если бы `let` вёл себя как `var`, ошибки use-before-init были бы тихими (`undefined`). TDZ делает ошибку немедленной и явной (`ReferenceError`). Громкая ошибка при разработке лучше тихого undefined в production.

---

### Практическое задание

Найди все баги, объясни причину каждого и исправь:

```javascript
// Баг 1
function createButtons() {
  for (var i = 0; i < 5; i++) {
    setTimeout(() => console.log(i), 100);
  }
}

// Баг 2
function initApp() {
  console.log('URL:', config.apiUrl);
  var config = { apiUrl: 'https://api.example.com' };
}

// Баг 3
function processUser() {
  if (true) {
    var userId = 'abc';
    let sessionId = 'xyz';
  }
  console.log(userId);
  console.log(sessionId);
}
```

---

### Решение

```javascript
// Баг 1: var в цикле — все callback захватывают i = 5
// Вывод: 5, 5, 5, 5, 5

// Исправление: let создаёт отдельный binding на каждой итерации
function createButtons() {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => console.log(i), 100); // 0, 1, 2, 3, 4 ✓
  }
}

// Баг 2: var hoisting — config === undefined при обращении
// TypeError: Cannot read property 'apiUrl' of undefined

// Исправление: объявление до использования
function initApp() {
  const config = { apiUrl: 'https://api.example.com' };
  console.log('URL:', config.apiUrl); // ✓
}

// Баг 3:
// console.log(userId)    → 'abc' — var не имеет блочного scope, видна в функции
// console.log(sessionId) → ReferenceError — let имеет блочный scope

// Исправление: осознанное управление scope
function processUser() {
  let userId;
  let sessionId;
  if (true) {
    userId = 'abc';
    sessionId = 'xyz';
  }
  console.log(userId);    // 'abc' ✓
  console.log(sessionId); // 'xyz' ✓
}
```

> **Инсайт:** Ловушка с `var` в циклах — одна из самых частых на интервью. Если спрашивают "назови три причины не использовать `var`" — отвечай: нет блочного scope, hoisting с `undefined` (тихая ошибка), нет TDZ-защиты. `let`/`const` решают все три проблемы.

---

## Тема 3 — Scope и замыкания

---

### Теория

**Аналогия: матрёшка**

Представь русскую матрёшку. Внутренняя кукла "видит" всё что есть у неё самой и у всех внешних кукол. Но внешняя кукла не знает что внутри маленькой. Scope в JavaScript работает так же: внутренняя область видимости имеет доступ к переменным всех внешних, но не наоборот.

```javascript
const outermost = 'глобальный';

function outer() {
  const middle = 'внутри outer';

  function inner() {
    const innermost = 'только здесь';
    console.log(outermost); // ✓ видит через цепочку
    console.log(middle);    // ✓ видит родителя
    console.log(innermost); // ✓ своё
  }

  console.log(outermost); // ✓
  console.log(innermost); // ✗ ReferenceError
}
```

**Три вида scope**

```
┌──────────────────────────────────────────┐
│           Global Scope                   │  window / global
│  ┌────────────────────────────────────┐  │
│  │       Function Scope               │  │  var живёт здесь
│  │  ┌──────────────────────────────┐  │  │
│  │  │      Block Scope             │  │  │  let / const живут здесь
│  │  │   if {} / for {} / while {}  │  │  │
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

**Scope Chain — алгоритм поиска переменной**

1. Есть ли переменная в текущем scope? → возвращаем
2. Есть ли в родительском scope? → возвращаем
3. Идём выше... до глобального scope
4. Не нашли нигде → `ReferenceError`

```javascript
const x = 1;
function a() {
  const y = 2;
  function b() {
    const z = 3;
    console.log(x + y + z); // 6: x из global, y из a, z локально
  }
  b();
}
```

**Что такое замыкание**

Замыкание — функция + лексическое окружение в котором она была создана. Функция "замыкает" переменные из внешнего scope и сохраняет доступ к ним даже после завершения внешней функции.

Аналогия: ты написал письмо и вложил фотографию из отпуска. Письмо ушло — отпуск закончился. Но фотография (замкнутые данные) остаётся в письме. Функция-письмо несёт с собой данные из контекста создания.

```javascript
function makeCounter(initial = 0) {
  let count = initial; // эта переменная "захвачена"

  return {
    increment() { count++; },
    decrement() { count--; },
    value()     { return count; },
  };
}

const c1 = makeCounter(10);
c1.increment(); // count = 11
c1.increment(); // count = 12
c1.value();     // 12 — переменная жива через замыкание!

const c2 = makeCounter(0); // отдельное замыкание, отдельный count
c2.value(); // 0 — независим от c1
```

**Почему GC не удаляет переменную замыкания**

```
c1.increment / c1.decrement / c1.value
   ↓ держат ссылку на
Лексическое окружение makeCounter (count = 12)
   ↓ GC не может удалить
count пока живы increment/decrement/value
```

**Stale Closure — устаревшее замыкание**

```javascript
// ❌ Stale closure в React
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // count захвачен при первом рендере = 0
      // setCount(0 + 1) → count всегда равен 1, не растёт!
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []); // пустой массив = эффект не обновляется
}

// ✅ Решение 1: функциональный setState
useEffect(() => {
  const id = setInterval(() => {
    setCount(prev => prev + 1); // prev — всегда актуально
  }, 1000);
  return () => clearInterval(id);
}, []);

// ✅ Решение 2: добавить count в зависимости
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);
  }, 1000);
  return () => clearInterval(id);
}, [count]); // эффект обновляется при изменении count
```

---

### Связь со стеком

**Как useState хранит состояние через замыкание**

```javascript
// Упрощённая модель
function createReactSystem() {
  const stateSlots = []; // замкнутый массив, живёт вечно
  let callIndex = 0;

  function useState(initialValue) {
    const index = callIndex++;
    if (stateSlots[index] === undefined) {
      stateSlots[index] = initialValue;
    }
    const setState = (newValue) => {
      stateSlots[index] = newValue; // обновляем нужный слот
      rerender();
    };
    return [stateSlots[index], setState];
  }

  return { useState };
}
// Именно поэтому хуки нельзя в условиях: порядок = индекс!
```

**useCallback и useMemo как мемоизация замыканий**

```javascript
// useCallback мемоизирует функцию (сохраняет замыкание между рендерами)
const handleClick = useCallback(() => {
  doSomething(value); // value захвачена через замыкание
}, [value]); // пересоздаётся только при изменении value

// useMemo мемоизирует вычисленное значение
const processed = useMemo(() => {
  return expensiveProcess(data);
}, [data]);
```

---

### Лучшие паттерны

**✅ Паттерн 1: Модульный паттерн — приватные данные**

```javascript
function createUserStore() {
  // Приватное — недоступно снаружи
  let users = [];
  let nextId = 1;
  const listeners = new Set();

  function notify() {
    listeners.forEach(fn => fn([...users]));
  }

  // Публичный API
  return {
    add(name) {
      const user = { id: nextId++, name };
      users.push(user);
      notify();
      return user;
    },
    remove(id) {
      users = users.filter(u => u.id !== id);
      notify();
    },
    getAll() { return [...users]; }, // копия, не оригинал
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener); // unsubscribe
    },
  };
}

const store = createUserStore();
store.add('Alice');
// store.users — undefined. Инкапсуляция работает!
```

*Почему best practice:* Истинная инкапсуляция без классов. Нельзя случайно мутировать `users` извне. Публичный API явно определён возвращаемым объектом.

**✅ Паттерн 2: Мемоизация через замыкание**

```javascript
function memoize(fn) {
  const cache = new Map(); // замкнута — живёт пока живёт memoized

  return function memoized(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const fib = memoize(function(n) {
  return n <= 1 ? 1 : fib(n-1) + fib(n-2);
});

fib(40); // вычисляет
fib(40); // мгновенно из кэша
```

*Почему:* `useMemo` и `useCallback` — встроенная мемоизация через замыкание. Понимание ручной реализации объясняет когда и зачем их использовать.

**✅ Паттерн 3: Cleanup для предотвращения утечек памяти**

```javascript
// ❌ Плохо: замыкание держит большой объект
function setupAnalytics() {
  const HUGE_DATA = new Array(1_000_000).fill('data'); // 8MB

  window.addEventListener('click', () => {
    console.log('clicked'); // HUGE_DATA не используется, но захвачена!
    // GC не может удалить — обработчик держит ссылку на окружение
  });
  // Нет функции очистки → утечка
}

// ✅ Хорошо: захватывай только нужное + возвращай cleanup
function setupAnalytics() {
  const data = new Array(1_000_000).fill('x');
  const summary = data.length; // вычитали нужное

  const handler = () => console.log('items:', summary); // data не захвачена
  window.addEventListener('click', handler);

  return () => window.removeEventListener('click', handler); // cleanup
}

// В React:
useEffect(() => {
  const cleanup = setupAnalytics();
  return cleanup; // вызывается при размонтировании
}, []);
```

*Почему:* Невычищенные обработчики с замыканиями — самая частая причина утечек памяти в SPA. Паттерн cleanup function из `useEffect` — правильная идиома.

---

### Вопросы для интервью

**Q1: Что такое замыкание?**

Замыкание — функция, которая сохраняет доступ к переменным из лексического окружения в котором была создана, даже после завершения этого окружения. Любая функция в JS технически является замыканием. "Заметным" оно становится когда функция переживает своё окружение.

**Q2: Что такое Scope Chain?**

Механизм поиска переменных: JS ищет сначала в локальном scope, затем последовательно во всех внешних вплоть до глобального. Статическая (лексическая) цепочка — определяется местом объявления функции в коде, а не местом вызова. Если нигде не нашёл — `ReferenceError`.

**Q3: Что такое лексический scope?**

Scope определяется местом объявления функции в коде, а не местом её вызова. Это противоположность динамическому scope. Стрелочные функции захватывают `this` лексически — из окружения создания, а не вызова.

**Q4: Как замыкание связано с утечками памяти?**

Замыкание держит сильную ссылку на всё лексическое окружение. Если функция с замыканием живёт долго (обработчик без removeEventListener, setInterval без clearInterval) — GC не может удалить захваченные переменные. Решение: явная очистка и захват только необходимых данных.

**Q5: Чем замыкание отличается от обычной функции?**

Технически нет разницы — все функции в JS являются замыканиями. Но "заметное" замыкание — когда функция использует переменные внешнего scope после его завершения. Само наличие захваченных внешних переменных делает поведение "замыканием".

**Q6: Как React useState использует замыкания?**

React хранит состояние в Fiber-структуре. `useState` возвращает `[value, setter]`. `setter` через замыкание имеет доступ к индексу в Fiber и при вызове обновляет нужный слот, затем планирует ре-рендер. Каждый ре-рендер создаёт новые замыкания с актуальными значениями.

**Q7: Что такое stale closure и как React с этим борется?**

Stale closure — функция захватила значение переменной в момент создания, переменная изменилась, но функция видит старое. В React: `useEffect` с пустым массивом зависимостей создаёт "застывшее" замыкание. Решения: добавить в зависимости, использовать функциональный setState (`prev => prev + 1`), `useRef` для мутируемых значений.

**Q8: Почему стрелочные функции не подходят как методы объекта?**

Стрелка захватывает `this` лексически — из окружения создания объектного литерала (обычно `window`/`undefined`). Метод объекта должен ссылаться на сам объект. Для методов используй shorthand `method() {}` или обычную function.

---

### Практическое задание

Реализуй `memoize(fn)` с методами `invalidate(...args)`, `clear()` и `stats()`:

```javascript
const memoized = memoize(expensiveFn);
memoized(1, 2);          // вычисляет
memoized(1, 2);          // из кэша
memoized.stats();        // { hits: 1, misses: 1, size: 1 }
memoized.invalidate(1, 2);
memoized(1, 2);          // вычисляет снова
memoized.clear();
memoized.stats();        // { hits: 0, misses: 0, size: 0 }
```

---

### Решение

```javascript
function memoize(fn) {
  const cache = new Map();
  let hits = 0;
  let misses = 0;

  const makeKey = (args) => JSON.stringify(args);

  function memoized(...args) {
    const key = makeKey(args);
    if (cache.has(key)) {
      hits++;
      return cache.get(key);
    }
    misses++;
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  }

  memoized.invalidate = (...args) => cache.delete(makeKey(args));

  memoized.clear = () => {
    cache.clear();
    hits = 0;
    misses = 0;
  };

  memoized.stats = () => ({
    hits,
    misses,
    size: cache.size,
    hitRate: hits + misses === 0 ? 0 : hits / (hits + misses),
  });

  return memoized;
}

// Тест с рекурсивной функцией
const memoFib = memoize(function fib(n) {
  return n <= 1 ? n : memoFib(n - 1) + memoFib(n - 2);
});

memoFib(40); // 102334155 — с кэшем быстро
memoFib.stats(); // { hits: N, misses: 41, size: 41, hitRate: ~0.97 }
```

> **Инсайт:** `React.useMemo` — однослотовый кэш: хранит только последний результат и пересчитывает при изменении зависимостей. `useCallback` — то же для функций. Знание ручной мемоизации объясняет почему нет смысла оборачивать каждый компонент в `useMemo`: стоимость кэширования может превысить стоимость вычисления.

---

*Конец Раздела 1 (Темы 1–3)*  
*Следующий файл: `section_2_types.md` — Раздел 2 (Типы и данные, темы 4–6)*
