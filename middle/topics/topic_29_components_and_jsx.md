# Контент курса — Тема 29: Компоненты и JSX

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 9 — Тема 29 (Компоненты и JSX)

---

# Тема 29 — Компоненты и JSX

← Предыдущая тема: [28 — SOLID / DRY / KISS](section_8_patterns.md)
→ Следующая тема: [30 — Virtual DOM и реконсиляция (Fiber)](topic_30_virtual_dom_and_fiber.md)

---

## 1. Теория с аналогиями

**Аналогия: конструктор Lego**

Представь конструктор Lego. У тебя есть базовые блоки (кнопка, поле ввода, аватар) — из них собираются более крупные узлы (форма, карточка пользователя), а из узлов — целые сцены (страница). Каждый блок Lego самодостаточен: у него чёткие места крепления (пропсы) и он не знает, в какую именно сцену его вставят. Компонент в React — тот же блок: самодостаточная единица UI с чёткими "точками крепления" — входными пропсами и выходной разметкой.

```
Страница (App)
 └── Layout
      ├── Header
      │    └── SearchInput      (блок)
      └── ProductList
           └── ProductCard × N  (блок, переиспользуемый)
                ├── ProductImage
                └── AddToCartButton
```

**Компонент — это просто функция**

```typescript
// Функция: вход → выход
function add(a: number, b: number): number {
  return a + b;
}

// Компонент: пропсы (вход) → JSX-дерево (выход)
function Greeting({ name }: { name: string }) {
  return <h1>Привет, {name}!</h1>;
}
```

Ключевое отличие от обычной функции — компонент вызывается не напрямую (`Greeting({ name: 'Alice' })`), а через JSX (`<Greeting name="Alice" />`), и React сам решает, когда его вызвать (при монтировании, при ре-рендере).

**JSX — синтаксический сахар над `React.createElement`**

```typescript
// То, что ты пишешь:
const element = <h1 className="title">Привет, {name}</h1>;

// Во что это компилируется (упрощённо, Babel/TypeScript):
const element = React.createElement(
  'h1',
  { className: 'title' },
  'Привет, ',
  name
);

// React 17+ (новый JSX transform, автоматический импорт):
import { jsx as _jsx } from 'react/jsx-runtime';
const element = _jsx('h1', { className: 'title', children: ['Привет, ', name] });
```

`createElement` не создаёт DOM-узел — он создаёт обычный JS-объект, описывающий, "что хотелось бы увидеть на экране":

```javascript
{
  type: 'h1',
  key: null,
  props: { className: 'title', children: ['Привет, ', 'Alice'] }
}
```

Это и есть элемент Virtual DOM — тема следующего занятия (🔗 Тема 30).

**Правила JSX, которые ловят на интервью**

```typescript
// 1. Один корневой элемент (или Fragment)
function Bad() {
  return (
    <div>A</div>
    <div>B</div>  // ❌ SyntaxError: Adjacent JSX elements
  );
}

function Good() {
  return (
    <>              {/* Fragment — не создаёт лишний DOM-узел */}
      <div>A</div>
      <div>B</div>
    </>
  );
}

// 2. className, не class (class — зарезервированное слово JS)
<div className="card" />

// 3. Любое JS-выражение в {} — но не оператор (if, for)
<div>{isLoading ? 'Загрузка...' : 'Готово'}</div>   // ✓ тернарник
<div>{items.map(i => <Item key={i.id} {...i} />)}</div> // ✓ выражение

// 4. camelCase для атрибутов DOM
<button onClick={handleClick} tabIndex={0} />

// 5. Самозакрывающиеся теги без children — обязателен слэш
<img src="/logo.png" />   // ✓
<img src="/logo.png">     // ❌ SyntaxError
```

**Пропсы — однонаправленный поток данных**

