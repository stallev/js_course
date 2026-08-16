# Контент курса — Тема 34: useLayoutEffect и useInsertionEffect

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 10 — Тема 34 (useLayoutEffect и useInsertionEffect)

---

# Тема 34 — useLayoutEffect и useInsertionEffect

← Предыдущая тема: [33 — useEffect](topic_33_useeffect.md)
→ Следующая тема: [35 — useMemo, useCallback и React.memo](topic_35_usememo_usecallback_memo.md)

---

## 1. Теория с аналогиями

**Аналогия: разница между "после ужина" и "прямо перед тем, как гости увидят стол"**

`useEffect` — как уборка "после того как гости уже разошлись и посмотрели на неубранный стол" (браузер уже показал кадр пользователю, эффект выполняется асинхронно после). `useLayoutEffect` — как поправить скатерть **до того**, как гости вошли в комнату: синхронно, до того как браузер отрисовал изменения на экране. Если нужно измерить или подправить DOM так, чтобы пользователь не увидел промежуточное "неправильное" состояние — нужен `useLayoutEffect`.

**Порядок выполнения — ключевое отличие**

```
Render-фаза (вычисление JSX)
        │
        ▼
Commit-фаза: React применяет изменения к реальному DOM
        │
        ▼
useLayoutEffect выполняется СИНХРОННО, ДО того как браузер отрисует кадр на экране
        │ (может снова изменить DOM — браузер ещё не показал предыдущую версию)
        ▼
Браузер отрисовывает кадр (paint)
        │
        ▼
useEffect выполняется АСИНХРОННО, после того как кадр уже показан пользователю
```

```typescript
// useEffect: пользователь может увидеть "мигание" — сначала box в неправильном месте,
// затем (после отрисовки) — скачок в правильное
useEffect(() => {
  const rect = boxRef.current!.getBoundingClientRect();
  setPosition({ top: rect.top - 50 }); // может вызвать заметный "прыжок"
}, []);

// useLayoutEffect: измерение и правка происходят ДО показа кадра — мигания не видно
useLayoutEffect(() => {
  const rect = boxRef.current!.getBoundingClientRect();
  setPosition({ top: rect.top - 50 });
}, []);
```

**Когда нужен именно `useLayoutEffect`**

```
Нужен useLayoutEffect:                    Достаточно useEffect:
────────────────────────                  ──────────────────────
Измерение DOM-элемента                    Запросы к API
(getBoundingClientRect) и                 Подписки на события
немедленная правка стиля/позиции          Логирование, аналитика
на основе измерения                       Синхронизация с localStorage
                                           Таймеры
Позиционирование tooltip/                 Любой эффект, где визуальное
popover относительно target-             "мигание" на 1 кадр не критично
элемента без "прыжка"
```

**Цена `useLayoutEffect` — блокировка отрисовки**

Поскольку `useLayoutEffect` выполняется синхронно до paint, он **блокирует** показ кадра браузером до своего завершения. Тяжёлые вычисления внутри `useLayoutEffect` напрямую увеличивают время до следующего кадра — нарушают "бюджет 16ms" (🔗 Тема 1). Используется только когда без синхронного измерения/правки DOM пользователь увидит визуальный артефакт.

**`useInsertionEffect` — самый редкий хук, только для CSS-in-JS библиотек**

```typescript
// Практически никогда не используется напрямую в прикладном коде —
// предназначен для авторов библиотек типа styled-components, Emotion
useInsertionEffect(() => {
  const styleTag = document.createElement('style');
  styleTag.textContent = generatedCSS;
  document.head.appendChild(styleTag);
  return () => styleTag.remove();
}, [generatedCSS]);
```

```
Порядок выполнения эффектов при коммите:
useInsertionEffect  →  до любых мутаций DOM React'ом (вставка <style> раньше всего)
useLayoutEffect     →  после мутаций DOM, до paint
useEffect           →  после paint
```

Смысл `useInsertionEffect`: CSS-in-JS библиотекам нужно вставить `<style>`-теги **до** того, как `useLayoutEffect` других компонентов начнёт измерять layout — иначе измерения могут быть основаны на ещё не применённых стилях.

---

## 2. Связь со стеком

**React DevTools warning: "useLayoutEffect does nothing on the server"**

`useLayoutEffect` не выполняется во время серверного рендеринга (SSR) — на сервере нет DOM для измерения. Next.js App Router выводит warning при использовании `useLayoutEffect` в Server Components (и такой хук там в принципе недопустим — только в Client Components, как и все хуки).

