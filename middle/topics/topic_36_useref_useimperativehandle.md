# Контент курса — Тема 36: useRef и useImperativeHandle

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 11 — Тема 36 (useRef, useImperativeHandle)

---

# Тема 36 — useRef и useImperativeHandle

← Предыдущая тема: [35 — useMemo, useCallback и React.memo](topic_35_usememo_usecallback_memo.md)
→ Следующая тема: [37 — useContext](topic_37_usecontext.md)

---

## 1. Теория с аналогиями

**Аналогия: блокнот на холодильнике**

`useState` — как доска с меловым объявлением: изменил запись — все, кто смотрит на доску (компонент), сразу видят новое объявление (ре-рендер). `useRef` — как блокнот в кармане: ты можешь писать в нём заметки когда угодно, но никто автоматически не узнает об изменении, пока ты сам не покажешь блокнот. `useRef` хранит мутируемое значение, которое **переживает рендеры**, но изменение которого **не вызывает ре-рендер**.

**Два основных применения `useRef`**

```typescript
// 1. Ссылка на DOM-узел — самое частое применение
function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus(); // прямой доступ к DOM API, минуя React
  }, []);

  return <input ref={inputRef} />;
}

// 2. Хранение мутируемого значения без ре-рендера
function Timer() {
  const intervalIdRef = useRef<number | null>(null); // не влияет на визуал — не нужен ре-рендер
  const [seconds, setSeconds] = useState(0);

  function start() {
    intervalIdRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  }
  function stop() {
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
  }
}
```

**Почему `useRef`, а не обычная переменная в теле компонента**

```typescript
// ❌ Обычная переменная — создаётся заново на каждом рендере, "забывает" значение
function Bad() {
  let renderCount = 0;
  renderCount++; // всегда 1 после инкремента — переменная не переживает рендер
  return <div>{renderCount}</div>;
}

// ✅ useRef — та же "ячейка" в Fiber-узле, что и useState (🔗 Тема 31),
// но изменение .current НЕ планирует ре-рендер
function Good() {
  const renderCountRef = useRef(0);
  renderCountRef.current++; // корректно накапливается между рендерами
  return <div>{renderCountRef.current}</div>;
}
```

**Ключевое отличие от `useState` — таблица**

```
                      useState              useRef
─────────────────────────────────────────────────────────
Хранит значение       да                     да
между рендерами

Изменение вызывает    да (setState               нет (мутация .current
ре-рендер             планирует рендер)          напрямую, тихо)

Доступ к значению     через переменную из       через .current —
                       деструктуризации           всегда актуальное
                       (может быть "устаревшим"   значение даже внутри
                       в замыкании, 🔗 Тема 3)     старого замыкания
```

**`useRef` как "живая ссылка" для избежания stale closure**

```typescript
// Проблема: count в замыкании интервала "заморожен" (🔗 Тема 33)
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000); // всегда видит старое count
  return () => clearInterval(id);
}, []);

// Решение через ref: .current мутируется синхронно, замыкание всегда видит актуальное значение
const countRef = useRef(count);
useEffect(() => { countRef.current = count; }, [count]); // синхронизация ref с state

useEffect(() => {
  const id = setInterval(() => console.log(countRef.current), 1000); // всегда актуально
  return () => clearInterval(id);
}, []);
```

**DOM-рефы и React.memo/Fiber**

Когда `ref` передаётся в JSX-элемент (`<div ref={myRef} />`), React после commit-фазы (🔗 Тема 30) устанавливает `myRef.current` в реальный DOM-узел. Это происходит **до** вызова `useLayoutEffect` и **до** вызова `useEffect` — поэтому обращение к `ref.current` в этих хуках безопасно, а в теле самого компонента (во время рендера) `ref.current` для впервые монтируемого элемента ещё `null`.

**Callback ref — альтернатива `useRef` для более тонкого контроля**

```typescript
// useRef — статичный объект { current: null }, React сам устанавливает .current
const ref = useRef<HTMLDivElement>(null);

// Callback ref — функция, вызываемая React'ом с самим DOM-узлом (или null при размонтировании)
const setRef = useCallback((node: HTMLDivElement | null) => {
  if (node) {
    console.log('элемент смонтирован', node);
  } else {
    console.log('элемент размонтирован');
  }
}, []);

<div ref={setRef} />
```

