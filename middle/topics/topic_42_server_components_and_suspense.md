# Контент курса — Тема 42: Server Components и Suspense в Next.js App Router

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 13 — Тема 42 (Server Components и Suspense)

---

# Тема 42 — Server Components и Suspense в Next.js App Router

← Предыдущая тема: [41 — Кастомные хуки и композиция логики](topic_41_custom_hooks.md)
→ Следующая тема: [43 — Правила хуков и антипаттерны](topic_43_hooks_rules_and_antipatterns.md)

---

## 1. Теория с аналогиями

**Аналогия: готовое блюдо из ресторана vs набор для приготовления дома**

Client Component — как набор для приготовления дома: тебе привозят сырые ингредиенты (JS-бандл) и рецепт, а готовку (рендеринг, интерактивность) ты делаешь сам, на своей "кухне" (в браузере). Server Component — как готовое блюдо из ресторана: вся готовка происходит на "кухне" ресторана (сервере), тебе привозят готовый результат (HTML), твоя "кухня" не нагружается вообще для этой части.

**Server Components — по умолчанию во всём Next.js App Router**

```typescript
// app/products/page.tsx — Server Component БЕЗ каких-либо директив (это дефолт!)
// Выполняется ТОЛЬКО на сервере, никогда не попадает в JS-бандл клиента
export default async function ProductsPage() {
  const products = await db.product.findMany(); // прямой доступ к базе данных (🔗 Тема 16)
  return (
    <ul>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </ul>
  );
}
```

```
Client Component:                        Server Component:
──────────────────                       ──────────────────
Рендерится в браузере                    Рендерится на сервере (Node.js)
Может использовать useState/useEffect    НЕ может использовать хуки состояния
JS-код попадает в бандл клиента          JS-код НЕ попадает в бандл клиента
Может обращаться к window/document       Не имеет доступа к browser API
Требует "use client" в начале файла      Дефолт — директива не нужна
Интерактивность (onClick и т.п.)         Не может иметь onClick/onChange
```

**`"use client"` — граница между двумя мирами**

```typescript
// app/components/LikeButton.tsx
'use client'; // ВСЁ в этом файле и всё, что он импортирует, — Client Component

import { useState } from 'react';

export function LikeButton() {
  const [liked, setLiked] = useState(false); // useState требует Client Component
  return <button onClick={() => setLiked(!liked)}>{liked ? '❤️' : '🤍'}</button>;
}
```

```typescript
// app/products/[id]/page.tsx — Server Component может РЕНДЕРИТЬ Client Component
import { LikeButton } from '@/components/LikeButton';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id); // fetch данных — на сервере
  return (
    <div>
      <h1>{product.name}</h1>
      <LikeButton /> {/* Server Component "встраивает" Client Component для интерактивности */}
    </div>
  );
}
```

**Правило передачи данных через границу — только сериализуемые пропсы**

```typescript
// ❌ Нельзя передать функцию/промис с методами из Server в Client Component как обычный проп
'use client';
function ClientChild({ onSave }: { onSave: () => void }) { /* ... */ }

// Server Component:
function ServerParent() {
  function handleSave() { /* серверная функция не может "переехать" в браузер */ }
  return <ClientChild onSave={handleSave} />; // ❌ Error: функции не сериализуемы через границу
}

// ✅ Исключение: Server Actions — специальные асинхронные функции с "use server" МОГУТ передаваться
async function saveAction(formData: FormData) {
  'use server';
  await db.save(formData);
}
function ServerParent() {
  return <ClientChild onSave={saveAction} />; // ✓ Server Action — особый случай, разрешён
}
```

**Suspense — декларативная граница ожидания асинхронных данных**

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div>
      <h1>Дашборд</h1>
      {/* Statistics рендерится независимо — пока данные грузятся, показывается fallback,
          остальная страница (заголовок) отображается СРАЗУ, не дожидаясь Statistics */}
      <Suspense fallback={<StatsSkeleton />}>
        <Statistics />
      </Suspense>
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>
    </div>
  );
}

async function Statistics() {
  const stats = await fetchStats(); // может занять 2 секунды
  return <StatsView stats={stats} />;
}

