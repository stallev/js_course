# Контент курса — Тема 44: Redux Toolkit

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 14 — Тема 44 (Redux Toolkit)

---

# Тема 44 — Redux Toolkit

← Предыдущая тема: [43 — Правила хуков и антипаттерны](topic_43_hooks_rules_and_antipatterns.md)
→ Следующая тема: [45 — Zustand](topic_45_zustand.md)

---

## 1. Теория с аналогиями

**Аналогия: центральный банк вместо наличных денег в кармане у каждого**

Если каждый компонент хранит "свои деньги" (`useState`) и обменивается ими напрямую с соседями (props/callback), при большом количестве участников учёт становится хаосом — непонятно, у кого сколько и кто последний менял баланс. Redux — это "центральный банк": единственное хранилище (`store`), через которое проходит **любое** изменение состояния, с полной историей операций (actions) и одним местом, где написаны правила обработки каждой операции (reducers). Redux Toolkit (RTK) — это "банк с современным цифровым интерфейсом" поверх классического Redux: тот же принцип, но без ручного написания boilerplate-кода.

**Проблема, которую решает Redux (напоминание архитектуры, 🔗 Тема 32, Тема 37)**

```
useReducer + useContext — Redux "своими руками" в рамках одного поддерева:
┌────────────────────────────────────────────────────┐
│ useReducer: (state, action) => newState              │
│ useContext: доступ к {state, dispatch} без прокидки  │
│             через пропсы на каждом уровне            │
└────────────────────────────────────────────────────┘
                        │
                        ▼ масштабируется до
┌────────────────────────────────────────────────────┐
│ Redux: единый store для ВСЕГО приложения,            │
│ middleware (логирование, async), DevTools с            │
│ time-travel debugging, предсказуемые обновления       │
└────────────────────────────────────────────────────┘
```

**Классический Redux — почему он был "многословным"**

```typescript
// Классический Redux (до Toolkit) — три отдельные сущности на каждое действие
// 1. Константы action types
const INCREMENT = 'counter/increment';
const DECREMENT = 'counter/decrement';

// 2. Action creators
function increment() { return { type: INCREMENT }; }
function decrement() { return { type: DECREMENT }; }

// 3. Reducer с ручным switch и обязательной иммутабельностью (🔗 Тема 27)
function counterReducer(state = { value: 0 }, action) {
  switch (action.type) {
    case INCREMENT: return { ...state, value: state.value + 1 }; // спред — легко забыть
    case DECREMENT: return { ...state, value: state.value - 1 };
    default: return state;
  }
}

// 4. Ручная настройка store с middleware для async (redux-thunk)
```

**Redux Toolkit — тот же Redux, но с радикально меньшим boilerplate**

```typescript
// features/counter/counterSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
}

const initialState: CounterState = { value: 0 };

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    // "Мутирующий" синтаксис — Immer под капотом производит иммутабельное обновление (🔗 Тема 27)
    increment(state) {
      state.value += 1; // выглядит как мутация, но Immer создаёт новый объект под капотом
    },
    decrement(state) {
      state.value -= 1;
    },
    incrementByAmount(state, action: PayloadAction<number>) {
      state.value += action.payload;
    },
  },
});

// action creators и reducer генерируются автоматически — не нужно писать вручную
export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
```

**Как работает "мутирующий" синтаксис через Immer — без нарушения иммутабельности**

```
Ты пишешь:                          Immer делает под капотом:
──────────────────                  ─────────────────────────────
state.value += 1;                   const draft = createDraft(state);
                                     draft.value += 1;
                                     return finishDraft(draft); // НОВЫЙ объект state
```

Immer оборачивает `state` в специальный "draft"-объект (Proxy), записывающий все "мутации", а на выходе строит совершенно новый объект с этими изменениями, применёнными иммутабельно — то же самое, что ручной spread из Темы 27, но без явного синтаксиса.

**Configureconfigure store — вся инфраструктура из коробки**

```typescript
// app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer, // каждый slice — своя "ветка" в едином дереве state
  },
  // Redux DevTools подключаются автоматически (в dev-режиме)
  // redux-thunk для async встроен по умолчанию — без ручной настройки middleware
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**RTK Query — data-fetching слой поверх Redux (замена ручных `useEffect`+`fetch`)**

```typescript
// features/api/productsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: builder => ({
    getProducts: builder.query<Product[], void>({
      query: () => 'products',
    }),
  }),
});

