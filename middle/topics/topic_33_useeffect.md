# Контент курса — Тема 33: useEffect

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 10 — Тема 33 (useEffect)

---

# Тема 33 — useEffect

← Предыдущая тема: [32 — useReducer](topic_32_usereducer.md)
→ Следующая тема: [34 — useLayoutEffect и useInsertionEffect](topic_34_uselayouteffect_useinsertioneffect.md)

---

## 1. Теория с аналогиями

**Аналогия: уборка после гостей**

Рендер компонента — это "приём гостей": React вызывает функцию, строит JSX, обновляет DOM. Но некоторые действия не относятся к самому приёму — это "выход во внешний мир": подписаться на звонок в дверь, поставить чайник, а после того как гости ушли — убрать за собой (отписаться, выключить чайник). `useEffect` — специально выделенное место для такого "выхода во внешний мир", происходящего **после** того, как React обновил экран, и с обязательной возможностью "убрать за собой" при следующем эффекте или размонтировании.

**Почему нельзя просто писать side-эффекты в теле компонента**

```typescript
// ❌ КРИТИЧЕСКАЯ ошибка: побочный эффект прямо в рендере
function Bad({ userId }: { userId: string }) {
  fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser); // на каждом рендере!
  document.title = `Профиль ${userId}`; // мутация вне React — рендер должен быть чистым (🔗 Тема 30)
  return <div>...</div>;
}

// ✅ Хорошо: побочный эффект — в useEffect, вызывается ПОСЛЕ commit-фазы
function Good({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser);
    document.title = `Профиль ${userId}`;
  }, [userId]); // выполняется только когда userId реально изменился

  return <div>...</div>;
}
```

**Массив зависимостей — контракт "когда нужно перезапустить эффект"**

```
useEffect(fn)               → выполняется ПОСЛЕ КАЖДОГО рендера
useEffect(fn, [])           → выполняется ОДИН РАЗ после первого рендера (монтирование)
useEffect(fn, [a, b])       → выполняется после рендера, если a или b изменились (Object.is)
```

```typescript
useEffect(() => {
  console.log('Рендер произошёл, userId или filter изменились');
}, [userId, filter]);
```

React сравнивает каждый элемент массива зависимостей с предыдущим рендером через `Object.is` (🔗 Тема 5) — отсюда классическая ловушка с объектами/массивами в зависимостях:

```typescript
// ❌ Ловушка: новый объект на каждом рендере → эффект выполняется КАЖДЫЙ раз
function Bad({ userId }: { userId: string }) {
  const options = { userId, cache: true }; // новая ссылка на каждый рендер!
  useEffect(() => {
    fetchUser(options);
  }, [options]); // options всегда "новый" → эффект перезапускается бесконечно, если внутри setState
}

// ✅ Хорошо: примитивы в зависимостях, либо мемоизация объекта (🔗 Тема 35)
useEffect(() => {
  fetchUser({ userId, cache: true });
}, [userId]); // примитив сравнивается по значению
```

**Cleanup-функция — обязательная "уборка"**

```typescript
useEffect(() => {
  const id = setInterval(() => console.log('tick'), 1000);
  return () => clearInterval(id); // вызывается ПЕРЕД следующим эффектом и при размонтировании
}, []);
```

```
Монтирование:        effect() запускается
Зависимости меняются: cleanup() старого эффекта → effect() нового эффекта
Размонтирование:      cleanup() запускается
```

Без cleanup — классическая утечка памяти и "эффекты-призраки", продолжающие работать после того, как компонент уже исчез с экрана (🔗 Тема 3 — замыкания и утечки памяти).

**Stale closures в `useEffect`**

