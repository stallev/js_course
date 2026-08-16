# Контент курса — Тема 35: useMemo, useCallback и React.memo

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 11 — Тема 35 (useMemo, useCallback, React.memo)

---

# Тема 35 — useMemo, useCallback и React.memo

← Предыдущая тема: [34 — useLayoutEffect и useInsertionEffect](topic_34_uselayouteffect_useinsertioneffect.md)
→ Следующая тема: [36 — useRef и useImperativeHandle](topic_36_useref_useimperativehandle.md)

---

## 1. Теория с аналогиями

**Аналогия: кухня ресторана и заранее приготовленный соус**

Шеф-повар не готовит фирменный соус с нуля для каждого заказа — он готовит большую порцию один раз и переиспользует, пока не изменятся ингредиенты (зависимости). `useMemo` — тот же принцип для **значений**: не пересчитывать дорогое вычисление на каждом рендере, если входные данные не изменились. `useCallback` — то же самое, но для **функций**: не создавать новую функцию-ссылку на каждом рендере, если её "рецепт" (замкнутые переменные) не изменился.

**Проблема, которую решает мемоизация: referential equality (🔗 Тема 5)**

```typescript
function ProductList({ products }: { products: Product[] }) {
  // Каждый рендер ProductList создаёт НОВЫЙ объект filterOptions и НОВУЮ функцию handleClick,
  // даже если данные не изменились
  const filterOptions = { category: 'all', sortBy: 'price' };   // новая ссылка каждый рендер
  const handleClick = (id: string) => console.log(id);           // новая ссылка каждый рендер

  return products.map(p => (
    <ProductCard key={p.id} product={p} options={filterOptions} onClick={handleClick} />
  ));
}
```

Если `ProductCard` обёрнут в `React.memo` (пропускает ре-рендер, если пропсы `Object.is`-равны предыдущим), `filterOptions` и `handleClick` **всё равно** будут "новыми" на каждом рендере родителя — `React.memo` не спасёт, потому что сравнение по ссылке всегда даст `false`.

**`useMemo` — мемоизация значения**

```typescript
// ❌ Плохо: дорогое вычисление на КАЖДОМ рендере, даже не связанном с items
function Dashboard({ items, theme }: { items: Item[]; theme: string }) {
  const total = items.reduce((sum, i) => sum + expensiveCalculation(i), 0); // пересчёт при смене theme!
  return <div className={theme}>{total}</div>;
}

// ✅ Хорошо: пересчёт только когда items реально изменился
function Dashboard({ items, theme }: { items: Item[]; theme: string }) {
  const total = useMemo(
    () => items.reduce((sum, i) => sum + expensiveCalculation(i), 0),
    [items] // при смене theme total НЕ пересчитывается
  );
  return <div className={theme}>{total}</div>;
}
```

**`useCallback` — мемоизация функции (частный случай `useMemo`)**

```typescript
// useCallback(fn, deps) === useMemo(() => fn, deps) — синтаксический сахар для функций
const handleClick = useCallback((id: string) => {
  onSelect(id, category); // замыкает onSelect и category
}, [onSelect, category]); // новая ссылка только если onSelect или category изменились
```

**Схема: когда мемоизация реально нужна**

```
Мемоизация окупается, когда:
┌─────────────────────────────────────────────────────────┐
│ 1. Вычисление действительно дорогое (заметно на профайлере)│
│ 2. Результат передаётся в React.memo-компонент —          │
│    ссылочная стабильность предотвращает лишний ре-рендер │
│ 3. Значение используется как зависимость другого хука      │
│    (useEffect/useMemo/useCallback) — без мемоизации        │
│    зависимость "новая" каждый рендер                       │
└─────────────────────────────────────────────────────────┘

Мемоизация НЕ нужна и вредит, когда:
┌─────────────────────────────────────────────────────────┐
│ 1. Вычисление дешёвое (сложение чисел, простой map)        │
│ 2. Значение никуда не передаётся как пропс/зависимость      │
│ 3. Компонент-потребитель не обёрнут в React.memo            │
│    (ссылочная стабильность никак не влияет на ре-рендер)   │
└─────────────────────────────────────────────────────────┘
```

**`React.memo` — мемоизация всего компонента**

