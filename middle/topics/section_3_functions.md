# Контент курса — Раздел 3: Функции

> **Курс:** JavaScript для Middle FullStack Interview  
> **Стек:** Next.js · React · TypeScript  
> **Охват:** Раздел 3 — Темы 7–11 (Контекст this · Замыкания на практике · map/filter/reduce · Каррирование · Генераторы)

---

# Раздел 3 — Функции

*Функции в JavaScript — первоклассные объекты. Они могут быть переданы как аргументы, возвращены из других функций, сохранены в переменных. В этом разделе мы изучим три ключевых аспекта: как функция определяет свой контекст (this), как она захватывает окружение (замыкания), и как функции высшего порядка (map/filter/reduce) позволяют писать декларативный код. Темы 10 и 11 дают продвинутые паттерны — каррирование для функциональной композиции и генераторы для ленивых вычислений.*

🔗 **Связь с разделами:** Понимание замыканий (Тема 3, Раздел 1) критично для этого раздела. Event Loop (Тема 1) объясняет поведение async-генераторов.

---

## Тема 7: Контекст `this`

← Предыдущая тема: [6 — Прототипы и цепочка прототипов]

---

### 7.1 Теория с аналогиями

**Аналогия: официант в разных ресторанах**

Представьте официанта Антона. Когда он работает в ресторане «Буфет», слово «наш шеф» означает шеф-повара «Буфета». Когда его берут на подработку в «Гранд», то же слово «наш шеф» означает уже другого человека. Антон — одна и та же функция, но **контекст** (`this`) определяется местом вызова, а не определением.

В JavaScript `this` — это **динамическая привязка**, которая вычисляется в момент вызова функции. Одна и та же функция в разных сценариях вызова имеет разный `this`.

---

**4 правила определения `this` (приоритет сверху вниз):**

```
┌─────────────────────────────────────────────────────┐
│         ПРИОРИТЕТ ПРАВИЛ (высший → низший)          │
├─────────────────────────────────────────────────────┤
│  1. new          new Foo()  → this = новый объект   │
│  2. explicit     call/apply/bind → this = 1й аргумент│
│  3. method       obj.fn()  → this = obj             │
│  4. default      fn()      → this = undefined/global│
└─────────────────────────────────────────────────────┘
```

**Правило 1 — Вызов через `new`:**

```typescript
function Person(name: string) {
  // new создаёт пустой объект и связывает с ним this
  this.name = name;
}

const alice = new Person("Alice"); // this = свежесозданный объект
console.log(alice.name); // "Alice"
```

**Правило 2 — Явная привязка (`call` / `apply` / `bind`):**

```typescript
function greet(this: { name: string }, greeting: string) {
  return `${greeting}, ${this.name}!`;
}

const user = { name: "Bob" };

greet.call(user, "Hello");        // "Hello, Bob!" — this = user
greet.apply(user, ["Hi"]);        // "Hi, Bob!"   — аргументы массивом
const boundGreet = greet.bind(user); // возвращает новую функцию
boundGreet("Hey");                // "Hey, Bob!"  — this зафиксирован навсегда
```

**Правило 3 — Метод объекта:**

```typescript
const counter = {
  count: 0,
  increment() {
    // this = объект, через который вызван метод (counter)
    this.count++;
    return this.count;
  }
};

counter.increment(); // this = counter → count = 1
```

**Правило 4 — Обычный вызов (default):**

```typescript
function showThis() {
  // В strict mode → undefined
  // В non-strict mode → globalThis (window в браузере)
  console.log(this);
}

showThis(); // undefined (в ES-модулях и strict mode)
```

---

**Потеря `this` при передаче метода как колбэка:**

```typescript
const timer = {
  seconds: 0,
  start() {
    // ❌ this теряется: setInterval вызывает функцию как fn(), не как timer.fn()
    setInterval(function() {
      this.seconds++; // this = undefined (strict) или window
      console.log(this.seconds); // NaN или ошибка
    }, 1000);
  }
};

// Что происходит под капотом:
// const callback = timer.start  ← функция «отрывается» от объекта
// callback()                    ← вызов без контекста → this теряется
```

```
┌──────────────────────────────────────────────────┐
│  timer.start()   →  setInterval(callback, 1000)  │
│                                                  │
│  callback хранится как ссылка на функцию         │
│  БЕЗ привязки к timer                            │
│                                                  │
│  Через 1 сек: callback()  ← вызов без объекта    │
│  this = undefined          ← правило 4           │
└──────────────────────────────────────────────────┘
```

**Стрелочные функции: лексический `this`:**

```typescript
const timer2 = {
  seconds: 0,
  start() {
    // ✅ Стрелка НЕ имеет своего this — берёт его из окружающего лексического контекста
    // Лексический контекст здесь — метод start(), где this = timer2
    setInterval(() => {
      this.seconds++; // this = timer2 (захвачен при создании стрелки)
      console.log(this.seconds); // 1, 2, 3...
    }, 1000);
  }
};
```

**Суперсила и ограничение стрелки:**

```typescript
// ✅ Суперсила — идеальна как колбэк внутри метода
class DataService {
  private data = [1, 2, 3];

  processAll() {
    // this = экземпляр DataService — стрелка захватила его из processAll
    return this.data.map(item => this.transform(item));
  }

  private transform(n: number) { return n * 2; }
}

// ❌ Ограничение — нельзя использовать как метод объекта
const obj = {
  value: 42,
  // Стрелка захватывает this из момента ОПРЕДЕЛЕНИЯ объекта
  // obj определяется в глобальном/модульном контексте, где this ≠ obj
  getValue: () => this.value // this = undefined → undefined.value → ошибка
};
```

---

### 7.2 Связь со стеком

**React: потеря `this` в class-компонентах**

```tsx
// ❌ Проблема в старом стиле — this теряется в обработчике
class OldButton extends React.Component {
  state = { clicked: false };

  handleClick() {
    // При вызове onClick={this.handleClick} → функция отрывается от компонента
    this.setState({ clicked: true }); // ❌ TypeError: Cannot read property 'setState' of undefined
  }

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}

// ✅ Решение 1: bind в конструкторе
class BindButton extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this); // жёсткая привязка
  }
  handleClick() { this.setState({ clicked: true }); }
  render() { return <button onClick={this.handleClick}>Click</button>; }
}

// ✅ Решение 2 (современное): class field со стрелкой
class ModernButton extends React.Component {
  state = { clicked: false };

  // Class field — стрелка захватывает this из конструктора
  // Каждый экземпляр получает свою функцию с правильным this
  handleClick = () => {
    this.setState({ clicked: true });
  };

  render() { return <button onClick={this.handleClick}>Click</button>; }
}
```

**Почему хуки лучше и не имеют `this`:**

```tsx
// ✅ Хуки — функциональные компоненты, this вообще не используется
// Состояние управляется замыканиями, а не контекстом объекта
function HookButton() {
  const [clicked, setClicked] = React.useState(false);

  // Нет this → нет проблемы с его потерей
  // Замыкание гарантирует доступ к setClicked
  const handleClick = () => setClicked(true);

  return <button onClick={handleClick}>Click</button>;
}
```

🔗 **Связь с темой 8:** Хуки используют замыкания вместо `this` — именно поэтому зависимости в `useEffect` так важны.

---

### 7.3 Лучшие паттерны

**Паттерн 1: Стрелки для колбэков внутри методов**

```typescript
// ❌ Антипаттерн — function expression теряет контекст
class UserService {
  private users = ["Alice", "Bob"];

  greetAll() {
    this.users.forEach(function(user) {
      console.log(`${this.prefix}: ${user}`); // ❌ this = undefined
    });
  }
}

// ✅ Правильно — стрелка захватывает this из greetAll
class UserService2 {
  private prefix = "Hello";
  private users = ["Alice", "Bob"];

  greetAll() {
    this.users.forEach(user => {
      // this = экземпляр UserService2 — захвачен стрелкой
      console.log(`${this.prefix}: ${user}`);
    });
  }
}
// Объяснение: стрелка не создаёт собственный this — она использует this
// из ближайшего окружающего function-контекста (greetAll)
```

**Паттерн 2: Class field со стрелкой для обработчиков React**

```typescript
// ❌ Антипаттерн — inline arrow создаёт новую функцию при каждом рендере
class Form extends React.Component {
  render() {
    // Новая функция при каждом рендере → пробивает React.memo на дочерних
    return <input onChange={(e) => this.handleChange(e)} />;
  }
}

// ✅ Правильно — стабильная ссылка, создаётся один раз в конструкторе
class Form2 extends React.Component {
  // Стрелочный class field = стабильная функция + правильный this
  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ value: e.target.value });
  };

  render() {
    // Передаём стабильную ссылку — React.memo работает корректно
    return <input onChange={this.handleChange} />;
  }
}
// Объяснение: class field инициализируется в конструкторе один раз,
// стрелка захватывает this в этот момент — привязка неразрывна
```

**Паттерн 3: Никогда не использовать стрелку как метод объекта**

```typescript
// ❌ Антипаттерн — стрелка в литерале объекта
const counter = {
  count: 0,
  // Стрелка захватывает this из МЕСТА ОПРЕДЕЛЕНИЯ литерала
  // Литерал определяется в модульном/глобальном контексте
  increment: () => {
    this.count++; // this ≠ counter! this = undefined или global
  }
};

counter.increment(); // NaN или ошибка — this.count не то, что ожидали

// ✅ Правильно — обычный метод (shorthand)
const counter2 = {
  count: 0,
  increment() {
    // Правило 3: вызов через obj.fn() → this = obj
    this.count++; // this = counter2 ✓
  }
};

counter2.increment(); // count = 1 ✓
// Объяснение: метод-шортхенд участвует в правиле метода объекта —
// this определяется в момент вызова, а не определения
```

---

### 7.4 Вопросы интервью

**Q1: Что такое `this` в JavaScript и чем оно отличается от других языков?**

`this` в JavaScript — это динамическая привязка, которая вычисляется в момент **вызова** функции, а не её определения. В отличие от Java или C#, где `this` всегда ссылается на текущий объект класса, в JavaScript `this` зависит от контекста вызова. Существует четыре правила приоритета: `new` > явная привязка (`call`/`apply`/`bind`) > метод объекта > стандартный вызов. Эта гибкость мощная, но требует понимания — именно она является источником большинства багов, связанных с контекстом.

**Q2: Почему стрелочные функции не имеют своего `this`?**

Стрелочные функции имеют **лексический** `this` — они захватывают `this` из ближайшего окружающего обычного (`function`) контекста в момент своего создания. Стрелки не создают собственную запись `this` в своём лексическом окружении. Это означает, что `call`, `apply`, `bind` не могут изменить `this` стрелки. Данное поведение намеренно — стрелки проектировались именно для колбэков внутри методов, где потеря `this` была хронической проблемой.

**Q3: В чём разница между `call`, `apply` и `bind`?**

Все три метода явно устанавливают `this`, но отличаются поведением. `call` вызывает функцию немедленно, передавая аргументы через запятую: `fn.call(ctx, a, b)`. `apply` тоже вызывает немедленно, но аргументы передаются массивом: `fn.apply(ctx, [a, b])` — удобно, когда аргументы уже в массиве. `bind` не вызывает функцию, а **возвращает новую функцию** с жёстко привязанным `this` — полезно для создания стабильных ссылок на методы. Привязка через `bind` необратима — последующие `call`/`apply`/`bind` не могут её переопределить.

**Q4: Что происходит при передаче метода объекта как колбэка?**

Когда метод передаётся как значение (колбэк), он «отрывается» от объекта — сохраняется только ссылка на функцию без контекста. При последующем вызове этой функции не используется правило «метода объекта», а применяется «стандартный вызов» (правило 4), что даёт `undefined` в strict mode. Это происходит при `setTimeout(obj.method, 100)`, при `arr.forEach(obj.method)`, при React `onClick={this.handleClick}`. Решение — `bind`, стрелочная обёртка или стрелочный class field.

**Q5: Что такое жёсткая привязка (hard binding) и зачем она нужна?**