```typescript
// ❌ Классическая ловушка: count "заморожен" на момент монтирования
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(count);      // всегда 0 — замыкание захватило count из первого рендера
      setCount(count + 1);     // всегда устанавливает 0 + 1 = 1
    }, 1000);
    return () => clearInterval(id);
  }, []); // пустой массив — эффект создаётся один раз, count внутри "застывает"
}

// ✅ Решение 1: функциональное обновление — не зависит от значения в замыкании
useEffect(() => {
  const id = setInterval(() => setCount(prev => prev + 1), 1000);
  return () => clearInterval(id);
}, []);

// ✅ Решение 2: включить count в зависимости — эффект пересоздаётся с актуальным значением
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, [count]); // но это пересоздаёт интервал на каждое изменение — обычно хуже решения 1
```

**Правило хуков — почему порядок вызовов критичен**

```typescript
// ❌ КРИТИЧЕСКАЯ ошибка: условный вызов эффекта
function Bad({ isEnabled }: { isEnabled: boolean }) {
  if (isEnabled) {
    useEffect(() => { /* ... */ }, []); // ❌ нарушает правило хуков
  }
  // При изменении isEnabled между рендерами количество вызовов хуков меняется —
  // React присвоит следующим хукам значения из "чужих" ячеек (🔗 Тема 2, Тема 31)
}

// ✅ Хорошо: хук вызывается всегда, условие — внутри эффекта
function Good({ isEnabled }: { isEnabled: boolean }) {
  useEffect(() => {
    if (!isEnabled) return;
    /* ... */
  }, [isEnabled]);
}
```

**Гонка данных при фетчинге (race condition)**

```typescript
// ❌ Проблема: быстрая смена userId может привести к тому,
// что ответ на СТАРЫЙ запрос придёт ПОСЛЕ ответа на новый и перезапишет данные
useEffect(() => {
  fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser);
}, [userId]);

// ✅ Решение: флаг отмены или AbortController в cleanup
useEffect(() => {
  let isCancelled = false;
  fetch(`/api/users/${userId}`)
    .then(r => r.json())
    .then(data => { if (!isCancelled) setUser(data); });
  return () => { isCancelled = true; }; // игнорировать устаревший ответ
}, [userId]);
```

---

## 2. Связь со стеком

**Next.js: `useEffect` для клиентских побочных эффектов, Server Components — для данных**

```typescript
// ❌ Антипаттерн в App Router: fetch в useEffect там, где мог бы быть Server Component
'use client';
function ProductPage({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  useEffect(() => {
    fetch(`/api/products/${id}`).then(r => r.json()).then(setProduct);
  }, [id]);
}

// ✅ Next.js App Router: данные — на сервере, useEffect — только для клиентской интерактивности
// app/products/[id]/page.tsx — Server Component
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id); // без useEffect, без состояния загрузки
  return <ProductView product={product} />;
}
```

`useEffect` остаётся необходимым в Client Components для: подписок на браузерные API (`resize`, `scroll`), интеграции с не-React библиотеками, аналитики, синхронизации с `localStorage`.

**AbortController — стандартный способ отмены запроса**

```typescript
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/users/${userId}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setUser)
    .catch(err => { if (err.name !== 'AbortError') throw err; });
  return () => controller.abort(); // отменяет сетевой запрос при смене userId/размонтировании
}, [userId]);
```

**ESLint `react-hooks/exhaustive-deps`** — правило, автоматически проверяющее полноту массива зависимостей; предупреждения от него почти всегда указывают на реальный stale closure баг, а не "шум".

---

## 3. Лучшие паттерны

**✅ Паттерн 1: Один эффект — одна логическая задача**

```typescript
// ❌ Плохо: два несвязанных side-эффекта в одном useEffect
useEffect(() => {
  document.title = `${unreadCount} новых`;
  const id = setInterval(fetchNotifications, 5000);
  return () => clearInterval(id);
}, [unreadCount]); // clearInterval будет вызываться при каждом изменении unreadCount — избыточно

// ✅ Хорошо: раздельные эффекты с собственными зависимостями
useEffect(() => {
  document.title = `${unreadCount} новых`;
}, [unreadCount]);

useEffect(() => {
  const id = setInterval(fetchNotifications, 5000);
  return () => clearInterval(id);
}, []); // интервал создаётся один раз, а не при каждом изменении unreadCount
```