```typescript
// Без memo: ProductCard ре-рендерится при КАЖДОМ ре-рендере родителя,
// даже если его собственные пропсы не изменились
function ProductCard({ product }: { product: Product }) {
  console.log('render', product.id); // будет вызываться при любом ре-рендере родителя
  return <div>{product.name}</div>;
}

// С memo: React сравнивает пропсы (shallow, Object.is по каждому полю)
// и пропускает ре-рендер, если все пропсы совпали
const ProductCard = React.memo(function ProductCard({ product }: { product: Product }) {
  console.log('render', product.id); // вызывается только если product — новая ссылка
  return <div>{product.name}</div>;
});
```

`React.memo` делает **shallow comparison** (сравнение верхнего уровня пропсов) — если пропс — объект/массив/функция, пересозданная на каждом рендере родителя, `memo` не поможет без дополнительной мемоизации самого пропса на стороне родителя.

**Цепочка: `memo` без `useMemo`/`useCallback` в родителе — бесполезен**

```typescript
// ProductCard обёрнут в memo, но получает новый объект options на каждый рендер родителя
function Parent() {
  const [count, setCount] = useState(0); // не связан с products
  const options = { sortBy: 'price' };    // новая ссылка каждый рендер Parent

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ProductCard options={options} /> {/* React.memo НЕ спасёт — options всегда "новый" */}
    </>
  );
}

// ✅ Правильная цепочка: мемоизация должна быть на КАЖДОМ уровне передачи
function Parent() {
  const [count, setCount] = useState(0);
  const options = useMemo(() => ({ sortBy: 'price' }), []); // стабильная ссылка

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <ProductCard options={options} /> {/* теперь memo реально пропускает ре-рендер */}
    </>
  );
}
```

---

## 2. Связь со стеком

**React Compiler (React 19+) — автоматизация мемоизации**

Начиная с React 19, экспериментальный React Compiler автоматически вставляет мемоизацию там, где компилятор статически может доказать её безопасность и полезность — цель: избавить разработчиков от ручного `useMemo`/`useCallback`/`memo` в большинстве случаев. Понимание того, *почему* мемоизация работает, остаётся необходимым для отладки и для проектов, где компилятор ещё не используется.

**TypeScript: типизация зависимостей и стабильность через generic**

```typescript
function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback; // всегда актуальная версия без пересоздания debounce-таймера

  return useCallback((...args: Args) => {
    const timeoutId = setTimeout(() => callbackRef.current(...args), delay);
    return () => clearTimeout(timeoutId);
  }, [delay]);
}
```

**Next.js: мемоизация особенно важна в списках с сотнями Client Component-карточек** — типичный сценарий (лента товаров, комментарии) где `React.memo` + `useCallback` на обработчиках предотвращают заметное падение производительности при частых обновлениях родителя (фильтры, поиск).

---

## 3. Лучшие паттерны

**✅ Паттерн 1: Мемоизировать только после измерения (React DevTools Profiler), не "по умолчанию"**

```typescript
// ❌ Плохо: useMemo на дешёвом вычислении — накладные расходы на сравнение зависимостей
// превышают выгоду от пропуска пересчёта
const doubled = useMemo(() => count * 2, [count]); // сложение — дешевле, чем сам useMemo

// ✅ Хорошо: обычное вычисление для дешёвых операций
const doubled = count * 2;

// useMemo оправдан для реально дорогих операций
const sortedItems = useMemo(() => [...items].sort(expensiveComparator), [items]);
```

*Почему best practice:* Сам `useMemo` не бесплатен — хранение предыдущих зависимостей и их сравнение требует памяти и времени. React-документация прямо рекомендует сначала измерить проблему в Profiler, а не мемоизировать "на всякий случай".

**✅ Паттерн 2: `useCallback` имеет смысл только вместе с `React.memo` или как зависимость другого хука**

```typescript
// ❌ Бесполезно: onClick передаётся в обычный <button>, а не в memo-компонент —
// стабильность ссылки ничего не даёт
function Component() {
  const handleClick = useCallback(() => console.log('click'), []);
  return <button onClick={handleClick}>Click</button>; // DOM-элемент не сравнивает пропсы через memo
}

// ✅ Оправдано: onClick передаётся в мемоизированный дочерний компонент
const ExpensiveChild = React.memo(function ExpensiveChild({ onClick }: Props) {
  /* тяжёлый рендер */
});
function Component() {
  const handleClick = useCallback(() => console.log('click'), []);
  return <ExpensiveChild onClick={handleClick} />; // теперь стабильность ссылки предотвращает ре-рендер
}
```

