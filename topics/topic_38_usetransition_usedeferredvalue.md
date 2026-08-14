# Контент курса — Тема 38: useTransition и useDeferredValue

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 12 — Тема 38 (useTransition, useDeferredValue)

---

# Тема 38 — useTransition и useDeferredValue

← Предыдущая тема: [37 — useContext](topic_37_usecontext.md)
→ Следующая тема: [39 — useId, useDebugValue, useSyncExternalStore](topic_39_useid_usedebugvalue_usesyncexternalstore.md)

---

## 1. Теория с аналогиями

**Аналогия: приоритетная очередь в приёмном покое**

В больничном приёмном покое пациента с ножевым ранением примут раньше пациента с насморком, даже если насморк пришёл первым — есть приоритеты. До React 18 все обновления state обрабатывались "в порядке живой очереди", без приоритетов: если запущен долгий рендер большого списка, ввод в поле поиска "зависал" до его завершения. `useTransition`/`useDeferredValue` дают React возможность помечать обновления как "низкоприоритетные" — их можно прервать в любой момент, чтобы немедленно обработать более срочное (например, ввод символа).

**Проблема, которую решают эти хуки**

```typescript
// ❌ Без транзиций: набор текста "тормозит", потому что рендер filteredList блокирует ввод
function SearchPage() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => bigList.filter(item => item.includes(query)), [query]);
  // Каждое нажатие клавиши → setQuery → синхронный ре-рендер ВСЕГО filtered (может быть тяжёлым)
  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <List items={filtered} /> {/* тяжёлый рендер блокирует следующий кадр ввода */}
    </>
  );
}
```

**`useTransition` — явно помечаем обновление как низкоприоритетное**

```typescript
function SearchPage() {
  const [query, setQuery] = useState('');           // высокий приоритет — сам текст поля
  const [filtered, setFiltered] = useState(bigList);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value); // немедленно — поле ввода отзывчиво, никогда не "тормозит"
    startTransition(() => {
      setFiltered(bigList.filter(item => item.includes(e.target.value))); // может быть прервано
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <span>Обновление списка...</span>} {/* индикатор "в процессе" */}
      <List items={filtered} />
    </>
  );
}
```

**Схема: как React расставляет приоритеты**

```
Пользователь печатает "a", "b", "c" быстро подряд
        │
        ▼
setQuery('a')  → высокий приоритет → рендер немедленно → поле показывает "a"
startTransition(() => setFiltered(...)) → низкий приоритет → начат рендер списка для "a"
        │
        ▼ (пользователь уже нажал "b" пока список для "a" ещё рендерился)
setQuery('ab') → высокий приоритет → ПРЕРЫВАЕТ недорендеренный список для "a"
startTransition(() => setFiltered(...)) → новая низкоприоритетная задача для "ab"
        │
        ▼
Итог: поле ввода всегда мгновенно отзывчиво,
      список "догоняет" актуальный запрос, пропуская промежуточные состояния
```

Это возможно только благодаря архитектуре Fiber (🔗 Тема 30) — рендер единиц работы можно приостанавливать и выбрасывать незавершённую работу.

**`useDeferredValue` — та же идея, но без явного действия, через "отложенное" значение**

```typescript
function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query); // "запаздывающая" копия query

  // filtered пересчитывается на основе deferredQuery — с задержкой относительно query
  const filtered = useMemo(
    () => bigList.filter(item => item.includes(deferredQuery)),
    [deferredQuery]
  );

  const isStale = query !== deferredQuery; // deferredQuery ещё не догнал актуальный query

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        <List items={filtered} />
      </div>
    </>
  );
}
```

**`useTransition` vs `useDeferredValue` — когда что**

```
useTransition:                          useDeferredValue:
──────────────────────                  ──────────────────────
Есть явное "действие" (setState),        Есть значение (проп/state),
которое нужно отложить                   которое приходит СНАРУЖИ
                                          (например, из родителя),
Контролируешь код, который               и его нельзя обернуть в
запускает обновление                     startTransition напрямую

Даёт isPending — булев флаг              Даёт "запаздывающую" версию
"выполняется отложенная работа"          значения для сравнения
                                          с актуальным (isStale)
```

**Чем это отличается от debounce/throttle (🔗 Тема 8)**

```
Debounce:                                 useTransition/useDeferredValue:
─────────────────────────                 ──────────────────────────────────
Искусственная задержка ПО ВРЕМЕНИ         Приоритизация РАБОТЫ, не времени
(например, 300ms после последнего         React рендерит низкоприоритетную
нажатия) — обновление списка              задачу СРАЗУ, но прерывает её,
задерживается фиксированно                если появляется более срочная

Требует настройки задержки                Не требует настройки — React сам
(слишком мало — не помогает,              решает, когда прерывать,
слишком много — UI "залипает")            на основе фактической нагрузки
```

