# Контент курса — Раздел 2: Типы и данные

> **Курс:** JavaScript для Middle FullStack Interview  
> **Стек:** Next.js · React · TypeScript  
> **Охват:** Раздел 2 — Темы 4–6 (Приведение типов · Значение vs Ссылка · null / undefined / NaN)

---

# Раздел 2 — Типы и данные

---

## Тема 4 — Приведение типов

---

### Теория

**Аналогия: переводчик**

Представь работу с документами на разных языках. Явный перевод (explicit coercion) — ты нанял переводчика, контролируешь результат. Неявный (implicit coercion) — кто-то переводит за тебя без спроса. JavaScript агрессивно приводит типы в сравнениях, арифметике и логических операциях. Иногда это удобно, иногда — источник коварных багов.

**Таблица ToNumber**

```
undefined     → NaN
null          → 0
false         → 0
true          → 1
''            → 0     (пустая строка!)
' '           → 0     (пробелы игнорируются)
'123'         → 123
'12abc'       → NaN   (не полностью числовая)
[]            → 0     ([] → '' → 0)
[1]           → 1     ([1] → '1' → 1)
[1,2]         → NaN   ([1,2] → '1,2' → NaN)
{}            → NaN
```

**Таблица ToString**

```
undefined     → 'undefined'
null          → 'null'
true / false  → 'true' / 'false'
0             → '0'
-0            → '0'   (!)
NaN           → 'NaN'
[]            → ''
[1,2]         → '1,2'
{}            → '[object Object]'
```

**Оператор `+` — самый коварный**

```javascript
// Правило: хоть один операнд строка — конкатенация
1 + '2'          // '12'
'3' + 4          // '34'

// Порядок важен (слева направо)
1 + 2 + '3'      // '33'  → (1+2)=3, 3+'3'='33'
'1' + 2 + 3      // '123' → '1'+2='12', '12'+3='123'

// Особые случаи
[] + []          // '' — оба → '', конкатенация
[] + {}          // '[object Object]'
{} + []          // 0 — {} в начале выражения = блок, не объект!
```

**Алгоритм `==` — Abstract Equality Comparison**

```
a == b:
  1. Оба одного типа → используй ===
  2. null == undefined → true (специальное правило)
  3. undefined == null → true
  4. number == string → строку в число, сравнить
  5. boolean == any → булево в число, повторить
  6. object == number/string → object.valueOf() или toString()
```

**Разбор `[] == ![]` → `true` пошагово**

```
Шаг 1: ![] = false  ([] — truthy, ! инвертирует)
Шаг 2: [] == false
Шаг 3: false → 0    (правило 5: булево → число)
Шаг 4: [] == 0
Шаг 5: [].toString() = ''  (правило 6: объект → строка)
Шаг 6: '' == 0
Шаг 7: Number('') = 0  (правило 4: строка → число)
Шаг 8: 0 == 0 → true ✓
```

---

### Связь со стеком

**TypeScript как защита от приведения**

```typescript
function add(a: number, b: number): number {
  return a + b; // '42' сюда не пройдёт — ошибка компиляции
}
// Но в runtime TypeScript не защищает:
const result = add('1' as any, 2); // '12' — обошли через any!
```

**URL параметры в Next.js — всегда строки**

```typescript
// app/page.tsx
export default function Page({
  searchParams
}: { searchParams: { page?: string } }) {
  // ❌ Опасно: строка + число
  const page = searchParams.page + 1; // '11' вместо 2!

  // ✅ Безопасно: явное приведение с fallback
  const page = Number(searchParams.page) || 1;
}
```

---

### Лучшие паттерны

**✅ Паттерн 1: Всегда `===`, единственное исключение — `== null`**

```javascript
// ❌ Плохо — неявное приведение
if (value == 0) { }    // true для '', false, null
if (value == false) { } // true для 0, '', []

// ✅ Хорошо — предсказуемо
if (value === 0) { }
if (value === false) { }

// Единственное полезное исключение:
if (value == null) { }  // проверяет null И undefined одновременно
```

**✅ Паттерн 2: Явное приведение типов**