Жёсткая привязка — результат вызова `bind`, который создаёт новую функцию с **перманентно** зафиксированным `this`. Эту привязку нельзя переопределить даже через `call`/`apply` или повторный `bind`. Применяется для создания стабильных колбэков — когда нужно передать метод в чужой код, который будет вызывать его в своём контексте. В React class-компонентах `this.method = this.method.bind(this)` в конструкторе создаёт именно жёсткую привязку. Современная альтернатива — стрелочный class field, который делает то же самое декларативнее.

**Q6: Как `this` работает в стрелочных функциях внутри объектных литералов?**

Объектный литерал не создаёт собственного лексического контекста (в отличие от `function` и класса). Поэтому стрелка в литерале захватывает `this` из **внешнего** по отношению к литералу контекста — обычно модульный/глобальный `this` (в ES-модулях это `undefined`). Таким образом, `{ method: () => this.value }` почти всегда ошибка — `this` не будет ссылаться на объект. Для методов объектных литералов всегда используйте shorthand-синтаксис `{ method() {} }`.

**Q7: Какой `this` у функции в строгом режиме при обычном вызове?**

В strict mode (`'use strict'` или ES-модули, где strict mode по умолчанию) `this` при обычном вызове функции равен `undefined` — движок не подставляет глобальный объект. В non-strict mode `this` при обычном вызове равен `globalThis` (в браузере — `window`, в Node — `global`). ES-модули (`.mjs`, `type: "module"` в package.json, TypeScript) всегда работают в strict mode, поэтому в современном коде обычный вызов даёт `undefined`. Это ключевая причина, почему потеря `this` приводит к `TypeError`, а не к тихому чтению глобальных переменных.

**Q8: Каков алгоритм определения `this` в произвольном коде?**

Алгоритм: (1) Проверить, вызвана ли функция через `new` — если да, `this` = новый объект. (2) Проверить, используется ли явная привязка (`call`/`apply`) или `bind` — если да, `this` = первый аргумент. (3) Проверить, вызвана ли функция как метод объекта (`obj.fn()`) — если да, `this` = объект слева от точки. (4) Иначе — стандартный вызов: strict mode → `undefined`, non-strict → `globalThis`. Для стрелочных функций алгоритм другой: найти ближайший окружающий обычный `function`-контекст и взять его `this`.

**Q9: Как `this` ведёт себя в промисах и async/await?**

Промисы вызывают колбэки (`.then`, `.catch`) без контекста, через стандартный вызов — `this` будет `undefined` в strict mode. Это ещё одна причина, почему стрелки предпочтительны в `.then(result => this.process(result))`. В `async`-функциях правила `this` те же, что для обычных функций — контекст определяется при вызове. `await` не меняет `this` — после `await` функция продолжает работу с тем же `this`, что был до `await`. Ключевой инсайт: `async`-функция — обычная функция с точки зрения правил `this`.

---

### 7.5 Практическое задание

**Задание:** Реализуйте `Function.prototype.myBind` — полный аналог встроенного `bind`.

Требования:
1. `myBind(ctx, ...args)` возвращает новую функцию с зафиксированным `this = ctx`
2. Поддержка частичного применения аргументов (pre-filled args)
3. Если возвращённую функцию вызвать через `new`, `this` должен быть новым объектом (как у настоящего `bind`)
4. Длина (`length`) возвращённой функции должна корректно отражать оставшиеся аргументы

---

### 7.6 Решение с инсайтом

```typescript
interface Function {
  myBind<T>(this: (...args: unknown[]) => T, ctx: unknown, ...preArgs: unknown[]): (...args: unknown[]) => T;
}

Function.prototype.myBind = function myBind(ctx: unknown, ...preArgs: unknown[]) {
  const originalFn = this; // сохраняем оригинальную функцию

  // Создаём bound-функцию
  function boundFn(this: unknown, ...callArgs: unknown[]) {
    const allArgs = [...preArgs, ...callArgs]; // объединяем pre-filled и новые аргументы

    // Ключевой момент: если boundFn вызвана через new,
    // this будет instanceof boundFn — в этом случае игнорируем ctx
    // (поведение настоящего bind: new всегда побеждает жёсткую привязку)
    const isCalledWithNew = this instanceof boundFn;
    return originalFn.apply(isCalledWithNew ? this : ctx, allArgs);
  }

  // Настраиваем прототип, чтобы new boundFn() создавал экземпляры originalFn
  boundFn.prototype = Object.create(originalFn.prototype);

  // Корректируем length: оставшиеся незаполненные аргументы
  Object.defineProperty(boundFn, "length", {
    value: Math.max(0, originalFn.length - preArgs.length)
  });

  return boundFn;
};

// --- Тесты ---

function multiply(this: { factor: number }, a: number, b: number) {
  return a * b * (this?.factor ?? 1);
}

const ctx = { factor: 10 };
const boundMultiply = multiply.myBind(ctx, 3); // pre-fill a = 3
console.log(boundMultiply(4)); // 3 * 4 * 10 = 120 ✓

// Проверка partial application
const double = multiply.myBind({ factor: 1 }, 2);
console.log(double(5));  // 2 * 5 * 1 = 10 ✓
console.log(double(10)); // 2 * 10 * 1 = 20 ✓

// Проверка new override
function Person(this: any, name: string) {
  this.name = name;
}
const BoundPerson = Person.myBind({ name: "ignored" });
const p = new (BoundPerson as any)("Alice");
console.log(p.name); // "Alice" — new переопределил ctx ✓
```

**Ключевой инсайт:** Настоящий `bind` имеет специальное правило — вызов через `new` всегда **игнорирует** жёсткую привязку. Это отражает иерархию приоритетов: `new` > explicit. Проверка `this instanceof boundFn` — единственный способ определить, вызвана ли функция через `new`, без доступа к метаинформации движка.

---

→ Следующая тема: [8 — Замыкания на практике]

---

## Тема 8: Замыкания на практике

← Предыдущая тема: [7 — Контекст this]

---

### 8.1 Теория с аналогиями

**Аналогия: «Рюкзак» функции**

Когда функция создаётся внутри другой функции, она получает невидимый «рюкзак» — ссылку на лексическое окружение места своего рождения. Даже когда внешняя функция завершила работу и её стек-фрейм удалён, «рюкзак» продолжает жить, пока жива внутренняя функция. Именно это и называется **замыканием** (closure).

```
┌─────────────────────────────────────────────────────────┐
│  outer() вызвана → создан Scope {count: 0}             │
│                                                         │
│  outer() вернула inner ──────────────────┐             │
│                                          │             │
│  Scope {count: 0} НЕ удаляется  ◄────────┘             │
│  (есть живая ссылка из inner)                           │
│                                                         │
│  inner() вызвана → читает/пишет count через рюкзак     │
└─────────────────────────────────────────────────────────┘
```

**5 практических применений замыканий:**

**1. Приватные данные:**

```typescript
function createCounter(initial = 0) {
  // count недоступен снаружи — только через returned API
  let count = initial;

  return {
    increment: () => ++count,
    decrement: () => --count,
    // Геттер без сеттера — read-only извне
    getCount: () => count,
    reset: () => { count = initial; }
  };
}

const counter = createCounter(10);
counter.increment(); // 11
counter.increment(); // 12
// counter.count — undefined, нет прямого доступа
```

**2. Функции-фабрики:**

```typescript
function createMultiplier(factor: number) {
  // factor захвачен замыканием — у каждой функции свой factor
  return (value: number) => value * factor;
}

const double = createMultiplier(2);
const triple = createMultiplier(3);
const tenX   = createMultiplier(10);

double(5);  // 10
triple(5);  // 15
tenX(5);    // 50
```

**3. Debounce — state через замыкание:**

Debounce — классический пример, где замыкание хранит **состояние между вызовами**:

```typescript
function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  // timerId живёт в замыкании — сохраняет состояние между вызовами
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return function(...args: T) {
    // Каждый новый вызов отменяет предыдущий таймер
    if (timerId !== null) {
      clearTimeout(timerId);
    }

    // Создаём новый таймер — он захватывает актуальные args
    timerId = setTimeout(() => {
      fn(...args);
      timerId = null; // сбрасываем после выполнения
    }, delay);
  };
}

// Функция поиска вызовется только через 300мс после последнего нажатия
const debouncedSearch = debounce((query: string) => {
  console.log(`Searching: ${query}`);
}, 300);
```

```
Вызов:  ──A──────B──C────────────D──────────►
                                              время
Таймер: ──[─300ms]                            A отменён B вызовом
               ──[─300ms]                     B отменён C вызовом
                    ──[────300ms────]►выполн  C не отменён
                                        ──[─300ms]►выполн  D
```

**4. ID-генераторы:**

```typescript
function createIdGenerator(prefix = "id") {
  let lastId = 0; // state в замыкании

  return {
    next: () => `${prefix}-${++lastId}`,
    reset: () => { lastId = 0; },
    peek: () => lastId
  };
}

const userIds = createIdGenerator("user");
userIds.next(); // "user-1"
userIds.next(); // "user-2"

const orderIds = createIdGenerator("order"); // независимый генератор
orderIds.next(); // "order-1"
```

**5. React state через замыкание (упрощённая модель useState):**

```typescript
// Упрощённая модель того, как useState работает внутри
function createState<T>(initialValue: T) {
  let state = initialValue; // замыкание удерживает состояние

  function getState(): T {
    return state;
  }

  function setState(newValue: T | ((prev: T) => T)): void {
    state = typeof newValue === "function"
      ? (newValue as (prev: T) => T)(state)
      : newValue;
    // В реальном React здесь был бы re-render
  }

  return [getState, setState] as const;
}
```

---

**Stale Closure: что это и как обнаружить:**

```typescript
// Проблема stale closure:
function createBuggyCounter() {
  let count = 0;

  const logCount = () => {
    // Эта стрелка захватила count = 0 в момент создания
    console.log(count); // всегда 0 — stale!
  };

  return {
    increment: () => { count++; },
    // logCount захватила count ЗНАЧЕНИЕ? Нет — ссылку на переменную
    // Но проблема возникает, если мы "заморозили" конкретное значение
    logCount
  };
}

// Реальная stale closure в React useEffect:
function StaleExample() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      // ❌ count захвачен при первом рендере = 0
      // Каждую секунду: 0 + 1 = 1, никогда не больше
      setCount(count + 1); // stale closure!
    }, 1000);
    return () => clearInterval(id);
  }, []); // пустой массив зависимостей = замыкание не обновляется
}
```

**Как исправить stale closure:**

```typescript
function FixedExample() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      // ✅ Функциональное обновление — не требует захвата count
      // React передаёт актуальное значение в колбэк
      setCount(prev => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []); // Зависимость не нужна, т.к. не используем count напрямую
}

// Или добавить count в зависимости (пересоздаёт эффект при каждом изменении):
function FixedExample2() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1); // count теперь актуален — эффект пересоздаётся
    }, 1000);
    return () => clearInterval(id);
  }, [count]); // ✅ count в зависимостях
}
```

---

### 8.2 Связь со стеком

**React `useCallback` и `useMemo` — мемоизация замыканий:**

```tsx
function SearchComponent({ data }: { data: string[] }) {
  const [query, setQuery] = React.useState("");

  // ❌ Без useCallback: новая функция при каждом рендере
  // Дочерний компонент получает новую ссылку → перерендеривается
  const handleSearch = (term: string) => {
    return data.filter(item => item.includes(term));
  };

  // ✅ useCallback мемоизирует замыкание
  // Функция пересоздаётся только при изменении data
  const handleSearchMemo = React.useCallback(
    (term: string) => {
      // data захвачена замыканием — обновляется при изменении зависимостей
      return data.filter(item => item.includes(term));
    },
    [data] // data в зависимостях — иначе stale closure!
  );
}
```

**`useEffect` cleanup как предотвращение утечек памяти:**

