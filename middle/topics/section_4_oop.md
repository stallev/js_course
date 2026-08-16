# Контент курса — Раздел 4: ООП и прототипы

> **Курс:** JavaScript для Middle FullStack Interview  
> **Стек:** Next.js · React · TypeScript  
> **Охват:** Раздел 4 — Темы 12–14 (Прототипная цепочка · Классы ES6 · Property Descriptors)

---

# Раздел 4 — ООП и прототипы

*В этом разделе мы изучаем объектно-ориентированную модель JavaScript — уникальную прототипную систему, поверх которой построены классы ES6. Понимание прототипов объясняет "магию" наследования, instanceof и почему классы — синтаксический сахар. Property Descriptors завершают картину: как JS управляет метаданными свойств объектов.*

🔗 **Связь с разделами:** Замыкания (Тема 3) часто используются с классами для инкапсуляции. this (Тема 7) ведёт себя по-разному в методах класса.

---

## Тема 12 — Прототипная цепочка

← Предыдущая тема: [11 — Иммутабельность и структуры данных]

---

### Теория

**Аналогия: семейное дерево**

Представь семью в три поколения: сын, отец, дед. Когда сын не знает ответа на вопрос — он спрашивает отца. Если отец не знает — спрашивает деда. Если и дед не знает — ответа нет (null). Именно так работает прототипная цепочка в JavaScript: каждый объект имеет ссылку на родителя (`__proto__`), и поиск свойства поднимается вверх по цепочке до самого конца.

```
Сын           → Отец         → Дед          → null
obj           → obj.__proto__  → Object.proto → null
{ name: 'Вася' }  { walk() {} }  { toString() }
```

**Схема прототипной цепочки**

```
┌─────────────────────────────────────────────────────────────────┐
│                     Прототипная цепочка                         │
│                                                                 │
│  const obj = new Animal('Cat')                                  │
│                                                                 │
│  obj  ────────────────────────────────────────────────────────► null
│  { name: 'Cat' }                                                │
│       │ __proto__                                               │
│       ▼                                                         │
│  Animal.prototype                                               │
│  { speak() { ... }, constructor: Animal }                       │
│       │ __proto__                                               │
│       ▼                                                         │
│  Object.prototype                                               │
│  { toString(), hasOwnProperty(), valueOf(), ... }               │
│       │ __proto__                                               │
│       ▼                                                         │
│      null  ← конец цепочки                                      │
└─────────────────────────────────────────────────────────────────┘
```

**`prototype` vs `__proto__` — важнейшее различие**

| Свойство       | Есть у кого         | Что хранит                                   |
|----------------|---------------------|----------------------------------------------|
| `prototype`    | Только у функций    | Объект, который станет `__proto__` экземпляра |
| `__proto__`    | У каждого объекта   | Ссылка на прототип этого объекта              |

```javascript
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function() {
  return `${this.name} говорит`;
};

const cat = new Animal('Кот');

// prototype — у функции-конструктора:
console.log(Animal.prototype);       // { speak: [Function], constructor: Animal }

// __proto__ — у экземпляра:
console.log(cat.__proto__);          // { speak: [Function], constructor: Animal }

// Они ссылаются на один и тот же объект:
console.log(cat.__proto__ === Animal.prototype); // true

// Современный способ (не используй __proto__ в продакшне):
console.log(Object.getPrototypeOf(cat) === Animal.prototype); // true
```

**Алгоритм поиска свойства по цепочке (пошагово)**

```
Запрос: cat.speak()

Шаг 1: Проверяем собственные свойства cat
        → cat = { name: 'Кот' }
        → speak? НЕТ → переходим выше

Шаг 2: Проверяем cat.__proto__ = Animal.prototype
        → Animal.prototype = { speak: fn, constructor: Animal }
        → speak? ДА → вызываем speak(), СТОП

Если бы не нашли:
Шаг 3: Проверяем Animal.prototype.__proto__ = Object.prototype
        → { toString, hasOwnProperty, valueOf, ... }
        → Если нашли — возвращаем, иначе идём дальше

Шаг 4: Object.prototype.__proto__ = null
        → Цепочка закончилась → возвращаем undefined
```

```javascript
// Демонстрация поиска:
const cat = new Animal('Кот');

cat.hasOwnProperty('name');     // ✓ Найдено в Object.prototype (3 прыжка!)
cat.name;                       // ✓ Найдено на самом объекте (0 прыжков)
cat.nonExistent;                // undefined (цепочка дошла до null)
```

**Как работает `instanceof`**

`instanceof` проверяет, есть ли `Constructor.prototype` где-либо в прототипной цепочке объекта:

```javascript
// Алгоритм instanceof:
// obj instanceof Constructor
// ↔ Constructor.prototype есть в цепочке __proto__ объекта obj

function checkInstanceOf(obj, Constructor) {
  let proto = Object.getPrototypeOf(obj);
  while (proto !== null) {
    if (proto === Constructor.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}

class Animal {}
class Dog extends Animal {}
const dog = new Dog();

console.log(dog instanceof Dog);     // true  — Dog.prototype в цепочке
console.log(dog instanceof Animal);  // true  — Animal.prototype тоже в цепочке
console.log(dog instanceof Object);  // true  — Object.prototype всегда в цепочке
```

**`Object.create(null)` — объект без прототипа**

```javascript
// Обычный объект имеет прототип:
const normal = {};
console.log(Object.getPrototypeOf(normal) === Object.prototype); // true
console.log(normal.toString); // [Function: toString] (унаследован)

// Объект без прототипа — "чистый словарь":
const dict = Object.create(null);
console.log(Object.getPrototypeOf(dict)); // null
console.log(dict.toString);              // undefined — нет прототипа!
console.log(dict.hasOwnProperty);        // undefined — нет прототипа!

// Применение: безопасные хэш-таблицы без конфликта имён с методами Object
dict['constructor'] = 'моё значение'; // Нет конфликта с Object.prototype.constructor
```

---

### Связь со стеком

**Классы ES6 — синтаксический сахар над прототипами**

```javascript
// Класс ES6:
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} говорит`; }
}

// Под капотом это буквально то же самое:
function AnimalFn(name) { this.name = name; }
AnimalFn.prototype.speak = function() { return `${this.name} говорит`; };

// Проверяем — одинаковая структура:
const a = new Animal('Кот');
const b = new AnimalFn('Кот');
console.log(Object.getPrototypeOf(a).constructor === Animal);   // true
console.log(Object.getPrototypeOf(b).constructor === AnimalFn); // true
```

🔗 Связь с темой 13: Классы ES6 — это удобный синтаксис для работы именно с этой прототипной системой.

**`hasOwnProperty` в TypeScript-коде**

```typescript
// Частый паттерн при работе с Record<string, unknown>:
function processConfig(config: Record<string, unknown>) {
  for (const key in config) {
    // Без hasOwnProperty: if (config[key] === ...)
    // Проблема: for...in обходит и прототипные свойства!
    if (Object.hasOwn(config, key)) {  // ES2022 — безопасный аналог hasOwnProperty
      console.log(key, config[key]);
    }
  }
}

// Современный TypeScript (ES2022+):
// Object.hasOwn() предпочтительнее obj.hasOwnProperty()
// потому что работает с Object.create(null) и не может быть переопределён
```

**Почему не нужно знать прототипы для повседневного React**

```typescript
// В React ты пишешь:
const MyComponent: React.FC = () => {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
};

// React.FC, useState — это всё объекты с прототипами под капотом,
// но абстракции скрывают это. Знание прототипов нужно для:
// 1. Отладки неожиданных ошибок типа "is not a function"
// 2. Работы с библиотеками без TypeScript-типов
// 3. Собеседований уровня Middle+
// 4. Понимания, как работает Array.prototype.map, почему он доступен на []
```

---

### Лучшие паттерны

**Паттерн 1: `Object.create` для создания с заданным прототипом**

```javascript
// ❌ Антипаттерн: мутировать __proto__ напрямую
const animal = { speak() { return 'звук'; } };
const dog = {};
dog.__proto__ = animal; // Медленно и устарело!

// ✅ Правильно: Object.create задаёт прототип при создании
const animal = { speak() { return 'звук'; } };
const dog = Object.create(animal);
dog.bark = function() { return 'Гав!'; };

console.log(dog.speak()); // 'звук' — унаследовано из animal
console.log(dog.bark());  // 'Гав!' — собственный метод