*Почему:* `useCallback` без `React.memo`-получателя (или без использования как зависимости `useEffect`/`useMemo`) не даёт никакой производительной выгоды — только неоправданный оверхед.

**✅ Паттерн 3: Мемоизировать `value` объекта Context, чтобы избежать ре-рендера всех consumers**

```typescript
// ❌ Плохо: новый объект value на каждый рендер Provider → ре-рендер ВСЕХ consumers (🔗 Тема 37)
function ThemeProvider({ children }: Props) {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}> {/* новый объект каждый рендер */}
      {children}
    </ThemeContext.Provider>
  );
}

// ✅ Хорошо: мемоизация value предотвращает лишние ре-рендеры consumers
function ThemeProvider({ children }: Props) {
  const [theme, setTheme] = useState('light');
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

*Почему:* Все компоненты, читающие Context через `useContext`, ре-рендерятся при каждом изменении ссылки на `value` — мемоизация здесь напрямую влияет на производительность целого поддерева.

---

## 4. Вопросы интервью

**Q1: В чём разница между `useMemo` и `useCallback`?**

`useMemo(fn, deps)` мемоизирует **результат вызова** функции `fn` — возвращает вычисленное значение. `useCallback(fn, deps)` мемоизирует **саму функцию** — возвращает ту же ссылку на функцию, если зависимости не изменились. `useCallback(fn, deps)` эквивалентен `useMemo(() => fn, deps)`.

**Q2: Что такое referential equality и почему она важна для мемоизации?**

Сравнение по ссылке (через `Object.is`), а не по содержимому — два визуально идентичных объекта/массива/функции, созданные в разных вызовах, всегда не равны по ссылке. React использует именно ссылочное сравнение в `React.memo`, массиве зависимостей `useEffect`/`useMemo`/`useCallback` — без мемоизации каждый рендер создаёт новые ссылки, что ломает механизмы оптимизации, рассчитанные на стабильность.

**Q3: Когда мемоизация может навредить производительности?**

Когда вычисление или функция дешёвые — накладные расходы на хранение предыдущих зависимостей, их сравнение и обслуживание кэша `useMemo`/`useCallback` превышают выгоду от пропуска пересчёта. Излишняя мемоизация также усложняет чтение кода без измеримой пользы.

**Q4: Как работает `React.memo` и какое сравнение он использует?**

`React.memo` оборачивает компонент и сравнивает его новые пропсы с предыдущими через shallow comparison (поверхностное сравнение каждого поля через `Object.is`) перед вызовом функции компонента. Если все пропсы равны — React пропускает повторный вызов функции и повторное построение поддерева, переиспользуя предыдущий результат рендера.

**Q5: Почему `React.memo` может не сработать, даже если он применён к компоненту?**

Если хотя бы один пропс — новый объект/массив/функция, созданная без мемоизации в родителе на каждом рендере, shallow comparison всегда даёт `false` для этого пропса — `memo` не спасёт от ре-рендера. Мемоизация должна быть согласована на каждом уровне цепочки: и в родителе (данные, передаваемые как пропсы), и на самом компоненте.

**Q6: Можно ли использовать кастомную функцию сравнения в `React.memo`?**

Да — второй аргумент `React.memo(Component, arePropsEqual)` позволяет передать собственную функцию сравнения вместо стандартного shallow comparison. Используется редко, для специфичных случаев (например, глубокое сравнение конкретного поля), и требует осторожности — неправильная кастомная функция может пропустить нужный ре-рендер.

**Q7: Зачем мемоизировать `value`, передаваемый в `Context.Provider`?**

Каждый компонент, вызывающий `useContext` для этого контекста, ре-рендерится при любом изменении ссылки на `value`, независимо от того, использует ли он конкретное изменившееся поле. Если `value` — новый объект на каждом рендере провайдера (например, `{ theme, setTheme }`), все consumers будут ре-рендериться при каждом рендере провайдера, даже без реального изменения данных.

**Q8: Как измерить, нужна ли мемоизация в конкретном случае?**

React DevTools Profiler — записать сессию взаимодействия с приложением, посмотреть, какие компоненты ре-рендерятся и сколько времени занимает рендер. Если конкретный компонент ре-рендерится часто без изменения видимого результата и занимает заметное время — кандидат на `React.memo`; если вычисление занимает заметное время в самом компоненте — кандидат на `useMemo`.

**Q9: Что произойдёт, если передать в `useMemo`/`useCallback` пустой массив зависимостей `[]`?**

Функция будет вычислена (или создана) один раз при монтировании компонента и никогда не пересоздана заново — аналогично `useEffect(fn, [])`. Это оправдано только если внутри действительно нет зависимостей от пропсов/state, изменяющихся в течение жизни компонента; иначе — stale closure, аналогичный ловушке из Темы 33.

**Q10: В чём разница мемоизации на уровне React (`useMemo`/`memo`) и обычной мемоизации функции через замыкание (🔗 Тема 3, Тема 8)?**

Обычная ручная мемоизация (например, `memoize(fn)` из Темы 3) кэширует по значению аргументов (`JSON.stringify(args)` как ключ) и живёт вне цикла рендеринга React. `useMemo`/`React.memo` кэшируют по ссылочному сравнению зависимостей/пропсов и синхронизированы с жизненным циклом компонента — кэш сбрасывается автоматически при размонтировании и пересчитывается по правилам React, а не произвольно.

---

## 5. Практическое задание

Оптимизируй компонент `ProductGrid`, который ре-рендерит все `ProductCard` при любом изменении несвязанного состояния (например, счётчика посещений страницы):

1. Оберни `ProductCard` в `React.memo`.
2. Мемоизируй все объекты/функции, передаваемые в `ProductCard` как пропсы, чтобы `memo` реально работал.
3. Добавь `useMemo` для дорогой сортировки списка (пусть сортировка искусственно "тяжёлая" — с `Array(1_000_000)` внутри компаратора для демонстрации).
4. Продемонстрируй в комментариях, что без мемоизации оптимизация не сработала бы.

---

## 6. Решение с инсайтом

```typescript
import { useState, useMemo, useCallback, memo } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ProductCardProps {
  product: Product;
  onSelect: (id: string) => void;
}