async function RevenueChart() {
  const data = await fetchRevenueData(); // может занять 500ms — не зависит от Statistics
  return <Chart data={data} />;
}
```

**Стриминг (streaming) — сервер отправляет HTML по частям, не дожидаясь ВСЕХ данных**

```
Без Suspense (традиционный SSR):          С Suspense (стриминг):
──────────────────────────────────         ──────────────────────────────
Сервер ждёт ВСЕ данные (Statistics         Сервер немедленно отправляет
+ RevenueChart) → рендерит ВСЮ             HTML с заголовком + skeleton'ами
страницу → отправляет ОДНИМ куском         → по мере готовности каждого
                                            Suspense-блока — дозаписывает
Время до первого байта = время             готовый HTML в поток
самого медленного запроса
                                            Пользователь видит контент
                                            постепенно, не ждёт самого
                                            медленного запроса для ВСЕЙ страницы
```

Это прямое практическое применение Fiber-архитектуры (🔗 Тема 30) и `use()` (🔗 Тема 40) — React умеет "приостанавливать" рендер поддерева на сервере, продолжая рендерить остальное, и позже "довставлять" готовый результат в HTML-поток через дополнительные `<script>`-теги, которые браузер использует для замены fallback на реальный контент.

**Комбинация: Server Component передаёт промис в Client Component через `use()`**

```typescript
// Server Component
export default function CommentsSection({ postId }: { postId: string }) {
  const commentsPromise = fetchComments(postId); // НЕ await — передаём промис как есть

  return (
    <Suspense fallback={<CommentsSkeleton />}>
      <CommentsList commentsPromise={commentsPromise} />
    </Suspense>
  );
}

// Client Component — читает промис через use() (🔗 Тема 40)
'use client';
function CommentsList({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise); // приостанавливает рендер до готовности
  return <ul>{comments.map(c => <li key={c.id}>{c.text}</li>)}</ul>;
}
```

---

## 2. Связь со стеком

**async/await в Server Components — прямое применение Темы 16**

Server Component может быть `async function` и использовать `await` прямо в теле — это работает, потому что рендер происходит в Node.js на сервере, а не в браузере, где `await` в теле компонента был бы недопустим (компонент вызывался бы синхронно при каждом рендере, 🔗 Тема 30).

**`loading.tsx` — файловая конвенция Next.js над Suspense**

```typescript
// app/dashboard/loading.tsx — автоматически оборачивает page.tsx в Suspense
export default function Loading() {
  return <DashboardSkeleton />;
}
```

Next.js App Router предоставляет файловые соглашения (`loading.tsx`, `error.tsx`, 🔗 Тема 25) как более высокоуровневую абстракцию над `Suspense`/Error Boundary — под капотом использующую те же React-примитивы.

**Промисы и Server Components — связь с Темой 15**

Передача необрезолвленного промиса от Server Component в Client Component — прямое использование механики Promise (три состояния: pending/fulfilled/rejected) в новом архитектурном контексте: React "ждёт" resolve на границе Suspense, а reject приводит к показу ближайшего Error Boundary.

---

## 3. Лучшие паттерны

**✅ Паттерн 1: Client Components — маленькие "листья" дерева, а не целые страницы**

```typescript
// ❌ Плохо: вся страница — Client Component из-за одной кнопки
'use client';
export default function ProductPage({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);
  return (
    <div>
      <h1>{product.name}</h1>       {/* не нуждается в клиентском JS */}
      <p>{product.description}</p>  {/* не нуждается в клиентском JS */}
      <button onClick={() => setLiked(!liked)}>❤️</button>
    </div>
  );
}

// ✅ Хорошо: Server Component + маленький Client Component только для интерактивной части
export default async function ProductPage({ params }: Props) {
  const product = await fetchProduct(params.id);
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <LikeButton productId={product.id} /> {/* только эта часть попадает в JS-бандл */}
    </div>
  );
}
```

*Почему best practice:* Каждый лишний Client Component увеличивает размер JS-бандла, отправляемого браузеру, и требует гидратации — минимизация "клиентской поверхности" ускоряет загрузку страницы.

**✅ Паттерн 2: Параллельные независимые Suspense-границы вместо одной большой**

```typescript
// ❌ Плохо: одна Suspense-граница ждёт САМЫЙ медленный из всех запросов
<Suspense fallback={<PageSkeleton />}>
  <Statistics />   {/* 2 секунды */}
  <RevenueChart /> {/* 500ms — но пользователь всё равно ждёт 2 секунды из-за Statistics */}
</Suspense>

