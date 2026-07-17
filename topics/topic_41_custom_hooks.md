# Контент курса — Тема 41: Кастомные хуки и композиция логики

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 13 — Тема 41 (Кастомные хуки и композиция логики)

---

# Тема 41 — Кастомные хуки и композиция логики

← Предыдущая тема: [40 — React 19: use(), useActionState, useOptimistic](topic_40_react19_hooks.md)
→ Следующая тема: [42 — Server Components и Suspense в Next.js App Router](topic_42_server_components_and_suspense.md)

---

## 1. Теория с аналогиями

**Аналогия: универсальная отвёртка вместо набора одинаковых инструментов**

Если пять разных компонентов нуждаются в "запомнить значение в localStorage", можно скопировать один и тот же код пять раз — или сделать один универсальный инструмент (`useLocalStorage`) и использовать его везде. Кастомный хук — это способ **извлечь переиспользуемую стейтфул-логику** (использующую другие хуки внутри) в отдельную функцию, без необходимости оборачивать компоненты в HOC или дублировать код.

**Кастомный хук — это просто функция, использующая другие хуки**

```typescript
// Ничего "магического" — обычная функция, вызывающая useState/useEffect внутри
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue; // ленивая инициализация (🔗 Тема 31)
  });

  const setStoredValue = useCallback((newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  }, [key]);

  return [value, setStoredValue];
}

// Использование — как встроенный хук
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  return <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme}</button>;
}
```

**Почему хуки нельзя вызывать вне компонента/другого хука — и что даёт конвенция `use*`**

Правило хуков (🔗 Тема 33) требует, чтобы хуки вызывались либо непосредственно в теле функции-компонента, либо внутри другого кастомного хука — React линковка через индекс вызова (🔗 Тема 31) работает только в этом контексте. Префикс `use` — не техническое требование языка, а **договорённость**, позволяющая линтеру (`eslint-plugin-react-hooks`) статически проверять правило хуков: правило применяется к любой функции с именем `useXxx`.

```typescript
// ❌ Без префикса use — линтер не распознает эту функцию как хук
// и не проверит правило хуков внутри неё (условный useState останется незамеченным багом)
function getCounter() {
  const [count, setCount] = useState(0); // потенциальная ошибка, которую линтер не увидит
  return count;
}

// ✅ С префиксом use — линтер знает, что нужно проверять правила хуков
function useCounter() {
  const [count, setCount] = useState(0); // линтер проверит порядок вызовов, условность и т.п.
  return count;
}
```

**Композиция нескольких хуков — строительные блоки, а не наследование**

```typescript
// Каждый хук — независимый переиспользуемый блок (🔗 Тема 29 — композиция vs наследование)
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id); // отмена предыдущего таймера при новом значении
  }, [value, delay]);
  return debounced;
}

function useFetch<T>(url: string): { data: T | null; loading: boolean } {
  // ... (реализация из Темы 33)
}

// Композиция: search-функциональность собрана из двух независимых хуков
function useSearchResults(query: string) {
  const debouncedQuery = useDebounce(query, 300); // не дёргать API на каждое нажатие клавиши
  const { data, loading } = useFetch<SearchResult[]>(`/api/search?q=${debouncedQuery}`);
  return { results: data, loading };
}

function SearchBox() {
  const [query, setQuery] = useState('');
  const { results, loading } = useSearchResults(query); // одна строка вместо всей логики
  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {loading ? <Spinner /> : <ResultsList items={results ?? []} />}
    </div>
  );
}
```

**Схема: от копипасты к кастомным хукам**

```
БЕЗ кастомных хуков:                     С кастомными хуками:
────────────────────────                  ──────────────────────
ComponentA: useState+useEffect            ComponentA: useFetch(url)
  для fetch (15 строк)                      (1 строка)
ComponentB: useState+useEffect            ComponentB: useFetch(url)
  для того же fetch (те же 15 строк)        (1 строка)
ComponentC: useState+useEffect            ComponentC: useFetch(url)
  снова копипаста                           (1 строка)

Дублирование логики,                     Логика в одном месте,
риск разных багов в                      баги фиксятся один раз,
каждой копии                             легко тестируется отдельно
```

**Каждый вызов кастомного хука — своя изолированная копия состояния**

```typescript
function ComponentA() {
  const [count, setCount] = useCounter(); // своё состояние
}
function ComponentB() {
  const [count, setCount] = useCounter(); // отдельное, независимое состояние
}
// count в ComponentA и ComponentB никак не связаны — каждый вызов useCounter()
// создаёт свою "ячейку" состояния в своём Fiber-узле (🔗 Тема 31)
```

Это принципиально отличает кастомные хуки от Context (🔗 Тема 37) или глобального state-менеджера — хук не является общим "хранилищем", а шаблоном логики, инстанцируемым отдельно при каждом вызове.

---

## 2. Связь со стеком

**TypeScript: типизация generic-хуков для переиспользуемости**