// React.memo — пропускает ре-рендер, если product и onSelect не изменились по ссылке
const ProductCard = memo(function ProductCard({ product, onSelect }: ProductCardProps) {
  console.log('render card:', product.id); // в консоли — только при реальном изменении данных
  return (
    <div className="card" onClick={() => onSelect(product.id)}>
      {product.name} — {product.price}₴
    </div>
  );
});

function expensiveComparator(a: Product, b: Product): number {
  // Искусственная "тяжесть" — демонстрация ценности useMemo
  let dummy = 0;
  for (let i = 0; i < 100_000; i++) dummy += i;
  return a.price - b.price + dummy * 0;
}

function ProductGrid({ products }: { products: Product[] }) {
  const [visitCount, setVisitCount] = useState(0); // несвязанное состояние — меняется часто

  // useMemo: сортировка пересчитывается только когда products реально изменился,
  // а не при каждом клике "Увеличить визиты"
  const sortedProducts = useMemo(
    () => [...products].sort(expensiveComparator),
    [products]
  );

  // useCallback: onSelect — стабильная ссылка → React.memo на ProductCard реально работает
  const handleSelect = useCallback((id: string) => {
    console.log('selected', id);
  }, []); // не зависит ни от чего внешнего

  return (
    <div>
      <button onClick={() => setVisitCount(c => c + 1)}>
        Визитов: {visitCount} {/* меняет state ProductGrid, но не должно ре-рендерить карточки */}
      </button>
      <div className="grid">
        {sortedProducts.map(product => (
          <ProductCard key={product.id} product={product} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}

export default ProductGrid;

// Без useMemo/useCallback/memo: клик по "Увеличить визиты" вызвал бы:
// 1. Пересортировку sortedProducts (тяжёлый expensiveComparator) — без useMemo
// 2. Новую ссылку handleSelect на каждый рендер — без useCallback
// 3. Ре-рендер ВСЕХ ProductCard, несмотря на React.memo — из-за (2)
```

> **Инсайт:** Все три оптимизации работают только **вместе** — убери любую одну, и цепочка "рвётся": без `useCallback` даже мемоизированный `ProductCard` получит "новый" `onSelect` и ре-рендерится; без `React.memo` стабильность `onSelect`/`product` не имеет смысла — React всё равно вызовет функцию компонента. Именно поэтому мемоизация — не точечная оптимизация одного хука, а согласованная цепочка от источника данных до листового компонента, что подтверждает Паттерн 2 из теории.

---

*Раздел 11 — Производительность, ссылки, контекст · Тема 35 из 43*