```typescript
interface CardProps {
  title: string;
  isHighlighted?: boolean;   // опциональный пропс
  children: React.ReactNode; // содержимое между тегами
  onSelect: (id: string) => void;
}

function Card({ title, isHighlighted = false, children, onSelect }: CardProps) {
  return (
    <div className={isHighlighted ? 'card card--active' : 'card'} onClick={() => onSelect(title)}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

// Использование
<Card title="Заказ №1" onSelect={handleSelect}>
  <p>Детали заказа...</p>
</Card>
```

Пропсы **иммутабельны** внутри компонента: `Card` не может сделать `title = 'другое'`. Данные текут строго "сверху вниз" — от родителя к ребёнку. Это фундаментальное архитектурное решение: без него невозможно предсказать, кто и когда изменил состояние UI (🔗 Тема 5 — Значение vs Ссылка: тот же принцип иммутабельности).

**Композиция vs наследование**

```typescript
// ❌ "Наследование" компонентов — React так не работает и не должен
// (в отличие от классического ООП, здесь это не идиоматично)

// ✅ Композиция — компонент как "слот" для другого контента
function Dialog({ title, children, footer }: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="dialog">
      <header>{title}</header>
      <main>{children}</main>
      {footer && <footer>{footer}</footer>}
    </div>
  );
}

// Специализация через композицию, а не наследование
function ConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <Dialog
      title="Подтвердите действие"
      footer={
        <>
          <button onClick={onCancel}>Отмена</button>
          <button onClick={onConfirm}>Подтвердить</button>
        </>
      }
    >
      <p>Это действие нельзя отменить.</p>
    </Dialog>
  );
}
```

React Team официально рекомендует композицию вместо наследования: наследование компонентов создаёт жёсткую иерархию классов, композиция — гибкие, независимо тестируемые "слоты".

**Условный рендеринг и списки**

```typescript
// Условный рендеринг — обычные JS-выражения, без специального синтаксиса
function Status({ isOnline }: { isOnline: boolean }) {
  return <span>{isOnline ? '🟢 Онлайн' : '⚫ Оффлайн'}</span>;
}

function Notifications({ count }: { count: number }) {
  return (
    <div>
      {count > 0 && <span className="badge">{count}</span>}
      {/* ⚠️ Ловушка: count === 0 отрендерит "0", а не ничего! */}
    </div>
  );
}

// Списки — обязателен key
function List({ items }: { items: { id: string; text: string }[] }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.text}</li>   // key — по стабильному id, не по index
      ))}
    </ul>
  );
}
```

---

## 2. Связь со стеком

**TypeScript: типизация пропсов и `children`**

```typescript
// React.ReactNode покрывает: строки, числа, JSX, массивы, null, undefined
interface LayoutProps {
  children: React.ReactNode;
}

// PropsWithChildren — утилитарный тип для той же цели
function Layout({ children }: React.PropsWithChildren) {
  return <div className="layout">{children}</div>;
}

// Generic-компоненты — переиспользуемые списки с типобезопасностью
function TypedList<T>({ items, renderItem }: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  return <ul>{items.map((item, i) => <li key={i}>{renderItem(item)}</li>)}</ul>;
}
```

**Next.js: Server Components по умолчанию — компонент без интерактивности**

```typescript
// app/products/page.tsx — Server Component (по умолчанию, без "use client")
// Не может использовать useState/useEffect — рендерится на сервере, не гидратируется
export default async function ProductsPage() {
  const products = await fetchProducts(); // await прямо в компоненте (🔗 Тема 16)
  return (
    <ul>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </ul>
  );
}
```

Подробнее о Server Components — в отдельной теме (🔗 Тема 42).

**JSX как часть более широкой экосистемы**

JSX — не эксклюзив React: тот же синтаксис (с трансформацией через Babel/tsc) использует Preact, Solid.js. Понимание того, что JSX = вызовы функций, объясняет, почему в JSX нельзя писать `if`/`for` напрямую — это выражения, а не операторы, они должны *возвращать значение*, которое ляжет в аргумент функции.

---

## 3. Лучшие паттерны