```tsx
function DataFetcher({ userId }: { userId: string }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false; // замыкание хранит флаг отмены

    async function fetchUser() {
      const data = await api.getUser(userId);

      // Проверяем флаг — компонент мог размонтироваться пока шёл запрос
      if (!cancelled) {
        setUser(data); // безопасно обновляем state
      }
    }

    fetchUser();

    // Cleanup: устанавливаем флаг при размонтировании
    // Замыкание даёт cleanup-функции доступ к cancelled
    return () => { cancelled = true; };
  }, [userId]);
}
```

🔗 **Связь с темой 7:** В хуках нет `this` именно потому, что состояние хранится в замыканиях — это более надёжный механизм.

---

### 8.3 Лучшие паттерны

**Паттерн 1: `once()` — гарантированный однократный вызов**

```typescript
// ❌ Антипаттерн — ручные проверки, флаги-переменные разбросаны по коду
let initialized = false;

function initAnalytics() {
  if (initialized) return; // проверка везде где нужно
  initialized = true;
  // ... инициализация
}

// ✅ Правильно — замыкание инкапсулирует состояние
function once<T extends unknown[], R>(fn: (...args: T) => R): (...args: T) => R | undefined {
  let called = false;
  let result: R;

  return function(...args: T) {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result; // при повторных вызовах возвращает cached результат
  };
}

const initAnalytics = once(() => {
  console.log("Analytics initialized");
  return { sessionId: Math.random() };
});

initAnalytics(); // "Analytics initialized" → { sessionId: 0.42 }
initAnalytics(); // ничего не выводит → { sessionId: 0.42 } (тот же результат)
// Объяснение: called и result живут в замыкании — недоступны снаружи,
// но доступны при каждом вызове возвращённой функции
```

**Паттерн 2: `throttle()` — ограничение частоты вызовов**

```typescript
// ❌ Антипаттерн — вызов без ограничения (resize/scroll обработчики)
window.addEventListener("scroll", () => {
  expensiveLayoutCalc(); // вызов каждые ~16мс → 60 вызовов/сек → тормоза
});

// ✅ Правильно — throttle через замыкание
function throttle<T extends unknown[]>(
  fn: (...args: T) => void,
  limit: number
): (...args: T) => void {
  let lastCallTime = 0; // состояние в замыкании

  return function(...args: T) {
    const now = Date.now();

    if (now - lastCallTime >= limit) {
      lastCallTime = now; // обновляем время последнего вызова
      fn(...args);
    }
    // вызовы чаще limit игнорируются
  };
}

const throttledScroll = throttle(() => expensiveLayoutCalc(), 100); // макс 10/сек
window.addEventListener("scroll", throttledScroll);
// Объяснение: lastCallTime в замыкании — персистентное состояние между вызовами,
// не загрязняет внешний скоуп, не требует глобальных переменных
```

**Паттерн 3: Partial application для переиспользования**

```typescript
// ❌ Антипаттерн — дублирование аргументов
const users = [
  { role: "admin", name: "Alice" },
  { role: "user",  name: "Bob" },
  { role: "admin", name: "Carol" }
];

// Дублирование "admin" при каждом вызове
const admins = users.filter(u => u.role === "admin");
const editors = users.filter(u => u.role === "editor");

// ✅ Правильно — частичное применение через замыкание
function byRole(role: string) {
  // role захвачена замыканием — специализированный предикат
  return (user: { role: string }) => user.role === role;
}

const isAdmin  = byRole("admin");
const isEditor = byRole("editor");
const isUser   = byRole("user");

const admins2  = users.filter(isAdmin);   // переиспользуемый предикат
const editors2 = users.filter(isEditor);  // чистый, читаемый код
// Объяснение: каждый вызов byRole создаёт независимое замыкание с
// собственным role — функции-предикаты многоразовые и тестируемые
```

---

### 8.4 Вопросы интервью

**Q1: Как замыкание создаёт приватные переменные?**

Замыкание создаёт приватность через **лексическое скопирование** — переменные, объявленные во внешней функции, недоступны напрямую из внешнего кода. Единственный способ взаимодействовать с ними — через возвращённые функции, которые и образуют публичный API. Это паттерн «Module Pattern», он использовался до появления классов и актуален сейчас для создания истинной приватности без синтаксического сахара `#privateField`. Движок не удаляет переменные замыкания из памяти, пока существует хотя бы одна функция, ссылающаяся на них.

**Q2: Почему замыкание захватывает ссылку, а не копию переменной?**

Замыкание захватывает **переменную** (место в памяти), а не значение в ней. Это означает, что если переменная изменяется после создания замыкания, функция увидит новое значение при следующем вызове. Классический пример — `var` в цикле: все замыкания ссылаются на одну переменную `i`, которая к моменту вызова уже равна `n`. Решение — `let` (новая переменная на каждую итерацию) или IIFE для создания нового скопа с копией значения. Понимание «ссылка vs копия» критично для отладки async-кода.

**Q3: Как работают `debounce` и `throttle` и в чём их разница?**

`debounce` откладывает выполнение функции на `delay` миллисекунд после **последнего** вызова — если вызовы продолжаются, таймер сбрасывается. Используется для поиска по вводу — функция выполнится только когда пользователь перестал печатать. `throttle` гарантирует, что функция вызывается **не чаще** чем раз в `limit` миллисекунд — вызовы в промежутке игнорируются или ставятся в очередь. Используется для обработчиков scroll/resize. Оба реализуются через замыкание, хранящее состояние (таймер или метку времени) между вызовами.

**Q4: Что такое stale closure и почему это проблема в React?**

Stale closure — ситуация, когда замыкание захватило переменную с **устаревшим значением** и не обновляется при его изменении. В React это типично для `useEffect` с пустым массивом зависимостей — колбэк создаётся при первом рендере и захватывает начальные значения state/props. При последующих рендерах state обновляется, но замыкание в эффекте продолжает видеть старые значения. Результат — баги, когда обработчик работает с данными «из прошлого».

**Q5: Как избежать stale closure в React?**

Три стратегии: (1) Указать все захватываемые переменные в массиве зависимостей `useEffect`/`useCallback` — ESLint плагин `eslint-plugin-react-hooks` с правилом `exhaustive-deps` автоматически предупреждает об упущенных зависимостях. (2) Использовать функциональное обновление `setState(prev => newValue)` — колбэк получает актуальное значение без захвата через замыкание. (3) Использовать `useRef` для хранения «живых» значений — `ref.current` всегда актуален, не требует зависимостей.

**Q6: Что такое IIFE и зачем оно было нужно?**

IIFE (Immediately Invoked Function Expression) — функция, которая немедленно вызывает саму себя: `(function() { ... })()`. До ES6 (без `let`/`const` и модулей) IIFE была единственным способом создать изолированный скоп через замыкание. Библиотеки вроде jQuery оборачивали весь код в IIFE, чтобы не загрязнять глобальный скоп. Сегодня IIFE практически не нужен — ES-модули (`import`/`export`) обеспечивают изоляцию скопа, а `let`/`const` дают блочную видимость. Встречается в легаси-коде и иногда для немедленного выполнения async-кода.

**Q7: Можно ли «очистить» замыкание и освободить память?**

Принудительно очистить замыкание нельзя — сборщик мусора освободит память автоматически, когда **не останется живых ссылок** на функции замыкания. Для управления памятью: обнулять ссылки на функции (`handler = null`), удалять обработчики событий (`removeEventListener`), использовать `WeakRef`/`WeakMap` для слабых ссылок, не захваченных GC. В React утечки замыканий типичны при подписках без cleanup в `useEffect`. Правило: если замыкание создаёт ресурс (таймер, подписку), cleanup-функция должна его освобождать.

**Q8: Что такое мемоизация и как она связана с замыканиями?**

Мемоизация — кэширование результатов функции по аргументам: одни и те же аргументы → возвращаем кэшированный результат без повторного вычисления. Реализуется через замыкание, хранящее Map/объект с кэшем. `React.useMemo` и `React.useCallback` — встроенные механизмы мемоизации: `useMemo` кэширует вычисленное значение, `useCallback` кэширует саму функцию (её ссылку). Оба используют массив зависимостей — при изменении зависимостей кэш инвалидируется и замыкание пересоздаётся с новыми значениями.

**Q9: Как замыкания используются в паттерне «модуль»?**

Паттерн модуля использует замыкание для разделения публичного и приватного интерфейса. Функция-фабрика возвращает объект только с теми методами, которые должны быть доступны снаружи. Приватные переменные и вспомогательные функции остаются в замыкании — недоступны, но работают. До ES-модулей и `#privateFields` это был основной способ инкапсуляции в JavaScript. Сейчас паттерн актуален для создания стейтфул-сервисов без классов, функциональных стор (как Zustand), и везде, где нужна истинная приватность без синтаксиса классов.

---

### 8.5 Практическое задание

**Задание:** Реализуйте `createEventEmitter()` — полнофункциональный EventEmitter с методами `on`, `off`, `emit`, `once`.

Требования:
1. `on(event, listener)` — подписка на событие
2. `off(event, listener)` — отписка конкретного слушателя
3. `emit(event, ...args)` — вызов всех слушателей события
4. `once(event, listener)` — однократная подписка (авто-отписка после первого вызова)
5. Слушатели должны вызываться в порядке подписки
6. `once`-слушатель должен быть удалим через `off` до срабатывания

---

### 8.6 Решение с инсайтом

```typescript
type Listener<T extends unknown[]> = (...args: T) => void;

interface EventEmitter {
  on<T extends unknown[]>(event: string, listener: Listener<T>): () => void;
  off<T extends unknown[]>(event: string, listener: Listener<T>): void;
  emit<T extends unknown[]>(event: string, ...args: T): void;
  once<T extends unknown[]>(event: string, listener: Listener<T>): () => void;
}

function createEventEmitter(): EventEmitter {
  // Приватное состояние — карта событий → список слушателей
  // Хранится в замыкании, недоступна снаружи
  const listeners = new Map<string, Set<Listener<unknown[]>>>();

  // Вспомогательная: получить или создать Set для события
  function getListeners(event: string): Set<Listener<unknown[]>> {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    return listeners.get(event)!;
  }

  return {
    on(event, listener) {
      getListeners(event).add(listener as Listener<unknown[]>);
      // Возвращаем функцию-отписку — удобный паттерн для cleanup в useEffect
      return () => this.off(event, listener);
    },

    off(event, listener) {
      getListeners(event).delete(listener as Listener<unknown[]>);
    },

    emit(event, ...args) {
      // Копируем Set перед итерацией — защита от модификации во время emit
      // (если слушатель вызывает off во время emit)
      const set = getListeners(event);
      [...set].forEach(listener => listener(...args));
    },

    once(event, listener) {
      // wrapper захватывает listener через замыкание
      // и сам себя удаляет после первого вызова
      const wrapper: Listener<unknown[]> = (...args) => {
        this.off(event, wrapper); // сначала удаляем — защита от рекурсии
        (listener as Listener<unknown[]>)(...args);
      };

      // Сохраняем ссылку на оригинальный listener для возможности off
      // (пользователь вызовет off с оригинальным listener, не с wrapper)
      (wrapper as any).__original = listener;

      this.on(event, wrapper);
      return () => this.off(event, wrapper);
    }
  };
}

// --- Использование ---

const emitter = createEventEmitter();

const handleLogin = (user: string) => console.log(`Login: ${user}`);

const unsubscribe = emitter.on("login", handleLogin);
emitter.on("login", (user: string) => console.log(`Audit: ${user} logged in`));

emitter.once("login", (user: string) => console.log(`First login ever: ${user}`));

emitter.emit("login", "Alice");
// → "Login: Alice"
// → "Audit: Alice logged in"
// → "First login ever: Alice"

emitter.emit("login", "Bob");
// → "Login: Bob"
// → "Audit: Bob logged in"
// → (once уже не срабатывает)

unsubscribe(); // отписываем handleLogin
emitter.emit("login", "Carol");
// → "Audit: Carol logged in"
// → (handleLogin уже не вызывается)
```

**Ключевой инсайт:** Метод `once` — идеальная демонстрация мощи замыканий. `wrapper` захватывает три вещи: ссылку на `this` (эмиттер), имя события и оригинальный `listener`. После первого вызова он удаляет **сам себя** — self-modifying behaviour через замыкание. Возврат функции-отписки (`() => this.off(...)`) из `on` — паттерн, напрямую используемый в React `useEffect` для cleanup.