// Object.create(null) — для чистых словарей:
const cache = Object.create(null);
cache['key'] = 'value'; // Нет засорения прототипными методами
```
*`__proto__` — устаревший способ, отсутствует в `Object.create(null)`. `Object.create` — явный и производительный.*

**Паттерн 2: `hasOwnProperty` / `Object.hasOwn` при итерации**

```javascript
// ❌ Антипаттерн: for...in без проверки
function merge(target, source) {
  for (const key in source) {
    target[key] = source[key]; // Копируем и прототипные свойства!
  }
}

// Допустим, кто-то сделал: Array.prototype.extra = 'oops';
const arr = [1, 2, 3];
for (const key in arr) {
  console.log(key); // '0', '1', '2', 'extra' — неожиданно!
}

// ✅ Правильно: всегда проверяем собственные свойства
function mergeSafe(target: object, source: object) {
  for (const key in source) {
    if (Object.hasOwn(source, key)) {
      (target as Record<string, unknown>)[key] =
        (source as Record<string, unknown>)[key];
    }
  }
  return target;
}

// Или ещё лучше — Object.keys перебирает только собственные:
const result = { ...source }; // spread оператор — только собственные свойства
```
*`for...in` обходит всю цепочку прототипов. `Object.keys`, spread и `Object.hasOwn` — только собственные свойства.*

**Паттерн 3: Современные классы вместо ручных прототипов**

```javascript
// ❌ Антипаттерн: ручная прототипная цепочка (ES5-стиль)
function Vehicle(make) { this.make = make; }
Vehicle.prototype.describe = function() { return this.make; };

function Car(make, model) {
  Vehicle.call(this, make);  // Вызов родительского конструктора
  this.model = model;
}
Car.prototype = Object.create(Vehicle.prototype); // Установка цепочки
Car.prototype.constructor = Car;                  // Восстановление constructor
Car.prototype.fullName = function() {
  return `${Vehicle.prototype.describe.call(this)} ${this.model}`;
};

// ✅ Правильно: классы ES6 делают то же самое, но читаемо
class Vehicle {
  constructor(public make: string) {}
  describe() { return this.make; }
}

class Car extends Vehicle {
  constructor(make: string, public model: string) {
    super(make); // Vehicle.call(this, make) под капотом
  }
  fullName() {
    return `${super.describe()} ${this.model}`; // Vehicle.prototype.describe.call(this)
  }
}

const car = new Car('Toyota', 'Camry');
console.log(car.fullName()); // Toyota Camry
console.log(car instanceof Vehicle); // true
```
*ES6 классы — это тот же прототипный механизм, но с читаемым синтаксисом и без риска забыть восстановить `constructor`.*

---

### Вопросы интервью

**Q1: Что такое прототипная цепочка в JavaScript?**

Прототипная цепочка — механизм наследования в JavaScript, при котором каждый объект имеет внутреннюю ссылку `[[Prototype]]` (доступна через `Object.getPrototypeOf()`) на другой объект. При обращении к свойству движок сначала ищет его на самом объекте, затем поднимается по цепочке через `[[Prototype]]` каждого объекта до тех пор, пока не найдёт свойство или не достигнет `null` (конца цепочки). Это позволяет объектам "наследовать" поведение от прототипов без копирования методов. Ключевое отличие от классического ООП: в JS наследование делегирующее (lookup по цепочке), а не копирующее.

**Q2: В чём разница между `prototype` и `__proto__`?**

`prototype` — это свойство, которое есть только у функций (включая классы). Оно содержит объект, который будет назначен `[[Prototype]]` экземплярам, созданным через `new`. `__proto__` (или `[[Prototype]]`) — внутренняя ссылка каждого объекта на его прототип. Связь: `new Foo().__proto__ === Foo.prototype`. Прямое использование `__proto__` в коде — антипаттерн; вместо него нужны `Object.getPrototypeOf()` и `Object.setPrototypeOf()`. Функция — тоже объект, у неё есть и `prototype` (шаблон для экземпляров), и `__proto__` (ссылка на `Function.prototype`).

**Q3: Как работает оператор `instanceof`?**

`obj instanceof Constructor` проверяет, присутствует ли `Constructor.prototype` в прототипной цепочке объекта `obj`. Алгоритм: берём `Object.getPrototypeOf(obj)` и сравниваем с `Constructor.prototype`; если совпадает — `true`; если нет — берём прототип прототипа и проверяем снова; продолжаем до `null` — тогда `false`. Поэтому `dog instanceof Animal` вернёт `true` даже если `dog` создан через `class Dog extends Animal`. Поведение можно переопределить через `Symbol.hasInstance`. Важно: `instanceof` сравнивает ссылку на `prototype`, поэтому работает некорректно при передаче объектов между разными контекстами (например, iframe).

**Q4: Что такое `Object.create(null)` и зачем используется?**

`Object.create(null)` создаёт объект без прототипа — его `[[Prototype]]` равен `null`, а не `Object.prototype`. Такой объект не имеет методов `toString`, `hasOwnProperty`, `constructor` и прочих унаследованных свойств. Это делает его идеальным "чистым словарём" (hash map): нет риска конфликта между пользовательскими ключами и унаследованными свойствами. Применяется для кэшей, реестров, словарей, где ключи приходят извне и могут совпадать с именами из `Object.prototype`. Недостаток: нельзя использовать `JSON.stringify` без проверки, и некоторые утилиты ожидают обычный объект.

**Q5: Что произойдёт при добавлении метода в `Object.prototype`?**

Метод, добавленный в `Object.prototype`, появится во всех объектах JavaScript — у массивов, функций, экземпляров классов. Это называется "загрязнение прототипа" (prototype pollution). Например, `Object.prototype.greet = () => 'hi'` сделает `greet` доступным на каждом объекте и в каждом `for...in` цикле без проверки `hasOwnProperty`. Это серьёзная уязвимость безопасности (атака через JSON: `JSON.parse('{"__proto__": {"admin": true}}')`). В строгом режиме это не запрещено, но является антипаттерном. Именно поэтому нельзя полифиллить встроенные объекты без namespace-префикса.

**Q6: Как проверить, что свойство является собственным (не прототипным)?**

Есть три способа. `obj.hasOwnProperty(key)` — классический метод из `Object.prototype`, может быть затенён или отсутствовать на объектах `Object.create(null)`. `Object.hasOwn(obj, key)` — современный (ES2022) статический метод, работает с любыми объектами включая `Object.create(null)`, предпочтительный вариант. `Object.keys(obj)`, `Object.values(obj)`, `Object.entries(obj)` — возвращают только собственные перечислимые свойства. Оператор `in` (например, `'key' in obj`) проверяет и собственные, и прототипные свойства. При итерации через `for...in` всегда используй `Object.hasOwn`.

**Q7: Что такое "теневые свойства" (property shadowing)?**

Затенение (shadowing) происходит, когда объект имеет собственное свойство с тем же именем, что и свойство в прототипе. При обращении движок находит собственное свойство первым и дальше по цепочке не идёт — прототипное свойство "в тени". Например: `Animal.prototype.type = 'animal'; const dog = new Animal(); dog.type = 'dog';` — `dog.type` вернёт `'dog'` (собственное), не `'animal'` (прототипное). Удаление `delete dog.type` снова сделает доступным прототипное свойство. Нюанс: если прототипное свойство `writable: false`, создать теневое свойство через присвоение в строгом режиме — ошибка.

**Q8: Чем `Object.keys()` отличается от `for...in`?**

`Object.keys()` возвращает массив только собственных перечислимых (`enumerable: true`) строковых свойств объекта — прототипная цепочка не обходится. `for...in` перебирает все перечислимые свойства по всей прототипной цепочке, включая унаследованные. В TypeScript и современном JS предпочитают `Object.keys`, `Object.entries`, `Object.values` или spread — они предсказуемы и не требуют `hasOwnProperty`. `for...in` оставался полезным только при необходимости явно обойти цепочку, но сейчас такая потребность редка. Символьные свойства (`Symbol`) не видны ни тем, ни другим — для них `Object.getOwnPropertySymbols()`.

**Q9: Можно ли изменить прототип объекта после создания и почему это плохо?**

Прототип можно изменить через `Object.setPrototypeOf(obj, newProto)` или устаревший `obj.__proto__ = newProto`. Однако это критически плохо для производительности: движок JavaScript (V8, SpiderMonkey) оптимизирует объекты на основе их "скрытого класса" (hidden class / shape), который определяется в момент создания. Изменение прототипа аннулирует эту оптимизацию и деоптимизирует весь код, работающий с объектом. Спецификация ECMAScript прямо называет это операцией с "very slow" характеристикой. Правильный подход: задавать прототип при создании через `Object.create()` или `class extends`.

---

### Практическое задание

Реализуй с нуля две функции:

1. `myCreate(proto)` — аналог `Object.create(proto)`, создаёт объект с заданным прототипом без использования `Object.create`.
2. `myInstanceOf(obj, Constructor)` — аналог `instanceof`, проверяет цепочку прототипов без использования оператора `instanceof`.

```typescript
// Требования:
// myCreate(proto) — должен вернуть объект, чей [[Prototype]] равен proto
// myCreate(null) — объект без прототипа
// myInstanceOf(obj, Constructor) — проверяет, есть ли Constructor.prototype
//                                  в прототипной цепочке obj

