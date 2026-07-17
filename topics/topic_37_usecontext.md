# Контент курса — Тема 37: useContext

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 11 — Тема 37 (useContext)

---

# Тема 37 — useContext

← Предыдущая тема: [36 — useRef и useImperativeHandle](topic_36_useref_useimperativehandle.md)
→ Следующая тема: [38 — useTransition и useDeferredValue](topic_38_usetransition_usedeferredvalue.md)

---

## 1. Теория с аналогиями

**Аналогия: радиостанция вместо цепочки посыльных**

Представь, что информацию нужно передать от штаба (корневой компонент) в отдалённый отряд (глубоко вложенный компонент) через десять промежуточных постов (промежуточные компоненты), каждый из которых обязан просто передать сообщение дальше, даже если само сообщение его не касается — это "prop drilling". Context — как радиостанция: штаб транслирует сообщение сразу всем, у кого включена рация на нужной частоте (`useContext`), минуя все промежуточные посты.

**Проблема "prop drilling"**

```typescript
// ❌ theme нужен только AvatarIcon в самом низу, но передаётся через ВСЕ промежуточные компоненты
function App() {
  const [theme, setTheme] = useState('light');
  return <Page theme={theme} />;
}
function Page({ theme }: { theme: string }) {
  return <Sidebar theme={theme} />; // Sidebar сам theme не использует
}
function Sidebar({ theme }: { theme: string }) {
  return <UserPanel theme={theme} />; // UserPanel сам theme не использует
}
function UserPanel({ theme }: { theme: string }) {
  return <AvatarIcon theme={theme} />; // наконец-то используется
}
```

**Решение: Context API**

```typescript
import { createContext, useContext, useState } from 'react';

// 1. Создаём контекст с типом и (опционально) дефолтным значением
const ThemeContext = createContext<'light' | 'dark'>('light');

// 2. Provider — источник значения для всего поддерева
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  return (
    <ThemeContext.Provider value={theme}>
      <Page /> {/* Page/Sidebar/UserPanel больше не знают о theme */}
    </ThemeContext.Provider>
  );
}

// 3. useContext — прямой доступ из ЛЮБОЙ глубины вложенности
function AvatarIcon() {
  const theme = useContext(ThemeContext); // без единого промежуточного пропса
  return <img className={theme} src="/avatar.png" />;
}
```

**Как React находит "своё" значение контекста — обход дерева вверх**

```
useContext(ThemeContext) внутри AvatarIcon:
  1. React смотрит вверх по дереву Fiber от AvatarIcon
  2. Находит ближайший <ThemeContext.Provider value={...}>
  3. Возвращает именно ЭТО значение

Если Provider'ов несколько (вложенные) — используется САМЫЙ БЛИЖНИЙ:
<ThemeContext.Provider value="light">
  <ThemeContext.Provider value="dark">
    <AvatarIcon /> {/* useContext вернёт 'dark' — ближайший Provider */}
  </ThemeContext.Provider>
</ThemeContext.Provider>
```

**Проблема: ре-рендер ВСЕХ consumers при изменении `value`**

```typescript
// Каждый компонент, вызывающий useContext(ThemeContext), ре-рендерится
// при ЛЮБОМ изменении value — независимо от того, какая часть value изменилась
const AppContext = createContext<{ theme: string; user: User | null }>(defaultValue);

function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState<User | null>(null);
  // Изменение ТОЛЬКО user вызовет ре-рендер компонентов, использующих ТОЛЬКО theme
  const value = { theme, user }; // единый объект — единая причина ре-рендера для всех
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
```

**Решение: разделение на несколько контекстов**

```typescript
// ✅ Раздельные контексты — компонент подписывается только на нужные данные
const ThemeContext = createContext<string>('light');
const UserContext = createContext<User | null>(null);

function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState<User | null>(null);
  return (
    <ThemeContext.Provider value={theme}>
      <UserContext.Provider value={user}>
        {children}
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}

// Компонент, использующий только theme, НЕ ре-рендерится при изменении user
function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme} />;
}
```

**Мемоизация `value` — обязательна при объекте (🔗 Тема 35)**

```typescript
// ❌ Плохо: новый объект value на каждом рендере App → ре-рендер ВСЕХ consumers
function App() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}> {/* новая ссылка каждый рендер */}
      {children}
    </ThemeContext.Provider>
  );
}

// ✅ Хорошо: мемоизация value — стабильная ссылка, пока theme не изменился
function App() {
  const [theme, setTheme] = useState('light');
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

**Context ≠ глобальный state-менеджер (важное ограничение)**

Context не оптимизирован для часто меняющихся данных, читаемых многими компонентами (как Redux/Zustand с selector'ами) — у него нет встроенного механизма "подписаться только на часть value без ре-рендера при изменении остального", кроме ручного разделения на несколько контекстов. Для высокочастотных обновлений (курсор мыши, состояние формы с сотнями полей) Context — не лучший инструмент; там уместнее `useSyncExternalStore` (🔗 Тема 39) или сторонние библиотеки с selector-механизмом.

---

## 2. Связь со стеком

**Комбинация `useContext` + `useReducer` — мини-Redux (🔗 Тема 32)**

```typescript
const CartContext = createContext<{ state: CartState; dispatch: React.Dispatch<CartAction> } | null>(null);

