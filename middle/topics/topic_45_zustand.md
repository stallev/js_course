# Контент курса — Тема 45: Zustand

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 14 — Тема 45 (Zustand)

---

# Тема 45 — Zustand

← Предыдущая тема: [44 — Redux Toolkit](topic_44_redux_toolkit.md)
→ Следующая тема: нет — это последняя тема курса

---

## 1. Теория с аналогиями

**Аналогия: общий блокнот на столе вместо банка с формами**

Redux (🔗 Тема 44) — это "банк": чёткие процедуры (actions), обязательные бланки (reducers), утверждённый регламент. Это надёжно, но требует инфраструктуры даже для мелкой операции. Zustand — это "общий блокнот, лежащий на столе": любой может взять его, дописать строку и положить обратно — без форм, без комиссии, без обязательного протокола изменений. Для многих реальных задач (не банковского масштаба) это быстрее и проще, при сохранении тех же гарантий: все, кто "смотрит на блокнот", видят актуальную запись.

**Минимальный API — store без Provider, без action types**

```typescript
// store/useCounterStore.ts
import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

// create() возвращает готовый хук — никакого Provider не требуется
export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  // set — функция обновления state, аналог setState в useState (🔗 Тема 31),
  // но работающая с ЛЮБЫМ компонентом, читающим этот store
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

```typescript
// Использование — прямой импорт хука, без <Provider> (в отличие от useContext, 🔗 Тема 37)
'use client';
import { useCounterStore } from '@/store/useCounterStore';

function Counter() {
  // Селектор внутри вызова хука — ре-рендер ТОЛЬКО при изменении count,
  // а не при изменении любого другого поля store
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);

  return <button onClick={increment}>{count}</button>;
}
```

**Как Zustand избегает лишних ре-рендеров без `<Provider>`**

```
useContext (🔗 Тема 37):                Zustand:
─────────────────────────               ─────────────────────────
<Context.Provider value={...}>          const store = createStore(...) // вне React
  <Tree/>                               // компонент подписывается напрямую,
</Context.Provider>                     // минуя дерево React Context
// ре-рендер ВСЕХ consumers при            // useSyncExternalStore определяет,
// изменении value, если оно            // какие подписчики затронуты
// не мемоизировано вручную              изменённым полем — точечный ре-рендер
```

Zustand хранит state **вне** дерева React (обычный JS-объект с подписчиками), а хуки `useStore` внутри используют `useSyncExternalStore` (🔗 Тема 39) — тот же примитив, что и в современном `react-redux`. Благодаря этому подписка через селектор (`state => state.count`) сразу даёт точечный ре-рендер без необходимости в `useMemo` для value, как это требуется для Context.

**Асинхронные действия — просто `async` функция внутри store**

```typescript
interface UserState {
  user: User | null;
  isLoading: boolean;
  fetchUser: (id: string) => Promise<void>;
}

const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  // Никакого createAsyncThunk (🔗 Тема 44) — обычная async-функция (🔗 Тема 16)
  fetchUser: async (id: string) => {
    set({ isLoading: true });
    const response = await fetch(`/api/users/${id}`);
    const user: User = await response.json();
    set({ user, isLoading: false });
  },
}));
```

**Middleware: `persist` (сохранение в localStorage) и `devtools`**

```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Композиция middleware — каждый добавляет своё поведение оборачиванием create-функции
export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'light',
        toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      }),
      { name: 'theme-storage' } // ключ в localStorage — состояние переживает перезагрузку страницы
    )
  )
);
```

**`get()` внутри actions — доступ к текущему state без замыкания на стейл-значение**

```typescript
// ❌ Потенциальная стейл-замыкание (та же проблема, что в useState, 🔗 Тема 31)
const useBadStore = create<{ count: number; logDouble: () => void }>((set, get) => ({
  count: 0,
  logDouble: () => {
    console.log(get().count * 2); // get() всегда читает АКТУАЛЬНОЕ значение — не стейл
  },
}));
```

`get()` в Zustand читает state store в момент вызова, а не значение, "замороженное" при создании функции — это устраняет класс проблем со stale closures, характерных для `useState`/`useEffect` (🔗 Тема 31, Тема 33), поскольку store существует вне цикла рендеринга компонента.

**Слайсы (модули) в рамках одного store — паттерн "slices pattern"**

```typescript
// store/slices/createCartSlice.ts
interface CartSlice {
  items: CartItem[];
  addItem: (item: CartItem) => void;
}