---

→ Следующая тема: [9 — map / filter / reduce]

---

## Тема 9: `map` / `filter` / `reduce`

← Предыдущая тема: [8 — Замыкания на практике]

---

### 9.1 Теория с аналогиями

**Аналогия: завод с конвейером**

```
Сырьё (массив)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  КОНВЕЙЕР  │  map    → преобразует каждую деталь         │
│            │  (1 вход → 1 выход, форма может меняться)  │
├─────────────────────────────────────────────────────────┤
│  КОНТРОЛЬ  │  filter → отсеивает брак                    │
│  КАЧЕСТВА  │  (1 вход → 0 или 1 выход, та же форма)     │
├─────────────────────────────────────────────────────────┤
│  СБОРОЧНЫЙ │  reduce → собирает всё в итоговый продукт  │
│  ЦЕХ      │  (N входов → 1 выход, любая форма)          │
└─────────────────────────────────────────────────────────┘
    │
    ▼
Готовый продукт
```

**Точная семантика:**

**`Array.prototype.map`:**
- Принимает: `(value, index, array) => newValue`
- Возвращает: **новый массив той же длины**
- Мутирует оригинал: **нет**
- Семантика: трансформация каждого элемента

```typescript
const prices = [10, 25, 50, 100];

// Добавляем НДС к каждой цене
const pricesWithTax = prices.map(price => price * 1.2);
// [12, 30, 60, 120] — новый массив, prices не изменился

// map с индексом — добавляем номер позиции
const numbered = prices.map((price, i) => ({ id: i + 1, price }));
// [{ id: 1, price: 10 }, { id: 2, price: 25 }, ...]
```

**`Array.prototype.filter`:**
- Принимает: `(value, index, array) => boolean`
- Возвращает: **новый массив длиной ≤ оригинала** (только элементы, где предикат = true)
- Мутирует оригинал: **нет**
- Семантика: отбор элементов по условию

```typescript
const products = [
  { name: "Book",   price: 15,  inStock: true  },
  { name: "Lamp",   price: 45,  inStock: false },
  { name: "Pen",    price: 3,   inStock: true  },
  { name: "Tablet", price: 350, inStock: true  }
];

// Только то, что в наличии и стоит до 100
const affordable = products
  .filter(p => p.inStock)
  .filter(p => p.price < 100);
// [{ name: "Book", ... }, { name: "Pen", ... }]
```

**`Array.prototype.reduce`:**
- Принимает: `(accumulator, value, index, array) => newAccumulator`, `initialValue`
- Возвращает: **одно значение любого типа**
- Мутирует оригинал: **нет**
- Семантика: свёртка (fold) массива в одно значение

```typescript
const numbers = [1, 2, 3, 4, 5];

// Сумма
const sum = numbers.reduce((acc, n) => acc + n, 0); // 15

// Объект как аккумулятор — groupBy
const students = [
  { name: "Alice", grade: "A" },
  { name: "Bob",   grade: "B" },
  { name: "Carol", grade: "A" },
  { name: "Dave",  grade: "B" }
];

const byGrade = students.reduce<Record<string, typeof students>>((acc, student) => {
  const key = student.grade;
  // Важно: не мутируем acc.key напрямую если хотим иммутабельность
  acc[key] = [...(acc[key] ?? []), student];
  return acc;
}, {});

// { A: [Alice, Carol], B: [Bob, Dave] }
```

---

**`reduce` как суперсила — реализация `map` и `filter` через `reduce`:**

```typescript
// map через reduce
function myMap<T, U>(arr: T[], fn: (item: T, i: number) => U): U[] {
  return arr.reduce<U[]>((acc, item, i) => {
    acc.push(fn(item, i));
    return acc;
  }, []);
}

// filter через reduce
function myFilter<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  return arr.reduce<T[]>((acc, item) => {
    if (predicate(item)) acc.push(item);
    return acc;
  }, []);
}

// Цепочка map + filter через один reduce (одна итерация вместо двух)
const result = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .reduce<number[]>((acc, n) => {
    if (n % 2 === 0) acc.push(n * 3); // filter + map за один проход
    return acc;
  }, []);
// [6, 12, 18, 24, 30]
```

**Типичные ошибки:**

```typescript
// ❌ Ошибка 1: reduce без initialValue с пустым массивом
[].reduce((acc, n) => acc + n); // TypeError: Reduce of empty array with no initial value

// ✅ Всегда передавайте initialValue
[].reduce((acc, n) => acc + n, 0); // 0 — безопасно

// ❌ Ошибка 2: использование map вместо forEach для побочных эффектов
const results = [];
data.map(item => {
  results.push(processItem(item)); // побочный эффект внутри map — семантически неверно
  // map создаёт новый массив, который нигде не используется — пустая трата памяти
});

// ✅ forEach для побочных эффектов
data.forEach(item => results.push(processItem(item)));
// или ещё лучше:
const results2 = data.map(processItem); // если нужен новый массив

// ❌ Ошибка 3: async в map без Promise.all
const results3 = await data.map(async item => fetchItem(item));
// results3 = массив Promise, не массив результатов!

// ✅ Promise.all для параллельных async-операций
const results4 = await Promise.all(data.map(async item => fetchItem(item)));
```

---

### 9.2 Связь со стеком

**React — рендер списков через `map`:**

```tsx
// Server Component (Next.js App Router) — async map с промисами
async function ProductList({ categoryId }: { categoryId: string }) {
  const products = await db.product.findMany({
    where: { categoryId },
    orderBy: { price: 'asc' }
  });

  return (
    <ul>
      {products.map(product => (
        // key — обязателен для React reconciliation
        // Используем стабильный ID, не индекс массива
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
```

**Фильтрация для отображения через `filter`:**

```tsx
function TaskList({ tasks, filter }: { tasks: Task[]; filter: "all" | "done" | "todo" }) {
  // Вычисляем производный state — не храним отфильтрованный список в state
  const visibleTasks = tasks.filter(task => {
    if (filter === "done") return task.completed;
    if (filter === "todo") return !task.completed;
    return true; // "all"
  });

  return <ul>{visibleTasks.map(task => <TaskItem key={task.id} task={task} />)}</ul>;
}
```

**Агрегация для аналитики через `reduce`:**

```typescript
// Server Action — агрегация данных для дашборда
async function getDashboardStats(userId: string) {
  const transactions = await db.transaction.findMany({ where: { userId } });

  return transactions.reduce(
    (stats, tx) => ({
      total:   stats.total + tx.amount,
      count:   stats.count + 1,
      maxTx:   Math.max(stats.maxTx, tx.amount),
      byMonth: {
        ...stats.byMonth,
        [tx.month]: (stats.byMonth[tx.month] ?? 0) + tx.amount
      }
    }),
    { total: 0, count: 0, maxTx: 0, byMonth: {} as Record<string, number> }
  );
}
```

**`Promise.all(arr.map(async fn))` — параллельные запросы:**

```typescript
// Загрузить несколько ресурсов параллельно
async function loadDashboard(userId: string) {
  const [user, orders, stats] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.order.findMany({ where: { userId } }),
    getStats(userId)
  ]);

  // Параллельно обработать список
  const enrichedOrders = await Promise.all(
    orders.map(async order => ({
      ...order,
      items: await db.orderItem.findMany({ where: { orderId: order.id } })
    }))
  );

  return { user, orders: enrichedOrders, stats };
}
```

🔗 **Связь с темой 10:** Каррирование делает предикаты для `filter` и трансформеры для `map` переиспользуемыми и компонуемыми.

---

### 9.3 Лучшие паттерны

**Паттерн 1: Всегда передавать `initialValue` в `reduce`**

```typescript
// ❌ Антипаттерн — reduce без initialValue
const data = [{ value: 10 }, { value: 20 }];
const sum = data.reduce((acc, item) => acc + item.value);
// Первая итерация: acc = { value: 10 } (первый элемент), item = { value: 20 }
// { value: 10 } + 20 = "{ value: 10 }20" — строковая конкатенация!

// ❌ Ещё хуже — пустой массив
[].reduce((acc, n) => acc + n); // TypeError — нет начального значения

// ✅ Правильно — явный initialValue правильного типа
const sum2 = data.reduce((acc, item) => acc + item.value, 0); // 30
const empty = [].reduce((acc: number, n: number) => acc + n, 0); // 0 — безопасно

// ✅ Сложный accumulator — тип явен с initialValue
const grouped = data.reduce<Record<string, number[]>>(
  (acc, item) => { /* ... */ return acc; },
  {} // TypeScript корректно выводит тип
);
// Объяснение: без initialValue первый элемент становится acc,
// и его тип может не совпадать с ожидаемым типом аккумулятора
```

**Паттерн 2: `forEach` для побочных эффектов, `map` для трансформации**

```typescript
// ❌ Антипаттерн — map для побочных эффектов (игнорируем результат)
users.map(user => {
  sendEmail(user.email); // побочный эффект
  // возвращаемый массив Promise нигде не используется → утечка памяти
});

// ❌ Ещё антипаттерн — мутация внутри map
const result = users.map(user => {
  user.lastSeen = Date.now(); // мутация оригинала внутри map!
  return user;
});

// ✅ Правильно — forEach для I/O и логирования
users.forEach(user => sendEmail(user.email));

// ✅ Правильно — map для иммутабельной трансформации
const updatedUsers = users.map(user => ({
  ...user,
  lastSeen: Date.now() // новый объект, оригинал не тронут
}));
// Объяснение: map контрактно обещает "трансформацию без побочных эффектов".
// Нарушение этого контракта делает код непредсказуемым
```

**Паттерн 3: `flatMap` для трансформации с разворачиванием**

```typescript
// ❌ Антипаттерн — map + flat (два прохода)
const sentences = ["Hello World", "JS is fun"];
const words = sentences.map(s => s.split(" ")).flat();
// [["Hello", "World"], ["JS", "is", "fun"]] → ["Hello", "World", "JS", "is", "fun"]

// ✅ flatMap — один проход (map + flat(1))
const words2 = sentences.flatMap(s => s.split(" "));
// ["Hello", "World", "JS", "is", "fun"]

// Практический пример: развернуть заказы пользователей
const users = [
  { name: "Alice", orders: [101, 102] },
  { name: "Bob",   orders: [103] }
];

// ❌ map + flat
const allOrders = users.map(u => u.orders).flat();

// ✅ flatMap
const allOrders2 = users.flatMap(u => u.orders); // [101, 102, 103]

// Трюк: flatMap для условного включения
const filtered = [1, 2, 3, 4, 5].flatMap(n =>
  n % 2 === 0 ? [n, n * 10] : [] // чётные → [n, n*10], нечётные → убрать
); // [2, 20, 4, 40]
// Объяснение: flatMap мощнее filter+map, когда нужно заменить один элемент
// несколькими или убрать элемент вовсе
```

---

### 9.4 Вопросы интервью

**Q1: В чём разница `map` и `forEach`?**

`map` создаёт и возвращает **новый массив той же длины**, трансформируя каждый элемент — использовать результат обязательно, иначе это антипаттерн. `forEach` ничего не возвращает (`undefined`) и предназначен исключительно для **побочных эффектов** — логирования, отправки запросов, мутации внешнего состояния. Семантически: `map` — функциональная трансформация, `forEach` — императивный цикл. Использование `map` вместо `forEach` для побочных эффектов — код запах: создаётся массив, который сразу выбрасывается, что тратит память.

**Q2: Когда использовать `reduce` вместо цепочки `map`+`filter`?**

`reduce` предпочтительнее когда: (1) нужна **одна итерация** вместо нескольких (цепочка `filter().map()` делает два прохода по массиву); (2) результат — **не массив** (объект, число, строка, Map); (3) трансформация и фильтрация **взаимозависимы**. Цепочка `map`+`filter` читается лучше, когда операции независимы и массив небольшой — не оптимизируйте преждевременно. Для больших данных один `reduce` эффективнее двух проходов.

