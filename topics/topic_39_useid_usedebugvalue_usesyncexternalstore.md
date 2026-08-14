# Контент курса — Тема 39: useId, useDebugValue, useSyncExternalStore

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 12 — Тема 39 (useId, useDebugValue, useSyncExternalStore)

---

# Тема 39 — useId, useDebugValue, useSyncExternalStore

← Предыдущая тема: [38 — useTransition и useDeferredValue](topic_38_usetransition_usedeferredvalue.md)
→ Следующая тема: [40 — React 19: use(), useActionState, useOptimistic](topic_40_react19_hooks.md)

---

## 1. Теория с аналогиями

Эта тема объединяет три нишевых, но значимых хука, каждый решающий узкую инфраструктурную задачу — их редко используют напрямую в обычном прикладном коде, но понимание их существования важно для интервью и для чтения кода библиотек.

### useId — стабильный идентификатор для SSR/гидратации

**Аналогия: номерок в гардеробе, а не случайное число**

Если каждый посетитель гардероба получал бы случайный номерок, а не последовательный — при повторной выдаче того же пальто номерки могли бы не совпасть между "сдачей" (сервер) и "выдачей" (клиент). `useId` генерирует **стабильный** идентификатор, одинаковый на сервере при SSR и на клиенте при последующей гидратации — в отличие от `Math.random()` или счётчика, который может рассинхронизироваться.

```typescript
// ❌ Плохо: Math.random() даёт РАЗНЫЕ id на сервере и при гидратации на клиенте
function FormField({ label }: { label: string }) {
  const id = `field-${Math.random()}`; // сервер: "field-0.123", клиент: "field-0.456" — MISMATCH
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </>
  );
}

// ✅ Хорошо: useId — гарантированно одинаковый id на сервере и клиенте
function FormField({ label }: { label: string }) {
  const id = useId(); // React синхронизирует генерацию id между SSR-рендером и гидратацией
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </>
  );
}
```

```
SSR (сервер):                          Гидратация (клиент):
useId() → ":r0:"                       useId() → ":r0:"     ✓ совпадает
                                        (если бы Math.random() — ✗ mismatch, warning в консоли)
```

**Почему не подходит инкрементный счётчик (`let nextId = 0`)**

Порядок вызова компонентов на сервере при потоковом рендеринге (Server Components + Suspense, 🔗 Тема 42) может отличаться от порядка гидратации на клиенте — простой инкрементный счётчик не гарантирует совпадения. `useId` учитывает позицию компонента в дереве, а не порядок вызова во времени.

```typescript
// useId для связывания НЕСКОЛЬКИХ related-элементов — с суффиксами
function Fieldset() {
  const id = useId();
  return (
    <fieldset>
      <label htmlFor={`${id}-name`}>Имя</label>
      <input id={`${id}-name`} aria-describedby={`${id}-hint`} />
      <span id={`${id}-hint`}>Только буквы</span>
    </fieldset>
  );
}
```

### useDebugValue — кастомная метка в React DevTools

**Аналогия: подпись на коробке, а не догадки по содержимому**

```typescript
// Без useDebugValue: в React DevTools кастомный хук показывает только внутренние useState/useRef
function useFriendStatus(friendId: string) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  useEffect(() => { /* подписка на статус друга */ }, [friendId]);

  // useDebugValue добавляет понятную метку рядом с хуком в дереве DevTools
  useDebugValue(isOnline, status => status === null ? 'Загрузка...' : (status ? 'Онлайн' : 'Оффлайн'));

  return isOnline;
}
```

Второй аргумент — функция форматирования, вызывается **только когда DevTools открыт** и хук инспектируется — не влияет на производительность в production.

### useSyncExternalStore — подписка на источники состояния вне React

**Аналогия: синхронизация часов по внешнему радиосигналу**

Обычные часы (внутренний state React) идут сами по себе. Но если есть внешний, авторитетный источник времени (глобальный store — браузерный API, Redux store, WebSocket) — нужен механизм гарантированно синхронизировать отображение с этим внешним источником, включая безопасность при конкурентном рендеринге (🔗 Тема 38), где промежуточный рендер может увидеть "разорванное" состояние.

```typescript
// Проблема, которую useSyncExternalStore решает: подписка на browser API
function useOnlineStatus(): boolean {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);
    return () => {
      window.removeEventListener('online', callback);
      window.removeEventListener('offline', callback);
    };
  }, []);

  const getSnapshot = useCallback(() => navigator.onLine, []);

  // useSyncExternalStore гарантирует консистентность даже при tearing
  // (когда конкурентный рендер мог бы иначе показать разные компоненты с разным значением store)
  return useSyncExternalStore(subscribe, getSnapshot);
}

function StatusBadge() {
  const isOnline = useOnlineStatus();
  return <span>{isOnline ? '🟢 Онлайн' : '🔴 Нет сети'}</span>;
}
```

**Почему нельзя просто `useState` + `useEffect` для подписки на внешний store**