```javascript
// К числу
Number('42')         // 42 — явный, понятный
parseInt('42px', 10) // 42 — парсит до первого нечислового
+'42'                // 42 — лаконично, но менее читаемо

// К строке
String(42)           // '42'
String(null)         // 'null' — не бросает ошибку
`${42}`              // '42' — через template literal

// К булеву
Boolean(value)       // явный
!!value              // двойное отрицание — лаконично
```

**✅ Паттерн 3: `Number.isNaN` и `Number.isFinite` вместо глобальных**

```javascript
// ❌ Глобальные приводят аргумент к числу
isNaN('hello')       // true — но 'hello' не NaN, это строка!
isFinite('42')       // true — но '42' не число, это строка!

// ✅ Number.* — строгие, не приводят
Number.isNaN('hello')   // false — правильно
Number.isNaN(NaN)       // true — правильно
Number.isFinite('42')   // false — правильно
Number.isFinite(42)     // true — правильно
Number.isFinite(Infinity) // false — правильно
```

---

### Вопросы для интервью

**Q1: В чём разница между `==` и `===`?**

`===` — строгое равенство: сравнивает тип и значение, никогда не приводит типы. `==` — нестрогое: если типы разные, приводит по алгоритму Abstract Equality Comparison. Всегда используй `===`. Исключение: `value == null` для одновременной проверки null и undefined.

**Q2: Почему `[] == ![]` равно `true`?**

1. `![]` = `false` ([] truthy, ! инвертирует). 2. `[] == false`. 3. `false → 0` (булево в число). 4. `[] == 0`. 5. `[].toString() = ''` (объект в строку). 6. `'' == 0`. 7. `Number('') = 0`. 8. `0 == 0 → true`.

**Q3: Чему равно `typeof null` и почему?**

`'object'`. Исторический баг с 1995 года: в ранней реализации тег null совпадал с тегом объектов. Сохранён для обратной совместимости. Правильная проверка на null: `value === null`.

**Q4: Когда `==` полезен?**

Единственный распространённый случай: `value == null` проверяет одновременно `null` и `undefined`. Эквивалентно `value === null || value === undefined`, но короче. Всё остальное — `===`.

**Q5: Что такое truthy и falsy значения?**

Falsy: `false`, `0`, `-0`, `0n`, `''`, `null`, `undefined`, `NaN` — 8 значений. Всё остальное truthy, включая `[]`, `{}`, `'0'`, `'false'`. Пустой массив и объект — truthy!

**Q6: Почему `NaN !== NaN`?**

Единственное значение в JS (и IEEE 754), не равное самому себе. Семантика: два "не-числа" могут быть результатами разных бессмысленных операций. Для проверки: `Number.isNaN(value)`.

**Q7: Чему равно `null + 1` и `undefined + 1`?**

`null + 1 = 1` — null → 0 (ToNumber), 0 + 1 = 1. `undefined + 1 = NaN` — undefined → NaN (ToNumber), NaN + 1 = NaN. NaN "заражает" любую арифметику.

**Q8: Назови все способы явного приведения к числу и их отличия.**

`Number(value)` — явный, возвращает NaN для непарсируемых. `parseInt(str, 10)` — парсит строку до первого нечислового, нужен radix. `parseFloat(str)` — для дробных. Унарный `+value` — ведёт себя как `Number()`. Для `'100px'` — только `parseInt`.

---

### Практическое задание

Реализуй `safeParseNumber(value): number | null` без неявных приведений.

```javascript
safeParseNumber(42)        // 42
safeParseNumber(0)         // 0
safeParseNumber('42')      // 42
safeParseNumber('  3.14 ') // 3.14
safeParseNumber('12abc')   // null
safeParseNumber(true)      // 1
safeParseNumber(false)     // 0
safeParseNumber(null)      // null
safeParseNumber(NaN)       // null
safeParseNumber(Infinity)  // null
safeParseNumber([])        // null (защита от [] → 0)
safeParseNumber('')        // null
```

---

### Решение

```javascript
function safeParseNumber(value) {
  // null и undefined → null
  if (value === null || value === undefined) return null;

  // Булевы → числа (явно)
  if (typeof value === 'boolean') return value ? 1 : 0;

  // Уже число — проверяем корректность
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null; // NaN, ±Infinity → null
  }

  // Строки — явный парсинг
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  // Объекты, массивы и т.д. → null
  return null;
}
```