Debounce откладывает *запуск* обновления; `useTransition` позволяет обновлению *начаться немедленно*, но не блокировать более приоритетную работу — принципиально другой механизм, более отзывчивый в реальном использовании.

---

## 2. Связь со стеком

**React 18 — конкурентный рендеринг как фундамент**

Оба хука существуют только благодаря конкурентному рендерингу, введённому в React 18 на базе Fiber (🔗 Тема 30) — способности React приостанавливать, прерывать и перезапускать рендер. До React 18 (legacy-режим) `useTransition`/`useDeferredValue` не имеют эффекта — весь рендер всегда синхронный.

**Next.js: `useTransition` для навигации без "заморозки" UI**

```typescript
'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(() => {
      router.push(href); // навигация помечена как низкоприоритетная — текущий UI не "замирает"
    });
  }

  return (
    <a onClick={handleClick} style={{ opacity: isPending ? 0.5 : 1 }}>
      {children}
    </a>
  );
}
```

**`useActionState` (React 19, 🔗 Тема 40) использует ту же машинерию transitions** для Server Actions — `isPending` там устроен по тому же принципу, что `isPending` из `useTransition`.

---

## 3. Лучшие паттерны

**✅ Паттерн 1: `startTransition` только для обновлений, вызывающих тяжёлый рендер**

```typescript
// ❌ Плохо: transition для дешёвого обновления — не даёт выгоды, только оверхед
startTransition(() => setIsModalOpen(true)); // открытие модалки — мгновенное действие

// ✅ Хорошо: transition для реально дорогого пересчёта/рендера
startTransition(() => setFilteredBigList(filterExpensive(query)));
```

*Почему best practice:* Как и мемоизация (🔗 Тема 35), `useTransition` не бесплатен — используется целенаправленно там, где есть измеримая проблема отзывчивости, а не "на всякий случай" для любого `setState`.

**✅ Паттерн 2: `isPending` — для UX-индикации, а не для блокировки взаимодействия**

```typescript
// ❌ Плохо: блокировка ввода на время isPending противоречит смыслу transition
<input value={query} onChange={handleChange} disabled={isPending} />

// ✅ Хорошо: visual feedback без блокировки — пользователь продолжает печатать
<input value={query} onChange={handleChange} />
{isPending && <Spinner size="small" />}
```

*Почему:* Вся ценность `useTransition` — в том, что срочные обновления (ввод) остаются отзывчивыми во время выполнения низкоприоритетной работы; блокировка поля ввода убивает смысл использования хука.

**✅ Паттерн 3: `useDeferredValue` с ключом для сброса "устаревшего" контента при значительных изменениях**

```typescript
function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  return (
    // key заставляет React считать это новым поддеревом при существенном изменении —
    // полезно комбинировать с Suspense (🔗 Тема 42) для явного skeleton вместо "устаревшего" контента
    <ResultsList key={deferredQuery} query={deferredQuery} />
  );
}
```

*Почему:* В сочетании с `Suspense` `useDeferredValue` + `key` даёт официально рекомендованный React-паттерн "показать старый результат, пока грузится новый, но явно обозначить это визуально".

---

## 4. Вопросы интервью

**Q1: Зачем нужны `useTransition` и `useDeferredValue`, если есть обычный `setState`?**

Обычный `setState` в React 18+ обрабатывается с обычным (высоким) приоритетом — если он вызывает тяжёлый рендер, это может задержать более срочные обновления (например, следующий символ в поле ввода). `useTransition`/`useDeferredValue` явно помечают обновление как низкоприоритетное, которое React может прервать, если появляется более срочная задача.

**Q2: В чём разница `useTransition` и `useDeferredValue`?**

`useTransition` оборачивает *действие* (`startTransition(() => setState(...))`) и даёт флаг `isPending`. `useDeferredValue` оборачивает *значение* (входящий проп или state) и возвращает его "запаздывающую" копию — используется, когда нет прямого контроля над вызовом `setState` (например, значение приходит как проп от родителя).

**Q3: Как отличить `useTransition`/`useDeferredValue` от debounce?**

Debounce откладывает сам момент запуска обновления по фиксированному таймеру, независимо от нагрузки. `useTransition`/`useDeferredValue` не откладывают запуск — React начинает низкоприоритетную работу немедленно, но готов прервать её в любой момент, если появляется более приоритетное обновление — механизм основан на приоритизации работы, а не на времени.

**Q4: Что означает `isPending` в `useTransition`?**

Булев флаг, `true`, когда запланированная через `startTransition` низкоприоритетная работа ещё выполняется (не завершена). Используется для визуальной индикации ("список обновляется"), не для блокировки интерфейса.

**Q5: Может ли обновление внутри `startTransition` быть прервано?**

Да — если во время рендеринга низкоприоритетного обновления происходит более срочное обновление (обычный `setState`, не в transition), React приостанавливает/выбрасывает недорендеренную работу transition'а и сначала обрабатывает срочное обновление, а затем начинает transition заново с актуальными данными.

