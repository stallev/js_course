# Контент курса — Раздел 6: Современный синтаксис

> **Курс:** JavaScript для Middle FullStack Interview  
> **Стек:** Next.js · React · TypeScript  
> **Охват:** Раздел 6 — Темы 19–22 (Деструктуризация · Array API · Map/Set/WeakMap · Optional Chaining/Nullish)

---

# Раздел 6 — Современный синтаксис

*ES6+ добавил синтаксические конструкции, которые делают код выразительным и лаконичным. Деструктуризация и spread — ежедневные инструменты каждого React-разработчика. Array API, Map и Set — правильные структуры данных для правильных задач. Optional chaining и nullish coalescing — элегантное решение проблемы null/undefined (🔗 Тема 6).*

🔗 **Связь с разделами:** Значение vs Ссылка (Тема 5) объясняет почему spread создаёт новую ссылку. Иммутабельность (Раздел 8) использует паттерны из этого раздела.

---

## Тема 19 — Деструктуризация и spread

← Предыдущая тема: [18 — Контекст this и bind/call/apply]

---

### 1. Теория с аналогиями

**Аналогия: разобрать чемодан**

Представьте, что вы вернулись из отпуска. Ваш чемодан — это объект. Вы открываете его и достаёте только нужные вещи, называя их своими именами: рубашку кладёте в шкаф как `shirt`, книгу — на полку как `book`. Оставшееся барахло можно сложить обратно в `...rest`. Именно так работает деструктуризация.

```
Объект (чемодан):
{ name, age, address: { city, zip }, hobbies: [...] }
         ↓  деструктуризация
{ name, age } = пакуем нужное
...rest       = всё остальное
```

---

#### Объектная деструктуризация

```typescript
const user = {
  id: 1,
  name: 'Alice',
  role: 'admin',
  address: { city: 'Moscow', zip: '101000' },
};

// Базовая
const { name, role } = user;

// Переименование: берём name, называем локально как userName
const { name: userName, role: userRole } = user;

// Дефолтные значения: если поля нет — используем запасное
const { name, isActive = false, score = 0 } = user;
// isActive → false (поля нет), score → 0 (поля нет)

// Вложенная деструктуризация
const { address: { city, zip } } = user;
// city === 'Moscow', zip === '101000'

// Rest: берём name, остальное — в meta
const { name: n, ...meta } = user;
// meta === { id: 1, role: 'admin', address: {...} }
```

---

#### Массивная деструктуризация

```typescript
const colors = ['red', 'green', 'blue', 'yellow'];

// Базовая: позиция важна
const [first, second] = colors;
// first === 'red', second === 'green'

// Пропуск элементов через запятую
const [, , third] = colors;
// third === 'blue'

// Rest: первый элемент отдельно, остальные — в хвост
const [head, ...tail] = colors;
// head === 'red', tail === ['green', 'blue', 'yellow']

// Swap переменных без temp-переменной
let a = 1, b = 2;
[a, b] = [b, a];
// a === 2, b === 1

// Из функций, возвращающих массив (как useState в React)
function getCoords(): [number, number] {
  return [55.7558, 37.6173];
}
const [lat, lon] = getCoords();
```

---

#### Spread оператор `...`

```typescript
// В массивах: создаём новый массив из элементов
const nums = [1, 2, 3];
const moreNums = [...nums, 4, 5];        // [1, 2, 3, 4, 5]
const copy = [...nums];                   // поверхностная копия

// В объектах: сливаем объекты, последний ключ побеждает
const defaults = { theme: 'light', lang: 'en' };
const userPrefs = { lang: 'ru' };
const config = { ...defaults, ...userPrefs };
// { theme: 'light', lang: 'ru' }

// В вызовах функций: разворачиваем массив в аргументы
const points = [10, 3, 7, 1];
Math.max(...points); // 10
```

---

#### Rest параметры в функциях

```typescript
// rest собирает оставшиеся аргументы в массив
function sum(first: number, ...rest: number[]): number {
  return rest.reduce((acc, n) => acc + n, first);
}
sum(1, 2, 3, 4); // 10

// В отличие от arguments:
// - rest — настоящий Array со всеми методами
// - arguments недоступен в стрелочных функциях
// - rest может быть не первым (но только последним!)
```

---

### 2. Связь со стеком

#### Деструктуризация пропсов React с дефолтами

```tsx
// ❌ Без деструктуризации — verbose и трудно читать
function Button(props: ButtonProps) {
  return (
    <button
      disabled={props.disabled}
      className={props.variant === 'primary' ? 'btn-primary' : 'btn'}
    >
      {props.children}
    </button>
  );
}

// ✅ С деструктуризацией + дефолты прямо в параметрах
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ children, variant = 'secondary', disabled = false }: ButtonProps) {
  return (
    <button disabled={disabled} className={`btn-${variant}`}>
      {children}
    </button>
  );
}
```

#### Rest props для прозрачной передачи HTML-атрибутов

```tsx
// Паттерн: компонент-обёртка пробрасывает все нативные атрибуты
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function Input({ label, error, ...rest }: InputProps) {
  // rest содержит все стандартные атрибуты: type, placeholder, onChange, etc.
  return (
    <div>
      <label>{label}</label>
      <input {...rest} className={error ? 'input-error' : 'input'} />
      {error && <span>{error}</span>}
    </div>
  );
}

// Использование — все нативные атрибуты работают автоматически
<Input label="Email" type="email" placeholder="user@example.com" required />
```

#### Spread для иммутабельного обновления state

```tsx
// В React state нельзя мутировать напрямую — нужна новая ссылка
// 🔗 Связь с темой 5 (значение vs ссылка)

const [profile, setProfile] = useState({
  name: 'Alice',
  settings: { theme: 'light', notifications: true },
});

// ✅ Иммутабельное обновление вложенного объекта
setProfile(prev => ({
  ...prev,                          // копируем верхний уровень
  settings: {
    ...prev.settings,               // копируем вложенный объект
    theme: 'dark',                  // перезаписываем нужное поле
  },
}));
```

---

### 3. Лучшие паттерны

#### Паттерн 1 — Именованные параметры через деструктуризацию

```typescript
// ❌ Позиционные параметры: нужно помнить порядок, легко перепутать
function createUser(name: string, age: number, role: string, isActive: boolean) {
  // при вызове: createUser('Alice', 25, 'admin', true) — какой порядок?
}

// ✅ Объект + деструктуризация: именованные, порядок неважен, дефолты встроены
interface CreateUserParams {
  name: string;
  age: number;
  role?: string;
  isActive?: boolean;
}

function createUser({ name, age, role = 'user', isActive = true }: CreateUserParams) {
  return { name, age, role, isActive };
}

createUser({ name: 'Alice', age: 25 }); // role и isActive получат дефолты
```

**Объяснение:** Именованные параметры самодокументируются при вызове. Дефолты задаются один раз в сигнатуре. Добавление нового необязательного параметра не ломает существующие вызовы.

---

#### Паттерн 2 — Rest props для расширяемых компонентов

```tsx
// ❌ Явно перечислять каждый HTML-атрибут — постоянные добавления
function Button({ children, onClick, disabled, className, type }: any) {
  return <button onClick={onClick} disabled={disabled} ...>
}

// ✅ Разделяем кастомные пропсы и HTML-атрибуты через rest
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger';
  loading?: boolean;
}

function Button({ variant = 'primary', loading = false, children, ...htmlProps }: ButtonProps) {
  return (
    <button
      {...htmlProps}                            // все нативные атрибуты
      disabled={loading || htmlProps.disabled}  // расширяем логику
      className={`btn-${variant} ${htmlProps.className ?? ''}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
```

**Объяснение:** Компонент остаётся открытым для расширения (Open/Closed Principle). Пользователь может передать любой нативный атрибут без изменения интерфейса компонента.

---

#### Паттерн 3 — Иммутабельные обновления массива через spread

```typescript
// ❌ Мутация массива в state — React не увидит изменение
const [items, setItems] = useState([1, 2, 3]);
// НЕПРАВИЛЬНО:
items.push(4);
setItems(items); // та же ссылка → перерендера не будет!

// ✅ Создаём новый массив
// Добавление:
setItems(prev => [...prev, 4]);

// Удаление по индексу:
setItems(prev => prev.filter((_, i) => i !== indexToRemove));

// Обновление элемента по индексу:
setItems(prev => prev.map((item, i) => i === indexToUpdate ? newValue : item));