> **Инсайт:** `Number.isFinite` — лучший способ проверить что значение является настоящим числом. Возвращает `false` для NaN, Infinity, -Infinity и любых не-чисел. TypeScript `number` включает NaN и Infinity — для строгой валидации нужен runtime-checks через `Number.isFinite`.

---

## Тема 5 — Значение vs Ссылка

---

### Теория

**Аналогия: ключ от сейфа и наличные**

Два способа передать ценности. Ключ от сейфа (ссылка): у двух людей доступ к одному сейфу — что один положит, другой увидит. Если перевыпустить ключ — старый не пострадает. Наличные (значение): отдал 100 рублей — у получателя своя купюра, независимая от твоей.

Объекты — ключи от сейфа. Примитивы — наличные.

**Примитивы: передача по значению**

```javascript
// number, string, boolean, null, undefined, symbol, bigint

let a = 42;
let b = a;   // b получает КОПИЮ значения
b = 100;
console.log(a); // 42 — не изменился

let s1 = 'hello';
let s2 = s1;
s2 = s2 + ' world';
console.log(s1); // 'hello' — не изменился
```

**Объекты: передача по ссылке**

```javascript
const obj1 = { x: 1 };
const obj2 = obj1; // obj2 получает ССЫЛКУ на тот же объект

obj2.x = 99;
console.log(obj1.x); // 99 — один объект!
console.log(obj1 === obj2); // true — одна ссылка
```

**"Передача по значению ссылки" — тонкий момент**

```javascript
function test(obj, arr) {
  obj.x = 100;    // мутация через ссылку — видна снаружи ✓
  arr.push(4);    // мутация — видна снаружи ✓

  obj = { x: 999 }; // переприсвоение локальной переменной — НЕ видно
  arr = [0, 0, 0];  // то же
}

const o = { x: 1 };
const a = [1, 2, 3];
test(o, a);

console.log(o.x); // 100 — мутация видна
console.log(a);   // [1, 2, 3, 4] — мутация видна
// o и a не стали {x:999} и [0,0,0] — переприсвоения не видны
```

**Сравнение объектов — по ссылке**

```javascript
{} === {}           // false — разные объекты
[] === []           // false

const a = { x: 1 };
const b = a;
a === b              // true — одна ссылка

const c = { x: 1 };
a === c              // false — разные объекты с одинаковым содержимым
```

---

### Связь со стеком

**React state и Object.is**

```javascript
const [user, setUser] = useState({ name: 'Alice', age: 30 });

// ❌ Мутация: ссылка не изменилась → React не увидит
user.age = 31;
setUser(user); // Object.is(oldUser, newUser) → true → нет ре-рендера!

// ✅ Новый объект: ссылка изменилась → ре-рендер
setUser({ ...user, age: 31 });
setUser(prev => ({ ...prev, age: prev.age + 1 })); // функциональный вариант
```

**Иммутабельные обновления вложенного state**

```javascript
setState(prev => ({
  ...prev,                          // остальное не трогаем
  user: {
    ...prev.user,                   // остальное в user
    address: {
      ...prev.user.address,         // остальное в address
      city: 'SPb'                   // только это изменилось
    }
  }
  // items — та же ссылка, React не будет перерендеривать
}));
```

---

### Лучшие паттерны

**✅ Паттерн 1: `structuredClone` для настоящего глубокого клонирования**

```javascript
const original = {
  user: { name: 'Alice', birthDate: new Date('1990-01-01') },
  tags: ['admin'],
};

// ❌ JSON — теряет Date, undefined, Function, циклические ссылки
const bad = JSON.parse(JSON.stringify(original));
bad.user.birthDate instanceof Date; // false! Стало строкой.

// ❌ Shallow spread — только первый уровень
const shallow = { ...original };
shallow.user === original.user; // true — вложенные объекты общие!

// ✅ structuredClone — настоящее глубокое клонирование (Node 17+, 2022)
const deep = structuredClone(original);
deep.user === original.user;           // false — независимые объекты
deep.user.birthDate instanceof Date;   // true — Date сохранён ✓
deep.user.name = 'Bob';
original.user.name;                    // 'Alice' — не изменился ✓
```