```typescript
'use client'; // обязательно — useLayoutEffect работает только на клиенте после гидратации
function Tooltip({ targetRef }: { targetRef: React.RefObject<HTMLElement> }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useLayoutEffect(() => {
    const rect = targetRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom, left: rect.left });
  }, [targetRef]);
  return <div style={position} className="tooltip">...</div>;
}
```

**Библиотеки позиционирования (Popper.js/Floating UI) используют именно `useLayoutEffect`** внутри, чтобы избежать "прыжка" tooltip/dropdown при открытии — прямое практическое применение темы.

---

## 3. Лучшие паттерны

**✅ Паттерн 1: `useEffect` по умолчанию, `useLayoutEffect` — только при видимом мигании**

```typescript
// Правило принятия решения: начни с useEffect. Переключайся на useLayoutEffect
// только если увидел визуальный артефакт (мигание/прыжок), который не устраивает.

// ❌ Плохо: useLayoutEffect "на всякий случай" — блокирует отрисовку без необходимости
useLayoutEffect(() => {
  sendAnalytics('page_view'); // не влияет на визуал — не требует синхронности
}, []);

// ✅ Хорошо: useEffect для всего, что не связано с измерением/правкой layout
useEffect(() => {
  sendAnalytics('page_view');
}, []);
```

*Почему best practice:* `useLayoutEffect` — инструмент для конкретной узкой проблемы (визуальные артефакты измерения), а не "более надёжная версия `useEffect`". Излишнее использование ухудшает производительность без пользы.

**✅ Паттерн 2: Минимизировать работу внутри `useLayoutEffect`**

```typescript
// ❌ Плохо: тяжёлые вычисления внутри синхронного эффекта — блокируют кадр
useLayoutEffect(() => {
  const result = heavyLayoutCalculation(items); // тяжело и синхронно
  setLayout(result);
}, [items]);

// ✅ Хорошо: измерение — минимальное, тяжёлые вычисления — вне layout-эффекта
useLayoutEffect(() => {
  const rect = ref.current!.getBoundingClientRect(); // дешёвая операция измерения
  setPosition({ top: rect.top });
}, []);
```

*Почему:* Каждая миллисекунда внутри `useLayoutEffect` — прямая задержка перед показом кадра пользователю.

**✅ Паттерн 3: `useInsertionEffect` — не использовать в прикладном коде, только в библиотеках**

```typescript
// ❌ Плохо: применение useInsertionEffect в обычном компоненте приложения
useInsertionEffect(() => {
  injectStyles(css); // избыточная сложность для типовой задачи
}, [css]);

// ✅ Хорошо: для инъекции стилей в прикладном коде — обычный CSS/CSS Modules/Tailwind,
// а не runtime-генерация через хук
import styles from './Card.module.css';
function Card() { return <div className={styles.card} />; }
```

*Почему:* `useInsertionEffect` решает узкую задачу авторов CSS-in-JS runtime-библиотек (порядок вставки стилей относительно layout-эффектов) — в прикладном коде такая проблема практически не возникает.

---

## 4. Вопросы интервью

**Q1: В чём разница `useEffect` и `useLayoutEffect`?**

`useEffect` выполняется асинхронно, после того как браузер уже отрисовал кадр на экране — пользователь может на долю секунды увидеть промежуточное состояние. `useLayoutEffect` выполняется синхронно, сразу после того как React обновил DOM, но до того как браузер показал изменения — блокирует отрисовку до своего завершения, гарантируя отсутствие визуального мигания.

**Q2: Когда нужно использовать `useLayoutEffect` вместо `useEffect`?**

Когда эффект измеряет геометрию DOM-элемента (`getBoundingClientRect`) и немедленно вносит визуальную правку на основе этого измерения (позиционирование tooltip, автоскролл, синхронизация высоты элементов) — без синхронности пользователь увидел бы заметный "прыжок" контента.

**Q3: Почему `useLayoutEffect` считается более "дорогим" с точки зрения производительности?**

Он блокирует показ следующего кадра браузером до своего завершения — любая задержка внутри `useLayoutEffect` прямо увеличивает время до paint. `useEffect`, напротив, не блокирует отрисовку — браузер показывает кадр немедленно, а эффект выполняется позже, асинхронно.

**Q4: Работает ли `useLayoutEffect` при серверном рендеринге (SSR)?**

Нет — на сервере отсутствует DOM для измерения, поэтому `useLayoutEffect` не выполняется во время SSR (в отличие от рендера самого компонента). React выводит предупреждение при попытке использовать его в контексте, не имеющем доступа к браузерному DOM.