const createCartSlice = (set: any, get: any): CartSlice => ({
  items: [],
  addItem: (item) => set((state: any) => ({ items: [...state.items, item] })),
});

// store/useAppStore.ts — объединение слайсов в один store (аналог combineReducers, 🔗 Тема 44)
import { create } from 'zustand';

export const useAppStore = create<CartSlice & UserSlice>((...args) => ({
  ...createCartSlice(...args),
  ...createUserSlice(...args),
}));
```

---

## 2. Связь со стеком

**React: селекторы Zustand и `React.memo` (🔗 Тема 35)**

```typescript
// Дочерний компонент подписывается на конкретное поле — не на весь store
const CartBadge = memo(function CartBadge() {
  const itemCount = useCartStore((state) => state.items.length);
  return <span>{itemCount}</span>;
});
```

Как и с узкими селекторами `useSelector` в Redux (🔗 Тема 44, Паттерн 1), сочетание точечной подписки Zustand с `React.memo` даёт минимальную площадь ре-рендера — компонент обновляется только при изменении именно используемого им поля.

**Next.js: Zustand и Server Components — та же граница, что у Context/Redux**

```typescript
'use client'; // Zustand store — клиентское состояние, недоступное в Server Components (🔗 Тема 42)
import { useCartStore } from '@/store/useCartStore';

export function AddToCartButton({ productId }: { productId: string }) {
  const addItem = useCartStore((state) => state.addItem);
  return <button onClick={() => addItem({ id: productId, qty: 1 })}>В корзину</button>;
}
```

Важное отличие от Redux: Zustand store можно создавать **без `<Provider>`**, но в SSR-окружении (Next.js) это создаёт риск **утечки состояния между запросами**, если store создан как модульный singleton (как в примерах выше) и используется на сервере. Для полноценного SSR с изоляцией по запросу store оборачивают в React Context, создавая новый store на каждый рендер (паттерн "store per request").

```typescript
// Паттерн store-per-request для SSR — обёртка Zustand store в Context
'use client';
import { createContext, useContext, useRef } from 'react';
import { createCartStore, type CartStore } from './cartStore';
import { useStore } from 'zustand';

const CartStoreContext = createContext<CartStore | null>(null);

export function CartStoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<CartStore>();
  if (!storeRef.current) {
    storeRef.current = createCartStore(); // новый store на каждый монтаж — изоляция между пользователями
  }
  return <CartStoreContext.Provider value={storeRef.current}>{children}</CartStoreContext.Provider>;
}

export function useCartStore<T>(selector: (state: CartState) => T): T {
  const store = useContext(CartStoreContext);
  if (!store) throw new Error('useCartStore должен использоваться внутри CartStoreProvider');
  return useStore(store, selector); // useStore — низкоуровневый хук Zustand для внешних store-инстансов
}
```

**TypeScript: строгая типизация store и селекторов**

```typescript
// Явная типизация set/get через curried create<T>()(...) — рекомендуемый способ в TS
export const useCartStore = create<CartState>()((set, get) => ({
  /* ... */
}));
```

Двойной вызов `create<T>()(...)` — известная особенность TypeScript-API Zustand: curry нужен, чтобы TypeScript мог корректно вывести типы middleware (`persist`, `devtools`), обёрнутых вокруг основной функции store.

---

## 3. Лучшие паттерны

**✅ Паттерн 1: Селектор — всегда узкий, не деструктуризация всего store**

```typescript
// ❌ Плохо: подписка на ВЕСЬ объект store — ре-рендер при изменении любого поля
const { count, increment, user, theme } = useAppStore();

// ✅ Хорошо: раздельные узкие селекторы
const count = useAppStore((state) => state.count);
const increment = useAppStore((state) => state.increment);
```

*Почему:* Без селектора (`useAppStore()` без аргумента) компонент подписывается на store целиком — Zustand не может определить, какие поля реально используются, и ре-рендерит при любом изменении, теряя основное преимущество над `useContext`.

**✅ Паттерн 2: Actions рядом с state, а не в отдельном "action-слое"**

```typescript
// ✅ Хорошо: action — часть того же store, что и state, который она изменяет
const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
  get totalPrice() { // не поддерживается напрямую — используй derived-селектор ниже
    return 0;
  },
}));

// Производные значения — как отдельная функция-селектор, не как поле store
const selectTotalPrice = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.price * item.qty, 0);