*Почему:* `structuredClone` — стандарт Web Platform. Поддерживает Date, RegExp, Map, Set, ArrayBuffer. НЕ поддерживает: Function, Symbol, DOM-узлы.

**✅ Паттерн 2: Иммутабельные операции с массивами**

```javascript
const arr = [1, 2, 3, 4, 5];

// ❌ Мутирующие — нельзя для React state
arr.push(6);        // мутирует
arr.splice(2, 1);   // мутирует
arr.sort();         // мутирует

// ✅ Иммутабельные
const added     = [...arr, 6];
const prepended = [0, ...arr];
const removed   = arr.filter((_, i) => i !== 2);
const updated   = arr.map((x, i) => i === 2 ? 99 : x);
const inserted  = [...arr.slice(0, 2), 99, ...arr.slice(2)];

// ES2023: копирующие методы
const sorted    = arr.toSorted((a, b) => b - a);
const reversed  = arr.toReversed();
const withItem  = arr.with(2, 99);

arr; // [1,2,3,4,5] — не изменился
```

**✅ Паттерн 3: `Object.freeze` для конфигов**

```javascript
// ❌ Плохо: конфиг может случайно мутировать
const config = { timeout: 5000, retries: 3 };
// config.timeout = 99999; — где-то в коде

// ✅ Хорошо: заморозить — попытка мутации → ошибка в strict mode
const CONFIG = Object.freeze({
  API_URL: process.env.NEXT_PUBLIC_API_URL,
  TIMEOUT: 5000,
  MAX_RETRIES: 3,
});

CONFIG.TIMEOUT = 99999; // TypeError в strict / молчание в non-strict

// Но: freeze поверхностный!
const cfg = Object.freeze({ db: { host: 'localhost' } });
cfg.db.host = 'remote'; // работает — вложенный объект не заморожен
```

---

### Вопросы для интервью

**Q1: В чём разница между передачей по значению и по ссылке в JS?**

Примитивы — по значению: функция получает копию, изменения не видны снаружи. Объекты — по "значению ссылки": функция получает копию адреса. Мутация объекта через адрес видна снаружи, переприсвоение локальной переменной — нет.

**Q2: Почему `{} === {}` возвращает `false`?**

Объекты сравниваются по ссылке (адресу в памяти), а не по содержимому. Два разных литерала `{}` — два разных объекта по разным адресам. Для сравнения по содержимому нужна функция `deepEqual`.

**Q3: Как безопасно скопировать объект?**

Shallow copy: `{ ...obj }` или `Object.assign({}, obj)` — только первый уровень. Deep copy: `structuredClone(obj)` — рекурсивно, поддерживает Date/Map/Set. `JSON.parse(JSON.stringify(obj))` — теряет undefined, Date→string, Function.

**Q4: Почему нельзя мутировать state в React?**

React использует `Object.is()` для сравнения. При мутации ссылка не меняется — `Object.is(old, mutated) → true` → React считает state неизменным → нет ре-рендера. Нужен новый объект со сменившейся ссылкой.

**Q5: Что делает spread при копировании объектов?**

`{ ...obj }` создаёт новый объект и копирует собственные перечислимые свойства. Shallow copy: примитивы копируются, вложенные объекты — только ссылки. Изменение вложенного объекта в копии затронет оригинал.

**Q6: Как `const` защищает объект?**

`const` запрещает переприсвоение (`obj = {}` → TypeError), но НЕ защищает от мутации (`obj.x = 1` — легально). Для защиты содержимого — `Object.freeze()` (поверхностно).

**Q7: Что такое shallow copy vs deep copy?**

Shallow: копирует только первый уровень, вложенные объекты — общие ссылки. Deep: рекурсивно копирует все уровни, изменения полностью изолированы. `{ ...obj }` — shallow. `structuredClone(obj)` — deep.

**Q8: Почему `structuredClone` лучше `JSON.parse/stringify`?**

`JSON` теряет: `undefined` (удаляется), `Function` (удаляется), `Date` → строка, `Map`/`Set` → `{}`, circular refs → ошибка. `structuredClone` корректно обрабатывает все встроенные типы кроме Function, Symbol и DOM-узлов.