// Тесты:
class Animal { speak() { return 'звук'; } }
class Dog extends Animal { bark() { return 'гав'; } }

const proto = { greet() { return 'привет'; } };
const obj = myCreate(proto);
console.log(obj.greet()); // 'привет'
console.log(Object.getPrototypeOf(obj) === proto); // true

const emptyProto = myCreate(null);
console.log(Object.getPrototypeOf(emptyProto)); // null

const dog = new Dog();
console.log(myInstanceOf(dog, Dog));    // true
console.log(myInstanceOf(dog, Animal)); // true
console.log(myInstanceOf(dog, Array));  // false
```

---

### Решение с инсайтом

```typescript
// myCreate: используем временный конструктор как "мост"
function myCreate<T extends object | null>(proto: T): object {
  if (proto === null) {
    // Единственный способ создать объект без прототипа
    // без Object.create — нет прямого аналога,
    // но можно через нестандартный __proto__:
    const obj = {};
    Object.setPrototypeOf(obj, null);
    return obj;
  }

  // Классический трюк: временная функция-конструктор
  function TempCtor() {}
  TempCtor.prototype = proto as object;
  // new TempCtor() создаст объект с __proto__ === TempCtor.prototype === proto
  return new (TempCtor as new () => object)();
}

// myInstanceOf: явно идём по цепочке __proto__
function myInstanceOf(obj: unknown, Constructor: Function): boolean {
  // Примитивы не могут быть экземплярами объектов
  if (obj === null || typeof obj !== 'object' && typeof obj !== 'function') {
    return false;
  }

  const target = Constructor.prototype;
  let current = Object.getPrototypeOf(obj);

  while (current !== null) {
    if (current === target) return true;
    current = Object.getPrototypeOf(current);
  }

  return false;
}

// --- Тесты ---
class Animal { speak() { return 'звук'; } }
class Dog extends Animal { bark() { return 'гав'; } }

// myCreate
const proto = { greet() { return 'привет'; } };
const obj = myCreate(proto);
console.log((obj as typeof proto).greet());          // 'привет'
console.log(Object.getPrototypeOf(obj) === proto);   // true

const emptyProto = myCreate(null);
console.log(Object.getPrototypeOf(emptyProto));      // null

// myInstanceOf
const dog = new Dog();
console.log(myInstanceOf(dog, Dog));    // true
console.log(myInstanceOf(dog, Animal)); // true
console.log(myInstanceOf(dog, Array));  // false
console.log(myInstanceOf(42, Number));  // false — примитив
```

**Ключевой инсайт:** `Object.create` под капотом делает именно трюк с временным конструктором — задаёт `.prototype` и создаёт экземпляр. `instanceof` — не магия, а простой цикл по цепочке `[[Prototype]]`. Понимание этих двух алгоритмов снимает "страх" перед наследованием в JS.

---

→ Следующая тема: [13 — Классы ES6]

---

## Тема 13 — Классы ES6

← Предыдущая тема: [12 — Прототипная цепочка]

---

### Теория

**Классы ES6 — синтаксический сахар, не новая система**

До ES6 разработчики писали конструкторы вручную. Классы не добавили новую систему наследования — они лишь сделали запись прототипного наследования читаемой. Это принципиально важно: `typeof MyClass === 'function'` и класс можно использовать везде, где ожидается функция-конструктор.

```javascript
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} говорит`; }
}

// Проверяем, что это "просто функция":
console.log(typeof Animal);          // 'function'
console.log(typeof Animal.prototype); // 'object'
console.log(Animal.prototype.speak);  // [Function: speak]
```

**Полный синтаксис класса**

```typescript
class BankAccount {
  // Публичное поле (ES2022) — задаётся на экземпляре, не на прототипе:
  currency: string = 'USD';

  // Приватное поле # — настоящая инкапсуляция:
  #balance: number;
  #transactions: number[] = [];

  // Статическое поле — общее для всех экземпляров:
  static instanceCount = 0;
  static readonly MAX_OVERDRAFT = 1000;

  constructor(initialBalance: number) {
    this.#balance = initialBalance;
    BankAccount.instanceCount++;
  }

  // Геттер — вычисляемое свойство (не метод с ()):
  get balance(): number {
    return this.#balance;
  }

  // Сеттер — валидация при записи:
  set balance(value: number) {
    if (value < -BankAccount.MAX_OVERDRAFT) {
      throw new RangeError('Превышен лимит овердрафта');
    }
    this.#transactions.push(value - this.#balance);
    this.#balance = value;
  }

  // Обычный метод — на прототипе, не на экземпляре:
  deposit(amount: number): this {
    this.balance = this.#balance + amount;
    return this; // Позволяет chaining
  }

  // Статический метод — вызывается на классе, не на экземпляре:
  static fromString(str: string): BankAccount {
    const amount = parseFloat(str.replace(/[^0-9.-]/g, ''));
    return new BankAccount(amount);
  }

  // Приватный метод:
  #formatCurrency(amount: number): string {
    return `${amount.toFixed(2)} ${this.currency}`;
  }

  toString(): string {
    return `BankAccount(${this.#formatCurrency(this.#balance)})`;
  }
}

const account = BankAccount.fromString('$1,500.00');
account.deposit(500).deposit(250); // Цепочка вызовов
console.log(account.balance);      // 2250
console.log(`${account}`);         // BankAccount(2250.00 USD)
```

**Приватные поля `#` vs конвенция `_`**

```typescript
// ❌ Конвенция _private (псевдо-инкапсуляция):
class OldStyle {
  _secret = 'доступен извне';
  
  getSecret() { return this._secret; }
}
const old = new OldStyle();
console.log(old._secret);        // 'доступен извне' — ничего не скрыто!
old._secret = 'взломано';        // Можно изменить извне

// ✅ Приватные поля # (настоящая инкапсуляция):
class NewStyle {
  #secret = 'настоящий секрет';
  
  getSecret() { return this.#secret; }
}
const newObj = new NewStyle();
// newObj.#secret;               // SyntaxError: Private field '#secret' must be
                                 // declared in an enclosing class
console.log(newObj.getSecret()); // 'настоящий секрет'

// Проверка наличия приватного поля (ES2022):
console.log(#secret in newObj);  // true — без чтения значения
```

**Наследование: extends, super(), super.method()**

```typescript
class Animal {
  #name: string;

  constructor(name: string) {
    this.#name = name;
  }

  get name(): string { return this.#name; }

  speak(): string {
    return `${this.#name} издаёт звук`;
  }

  toString(): string {
    return `Animal(${this.#name})`;
  }
}

class Dog extends Animal {
  #breed: string;

  constructor(name: string, breed: string) {
    // ОБЯЗАТЕЛЬНО: super() должен быть вызван ДО обращения к this
    // Иначе: ReferenceError: Must call super constructor before accessing 'this'
    super(name);
    this.#breed = breed;
  }

  // Переопределение метода:
  speak(): string {
    // super.speak() обращается к методу родителя:
    return `${super.speak()} — точнее, гавкает`;
  }

  toString(): string {
    return `Dog(${this.name}, ${this.#breed})`;
  }
}

class GuideDog extends Dog {
  constructor(name: string, breed: string, public owner: string) {
    super(name, breed); // Цепочка вызовов super
  }