Callback ref полезен, когда нужно реагировать на **момент** появления/удаления DOM-узла (например, подключить `ResizeObserver`, как в Теме 34), а не просто хранить ссылку.

**`forwardRef` — передача ref через функциональный компонент**

Функциональные компоненты по умолчанию не принимают `ref` как обычный проп — React резервирует его для специальной обработки. `forwardRef` явно "пробрасывает" `ref` внутрь компонента к конкретному DOM-элементу или через `useImperativeHandle` — к кастомному объекту API.

```typescript
const FancyInput = forwardRef<HTMLInputElement, { placeholder: string }>(
  function FancyInput({ placeholder }, ref) {
    return <input ref={ref} placeholder={placeholder} className="fancy-input" />;
  }
);

// Родитель получает прямой доступ к DOM-узлу <input> внутри FancyInput
const inputRef = useRef<HTMLInputElement>(null);
<FancyInput ref={inputRef} placeholder="Имя" />;
```

**`useImperativeHandle` — кастомный императивный API вместо прямого доступа к DOM**

```typescript
interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, { src: string }>(
  function VideoPlayer({ src }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Родитель получит не сырой <video> DOM-элемент, а ограниченный, безопасный API
    useImperativeHandle(ref, () => ({
      play: () => videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
      seek: (seconds: number) => { if (videoRef.current) videoRef.current.currentTime = seconds; },
    }), []);

    return <video ref={videoRef} src={src} />;
  }
);

// Родитель управляет плеером через явный, ограниченный контракт
const playerRef = useRef<VideoPlayerHandle>(null);
playerRef.current?.play(); // не может напрямую менять .src, .volume и т.п. — только play/pause/seek
```

---

## 2. Связь со стеком

**React 19: `ref` как обычный проп функциональных компонентов**

В React 19 `forwardRef` становится необязательным для базового случая — `ref` можно принимать как второй параметр функции напрямую в большинстве случаев. `useImperativeHandle` остаётся актуальным всегда, когда нужен не прямой доступ к DOM, а ограниченный кастомный API.

**Next.js: `useRef` — только в Client Components**

```typescript
'use client';
function AutoFocusInput() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return <input ref={ref} />;
}
```

**Интеграция с не-React библиотеками (Chart.js, D3, Leaflet)** — стандартный паттерн: `useRef` для DOM-контейнера + `useEffect` для инициализации/уничтожения инстанса библиотеки, которая сама управляет этим DOM-узлом мимо Virtual DOM (🔗 Тема 30, паттерн 3).

---

## 3. Лучшие паттерны

**✅ Паттерн 1: `useRef` для значений, не влияющих на визуальный результат**

```typescript
// ❌ Плохо: useState для значения, которое не должно вызывать ре-рендер
function Component() {
  const [renderCount, setRenderCount] = useState(0);
  useEffect(() => { setRenderCount(c => c + 1); }); // вызывает ЕЩЁ ОДИН ре-рендер после каждого!
}

// ✅ Хорошо: useRef — подсчёт без побочного ре-рендера
function Component() {
  const renderCountRef = useRef(0);
  renderCountRef.current++; // мутация прямо в теле компонента — безопасно для ref, не для state
}
```

*Почему best practice:* Использование `useState` для данных, не отражаемых в UI, — источник лишних ре-рендеров и даже бесконечных циклов (`setState` в эффекте без ограничивающих зависимостей).

**✅ Паттерн 2: `useImperativeHandle` — ограниченный контракт вместо "дырявого" DOM-доступа**

```typescript
// ❌ Плохо: forwardRef без useImperativeHandle отдаёт родителю ВЕСЬ DOM-элемент —
// родитель может менять любые свойства, нарушая инкапсуляцию компонента
const Input = forwardRef<HTMLInputElement, Props>((props, ref) => <input ref={ref} {...props} />);
// parentRef.current.value = 'hack'; // родитель может напрямую мутировать DOM мимо React state

// ✅ Хорошо: явный, ограниченный API
const Input = forwardRef<{ focus: () => void; clear: () => void }, Props>((props, ref) => {
  const innerRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({
    focus: () => innerRef.current?.focus(),
    clear: () => { if (innerRef.current) innerRef.current.value = ''; },
  }), []);
  return <input ref={innerRef} {...props} />;
});
```

*Почему:* Аналог инкапсуляции в ООП (🔗 Тема 13, Тема 28 — SRP/DIP) — компонент сам решает, какую часть своего внутреннего устройства разрешено контролировать снаружи.