function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart должен использоваться внутри CartProvider'); // явная защита
  return ctx;
}
```

**Next.js App Router: Context работает только в Client Components**

```typescript
'use client'; // Context Provider с состоянием — обязательно Client Component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

Server Components не могут использовать `useContext` (как и любой хук) — Context в App Router применяется только в поддеревьях, помеченных `"use client"`. Для передачи данных из Server Component в Client Component используются обычные пропсы, а не Context.

**TypeScript: явная защита от `null` при отсутствии Provider**

```typescript
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
// undefined как дефолт заставляет каждого потребителя проверять наличие Provider —
// предотвращает "тихое" использование контекста без обёртки Provider
```

---

## 3. Лучшие паттерны

**✅ Паттерн 1: Кастомный хук-обёртка вместо прямого `useContext` в компонентах**

```typescript
// ❌ Плохо: каждый компонент импортирует ThemeContext и повторяет проверку
function Component() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('...');
  return <div>{ctx.theme}</div>;
}

// ✅ Хорошо: единая точка доступа и проверки
function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) throw new Error('useTheme должен использоваться внутри ThemeProvider');
  return ctx;
}
function Component() {
  const { theme } = useTheme(); // проверка инкапсулирована один раз
  return <div>{theme}</div>;
}
```

*Почему best practice:* Единая точка проверки наличия Provider устраняет дублирование и даёт понятное сообщение об ошибке в одном месте — аналог DRY (🔗 Тема 28).

**✅ Паттерн 2: Разделение контекстов по частоте изменения и по домену**

```typescript
// ❌ Плохо: один "мега-контекст" на всё приложение
const AppContext = createContext<{ theme; user; cart; notifications }>(...);

// ✅ Хорошо: отдельные контексты — ре-рендер затрагивает только реальных потребителей
const ThemeContext = createContext(...);
const UserContext = createContext(...);
const CartContext = createContext(...);
```

*Почему:* Изоляция домена данных ограничивает "радиус" ре-рендера при изменении — компонент, использующий только `CartContext`, не пострадает от частых обновлений `ThemeContext`.

**✅ Паттерн 3: Разделение Provider на "значение" и "функции изменения" (state/dispatch split)**

```typescript
// ✅ Продвинутый паттерн: два раздельных контекста вместо одного { state, setState }
const CartStateContext = createContext<CartState>(initialState);
const CartDispatchContext = createContext<React.Dispatch<CartAction>>(() => {});

// Компонент, который только dispatch'ит действия (например, кнопка "Добавить"),
// не ре-рендерится при изменении CartState — подписан только на CartDispatchContext
function AddToCartButton({ item }: { item: Item }) {
  const dispatch = useContext(CartDispatchContext);
  return <button onClick={() => dispatch({ type: 'ADD_ITEM', item })}>В корзину</button>;
}
```

*Почему:* `dispatch` от `useReducer` — стабильная ссылка, не меняющаяся между рендерами, поэтому `CartDispatchContext` фактически никогда не вызывает лишних ре-рендеров у своих потребителей, в отличие от `CartStateContext`, которая меняется при каждом действии.

---

## 4. Вопросы интервью

**Q1: Какую проблему решает Context API?**

Prop drilling — необходимость передавать данные через множество промежуточных компонентов, которым эти данные не нужны напрямую, только чтобы они дошли до глубоко вложенного потребителя. Context позволяет любому компоненту в поддереве подписаться на значение напрямую, минуя промежуточные уровни.

**Q2: Как React определяет, какое значение контекста вернуть в `useContext`?**

Обходом дерева Fiber вверх от компонента, вызвавшего `useContext`, до ближайшего `Provider` для этого конкретного объекта контекста. Если Provider'ы вложены друг в друга — используется значение самого близкого (внутреннего) Provider.

**Q3: Что произойдёт с компонентами-потребителями при изменении `value` в Provider?**

Все компоненты, вызывающие `useContext` для этого контекста в поддереве, ре-рендерятся — независимо от того, какая часть объекта `value` изменилась, если `value` целиком является новым объектом по ссылке. Это главное ограничение производительности Context API.

**Q4: Почему важно мемоизировать `value`, передаваемый в `Provider`?**

Если `value` — литерал объекта, создаваемый на каждом рендере родителя, каждый рендер даёт новую ссылку — все потребители контекста ре-рендерятся, даже если фактические данные не изменились. `useMemo` вокруг `value` с правильными зависимостями предотвращает эти лишние ре-рендеры.