  guide(): string {
    return `${this.name} ведёт ${this.owner}`;
  }
}

const guide = new GuideDog('Рекс', 'Лабрадор', 'Иван');
console.log(guide.speak());  // 'Рекс издаёт звук — точнее, гавкает'
console.log(guide.guide());  // 'Рекс ведёт Иван'
console.log(`${guide}`);     // 'Dog(Рекс, Лабрадор)'

// Цепочка instanceof:
console.log(guide instanceof GuideDog); // true
console.log(guide instanceof Dog);      // true
console.log(guide instanceof Animal);   // true
```

**Важные особенности классов**

```javascript
// 1. Классы НЕ hoisted (в отличие от function declarations):
// const a = new MyClass(); // ReferenceError: Cannot access 'MyClass' before initialization
class MyClass {}

// 2. Тело класса всегда в строгом режиме (strict mode):
class StrictDemo {
  badMethod() {
    // undeclaredVar = 5; // ReferenceError в классе,
                          // но не ошибка вне класса без 'use strict'
  }
}

// 3. super() обязателен в дочернем constructor до this:
class Parent { constructor() { this.x = 1; } }
class Child extends Parent {
  constructor() {
    // this.y = 2; // ReferenceError: Must call super constructor before accessing 'this'
    super();       // После этого this доступен
    this.y = 2;    // OK
  }
}
```

---

### Связь со стеком

**Историческая роль в React (class-компоненты)**

```typescript
// React до 2019 — классовые компоненты:
import React, { Component } from 'react';

interface State { count: number; }

class Counter extends Component<{}, State> {
  state: State = { count: 0 };

  // Проблема методов класса: при передаче в onClick теряется this
  // ❌ Не работает без bind или стрелки:
  handleClick() {
    this.setState(s => ({ count: s.count + 1 }));
  }

  // ✅ Стрелочная функция как поле захватывает this:
  handleClickArrow = () => {
    this.setState(s => ({ count: s.count + 1 }));
  };

  render() {
    return (
      <button onClick={this.handleClickArrow}>
        {this.state.count}
      </button>
    );
  }
}

// Современный React — функциональные компоненты:
// Классы в React больше не рекомендуются, но понимание их механизма
// необходимо для поддержки legacy-кода
```

🔗 Связь с темой 7 (this): потеря `this` при деструктуризации методов класса — одна из самых частых ошибок в React class-компонентах.

**TypeScript: `private`, `protected`, `abstract`**

```typescript
abstract class Repository<T> {
  // abstract — метод без реализации, ОБЯЗАН быть реализован в подклассе:
  abstract findById(id: string): Promise<T | null>;
  abstract save(entity: T): Promise<T>;

  // protected — доступен в классе и подклассах, но не снаружи:
  protected validateId(id: string): void {
    if (!id || id.length === 0) throw new Error('Invalid ID');
  }

  // private — только в этом классе:
  private logOperation(op: string): void {
    console.log(`[${new Date().toISOString()}] ${op}`);
  }

  async findOrCreate(id: string, factory: () => T): Promise<T> {
    this.validateId(id);      // protected — доступен в базовом классе
    this.logOperation(`findOrCreate(${id})`); // private — только здесь
    const existing = await this.findById(id);
    return existing ?? await this.save(factory());
  }
}

class UserRepository extends Repository<User> {
  async findById(id: string): Promise<User | null> {
    this.validateId(id); // protected — доступен в подклассе
    // this.logOperation(...); // Ошибка: private, недоступно в подклассе
    return db.users.findUnique({ where: { id } });
  }

  async save(user: User): Promise<User> {
    return db.users.upsert({ where: { id: user.id }, data: user, create: user });
  }
}

// Важно: TypeScript private/protected — compile-time проверки!
// В runtime это обычные свойства объекта.
// Для реальной инкапсуляции используй # (JS private fields).
```

**Статические фабричные методы как паттерн**

```typescript
// Паттерн Factory Method через static — элегантное создание объектов:
class Color {
  private constructor(
    public readonly r: number,
    public readonly g: number,
    public readonly b: number,
    public readonly a: number = 1
  ) {
    if ([r, g, b].some(v => v < 0 || v > 255)) {
      throw new RangeError('RGB значения должны быть 0-255');
    }
  }

  // Несколько способов создания — каждый с понятным именем:
  static fromRGB(r: number, g: number, b: number): Color {
    return new Color(r, g, b);
  }

  static fromHex(hex: string): Color {
    const clean = hex.replace('#', '');
    return new Color(
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16)
    );
  }

  static fromHSL(h: number, s: number, l: number): Color {
    // ... HSL → RGB конвертация
    const [r, g, b] = hslToRgb(h, s, l);
    return new Color(r, g, b);
  }

  static readonly WHITE = new Color(255, 255, 255);
  static readonly BLACK = new Color(0, 0, 0);
  static readonly TRANSPARENT = new Color(0, 0, 0, 0);

  toHex(): string {
    return `#${[this.r, this.g, this.b]
      .map(v => v.toString(16).padStart(2, '0'))
      .join('')}`;
  }
}

// Использование:
const red = Color.fromHex('#FF0000');
const sky = Color.fromHSL(210, 100, 50);
const bg = Color.WHITE;
```

---

### Лучшие паттерны

**Паттерн 1: Приватные поля `#` вместо конвенции `_`**

```typescript
// ❌ Антипаттерн: конвенция underscore
class Timer {
  _interval: number | null = null; // "договорились не трогать", но можно
  _count = 0;

  start(ms: number) {
    this._interval = setInterval(() => this._count++, ms);
  }
}
const t = new Timer();
t._count = 9999; // Никаких ограничений!

// ✅ Правильно: приватные поля с гарантией доступа
class Timer {
  #interval: ReturnType<typeof setInterval> | null = null;
  #count = 0;

  start(ms: number): void {
    if (this.#interval) return; // Идемпотентность
    this.#interval = setInterval(() => this.#count++, ms);
  }

  stop(): void {
    if (this.#interval) {
      clearInterval(this.#interval);
      this.#interval = null;
    }
  }

  get count(): number { return this.#count; }
  get isRunning(): boolean { return this.#interval !== null; }
}
```
*Приватные поля `#` — это реальная защита данных на уровне синтаксиса движка. Конвенция `_` — только джентльменское соглашение без enforcement.*

**Паттерн 2: Статические фабричные методы для множественных способов создания**

```typescript
// ❌ Антипаттерн: перегруженный конструктор с union типами
class Point {
  x: number; y: number;
  constructor(xOrArray: number | [number, number] | string, y?: number) {
    if (Array.isArray(xOrArray)) {
      [this.x, this.y] = xOrArray;
    } else if (typeof xOrArray === 'string') {
      [this.x, this.y] = xOrArray.split(',').map(Number);
    } else {
      this.x = xOrArray; this.y = y!;
    }
  }
}

// ✅ Правильно: статические фабрики с ясными именами
class Point {
  private constructor(public readonly x: number, public readonly y: number) {}

  static fromCoords(x: number, y: number): Point {
    return new Point(x, y);
  }

  static fromArray([x, y]: [number, number]): Point {
    return new Point(x, y);
  }

  static fromString(str: string): Point {
    const [x, y] = str.split(',').map(Number);
    if (isNaN(x) || isNaN(y)) throw new Error(`Invalid point: "${str}"`);
    return new Point(x, y);
  }

  static readonly ORIGIN = new Point(0, 0);

  distanceTo(other: Point): number {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
  }
}

const p1 = Point.fromCoords(3, 4);
const p2 = Point.fromArray([0, 0]);
const p3 = Point.fromString('5,10');
console.log(p1.distanceTo(p2)); // 5
```
*Приватный конструктор + статические фабрики: невозможно создать некорректный объект, каждый способ создания имеет имя, описывающее намерение.*

**Паттерн 3: Геттеры для вычисляемых свойств**