// Вставка в позицию:
setItems(prev => [...prev.slice(0, pos), newItem, ...prev.slice(pos)]);
```

**Объяснение:** React использует сравнение ссылок (`Object.is`) для определения необходимости перерендера. Мутация меняет содержимое, но не ссылку — React не триггерит ре-рендер. Spread всегда создаёт новый объект/массив.

---

### 4. Вопросы интервью

**Q1: Что такое деструктуризация и как она работает под капотом?**

Деструктуризация — это синтаксический сахар для извлечения значений из массивов или свойств объектов в отдельные переменные. Под капотом компилятор разворачивает её в серию присваиваний. Для объектов используется доступ по ключу: `const { a } = obj` → `const a = obj.a`. Для массивов используется итератор: `const [x] = arr` → `const x = arr[0]`. Деструктуризация не копирует вложенные объекты — она лишь создаёт новые переменные, указывающие на те же ссылки. Поэтому изменение деструктурированного объекта отразится на оригинале.

**Q2: Что такое spread оператор и чем он отличается от rest?**

Оба записываются как `...`, но работают в противоположных направлениях. Spread разворачивает итерируемое в отдельные элементы: `Math.max(...arr)` — мы "рассыпаем" массив. Rest, напротив, собирает оставшиеся элементы в массив или объект: `const { a, ...rest } = obj` — мы "собираем" остаток. Spread используется в выражениях (правая часть присваивания, аргументы функции), rest — в паттернах деструктуризации и параметрах функций. Spread создаёт поверхностную копию — вложенные объекты копируются по ссылке.

**Q3: Как работают дефолтные значения при деструктуризации?**

Дефолтное значение применяется только тогда, когда извлекаемое значение строго равно `undefined`. Это принципиально важно: `null`, `0`, `false`, `''` — не триггерят дефолт. Пример: `const { a = 10 } = { a: null }` → `a === null` (не 10!), но `const { b = 10 } = {}` → `b === 10`. Это поведение симметрично параметрам функций с дефолтами. Именно поэтому для обработки `null` нужно использовать `??` (nullish coalescing, 🔗 Тема 22).

**Q4: Как деструктуризация помогает в React-разработке?**

Деструктуризация пропсов делает функциональные компоненты чище: видно все принимаемые параметры с дефолтами прямо в сигнатуре. Деструктуризация массива используется с хуками: `const [state, setState] = useState(...)` — React возвращает пару [значение, сеттер], и разработчик называет их как угодно. Rest props (`...htmlProps`) позволяют создавать расширяемые компоненты-обёртки без явного перечисления всех нативных атрибутов. При работе с контекстом или кастомными хуками деструктуризация позволяет сразу извлечь нужные части: `const { user, login, logout } = useAuth()`.

**Q5: Чем spread отличается от `Object.assign`?**

Оба создают поверхностную копию, но есть различия. `Object.assign(target, source)` мутирует `target` и возвращает его, что может приводить к неожиданным побочным эффектам. Spread `{ ...source }` всегда создаёт новый объект. Spread не копирует не-перечисляемые свойства и не наследуемые от прототипа (аналогично `Object.assign`). Spread лаконичнее и читаемее. Важный нюанс: оба не копируют свойства с символами-ключами — для этого нужен `Object.assign` с дескрипторами или `Object.defineProperties`.

**Q6: Как деструктурировать Map или Set?**

Map и Set реализуют протокол итерации, поэтому с ними работает массивная деструктуризация. `const [first] = new Set([1, 2, 3])` → `first === 1`. Для Map: `const [[key, value]] = new Map([['a', 1]])` — каждая запись Map сама является парой `[key, value]`. Можно использовать `Array.from(map)` для явного преобразования. Объектная деструктуризация с Map/Set не работает, так как Map хранит данные не как обычные свойства объекта, а во внутренней структуре — `const { size } = myMap` даст только встроенное свойство `size`, но не данные.

**Q7: Как сделать swap переменных без временной переменной?**

С массивной деструктуризацией это делается в одну строку: `[a, b] = [b, a]`. Справа создаётся временный массив `[b, a]`, затем деструктуризация слева присваивает `a = b` и `b = a` (значения из временного массива). До ES6 требовалась temp: `const temp = a; a = b; b = temp`. Это не просто синтаксический сахар — JavaScript-движки оптимизируют этот паттерн и могут делать swap без создания heap-объекта.

**Q8: Что происходит при деструктуризации `null` или `undefined`?**

Попытка деструктурировать `null` или `undefined` бросает `TypeError: Cannot destructure property 'x' of null`. Это частая ошибка при работе с API-ответами. Защита: использовать дефолтное значение на уровне деструктуризации: `const { name } = user ?? {}` — если `user` равен `null/undefined`, деструктурируем пустой объект. Для массивов: `const [first = 'default'] = arr ?? []`. Это сочетание nullish coalescing (🔗 Тема 22) с деструктуризацией — стандартный защитный паттерн.

**Q9: Можно ли деструктурировать в цикле и при итерации?**

Да, деструктуризация отлично работает в `for...of` и методах массива. `for (const { id, name } of users) { ... }` — очень читаемо. В `forEach`: `users.forEach(({ id, name }) => ...)`. В `map`: `users.map(({ id, name }) => ({ id, label: name }))`. При итерации `Object.entries()` деструктурируют пару: `for (const [key, value] of Object.entries(obj)) { ... }`. Это делает работу с коллекциями объектов значительно выразительнее, чем `item.id`, `item.name` в каждой строке.

---

### 5. Практическое задание

**Задача: Реализовать утилиты `pick`, `omit` и `rename`**

Эти три функции — базовые строительные блоки для трансформации объектов в TypeScript/JavaScript проектах. Реализуйте их с корректной типизацией:

```typescript
// pick: берёт только указанные ключи из объекта
pick({ name: 'Alice', age: 25, role: 'admin' }, ['name', 'role'])
// → { name: 'Alice', role: 'admin' }

// omit: исключает указанные ключи
omit({ name: 'Alice', age: 25, role: 'admin' }, ['age'])
// → { name: 'Alice', role: 'admin' }

// rename: переименовывает ключи согласно маппингу
rename({ firstName: 'Alice', lastName: 'Smith' }, { firstName: 'name', lastName: 'surname' })
// → { name: 'Alice', surname: 'Smith' }
```

Требования:
- Корректная TypeScript-типизация (генерики)
- Использование деструктуризации и spread там, где уместно
- Функции не мутируют исходный объект

---

### 6. Решение с инсайтом

```typescript
// pick: Extract<keyof T, K> гарантирует, что ключи существуют в T
function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((acc, key) => {
    // деструктуризация в параметре reduce
    acc[key] = obj[key];
    return acc;
  }, {} as Pick<T, K>);
}

// Альтернатива через Object.fromEntries + деструктуризация в filter
function pickAlt<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const keySet = new Set(keys as string[]); // 🔗 Тема 21 (Set для O(1) поиска)
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => keySet.has(key))
  ) as Pick<T, K>;
}

// omit: Omit<T, K> — встроенный utility type TypeScript
function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const { ...result } = obj; // копия через rest
  keys.forEach(key => delete result[key]);
  return result as Omit<T, K>;
}

// Чистый вариант без мутации через деструктуризацию
function omitClean<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const keySet = new Set(keys as string[]);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keySet.has(key))
  ) as Omit<T, K>;
}

// rename: маппинг ключей с помощью Object.fromEntries
function rename<T extends object>(
  obj: T,
  mapping: Partial<Record<keyof T, string>>
): object {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      mapping[key as keyof T] ?? key, // если ключ есть в маппинге — переименуем, иначе оставим
      value,
    ])
  );
}

// Тесты
const user = { name: 'Alice', age: 25, role: 'admin', password: 'secret' };

console.log(pick(user, ['name', 'role']));
// { name: 'Alice', role: 'admin' }

console.log(omitClean(user, ['password', 'age']));
// { name: 'Alice', role: 'admin' }

console.log(rename({ firstName: 'Alice', lastName: 'Smith' }, { firstName: 'name', lastName: 'surname' }));
// { name: 'Alice', surname: 'Smith' }
```

**Ключевой инсайт:** `pick` и `omit` — это два взгляда на одну задачу (белый список vs чёрный список). Использование `Set` для хранения ключей превращает поиск из O(n) в O(1) — критично при большом количестве ключей. Функция `rename` использует `??` вместо `||`, чтобы не потерять ключи со значением `''` (пустая строка — falsy, но это валидный ключ).

---

→ Следующая тема: [20 — Array API]

---

## Тема 20 — Array API

← Предыдущая тема: [19 — Деструктуризация и spread]

---

### 1. Теория с аналогиями

**Классификация методов массива**

Array API — это богатый набор инструментов. Ошибка новичков — знать только `push`, `pop`, `map`, `filter`. Разберём полную классификацию:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Array Methods Map                             │
├──────────────────┬──────────────────────────────────────────────┤
│  ТРАНСФОРМАЦИЯ   │  map, flatMap, flat                          │
├──────────────────┼──────────────────────────────────────────────┤
│  ПОИСК           │  find, findIndex, findLast*, findLastIndex*  │
│                  │  indexOf, includes, some, every              │
├──────────────────┼──────────────────────────────────────────────┤
│  СВЁРТКА         │  reduce, reduceRight                         │
├──────────────────┼──────────────────────────────────────────────┤
│  ИТЕРАЦИЯ        │  forEach, entries, keys, values              │
├──────────────────┼──────────────────────────────────────────────┤
│  МУТИРУЮЩИЕ      │  push, pop, shift, unshift, splice, sort,   │
│                  │  reverse, fill, copyWithin                   │
├──────────────────┼──────────────────────────────────────────────┤
│  КОПИРУЮЩИЕ      │  slice, concat, filter, map, toSorted*,     │
│  (не мутируют)   │  toReversed*, with*, toSpliced*             │
├──────────────────┼──────────────────────────────────────────────┤
│  СОЗДАНИЕ        │  Array.from, Array.of, Array.isArray        │
├──────────────────┼──────────────────────────────────────────────┤
│  * ES2023+       │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

---

#### Мутирующие vs иммутабельные — критически важное различие

```typescript
const nums = [3, 1, 4, 1, 5];