---

### Практическое задание

Реализуй `deepEqual(a, b)` для глубокого сравнения любых значений.

```javascript
deepEqual(NaN, NaN)                        // true
deepEqual(+0, -0)                          // false
deepEqual([1, [2, 3]], [1, [2, 3]])        // true
deepEqual({ a: 1 }, { a: '1' })           // false
deepEqual(new Map([['a', 1]]), new Map([['a', 1]])) // true
deepEqual(new Set([1, 2]), new Set([2, 1])) // true
```

---

### Решение

```javascript
function deepEqual(a, b) {
  // Примитивы и NaN через Object.is
  if (Object.is(a, b)) return true;

  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

  // Date
  if (a instanceof Date) return a.getTime() === b.getTime();

  // RegExp
  if (a instanceof RegExp) return a.source === b.source && a.flags === b.flags;

  // Map
  if (a instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, val] of a) {
      if (!b.has(key) || !deepEqual(val, b.get(key))) return false;
    }
    return true;
  }

  // Set (порядок не важен для примитивных элементов)
  if (a instanceof Set) {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }

  // Массивы
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  // Объекты
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every(key =>
    Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key])
  );
}
```

> **Инсайт:** `Object.is(a, b)` — лучший способ сравнивать примитивы: `Object.is(NaN, NaN) → true` (=== даёт false) и `Object.is(+0, -0) → false` (=== даёт true). Именно его использует React внутри `useState` и `memo`. Использование в начале deepEqual — это "fast path": большинство вызовов завершатся здесь без рекурсии.

---

## Тема 6 — null / undefined / NaN

---

### Теория

**Три вида "пусто" — три смысла**

**`undefined`** — ящик есть, но ты ничего туда не положил. Появляется автоматически: переменная объявлена не инициализирована, свойство не существует, функция ничего не вернула, аргумент не передан.

**`null`** — ящик с запиской "здесь намеренно пусто". Всегда явное присваивание программиста: "здесь нет значения".

**`NaN`** — результат сложения яблок и километров. Результат некорректной числовой операции.

```javascript
// undefined — появляется автоматически
let x;                          // x === undefined
function f(a) {}; f();          // a === undefined
const obj = {}; obj.missing;    // undefined
function g() {}; g();           // undefined (нет return)

// null — всегда явное присваивание
let user = null;                // программист явно указал "нет пользователя"
return null;                    // явно "ничего не нашли"

// NaN — результат плохой арифметики
Number('hello')   // NaN
0 / 0             // NaN
Math.sqrt(-1)     // NaN
undefined + 1     // NaN
Infinity - Infinity // NaN
```

**Поведение в арифметике**

```javascript
null + 1          // 1     (null → 0)
null * 5          // 0
null + null       // 0

undefined + 1     // NaN   (undefined → NaN)
undefined * 5     // NaN

NaN + 1           // NaN   (NaN "заражает" всё)
NaN * 100         // NaN
NaN === NaN       // false (!) — единственное значение не равное себе
```

**Правильные способы проверки**

```javascript
// null
value === null                          // единственный правильный способ
typeof null === 'object'                // true, но это БАГ JS — не использовать!

// undefined
value === undefined
typeof value === 'undefined'            // безопасно для необъявленных переменных

// Оба сразу — nullish check
value == null                           // true для null И undefined
value === null || value === undefined   // явнее

// NaN — ТОЛЬКО Number.isNaN
Number.isNaN(value)                     // ✓ только для настоящего NaN
isNaN(value)                            // ✗ приводит тип! isNaN('hello') → true
```

---

### Связь со стеком

**Optional chaining и Nullish coalescing**

```javascript
// ?. — безопасный доступ: прерывает цепочку при null/undefined
const city = user?.profile?.address?.city; // undefined, не TypeError

// ?? — fallback только для null/undefined (не для 0 и ''!)
const displayName = user?.name ?? 'Anonymous';
const timeout = config.timeout ?? 5000; // 0 → 0 (не заменяется!)

// Опасная ловушка с ||:
const timeout = config.timeout || 5000; // 0 → 5000! БАГИ при timeout=0
```