```typescript
// ❌ Антипаттерн: хранить вычисляемые данные
class Circle {
  radius: number;
  area: number;       // Должен обновляться при каждом изменении radius — забываем!
  circumference: number;

  constructor(radius: number) {
    this.radius = radius;
    this.area = Math.PI * radius ** 2;
    this.circumference = 2 * Math.PI * radius;
  }
}
const c = new Circle(5);
c.radius = 10;
console.log(c.area); // 78.53... — УСТАРЕЛО! Не пересчиталось!

// ✅ Правильно: геттеры вычисляют на лету
class Circle {
  constructor(public radius: number) {}

  get area(): number {
    return Math.PI * this.radius ** 2;
  }

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  get diameter(): number {
    return this.radius * 2;
  }
}

const c = new Circle(5);
console.log(c.area);    // 78.53...
c.radius = 10;
console.log(c.area);    // 314.15... — всегда актуально!
// Использование как свойство, не как метод: c.area, не c.area()
```
*Геттеры — вычисляемые свойства: синтаксис как поле, логика как метод. Всегда актуальны, не нужно следить за синхронизацией.*

---

### Вопросы интервью

**Q1: Чем классы ES6 отличаются от функций-конструкторов?**

Классы ES6 — это синтаксический сахар над прототипным наследованием; под капотом создаётся та же самая прототипная структура. Ключевые отличия в поведении: классы не поднимаются (not hoisted), их тело выполняется в строгом режиме, их нельзя вызывать без `new` (TypeError), методы класса не перечислимы (`enumerable: false`), тогда как методы на прототипе через присвоение перечислимы. Кроме того, классы поддерживают `super`, приватные поля `#`, статические блоки инициализации. Проверить разницу: `Object.getOwnPropertyDescriptor(MyClass.prototype, 'method').enumerable` — для класса будет `false`.

**Q2: Что делает `super()` в дочернем классе?**

`super()` в конструкторе дочернего класса вызывает конструктор родительского класса. Это обязательно: дочерний класс не может получить доступ к `this` до вызова `super()`, потому что именно `super()` создаёт и инициализирует объект. Если пропустить `super()` — ReferenceError при обращении к `this`. `super.method()` в методах (не в конструкторе) вызывает метод с прототипа родителя, позволяя расширять поведение без полного переопределения. `super` — это специальная синтаксическая конструкция, не обычная переменная; её нельзя присвоить переменной.

**Q3: В чём разница между `#` приватными полями и конвенцией `_`?**

Приватные поля `#` — реальная инкапсуляция, встроенная в синтаксис движка. Обращение к `obj.#field` вне класса — SyntaxError на этапе парсинга, не в runtime. Они недоступны даже через `Object.keys`, `JSON.stringify` или `Object.getOwnPropertyNames`. Конвенция `_private` — это просто договорённость команды: технически свойство публично, доступно снаружи, видно в `Object.keys`. В TypeScript `private` ключевое слово — compile-time проверка, но в JavaScript runtime свойство остаётся доступным. `#` поля также не наследуются — нельзя обратиться к `#parent` полю из дочернего класса, это защищает инварианты родителя.

**Q4: Что такое статические поля и методы, как они работают?**

Статические члены принадлежат классу, а не его экземплярам. Они хранятся непосредственно на объекте функции-конструктора (а не на `prototype`), поэтому доступны через имя класса: `MyClass.staticMethod()`, но не через `new MyClass().staticMethod()`. В TypeScript статические поля идеальны для: фабричных методов, констант конфигурации, счётчиков экземпляров, синглтонов. Статические блоки инициализации (ES2022) `static { }` позволяют выполнить произвольный код при "загрузке" класса — например, для сложной инициализации статических полей. Наследование: `class Child extends Parent` — `Child.staticMethod()` ищет метод сначала на `Child`, затем на `Parent`.

**Q5: Что такое геттеры и сеттеры в классах, зачем они нужны?**

Геттеры (`get`) и сеттеры (`set`) — аксессоры, позволяющие использовать синтаксис свойства (`obj.prop`) при наличии логики. Геттер: вычисляет значение при каждом обращении (ленивое вычисление, всегда актуальные данные). Сеттер: выполняет валидацию или side-effects при записи (`obj.prop = value`). Под капотом они создают property descriptor с `get`/`set` вместо `value`/`writable`. В TypeScript геттер и сеттер должны иметь совместимые типы: тип параметра сеттера должен быть совместим с типом возврата геттера. Нельзя иметь сеттер без соответствующего геттера (только чтение можно через readonly, только запись — редкий случай).

**Q6: Почему нельзя деструктурировать метод класса?**

```javascript
class Logger {
  prefix = '[LOG]';
  log(msg) { console.log(this.prefix, msg); }
}
const logger = new Logger();
const { log } = logger; // Деструктуризация — берём функцию без контекста
log('test');            // TypeError: Cannot read property 'prefix' of undefined
```
При деструктуризации `log` становится обычной функцией без привязки к `logger`. `this` внутри метода в строгом режиме (а классы всегда в строгом режиме) будет `undefined`. Решения: стрелочная функция как поле класса (`log = (msg) => { ... }` — захватывает `this` лексически, но создаётся отдельно для каждого экземпляра), `log.bind(logger)`, или использование объекта напрямую. 🔗 Связь с темой 7 (this): это классический случай потери контекста при передаче метода в callback.

**Q7: Как работает `instanceof` с классами и наследованием?**

`instanceof` проверяет прототипную цепочку объекта, сравнивая каждый прототип с `Constructor.prototype`. При наследовании `class Dog extends Animal`: `dog instanceof Dog` → true (Dog.prototype в цепочке), `dog instanceof Animal` → true (Animal.prototype тоже в цепочке), `dog instanceof Object` → true (Object.prototype всегда в конце). Можно переопределить через `Symbol.hasInstance` на классе. Ограничение: не работает корректно при сравнении объектов из разных контекстов выполнения (разные iframe, vm.createContext в Node.js) — у них разные `Object.prototype`. Альтернатива: `Object.prototype.toString.call(obj)` для встроенных типов.

**Q8: Можно ли расширять встроенные классы (Array, Map, Error)?**

Да, ES6 классы поддерживают `extends` для встроенных. `class MyArray extends Array {}` — работает, методы типа `map`, `filter` вернут `MyArray`. `class AppError extends Error {}` — стандартный паттерн для иерархии ошибок. Нюансы: встроенные классы используют `Symbol.species` для определения класса, возвращаемого при `map`/`filter` — можно переопределить. При расширении `Error` нужно явно задавать `this.name` и корректировать стек: `Object.setPrototypeOf(this, new.target.prototype)` для совместимости с TypeScript. Расширение `Array` не работало корректно с ES5-конструкторами (`Function.call`), но с ES6 классами — полноценно.

**Q9: Что такое "статический блок инициализации" (static initialization block)?**

Статический блок `static { }` (ES2022) выполняется один раз при создании класса (не при создании экземпляра) и позволяет выполнить произвольную логику для инициализации статических свойств — например, try/catch, сложные вычисления, регистрация. Это единственный способ использовать `try/catch` при инициализации статических полей. `static { this.config = loadConfig(); }` — `this` внутри блока ссылается на сам класс. Порядок выполнения: сначала статические поля в порядке объявления, затем статические блоки в порядке объявления.

---

### Практическое задание

Реализуй класс `EventEmitter` с методами `on`, `off`, `emit`, `once`:

```typescript
// Требования:
// on(event, listener)  — подписаться на событие
// off(event, listener) — отписаться от события
// emit(event, ...args) — вызвать все подписчики события с аргументами
// once(event, listener)— подписаться ОДИН РАЗ (авто-отписка после первого вызова)
// on() должен возвращать функцию для отписки (unsubscribe)

// Тесты:
const emitter = new EventEmitter<{
  data: [string, number];
  error: [Error];
  done: [];
}>();

const handler = (msg: string, code: number) => console.log(msg, code);
const unsubscribe = emitter.on('data', handler);

emitter.once('done', () => console.log('Завершено!'));

emitter.emit('data', 'hello', 42);  // 'hello 42'
emitter.emit('data', 'world', 100); // 'world 100'
emitter.emit('done');               // 'Завершено!'
emitter.emit('done');               // (тишина — once уже отработал)

unsubscribe();
emitter.emit('data', 'silenced', 0); // (тишина — отписались)
```

---

### Решение с инсайтом