// ❌ sort МУТИРУЕТ оригинал!
const sorted = nums.sort((a, b) => a - b);
console.log(nums);   // [1, 1, 3, 4, 5] — ОРИГИНАЛ ИЗМЕНЁН
console.log(sorted === nums); // true — это одна ссылка!

// ✅ toSorted (ES2023) возвращает новый массив
const sortedCopy = nums.toSorted((a, b) => a - b);
console.log(nums);       // [3, 1, 4, 1, 5] — не изменён
console.log(sortedCopy); // [1, 1, 3, 4, 5] — новый массив

// Аналогично: reverse vs toReversed
const arr = [1, 2, 3];
arr.reverse();              // мутирует arr
const rev = arr.toReversed(); // новый массив
```

---

#### Ловушка `sort` без compareFn

```typescript
// ❌ Сортировка чисел без compareFn — конвертация в строки!
[1, 10, 2, 20, 3].sort();
// → [1, 10, 2, 20, 3] ... нет: ['1','10','2','20','3'] лексикографически
// Результат: [1, 10, 2, 20, 3] → [1, 10, 2, 20, 3]
// По факту: ['1', '10', '2', '20', '3'].sort() → ['1', '10', '2', '20', '3']

[100, 9, 20].sort();            // [100, 20, 9] — НЕПРАВИЛЬНО!
[100, 9, 20].sort((a, b) => a - b); // [9, 20, 100] — правильно

// Строки тоже нужно сортировать явно для локалей
['яблоко', 'апельсин', 'банан'].sort();
// Ненадёжно для кириллицы — используйте localeCompare
['яблоко', 'апельсин', 'банан'].sort((a, b) => a.localeCompare(b, 'ru'));
```

---

#### Новые методы ES2022–2023

```typescript
const arr = [10, 20, 30, 40, 50];

// at() — доступ по индексу с конца (отрицательные индексы)
arr.at(0);   // 10
arr.at(-1);  // 50 (последний)
arr.at(-2);  // 40 (предпоследний)
// До ES2022: arr[arr.length - 1] — громоздко

// findLast() / findLastIndex() — поиск с конца
const events = [
  { type: 'click', id: 1 },
  { type: 'scroll', id: 2 },
  { type: 'click', id: 3 },
];
events.findLast(e => e.type === 'click'); // { type: 'click', id: 3 }
// find() нашёл бы первый (id: 1)

// with() — копирующее обновление по индексу (ES2023)
const updated = arr.with(2, 99); // [10, 20, 99, 40, 50]
// arr не изменён

// toSpliced() — копирующий splice (ES2023)
const spliced = arr.toSpliced(1, 2, 99); // [10, 99, 40, 50]
// arr не изменён

// flatMap() — map + flat(1) за один проход
const sentences = ['hello world', 'foo bar'];
sentences.flatMap(s => s.split(' ')); // ['hello', 'world', 'foo', 'bar']
// Эффективнее чем .map(...).flat()
```

---

#### Array.from — создание массивов из итерируемых

```typescript
// Из строки
Array.from('hello'); // ['h', 'e', 'l', 'l', 'o']

// Из Set (удаление дубликатов + в массив)
Array.from(new Set([1, 2, 2, 3])); // [1, 2, 3]

// Из NodeList (DOM)
Array.from(document.querySelectorAll('li')); // настоящий Array

// С маппинг-функцией: создать массив из N элементов
Array.from({ length: 5 }, (_, i) => i * 2); // [0, 2, 4, 6, 8]

// Эквивалент spread (но Array.from работает с псевдомассивами)
[...document.querySelectorAll('li')]; // тоже работает
```

---

### 2. Связь со стеком

#### Рендер списков в React

```tsx
// map — основа рендера списков
// Всегда нужен уникальный key для React reconciliation
interface User { id: number; name: string; active: boolean }

function UserList({ users }: { users: User[] }) {
  return (
    <ul>
      {users
        .filter(u => u.active)                            // фильтруем
        .toSorted((a, b) => a.name.localeCompare(b.name)) // сортируем (не мутируем state!)
        .map(({ id, name }) => (                          // деструктуризация в map
          <li key={id}>{name}</li>
        ))
      }
    </ul>
  );
}
```

#### Иммутабельные операции для state

```typescript
// В Next.js App Router серверные компоненты часто трансформируют данные
// Используем копирующие методы — никакой мутации

async function getPageData() {
  const products = await fetchProducts();

  return {
    // toSorted — ES2023, не мутирует оригинал
    byPrice: products.toSorted((a, b) => a.price - b.price),
    // filter + map — всегда иммутабельны
    featured: products.filter(p => p.featured).map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
    })),
    // reduce для агрегации
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
  };
}
```

#### Array.from для работы с DOM и итерируемыми

```typescript
// В Next.js: работа с FormData (итерируемый)
async function handleSubmit(formData: FormData) {
  const fields = Object.fromEntries(formData.entries());

  // Мультивыбор возвращает псевдомассив — нужен Array.from
  const selectedIds = Array.from(formData.getAll('ids')).map(Number);
}
```

---

### 3. Лучшие паттерны

#### Паттерн 1 — Предпочитать копирующие методы в React state

```typescript
// ❌ Мутирующие методы ломают React state management
const [items, setItems] = useState([3, 1, 4, 1, 5]);

const handleSort = () => {
  items.sort(); // мутирует! React не видит изменение
  setItems(items); // та же ссылка → нет ре-рендера
};

// ✅ Копирующие методы всегда создают новый массив
const handleSort = () => {
  setItems(prev => prev.toSorted((a, b) => a - b)); // новая ссылка → ре-рендер
};

const handleReverse = () => {
  setItems(prev => prev.toReversed()); // ES2023
};

const handleUpdate = (index: number, value: number) => {
  setItems(prev => prev.with(index, value)); // ES2023, копирующий аналог arr[i] = v
};
```

**Объяснение:** React определяет необходимость ре-рендера через сравнение ссылок. Мутирующие методы (`sort`, `reverse`, `splice`) изменяют содержимое, но сохраняют ссылку — React считает, что ничего не изменилось.

---

#### Паттерн 2 — Читаемые цепочки трансформаций

```typescript
// ❌ Вложенные вызовы — читать справа налево, трудно следить
const result = Array.from(
  new Set(
    data
      .filter(x => x.active)
      .map(x => x.category)
  )
);

// ✅ Цепочка — читать сверху вниз
const categories = data
  .filter(item => item.active)           // 1. только активные
  .map(item => item.category)            // 2. берём категорию
  .filter((cat, i, arr) => arr.indexOf(cat) === i); // 3. уникальные (без Set)

// Ещё лучше — с Set для уникальности (🔗 Тема 21)
const uniqueCategories = [...new Set(
  data.filter(item => item.active).map(item => item.category)
)];

// Для сложных трансформаций — именованные шаги
const activeItems = data.filter(item => item.active);
const categories = activeItems.map(item => item.category);
const uniqueCategories2 = [...new Set(categories)];
```

**Объяснение:** Цепочки читаются как конвейер обработки данных. Каждый шаг имеет чёткую ответственность. При отладке можно вставить `console.log` или `.filter(x => (console.log(x), true))` между шагами.

---

#### Паттерн 3 — Array.from для создания массивов из итерируемых

```typescript
// ❌ Ручное создание диапазонов — громоздко
const range: number[] = [];
for (let i = 0; i < 10; i++) range.push(i);

// ✅ Array.from с маппером — лаконично и функционально
const range = Array.from({ length: 10 }, (_, i) => i);        // [0..9]
const range1to10 = Array.from({ length: 10 }, (_, i) => i + 1); // [1..10]
const evens = Array.from({ length: 5 }, (_, i) => i * 2);     // [0,2,4,6,8]

// ✅ Для skeleton-загрузки в React
function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonItem key={i} />
      ))}
    </>
  );
}