```typescript
// Generic-параметр T делает useFetch применимым к любому типу данных
function useFetch<T>(url: string): { data: T | null; loading: boolean; error: string | null } {
  // ...
}

const { data: users } = useFetch<User[]>('/api/users');   // data: User[] | null
const { data: product } = useFetch<Product>('/api/product/1'); // data: Product | null
```

**Next.js: кастомные хуки — только в Client Components**

```typescript
'use client'; // обязательно, если хук использует useState/useEffect
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => { /* ... */ }, []);
  return isOnline;
}
```

Хуки, не использующие state/effects (чистые вычисления, оборачивающие несколько вызовов `useMemo`), могут технически быть переиспользованы в цепочке рендеринга, но полноценные stateful-хуки требуют Client Component контекста.

**Экосистема community-хуков (`usehooks-ts`, `ahooks`, `react-use`)** — по сути каталоги готовых кастомных хуков (`useDebounce`, `useLocalStorage`, `useMediaQuery`, `useWindowSize` из Темы 39) — знание принципа их построения позволяет как использовать готовые, так и писать свои под специфику проекта.

---

## 3. Лучшие паттерны

**✅ Паттерн 1: Один кастомный хук — одна переиспользуемая обязанность (SRP, 🔗 Тема 28)**

```typescript
// ❌ Плохо: хук делает слишком много несвязанных вещей
function useUserPageLogic(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // fetch user, управление темой, уведомления — три разные ответственности
}

// ✅ Хорошо: раздельные хуки, композиция в компоненте
function UserPage({ userId }: { userId: string }) {
  const { data: user } = useFetch<User>(`/api/users/${userId}`);
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const notifications = useNotifications();
}
```

*Почему best practice:* Раздельные хуки тестируются независимо и переиспользуются в разных контекстах — смешанный хук годится только для одного конкретного экрана.

**✅ Паттерн 2: Возвращать объект с именованными полями для 3+ значений, массив — для 2 (по конвенции `useState`)**

```typescript
// ❌ Плохо: массив из 4 значений — легко перепутать порядок при деструктуризации
function useForm(): [FormValues, (v: FormValues) => void, boolean, string | null] { /* ... */ }
const [values, setValues, isValid, error] = useForm(); // порядок нужно помнить

// ✅ Хорошо: объект — порядок деструктуризации не важен, имена самодокументируют
function useForm(): { values: FormValues; setValues: (v: FormValues) => void; isValid: boolean; error: string | null } { /* ... */ }
const { values, setValues, isValid, error } = useForm();
```

*Почему:* Пара `[value, setValue]` (как у `useState`) интуитивна и коротка для двух значений; при трёх и более полях именованный объект избавляет от необходимости помнить порядок.

**✅ Паттерн 3: Кастомный хук инкапсулирует "как", компонент решает "что показать"**

```typescript
// ✅ Хук не содержит JSX и решений об отображении — только логика и данные
function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);
  return { remaining, isFinished: remaining <= 0 };
}

// Разные компоненты — разное отображение той же логики
function TimerDisplay({ seconds }: { seconds: number }) {
  const { remaining } = useCountdown(seconds);
  return <span>{remaining}с</span>;
}
function TimerProgressBar({ seconds }: { seconds: number }) {
  const { remaining } = useCountdown(seconds);
  return <progress value={seconds - remaining} max={seconds} />;
}
```

*Почему:* Разделение "логики" (хук) и "представления" (компонент) — тот же принцип, что Container/Presentational паттерн, позволяющий переиспользовать одну логику с разным UI.

---

## 4. Вопросы интервью

**Q1: Что такое кастомный хук?**

Обычная JavaScript/TypeScript функция, имя которой начинается с `use`, вызывающая внутри себя другие хуки (встроенные или кастомные) для извлечения и переиспользования стейтфул-логики между разными компонентами без дублирования кода.

**Q2: Зачем нужна конвенция именования `use*` для кастомных хуков?**

Это не техническое требование JavaScript, а договорённость, позволяющая инструментам (в первую очередь `eslint-plugin-react-hooks`) статически определять, что данная функция — хук, и применять к ней проверку правил хуков (порядок вызова, отсутствие условных вызовов). Без префикса `use` линтер не распознает функцию как хук и не проверит эти правила.

**Q3: Разделяют ли два компонента, использующие один и тот же кастомный хук, общее состояние?**

Нет — каждый вызов кастомного хука создаёт полностью независимую копию состояния в своём собственном Fiber-узле (🔗 Тема 31). Кастомный хук — это шаблон/паттерн логики, а не общее хранилище данных; для общего состояния между компонентами нужен `useContext` (🔗 Тема 37) или сторонний state-менеджер.

**Q4: Может ли кастомный хук вызывать другой кастомный хук?**

Да — это стандартная композиция: кастомные хуки можно комбинировать, вызывая один внутри другого (например, `useSearchResults` из теории вызывает и `useDebounce`, и `useFetch`). Ограничение только одно: правило хуков должно соблюдаться на каждом уровне композиции.

**Q5: Почему нельзя вызывать хуки внутри обычных функций-хелперов, не начинающихся с `use`?**