**Q3: Почему нужен `initialValue` в `reduce`?**

Без `initialValue` первый элемент массива становится начальным аккумулятором, итерация начинается со второго элемента. Это проблема по трём причинам: (1) пустой массив бросает `TypeError`; (2) тип первого элемента может не совпадать с ожидаемым типом аккумулятора (например, массив объектов, а нужна сумма числового поля); (3) поведение неочевидно и нарушает принцип наименьшего удивления. С `initialValue` поведение предсказуемо, тип TypeScript выводится корректно, пустой массив безопасен.

**Q4: Как работает `filter` «под капотом»?**

`filter` итерирует массив и вызывает предикат для каждого элемента. Если предикат возвращает truthy-значение — элемент копируется в новый массив; если falsy — пропускается. Длина результата от 0 до длины оригинала. Элементы не трансформируются — ссылки на объекты копируются, не клонируются. Это означает, что объекты в результирующем массиве — те же ссылки, что в исходном: мутация через одну ссылку отразится и в другой. Если нужны независимые копии — комбинировать `filter` с `map(item => ({...item}))`.

**Q5: Почему `map`/`forEach` не работают с `async`/`await`?**

`forEach` полностью игнорирует возвращаемые промисы — он не awaitable и не может ждать завершения async-колбэков. `map` с async-колбэком возвращает массив промисов (`Promise[]`), а не массив результатов. Для последовательного выполнения нужен `for...of` с `await`. Для параллельного — `await Promise.all(arr.map(async item => ...))`. `reduce` с async требует `await acc` в теле (цепочка промисов), что нечитаемо — лучше `for...of` или `Promise.all`.

**Q6: Что такое transducer (бонус)?**

Transducer — функция, трансформирующая **reducer**, а не данные. Позволяет объединить несколько операций `map`/`filter`/`reduce` в один проход без создания промежуточных массивов. Transducer принимает reducer и возвращает новый reducer: `(reducer) => (acc, item) => newAcc`. Это позволяет описать пайплайн трансформаций декларативно, применить его к любой структуре данных (массив, стрим, итератор) и выполнить за одну итерацию. Концепция из Clojure, популяризирована библиотекой Ramda.

**Q7: Реализуйте `map` через `reduce`:**

```typescript
function mapViaReduce<T, U>(arr: T[], fn: (item: T, i: number) => U): U[] {
  return arr.reduce<U[]>((acc, item, i) => {
    acc.push(fn(item, i));
    return acc;
  }, []);
}
```

Реализация через `reduce` показывает, что `map` — частный случай свёртки. Аккумулятор — новый массив, операция — добавление трансформированного элемента. Аналогично реализуется `filter`, `find`, `every`, `some`, `groupBy` — все они являются специализациями `reduce`.

**Q8: Как работает цепочка методов массива с точки зрения производительности?**

Каждый метод цепочки (`filter().map().reduce()`) создаёт промежуточный массив и выполняет отдельный проход по данным. Для массива из N элементов цепочка из 3 методов делает ~3N итераций. Это приемлемо для большинства случаев, но для больших данных (10k+ элементов) единый `reduce` эффективнее. Ещё более эффективны ленивые последовательности (генераторы, тема 11) — они обрабатывают данные по требованию без промежуточных массивов.

**Q9: Почему `map`/`filter`/`reduce` не мутируют оригинальный массив?**

Это **спецификационная гарантия** ECMAScript. `map`, `filter`, `reduce`, `flatMap`, `slice` — немутирующие методы, они всегда создают новую структуру. Мутирующие методы: `sort`, `reverse`, `splice`, `push`, `pop`, `shift`, `unshift`, `fill`. С ES2023 появились `toSorted`, `toReversed`, `toSpliced`, `with` — иммутабельные аналоги мутирующих методов. Иммутабельность в `map`/`filter`/`reduce` критична для React — изменение ссылки на массив триггерит перерендер, мутация той же ссылки — нет.

---

### 9.5 Практическое задание

**Задание:** Реализуйте `map`, `filter`, `reduce` с нуля (не используя встроенные) + напишите функцию `getTransactionStats`, которая анализирует массив транзакций.

```typescript
type Transaction = {
  id: string;
  amount: number;
  category: "food" | "transport" | "entertainment" | "health";
  date: string; // ISO
  type: "income" | "expense";
};

// getTransactionStats должна вернуть:
type Stats = {
  total: number;           // сумма всех транзакций
  byCategory: Record<string, number>; // сумма по категориям
  avgExpense: number;      // средние расходы
  topExpense: Transaction; // самый крупный расход
  monthlyIncome: Record<string, number>; // доход по месяцам (YYYY-MM)
};
```

---

### 9.6 Решение с инсайтом

```typescript
// --- Реализация с нуля ---

function myMap<T, U>(arr: T[], fn: (item: T, index: number, arr: T[]) => U): U[] {
  const result: U[] = [];
  for (let i = 0; i < arr.length; i++) {
    result[i] = fn(arr[i], i, arr);
  }
  return result;
}

function myFilter<T>(arr: T[], predicate: (item: T, index: number, arr: T[]) => boolean): T[] {
  const result: T[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i], i, arr)) result.push(arr[i]);
  }
  return result;
}

function myReduce<T, U>(arr: T[], fn: (acc: U, item: T, index: number) => U, initial: U): U {
  let acc = initial;
  for (let i = 0; i < arr.length; i++) {
    acc = fn(acc, arr[i], i);
  }
  return acc;
}

// --- Статистика транзакций ---

type Transaction = {
  id: string;
  amount: number;
  category: "food" | "transport" | "entertainment" | "health";
  date: string;
  type: "income" | "expense";
};

type Stats = {
  total: number;
  byCategory: Record<string, number>;
  avgExpense: number;
  topExpense: Transaction | null;
  monthlyIncome: Record<string, number>;
};

function getTransactionStats(transactions: Transaction[]): Stats {
  return transactions.reduce<Stats & { expenseCount: number }>(
    (acc, tx) => {
      const month = tx.date.slice(0, 7); // "YYYY-MM"

      return {
        // Общая сумма
        total: acc.total + tx.amount,

        // Группировка по категориям
        byCategory: {
          ...acc.byCategory,
          [tx.category]: (acc.byCategory[tx.category] ?? 0) + tx.amount
        },

        // Средние расходы
        expenseCount: tx.type === "expense" ? acc.expenseCount + 1 : acc.expenseCount,
        avgExpense: tx.type === "expense"
          ? (acc.avgExpense * acc.expenseCount + tx.amount) / (acc.expenseCount + 1)
          : acc.avgExpense,

        // Крупнейший расход
        topExpense: tx.type === "expense"
          ? (!acc.topExpense || tx.amount > acc.topExpense.amount ? tx : acc.topExpense)
          : acc.topExpense,

        // Доход по месяцам
        monthlyIncome: tx.type === "income"
          ? { ...acc.monthlyIncome, [month]: (acc.monthlyIncome[month] ?? 0) + tx.amount }
          : acc.monthlyIncome,
      };
    },
    { total: 0, byCategory: {}, avgExpense: 0, expenseCount: 0, topExpense: null, monthlyIncome: {} }
  );
}

// --- Тест ---
const txs: Transaction[] = [
  { id: "1", amount: 50000, category: "food",          date: "2024-01-15", type: "income"  },
  { id: "2", amount: 1500,  category: "food",          date: "2024-01-16", type: "expense" },
  { id: "3", amount: 800,   category: "transport",     date: "2024-01-17", type: "expense" },
  { id: "4", amount: 30000, category: "health",        date: "2024-02-01", type: "income"  },
  { id: "5", amount: 5000,  category: "entertainment", date: "2024-02-15", type: "expense" },
];

console.log(getTransactionStats(txs));
// {
//   total: 87300,
//   byCategory: { food: 51500, transport: 800, health: 30000, entertainment: 5000 },
//   avgExpense: 2433.33,
//   topExpense: { id: "5", amount: 5000, ... },
//   monthlyIncome: { "2024-01": 50000, "2024-02": 30000 }
// }
```

**Ключевой инсайт:** Один `reduce` заменяет пять отдельных проходов по массиву. Аккумулятор — это не просто число или массив, это **любое состояние**, включая объекты со множеством полей. Когда видите несколько `filter().map()` цепочек с похожими данными — спросите себя: можно ли объединить в один `reduce`?

---

→ Следующая тема: [10 — Каррирование]

---

## Тема 10: Каррирование

← Предыдущая тема: [9 — map / filter / reduce]

---

### 10.1 Теория с аналогиями

**Аналогия: шеф-повар и специализированные повара**

Представьте шеф-повара, который готовит блюдо с тремя ингредиентами: `cook(protein, sauce, garnish)`. При каррировании шеф-повар «делится» на специализированных поваров: сначала нанимаем повара белков `cookProtein("chicken")` — он возвращает повара соусов, который получает соус и возвращает повара гарниров. Каждый повар берёт ровно один аргумент и передаёт эстафету следующему.

```
Обычная функция:
cook("chicken", "teriyaki", "rice") → блюдо

Каррированная:
cook("chicken")       → cookWithChicken
cookWithChicken("teriyaki") → cookWithChickenAndTeriyaki
cookWithChickenAndTeriyaki("rice") → блюдо
```

**Каррирование vs Partial Application:**

```typescript
// КАРРИРОВАНИЕ: унарные цепочки (каждый вызов принимает ровно 1 аргумент)
const curriedAdd = (a: number) => (b: number) => (c: number) => a + b + c;
curriedAdd(1)(2)(3); // 6

// PARTIAL APPLICATION: фиксация части аргументов (любое число)
function add(a: number, b: number, c: number) { return a + b + c; }
const addWith1 = add.bind(null, 1);    // фиксируем a = 1
const addWith1and2 = add.bind(null, 1, 2); // фиксируем a = 1, b = 2
addWith1(2, 3);    // 6
addWith1and2(3);   // 6

// РАЗНИЦА:
// Каррирование: fn(a)(b)(c) — строго унарные цепочки
// Partial application: фиксация N аргументов, вызов с оставшимися
```

**Как `fn.length` используется в реализации `curry`:**

```typescript
// fn.length — количество формальных параметров функции
function add(a: number, b: number, c: number) { return a + b + c; }
console.log(add.length); // 3

// Автоматический curry использует length, чтобы знать, когда вызвать оригинал
function curry<T extends unknown[], R>(fn: (...args: T) => R) {
  // Рекурсивная вспомогательная функция
  function curried(...args: unknown[]): unknown {
    if (args.length >= fn.length) {
      // Собрали достаточно аргументов — вызываем оригинал
      return fn(...(args as T));
    }
    // Возвращаем функцию, ожидающую остальные аргументы
    return (...moreArgs: unknown[]) => curried(...args, ...moreArgs);
  }
  return curried as unknown as CurriedFn<T, R>;
}

type CurriedFn<T extends unknown[], R> =
  T extends [infer First, ...infer Rest]
    ? (arg: First) => CurriedFn<Rest extends unknown[] ? Rest : never, R>
    : R;
```

**Data-last стиль и почему он удобен для композиции:**

```typescript
// Data-first (неудобно для composition):
const processUsers = (users: User[], minAge: number, role: string) =>
  users.filter(u => u.age >= minAge && u.role === role);

// Data-last (данные последним — удобно для pipe/compose):
const filterByMinAge = (minAge: number) => (users: User[]) =>
  users.filter(u => u.age >= minAge);

const filterByRole = (role: string) => (users: User[]) =>
  users.filter(u => u.role === role);

// Теперь можно компоновать без явного указания данных:
const getAdminUsers = pipe(
  filterByMinAge(18),
  filterByRole("admin")
);

// Применяем к данным только в конце
getAdminUsers(allUsers); // чисто, читаемо
```

**`pipe` и `compose`:**