// ✅ Конвертация любого итерируемого
const mapEntries = Array.from(new Map([['a', 1], ['b', 2]]));
// [['a', 1], ['b', 2]]
```

**Объяснение:** `Array.from({ length: N }, mapper)` — идиоматичный способ создания массивов заданного размера. `{ length: N }` — псевдомассив, `Array.from` итерирует по нему, вызывая mapper с `(value, index)`. `value` всегда `undefined`, поэтому используем `_`.

---

### 4. Вопросы интервью

**Q1: Какие методы массива мутируют оригинал?**

Мутирующие методы: `push`, `pop`, `shift`, `unshift` (изменяют длину), `sort`, `reverse` (меняют порядок), `splice` (удаление/вставка), `fill` (заполнение), `copyWithin`. Все остальные методы (`map`, `filter`, `reduce`, `slice`, `concat`, `find`, `findIndex`, `some`, `every`, `flat`, `flatMap`) возвращают новый результат, не трогая оригинал. ES2023 добавил копирующие аналоги для мутирующих: `toSorted`, `toReversed`, `toSpliced`, `with` — теперь для каждой мутирующей операции есть иммутабельная альтернатива.

**Q2: В чём разница между `find` и `filter`?**

`find` возвращает **первый** найденный элемент или `undefined` — он останавливается при первом совпадении. `filter` возвращает **новый массив** всех подходящих элементов — он проходит по всему массиву. `find` используют, когда нужен один элемент (например, найти пользователя по id), `filter` — когда нужны все совпадения (все активные пользователи). По производительности: `find` быстрее при раннем совпадении, так как прекращает итерацию.

**Q3: Почему `[1, 10, 2].sort()` даёт неожиданный результат?**

Без compareFn метод `sort` конвертирует элементы в строки и сортирует лексикографически. `'10'` лексикографически меньше `'2'`, потому что `'1' < '2'`. Результат: `[1, 10, 2]`. Для числовой сортировки нужна compareFn: `arr.sort((a, b) => a - b)`. Логика compareFn: отрицательное число → a перед b, положительное → b перед a, ноль → порядок сохраняется. Это одна из самых частых ошибок на интервью и в продакшне.

**Q4: Что такое `flatMap` и когда его использовать?**

`flatMap` — комбинация `map` + `flat(1)`, выполненная за один проход. Идеален, когда функция маппинга возвращает массив, а нам нужен плоский результат. Пример: разбить предложения на слова: `sentences.flatMap(s => s.split(' '))`. Или раскрыть вложенные массивы тегов: `posts.flatMap(p => p.tags)`. Важно: flat только на глубину 1. Для глубокой вложенности нужен `flat(Infinity)` или рекурсия. `flatMap` эффективнее `map().flat()`, так как создаёт только один промежуточный массив.

**Q5: Что такое метод `at()` и зачем он нужен?**

`at(n)` возвращает элемент по индексу, поддерживая отрицательные значения для доступа с конца. `arr.at(-1)` — последний элемент, `arr.at(-2)` — предпоследний. До ES2022 для последнего элемента писали `arr[arr.length - 1]` — громоздко и требует знания длины. `at()` работает на массивах, строках и TypedArray. Особенно полезен в цепочках, где нет промежуточной переменной для хранения длины: `getUsers().at(-1)?.name` элегантнее чем `const u = getUsers(); u[u.length - 1]?.name`.

**Q6: Как удалить дубликаты из массива?**

Самый лаконичный способ: `[...new Set(arr)]` или `Array.from(new Set(arr))`. Set хранит только уникальные значения, затем spread/Array.from конвертирует обратно в массив. Сложность: O(n). Для объектов нужно уточнить критерий уникальности: `arr.filter((item, i, a) => a.findIndex(x => x.id === item.id) === i)` — O(n²), но работает для объектов. Лучше для объектов: `[...new Map(arr.map(item => [item.id, item])).values()]` — O(n) с использованием Map (🔗 Тема 21).

**Q7: В чём разница `some` и `every`?**

`some` возвращает `true` если **хотя бы один** элемент соответствует предикату (логическое ИЛИ). `every` возвращает `true` если **все** элементы соответствуют (логическое И). Оба прекращают итерацию при раннем решении: `some` — при первом `true`, `every` — при первом `false`. Оба возвращают булевое значение, в отличие от `find`/`findIndex`. Частый паттерн: `items.every(item => item.loaded)` для проверки что все данные загружены, `errors.some(e => e.critical)` для проверки критических ошибок.

**Q8: Как работает `reduce` и когда его использовать?**

`reduce(fn, initialValue)` обходит массив, аккумулируя результат. Функция получает `(accumulator, currentValue, index, array)`. `initialValue` критически важен: без него первый элемент становится начальным аккумулятором, что ломает работу с пустыми массивами. `reduce` универсален: сумма, произведение, группировка, создание объекта из массива, уплощение. Для сложных трансформаций `reduce` читается хуже цепочек `filter/map` — выбирайте по контексту. Производительность `reduce` сопоставима с циклом `for`.

**Q9: Что такое `Array.isArray` и почему `typeof` недостаточно?**

`typeof []` возвращает `'object'` — массивы в JS это объекты. `Array.isArray([])` → `true`, это единственный надёжный способ проверить что значение является массивом. Актуально при работе с данными из API или при написании универсальных функций. В TypeScript есть type guard: `if (Array.isArray(value)) { /* value имеет тип any[] */ }`. `instanceof Array` не работает при передаче массива из другого iframe/realm (разные контексты выполнения имеют разные конструкторы Array). `Array.isArray` работает корректно во всех контекстах.

---

### 5. Практическое задание

**Задача: Реализовать `groupBy`, `sortBy`, `uniqueBy`**

```typescript
// groupBy: группировать массив объектов по ключу
groupBy(users, 'role')
// → { admin: [{ name: 'Alice', role: 'admin' }], user: [...] }

// sortBy: сортировать по полю (с направлением)
sortBy(users, 'name')           // по возрастанию
sortBy(users, 'age', 'desc')    // по убыванию

// uniqueBy: убрать дубликаты по ключу
uniqueBy(users, 'id')           // уникальные по id
uniqueBy(items, item => item.category + item.type) // по составному ключу
```

Требования:
- `groupBy` принимает ключ или функцию-экстрактор
- `sortBy` поддерживает `'asc'` и `'desc'`, не мутирует оригинал
- `uniqueBy` принимает ключ или функцию, сохраняет первое вхождение
- TypeScript-типизация

---

### 6. Решение с инсайтом

```typescript
type KeyExtractor<T> = keyof T | ((item: T) => string | number);

function getKey<T>(item: T, extractor: KeyExtractor<T>): string | number {
  return typeof extractor === 'function'
    ? extractor(item)
    : (item[extractor] as unknown as string | number);
}

// groupBy: reduce в Map, затем Object.fromEntries
function groupBy<T>(array: T[], key: KeyExtractor<T>): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(getKey(item, key));
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// sortBy: toSorted — иммутабельно!
function sortBy<T>(
  array: T[],
  key: KeyExtractor<T>,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  const multiplier = direction === 'asc' ? 1 : -1;
  return array.toSorted((a, b) => {
    const aVal = getKey(a, key);
    const bVal = getKey(b, key);
    if (aVal < bVal) return -1 * multiplier;
    if (aVal > bVal) return 1 * multiplier;
    return 0;
  });
}

// uniqueBy: Map для O(n) уникальности
function uniqueBy<T>(array: T[], key: KeyExtractor<T>): T[] {
  const seen = new Map<string | number, true>(); // 🔗 Тема 21 (Map)
  return array.filter(item => {
    const k = getKey(item, key);
    if (seen.has(k)) return false;
    seen.set(k, true);
    return true;
  });
}

// Тесты
const users = [
  { id: 1, name: 'Charlie', age: 30, role: 'admin' },
  { id: 2, name: 'Alice', age: 25, role: 'user' },
  { id: 3, name: 'Bob', age: 25, role: 'admin' },
  { id: 2, name: 'Alice (dup)', age: 25, role: 'user' }, // дубликат id
];

console.log(groupBy(users, 'role'));
// { admin: [Charlie, Bob], user: [Alice, Alice(dup)] }

console.log(sortBy(users, 'name'));
// [Alice, Alice(dup), Bob, Charlie]

console.log(uniqueBy(users, 'id'));
// [Charlie, Alice, Bob] — второй Alice (id:2) удалён

// Составной ключ
console.log(uniqueBy(users, u => `${u.role}-${u.age}`));
```

**Ключевой инсайт:** `uniqueBy` через `Map.has` работает за O(n) — каждый элемент проверяется за O(1). Наивная реализация через `findIndex` была бы O(n²). `sortBy` использует `toSorted` (ES2023) — иммутабельный метод, критичный для React state. `groupBy` будет нативным в JavaScript (`Object.groupBy` — ES2024), но пока полезна кастомная реализация для понимания паттерна.

---

→ Следующая тема: [21 — Map, Set, WeakMap]

---

## Тема 21 — Map, Set, WeakMap

← Предыдущая тема: [20 — Array API]

---

### 1. Теория с аналогиями

**Аналогия для Map: настоящий словарь с любыми ключами**

Обычный объект — это папка с бумажками, где на каждой написан ключ-строка. Map — это профессиональный справочник, где ключом может быть что угодно: строка, число, объект, функция, Symbol. Ключ `document.getElementById('root')` в Map — норма. В обычном объекте DOM-элемент стал бы строкой `"[object HTMLDivElement]"`.

```
Object (папка):                Map (база данных):
┌────────────────────┐         ┌──────────────────────────────┐
│ "name" → "Alice"   │         │ "name"    → "Alice"          │
│ "age"  → "25"      │         │ 42        → "answer"         │
│ toString → ...     │ ←?→     │ {id: 1}   → user object      │
│ __proto__ → ...    │         │ document  → "DOM element"    │
└────────────────────┘         │ size: 4   (встроенное свойство)│
 Прото-цепочка мешает!         └──────────────────────────────┘