// ✅ Хорошо: раздельные границы — каждый блок появляется, когда готов ОН, а не все сразу
<Suspense fallback={<StatsSkeleton />}><Statistics /></Suspense>
<Suspense fallback={<ChartSkeleton />}><RevenueChart /></Suspense>
```

*Почему:* Стриминг раскрывает весь потенциал только при мелкозернистых Suspense-границах — пользователь видит быстрые блоки немедленно, не дожидаясь медленных.

**✅ Паттерн 3: Передавать данные вниз через пропсы, а не наверх через Client → Server запросы за уже известными данными**

```typescript
// ❌ Плохо: Client Component сам фетчит данные, которые Server Component уже мог получить
'use client';
function ProductDetails({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  useEffect(() => { fetch(`/api/products/${productId}`).then(r => r.json()).then(setProduct); }, [productId]);
}

// ✅ Хорошо: Server Component получает данные один раз и передаёт как проп
export default async function Page({ params }: Props) {
  const product = await fetchProduct(params.id); // один сетевой запрос, на сервере
  return <ProductDetails product={product} />;   // без дополнительного клиентского round-trip
}
'use client';
function ProductDetails({ product }: { product: Product }) {
  return <div>{product.name}</div>; // просто отображение, без собственного fetch
}
```

*Почему:* Избегание "водопада" из клиентского запроса за данными, которые сервер уже мог собрать за один проход — классическая оптимизация производительности в архитектуре Server Components.

---

## 4. Вопросы интервью

**Q1: В чём принципиальная разница между Server Component и Client Component?**

Server Component рендерится только на сервере, его код никогда не попадает в JS-бандл браузера, не может использовать хуки состояния/эффектов и browser API. Client Component (помеченный `"use client"`) рендерится (и повторно рендерится) в браузере после гидратации, может использовать `useState`/`useEffect`/события — его код обязательно попадает в клиентский бандл.

**Q2: Может ли Server Component использовать `useState`?**

Нет — `useState`, как и любой другой хук состояния/эффекта, требует Client Component. Server Component рендерится один раз на сервере и не "живёт" после этого в браузере — состояние, которое меняется в ответ на взаимодействие пользователя, принципиально невозможно в компоненте, не имеющем клиентского жизненного цикла.

**Q3: Может ли Server Component рендерить Client Component, и наоборот?**

Server Component может свободно рендерить (импортировать и использовать) Client Component — это стандартный способ добавить "островок" интерактивности на в остальном статическую страницу. Обратное — Client Component не может напрямую импортировать и рендерить async Server Component; данные от Server Component в Client Component передаются как готовые пропсы (сериализуемые значения) или как промисы для `use()`.

**Q4: Что можно и что нельзя передавать как проп из Server Component в Client Component?**

Можно передавать сериализуемые значения (строки, числа, объекты, массивы, JSX-элементы, промисы для `use()`) и Server Actions (специальные асинхронные функции с директивой `"use server"`). Нельзя передавать обычные функции, классы, замыкания над несериализуемыми объектами — граница между сервером и клиентом требует сериализации данных.

**Q5: Что такое Suspense и какую проблему он решает в контексте асинхронного рендеринга?**

Компонент-обёртка, позволяющий декларативно указать fallback-контент, показываемый до тех пор, пока обёрнутое поддерево (содержащее асинхронную операцию — `await` в Server Component или `use()` промиса) не готово к отображению. Решает проблему "всё или ничего" в традиционном SSR — позволяет показывать части страницы независимо, по мере готовности их данных.

**Q6: Что такое стриминг HTML и как он связан с Suspense?**

Механизм, при котором сервер отправляет браузеру HTML частями по мере готовности, а не ждёт полной готовности всей страницы. Suspense-границы определяют, какие части страницы могут "задержаться" — сервер сначала отправляет разметку с fallback'ами для этих частей, а затем дополнительными фрагментами дозаполняет реальный контент по готовности, без перезагрузки страницы.

**Q7: Почему рекомендуется делать Client Components маленькими и "листовыми" в дереве компонентов?**

Каждый Client Component увеличивает размер JavaScript-бандла, который браузер должен загрузить и выполнить для гидратации (🔗 Тема 30 — комментарий о гидратации). Чем меньше кода помечено `"use client"`, тем меньше JS отправляется клиенту — Server Component-контент (статический текст, разметка без интерактивности) не требует гидратации вообще.

**Q8: Как несколько независимых Suspense-границ на одной странице влияют на восприятие производительности?**

Каждая граница независимо переключается с fallback на реальный контент по готовности своих данных — пользователь видит быстрые части страницы немедленно, не дожидаясь самой медленной операции. Без раздельных границ (одна общая Suspense) вся страница ждёт самый медленный запрос, что ухудшает воспринимаемую скорость загрузки.

**Q9: Что произойдёт, если асинхронный Server Component внутри Suspense выбросит ошибку?**

Ошибка будет перехвачена ближайшей границей Error Boundary выше по дереву (в Next.js App Router — файлом `error.tsx`, 🔗 Тема 25), а не самой Suspense-границей — Suspense обрабатывает только состояние "ожидания", а не ошибки; для ошибок нужен отдельный, но часто соседствующий механизм.

**Q10: Как файловые конвенции Next.js (`loading.tsx`, `error.tsx`) соотносятся с React-примитивами Suspense и Error Boundary?**

Это более высокоуровневая абстракция фреймворка: Next.js автоматически оборачивает содержимое сегмента маршрута в `<Suspense fallback={<Loading />}>` и в Error Boundary с соответствующим `error.tsx`, освобождая разработчика от необходимости писать эти обёртки вручную для каждой страницы — под капотом используются те же React-механизмы.

---

## 5. Практическое задание

Спроектируй (в виде кода с комментариями, без необходимости реального backend) страницу `app/dashboard/page.tsx` в Next.js App Router:

1. Server Component `DashboardPage`, синхронно рендерящий заголовок и навигацию.
2. Два независимых блока данных (`RecentOrders`, `RevenueSummary`) — каждый в своей `Suspense`-границе с отдельным skeleton, с разной искусственной задержкой (`await delay(...)`), демонстрирующей независимое появление блоков.
3. Один маленький Client Component `RefreshButton`, вызывающий `router.refresh()`.
4. Прокомментируй, какие части попадают в клиентский JS-бандл, а какие — нет.

---

## 6. Решение с инсайтом

```typescript
// app/dashboard/page.tsx — Server Component (без "use client", это дефолт)
import { Suspense } from 'react';
import { RefreshButton } from './RefreshButton';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Server Component, а не Client — весь код этой функции остаётся на сервере,
// НЕ попадает в JS-бандл браузера
async function RecentOrders() {
  await delay(1000); // имитация запроса к БД — 1 секунда
  const orders = [{ id: '1', total: 1500 }, { id: '2', total: 2300 }];
  return (
    <ul>
      {orders.map(o => <li key={o.id}>Заказ #{o.id} — {o.total}₴</li>)}
    </ul>
  );
}

async function RevenueSummary() {
  await delay(2500); // имитация более медленного агрегирующего запроса — 2.5 секунды
  const revenue = 145000;
  return <p>Выручка за месяц: {revenue}₴</p>;
}

// Основной Server Component страницы
export default function DashboardPage() {
  return (
    <div>
      <header>
        <h1>Дашборд</h1>
        <RefreshButton /> {/* единственная интерактивная часть страницы */}
      </header>

      {/* Появится через ~1 секунду — не ждёт RevenueSummary */}
      <Suspense fallback={<p>Загрузка заказов...</p>}>
        <RecentOrders />
      </Suspense>

      {/* Появится через ~2.5 секунды, но заголовок и RecentOrders пользователь уже видит */}
      <Suspense fallback={<p>Загрузка выручки...</p>}>
        <RevenueSummary />
      </Suspense>
    </div>
  );
}
```

```typescript
// app/dashboard/RefreshButton.tsx — единственный Client Component во всей странице
'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react'; // 🔗 Тема 38 — transition для навигации без "заморозки" UI

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh(); // повторный запрос Server Components этой страницы без полной перезагрузки
    });
  }

  return (
    <button onClick={handleRefresh} disabled={isPending}>
      {isPending ? 'Обновление...' : 'Обновить'}
    </button>
  );
}
```

> **Инсайт:** В клиентский JS-бандл попадает только код `RefreshButton.tsx` (маленький файл с одним хуком) — весь остальной код (`DashboardPage`, `RecentOrders`, `RevenueSummary`, включая функцию `delay` и захардкоженные данные) выполняется исключительно на сервере и никогда не отправляется браузеру. Раздельные `Suspense`-границы для `RecentOrders` и `RevenueSummary` демонстрируют главное преимущество стриминга: разница в задержке (1с vs 2.5с) напрямую отражается в том, когда каждый блок появляется на экране — независимо друг от друга, а не одновременно после самого медленного запроса.

---

*Раздел 13 — Композиция и архитектура React · Тема 42 из 43*