export const { useGetProductsQuery } = productsApi; // автогенерированный хук

// Использование — вместо ручного useEffect+fetch+useState (🔗 Тема 33)
function ProductList() {
  const { data: products, isLoading, error } = useGetProductsQuery();
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage />;
  return <ul>{products?.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

RTK Query автоматически даёт кэширование, дедупликацию одновременных запросов, инвалидацию по тегам — то, что вручную писалось бы как собственный `useFetch` (🔗 Тема 33) плюс слой кэша.

**Async-логика: `createAsyncThunk`**

```typescript
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Асинхронная операция — Promise-based, как обычная async-функция (🔗 Тема 16)
const fetchUser = createAsyncThunk('user/fetch', async (userId: string) => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json() as Promise<User>;
});

const userSlice = createSlice({
  name: 'user',
  initialState: { data: null as User | null, status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed' },
  reducers: {},
  // extraReducers обрабатывает три автоматически генерируемых action: pending/fulfilled/rejected
  extraReducers: builder => {
    builder
      .addCase(fetchUser.pending, state => { state.status = 'loading'; })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, state => { state.status = 'failed'; });
  },
});
```

---

## 2. Связь со стеком

**React-Redux: `useSelector`/`useDispatch` — обёртки над `useSyncExternalStore` (🔗 Тема 39)**

```typescript
'use client';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/store';
import { increment } from '@/features/counter/counterSlice';

function Counter() {
  // useSelector подписывается ТОЛЬКО на нужную часть state — ре-рендер только при её изменении
  const count = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch<AppDispatch>();

  return <button onClick={() => dispatch(increment())}>{count}</button>;
}
```

Современный `react-redux` использует `useSyncExternalStore` внутри `useSelector` — именно то, что разбиралось в Теме 39: подписка на внешний (вне React) store с гарантией консистентности при конкурентном рендеринге (🔗 Тема 38), плюс механизм selector'а, которого не хватает "чистому" `useContext` (🔗 Тема 37, ограничение — ре-рендер всех consumers при любом изменении).

**Next.js: Redux store — только в Client Components**

```typescript
'use client';
// app/providers.tsx
import { Provider } from 'react-redux';
import { store } from './store';

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
```

Store с состоянием, актуальным между взаимодействиями пользователя, принципиально требует клиентского жизненного цикла — то же ограничение, что у `useState`/`useContext` (🔗 Тема 31, Тема 37) в архитектуре Server Components (🔗 Тема 42).

**TypeScript: типизированные хуки — стандартная практика RTK**

```typescript
// app/hooks.ts — типизированные обёртки, избегающие повторения generic-параметров
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## 3. Лучшие паттерны

**✅ Паттерн 1: Селекторы — узкие и мемоизированные, а не "взять весь slice"**

```typescript
// ❌ Плохо: компонент ре-рендерится при ЛЮБОМ изменении всего slice cart,
// даже если изменилось поле, не используемое этим компонентом
const cart = useSelector((state: RootState) => state.cart);

// ✅ Хорошо: узкий селектор — ре-рендер только при изменении totalPrice
const totalPrice = useSelector((state: RootState) => state.cart.totalPrice);

// ✅ Ещё лучше для дорогих вычислений — createSelector из reselect (мемоизация, 🔗 Тема 35)
import { createSelector } from '@reduxjs/toolkit';
const selectExpensiveTotal = createSelector(
  (state: RootState) => state.cart.items,
  items => items.reduce((sum, i) => sum + i.price * i.qty, 0) // пересчёт только если items изменился
);
```

*Почему best practice:* Тот же принцип, что мемоизация Context value (🔗 Тема 37, Тема 35) — узкая подписка минимизирует "радиус" ре-рендера при изменении store.

**✅ Паттерн 2: Нормализация состояния вместо вложенных массивов**

```typescript
// ❌ Плохо: поиск и обновление конкретного элемента — O(n) через .find()/.map()
interface State { users: User[]; }

// ✅ Хорошо: нормализованная структура — O(1) доступ по id (🔗 Тема 21 — Map для той же цели)
interface State {
  users: {
    byId: Record<string, User>;
    allIds: string[];
  };
}
// RTK предоставляет createEntityAdapter специально для этого паттерна "из коробки"
```

*Почему:* Нормализация — стандартная практика Redux для избежания дублирования данных и медленного поиска в больших списках, особенно при частых точечных обновлениях.

**✅ Паттерн 3: Один slice — одна доменная область (аналог SRP, 🔗 Тема 28)**

```typescript
// ❌ Плохо: один "мега-slice" на всё приложение
const appSlice = createSlice({ name: 'app', initialState: { user, cart, theme, notifications } });

// ✅ Хорошо: раздельные slices, каждый — своя доменная область
const userSlice = createSlice({ name: 'user', /* ... */ });
const cartSlice = createSlice({ name: 'cart', /* ... */ });
const themeSlice = createSlice({ name: 'theme', /* ... */ });
```

*Почему:* Тот же принцип, что разделение Context по домену (🔗 Тема 37, Паттерн 2) — независимые slices тестируются и поддерживаются раздельно, легче находить нужный код.

---

## 4. Вопросы интервью

**Q1: Какую проблему решает Redux Toolkit по сравнению с классическим Redux?**

Устраняет типичный boilerplate классического Redux: ручное написание констант action types, action creators и switch-based reducers с обязательной ручной иммутабельностью. `createSlice` генерирует all это автоматически, позволяя писать "мутирующий" синтаксис благодаря встроенному Immer, который на самом деле производит иммутабельное обновление.

**Q2: Как работает "мутирующий" синтаксис в `createSlice`, если Redux требует иммутабельности?**

Redux Toolkit использует библиотеку Immer внутри reducer'ов: `state` оборачивается в специальный Proxy-объект ("draft"), записывающий все обращения к мутации (`state.value += 1`), а на выходе Immer строит совершенно новый объект state с этими изменениями, применёнными иммутабельно — сам Redux store продолжает получать новую ссылку на state при каждом изменении, как и требуется.

**Q3: В чём разница `useSelector` и обычного `useContext` в плане производительности?**

`useSelector` подписывает компонент только на **конкретную часть** state, определяемую функцией-селектором, — ре-рендер происходит только при изменении именно этой части (при сравнении через `===`/кастомный equality). `useContext` без дополнительных мер (🔗 Тема 37) ре-рендерит компонент при изменении **любой** части объекта `value`, независимо от того, какие поля реально используются.

**Q4: Что такое `createAsyncThunk` и какие action он генерирует?**

Утилита для описания асинхронных операций (аналог async-функции, 🔗 Тема 16) в виде обычного Redux action: автоматически генерирует три типа action — `pending` (запрос начался), `fulfilled` (успешно завершился, с результатом в payload) и `rejected` (завершился с ошибкой) — обрабатываемые в `extraReducers`/`builder.addCase`.

**Q5: Зачем нужна нормализация состояния в Redux и как RTK помогает с ней?**

Нормализация — хранение сущностей как `{ byId: Record<id, Entity>, allIds: id[] }` вместо вложенных массивов — даёт O(1) доступ и обновление конкретной сущности по id вместо линейного поиска, а также избегает дублирования одних и тех же данных в разных частях state. `createEntityAdapter` из RTK предоставляет готовые reducer-функции (`addOne`, `updateOne`, `removeOne` и т.д.) и селекторы для этого паттерна.

**Q6: Как RTK Query отличается от ручного использования `useEffect`+`fetch` (🔗 Тема 33)?**

RTK Query автоматически даёт кэширование результатов запроса по ключу параметров, дедупликацию одновременных идентичных запросов, автоматическую инвалидацию кэша по тегам при мутациях, и автогенерированные хуки (`useGetProductsQuery`) с `isLoading`/`error`/`data` — то, что вручную писалось бы как самописный `useFetch` плюс отдельный слой кэширования.

**Q7: Что такое `configureStore` и чем он лучше классического `createStore`?**

`configureStore` из RTK автоматически подключает Redux DevTools Extension, включает `redux-thunk` middleware для асинхронной логики по умолчанию, и добавляет middleware для проверки на распространённые ошибки в dev-режиме (мутация state вне reducer, несериализуемые значения в actions) — всё это в классическом Redux требовало ручной настройки через `applyMiddleware`/`compose`.

**Q8: Когда стоит выбрать Redux Toolkit вместо `useContext`+`useReducer` (🔗 Тема 32, Тема 37)?**

Когда состояние действительно глобальное для всего приложения (не одной фичи), требует продвинутых DevTools (time-travel debugging), сложной async-логики с кэшированием (RTK Query), или когда несколько независимых частей приложения читают и изменяют одно и то же состояние с высокой частотой — там, где ручной `useContext` создал бы проблему ре-рендера всех consumers без узких селекторов.

**Q9: Что произойдёт, если попытаться напрямую мутировать state внутри reducer, не через Immer draft (например, в `extraReducers` с обычным объектом, а не draft)?**

В reducer'ах, сгенерированных `createSlice` (включая `builder.addCase`), state всегда представлен как Immer draft — мутации безопасны и корректно преобразуются в иммутабельное обновление. Но если попытаться мутировать state вне контекста reducer (например, напрямую в компоненте, полученный через `useSelector`), это некорректно: React/Redux не узнают об изменении, так как сравнение идёт по ссылке (🔗 Тема 5), и на неё это никак не повлияет.

**Q10: Как Redux DevTools помогают в отладке и что такое time-travel debugging?**

Redux DevTools показывают полную историю всех отправленных actions и соответствующих изменений state — можно "прокрутить" приложение к любому предыдущему состоянию (time-travel), посмотреть diff между шагами, и даже "replay" последовательность actions. Это возможно именно благодаря принципу Redux "state изменяется только через явные actions, обрабатываемые чистыми reducer-функциями" (🔗 Тема 32) — детерминированность делает историю полностью воспроизводимой.

---

## 5. Практическое задание

Реализуй `cartSlice` на Redux Toolkit с поддержкой добавления/удаления товаров и мемоизированным селектором общей суммы:

1. State: `{ items: { id: string; name: string; price: number; qty: number }[] }`.
2. Reducers: `addItem`, `removeItem`, `changeQty`.
3. Мемоизированный селектор `selectCartTotal` через `createSelector`.
4. Типизированные хуки `useAppDispatch`/`useAppSelector`.

---

## 6. Решение с инсайтом

```typescript
// features/cart/cartSlice.ts
import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = { items: [] };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<Omit<CartItem, 'qty'>>) {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        existing.qty += 1; // "мутация" draft — Immer конвертирует в иммутабельное обновление
      } else {
        state.items.push({ ...action.payload, qty: 1 });
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    changeQty(state, action: PayloadAction<{ id: string; qty: number }>) {
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) item.qty = Math.max(0, action.payload.qty); // защита от отрицательного количества
    },
  },
});