```

---

#### Map vs Object — когда что выбирать

| Критерий | Object | Map |
|---|---|---|
| Тип ключей | Только string/Symbol | Любой тип |
| Порядок итерации | Не гарантирован* | По порядку вставки |
| Размер коллекции | `Object.keys(o).length` (O(n)) | `map.size` (O(1)) |
| Итерация | `for...in` (включает прото) | `for...of` (чистая) |
| JSON | `JSON.stringify` работает | Нужна сериализация |
| Производительность | Оптимизирован движком | Лучше для частых добавлений |
| Прото-загрязнение | Возможно (`__proto__`) | Нет |

*Современные движки сохраняют порядок вставки для строковых ключей-не-чисел

```typescript
const map = new Map<string, number>();

map.set('a', 1);
map.set('b', 2);
map.set('a', 10); // перезаписывает

map.get('a');     // 10
map.has('b');     // true
map.delete('b');  // удаляет
map.size;         // 1

// Итерация — всегда по порядку вставки
for (const [key, value] of map) { ... }
map.forEach((value, key) => { ... });
[...map.entries()]; // [[key, value], ...]
[...map.keys()];    // [key, ...]
[...map.values()];  // [value, ...]

// Инициализация из массива пар
const map2 = new Map([['x', 1], ['y', 2]]);
```

---

#### Set — коллекция уникальных значений

```typescript
const set = new Set<number>([1, 2, 3, 2, 1]);
set.size; // 3 — дубликаты отброшены

set.add(4);
set.has(2);    // true
set.delete(1);
set.clear();

// Итерация (порядок — порядок первого добавления)
for (const value of set) { ... }
[...set]; // в массив

// Операции над множествами (ES2024 — Set Methods!)
const a = new Set([1, 2, 3, 4]);
const b = new Set([3, 4, 5, 6]);

// Объединение (union)
const union = a.union(b);             // {1,2,3,4,5,6} — ES2024
const unionManual = new Set([...a, ...b]); // ручной способ

// Пересечение (intersection)
const intersection = a.intersection(b);  // {3,4} — ES2024
const interManual = new Set([...a].filter(x => b.has(x)));

// Разность (difference)
const difference = a.difference(b);      // {1,2} — ES2024
const diffManual = new Set([...a].filter(x => !b.has(x)));

// Симметричная разность
const symDiff = a.symmetricDifference(b); // {1,2,5,6} — ES2024
```

---

#### WeakMap — слабые ссылки и сборщик мусора

**Аналогия: стикер на предмете**

Представьте, что WeakMap — это стикеры, приклеенные к физическим предметам. Если предмет выбросили — стикер с ним. WeakMap не "держит" объект живым. Если единственная ссылка на объект — ключ в WeakMap, сборщик мусора удалит и объект, и связанную запись в WeakMap.

```
Map:        Объект ←──── Map.key   (Map держит ссылку → объект не удаляется)
WeakMap:    Объект ←~~~~ WeakMap.key (слабая ссылка → GC может удалить объект)

Жизненный цикл:
1. const el = document.querySelector('.modal');  // ссылка на DOM
2. cache.set(el, computedData);                  // WeakMap: el → data
3. el.remove(); el = null;                       // DOM удалён, ссылка обнулена
4. GC запускается                               // el удалён из памяти
5. cache автоматически чистится                  // утечки памяти нет!
```

```typescript
const cache = new WeakMap<object, string>();
let obj = { id: 1 };

cache.set(obj, 'cached value');
cache.get(obj); // 'cached value'
cache.has(obj); // true

obj = null; // объект может быть собран GC
// cache автоматически очистится — утечки памяти нет

// Ограничения WeakMap:
// - Ключи только объекты (не примитивы)
// - Нет итерации (нельзя .keys(), .values(), .forEach())
// - Нет .size
// Это намеренно: список ключей зависит от GC — недетерминирован
```

---

### 2. Связь со стеком

#### Map для нормализации данных — O(1) доступ по id

```typescript
// В Next.js App Router: нормализация данных от API
async function getUsersPage() {
  const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);

  // ❌ Наивный подход: find() для каждого поста — O(n²)
  const postsWithAuthor = posts.map(post => ({
    ...post,
    author: users.find(u => u.id === post.authorId), // O(n) каждый раз!
  }));

  // ✅ Map для нормализации — O(1) доступ
  const userMap = new Map(users.map(u => [u.id, u]));
  const postsWithAuthorFast = posts.map(post => ({
    ...post,
    author: userMap.get(post.authorId), // O(1)!
  }));
}
```

#### Set для visited в алгоритмах обхода

```typescript
// Обход графа без циклов (например, граф зависимостей модулей)
function findAllDeps(module: string, graph: Map<string, string[]>): Set<string> {
  const visited = new Set<string>(); // быстрая проверка O(1)
  const queue = [module];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue; // уже обработан
    visited.add(current);

    const deps = graph.get(current) ?? [];
    queue.push(...deps);
  }

  return visited;
}
```

#### WeakMap для кэша привязанного к DOM/объектам

```typescript
// Мемоизация, привязанная к жизненному циклу объекта
const computedStyles = new WeakMap<Element, CSSStyleDeclaration>();

function getComputedStyleCached(el: Element): CSSStyleDeclaration {
  if (!computedStyles.has(el)) {
    computedStyles.set(el, window.getComputedStyle(el));
  }
  return computedStyles.get(el)!;
}
// Когда элемент удалён из DOM и GC удалит его — кэш очистится автоматически
```

---

### 3. Лучшие паттерны

#### Паттерн 1 — Map для O(1) доступа вместо find

```typescript
// ❌ Массив + find: O(n) каждый раз
const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];

function getUserById(id: number) {
  return users.find(u => u.id === id); // O(n) при каждом вызове
}

// ✅ Map: O(1) доступ после O(n) инициализации
const userMap = new Map(users.map(u => [u.id, u]));

function getUserByIdFast(id: number) {
  return userMap.get(id); // O(1)
}

// Нормализация — стандартный паттерн для Redux, Zustand, кастомных сторов
type NormalizedState<T> = {
  byId: Map<number, T>;
  allIds: number[];
};

function normalize<T extends { id: number }>(items: T[]): NormalizedState<T> {
  return {
    byId: new Map(items.map(item => [item.id, item])),
    allIds: items.map(item => item.id),
  };
}
```

**Объяснение:** Паттерн нормализации критичен при работе с большими списками. Один раз платим O(n) за создание Map, затем любой доступ по id — O(1). В Redux Toolkit это встроено (`createEntityAdapter`).

---

#### Паттерн 2 — Set для трекинга посещённых в алгоритмах

```typescript
// ❌ Массив + includes: O(n) проверка при каждом шаге
const visited: string[] = [];
if (!visited.includes(node)) { // O(n)!
  visited.push(node);
}

// ✅ Set: O(1) проверка
const visited = new Set<string>();
if (!visited.has(node)) { // O(1)
  visited.add(node);
}

// Практический пример: дедупликация запросов в полётный момент
const pendingRequests = new Set<string>();

async function fetchWithDedup(url: string) {
  if (pendingRequests.has(url)) return; // уже в процессе
  pendingRequests.add(url);
  try {
    return await fetch(url);
  } finally {
    pendingRequests.delete(url); // чистим после завершения
  }
}
```

**Объяснение:** `Set.has()` — O(1) за счёт хэш-таблицы. `Array.includes()` — O(n) линейный поиск. При n > 100 разница становится заметной, при n > 10000 — критической.

---

#### Паттерн 3 — WeakMap для приватных данных экземпляров

```typescript
// ❌ Приватные данные через _ prefix — конвенция, не защита
class Counter {
  private _count = 0; // TypeScript private, но в рантайме доступен
  increment() { this._count++; }
}

// ✅ WeakMap для истинно приватного состояния
const privateData = new WeakMap<Counter2, { count: number }>();

class Counter2 {
  constructor() {
    privateData.set(this, { count: 0 }); // данные снаружи недоступны
  }
  increment() {
    const data = privateData.get(this)!;
    data.count++;
  }
  getCount() {
    return privateData.get(this)!.count;
  }
  // При GC экземпляра Counter2 — данные в WeakMap тоже удалятся
}