**Q5: Что делает `useInsertionEffect` и для кого он предназначен?**

Хук, выполняющийся раньше `useLayoutEffect`, специально до того, как React вносит мутации в DOM для layout-эффектов. Предназначен исключительно для авторов CSS-in-JS библиотек (styled-components, Emotion), которым нужно вставить `<style>`-теги в документ до того, как другие компоненты начнут измерять layout — иначе измерения были бы основаны на неполных стилях.

**Q6: Каков полный порядок выполнения трёх эффектов при коммите изменений?**

`useInsertionEffect` → мутации DOM React'ом → `useLayoutEffect` (синхронно, до paint) → браузер отрисовывает кадр → `useEffect` (асинхронно, после paint).

**Q7: Может ли обычный прикладной код React-приложения использовать `useInsertionEffect`?**

Технически может, но практически никогда не нужен — решает узкую инфраструктурную задачу порядка вставки стилей. Официальная документация React прямо указывает, что этот хук предназначен для библиотек, а не для прикладного кода.

**Q8: Что произойдёт, если внутри `useLayoutEffect` вызвать `setState`?**

React синхронно применит обновление и повторно вычислит DOM ещё раз перед тем, как браузер покажет кадр — то есть можно "поправить" layout несколько раз без визуального мигания промежуточных состояний. Это ровно тот механизм, который используют библиотеки автопозиционирования.

**Q9: Почему нельзя просто "всегда использовать `useLayoutEffect` для надёжности"?**

Он всегда синхронный и блокирующий — использование его везде вместо `useEffect` приводит к неоправданному замедлению рендеринга интерфейса без какой-либо визуальной выгоды для эффектов, не связанных с измерением layout (запросы, подписки, аналитика прекрасно работают асинхронно).

**Q10: Как связаны `useLayoutEffect` и Fiber/commit-фаза (🔗 Тема 30)?**

`useLayoutEffect` вызывается синхронно как часть той же commit-фазы, что и применение изменений в DOM — до того как управление передаётся браузеру для paint. `useEffect`, напротив, планируется как отдельная, асинхронная задача после того, как commit-фаза полностью завершена и кадр показан.

---

## 5. Практическое задание

Реализуй хук `useMeasure<T extends HTMLElement>()`, возвращающий `[ref, { width, height }]`:

1. При монтировании и при каждом изменении размера DOM-элемента (через `ResizeObserver`) хук должен обновлять измеренные `width`/`height`.
2. Используй `useLayoutEffect` для первого измерения — чтобы избежать "прыжка" при первом рендере (изначально `width`/`height` равны 0).
3. Cleanup должен отписывать `ResizeObserver`.

---

## 6. Решение с инсайтом

```typescript
import { useLayoutEffect, useRef, useState, useCallback } from 'react';

interface Size {
  width: number;
  height: number;
}

function useMeasure<T extends HTMLElement>(): [React.RefCallback<T>, Size] {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const elementRef = useRef<T | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  // ref как callback — гарантированно вызывается при появлении/удалении DOM-узла
  const setRef = useCallback((element: T | null) => {
    observerRef.current?.disconnect();
    elementRef.current = element;

    if (element) {
      observerRef.current = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry) {
          setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
      });
      observerRef.current.observe(element);
    }
  }, []);

  // useLayoutEffect — первое измерение синхронно, до paint, без визуального "0 → реальный размер"
  useLayoutEffect(() => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    }
    return () => observerRef.current?.disconnect(); // cleanup при размонтировании
  }, []);

  return [setRef, size];
}

// Использование
function ResizableCard() {
  const [ref, { width, height }] = useMeasure<HTMLDivElement>();
  return (
    <div ref={ref} className="card">
      Размер: {Math.round(width)} × {Math.round(height)}
    </div>
  );
}

export default useMeasure;
```

> **Инсайт:** Первое измерение вынесено в `useLayoutEffect`, а не `useEffect` — если бы измерение произошло асинхронно после paint, пользователь на долю секунды увидел бы "0 × 0" перед реальным размером (тот самый визуальный артефакт из теории). Все последующие обновления размера идут через `ResizeObserver` — асинхронный callback браузера, не требующий синхронности React-эффекта, поэтому находится вне `useLayoutEffect`. `ref` как функция (callback ref), а не объект из `useRef`, — приём, который подробно разбирается в Теме 36.

---

*Раздел 10 — Хуки состояния и эффектов · Тема 34 из 43*