```typescript
// pipe: слева направо (f, g, h) → x → h(g(f(x)))
function pipe<T>(...fns: Array<(arg: T) => T>) {
  return (value: T): T => fns.reduce((acc, fn) => fn(acc), value);
}

// compose: справа налево (f, g, h) → x → f(g(h(x)))
function compose<T>(...fns: Array<(arg: T) => T>) {
  return (value: T): T => fns.reduceRight((acc, fn) => fn(acc), value);
}

// Пример с числами:
const process = pipe(
  (n: number) => n * 2,     // 10
  (n: number) => n + 1,     // 11
  (n: number) => n ** 2     // 121
);
process(5); // 121

// Тот же результат через compose (функции в обратном порядке):
const process2 = compose(
  (n: number) => n ** 2,    // применяется последней → 121
  (n: number) => n + 1,     // применяется второй → 11
  (n: number) => n * 2      // применяется первой → 10
);
process2(5); // 121
```

---

### 10.2 Связь со стеком

**Каррированные обработчики в React-формах:**

```tsx
// ❌ Антипаттерн — inline функции для каждого поля
function Form() {
  const [form, setForm] = React.useState({ name: "", email: "", age: "" });

  return (
    <form>
      <input onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
      <input onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} />
      <input onChange={e => setForm(prev => ({ ...prev, age: e.target.value }))} />
    </form>
  );
}

// ✅ Правильно — каррированный обработчик
function Form2() {
  const [form, setForm] = React.useState({ name: "", email: "", age: "" });

  // Частичное применение: фиксируем имя поля, получаем обработчик
  const handleChange = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

  return (
    <form>
      <input onChange={handleChange("name")} />
      <input onChange={handleChange("email")} />
      <input onChange={handleChange("age")} />
    </form>
  );
}
```

**`pipe`/`compose` для обработки данных в Server Actions:**

```typescript
// Next.js Server Action с пайплайном трансформаций
import { pipe } from "@/lib/fp";

type RawProduct = { name: string; price: string; tags: string };
type Product    = { name: string; price: number; tags: string[]; slug: string };

const parseName  = (p: RawProduct) => ({ ...p, name: p.name.trim() });
const parsePrice = (p: RawProduct & { name: string }) => ({
  ...p, price: parseFloat(p.price) || 0
});
const parseTags  = (p: any) => ({
  ...p, tags: p.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
});
const addSlug    = (p: any) => ({
  ...p, slug: p.name.toLowerCase().replace(/\s+/g, "-")
});

const transformProduct = pipe(parseName, parsePrice, parseTags, addSlug);

export async function createProduct(formData: FormData) {
  "use server";
  const raw = Object.fromEntries(formData) as RawProduct;
  const product = transformProduct(raw) as Product;
  await db.product.create({ data: product });
}
```

🔗 **Связь с темой 9:** `pipe` строится поверх `reduce` — это декларативная цепочка трансформаций, аналогичная цепочке `map`/`filter`, но для произвольных функций.

---

### 10.3 Лучшие паттерны

**Паттерн 1: Data-last для компоновки**

```typescript
// ❌ Антипаттерн — data-first, неудобно для compose
const filterByStatus = (items: Item[], status: string) =>
  items.filter(i => i.status === status);

// Нельзя скомпоновать без данных:
// const getActive = filterByStatus(???, "active") — нужны данные сразу

// ✅ Правильно — data-last, данные последним аргументом
const filterByStatus2 = (status: string) => (items: Item[]) =>
  items.filter(i => i.status === status);

// Создаём специализированные функции без данных:
const getActive   = filterByStatus2("active");
const getPending  = filterByStatus2("pending");
const getArchived = filterByStatus2("archived");

// Компонуем:
const getActiveAdmins = pipe(getActive, filterByRole("admin"));
getActiveAdmins(allUsers); // применяем к данным только здесь
// Объяснение: data-last позволяет создать «пустую» функцию-преобразователь,
// которую можно передать в pipe/compose или сохранить как переменную
```

**Паттерн 2: Специализированные функции через curry**

```typescript
// ❌ Антипаттерн — повторяющиеся аргументы
const API_BASE = "https://api.example.com";

fetch(`${API_BASE}/users`);
fetch(`${API_BASE}/products`);
fetch(`${API_BASE}/orders`);

// ✅ Правильно — специализация через curry
const fetchFrom = (baseUrl: string) => (endpoint: string) => (options?: RequestInit) =>
  fetch(`${baseUrl}${endpoint}`, options);

const fetchApi = fetchFrom("https://api.example.com");

const fetchUsers    = fetchApi("/users");
const fetchProducts = fetchApi("/products");
const fetchOrders   = fetchApi("/orders");

// Использование:
const users = await fetchUsers({ headers: { Authorization: `Bearer ${token}` } });
// Объяснение: каждый уровень каррирования создаёт специализированную версию.
// Изменение baseUrl затронет только одно место — fetchApi
```

**Паттерн 3: `pipe`/`compose` для читаемых пайплайнов**

```typescript
// ❌ Антипаттерн — вложенные вызовы (читать снаружи внутрь)
const result = formatCurrency(
  roundToDecimals(2)(
    applyDiscount(0.1)(
      addTax(0.2)(
        parseFloat("100.5")
      )
    )
  )
);
// Мозг читает: formatCurrency ← roundToDecimals ← applyDiscount ← addTax ← parseFloat
// Порядок применения — обратный порядку чтения

// ✅ Правильно — pipe (читать сверху вниз)
const processPrice = pipe(
  (s: string) => parseFloat(s),   // "100.5" → 100.5
  addTax(0.2),                     // 100.5  → 120.6
  applyDiscount(0.1),              // 120.6  → 108.54
  roundToDecimals(2),              // 108.54 → 108.54
  formatCurrency                   // 108.54 → "$108.54"
);

const result2 = processPrice("100.5"); // "$108.54"
// Объяснение: pipe читается как последовательность шагов —
// порядок в коде = порядок выполнения. Легко добавить/убрать шаг
```

---

### 10.4 Вопросы интервью

**Q1: Что такое каррирование?**

Каррирование — техника трансформации функции от нескольких аргументов в цепочку функций, каждая из которых принимает ровно один аргумент: `f(a, b, c)` → `f(a)(b)(c)`. Названа в честь математика Хаскелла Карри, хотя концепция была описана раньше Шейнфинкелем. Каррированная функция возвращает новую функцию до тех пор, пока не будут собраны все аргументы — тогда выполняется вычисление. Это позволяет создавать специализированные версии функций путём «прокармливания» аргументов по одному.

**Q2: В чём разница каррирования и partial application?**

Каррирование преобразует функцию в **цепочку унарных функций** — каждая принимает строго один аргумент. Partial application фиксирует **один или несколько** аргументов и возвращает функцию, ожидающую оставшиеся. Каррирование — более строгая концепция из теории категорий. Практически: `curry(fn)(a)(b)(c)` vs `fn.bind(null, a, b)` или `partiallyApply(fn, a, b)`. Многие реализации `curry` (включая Lodash `_.curry`) поддерживают «гибкое» каррирование — принимают несколько аргументов за раз, что делает их похожими на partial application.

**Q3: Зачем data-last стиль для каррированных функций?**

В data-last порядке данные (массив, объект) идут последним аргументом. Это позволяет создать специализированные функции без данных и использовать их в `pipe`/`compose`. Пример: `filter(predicate)(data)` — `filter(isActive)` возвращает функцию-трансформатор, которую можно передать в пайплайн. В data-first порядке `filter(data, predicate)` — нельзя создать функцию без данных через curry. Большинство библиотек функционального программирования (Ramda, fp-ts) используют data-last. Стандартные методы массивов JavaScript — data-first, что делает их менее удобными для composition.

**Q4: Как `fn.length` используется в автоматическом `curry`?**

`fn.length` — количество формальных параметров функции, заявленных при определении (не считая rest-параметры и параметры с дефолтными значениями). В `curry` используется как **условие окончания**: если собрано `args.length >= fn.length` аргументов — вызываем оригинальную функцию; иначе — возвращаем новую функцию, ждущую остальные. Ограничения: rest-параметры (`...args`) дают `length = 0`, параметры по умолчанию не учитываются. Поэтому auto-curry не работает с вариативными функциями — для них нужно явно указывать арность.

**Q5: Практический пример улучшения кода через curry:**

```typescript
// До: повторение логики фильтрации
const expensiveProducts = products.filter(p => p.price > 1000);
const cheapProducts     = products.filter(p => p.price < 100);
const midProducts       = products.filter(p => p.price >= 100 && p.price <= 1000);

// После: каррированные предикаты
const priceAbove = (min: number) => (p: Product) => p.price > min;
const priceBelow = (max: number) => (p: Product) => p.price < max;

const expensiveProducts2 = products.filter(priceAbove(1000));
const cheapProducts2     = products.filter(priceBelow(100));
// Предикаты переиспользуются, тестируются независимо, компонуются через && / ||
```

Улучшения: устранение дублирования, именованные предикаты вместо inline-лямбд, тестируемость предикатов в изоляции.

**Q6: Что такое `pipe` и `compose`, и в чём их разница?**

Оба создают функции-пайплайны из нескольких функций, но в разном порядке. `pipe(f, g, h)(x)` = `h(g(f(x)))` — функции применяются **слева направо** (как конвейер). `compose(f, g, h)(x)` = `f(g(h(x)))` — функции применяются **справа налево** (математическая нотация: `f ∘ g ∘ h`). `pipe` более интуитивен для чтения — порядок функций совпадает с порядком выполнения. `compose` — традиционная математическая нотация, используется в fp-ts и Haskell-вдохновлённых библиотеках. В практике предпочитают `pipe`.

**Q7: Какова связь каррирования с функциональным программированием?**

Каррирование — одна из основ функционального программирования: оно делает возможным point-free style (программирование без явных аргументов), composition функций и специализацию. В чисто функциональных языках (Haskell, ML) все функции каррированы по умолчанию. В JavaScript это опционально, но библиотека Ramda строит весь API на каррированных data-last функциях. fp-ts использует каррирование для типобезопасной функциональной композиции в TypeScript. Связь с математикой: каррирование — изоморфизм между `(A × B) → C` и `A → (B → C)` в теории типов.

**Q8: Что такое point-free стиль?**

Point-free (бесточечный) стиль — программирование, где функции определяются без явного упоминания аргументов («точек»), только через композицию других функций. Стало возможным благодаря каррированию:

```typescript
// С аргументами (pointful):
const getActiveUserNames = (users: User[]) =>
  users.filter(u => u.active).map(u => u.name);

// Point-free через pipe + каррированные функции:
const getActiveUserNames2 = pipe(
  filter((u: User) => u.active),  // или filter(prop("active"))
  map((u: User) => u.name)        // или map(prop("name"))
);
```

Point-free читаемее при хорошо названных функциях, но может стать криптичным при злоупотреблении.

**Q9: Почему стандартные методы массивов неудобны для curry?**

Методы массивов (`Array.prototype.map`, `filter`, `reduce`) — **data-first**: данные (массив, `this`) первые, конфигурация (колбэк) — после. Это противоположно data-last стилю, нужному для curry+compose. Нельзя написать `pipe(map(double), filter(isEven))`, используя встроенные методы — они принимают только колбэк, не данные. Ramda решает это, предоставляя data-last аналоги: `R.map(double, data)` или `R.map(double)(data)`. В vanilla JS обходят через обёртки: `const myMap = (fn) => (arr) => arr.map(fn)`.

---

### 10.5 Практическое задание

**Задание:** Реализуйте `curry`, `pipe`, `compose` и используйте их для построения пайплайна обработки данных.

Требования:
1. `curry(fn)` — автоматическое каррирование по `fn.length`
2. `pipe(...fns)` — слева направо
3. `compose(...fns)` — справа налево
4. Пайплайн обработки пользователей: фильтр по возрасту + роли, маппинг, сортировка, форматирование вывода

---

### 10.6 Решение с инсайтом