// Современная альтернатива: private class fields (#)
class Counter3 {
  #count = 0; // истинно приватное поле в рантайме
  increment() { this.#count++; }
  getCount() { return this.#count; }
}
```

**Объяснение:** WeakMap для приватности — старый паттерн до появления `#private fields` в ES2022. Сейчас предпочтительны `#fields`, но WeakMap остаётся полезным для хранения данных, привязанных к жизненному циклу объекта (кэши, мемо, метаданные).

---

### 4. Вопросы интервью

**Q1: Чем Map отличается от обычного объекта?**

Ключевые отличия: Map принимает ключи любого типа (объекты, функции, числа), Object — только string и Symbol. Map гарантирует порядок итерации по вставке, Object — нет (числовые ключи всегда идут первыми). `map.size` — O(1), `Object.keys(obj).length` — O(n). Map не имеет прото-загрязнения: нет `__proto__`, `toString`, `constructor` как случайных ключей. Map лучше производительностью для частых операций добавления/удаления. Object лучше для статичных структур данных и JSON-сериализации.

**Q2: Когда использовать Set вместо массива?**

Set выбирают когда нужна уникальность или частые проверки наличия элемента. `set.has()` — O(1) против `array.includes()` — O(n). Операции над множествами (union, intersection, difference) естественны для Set. Трекинг посещённых узлов в обходе графа. Удаление дубликатов: `[...new Set(arr)]` — лаконично и эффективно. Массив выбирают когда нужен порядок с дубликатами, произвольный доступ по индексу, или методы трансформации (map, filter, reduce).

**Q3: Что такое WeakMap и почему нельзя итерировать по нему?**

WeakMap хранит ключи как слабые ссылки — GC может удалить объект-ключ даже при наличии записи в WeakMap. Это предотвращает утечки памяти при кэшировании данных DOM-элементов или других объектов с ограниченным жизненным циклом. Итерация невозможна намеренно: состав ключей зависит от GC — он может запуститься в любой момент, и список ключей будет недетерминированным. Такое API было бы ненадёжным. WeakMap поддерживает только `get`, `set`, `has`, `delete`.

**Q4: Когда использовать WeakMap вместо Map?**

WeakMap выбирают когда данные должны жить ровно столько, сколько объект-ключ. Типичные кейсы: кэш вычислений привязанный к DOM-элементам (при удалении элемента кэш очищается автоматически), хранение приватных данных экземпляров класса, метаданные для объектов сторонних библиотек (не можем добавить свойство напрямую). Map используют когда нужен полный контроль жизненного цикла, итерация, `size`, или примитивные ключи.

**Q5: Как реализовать операции union, intersection, difference для Set?**

ES2024 добавляет нативные методы: `a.union(b)`, `a.intersection(b)`, `a.difference(b)`, `a.symmetricDifference(b)`. До ES2024: union — `new Set([...a, ...b])`, intersection — `new Set([...a].filter(x => b.has(x)))`, difference — `new Set([...a].filter(x => !b.has(x)))`. Симметричная разность: элементы, которые есть в одном из множеств, но не в обоих: `new Set([...a].filter(x => !b.has(x)).concat([...b].filter(x => !a.has(x))))`. Все ручные реализации — O(n).

**Q6: Каков порядок итерации в Map?**

Map всегда итерируется в порядке вставки — это гарантировано спецификацией ES6. Это принципиальное отличие от Object, где числовые ключи идут первыми в числовом порядке, затем строки в порядке вставки. `for...of map` → `map.forEach` → `[...map.entries()]` — все итерируют по порядку вставки. При `map.set(existingKey, newValue)` порядок ключа не меняется — перемещение на позицию вставки не происходит.

**Q7: Что такое WeakSet и когда он нужен?**

WeakSet — аналог WeakMap, но хранит только объекты (без пар ключ-значение). Поддерживает `add`, `has`, `delete`. Ключи — слабые ссылки, нет итерации, нет `size`. Типичное применение: отслеживание "обработанных" объектов без риска утечки памяти. Например, пометить DOM-узлы, которые уже прошли инициализацию: `const initialized = new WeakSet(); if (!initialized.has(el)) { initElement(el); initialized.add(el); }`. При удалении элемента из DOM запись в WeakSet исчезает автоматически.

**Q8: Можно ли использовать объект как ключ в Map и что это даёт?**

Да, это одно из главных преимуществ Map. Ключ — это ссылка на объект (identity). Два разных объекта с одинаковым содержимым — разные ключи: `new Map([[{}, 1], [{}, 2]])` имеет два ключа. Это позволяет хранить данные, связанные с конкретным объектом, без "загрязнения" самого объекта дополнительными свойствами. Применение: кэш для объектов, граф связей между объектами, обратный индекс.

**Q9: Как Map и Set взаимодействуют с JSON.stringify?**

`JSON.stringify(new Map(...))` возвращает `'{}'` — Map не сериализуется стандартным образом, так как не является POJO (plain object). Аналогично для Set — `'{}'. Для сериализации Map нужна ручная конвертация: `JSON.stringify([...map.entries()])` или `Object.fromEntries(map)`. Для Set: `JSON.stringify([...set])`. При десериализации нужно восстановить: `new Map(JSON.parse(str))` и `new Set(JSON.parse(str))`. Это важно при работе с `localStorage`, API и SSR hydration в Next.js.

---

### 5. Практическое задание

**Задача: Кэш на WeakMap + операции над множествами**

```typescript
// Часть 1: Реализовать мемоизирующий кэш на WeakMap
// Функция должна кэшировать результат для каждого объекта-ключа
memoize(expensiveCompute, obj1); // вычисляет
memoize(expensiveCompute, obj1); // возвращает кэш
memoize(expensiveCompute, obj2); // вычисляет заново для другого объекта

// Часть 2: Реализовать класс MultiSet (множество с подсчётом частот)
const ms = new MultiSet<string>();
ms.add('apple');
ms.add('apple');
ms.add('banana');
ms.count('apple');    // 2
ms.count('banana');   // 1
ms.toSet();           // Set { 'apple', 'banana' }

// Часть 3: Реализовать функцию findCommonTags
// Принимает массив постов с тегами, возвращает теги присутствующие в ВСЕХ постах
findCommonTags([
  { tags: ['js', 'react', 'ts'] },
  { tags: ['js', 'ts', 'node'] },
  { tags: ['js', 'ts', 'vue'] },
]); // → Set { 'js', 'ts' }
```

---

### 6. Решение с инсайтом

```typescript
// Часть 1: WeakMap кэш — привязан к жизненному циклу объекта
function createWeakCache<K extends object, V>(
  compute: (key: K) => V
): (key: K) => V {
  const cache = new WeakMap<K, V>();

  return (key: K): V => {
    if (cache.has(key)) {
      return cache.get(key)!; // хит кэша
    }
    const result = compute(key);
    cache.set(key, result);
    return result;
  };
}

const expensiveCompute = (obj: { data: number[] }) =>
  obj.data.reduce((a, b) => a + b, 0);

const memoized = createWeakCache(expensiveCompute);

let obj1 = { data: [1, 2, 3, 4, 5] };
console.log(memoized(obj1)); // вычисляет: 15
console.log(memoized(obj1)); // кэш: 15
obj1 = null as any;          // при GC — кэш очистится автоматически

// Часть 2: MultiSet
class MultiSet<T> {
  private counts = new Map<T, number>();

  add(value: T): this {
    this.counts.set(value, (this.counts.get(value) ?? 0) + 1);
    return this;
  }

  remove(value: T): this {
    const count = this.counts.get(value) ?? 0;
    if (count <= 1) this.counts.delete(value);
    else this.counts.set(value, count - 1);
    return this;
  }

  count(value: T): number {
    return this.counts.get(value) ?? 0;
  }

  toSet(): Set<T> {
    return new Set(this.counts.keys());
  }

  get size(): number { return this.counts.size; }
}

// Часть 3: findCommonTags через reduce + intersection
function findCommonTags(posts: { tags: string[] }[]): Set<string> {
  if (posts.length === 0) return new Set();

  // Начинаем с первого поста, пересекаем с каждым следующим
  return posts
    .map(post => new Set(post.tags))
    .reduce((common, postTags) => {
      // intersection двух Set
      return new Set([...common].filter(tag => postTags.has(tag)));
    });
}

console.log(findCommonTags([
  { tags: ['js', 'react', 'ts'] },
  { tags: ['js', 'ts', 'node'] },
  { tags: ['js', 'ts', 'vue'] },
])); // Set { 'js', 'ts' }
```

**Ключевой инсайт:** `findCommonTags` использует `reduce` без начального значения — первый элемент становится аккумулятором. Это элегантно, но опасно с пустым массивом (выбрасывает TypeError) — поэтому добавлена ранняя проверка. `reduce` + `intersection` — классический паттерн для нахождения общих элементов в N множествах. WeakMap в `createWeakCache` привязывает кэш к жизненному циклу ключа — это фундаментальное преимущество перед обычным Map, который удержит объект в памяти вечно.

---

→ Следующая тема: [22 — Optional Chaining / Nullish Coalescing]

---

## Тема 22 — Optional Chaining / Nullish Coalescing

← Предыдущая тема: [21 — Map, Set, WeakMap]

---

### 1. Теория с аналогиями

**Аналогия: ?. — проверить каждое звено цепочки**

Представьте, что вы хотите узнать имя директора филиала компании в другом городе. Звоните → офис существует? → есть директор? → у него есть имя? Если на любом шаге ответ "нет" — вы говорите "не знаю" и вешаете трубку. Не падаете с криком "Cannot read property 'name' of undefined"! Именно это делает `?.` — вежливо спрашивает каждое звено.

```
Без optional chaining:
user && user.address && user.address.city && user.address.city.name

С optional chaining:
user?.address?.city?.name
                  ↓
      null/undefined → undefined (не выбрасывает ошибку)
```

---

#### Все формы optional chaining

```typescript
const user = {
  name: 'Alice',
  address: null,
  getPhone: () => '+7-999-123-45-67',
  roles: ['admin', 'user'],
};

// 1. Доступ к свойству
user?.address?.city;        // undefined (не ошибка!)
user?.name;                 // 'Alice'

// 2. Вызов метода: ?.()
user.getPhone?.();          // '+7-999-123-45-67'
user.nonExistent?.();       // undefined (не ошибка!)
// Без ?. если метода нет: TypeError: user.nonExistent is not a function

// 3. Доступ по индексу: ?.[]
user.roles?.[0];            // 'admin'
user.address?.[0];          // undefined

// 4. Комбинирование
const firstRole = user?.roles?.[0]?.toUpperCase();
// 'ADMIN'

// 5. С вызовом функции
const length = user?.name?.length;
// 5
```

---

#### `??` vs `||` — критическое различие

```
|| (OR) — falsy: false, 0, '', null, undefined, NaN
?? (NC) — nullish: только null и undefined

┌─────────────┬───────────┬────────────┐
│   Значение  │  || 'def' │  ?? 'def'  │
├─────────────┼───────────┼────────────┤
│ null        │   'def'   │   'def'    │ ← оба заменяют
│ undefined   │   'def'   │   'def'    │ ← оба заменяют
│ 0           │   'def'   │    0       │ ← ?? сохраняет!
│ false       │   'def'   │   false    │ ← ?? сохраняет!
│ ''          │   'def'   │    ''      │ ← ?? сохраняет!
│ NaN         │   'def'   │    NaN     │ ← ?? сохраняет!
│ 'value'     │  'value'  │  'value'   │ ← оба не заменяют
└─────────────┴───────────┴────────────┘
```

**Практическая ловушка — конфиг с таймаутом:**

```typescript
interface Config {
  timeout?: number;  // 0 = отключить таймаут, undefined = использовать дефолт
  retries?: number;  // 0 = не повторять
}

const config: Config = { timeout: 0, retries: 0 };

// ❌ || заменяет 0 на дефолт — логика сломана!
const timeout = config.timeout || 5000;  // 5000, хотя передали 0!
const retries = config.retries || 3;     // 3, хотя передали 0!

// ✅ ?? сохраняет 0 и false
const timeout2 = config.timeout ?? 5000; // 0 ✓
const retries2 = config.retries ?? 3;    // 0 ✓
```

---

#### Оператор присвоения с nullish: `??=`

```typescript
// Логические операторы присвоения (ES2021)
let a = null;
a ??= 'default';  // a === 'default' (был null)

let b = 0;
b ??= 'default';  // b === 0 (не null/undefined, не заменяем)
b ||= 'default';  // b === 'default' (0 — falsy, заменили!)

// Практика: инициализация кэша
const cache: Record<string, string[]> = {};
cache['key'] ??= []; // создать массив если нет
cache['key'].push('item');
```

---

#### TypeScript и сужение типов

```typescript
interface User {
  name: string;
  address?: {
    city?: string;
  };
}

function getCity(user: User | null): string {
  // После ?. TypeScript знает что результат может быть undefined
  const city = user?.address?.city;
  // Тип city: string | undefined

  // ?? сужает до string
  return city ?? 'Unknown';
  // Тип возврата: string
}

// В TypeScript strict mode — нельзя присвоить через ?.
// user?.name = 'Bob'; // SyntaxError: Invalid left-hand side
```

---

### 2. Связь со стеком

#### Работа с API-ответами неопределённой структуры

```typescript
// В Next.js App Router: данные от внешнего API могут иметь неполную структуру
interface ApiResponse {
  user?: {
    profile?: {
      avatar?: { url?: string; alt?: string };
      displayName?: string;
    };
  };
}

function UserCard({ data }: { data: ApiResponse }) {
  const avatarUrl = data.user?.profile?.avatar?.url ?? '/default-avatar.png';
  const altText = data.user?.profile?.avatar?.alt ?? 'User avatar';
  const name = data.user?.profile?.displayName ?? 'Anonymous';

  return (
    <div>
      <img src={avatarUrl} alt={altText} />
      <p>{name}</p>
    </div>
  );
}
```

#### TypeScript и optional chaining: сужение типов

```typescript
// TypeScript понимает ?. и сужает тип в условиях
function processUser(user: User | null | undefined) {
  if (user?.isActive) {
    // Внутри блока TypeScript НЕ гарантирует user !== null
    // Потому что ?. уже обработал null → false → блок не выполнится
    // Но user?.isActive возвращает boolean | undefined, не сужает user
    console.log(user.name); // ошибка TypeScript — user может быть null
  }

  // Для сужения — явная проверка
  if (user && user.isActive) {
    console.log(user.name); // OK — user точно не null
  }
}
```

#### Дефолтные значения для конфигов Next.js

```typescript
// next.config.ts
interface AppConfig {
  api?: {
    baseUrl?: string;
    timeout?: number;
    retries?: number;
  };
  features?: {
    darkMode?: boolean;
    analytics?: boolean;
  };
}

function resolveConfig(userConfig?: AppConfig) {
  return {
    api: {
      baseUrl: userConfig?.api?.baseUrl ?? 'https://api.example.com',
      timeout: userConfig?.api?.timeout ?? 5000,  // 0 допустимо!
      retries: userConfig?.api?.retries ?? 3,     // 0 допустимо!
    },
    features: {
      darkMode: userConfig?.features?.darkMode ?? false,
      analytics: userConfig?.features?.analytics ?? true,
    },
  };
}
```

---

### 3. Лучшие паттерны

#### Паттерн 1 — `??` для конфигов (сохранять 0 и false)

```typescript
// ❌ || для конфигов — ломает логику при 0, false, ''
function configure(options: { port?: number; debug?: boolean; prefix?: string }) {
  const port = options.port || 3000;     // port: 0 → 3000 (неправильно!)
  const debug = options.debug || false;  // debug: false → false (случайно верно)
  const prefix = options.prefix || '/';  // prefix: '' → '/' (может быть неправильно)
}

// ✅ ?? — заменяет только null/undefined
function configureSafe(options: { port?: number; debug?: boolean; prefix?: string }) {
  const port = options.port ?? 3000;     // port: 0 → 0 ✓, undefined → 3000 ✓
  const debug = options.debug ?? false;  // debug: false → false ✓
  const prefix = options.prefix ?? '/';  // prefix: '' → '' ✓
}

// Ещё лучше с деструктуризацией (дефолты при undefined):
function configureClean({ port = 3000, debug = false, prefix = '/' } = {}) {
  // Здесь дефолты от деструктуризации тоже срабатывают только на undefined!
  // Деструктуризация и ?? ведут себя одинаково для undefined
}
```

**Объяснение:** Число `0` — валидное значение для порта, таймаута, количества попыток. `false` — валидное значение для флагов. `''` — может быть валидным пустым префиксом. Использование `||` ломает все эти случаи. `??` — правильный выбор для конфигов.

---

#### Паттерн 2 — `?.` для безопасного доступа к вложенным данным

```typescript
// ❌ Цепочка проверок — verbose и трудно читать
function getAvatarUrl(user: User | null): string {
  if (user !== null && user !== undefined) {
    if (user.profile !== undefined) {
      if (user.profile.avatar !== undefined) {
        return user.profile.avatar.url;
      }
    }
  }
  return '/default.png';
}

// ✅ Optional chaining + nullish coalescing
function getAvatarUrl(user: User | null): string {
  return user?.profile?.avatar?.url ?? '/default.png';
}

// Для методов
interface Service {
  getData?: () => Promise<Data>;
}

async function tryGetData(service: Service): Promise<Data | null> {
  // ?.() безопасно вызывает метод если он существует
  const result = await service.getData?.();
  return result ?? null;
}
```

**Объяснение:** Каждый `?.` создаёт точку "безопасного выхода" — если выражение слева от `?.` равно `null` или `undefined`, вся цепочка возвращает `undefined` без ошибки. Это элегантнее, чем вложенные if, и читается как единое намерение.

---

#### Паттерн 3 — Комбинация `?.` и `??` для полного контроля

```typescript
// Паттерн: безопасный доступ + осмысленный дефолт
interface Config {
  database?: {
    host?: string;
    port?: number;
    maxConnections?: number;
    ssl?: boolean;
  };
}

function getDbConfig(config?: Config) {
  return {
    // ?. — безопасный доступ к вложенному
    // ?? — осмысленный дефолт, сохраняющий falsy значения
    host: config?.database?.host ?? 'localhost',
    port: config?.database?.port ?? 5432,
    maxConnections: config?.database?.maxConnections ?? 10,
    ssl: config?.database?.ssl ?? process.env.NODE_ENV === 'production',
  };
}

// Использование в React — безопасный доступ к event
function handleClick(event?: React.MouseEvent) {
  const x = event?.clientX ?? 0;
  const y = event?.clientY ?? 0;
  const target = event?.target as HTMLElement | undefined;
  const id = target?.id ?? 'unknown';

  console.log({ x, y, id });
}
```

**Объяснение:** `?.` и `??` — естественная пара. `?.` говорит "если нет доступа — верни undefined", `??` говорит "если undefined — используй этот дефолт". Вместе они создают паттерн безопасного доступа с разумными значениями по умолчанию.

---

### 4. Вопросы интервью

**Q1: Что делает optional chaining (`?.`)?**

Optional chaining позволяет безопасно обращаться к вложенным свойствам объекта, который может быть `null` или `undefined`. Если выражение слева от `?.` равно `null` или `undefined`, вся цепочка немедленно возвращает `undefined` без выброса исключения. Поддерживает три формы: `?.property` для свойств, `?.()` для вызова функций, `?.[]` для доступа по вычисляемому ключу или индексу. Работает как короткое замыкание: `a?.b?.c` — если `a` равно `null`, `b` вообще не вычисляется.

**Q2: В чём разница между `??` и `||`?**

Оба оператора возвращают правый операнд при определённом условии. `||` возвращает правый, если левый — любое falsy значение: `false`, `0`, `''`, `null`, `undefined`, `NaN`. `??` (nullish coalescing) возвращает правый только если левый строго равен `null` или `undefined`. Практически: `0 || 5` → `5`, но `0 ?? 5` → `0`. Для конфигов, где `0` и `false` — валидные значения, `??` — правильный выбор. `||` нужен там, где любое falsy значение должно заменяться дефолтом.

**Q3: Когда `||` может сломать логику?**

Классический случай: `const timeout = options.timeout || 5000`. Если пользователь намеренно передал `0` (отключить таймаут), `||` заменит его на `5000`. Аналогично: `const isEnabled = config.feature || false` — если `config.feature === false`, результат корректен, но это случайность, а не намерение. `const title = props.title || 'Default'` — пустая строка `''` тоже заменится, что может быть нежелательно. Правило: если значение может быть `0`, `false`, или `''` и это означает что-то отличное от "не задано" — используйте `??`.

**Q4: Как optional chaining работает с функциями (`?.()`))?**

`fn?.()` проверяет, что `fn` не является `null` или `undefined`, и только тогда вызывает его как функцию. Это отличается от `fn && fn()` тем, что `?.()` выбросит ошибку, если `fn` существует, но не является функцией: `const x = 42; x?.()` → TypeError. `&&` вернул бы `42`. `?.()` используют для опциональных обработчиков: `onClick?.()`, `this.onSuccess?.()`, `service.method?.()`. В TypeScript сигнатура функции обычно типизирована как `(() => T) | undefined`, и `?.()` корректно обрабатывает оба случая.

**Q5: Как TypeScript сужает тип после `?.`?**

`?.` сам по себе не сужает тип объекта — он только изменяет тип результата. `user?.name` имеет тип `string | undefined`, если `user` имеет тип `User | null | undefined`. Для сужения типа `user` нужна явная проверка: `if (user != null) { user.name; // здесь user: User }`. TypeScript 4.9+ с `satisfies` и discriminated unions делают это удобнее. Важно: после `?.` в условии: `if (user?.isAdmin)` TypeScript не сузит `user` до `User` внутри блока — потому что `?.` уже обработал null case, возвращая undefined/false.

**Q6: Можно ли использовать `?.` для присвоения?**

Нет, `?.` не работает в левой части присвоения: `user?.name = 'Bob'` — SyntaxError. Это намеренно: если `user` равен null, присвоение было бы проигнорировано, что создало бы неявное, трудно отлаживаемое поведение. Для безопасного присвоения используйте явную проверку: `if (user) { user.name = 'Bob'; }`. Оператор `??=` (nullish assignment) — это другое: `a ??= b` присваивает `b` переменной `a` если `a` равно `null/undefined`, но требует что `a` уже существует как переменная.

**Q7: В чём разница `value ?? default` и `value ? value : default`?**

Оба выражения возвращают `default` при ложных значениях, но с разными условиями. `value ? value : default` — тернарный оператор, возвращает `default` при любом falsy значении (`0`, `false`, `''`, `null`, `undefined`, `NaN`). `value ?? default` возвращает `default` только при `null` или `undefined`. Кроме того, `value ?? default` вычисляет `value` один раз, тернарный — дважды (один раз в условии, один раз как результат). Для сложного выражения это важно. Также: `value ?? default` более явно передаёт намерение "использовать значение если оно задано".

**Q8: Что происходит при цепочке `a?.b.c`?**

Если `a` равно `null` или `undefined`, цепочка возвращает `undefined` и `b.c` не вычисляется. Если `a` существует, но `a.b` равно `null/undefined`, то `a.b.c` выбросит TypeError — `?.` стоит только перед `b`, а не перед `c`. Для полной безопасности нужно `a?.b?.c`. Это важно: `?.` применяется только к непосредственно следующему обращению, не ко всей оставшейся цепочке. `a?.b.c.d` безопасен только в точке `a?.b`, для `c` и `d` безопасность не гарантирована.

**Q9: Как optional chaining взаимодействует с `typeof`?**

`typeof undefined` возвращает `'undefined'`, а не выбрасывает ошибку — `typeof` безопасен для несуществующих переменных. Поэтому `typeof undeclaredVar` — безопасно, но `undeclaredVar?.prop` выбросит ReferenceError (переменная не объявлена). `?.` защищает от `null/undefined`, но не от необъявленных переменных. Паттерн проверки: `typeof window !== 'undefined' && window?.navigator?.userAgent` — первая проверка защищает от SSR (window не существует), вторая — на случай необычных окружений. В TypeScript строгий режим поймает обращение к необъявленным переменным на этапе компиляции.

---

### 5. Практическое задание

**Задача: Реализовать `getConfig(userConfig)` с корректным мержем**

```typescript
interface ServerConfig {
  host?: string;
  port?: number;
  database?: {
    url?: string;
    poolSize?: number;
    ssl?: boolean;
    timeout?: number;  // 0 = без таймаута, undefined = дефолт
  };
  cache?: {
    enabled?: boolean;
    ttl?: number;       // 0 = не кэшировать, undefined = дефолт
    maxSize?: number;
  };
  logging?: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    structured?: boolean;
  };
}

// Функция должна:
// 1. Использовать дефолты для undefined значений
// 2. Сохранять явно переданные 0 и false
// 3. Корректно мержить вложенные объекты
// 4. Работать при частично заданном userConfig

const config1 = getConfig();                        // все дефолты
const config2 = getConfig({ port: 0 });             // port === 0 (не 3000!)
const config3 = getConfig({ database: { ssl: false, timeout: 0 } });
// ssl === false (не true!), timeout === 0 (не 5000!)
```

---

### 6. Решение с инсайтом

```typescript
type ResolvedConfig = Required<{
  host: string;
  port: number;
  database: Required<{
    url: string;
    poolSize: number;
    ssl: boolean;
    timeout: number;
  }>;
  cache: Required<{
    enabled: boolean;
    ttl: number;
    maxSize: number;
  }>;
  logging: Required<{
    level: 'debug' | 'info' | 'warn' | 'error';
    structured: boolean;
  }>;
}>;

function getConfig(userConfig?: ServerConfig): ResolvedConfig {
  return {
    // ?. — безопасный доступ к userConfig (может быть undefined)
    // ?? — дефолт только если явно не передано (null/undefined)
    host: userConfig?.host ?? 'localhost',
    port: userConfig?.port ?? 3000,         // port: 0 сохранится!

    database: {
      url: userConfig?.database?.url ?? 'postgresql://localhost:5432/db',
      poolSize: userConfig?.database?.poolSize ?? 10,
      ssl: userConfig?.database?.ssl ?? false,        // false сохранится!
      timeout: userConfig?.database?.timeout ?? 5000, // 0 сохранится!
    },

    cache: {
      enabled: userConfig?.cache?.enabled ?? true,    // false сохранится!
      ttl: userConfig?.cache?.ttl ?? 3600,            // 0 сохранится!
      maxSize: userConfig?.cache?.maxSize ?? 1000,
    },

    logging: {
      level: userConfig?.logging?.level ?? 'info',
      structured: userConfig?.logging?.structured ?? false, // false сохранится!
    },
  };
}

// Тесты
console.log(getConfig().port);                          // 3000 (дефолт)
console.log(getConfig({ port: 0 }).port);               // 0 ✓
console.log(getConfig({ database: { ssl: false } }).database.ssl); // false ✓
console.log(getConfig({ database: { timeout: 0 } }).database.timeout); // 0 ✓
console.log(getConfig({ cache: { ttl: 0 } }).cache.ttl); // 0 ✓

// Сравнение с неправильным подходом (||):
function getConfigBroken(userConfig?: ServerConfig) {
  return {
    port: (userConfig?.port) || 3000,               // port: 0 → 3000 ❌
    database: {
      ssl: (userConfig?.database?.ssl) || false,    // ssl: false → false (случайно ок)
      timeout: (userConfig?.database?.timeout) || 5000, // timeout: 0 → 5000 ❌
    },
  };
}
```

**Ключевой инсайт:** Разница между `??` и `||` становится критической именно в конфигурационных функциях. Значения `0`, `false`, `''` — это не "отсутствие значения", это осмысленные конфигурационные значения. `||` не умеет их отличить от "не задано". `??` умеет. Именно поэтому в любом production-коде, который принимает опциональную конфигурацию, следует использовать `??` или деструктуризацию с дефолтами (которая тоже срабатывает только на `undefined`).

---

→ Следующая тема: [23 — Promise и асинхронность]