Технически JavaScript не запрещает это — код выполнится. Но React ожидает вызовы хуков в контексте рендера компонента (прямо или через цепочку кастомных хуков) для корректной работы механизма индексации состояния (🔗 Тема 31), а линтер не сможет проверить правило хуков в функции без префикса `use`, что оставляет потенциальные баги незамеченными.

**Q6: В чём разница между кастомным хуком и Higher-Order Component (HOC)?**

HOC — функция, принимающая компонент и возвращающая новый компонент с добавленной логикой (`withAuth(Component)`) — добавляет "обёртку" в дерево компонентов, что усложняет отладку (wrapper hell) и требует пробрасывания пропсов. Кастомный хук не создаёт дополнительной обёртки в дереве — это просто функция, вызываемая внутри существующего компонента, что делает композицию более прозрачной и предпочтительной в современном React.

**Q7: Как тестировать кастомный хук изолированно от конкретного компонента?**

Через утилиты типа `@testing-library/react` (`renderHook`) — специальный вспомогательный "тестовый компонент" вызывает хук и предоставляет доступ к возвращаемым значениям и возможность их обновления, без необходимости рендерить полноценный UI-компонент, использующий этот хук.

**Q8: Что должен возвращать кастомный хук — массив или объект?**

Зависит от количества значений и их семантики: массив из двух элементов (`[value, setValue]`) следует конвенции `useState`, интуитивно понятен для пар "значение + сеттер". При трёх и более возвращаемых значениях предпочтительнее объект с именованными полями — так проще не ошибиться в порядке при деструктуризации на стороне вызывающего компонента.

**Q9: Может ли кастомный хук содержать JSX?**

Технически хук может возвращать React-элементы (JSX), но по конвенции хуки инкапсулируют логику и данные, а не визуальное представление — рендеринг остаётся ответственностью компонента. Хук, возвращающий JSX, размывает границу между "логикой" и "представлением", усложняя переиспользование с разным UI.

**Q10: Как кастомные хуки связаны с принципом DRY (🔗 Тема 28)?**

Кастомные хуки — основной механизм React для устранения дублирования (Don't Repeat Yourself) именно stateful-логики (в отличие от обычных функций, которые не могут содержать хуки и, следовательно, не подходят для переиспользования кода с `useState`/`useEffect`). Правило "трёх повторений" из Темы 28 применимо и здесь: если один и тот же паттерн `useState`+`useEffect` копируется в третий компонент — время извлечь кастомный хук.

---

## 5. Практическое задание

Реализуй кастомный хук `usePagination<T>(items: T[], pageSize: number)`, возвращающий:

1. `currentItems: T[]` — элементы текущей страницы.
2. `currentPage: number`, `totalPages: number`.
3. `goToPage(page: number)`, `nextPage()`, `previousPage()` — с защитой от выхода за границы диапазона страниц.
4. При изменении `items` или `pageSize` — автоматический сброс на первую страницу (без "зависания" на несуществующей странице).

---

## 6. Решение с инсайтом

```typescript
import { useState, useMemo, useEffect, useCallback } from 'react';

interface UsePaginationResult<T> {
  currentItems: T[];
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
}

function usePagination<T>(items: T[], pageSize: number): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / pageSize)),
    [items.length, pageSize]
  );

  // Сброс на первую страницу при изменении данных — избегаем "зависания" на несуществующей странице
  useEffect(() => {
    setCurrentPage(1);
  }, [items, pageSize]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = useCallback((page: number) => {
    // Защита от выхода за границы — clamp в допустимый диапазон
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages)); // функциональное обновление (🔗 Тема 31)
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  return { currentItems, currentPage, totalPages, goToPage, nextPage, previousPage };
}

// Использование — вся сложность пагинации скрыта за одним хуком
function ProductList({ products }: { products: Product[] }) {
  const { currentItems, currentPage, totalPages, nextPage, previousPage } = usePagination(products, 10);

  return (
    <div>
      <ul>{currentItems.map(p => <li key={p.id}>{p.name}</li>)}</ul>
      <button onClick={previousPage} disabled={currentPage === 1}>←</button>
      <span>{currentPage} / {totalPages}</span>
      <button onClick={nextPage} disabled={currentPage === totalPages}>→</button>
    </div>
  );
}

export default usePagination;
```

> **Инсайт:** `useEffect` со сбросом на первую страницу при изменении `items`/`pageSize` — намеренная защита от бага, который иначе проявился бы незаметно: если пользователь отфильтровал список так, что страниц стало меньше, а `currentPage` осталась старой (например, "5" при новых `totalPages = 2`), `currentItems.slice()` вернул бы пустой массив без явной ошибки — визуально "пустой список" без объяснения причины. Каждый setter (`goToPage`, `nextPage`, `previousPage`) явно "зажимает" (clamp) значение в допустимый диапазон — типичный паттерн защитного программирования, применимый к любому хуку, управляющему индексом/позицией.

---

*Раздел 13 — Композиция и архитектура React · Тема 41 из 43*