```typescript
// --- curry ---
function curry(fn: Function): Function {
  function curried(...args: unknown[]): unknown {
    // Собрано достаточно аргументов — вызываем оригинал
    if (args.length >= fn.length) {
      return fn(...args);
    }
    // Возвращаем функцию, которая подождёт оставшиеся аргументы
    // и объединит с уже имеющимися через замыкание
    return (...moreArgs: unknown[]) => curried(...args, ...moreArgs);
  }
  return curried;
}

// --- pipe и compose ---
function pipe<T>(...fns: Array<(arg: T) => T>) {
  return (value: T): T => fns.reduce((acc, fn) => fn(acc), value);
}

function compose<T>(...fns: Array<(arg: T) => T>) {
  return (value: T): T => fns.reduceRight((acc, fn) => fn(acc), value);
}

// --- Пайплайн обработки пользователей ---

type User = {
  id: number;
  name: string;
  age: number;
  role: "admin" | "user" | "moderator";
  score: number;
};

// Каррированные data-last хелперы
const filterBy = curry(
  (predicate: (item: User) => boolean, users: User[]) => users.filter(predicate)
);

const mapOver = curry(
  <T, U>(fn: (item: T) => U, arr: T[]) => arr.map(fn)
);

const sortBy = curry(
  (key: keyof User, users: User[]) =>
    [...users].sort((a, b) => (a[key] > b[key] ? 1 : -1))
);

// Специализированные предикаты
const isAdult    = (u: User) => u.age >= 18;
const isAdmin    = (u: User) => u.role === "admin";
const hasHighScore = (u: User) => u.score >= 80;

// Форматтер
const formatUser = (u: User) => `${u.name} (${u.role}, age: ${u.age}, score: ${u.score})`;

// Пайплайн — составляем из частей как LEGO
const processAdminUsers = pipe<User[]>(
  filterBy(isAdult),         // только совершеннолетние
  filterBy(isAdmin),         // только администраторы
  filterBy(hasHighScore),    // с высоким рейтингом
  sortBy("score")            // сортируем по рейтингу
);

// --- Тест ---
const users: User[] = [
  { id: 1, name: "Alice",   age: 25, role: "admin",     score: 95 },
  { id: 2, name: "Bob",     age: 17, role: "admin",     score: 88 },
  { id: 3, name: "Carol",   age: 30, role: "user",      score: 72 },
  { id: 4, name: "Dave",    age: 22, role: "admin",     score: 60 },
  { id: 5, name: "Eve",     age: 28, role: "moderator", score: 91 },
  { id: 6, name: "Frank",   age: 35, role: "admin",     score: 85 },
];

const result = processAdminUsers(users);
result.map(formatUser).forEach(console.log);
// "Alice (admin, age: 25, score: 95)"
// "Frank (admin, age: 35, score: 85)"
// (Bob — несовершеннолетний, Dave — score < 80)

// Легко создать новый пайплайн из тех же частей:
const processTopUsers = pipe<User[]>(
  filterBy(hasHighScore),
  sortBy("name")
);

console.log(processTopUsers(users).map(formatUser));
```

**Ключевой инсайт:** Настоящая ценность каррирования — не сами цепочки вызовов, а **возможность создавать специализированные функции без данных** и хранить их как переменные. `filterBy(isAdmin)` — это самостоятельная, именованная, тестируемая функция. Пайплайн `processAdminUsers` составлен как инструкция без привязки к конкретным данным — данные приходят только в момент вызова. Это и есть декларативное программирование.

---

→ Следующая тема: [11 — Генераторы]

---

## Тема 11: Генераторы

← Предыдущая тема: [10 — Каррирование]

---

### 11.1 Теория с аналогиями

**Аналогия: книга с закладкой**

Обычная функция — это книга, которую читают за один раз от начала до конца. Генератор — книга с закладкой: вы читаете до определённой страницы, ставите закладку, закрываете книгу. Позже открываете с того же места и читаете дальше. `yield` — это закладка. `next()` — «открыть и читать до следующей закладки».

```
Обычная функция:
  вызов ──► выполнение ──► return ──► готово

Генератор:
  вызов ──► создание итератора (не выполняет!)
  .next() ──► выполнение до yield ──► пауза ──► { value, done: false }
  .next() ──► продолжение до следующего yield ──► пауза ──► { value, done: false }
  .next() ──► выполнение до конца ──► { value: undefined, done: true }
```

**Синтаксис `function*` и `yield`:**

```typescript
function* simpleGenerator() {
  console.log("Шаг 1");
  yield 10;              // пауза, отдаём 10

  console.log("Шаг 2");
  yield 20;              // пауза, отдаём 20

  console.log("Шаг 3");
  return 30;             // конец, done = true
}

const gen = simpleGenerator(); // создаём итератор, ничего не выполняется!

console.log(gen.next()); // "Шаг 1" → { value: 10, done: false }
console.log(gen.next()); // "Шаг 2" → { value: 20, done: false }
console.log(gen.next()); // "Шаг 3" → { value: 30, done: true }
console.log(gen.next()); //          → { value: undefined, done: true }
```

**Двусторонняя коммуникация — `next(value)` передаёт значение внутрь:**

```typescript
function* calculator() {
  // yield — это выражение: его значение = то, что передано в next()
  const a = yield "Введите первое число:";  // получаем первое число
  const b = yield "Введите второе число:";  // получаем второе число

  return a + b; // возвращаем сумму
}

const calc = calculator();

calc.next();        // запускаем, получаем { value: "Введите первое число:", done: false }
calc.next(10);      // передаём 10 → a = 10, получаем { value: "Введите второе число:", done: false }
calc.next(20);      // передаём 20 → b = 20, получаем { value: 30, done: true }
```

```
┌────────────────────────────────────────────────────────────────┐
│  ДВУСТОРОННЯЯ КОММУНИКАЦИЯ                                     │
│                                                                │
│  Внешний код          │    Генератор                          │
│  ──────────────────────┼──────────────────────────────────     │
│  next()              ──►  запуск до первого yield             │
│                      ◄──  yield "вопрос"                      │
│  next(10)            ──►  a = 10, продолжаем                  │
│                      ◄──  yield "ещё вопрос"                  │
│  next(20)            ──►  b = 20, return a + b                │
│                      ◄──  { value: 30, done: true }           │
└────────────────────────────────────────────────────────────────┘
```

**`yield*` для делегирования:**

```typescript
function* innerGenerator() {
  yield 1;
  yield 2;
  yield 3;
}

function* outerGenerator() {
  yield 0;
  yield* innerGenerator(); // делегируем — все значения innerGenerator включаются
  yield 4;
}

console.log([...outerGenerator()]); // [0, 1, 2, 3, 4]

// yield* работает с любым итерируемым:
function* flatArray() {
  yield* [10, 20, 30]; // итерируем массив
  yield* "ABC";        // итерируем строку
}
console.log([...flatArray()]); // [10, 20, 30, "A", "B", "C"]
```

**Бесконечные последовательности — почему они безопасны:**

```typescript
// Бесконечный генератор — НЕ вызывает переполнения стека или памяти
// Следующее значение вычисляется ТОЛЬКО при вызове .next()
function* naturals(start = 1) {
  let n = start;
  while (true) { // бесконечный цикл — безопасен в генераторе
    yield n++;
  }
}

function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

// Берём только нужное количество (ленивое вычисление)
function take<T>(n: number, iterable: Iterable<T>): T[] {
  const result: T[] = [];
  for (const value of iterable) {
    result.push(value);
    if (result.length >= n) break;
  }
  return result;
}

take(5, naturals()); // [1, 2, 3, 4, 5] — вычислены только 5 значений
take(8, fibonacci()); // [0, 1, 1, 2, 3, 5, 8, 13]
```

---

**Генераторы реализуют протокол итераторов:**

```typescript
// Генератор автоматически реализует Iterator + Iterable протоколы
function* range(start: number, end: number, step = 1) {
  for (let i = start; i < end; i += step) {
    yield i;
  }
}

const r = range(0, 10, 2);

// Работает с for...of
for (const n of r) {
  console.log(n); // 0, 2, 4, 6, 8
}

// Работает со spread
console.log([...range(1, 6)]); // [1, 2, 3, 4, 5]

// Работает с деструктуризацией
const [first, second, third] = range(10, 100, 10);
console.log(first, second, third); // 10, 20, 30

// Работает с Array.from
const squares = Array.from(range(1, 6), n => n ** 2); // [1, 4, 9, 16, 25]
```

---

### 11.2 Связь со стеком

**Async generators для пагинации данных:**

```typescript
// Ленивая загрузка страниц данных из API
async function* fetchPages<T>(
  endpoint: string,
  pageSize = 20
): AsyncGenerator<T[]> {
  let cursor: string | null = null;

  while (true) {
    const url = cursor
      ? `${endpoint}?cursor=${cursor}&limit=${pageSize}`
      : `${endpoint}?limit=${pageSize}`;

    const response = await fetch(url);
    const { data, nextCursor } = await response.json();

    yield data; // отдаём текущую страницу

    if (!nextCursor) break; // больше страниц нет
    cursor = nextCursor;
  }
}

// Использование — обработка всех данных без загрузки всего в память
async function processAllUsers() {
  for await (const page of fetchPages<User>("/api/users")) {
    // Обрабатываем одну страницу за раз
    page.forEach(user => console.log(user.name));
  }
}
```

**Использование `for await...of` для потоковых данных (Next.js):**

```typescript
// Server Action с потоковой обработкой
export async function* streamAnalytics(filters: AnalyticsFilters) {
  "use server";

  const batches = fetchPages<Event>("/api/events", 100);

  for await (const batch of batches) {
    const stats = computeBatchStats(batch);
    yield stats; // клиент получает данные по мере вычисления
  }
}

// Клиентский компонент (React 18+ streaming)
async function AnalyticsDashboard() {
  const statsStream = streamAnalytics({ from: "2024-01-01" });

  return (
    <Suspense fallback={<Skeleton />}>
      {/* Компонент рендерится по мере поступления данных */}
      <StreamedStats stream={statsStream} />
    </Suspense>
  );
}
```

**Redux-Saga как практический пример генераторов:**

```typescript
// Redux-Saga использует генераторы для описания async-flows
function* watchUserActions() {
  // takeEvery — обрабатываем каждое действие
  yield takeEvery("USER_LOGIN", handleLogin);
  yield takeEvery("USER_LOGOUT", handleLogout);
}

function* handleLogin(action: LoginAction) {
  try {
    yield put({ type: "AUTH_START" }); // отправляем action

    // call — вызываем async-функцию, suspending saga до результата
    const user = yield call(api.login, action.payload);

    yield put({ type: "AUTH_SUCCESS", payload: user });
  } catch (error) {
    yield put({ type: "AUTH_FAILURE", payload: error });
  }
}
// Генераторы делают async-flow тестируемым: вместо реальных вызовов
// в тестах проверяем, что генератор yield-ит правильные эффекты
```

🔗 **Связь с темой 8:** Async generators комбинируют генераторы и промисы — они используют замыкания для хранения состояния между async итерациями.

---

### 11.3 Лучшие паттерны

**Паттерн 1: Ленивая обработка больших данных**

```typescript
// ❌ Антипаттерн — загружаем всё в память сразу
async function processAllOrders() {
  const allOrders = await db.order.findMany(); // 1 миллион записей в памяти!
  return allOrders
    .filter(o => o.status === "pending")
    .map(o => processOrder(o));
}

// ✅ Правильно — ленивая обработка батчами через async generator
async function* streamOrders(batchSize = 1000) {
  let skip = 0;

  while (true) {
    const batch = await db.order.findMany({
      where: { status: "pending" },
      take: batchSize,
      skip
    });

    if (batch.length === 0) break;

    for (const order of batch) {
      yield order; // отдаём по одному — минимальное потребление памяти
    }

    skip += batchSize;
  }
}

async function processAllOrders2() {
  for await (const order of streamOrders()) {
    await processOrder(order); // обрабатываем сразу — не накапливаем
  }
}
// Объяснение: в памяти одновременно только один батч (1000 записей),
// а не весь датасет. Для 1M записей экономия памяти — в 1000 раз
```

**Паттерн 2: Генератор ID для тестов**