```typescript
type EventMap = Record<string, unknown[]>;
type Listener<Args extends unknown[]> = (...args: Args) => void;

class EventEmitter<Events extends EventMap = Record<string, unknown[]>> {
  // Приватная Map: event → Set слушателей
  // Set гарантирует уникальность и O(1) удаление
  #listeners = new Map<keyof Events, Set<Listener<any>>>();

  on<K extends keyof Events>(
    event: K,
    listener: Listener<Events[K]>
  ): () => void {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event)!.add(listener);

    // Возвращаем функцию отписки (React-style cleanup):
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(
    event: K,
    listener: Listener<Events[K]>
  ): void {
    this.#listeners.get(event)?.delete(listener);
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
    // Копируем Set перед итерацией: emit может изменить listeners
    // (например, once удаляет себя во время вызова)
    const listeners = this.#listeners.get(event);
    if (!listeners) return;

    for (const listener of [...listeners]) {
      listener(...args);
    }
  }

  once<K extends keyof Events>(
    event: K,
    listener: Listener<Events[K]>
  ): () => void {
    // Обёртка, которая отписывается после первого вызова:
    const wrapper: Listener<Events[K]> = (...args) => {
      this.off(event, wrapper); // Удаляем обёртку, не оригинальный listener
      listener(...args);
    };
    return this.on(event, wrapper);
  }

  // Бонус: количество слушателей события
  listenerCount<K extends keyof Events>(event: K): number {
    return this.#listeners.get(event)?.size ?? 0;
  }

  // Бонус: удалить все слушатели события (или все вообще)
  removeAllListeners<K extends keyof Events>(event?: K): void {
    if (event !== undefined) {
      this.#listeners.delete(event);
    } else {
      this.#listeners.clear();
    }
  }
}

// --- Тесты ---
const emitter = new EventEmitter<{
  data: [string, number];
  done: [];
}>();

const handler = (msg: string, code: number) => console.log(msg, code);
const unsubscribe = emitter.on('data', handler);

emitter.once('done', () => console.log('Завершено!'));

emitter.emit('data', 'hello', 42);   // hello 42
emitter.emit('data', 'world', 100);  // world 100
emitter.emit('done');                // Завершено!
emitter.emit('done');                // (тишина)

console.log(emitter.listenerCount('data')); // 1

unsubscribe();
emitter.emit('data', 'silenced', 0); // (тишина)
console.log(emitter.listenerCount('data')); // 0
```

**Ключевой инсайт:** `once` реализуется не через флаг в состоянии, а через обёртку-функцию, которая отписывает саму себя. Это элегантный паттерн: логика "одного выстрела" полностью инкапсулирована в обёртке. Копирование `[...listeners]` перед итерацией защищает от мутации коллекции во время обхода — классическая ловушка при реализации `emit`.

---

→ Следующая тема: [14 — Property Descriptors]

---

## Тема 14 — Property Descriptors

← Предыдущая тема: [13 — Классы ES6]

---

### Теория

**Аналогия: документ с правами доступа**

Представь корпоративный документ в системе управления правами. У каждого поля документа есть метаданные: кто может читать (`enumerable`), кто может редактировать (`writable`), кто может удалять/переструктурировать (`configurable`), и само значение (`value`). JavaScript хранит точно такие же метаданные для каждого свойства объекта — это Property Descriptors.

```
Свойство объекта — это не просто пара ключ:значение.
Это объект с метаданными:

obj.name = 'Vasya'

Под капотом:
{
  value:        'Vasya',   // Само значение
  writable:     true,      // Можно изменить?
  enumerable:   true,      // Видно в for...in, Object.keys?
  configurable: true       // Можно удалить/переопределить дескриптор?
}
```

**Четыре атрибута Data Descriptor**

```javascript
const obj = {};

Object.defineProperty(obj, 'name', {
  value:        'Вася',
  writable:     false,  // Нельзя изменить через присвоение
  enumerable:   true,   // Видно в Object.keys
  configurable: false   // Нельзя удалить или изменить дескриптор
});

console.log(obj.name); // 'Вася'
obj.name = 'Петя';     // Тихо игнорируется (или TypeError в strict mode)
console.log(obj.name); // 'Вася' — не изменилось!

delete obj.name;       // false — не удалено (или TypeError в strict mode)
console.log(obj.name); // 'Вася' — всё ещё есть

// Просмотр дескриптора:
console.log(Object.getOwnPropertyDescriptor(obj, 'name'));
// { value: 'Вася', writable: false, enumerable: true, configurable: false }
```

**Data Descriptor vs Accessor Descriptor**

```
Descriptor — два взаимоисключающих типа:

┌────────────────────────────────────────────────────────────────┐
│                    Data Descriptor                             │
│  value, writable, enumerable, configurable                     │
│  Обычное свойство со значением                                 │
├────────────────────────────────────────────────────────────────┤
│                   Accessor Descriptor                          │
│  get, set, enumerable, configurable                            │
│  Вычисляемое свойство — функции вместо значения               │
└────────────────────────────────────────────────────────────────┘
НЕЛЬЗЯ смешивать: нельзя одновременно задать value и get/set
```

```javascript
const person = { _age: 25 };

// Accessor descriptor:
Object.defineProperty(person, 'age', {
  get() {
    return this._age;
  },
  set(value) {
    if (typeof value !== 'number' || value < 0 || value > 150) {
      throw new RangeError('Некорректный возраст');
    }
    this._age = value;
  },
  enumerable: true,
  configurable: true
});

console.log(person.age);  // 25 — вызывает get()
person.age = 30;          // Вызывает set(30)
console.log(person.age);  // 30
// person.age = -1;       // RangeError: Некорректный возраст

const desc = Object.getOwnPropertyDescriptor(person, 'age');
// { get: [Function], set: [Function], enumerable: true, configurable: true }
// Заметь: нет value и writable!
```

**`Object.defineProperties` — задать несколько сразу**

```javascript
const config = {};
Object.defineProperties(config, {
  host: {
    value: 'localhost',
    writable: false,
    enumerable: true,
    configurable: false
  },
  port: {
    value: 3000,
    writable: false,
    enumerable: true,
    configurable: false
  },
  _debug: {
    value: false,
    writable: true,
    enumerable: false,  // Скрыто от Object.keys / for..in
    configurable: false
  }
});

console.log(Object.keys(config)); // ['host', 'port'] — _debug скрыт
```

**Таблица: freeze vs seal vs preventExtensions**

```
┌──────────────────────┬──────────────────┬────────────────┬─────────────────────┐
│ Метод                │ Добавлять поля?  │ Удалять поля?  │ Изменять значения?  │
├──────────────────────┼──────────────────┼────────────────┼─────────────────────┤
│ Object.freeze(obj)   │ ❌ Нет           │ ❌ Нет         │ ❌ Нет              │
│                      │                  │                │ writable: false     │
│                      │                  │                │ configurable: false │
├──────────────────────┼──────────────────┼────────────────┼─────────────────────┤
│ Object.seal(obj)     │ ❌ Нет           │ ❌ Нет         │ ✅ Да               │
│                      │                  │                │ configurable: false │
├──────────────────────┼──────────────────┼────────────────┼─────────────────────┤
│ Object.preventExt..  │ ❌ Нет           │ ✅ Да          │ ✅ Да               │
│ (obj)                │                  │                │                     │
└──────────────────────┴──────────────────┴────────────────┴─────────────────────┘

Проверка состояния:
Object.isFrozen(obj)
Object.isSealed(obj)
Object.isExtensible(obj)

ВАЖНО: freeze/seal — поверхностные! Вложенные объекты не затронуты.
```

```javascript
const obj = Object.freeze({ nested: { x: 1 } });
obj.nested = {};     // Тихо игнорируется (obj.nested не изменяется)
obj.nested.x = 99;  // РАБОТАЕТ — nested объект не заморожен!
console.log(obj.nested.x); // 99
```

---

### Связь со стеком

**Почему методы `Array.prototype` не видны в `for...in`**

```javascript
// Методы массива — non-enumerable:
const arr = [1, 2, 3];

for (const key in arr) {
  console.log(key); // '0', '1', '2' — только индексы, не 'map', 'filter' etc.
}

// Почему? Смотрим дескриптор:
const mapDescriptor = Object.getOwnPropertyDescriptor(Array.prototype, 'map');
console.log(mapDescriptor);
// {
//   value: [Function: map],
//   writable: true,
//   enumerable: false,  ← вот почему не видно в for...in
//   configurable: true
// }

// Все встроенные методы (Array, Object, String, etc.) — enumerable: false
// Твои методы через obj.method = fn — enumerable: true по умолчанию
// Методы ES6 классов — enumerable: false (как встроенные)
```

🔗 Связь с темой 12: `for...in` поднимается по прототипной цепочке, но благодаря `enumerable: false` встроенные методы невидимы.