**✅ Паттерн 1: Деструктуризация пропсов с дефолтами прямо в сигнатуре**

```typescript
// ❌ Плохо: props.xxx на каждой строке, дефолты через ||
function Button(props: { label: string; variant?: string; onClick?: () => void }) {
  const variant = props.variant || 'primary'; // || затирает falsy-значения (🔗 Тема 22)
  return <button className={variant} onClick={props.onClick}>{props.label}</button>;
}

// ✅ Хорошо: деструктуризация в параметрах + дефолт-значения
function Button({ label, variant = 'primary', onClick }: {
  label: string;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}) {
  return <button className={variant} onClick={onClick}>{label}</button>;
}
```

*Почему best practice:* Компонент читается как контракт — сразу видно все пропсы и их дефолты. Деструктуризация в параметрах — идиоматичный React-стиль (🔗 Тема 19).

**✅ Паттерн 2: Компонент рендерит один тип UI-состояния за раз**

```typescript
// ❌ Плохо: вложенные тернарники — нечитаемо
function UserCard({ user, loading, error }: Props) {
  return (
    <div>
      {loading ? <Spinner /> : error ? <ErrorMessage error={error} /> : user ? <Profile user={user} /> : null}
    </div>
  );
}

// ✅ Хорошо: раннний return для каждого состояния
function UserCard({ user, loading, error }: Props) {
  if (loading) return <Spinner />;
  if (error)   return <ErrorMessage error={error} />;
  if (!user)   return null;
  return <Profile user={user} />;
}
```

*Почему:* Каждая ветка — самостоятельный `return`, легко читается сверху вниз, легко добавить новое состояние без риска сломать вложенную логику.

**✅ Паттерн 3: `key` — стабильный уникальный id, никогда не index в изменяемых списках**

```typescript
// ❌ Плохо: index как key — React путает элементы при reorder/удалении
{todos.map((todo, index) => <TodoItem key={index} todo={todo} />)}

// ✅ Хорошо: стабильный id из данных
{todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
```

*Почему:* React использует `key` для сопоставления элементов между рендерами (🔗 Тема 30). Index как key при удалении элемента из середины списка приводит к тому, что React "переиспользует" DOM-узлы для неправильных данных — баги с состоянием `input`, анимациями, потерей фокуса.

---

## 4. Вопросы интервью

**Q1: Что такое компонент в React?**

Компонент — функция (или класс), принимающая пропсы и возвращающая описание UI (JSX-дерево / React-элементы). Это единица переиспользования и композиции интерфейса — аналог функции в обычном программировании, но с декларативным описанием результата.

**Q2: Чем JSX отличается от HTML?**

JSX — синтаксический сахар над `React.createElement`, а не HTML. Отсюда: `className` вместо `class`, camelCase-атрибуты (`onClick`, `tabIndex`), обязательное закрытие всех тегов, любое JS-выражение в `{}`, единственный корневой элемент на возврат.

**Q3: Во что компилируется JSX?**

В вызовы `React.createElement(type, props, ...children)` (классический transform) или `jsx()`/`jsxs()` из `react/jsx-runtime` (новый automatic transform, React 17+). Результат — обычный JS-объект, описывающий элемент, а не реальный DOM-узел.

**Q4: Почему в JSX нельзя писать `if` напрямую?**

JSX-выражения — это выражения (expression), а не операторы (statement) — они должны возвращать значение, встраиваемое в дерево. `if` не возвращает значение как выражение. Решение: тернарный оператор, `&&`, ранний `return` до JSX, или вынесение логики в переменную/функцию перед `return`.

**Q5: Зачем нужен `key` в списках и что будет, если его не указать?**

`key` — стабильный идентификатор элемента для алгоритма реконсиляции: React сопоставляет элементы между рендерами по `key`, а не по позиции. Без `key` React в дев-режиме выдаст warning и будет использовать index — при изменении порядка/удалении элементов это приводит к неверному переиспользованию DOM-узлов и состояния.