*Почему best practice:* Разделение по ответственности упрощает рассуждение о том, когда и почему эффект перезапускается — аналог Single Responsibility (🔗 Тема 28) применительно к эффектам.

**✅ Паттерн 2: Всегда возвращать cleanup для подписок/таймеров/сетевых запросов**

```typescript
// ❌ Плохо: подписка без отписки — утечка памяти
useEffect(() => {
  window.addEventListener('resize', handleResize);
}, []);

// ✅ Хорошо: cleanup гарантированно отписывает
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

*Почему:* Каждая подписка без отписки — потенциальная утечка, особенно критичная в SPA с частым монтированием/размонтированием компонентов (🔗 Тема 3).

**✅ Паттерн 3: `exhaustive-deps` не игнорировать — а исправлять причину, а не подавлять предупреждение**

```typescript
// ❌ Плохо: подавление правильного предупреждения — маскирует stale closure
useEffect(() => {
  sendAnalytics(userId, currentPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // currentPage изменится, но эффект не перезапустится — баг

// ✅ Хорошо: включить реальную зависимость или использовать ref для "не реактивных" значений
useEffect(() => {
  sendAnalytics(userId, currentPage);
}, [userId, currentPage]);
```

*Почему:* Комментарий `eslint-disable` для `exhaustive-deps` почти всегда маскирует настоящий stale closure баг, а не "лишнее" предупреждение — линтер статически анализирует те же самые причины, что мы разбирали выше.

---

## 4. Вопросы интервью

**Q1: Зачем нужен `useEffect`, если можно писать код прямо в теле компонента?**

Тело функции-компонента вызывается на render-фазе (🔗 Тема 30), которая может быть прервана/перезапущена React'ом и обязана быть чистой (без побочных эффектов). `useEffect` выполняется после commit-фазы — когда DOM гарантированно обновлён — и React вызывает его ровно по контракту зависимостей, а не при каждом промежуточном вызове функции компонента.

**Q2: Что означают разные варианты массива зависимостей: отсутствие, `[]`, `[a, b]`?**

Отсутствие массива — эффект выполняется после каждого рендера. `[]` — только после первого рендера (аналог "монтирования"). `[a, b]` — эффект перезапускается, если `a` или `b` изменились по сравнению с предыдущим рендером (сравнение через `Object.is`).

**Q3: Что такое cleanup-функция и когда она вызывается?**

Функция, которую можно вернуть из эффекта; она вызывается перед выполнением следующего эффекта (после изменения зависимостей) и при размонтировании компонента. Используется для отписки от событий, отмены таймеров/запросов — предотвращает утечки памяти и "эффекты-призраки".

**Q4: Что такое stale closure в контексте `useEffect` и как его избежать?**

Ситуация, когда колбэк внутри эффекта захватывает значение state/пропса из момента создания эффекта и не видит последующих обновлений (особенно с пустым массивом зависимостей). Решения: функциональное обновление `setState(prev => ...)`, добавление значения в массив зависимостей, либо использование `useRef` для хранения "живого" значения без пересоздания эффекта.

**Q5: Почему объект/массив/функция как зависимость может вызвать бесконечный цикл эффекта?**

Литералы объектов/массивов/функций создают новую ссылку на каждом рендере — `Object.is` всегда возвращает `false` при сравнении с предыдущей зависимостью, поэтому эффект перезапускается на каждый рендер. Если внутри эффекта есть `setState`, это триггерит новый рендер → новый объект → новый запуск эффекта → бесконечный цикл. Решение — мемоизация (`useMemo`/`useCallback`, 🔗 Тема 35) или примитивные значения в зависимостях.

**Q6: Как решить race condition при фетчинге данных в `useEffect`?**

Через флаг отмены (`let isCancelled = false` + проверка в `.then`) или, предпочтительнее, `AbortController`, чей `signal` передаётся в `fetch`, а `controller.abort()` вызывается в cleanup. Это гарантирует, что устаревший (для более раннего значения зависимости) ответ не перезапишет актуальные данные.

**Q7: Почему хуки нельзя вызывать условно или в циклах?**

React сопоставляет вызовы хуков с "ячейками" состояния по порядковому индексу вызова (🔗 Тема 31). Если число или порядок вызовов хуков меняется между рендерами (из-за `if`/`for` вокруг хука), индексы "съезжают" — React присвоит хуку данные из чужой ячейки, что приводит к трудноуловимым багам.

**Q8: В чём разница `useEffect(fn, [])` и написания того же кода прямо в теле компонента без хука?**

Код в теле компонента выполняется синхронно во время render-фазы, на каждом рендере, и не может безопасно выполнять побочные эффекты (мутации DOM, запросы). `useEffect(fn, [])` гарантированно выполняется один раз, после первого commit, когда DOM уже отрендерен — безопасное место для инициализационной логики, требующей существования реального DOM или внешних систем.

**Q9: Как эффект связан с правилом "хуки вызываются в одном и том же порядке"?**

`useEffect` — такой же хук, как `useState`, и подчиняется тому же механизму индексации по порядку вызова. Условный вызов `useEffect` нарушает правило точно так же, как условный `useState` — с теми же последствиями смещения индексов.

**Q10: Что произойдёт, если не указать массив зависимостей вообще?**

Эффект будет выполняться после **каждого** рендера компонента — включая рендеры, вызванные изменением совершенно не связанных с эффектом пропсов/state. Это редко нужное поведение и обычно указывает на ошибку — почти всегда следует указывать явный (возможно, пустой) массив зависимостей.

---

## 5. Практическое задание

Реализуй хук `useFetch<T>(url: string)`, возвращающий `{ data: T | null; loading: boolean; error: string | null }`:

1. Запрос выполняется при монтировании и при каждом изменении `url`.
2. При смене `url` до завершения предыдущего запроса — устаревший ответ должен быть проигнорирован (защита от race condition).
3. Cleanup должен отменять запрос через `AbortController`.
4. Типизируй хук на TypeScript с generic-параметром `T`.

---

## 6. Решение с инсайтом

```typescript
import { useState, useEffect } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isCancelled = false; // дополнительная защита сверх AbortController

    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then(json => {
        if (!isCancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isCancelled || err.name === 'AbortError') return; // игнорируем отменённые запросы
        setError(err.message);
        setLoading(false);
      });

    // Cleanup: отменяет сетевой запрос и помечает результат как устаревший
    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [url]); // перезапуск строго при изменении url — примитив, стабильное сравнение

  return { data, loading, error };
}

// Использование
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error } = useFetch<User>(`/api/users/${userId}`);

  if (loading) return <Spinner />;
  if (error)   return <ErrorMessage message={error} />;
  if (!user)   return null;
  return <Profile user={user} />;
}

export default useFetch;
```

> **Инсайт:** Двойная защита (`isCancelled` флаг + `AbortController.abort()`) избыточна лишь на первый взгляд: `abort()` физически прерывает сетевой запрос (экономит трафик и нагрузку на сервер), а флаг `isCancelled` защищает от редкого случая, когда `.then`-цепочка успела запуститься до обработки отмены. Этот хук — типичный пример того, почему `useEffect` с зависимостью от `url` (примитив, а не объект) избегает бесконечного цикла эффекта, разобранного в Q5: если бы вместо строки передавался объект `{ url, options }`, пересозданный на каждом рендере родителя, эффект перезапускался бы постоянно.

---

*Раздел 10 — Хуки состояния и эффектов · Тема 33 из 43*