**`Object.freeze` для конфигов в Next.js**

```typescript
// next.config.ts — типичное применение freeze для предотвращения
// случайной мутации конфигурации:

const ALLOWED_ORIGINS = Object.freeze([
  'https://myapp.com',
  'https://api.myapp.com',
] as const);

const DB_CONFIG = Object.freeze({
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT ?? '5432'),
  database: process.env.DB_NAME!,
} as const);

// В API Route:
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  if (!ALLOWED_ORIGINS.includes(origin as any)) {
    return new Response('Forbidden', { status: 403 });
  }
  // DB_CONFIG.host = 'evil.com'; // TypeError в strict mode — защищено!
  return Response.json({ db: DB_CONFIG.host });
}
```

**TypeScript `readonly` как compile-time аналог**

```typescript
// TypeScript readonly — проверка только на этапе компиляции:
interface Config {
  readonly host: string;
  readonly port: number;
}

const config: Config = { host: 'localhost', port: 3000 };
// config.host = 'other'; // TypeScript Error: Cannot assign to 'host' (readonly)

// НО в JavaScript runtime:
(config as any).host = 'evil.com'; // Работает! readonly — только compile-time

// Object.freeze — runtime защита:
const frozenConfig = Object.freeze({ host: 'localhost', port: 3000 });
frozenConfig.host = 'evil.com'; // TypeError в strict mode (или тихо игнорируется)

// Лучшая практика: и то, и другое:
const safeConfig = Object.freeze({
  host: process.env.HOST ?? 'localhost',
  port: Number(process.env.PORT ?? 3000),
} as const); // as const даёт TypeScript literal types + readonly
```

---

### Лучшие паттерны

**Паттерн 1: Константы через `Object.freeze`**

```javascript
// ❌ Антипаттерн: "константы" через const без freeze
const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
};
// const не защищает содержимое объекта:
HTTP_METHODS.DELETE = 'DELETE';  // Никаких ошибок!
HTTP_METHODS.GET = 'PATCH';      // Мутация константы!

// ✅ Правильно: freeze для истинной иммутабельности
const HTTP_METHODS = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const); // TypeScript: literal types и readonly

// HTTP_METHODS.GET = 'X';    // TypeError в strict mode
// HTTP_METHODS.NEW = 'NEW';  // TypeError в strict mode

type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];
// = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
```
*`const` предотвращает переприсвоение переменной, но не мутацию объекта. `Object.freeze` + `as const` даёт и runtime защиту, и TypeScript типизацию.*

**Паттерн 2: Non-enumerable метаданные**

```javascript
// ❌ Антипаттерн: метаданные в обычных свойствах
function createUser(name) {
  return {
    name,
    _id: crypto.randomUUID(),       // Видно в Object.keys, JSON.stringify
    _createdAt: new Date(),          // Загрязняет вывод и сериализацию
    _version: 1,
  };
}
const user = createUser('Вася');
console.log(Object.keys(user));     // ['name', '_id', '_createdAt', '_version']
console.log(JSON.stringify(user));  // Включает все _поля

// ✅ Правильно: метаданные как non-enumerable свойства
function createUser(name) {
  const user = { name };

  Object.defineProperties(user, {
    _id: {
      value: crypto.randomUUID(),
      writable: false,
      enumerable: false,    // Скрыто от перечисления
      configurable: false,
    },
    _createdAt: {
      value: new Date(),
      writable: false,
      enumerable: false,
      configurable: false,
    },
  });

  return user;
}

const user = createUser('Вася');
console.log(Object.keys(user));     // ['name'] — метаданные скрыты
console.log(JSON.stringify(user));  // '{"name":"Вася"}' — чистый JSON
console.log(user._id);             // Доступно при прямом обращении
```
*Non-enumerable свойства невидимы для `for...in`, `Object.keys`, `JSON.stringify`, но доступны при прямом обращении. Идеально для внутренних метаданных.*

**Паттерн 3: Геттеры через `defineProperty` для реактивности**

```javascript
// Этот паттерн лежит в основе Vue 2 reactivity и Angular watchers

// ❌ Без геттера: нет возможности перехватить чтение/запись
const state = { count: 0 };
// Как узнать, когда изменился state.count? Нужно оборачивать вручную.

// ✅ Реактивность через defineProperty (Vue 2 under the hood):
function makeReactive(obj, key, callback) {
  let internalValue = obj[key];

  Object.defineProperty(obj, key, {
    get() {
      // Сюда добавляют "сбор зависимостей" (dependency tracking)
      return internalValue;
    },
    set(newValue) {
      if (newValue === internalValue) return;
      const oldValue = internalValue;
      internalValue = newValue;
      callback(key, oldValue, newValue); // Уведомляем об изменении
    },
    enumerable: true,
    configurable: true, // configurable: true нужен для возможности переопределить
  });
}

const state = { count: 0, name: 'Вася' };
makeReactive(state, 'count', (key, old, next) => {
  console.log(`${key}: ${old} → ${next}`);
});

state.count = 1;  // 'count: 0 → 1'
state.count = 5;  // 'count: 1 → 5'
state.count = 5;  // (тишина — значение не изменилось)

// Современные фреймворки используют Proxy (ES6) вместо defineProperty,
// но понимание defineProperty объясняет историю реактивности
```
*Геттеры/сеттеры через `defineProperty` — основа паттерна Observer для реактивных данных. Vue 2 использовал именно этот механизм. Vue 3 и MobX перешли на `Proxy`, который перехватывает операции над всем объектом, а не отдельными свойствами.*

---

### Вопросы интервью

**Q1: Что такое property descriptor и какие атрибуты он содержит?**

Property descriptor — объект метаданных, описывающий свойство объекта в JavaScript. Существует два взаимоисключающих типа. Data descriptor содержит: `value` (само значение), `writable` (можно ли изменить через присвоение), `enumerable` (видно ли в `for...in`/`Object.keys`), `configurable` (можно ли удалить свойство или изменить дескриптор). Accessor descriptor содержит: `get` (функция-геттер), `set` (функция-сеттер), `enumerable`, `configurable`. Нельзя одновременно задать `value`/`writable` и `get`/`set`. По умолчанию при `obj.prop = value` все флаги `true`; при `Object.defineProperty` без указания флаги `false` по умолчанию.

**Q2: Что делает `Object.defineProperty` и когда используется?**

`Object.defineProperty(obj, key, descriptor)` создаёт новое свойство или изменяет дескриптор существующего с полным контролем над атрибутами. При обычном `obj.key = value` все три флага выставляются в `true`; `defineProperty` позволяет явно управлять каждым. Используется для: создания read-only констант (`writable: false`), скрытия метаданных (`enumerable: false`), создания реактивных свойств (`get`/`set`), предотвращения переопределения (`configurable: false`). Важно: `configurable: false` + `writable: false` делают свойство полностью неизменяемым и неудаляемым — это нельзя откатить. Именно это делает `Object.freeze` ко всем свойствам объекта.

**Q3: В чём разница между `Object.freeze`, `Object.seal` и `Object.preventExtensions`?**

`Object.preventExtensions` запрещает добавление новых свойств, но существующие можно изменять и удалять. `Object.seal` = `preventExtensions` + для всех свойств устанавливает `configurable: false` — нельзя добавлять или удалять свойства, но значения существующих изменять можно. `Object.freeze` = `seal` + для всех свойств устанавливает `writable: false` — полная иммутабельность объекта. Все три метода поверхностные: вложенные объекты не затрагиваются. Для глубокой заморозки нужна рекурсия. Состояние проверяется через `isFrozen`, `isSealed`, `isExtensible`. `freeze` нельзя отменить — это односторонняя операция.

**Q4: Что такое `enumerable: false` и когда это полезно?**

`enumerable: false` делает свойство "невидимым" для перечисляющих операций: `for...in`, `Object.keys()`, `Object.values()`, `Object.entries()`, `JSON.stringify()`, spread оператор `{...obj}`. Свойство при этом остаётся доступным при прямом обращении `obj.prop`. Полезно для: встроенных методов (все методы `Array.prototype`, `Object.prototype` — non-enumerable, поэтому не появляются в `for...in`), метаданных объекта (внутренние ID, версии, временные метки), методов в прототипах (методы ES6 классов — non-enumerable), вспомогательных свойств, которые не должны сериализоваться.