```typescript
// ❌ "Наивный" подход — работает в большинстве случаев, но не защищён от "tearing"
function useOnlineStatusNaive(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handler = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }, []);
  return isOnline;
}
```

В большинстве прикладных случаев наивный подход работает нормально. `useSyncExternalStore` даёт дополнительную гарантию: при конкурентном рендеринге React принудительно синхронно перепроверяет `getSnapshot()` перед показом кадра, если store изменился во время рендера — предотвращая ситуацию, когда два компонента в одном дереве временно показывают разные значения одного и того же внешнего state ("tearing").

```
Библиотеки state-менеджмента (Redux, Zustand, Jotai) используют
useSyncExternalStore ВНУТРИ своих биндингов к React — именно поэтому
useSelector()/useStore() из этих библиотек безопасны при конкурентном рендеринге.
```

---

## 2. Связь со стеком

**Next.js App Router: `useId` критичен именно из-за server-side rendering**

Next.js рендерит страницы на сервере (Server Components + потоковый SSR через Suspense, 🔗 Тема 42) — любой Client Component с формами обязан использовать `useId` для `htmlFor`/`aria-*` атрибутов, иначе React выдаст hydration mismatch warning.

**`useSyncExternalStore` — основа `zustand`**

```typescript
// Упрощённая идея того, как zustand использует useSyncExternalStore внутри
function useStore<T, U>(store: { getState: () => T; subscribe: (cb: () => void) => () => void }, selector: (state: T) => U): U {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState())
  );
}
```

**React DevTools — `useDebugValue` виден только разработчикам**, не влияет на пользователя приложения; полезен в переиспользуемых библиотеках кастомных хуков (🔗 Тема 41) с непрозрачным внутренним состоянием.

---

## 3. Лучшие паттерны

**✅ Паттерн 1: `useId`, а не собственная генерация, для любых id, синхронизируемых между SSR и клиентом**

```typescript
// ❌ Плохо: собственный счётчик модуля — не синхронизирован с SSR
let counter = 0;
function useCustomId() { return useRef(`id-${counter++}`).current; }

// ✅ Хорошо: useId — гарантия от React
function useCustomId() { return useId(); }
```

*Почему best practice:* Только `useId` даёт официальную гарантию совпадения между сервером и клиентом при гидратации.

**✅ Паттерн 2: `useDebugValue` — только в переиспользуемых кастомных хуках библиотечного уровня**

```typescript
// ❌ Излишне: useDebugValue в хуке, используемом в одном месте приложения
function useLocalCounter() {
  const [count, setCount] = useState(0);
  useDebugValue(count); // не даёт пользы — и так очевидно в DevTools
  return count;
}

// ✅ Оправдано: сложный кастомный хук с непрозрачным внутренним состоянием, используемый широко
function useWebSocketConnection(url: string) {
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('connecting');
  useDebugValue(status, s => `WebSocket: ${s.toUpperCase()}`); // полезно при отладке многих экземпляров
  return status;
}
```

*Почему:* Ценность `useDebugValue` пропорциональна сложности хука и количеству мест, где инженеры будут его отлаживать через DevTools.

**✅ Паттерн 3: `useSyncExternalStore` для любого стороннего (не-React) источника состояния, а не самодельный `useEffect`+`useState`**

```typescript
// ❌ Риск "tearing" при конкурентном рендеринге в сложных сценариях
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

// ✅ Официально рекомендованный примитив для внешних источников
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    callback => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    () => window.matchMedia(query).matches
  );
}
```

*Почему:* `useSyncExternalStore` спроектирован специально для этого класса задач и даёт гарантии консистентности, которые `useEffect`+`useState` не может обеспечить в конкурентном режиме.

---

## 4. Вопросы интервью

**Q1: Для чего нужен `useId` и почему нельзя использовать `Math.random()`?**

`useId` генерирует идентификатор, гарантированно одинаковый между серверным рендерингом (SSR) и последующей гидратацией на клиенте — используется для связывания `label`/`input` через `htmlFor`/`id`, `aria-describedby` и т.п. `Math.random()` даёт разные значения на сервере и клиенте, что приводит к hydration mismatch — предупреждению React о несовпадении разметки.

**Q2: Подходит ли `useId` для генерации key в списке (`key={useId()}`)?**

Нет — `useId` предназначен для стабильных, не связанных с данными идентификаторов элементов формы/accessibility. Для `key` в списке нужен идентификатор, связанный с конкретными данными элемента (`item.id`), а не с позицией компонента в дереве, который `useId` генерирует единообразно для каждого вызова хука.

**Q3: Что делает `useDebugValue` и виден ли его эффект пользователям приложения?**

Добавляет кастомную метку для отображения кастомного хука в React DevTools. Не виден пользователям и не влияет на производительность/поведение в production — единственная аудитория — разработчики, инспектирующие компонент через DevTools.

**Q4: Зачем нужен `useSyncExternalStore`, если можно подписаться на внешний store через `useEffect` + `useState`?**