```typescript
// ❌ Антипаттерн — статические ID в тестах
test("creates user", async () => {
  const user = { id: "user-1", name: "Alice" }; // хардкод
  // конфликты при параллельных тестах
});

// ✅ Правильно — генератор уникальных ID
function* idGenerator(prefix = "") {
  let id = 0;
  while (true) {
    yield `${prefix}${++id}`;
  }
}

// Создаём независимые генераторы для разных сущностей
const userId    = idGenerator("user-");
const productId = idGenerator("product-");
const orderId   = idGenerator("order-");

// В тестах:
test("creates user", () => {
  const user = { id: userId.next().value, name: "Alice" }; // "user-1"
  // ...
});

test("creates another user", () => {
  const user = { id: userId.next().value, name: "Bob" }; // "user-2" — без конфликта
});
// Объяснение: генератор — чистый источник уникальных ID.
// Каждый тестовый файл может создать свой экземпляр — изоляция гарантирована
```

**Паттерн 3: Пагинация с async generators**

```typescript
// ❌ Антипаттерн — рекурсивные запросы с аккумуляцией
async function fetchAllItems(url: string): Promise<Item[]> {
  const results: Item[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const { items, next } = await fetch(nextUrl).then(r => r.json());
    results.push(...items); // накапливаем всё в памяти
    nextUrl = next;
  }

  return results; // возвращаем только когда всё загружено
}

// ✅ Правильно — стриминг через async generator
async function* fetchPaginated<T>(url: string): AsyncGenerator<T> {
  let nextUrl: string | null = url;

  while (nextUrl) {
    const { items, next }: { items: T[]; next: string | null } =
      await fetch(nextUrl).then(r => r.json());

    for (const item of items) {
      yield item; // отдаём по одному — UI может рендерить сразу
    }

    nextUrl = next;
  }
}

// Использование в Server Component
async function ProductGrid() {
  const products = fetchPaginated<Product>("/api/products");
  const rendered: React.ReactElement[] = [];

  for await (const product of products) {
    rendered.push(<ProductCard key={product.id} product={product} />);
  }

  return <div className="grid">{rendered}</div>;
}
// Объяснение: клиент получает первые элементы до загрузки последних —
// воспринимаемая скорость выше, даже если общее время то же
```

---

### 11.4 Вопросы интервью

**Q1: Что такое генератор и как он работает?**

Генератор — функция, которая может быть **поставлена на паузу** (`yield`) и возобновлена позже (`next()`). При вызове функции-генератора (`function*`) не выполняется ни строчки кода — создаётся объект-итератор. Код выполняется только при вызове `.next()` — до следующего `yield` или конца функции. Каждый `yield` передаёт значение наружу и **замораживает** состояние функции: локальные переменные, позиция выполнения, стек вызовов. `.next()` размораживает функцию с того же места. Это принципиально отличается от обычных функций, которые выполняются до конца без возможности паузы.

**Q2: Какие практические применения есть у генераторов?**

Шесть ключевых применений: (1) **Ленивые последовательности** — бесконечные или очень большие наборы данных без загрузки в память. (2) **Итераторы** — кастомная итерация по структурам данных. (3) **Пагинация** — постраничная загрузка данных с async generators. (4) **State машины** — описание сложных состояний через yield. (5) **Саги** (Redux-Saga) — декларативные async-флоу, тестируемые без моков. (6) **Генераторы ID** — уникальные идентификаторы для тестов и демо. Общая идея: везде, где нужно «производить значения по требованию» без вычисления всех сразу.

**Q3: Что такое `yield*` и зачем он нужен?**

`yield*` делегирует итерацию другому итерируемому объекту — последовательно yield-ит все его элементы. Эквивалентно `for (const v of iterable) yield v`, но лаконичнее. Работает с любым итерируемым: другим генератором, массивом, строкой, Map, Set. Важное отличие: если делегируемый генератор возвращает значение через `return`, `yield*` получает это значение как результат выражения: `const result = yield* otherGen()`. Используется для рекурсивных итераций по деревьям и графам.

**Q4: Как передать значение обратно в генератор?**

Через аргумент `.next(value)`. Первый вызов `.next()` запускает генератор и не может передать значение (оно игнорируется — некуда положить). Все последующие вызовы `.next(value)` передают `value` как **результат выражения `yield`** — то есть значение, которое присваивается слева от `yield`. Это создаёт двусторонний канал: генератор отдаёт данные через `yield`, внешний код отправляет данные через `.next(value)`. Пример: чат-бот, читающий ввод пользователя через `yield`.

**Q5: Какова связь генераторов с протоколом итераторов?**

Генератор автоматически реализует два протокола: **Iterator** (объект с методом `.next()`, возвращающий `{value, done}`) и **Iterable** (объект с методом `[Symbol.iterator]()`, возвращающим себя). Благодаря этому генераторы работают с `for...of`, spread-оператором, деструктуризацией и `Array.from`. Любой объект, реализующий эти протоколы, может быть использован как генератор — кастомные итерируемые. Генераторы — наиболее удобный способ создать итератор без ручной реализации протокола.

**Q6: Что такое async generators?**

Async generator — генератор, объявленный с `async function*`, в котором можно использовать `await` внутри тела. Возвращает AsyncIterator: `.next()` возвращает `Promise<{value, done}>`. Потребляется через `for await...of`. Идеальны для пагинированных API, чтения файлов построчно, обработки стримов Node.js, WebSocket-сообщений. Отличие от обычных генераторов: каждый `yield` в async-генераторе может awaiting promises, то есть генератор сам управляет async-операциями и выдаёт готовые результаты.

**Q7: Чем генераторы лучше массивов для больших данных?**

Три ключевых преимущества: (1) **Память** — генератор хранит только текущий элемент, массив — все элементы. Для 1M элементов разница может быть гигабайтами. (2) **Ленивость** — вычисление следующего элемента происходит только при запросе. Бесконечные последовательности невозможны с массивами. (3) **Стриминг** — можно начать обработку до получения всех данных, что улучшает perceived performance. Недостаток генераторов: **однопроходность** — итератор нельзя перемотать назад; если нужны повторные обходы — конвертируйте в массив.

**Q8: Что такое `return()` и `throw()` у итератора генератора?**

Помимо `.next()`, итераторы генераторов имеют `.return(value)` — принудительно завершает генератор (полезно для cleanup при `break` в `for...of`), и `.throw(error)` — бросает ошибку внутрь генератора в текущей точке приостановки. `throw()` позволяет обрабатывать ошибки внутри генератора через `try/catch` вокруг `yield`. `for await...of` автоматически вызывает `.return()` при `break` или ошибке — генератор получает шанс освободить ресурсы. Это основа корректного cleanup в стриминговых сценариях.

**Q9: Как генераторы соотносятся с async/await?**

Исторически `async/await` было **реализовано поверх генераторов** — транспиляторы (Babel, TypeScript до native async) компилировали `async/await` в код с `function*` и специальным runner'ом. Концептуально: `async function` = генератор + автоматический runner, который awaits каждый yield. Разница: обычный генератор yield-ит любые значения и требует ручного управления; async-функция неявно yield-ит (awaits) только промисы, runner встроен в движок. Async generators объединяют оба механизма: ленивость генераторов + async/await для каждого шага.

---

### 11.5 Практическое задание

**Задание:** Реализуйте `range*`, `take`, и ленивый пайплайн обработки данных.

Требования:
1. `range(start, end, step)` — генератор диапазона чисел
2. `take(n, iterable)` — берёт первые N элементов из любого итерируемого
3. Ленивые `map` и `filter` для генераторов (не создают массивы)
4. Ленивый `pipeline` — обработка 1M+ чисел с минимальным потреблением памяти
5. Сравнение памяти: ленивый vs. массивный подход

---

### 11.6 Решение с инсайтом

```typescript
// --- Базовые генераторы ---

function* range(start: number, end: number, step = 1): Generator<number> {
  if (step === 0) throw new Error("step cannot be zero");
  if (step > 0) {
    for (let i = start; i < end; i += step) yield i;
  } else {
    for (let i = start; i > end; i += step) yield i;
  }
}

function take<T>(n: number, iterable: Iterable<T>): T[] {
  const result: T[] = [];
  for (const value of iterable) {
    result.push(value);
    if (result.length >= n) break; // останавливаем итерацию через break
  }
  return result;
}

// --- Ленивые трансформации (не создают промежуточные массивы) ---

function* lazyMap<T, U>(
  iterable: Iterable<T>,
  fn: (value: T) => U
): Generator<U> {
  for (const value of iterable) {
    yield fn(value); // трансформируем и сразу отдаём — не накапливаем
  }
}

function* lazyFilter<T>(
  iterable: Iterable<T>,
  predicate: (value: T) => boolean
): Generator<T> {
  for (const value of iterable) {
    if (predicate(value)) yield value;
  }
}

function* lazyTakeWhile<T>(
  iterable: Iterable<T>,
  predicate: (value: T) => boolean
): Generator<T> {
  for (const value of iterable) {
    if (!predicate(value)) break;
    yield value;
  }
}

// --- Ленивый пайплайн ---

// Все трансформации применяются ЛЕНИВО — по одному элементу за раз
function lazyPipeline() {
  const numbers = range(1, 1_000_001); // 1 миллион чисел — НЕ в памяти!

  const pipeline = lazyFilter(
    lazyMap(
      numbers,
      n => n * n          // возводим в квадрат
    ),
    n => n % 3 === 0      // только кратные 3
  );

  // Берём первые 5 — вычисляем только столько, сколько нужно
  return take(5, pipeline);
}

console.log(lazyPipeline()); // [9, 36, 81, 144, 225]
// Обработано чисел: 15 (до 15: 1,2,...,15 — 15²=225, кратное 3)
// В памяти: максимум 1 число единовременно!

// --- Сравнение: ленивый vs массивный ---

function eagerPipeline() {
  const numbers = Array.from({ length: 1_000_001 }, (_, i) => i + 1); // 8MB в памяти
  return numbers
    .map(n => n * n)    // ещё 8MB промежуточный массив
    .filter(n => n % 3 === 0) // ещё ~2.7MB
    .slice(0, 5);       // [9, 36, 81, 144, 225]
  // Итого: ~18MB и 3M операций только чтобы получить 5 чисел!
}

// --- Async generator для реальной пагинации ---

type ApiResponse<T> = { data: T[]; nextPage: number | null };

async function* paginatedFetch<T>(
  url: string,
  pageSize = 20
): AsyncGenerator<T> {
  let page = 1;

  while (true) {
    const response: ApiResponse<T> = await fetch(
      `${url}?page=${page}&size=${pageSize}`
    ).then(r => r.json());

    for (const item of response.data) {
      yield item; // каждый элемент доступен потребителю немедленно
    }

    if (!response.nextPage) break;
    page = response.nextPage;
  }
}

// Использование:
async function processUsers() {
  let count = 0;

  for await (const user of paginatedFetch<{ id: string; name: string }>("/api/users")) {
    console.log(`Processing: ${user.name}`);
    count++;

    if (count >= 100) break; // Останавливаем — не загружаем лишние страницы
  }
}

// --- Продвинутый пример: генератор-машина состояний ---

type TrafficLight = "red" | "yellow" | "green";

function* trafficLight(): Generator<TrafficLight> {
  while (true) {
    yield "red";    // стоп
    yield "yellow"; // внимание
    yield "green";  // езжай
  }
}

const light = trafficLight();
console.log(light.next().value); // "red"
console.log(light.next().value); // "yellow"
console.log(light.next().value); // "green"
console.log(light.next().value); // "red" — цикл
```

**Ключевой инсайт:** Генераторы реализуют **ленивые вычисления** — значения производятся по требованию, не заранее. Для 1M чисел ленивый пайплайн использует O(1) памяти, eager — O(n). Это делает генераторы незаменимыми для работы с большими данными, стримами и бесконечными последовательностями. Принцип: **не вычисляй то, что не будет использовано**. Async generators расширяют эту идею на I/O операции — идеальный инструмент для пагинации, Web Workers и любого стриминга данных.

---

→ Следующая тема: [12 — Асинхронность: Promises (Раздел 4)]

---

*Раздел 3 завершён. Следующий раздел: Асинхронность — Promises, async/await, Event Loop в деталях.*