**Q5: Что такое `configurable: false` и что оно ограничивает?**

`configurable: false` запрещает: удаление свойства через `delete`, изменение атрибутов `enumerable` и `configurable`, переключение между data и accessor descriptor, изменение `get`/`set` аксессоров. Исключение: если `writable: true`, можно изменить `value` и переключить `writable` из `true` в `false` (но не обратно). `configurable: false` необратимо — нельзя вернуть `true`. Именно `configurable: false` делает `Object.freeze` "настоящим": без него можно было бы переопределить свойство через `defineProperty` даже при `writable: false`. Встроенные свойства вроде `Math.PI` имеют `writable: false, configurable: false`.

**Q6: Как `Object.keys` отличается от `for...in` с точки зрения дескрипторов?**

`Object.keys(obj)` возвращает только собственные (`hasOwnProperty`) перечислимые (`enumerable: true`) строковые ключи. `for...in` обходит все перечислимые строковые ключи по всей прототипной цепочке — и собственные, и унаследованные. В итоге: `Object.keys` предсказуем и не требует `hasOwnProperty`, но не видит symbol-ключи. `Object.getOwnPropertyNames` возвращает собственные ключи независимо от `enumerable`. `Object.getOwnPropertySymbols` — только symbol-ключи. `Reflect.ownKeys` = `getOwnPropertyNames` + `getOwnPropertySymbols` — абсолютно все собственные ключи. При итерации по объектам предпочитай `Object.entries(obj)` — безопасно и типобезопасно в TypeScript.

**Q7: Зачем использовать геттеры/сеттеры через `defineProperty` вместо обычных методов?**

Геттеры/сеттеры обеспечивают прозрачный интерфейс: код `obj.value = 5` выглядит как простое присвоение, но может содержать валидацию, логирование, уведомление подписчиков — без изменения вызывающего кода. Это соответствует принципу инкапсуляции. Ключевые применения: реактивные системы (Vue 2 использовал `defineProperty` для наблюдения за изменениями данных), ленивые вычисления (геттер вычисляет значение только при обращении), вычисляемые свойства (площадь круга из радиуса), логирование и отладка, миграция API (скрытая замена свойства на геттер без изменения потребителей). Современная альтернатива — `Proxy`, перехватывающий все операции с объектом.

**Q8: Как получить дескриптор свойства и зачем это может понадобиться?**

`Object.getOwnPropertyDescriptor(obj, key)` возвращает дескриптор собственного свойства. `Object.getOwnPropertyDescriptors(obj)` — дескрипторы всех собственных свойств. Применение: глубокое копирование с сохранением всех атрибутов (spread `{...obj}` или `Object.assign` теряют флаги дескрипторов!), клонирование с геттерами/сеттерами, инспекция библиотечного кода, отладка "почему свойство не изменяется". Правильное глубокое копирование: `Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj))` — сохраняет прототип и все дескрипторы. Это важно при наследовании классов и работе с библиотеками.

**Q9: Почему `Object.assign` и spread не копируют геттеры?**

`Object.assign(target, source)` и spread `{...source}` копируют значения перечислимых собственных свойств. Если свойство — геттер, вызывается геттер и копируется **результат** (`value`), а не сам геттер. Дескриптор теряется. Пример: если `source.x` — геттер, возвращающий `Math.random()`, то `Object.assign({}, source).x` будет числом, а не геттером. Для копирования с сохранением дескрипторов: `Object.defineProperties(target, Object.getOwnPropertyDescriptors(source))`. Это критично при клонировании классов с геттерами и при создании mixin-объектов. В TypeScript `structuredClone` (ES2022) также не копирует геттеры — только data properties.

---

### Практическое задание

Реализуй две утилиты:

1. `deepFreeze<T>(obj: T): Readonly<T>` — рекурсивная заморозка, замораживает объект и все вложенные объекты.
2. `observe<T extends object>(obj: T, callback: (key: keyof T, oldValue: T[keyof T], newValue: T[keyof T]) => void): T` — возвращает обёртку объекта, вызывающую `callback` при изменении любого свойства верхнего уровня.

```typescript
// Тесты deepFreeze:
const config = deepFreeze({
  db: { host: 'localhost', port: 5432 },
  cache: { ttl: 300 },
  flags: ['a', 'b'],
});

config.db.host = 'evil.com'; // Тихо игнорируется (strict: TypeError)
config.flags.push('c');      // Тихо игнорируется (strict: TypeError)
console.log(config.db.host);  // 'localhost'
console.log(config.flags);    // ['a', 'b']

// Тесты observe:
const state = observe({ count: 0, name: 'Вася' }, (key, old, next) => {
  console.log(`${String(key)}: ${old} → ${next}`);
});

state.count = 1;   // 'count: 0 → 1'
state.name = 'Петя'; // 'name: Вася → Петя'
state.count = 1;   // (тишина — значение не изменилось)
```

---

### Решение с инсайтом

```typescript
// ── deepFreeze ───────────────────────────────────────────────────────────────

function deepFreeze<T>(obj: T): Readonly<T> {
  // Обрабатываем только объекты (не примитивы, не null):
  if (obj === null || typeof obj !== 'object') return obj;

  // Сначала рекурсивно замораживаем все вложенные свойства:
  // getOwnPropertyNames включает non-enumerable — замораживаем всё
  Object.getOwnPropertyNames(obj).forEach(name => {
    const value = (obj as Record<string, unknown>)[name];
    if (value !== null && typeof value === 'object') {
      deepFreeze(value);
    }
  });

  // Затем замораживаем сам объект:
  return Object.freeze(obj);
}

// ── observe ───────────────────────────────────────────────────────────────────

function observe<T extends object>(
  obj: T,
  callback: (key: keyof T, oldValue: T[keyof T], newValue: T[keyof T]) => void
): T {
  // Создаём копию данных для хранения актуальных значений:
  const data = { ...obj };

  // Создаём новый объект-обёртку с теми же прототипом и ключами:
  const proxy = Object.create(Object.getPrototypeOf(obj)) as T;

  // Для каждого свойства определяем геттер/сеттер:
  (Object.keys(obj) as Array<keyof T>).forEach(key => {
    Object.defineProperty(proxy, key, {
      get(): T[typeof key] {
        return data[key];
      },
      set(newValue: T[typeof key]): void {
        const oldValue = data[key];
        if (Object.is(oldValue, newValue)) return; // Нет изменений
        data[key] = newValue;
        callback(key, oldValue, newValue);
      },
      enumerable: true,
      configurable: true,
    });
  });

  return proxy;
}

// ── Тесты ────────────────────────────────────────────────────────────────────

// deepFreeze:
const config = deepFreeze({
  db: { host: 'localhost', port: 5432 },
  cache: { ttl: 300 },
  flags: ['a', 'b'] as string[],
});

config.db.host = 'evil.com';    // TypeError в strict mode
config.flags.push('c');         // TypeError в strict mode
console.log(config.db.host);    // 'localhost'
console.log(config.flags);      // ['a', 'b']
console.log(Object.isFrozen(config.db)); // true — вложенный тоже заморожен

// observe:
const state = observe(
  { count: 0, name: 'Вася' },
  (key, old, next) => console.log(`${String(key)}: ${old} → ${next}`)
);

state.count = 1;     // 'count: 0 → 1'
state.name = 'Петя'; // 'name: Вася → Петя'
state.count = 1;     // (тишина — Object.is(1, 1) === true)

console.log(state.count); // 1
console.log(state.name);  // 'Петя'

// Проверяем дескрипторы:
const descriptor = Object.getOwnPropertyDescriptor(state, 'count');
console.log(descriptor);
// { get: [Function], set: [Function], enumerable: true, configurable: true }
// Нет value! — это accessor descriptor
```

**Ключевой инсайт:** `deepFreeze` должна рекурсировать сначала вглубь, потом замораживать текущий уровень — иначе `Object.freeze` запретит дальнейшие изменения дескрипторов вложенных свойств. `observe` демонстрирует, почему Vue 2 использовал `defineProperty`: превращая каждое свойство в accessor descriptor, мы получаем перехват всех операций чтения и записи. `Object.is` вместо `===` корректно обрабатывает граничные случаи: `Object.is(NaN, NaN) === true` и `Object.is(0, -0) === false`.

---

→ Следующая тема: [15 — Map, Set и WeakRef]