**TypeScript и nullable типы**

```typescript
// strictNullChecks включён — null/undefined отдельные типы
let name: string = null;        // ❌ Error
let name: string | null = null; // ✓

// Non-null assertion (используй осторожно)
const el = document.getElementById('app')!; // ! = "я знаю что не null"

// Type guard
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
```

---

### Лучшие паттерны

**✅ Паттерн 1: Различай null и undefined семантически в API**

```javascript
// undefined = "не указан, используй дефолт"
// null = "явно очистить значение"

async function updateUser(id, updates) {
  const patch = {};
  // undefined = не трогать поле
  // null = применить (очистить аватар, например)
  if (updates.name !== undefined)   patch.name = updates.name;
  if (updates.avatar !== undefined) patch.avatar = updates.avatar;
  await db.users.update(id, patch);
}

updateUser('1', { name: 'Bob' });    // только name
updateUser('1', { avatar: null });   // явно очищаем аватар
updateUser('1', {});                 // ничего не трогаем
```

**✅ Паттерн 2: `??` вместо `||` для конфигов**

```javascript
// ❌ Плохо: || заменяет все falsy, включая 0, '' и false
function createTimer({ delay, label, enabled }) {
  const d = delay || 1000;    // delay=0 → станет 1000! БАГ
  const l = label || 'Timer'; // label='' → станет 'Timer'! БАГ
  const e = enabled || true;  // enabled=false → станет true! БАГ
}

// ✅ Хорошо: ?? заменяет только null/undefined
function createTimer({ delay, label, enabled }) {
  const d = delay ?? 1000;    // 0 → 0 ✓
  const l = label ?? 'Timer'; // '' → '' ✓
  const e = enabled ?? true;  // false → false ✓
}
```

**✅ Паттерн 3: `Number.isNaN` для надёжной проверки**

```javascript
// ❌ Глобальный isNaN — приводит тип, вводит в заблуждение
isNaN('hello')    // true — но 'hello' не NaN, это строка!
isNaN(undefined)  // true — undefined не NaN

// ✅ Number.isNaN — строгий
Number.isNaN('hello')    // false — правильно
Number.isNaN(NaN)        // true  — правильно
Number.isNaN(undefined)  // false — правильно

// Полная валидация числа из внешнего источника
function parseUserInput(value) {
  if (value == null) return { valid: false, reason: 'empty' };
  const num = Number(value);
  if (Number.isNaN(num)) return { valid: false, reason: 'not a number' };
  if (!Number.isFinite(num)) return { valid: false, reason: 'infinite' };
  return { valid: true, value: num };
}
```

---

### Вопросы для интервью

**Q1: В чём разница между null и undefined?**

`undefined` — значение не присвоено, генерируется движком автоматически (необъявленное свойство, нет return, аргумент не передан). `null` — явное присваивание программистом: "здесь намеренно нет значения". `typeof undefined === 'undefined'`, `typeof null === 'object'` (баг JS).

**Q2: Почему `typeof null === 'object'`?**

Исторический баг с 1995 года. В ранней реализации тег null (0x00) совпадал с тегом объектов. Сохранён для обратной совместимости. Правильная проверка на null: `value === null`.

**Q3: Как правильно проверить NaN?**

`Number.isNaN(value)` — единственный правильный способ. Не использовать глобальный `isNaN()` — он приводит аргумент к числу: `isNaN('hello') → true`, хотя 'hello' — строка. `Number.isNaN('hello') → false` — корректно.

**Q4: Что такое nullish значения?**

`null` и `undefined`. Оператор `??` возвращает правый операнд только если левый `null` или `undefined`. В отличие от `||`, который реагирует на все falsy значения (включая `0`, `''`, `false`).

**Q5: Чему равно `null == undefined` и `null === undefined`?**

`null == undefined → true` — специальное правило Abstract Equality: они равны только друг другу через `==`. `null === undefined → false` — разные типы. Это единственный случай где `== null` может быть полезен.

**Q6: Как NaN появляется в коде?**

При некорректных числовых операциях: `Number('text')`, `0/0`, `Math.sqrt(-1)`, `undefined + 0`, `Infinity - Infinity`. NaN "заражает" — любая операция с NaN возвращает NaN. Единственный способ сломать цепочку: явная проверка через `Number.isNaN`.