`useSyncExternalStore` даёт дополнительную гарантию консистентности при конкурентном рендеринге (🔗 Тема 38): React синхронно перепроверяет актуальный снимок (`getSnapshot`) перед показом кадра, если внешний store изменился во время рендера — предотвращая "tearing" (ситуацию, когда разные компоненты одного дерева временно отображают разные значения одного и того же внешнего состояния). Наивный `useEffect`+`useState` такой гарантии не даёт.

**Q5: Что такое "tearing" в контексте конкурентного рендеринга?**

Ситуация, когда несколько компонентов, читающих один и тот же внешний (не-React) источник состояния, из-за прерываемости конкурентного рендеринга могут в рамках одного кадра отобразить разные, несогласованные между собой значения этого состояния — например, один компонент показывает старое значение, другой уже новое, хотя оба должны быть синхронизированы.

**Q6: Какие аргументы принимает `useSyncExternalStore`?**

`subscribe(callback)` — функция подписки на изменения внешнего store, возвращающая функцию отписки; `getSnapshot()` — функция, возвращающая текущее значение store; опционально третий аргумент `getServerSnapshot()` — для получения снимка при серверном рендеринге.

**Q7: Какие библиотеки используют `useSyncExternalStore` внутри своих React-биндингов?**

Redux (`react-redux` начиная с определённой версии), Zustand, Jotai и другие современные state-менеджеры используют `useSyncExternalStore` для подписки React-компонентов на изменения своего внешнего (вне React) хранилища состояния, обеспечивая безопасность при конкурентном рендеринге.

**Q8: Почему `useId` генерирует значения вида `:r0:`, а не простые числа?**

Формат с двоеточиями специально сделан "непохожим" на обычные CSS-селекторы/атрибуты, чтобы избежать случайных коллизий с существующими id на странице, и одновременно кодирует позицию компонента в дереве для гарантии стабильности между серверным и клиентским рендером.

**Q9: В каком режиме React `useDebugValue` не выполняет форматирующую функцию?**

Когда React DevTools не открыт (или хук не инспектируется в данный момент) — форматирующая функция, переданная вторым аргументом, вызывается только "лениво", при реальной попытке отобразить значение в DevTools, что предотвращает лишние вычисления в обычном режиме работы приложения.

**Q10: Можно ли использовать `useSyncExternalStore` для подписки на изменения обычного React state другого компонента?**

Технически нет смысла — `useSyncExternalStore` предназначен именно для источников состояния **вне** React (browser API, сторонние stores, WebSocket-соединения). Для взаимодействия между React-компонентами существуют штатные механизмы: пропсы, `useContext` (🔗 Тема 37), передача состояния через общего родителя.

---

## 5. Практическое задание

Реализуй кастомный хук `useWindowSize()`, используя `useSyncExternalStore`, возвращающий `{ width: number; height: number }`, актуализируемый при изменении размера окна браузера:

1. `subscribe` — подписка на событие `resize` окна.
2. `getSnapshot` — должен возвращать **стабильную по ссылке** структуру, если размер не изменился (иначе бесконечный цикл ре-рендеров — обсуди это в комментарии).
3. Добавь `useDebugValue` с человекочитаемым форматом (`"1024×768"`).

---

## 6. Решение с инсайтом

```typescript
import { useSyncExternalStore, useDebugValue, useRef } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function useWindowSize(): WindowSize {
  // Кэш последнего снимка — критично для стабильности ссылки между вызовами getSnapshot
  const cachedSnapshot = useRef<WindowSize>({ width: window.innerWidth, height: window.innerHeight });

  function getSnapshot(): WindowSize {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Если размер не изменился — возвращаем ТУ ЖЕ ссылку, а не новый объект.
    // Без этого каждый вызов getSnapshot создавал бы новый объект →
    // React решал бы, что store "всегда меняется" → бесконечный цикл повторных рендеров.
    if (cachedSnapshot.current.width !== width || cachedSnapshot.current.height !== height) {
      cachedSnapshot.current = { width, height };
    }
    return cachedSnapshot.current;
  }

  const size = useSyncExternalStore(subscribe, getSnapshot);

  useDebugValue(size, s => `${s.width}×${s.height}`);

  return size;
}

// Использование
function ResponsiveInfo() {
  const { width, height } = useWindowSize();
  return <p>Размер окна: {width} × {height}</p>;
}

export default useWindowSize;
```

> **Инсайт:** Требование "стабильная по ссылке структура, если данные не изменились" — не формальность, а прямое следствие того, как React определяет необходимость ре-рендера (`Object.is`, 🔗 Тема 5, Тема 31): `getSnapshot`, возвращающий новый объект при каждом вызове, заставил бы React считать, что store меняется на каждом рендере, вызывая бесконечный цикл. Этот нюанс — типичный вопрос на понимание внутреннего устройства `useSyncExternalStore`, отличающий поверхностное знание хука от глубокого.

---

*Раздел 12 — Конкурентные и специализированные хуки · Тема 39 из 43*