**Q5: Как ограничить "радиус" ре-рендера при использовании Context?**

Разделение одного большого контекста на несколько узких по домену данных (theme, user, cart — раздельно), а также разделение на "контекст значения" и "контекст функции изменения" (state/dispatch split) — компонент, читающий только dispatch (стабильную ссылку), избегает ре-рендеров при изменении state.

**Q6: Является ли Context полноценной заменой Redux/Zustand?**

Частично — для локального в рамках фичи, редко меняющегося состояния (тема, авторизация, локализация) Context достаточен, особенно в комбинации с `useReducer`. Для часто меняющегося состояния, читаемого множеством компонентов с потребностью в "выборочной" подписке (selector), специализированные библиотеки эффективнее — у них есть встроенные механизмы избежать ре-рендера компонентов, не зависящих от изменившейся части state.

**Q7: Что вернёт `useContext`, если компонент вызван без соответствующего `Provider` выше по дереву?**

Значение по умолчанию, переданное в `createContext(defaultValue)`. Если дефолтное значение — `undefined`, и в компоненте нет явной проверки, обращение к полям этого `undefined` вызовет runtime-ошибку — поэтому рекомендуется либо осмысленное дефолтное значение, либо явная проверка в кастомном хуке-обёртке.

**Q8: Можно ли использовать несколько `Provider` одного и того же контекста одновременно в разных частях дерева?**

Да — каждое поддерево получает значение от своего ближайшего `Provider`. Это позволяет, например, иметь разные "темы" для разных секций страницы, если каждая секция обёрнута в собственный `ThemeContext.Provider` со своим значением.

**Q9: Как Context связан с `useReducer` для построения локального state-менеджера?**

`useReducer` предоставляет `{ state, dispatch }` с централизованной логикой изменений (🔗 Тема 32); Context делает эту пару доступной любому компоненту в поддереве без передачи через пропсы на каждом уровне. Комбинация двух хуков — стандартный способ получить масштабируемое, тестируемое локальное управление состоянием без сторонних зависимостей.

**Q10: Почему Context не подходит для очень часто обновляемых данных (например, позиции курсора при drag-and-drop)?**

Каждое обновление `value` вызывает ре-рендер всех потребителей контекста синхронно через обычный механизм React state — при высокой частоте обновлений (десятки раз в секунду) это создаёт заметную нагрузку на рендеринг. Для таких сценариев лучше подходят паттерны с прямой мутацией через `useRef` + `useSyncExternalStore` (🔗 Тема 39) или локальный `useState` внутри самого drag-компонента, без прохождения через Context.

---

## 5. Практическое задание

Реализуй систему авторизации через Context: `AuthProvider`, хук `useAuth()`, и защищённый компонент `ProtectedRoute`:

1. `AuthProvider` хранит `{ user: User | null; login: (u: User) => void; logout: () => void }`.
2. `useAuth()` — кастомный хук с проверкой наличия Provider (throw при отсутствии).
3. Значение `value` должно быть мемоизировано, чтобы не вызывать лишние ре-рендеры.
4. `ProtectedRoute` рендерит `children`, если `user !== null`, иначе — сообщение "Требуется авторизация".

---

## 6. Решение с инсайтом

```typescript
import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

interface User {
  id: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Мемоизация value — login/logout стабильны за счёт того, что не зависят от user напрямую
  const value = useMemo<AuthContextValue>(() => ({
    user,
    login: (u: User) => setUser(u),
    logout: () => setUser(null),
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Кастомный хук — единая точка проверки наличия Provider (🔗 Паттерн 1)
function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth должен использоваться внутри <AuthProvider>');
  }
  return ctx;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    return <p>Требуется авторизация.</p>;
  }
  return <>{children}</>;
}

// Использование
function LoginButton() {
  const { login } = useAuth();
  return <button onClick={() => login({ id: '1', name: 'Alice' })}>Войти</button>;
}

function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div>
      <p>Привет, {user?.name}!</p>
      <button onClick={logout}>Выйти</button>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LoginButton />
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
```

> **Инсайт:** `useAuth()` — не просто удобство, а единственная точка, где проверяется "использован ли Provider" — без этой проверки ошибка проявилась бы глубоко внутри `Dashboard` как загадочный `Cannot read properties of undefined`, а не как явное сообщение `useAuth должен использоваться внутри <AuthProvider>`. Мемоизация `value` через `useMemo` с зависимостью `[user]` гарантирует, что `LoginButton` (использующий только `login`) не ре-рендерится каждый раз, когда меняется что-то, не влияющее на `login`/`logout` — хотя в данном случае `user` — единственная причина изменения `value`, паттерн масштабируется на более сложные контексты.

---

*Раздел 11 — Производительность, ссылки, контекст · Тема 37 из 43*