export const { addItem, removeItem, changeQty } = cartSlice.actions;
export default cartSlice.reducer;

// Мемоизированный селектор — пересчёт totalPrice только если items реально изменился (🔗 Тема 35)
export const selectCartTotal = createSelector(
  (state: RootState) => state.cart.items,
  items => items.reduce((sum, item) => sum + item.price * item.qty, 0)
);

export const selectCartItemCount = createSelector(
  (state: RootState) => state.cart.items,
  items => items.reduce((sum, item) => sum + item.qty, 0)
);
```

```typescript
// app/hooks.ts
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

```typescript
// Использование в компоненте
'use client';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addItem, removeItem, selectCartTotal } from '@/features/cart/cartSlice';

function CartSummary() {
  const dispatch = useAppDispatch();
  const total = useAppSelector(selectCartTotal); // узкий селектор — ре-рендер только при изменении суммы

  return (
    <div>
      <p>Итого: {total}₴</p>
      <button onClick={() => dispatch(addItem({ id: '1', name: 'Товар', price: 500 }))}>
        Добавить
      </button>
    </div>
  );
}

export default cartSlice;
```

> **Инсайт:** `existing.qty += 1` внутри `addItem` — прямая мутация Immer-draft, а не реального state; без Immer тот же код пришлось бы писать как `state.items.map(i => i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i)` — Redux Toolkit убирает именно этот класс шаблонного кода, оставляя итоговую логику (что должно произойти) читаемой без потери иммутабельности реального store. `createSelector` для `selectCartTotal` даёт ту же выгоду, что `useMemo` (🔗 Тема 35): пересчёт суммы происходит только при изменении массива `items`, а не при каждом обращении к любому другому полю store.

---

*Раздел 14 — Библиотеки управления состоянием · Тема 44 из 45*