**Q7: Как безопасно прочитать вложенное свойство?**

Optional chaining: `obj?.a?.b?.c` — вернёт `undefined` при любом null/undefined в цепочке, без TypeError. Комбинация с `??`: `obj?.a?.b?.c ?? 'default'`. До ES2020: ручные проверки с `&&`.

**Q8: Чем `Number.isNaN` отличается от `Number.isFinite`?**

`Number.isNaN(x)` → `true` только если `x === NaN`. `Number.isFinite(x)` → `true` если `x` — конечное число (не NaN, не Infinity, не -Infinity, не строка). Используй `Number.isFinite` для проверки что значение является "настоящим числом".

---

### Практическое задание

Реализуй `safeGet(obj, path, defaultValue)` и `safeSet(obj, path, value)` (иммутабельное обновление):

```javascript
safeGet(data, 'user.profile.name')              // 'Alice'
safeGet(data, 'user.settings.notifications', true) // false (не заменяется!)
safeGet(data, 'items.0.id')                     // 1
safeGet(null, 'any.path', 'fallback')           // 'fallback'

const updated = safeSet(data, 'user.profile.name', 'Bob');
data.user.profile.name    // 'Alice' — оригинал не изменился
updated.user.profile.name // 'Bob' ✓
// Structural sharing: незатронутые части — те же объекты
updated.user.settings === data.user.settings // true
```

---

### Решение

```javascript
// safeGet — безопасное чтение вложенных свойств
function safeGet(obj, path, defaultValue = undefined) {
  if (obj == null) return defaultValue;

  const keys = Array.isArray(path)
    ? path
    : path.split('.').filter(k => k.length > 0);

  let current = obj;
  for (const key of keys) {
    if (current == null) return defaultValue;
    current = Object.prototype.hasOwnProperty.call(current, key)
      ? current[key]
      : undefined;
  }

  // undefined = "не существует" → defaultValue
  // null = "существует и равно null" → возвращаем null
  return current === undefined ? defaultValue : current;
}

// safeSet — иммутабельное обновление (structural sharing)
function safeSet(obj, path, value) {
  const keys = Array.isArray(path)
    ? path
    : path.split('.').filter(k => k.length > 0);

  function setNested(current, remainingKeys) {
    if (remainingKeys.length === 0) return value;
    const [head, ...tail] = remainingKeys;
    const currentObj = current == null ? {} : current;
    return {
      ...currentObj,                          // копируем всё
      [head]: setNested(currentObj[head], tail) // обновляем только ветку
    };
  }

  return setNested(obj, keys);
}

// Тесты
const data = {
  user: {
    profile: { name: 'Alice', age: 30 },
    settings: { theme: 'dark', notifications: false },
  },
  items: [{ id: 1 }, { id: 2 }],
};

console.assert(safeGet(data, 'user.profile.name') === 'Alice');
// false НЕ заменяется дефолтом true (false !== undefined)
console.assert(safeGet(data, 'user.settings.notifications', true) === false);
console.assert(safeGet(data, 'items.0.id') === 1);
console.assert(safeGet(null, 'any.path', 'fallback') === 'fallback');

const updated = safeSet(data, 'user.profile.name', 'Bob');
console.assert(data.user.profile.name === 'Alice', 'Оригинал не изменился');
console.assert(updated.user.profile.name === 'Bob', 'Обновление применено');
console.assert(updated.user.settings === data.user.settings, 'Structural sharing');

console.log('Все тесты прошли ✓');
```

> **Инсайт:** Structural sharing — ключевая оптимизация Immer.js, Immutable.js и Redux Toolkit. При обновлении `user.profile.name` не нужно копировать `items`, `user.settings` и другие ветки — они остаются теми же ссылками. Это делает иммутабельные обновления эффективными: мы создаём новые объекты только по пути изменения, всё остальное разделяется.

---

*Конец Раздела 2 (Темы 4–6)*  
*Следующий файл: `section_3_functions.md` — Раздел 3 (Функции, темы 7–9) + Раздел 4 (ООП, темы 12–13)*