**Q6: Почему пропсы иммутабельны?**

Однонаправленный поток данных (сверху вниз) — фундамент предсказуемости React. Если дочерний компонент мог бы менять свои пропсы, было бы невозможно определить единственный источник правды для значения — несколько компонентов начали бы "спорить" за состояние. Изменение состояния — обязанность родителя (через переданный колбэк) или самого компонента (через собственный `useState`).

**Q7: В чём разница `children` и обычного пропса?**

`children` — специальный пропс, соответствующий содержимому между открывающим и закрывающим тегом компонента (`<Card>содержимое</Card>` → `props.children === 'содержимое'`). Технически это обычный пропс, но JSX даёт для него отдельный удобный синтаксис — используется для композиции (слотов).

**Q8: Почему `{count > 0 && <Badge/>}` может отрендерить лишний "0"?**

`&&` возвращает левый операнд, если он falsy. Если `count === 0`, выражение вернёт `0` (число), а React рендерит числа как текст — на экране появится "0". Решение: явное приведение к boolean (`count > 0 && ...` уже boolean, но `count && ...` — нет) или тернарник `count > 0 ? <Badge/> : null`.

**Q9: Композиция или наследование — что выбирает React и почему?**

React рекомендует композицию: передачу компонентов как пропсов (включая `children`) вместо наследования от базовых классов. Композиция даёт гибкость "слотов" без жёсткой иерархии, легче тестируется и не создаёт проблем множественного наследования — сами создатели React явно отказались от паттернов наследования компонентов.

**Q10: Могут ли компоненты возвращать `null`?**

Да — компонент, вернувший `null`, `undefined`, `false` или `true`, не рендерит ничего в DOM. Это стандартный способ условно "не показывать" компонент, не выходя из дерева рендеринга родителя.

---

## 5. Практическое задание

Реализуй компонент `Accordion` на TypeScript:

1. Принимает пропс `items: { id: string; title: string; content: React.ReactNode }[]`.
2. Рендерит список заголовков; по клику на заголовок раскрывается/закрывается соответствующий контент.
3. Одновременно может быть раскрыт **только один** пункт (аккордеон, не список чекбоксов).
4. Используй композицию: выдели `AccordionItem` как отдельный дочерний компонент.

---

## 6. Решение с инсайтом

```typescript
import { useState } from 'react';

interface AccordionItemData {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionItemProps {
  item: AccordionItemData;
  isOpen: boolean;
  onToggle: (id: string) => void;
}

function AccordionItem({ item, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="accordion-item">
      <button
        className="accordion-header"
        aria-expanded={isOpen}
        onClick={() => onToggle(item.id)}
      >
        {item.title}
        <span>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className="accordion-content">{item.content}</div>}
    </div>
  );
}

interface AccordionProps {
  items: AccordionItemData[];
}

function Accordion({ items }: AccordionProps) {
  // Состояние — id раскрытого пункта (не массив: "только один открыт")
  const [openId, setOpenId] = useState<string | null>(null);

  function handleToggle(id: string) {
    // Клик по уже открытому пункту — закрыть; иначе — открыть новый
    setOpenId(prev => (prev === id ? null : id));
  }

  return (
    <div className="accordion">
      {items.map(item => (
        <AccordionItem
          key={item.id}                 // стабильный key
          item={item}
          isOpen={item.id === openId}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}

export default Accordion;
```

> **Инсайт:** Состояние "какой пункт открыт" вынесено в родителя (`Accordion`), а не в каждый `AccordionItem` — это единственный способ гарантировать инвариант "открыт максимум один пункт". Компонент-ребёнок остаётся "глупым" (presentational): он не знает про других детей, только рендерит переданные `isOpen`/`onToggle`. Этот паттерн — "state up, UI down" — база для понимания `useState` (🔗 Тема 31) и `useContext` (🔗 Тема 37) в более сложных сценариях.

---

*Раздел 9 — Компоненты и рендеринг · Тема 29 из 43*