const totalPrice = useCartStore(selectTotalPrice);
```

*Почему:* В отличие от Redux, где reducer и action разделены (🔗 Тема 44), Zustand специально поощряет держать логику изменения рядом с данными — меньше файлов, меньше индирекции для простых доменов.

**✅ Паттерн 3: Множество маленьких store вместо одного глобального**

```typescript
// ✅ Хорошо: отдельные store для независимых доменов (аналог отдельных Redux slices)
const useCartStore = create<CartState>(/* ... */);
const useThemeStore = create<ThemeState>(/* ... */);
const useAuthStore = create<AuthState>(/* ... */);
```

*Почему:* В отличие от Redux, где принято объединять slices в единый store через `combineReducers`, Zustand не требует единого корня — независимые маленькие store снижают связанность и упрощают тестирование (тот же принцип SRP, 🔗 Тема 28, что и разделение slices в Теме 44).

---

## 4. Вопросы интервью

**Q1: В чём принципиальное отличие Zustand от Redux Toolkit в архитектуре?**

Zustand не требует `<Provider>` в дереве компонентов (store — обычный модуль вне React), не использует action types/reducers как обязательную абстракцию (state изменяется прямым вызовом `set` внутри произвольных функций-actions), и не имеет встроенного концепта middleware для async — это просто обычные async-функции. Redux Toolkit, наоборот, сохраняет строгую модель "action → reducer → new state" и требует `<Provider>`.

**Q2: Как Zustand добивается точечных ре-рендеров без Context Provider?**

Store в Zustand — обычный JS-объект с системой подписчиков вне React. Хук `useStore` (используемый внутри `create`) реализован через `useSyncExternalStore` (🔗 Тема 39): при вызове хука с функцией-селектором React подписывается на изменения именно того значения, которое вернул селектор, и ре-рендерит компонент только если результат селектора изменился (по умолчанию — через `Object.is`).

**Q3: Что делает вызов `create<T>()(...)` с двумя парами скобок в TypeScript?**

Это паттерн "curry" в TypeScript-API Zustand: первый вызов `create<T>()` фиксирует generic-тип state, второй вызов `(...)` передаёт саму функцию, создающую store. Curry необходим, чтобы TypeScript мог корректно выводить типы при использовании middleware (`persist`, `devtools`), которые оборачивают исходную функцию и иначе теряют информацию о типе состояния.

**Q4: Почему модульный singleton-store в Zustand опасен в SSR-окружении (Next.js)?**

Если store создаётся один раз на уровне модуля (`export const useStore = create(...)`), а серверный процесс обслуживает несколько запросов от разных пользователей, состояние может "утечь" между запросами — один пользователь увидит данные другого. Решение — паттерн "store per request": store создаётся динамически (например, через `useRef` внутри Provider-компонента) на каждый рендер/запрос, обеспечивая изоляцию.

**Q5: Как избежать проблемы stale closure при работе с текущим значением state внутри action?**

Использовать `get()` внутри функции-action вместо захваченной переменной из замыкания — `get()` всегда возвращает актуальное состояние store в момент вызова, а не значение, зафиксированное при создании функции. Это отличается от классических stale closures в `useState`/`useEffect` (🔗 Тема 31, Тема 33), где обновлённое значение недоступно внутри старого замыкания без функциональных обновлений.

**Q6: Что произойдёт, если вызвать `useCartStore()` без аргумента-селектора?**

Компонент подпишется на **весь** объект state целиком и будет ре-рендериться при изменении **любого** поля store, даже если реально использует только одно поле — потеря главного преимущества Zustand (точечная подписка). Best practice — всегда передавать функцию-селектор, извлекающую только нужные поля.

**Q7: Как в Zustand реализовать композицию из нескольких доменных "слайсов" в одном store?**

Через паттерн "slices pattern": каждый домен описывается отдельной функцией `createXSlice(set, get) => SliceType`, а финальный store собирается через spread всех слайсов внутри одного вызова `create`: `create<SliceA & SliceB>((...args) => ({ ...createSliceA(...args), ...createSliceB(...args) }))`. Это функциональный аналог `combineReducers` в Redux (🔗 Тема 44), но без формальной иерархии reducer'ов.

**Q8: Для какого класса задач Zustand предпочтительнее Redux Toolkit, и наоборот?**

Zustand выигрывает для средних приложений или отдельных фич, где не нужны продвинутые DevTools с time-travel, строгий формальный протокол изменений или большая команда, где важна унифицированная структура actions/reducers. Redux Toolkit предпочтительнее в крупных приложениях с комплексной async-логикой (RTK Query), где важна предсказуемость через строгий контракт action → reducer, обязательное для аудита изменений состояние (time-travel debugging), или когда команда уже привыкла к Redux-экосистеме.

**Q9: Как middleware `persist` работает в Zustand и какие есть подводные камни при SSR?**

`persist` оборачивает store и автоматически сериализует/десериализует state в указанное хранилище (по умолчанию `localStorage`) при каждом изменении и при инициализации. Подводный камень в SSR (Next.js): на сервере `localStorage` не существует — начальный рендер на сервере и клиенте может отличаться (сервер видит `initialState`, клиент — восстановленное значение из `localStorage`), что приводит к hydration mismatch; решается через `skipHydration` опцию и ручной вызов `rehydrate()` после монтирования, либо через хранение в состоянии "загрузки" до гидратации.

**Q10: Чем `useStore(store, selector)` отличается от хука, возвращаемого `create()`?**

`create()` возвращает "удобный" хук-обёртку (`useCartStore`) для стандартного случая одного глобального store-singleton. `useStore` из `zustand` — низкоуровневый примитив, принимающий store-инстанс явным параметром; используется, когда store создаётся динамически (например, паттерн store-per-request для SSR-изоляции, см. раздел "Связь со стеком"), и его нельзя импортировать как готовый глобальный хук.

---

## 5. Практическое задание

Реализуй на Zustand store для управления списком задач (todo) с персистентностью в `localStorage`:

1. State: `{ todos: { id: string; text: string; done: boolean }[] }`.
2. Actions: `addTodo`, `toggleTodo`, `removeTodo`.
3. Производный селектор `selectActiveCount` (количество незавершённых задач).
4. Подключи middleware `persist` с ключом `'todo-storage'`.
5. Компонент `TodoList`, использующий узкие селекторы.

---

## 6. Решение с инсайтом

```typescript
// store/useTodoStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