**Q6: Почему `useTransition`/`useDeferredValue` работают только благодаря архитектуре Fiber?**

Приоритизация и прерывание рендера возможны только потому, что реконсиляция (🔗 Тема 30) представлена как последовательность прерываемых единиц работы (Fiber-узлов), а не как единый неразрываемый рекурсивный вызов. Без Fiber не было бы технической возможности "выбросить" уже начатый, но не завершённый рендер.

**Q7: Что произойдёт, если обернуть `setState`, вызывающий изменение значения самого поля ввода (`value` контролируемого input), в `startTransition`?**

Ввод в поле станет заметно менее отзывчивым — сам текст в поле будет обновляться с задержкой, потому что transition намеренно даёт этому обновлению низкий приоритет. Правило: обновление, отражающее прямой ввод пользователя (то, что он должен видеть немедленно), должно оставаться обычным `setState`, а не оборачиваться в transition.

**Q8: Для чего используется `key` в паттерне с `useDeferredValue`?**

Чтобы форсировать React считать поддерево полностью новым при существенном изменении отложенного значения, что в комбинации с `Suspense` (🔗 Тема 42) даёт эффект "показать явный skeleton загрузки вместо устаревшего контента" вместо стандартного поведения "показывать устаревший контент до готовности нового".

**Q9: В каком режиме React (legacy или конкурентный) `useTransition` не даёт эффекта?**

В legacy-режиме (рендеринг через старый `ReactDOM.render`, без `createRoot`) — там весь рендеринг всегда синхронный и непрерываемый, поэтому `useTransition` технически работает, но не даёт выигрыша в отзывчивости, так как нет механизма прерывания рендера.

**Q10: Даёт ли `useTransition` возможность отменить асинхронный запрос (fetch)?**

Нет напрямую — `useTransition` управляет приоритетом *рендеринга* React, а не сетевыми запросами. Для отмены сетевых запросов используется `AbortController` (🔗 Тема 33); однако оба механизма часто применяются совместно: transition для приоритизации рендера результата, `AbortController` для отмены устаревшего запроса.

---

## 5. Практическое задание

Реализуй компонент `FilterableList`, отображающий фильтруемый список из 5000 элементов:

1. Поле ввода для фильтра должно оставаться мгновенно отзывчивым даже при "тяжёлой" фильтрации (искусственно замедли рендер каждого элемента списка).
2. Используй `useTransition` для обёртывания обновления отфильтрованного списка.
3. Покажи индикатор `isPending` без блокировки поля ввода.
4. Сравни (в комментарии) поведение с версией без `useTransition`.

---

## 6. Решение с инсайтом

```typescript
import { useState, useTransition, useMemo } from 'react';

interface Item {
  id: string;
  name: string;
}

function generateItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: String(i), name: `Товар ${i}` }));
}

const ALL_ITEMS = generateItems(5000);

function ExpensiveRow({ item }: { item: Item }) {
  // Искусственная "тяжесть" рендера каждой строки — демонстрация проблемы
  let dummy = 0;
  for (let i = 0; i < 1000; i++) dummy += i;
  return <li>{item.name}{dummy === -1 ? '' : ''}</li>;
}

function FilterableList() {
  const [query, setQuery] = useState('');           // высокий приоритет — сам текст
  const [filteredItems, setFilteredItems] = useState(ALL_ITEMS);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value); // немедленно — поле ввода никогда не "тормозит"

    startTransition(() => {
      // Тяжёлая операция (фильтрация 5000 элементов + тяжёлый рендер каждой строки)
      // помечена как низкоприоритетная — может быть прервана следующим нажатием клавиши
      setFilteredItems(ALL_ITEMS.filter(item => item.name.includes(value)));
    });
  }

  return (
    <div>
      <input
        value={query}
        onChange={handleChange}
        placeholder="Поиск по 5000 товарам..."
      />
      {isPending && <span className="pending-indicator"> Обновление списка...</span>}
      <ul style={{ opacity: isPending ? 0.6 : 1 }}>
        {filteredItems.slice(0, 50).map(item => (
          <ExpensiveRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

export default FilterableList;

// Без useTransition: setFilteredItems(...) выполнялся бы с обычным приоритетом —
// каждое нажатие клавиши блокировало бы поле ввода на время рендера 5000 тяжёлых ExpensiveRow,
// пока React не закончит текущий (уже устаревший) рендер — заметные "лаги" при быстром наборе.
```

> **Инсайт:** `isPending` управляет только визуальной прозрачностью списка — само поле `input` никогда не оборачивается в transition и не блокируется, что и есть весь смысл паттерна: пользователь печатает без единой задержки, а список "догоняет" в фоне, пропуская промежуточные, уже неактуальные состояния фильтрации (например, если пользователь быстро напечатал 5 символов, React отрендерит фильтрацию только по итоговому запросу, а не по каждому промежуточному).

---

*Раздел 12 — Конкурентные и специализированные хуки · Тема 38 из 43*