**✅ Паттерн 3: Синхронизировать ref с последним значением пропса/state для избежания stale closures**

```typescript
// ✅ "latest ref" паттерн — используется в библиотеках (usehooks-ts, ahooks)
function useLatest<T>(value: T): React.RefObject<T> {
  const ref = useRef(value);
  ref.current = value; // синхронно мутируется на каждом рендере, без useEffect
  return ref;
}

function Component({ onSave }: { onSave: () => void }) {
  const onSaveRef = useLatest(onSave);
  useEffect(() => {
    const id = setInterval(() => onSaveRef.current(), 5000); // всегда актуальный onSave
    return () => clearInterval(id);
  }, []); // эффект не пересоздаётся при каждом изменении onSave — только ref обновляется
}
```

*Почему:* Позволяет держать `useEffect` с пустым (или минимальным) массивом зависимостей, избегая частого пересоздания подписок/таймеров, при этом гарантированно используя актуальные значения — компромисс между стабильностью эффекта и свежестью данных.

---

## 4. Вопросы интервью

**Q1: В чём принципиальная разница `useRef` и `useState`?**

Оба хранят значение между рендерами компонента. Изменение `useState` (через `setState`) планирует ре-рендер компонента; изменение `.current` у `useRef` — прямая мутация, не вызывающая ре-рендер и не гарантирующая, что компонент отразит новое значение на экране немедленно.

**Q2: Зачем нужен `useRef`, если можно хранить значение в обычной переменной?**

Обычная переменная, объявленная в теле функции-компонента, создаётся заново при каждом вызове функции (каждом рендере) — она не переживает рендер. `useRef` хранит объект `{ current: value }` в Fiber-узле компонента (аналогично `useState`, 🔗 Тема 31), который сохраняется между рендерами.

**Q3: Когда обращение к `ref.current` для DOM-узла безопасно?**

После commit-фазы — то есть внутри `useEffect`/`useLayoutEffect` или в обработчиках событий, вызываемых после монтирования. Во время самого рендера (в теле функции компонента при первом рендере) `ref.current` для впервые создаваемого DOM-элемента ещё равен `null`, так как React не успел его создать.

**Q4: Что такое callback ref и когда он предпочтительнее `useRef`?**