interface TodoState {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],
      addTodo: (text) =>
        set((state) => ({
          todos: [...state.todos, { id: crypto.randomUUID(), text, done: false }],
        })),
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      removeTodo: (id) =>
        set((state) => ({ todos: state.todos.filter((t) => t.id !== id) })),
    }),
    { name: 'todo-storage' } // ключ в localStorage — список задач переживает перезагрузку страницы
  )
);

// Производный селектор — вычисляется при каждом вызове, без ручной мемоизации,
// т.к. массив todos небольшой; для тяжёлых вычислений используй отдельную мемо-библиотеку
export const selectActiveCount = (state: TodoState) =>
  state.todos.filter((t) => !t.done).length;
```

```typescript
// components/TodoList.tsx
'use client';
import { useState } from 'react';
import { useTodoStore, selectActiveCount } from '@/store/useTodoStore';

export function TodoList() {
  const [text, setText] = useState('');
  // Узкие селекторы — каждый компонент/строка подписывается на минимально нужное
  const todos = useTodoStore((state) => state.todos);
  const addTodo = useTodoStore((state) => state.addTodo);
  const toggleTodo = useTodoStore((state) => state.toggleTodo);
  const removeTodo = useTodoStore((state) => state.removeTodo);
  const activeCount = useTodoStore(selectActiveCount);

  return (
    <div>
      <p>Активных задач: {activeCount}</p>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && text.trim()) {
            addTodo(text.trim());
            setText('');
          }
        }}
      />
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
            <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
            {todo.text}
            <button onClick={() => removeTodo(todo.id)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

> **Инсайт:** `selectActiveCount` — обычная функция от state, а не поле store: Zustand не хранит производные значения внутри самого объекта state (в отличие от классов с getter'ами), потому что это ломает сериализацию для `persist` (нельзя сериализовать функцию-getter в JSON). Вместо этого производные значения всегда вычисляются "снаружи" через селектор — концептуально то же самое, что мемоизированный селектор `createSelector` в Redux Toolkit (🔗 Тема 44), но без обязательного шага мемоизации: для небольших списков пересчёт при каждом рендере дешевле, чем инфраструктура мемоизации, а для больших — можно обернуть в `useMemo` на уровне компонента (🔗 Тема 35).

---

*Раздел 14 — Библиотеки управления состоянием · Тема 45 из 45 — конец курса*