Функция, передаваемая в атрибут `ref` вместо объекта из `useRef`; React вызывает её с DOM-узлом при монтировании и с `null` при размонтировании. Предпочтительнее, когда нужно реагировать именно на момент появления/удаления узла (подключение сторонних observer'ов, интеграция с не-React библиотеками), а не просто хранить ссылку для последующего доступа.

**Q5: Зачем нужен `forwardRef`?**

Функциональные компоненты по умолчанию не получают `ref` как обычный проп — React резервирует его. `forwardRef` явно указывает React передать `ref`, полученный от родителя, дальше внутрь компонента — обычно к конкретному DOM-элементу через собственный `ref` или к `useImperativeHandle`.

**Q6: Что делает `useImperativeHandle` и зачем он нужен вместо простого `forwardRef`?**

Позволяет заменить то, что получает родитель через `ref`, на кастомный объект с ограниченным набором методов, вместо прямого доступа ко всему DOM-элементу. Используется для сохранения инкапсуляции: родитель может вызвать `play()`/`focus()`, но не может напрямую менять внутренние DOM-атрибуты компонента.

**Q7: Может ли изменение `.current` у `useRef` привести к "устаревшему" отображению в UI?**

Да, и это ожидаемое поведение — если значение из `ref.current` используется в JSX без соответствующего `useState`, изменение `.current` не вызовет ре-рендер, и UI не обновится, пока какой-либо другой механизм (setState, изменение пропсов) не инициирует рендер. Именно поэтому `useRef` не подходит для значений, которые должны отображаться на экране.

**Q8: Как `useRef` помогает решить stale closure в `useEffect`?**

Значение, обновляемое через `ref.current = value` при каждом рендере (или в отдельном эффекте, синхронизирующем ref с state), доступно внутри других замыканий (например, колбэка `setInterval`) как всегда актуальное — потому что чтение `ref.current` происходит во время вызова колбэка, а не захватывается статически в момент создания замыкания, как обычная переменная.

**Q9: Что произойдёт, если передать `ref` в функциональный компонент без `forwardRef` (в React &lt; 19)?**

React выдаст предупреждение в консоли о том, что функциональные компоненты не могут получать `ref` напрямую, и значение `ref.current` останется `null` — проп `ref` не будет передан внутрь компонента как обычный именованный проп (`props.ref` не существует, React обрабатывает его отдельно).

**Q10: Почему прямая мутация DOM через `ref.current.innerHTML = ...` считается антипаттерном?**

Это меняет реальный DOM в обход Virtual DOM/Fiber (🔗 Тема 30) — React не узнаёт об этом изменении, и его внутреннее представление (Virtual DOM с прошлого рендера) расходится с реальным DOM. При следующем рендере React может "откатить" изменение (перезаписав узел на основе своего устаревшего представления) или получить рассинхронизацию, приводящую к трудноуловимым багам.

---

## 5. Практическое задание

Реализуй компонент `ImperativeForm` с `forwardRef` и `useImperativeHandle`, предоставляющий родителю API `{ reset: () => void; validate: () => boolean; focusFirstError: () => void }`:

1. Форма содержит несколько полей `input` с базовой валидацией (непустое значение).
2. `reset()` очищает все поля.
3. `validate()` проверяет все поля и возвращает `true`/`false`.
4. `focusFirstError()` переводит фокус на первое невалидное поле через внутренние `ref`.
5. Родитель не должен иметь прямого доступа к DOM-узлам `input` — только к трём методам API.

---

## 6. Решение с инсайтом

```typescript
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

interface ImperativeFormHandle {
  reset: () => void;
  validate: () => boolean;
  focusFirstError: () => void;
}

interface FieldConfig {
  name: string;
  label: string;
}

interface ImperativeFormProps {
  fields: FieldConfig[];
}

const ImperativeForm = forwardRef<ImperativeFormHandle, ImperativeFormProps>(
  function ImperativeForm({ fields }, ref) {
    const [values, setValues] = useState<Record<string, string>>(
      () => Object.fromEntries(fields.map(f => [f.name, '']))
    );
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    // Мапа refs на каждый input — не в state, потому что не влияет на визуал напрямую (🔗 Паттерн 1)
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useImperativeHandle(ref, () => ({
      reset() {
        setValues(Object.fromEntries(fields.map(f => [f.name, ''])));
        setErrors({});
      },
      validate() {
        const nextErrors: Record<string, boolean> = {};
        for (const field of fields) {
          nextErrors[field.name] = values[field.name].trim() === '';
        }
        setErrors(nextErrors);
        return Object.values(nextErrors).every(hasError => !hasError);
      },
      focusFirstError() {
        const firstErrorField = fields.find(f => errors[f.name]);
        if (firstErrorField) {
          inputRefs.current[firstErrorField.name]?.focus();
        }
      },
    }), [fields, values, errors]);

    return (
      <form>
        {fields.map(field => (
          <div key={field.name}>
            <label>{field.label}</label>
            <input
              ref={node => { inputRefs.current[field.name] = node; }} // callback ref в мапу
              value={values[field.name]}
              onChange={e => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}
              className={errors[field.name] ? 'input--error' : ''}
            />
          </div>
        ))}
      </form>
    );
  }
);

// Использование родителем — только через ограниченный API, без доступа к DOM
function App() {
  const formRef = useRef<ImperativeFormHandle>(null);

  function handleSubmit() {
    const isValid = formRef.current?.validate();
    if (!isValid) {
      formRef.current?.focusFirstError();
      return;
    }
    console.log('Форма валидна, отправка...');
  }

  return (
    <div>
      <ImperativeForm ref={formRef} fields={[{ name: 'email', label: 'Email' }]} />
      <button onClick={handleSubmit}>Отправить</button>
      <button onClick={() => formRef.current?.reset()}>Сброс</button>
    </div>
  );
}

export default ImperativeForm;
```

> **Инсайт:** `inputRefs` хранит мапу DOM-узлов через `useRef`, а не `useState`, потому что сама коллекция ссылок не должна вызывать ре-рендер при заполнении — только `values`/`errors` (state) влияют на визуальный результат. `useImperativeHandle` здесь — не просто "проброс DOM", а осознанно спроектированный контракт: родитель может вызвать `validate()`, но не может напрямую прочитать/изменить внутренние `input` — инкапсуляция сохраняется, как в Паттерне 2.

---

*Раздел 11 — Производительность, ссылки, контекст · Тема 36 из 43*
