# Контент курса — Тема 32: useReducer

> **Курс:** JavaScript для Middle FullStack Interview
> **Стек:** Next.js · React · TypeScript
> **Охват:** Раздел 10 — Тема 32 (useReducer)

---

# Тема 32 — useReducer

← Предыдущая тема: [31 — useState](topic_31_usestate.md)
→ Следующая тема: [33 — useEffect](topic_33_useeffect.md)

---

## 1. Теория с аналогиями

**Аналогия: заявление в госучреждение**

Когда ты хочешь изменить состояние документа (паспорт, реестр), ты не меняешь запись сам — ты подаёшь **заявление с чётко описанным действием** ("изменить фамилию", "закрыть счёт"), а сотрудник (единая функция-обработчик) применяет это действие к текущему состоянию по фиксированным правилам и возвращает новое состояние. Так работает `useReducer`: вместо множества разрозненных `setXxx`-вызовов — единая функция `reducer(state, action)`, описывающая все возможные переходы состояния в одном месте.

**От `useState` к `useReducer`**

```typescript
// useState: логика обновлений размазана по компоненту
function Cart() {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);

  function addItem(item: Item) {
    setItems(prev => [...prev, item]);
    setTotal(prev => prev + item.price); // легко забыть синхронизировать
  }
  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    setTotal(prev => prev - (items.find(i => i.id === id)?.price ?? 0)); // и здесь тоже
  }
}

// useReducer: все переходы состояния — в одной функции
type CartState = { items: Item[]; total: number };
type CartAction =
  | { type: 'ADD_ITEM'; item: Item }
  | { type: 'REMOVE_ITEM'; id: string };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        items: [...state.items, action.item],
        total: state.total + action.item.price,
      };
    case 'REMOVE_ITEM': {
      const removed = state.items.find(i => i.id === action.id);
      return {
        items: state.items.filter(i => i.id !== action.id),
        total: state.total - (removed?.price ?? 0),
      };
    }
    default:
      return state;
  }
}

function Cart() {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  // Единственный способ изменить state — dispatch(action)
  function addItem(item: Item) {
    dispatch({ type: 'ADD_ITEM', item });
  }
}
```

**Схема: как `dispatch` приводит к новому рендеру**

```
Компонент вызывает dispatch({ type: 'ADD_ITEM', item })
        │
        ▼
React вызывает reducer(currentState, action) — ЧИСТАЯ функция, без побочных эффектов
        │
        ▼
Получено newState
        │
        ▼
Object.is(currentState, newState)?  ──да──►  ре-рендер пропущен (bail out)
        │ нет
        ▼
Запланирован ре-рендер с newState
```

**`reducer` должен быть чистой функцией**

```typescript
// ❌ Плохо: побочный эффект и мутация внутри reducer
function badReducer(state: CartState, action: CartAction): CartState {
  if (action.type === 'ADD_ITEM') {
    state.items.push(action.item);   // ❌ мутация — React может не заметить изменение
    fetch('/api/log', { method: 'POST' }); // ❌ побочный эффект — reducer может вызываться несколько раз
    return state;                    // ❌ та же ссылка — React решит, что ничего не изменилось
  }
  return state;
}

// ✅ Хорошо: новый объект, никаких побочных эффектов
function goodReducer(state: CartState, action: CartAction): CartState {
  if (action.type === 'ADD_ITEM') {
    return { ...state, items: [...state.items, action.item] };
  }
  return state;
}
```

**Когда `useReducer` предпочтительнее `useState`**

```
useState подходит:              useReducer подходит:
─────────────────────           ──────────────────────────
Независимые примитивы           Несколько полей state меняются
(строка, число, boolean)        согласованно при одном действии

Простое обновление               Следующее состояние зависит
value → newValue                 от типа действия (много веток)

Логика обновления — 1 строка     Логика обновления — сложная,
                                  тестируемая отдельно от UI
```

**Ленивая инициализация в `useReducer`**

```typescript
function init(initialCount: number): CounterState {
  return { count: initialCount, history: [] };
}

// Третий аргумент — начальные "сырые" данные, init вызывается один раз при монтировании
const [state, dispatch] = useReducer(counterReducer, initialCount, init);
```

---

## 2. Связь со стеком

**`useReducer` — упрощённая версия Redux внутри одного компонента**

Reducer-паттерн (`(state, action) => newState`) — это то же самое, что `combineReducers`/`createSlice` в Redux, только без глобального хранилища. `useReducer` + `useContext` (🔗 Тема 37) — стандартный способ получить "мини-Redux" без сторонней библиотеки:

```typescript
const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}
```

**TypeScript: discriminated union для типобезопасных action**

```typescript
// discriminated union по полю type — TypeScript сужает тип payload автоматически
type Action =
  | { type: 'SET_LOADING' }
  | { type: 'SET_DATA'; payload: User[] }
  | { type: 'SET_ERROR'; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload }; // TS знает: action.payload есть только здесь
    case 'SET_ERROR':
      return { ...state, error: action.error };
    default:
      return state;
  }
}
```

**Redux Toolkit под капотом использует Immer** — паттерн, похожий на `useReducer`, но позволяющий писать "мутирующий" синтаксис, который на самом деле производит иммутабельное обновление (🔗 Тема 27).

---

## 3. Лучшие паттерны

**✅ Паттерн 1: Один reducer — одна ответственность (не смешивать несвязанную логику)**

```typescript
// ❌ Плохо: один reducer управляет и формой, и модальными окнами, и списком
type MegaAction = FormAction | ModalAction | ListAction; // сложно поддерживать

// ✅ Хорошо: отдельные useReducer для несвязанных областей состояния
const [formState, formDispatch] = useReducer(formReducer, initialForm);
const [modalState, modalDispatch] = useReducer(modalReducer, initialModal);
```

*Почему best practice:* Аналог Single Responsibility Principle (🔗 Тема 28) для state-менеджмента — каждый reducer тестируется и понимается независимо.

**✅ Паттерн 2: Action как описание "что произошло", а не "что сделать" (событийный стиль)**

```typescript
// ❌ Плохо: action диктует конкретную мутацию — reducer превращается в "прокси"
dispatch({ type: 'SET_ITEMS', items: [...state.items, newItem] });

// ✅ Хорошо: action описывает событие, вся логика — внутри reducer
dispatch({ type: 'ITEM_ADDED', item: newItem });
// reducer сам решает, как это событие меняет state
```

*Почему:* Событийный стиль (как в Redux/Flux) переносит всю бизнес-логику в одно тестируемое место — компонент отвечает только за "что произошло", а не "как именно изменить state".

**✅ Паттерн 3: Ленивая инициализация для дорогих начальных вычислений**

```typescript
// ❌ Плохо: parseInitialStateFromURL() выполняется при каждом рендере родителя,
// хотя используется только при монтировании
const [state, dispatch] = useReducer(reducer, parseInitialStateFromURL());

// ✅ Хорошо: третий аргумент — init-функция, вызывается один раз
const [state, dispatch] = useReducer(reducer, window.location.search, parseInitialStateFromURL);
```

*Почему:* Аналогично ленивой инициализации `useState` (🔗 Тема 31) — избегаем повторных дорогих вычислений на каждый рендер.

---

## 4. Вопросы интервью

**Q1: В чём принципиальная разница `useState` и `useReducer`?**

`useState` хранит одно значение и обновляется прямым вызовом `setState`. `useReducer` централизует всю логику переходов состояния в одной чистой функции `reducer(state, action)`, а компонент только "сообщает о событиях" через `dispatch`. `useReducer` предпочтительнее, когда обновления состояния сложные, взаимозависимые или их много.

**Q2: Почему reducer обязан быть чистой функцией?**

React может вызывать reducer несколько раз для одного action (в конкурентном режиме, при повторных попытках рендера) — побочные эффекты (запросы, мутации внешних переменных) привели бы к неверному поведению при повторных вызовах. Reducer должен только вычислять и возвращать новое состояние на основе текущего state и action, без побочных эффектов.

**Q3: Что произойдёт, если reducer вернёт тот же объект (ту же ссылку)?**

React сравнивает предыдущее и новое состояние через `Object.is`. Если reducer вернул ссылку на тот же объект (например, из-за мутации вместо создания нового объекта), React решит, что состояние не изменилось, и пропустит ре-рендер — даже если содержимое объекта фактически изменилось.

**Q4: Как типизировать `action` в TypeScript для полной типобезопасности?**

Через discriminated union: объединение типов с общим дискриминирующим полем (`type`). Внутри `switch(action.type)` TypeScript автоматически сужает тип `action` до конкретного варианта, обеспечивая доступ только к релевантным полям (`payload`, `error` и т.п.) без явных type guard'ов.

**Q5: Как использовать `useReducer` для замены Redux в рамках одного поддерева компонентов?**

Комбинация `useReducer` + `useContext`: reducer и state создаются один раз в компоненте-провайдере, `state` и `dispatch` передаются через Context всем потомкам. Это даёт паттерн "публикация-подписка" (🔗 Тема 26 — Observer) без установки внешней библиотеки, подходящий для локального (в рамках фичи) состояния.

**Q6: Что такое третий (опциональный) аргумент `useReducer`?**

Функция ленивой инициализации `init`, применяемая к второму аргументу `useReducer(reducer, initialArg, init)`. React вызывает `init(initialArg)` только один раз при монтировании — используется, когда вычисление начального состояния дорогое или зависит от пропсов.

**Q7: Может ли reducer вызывать другой reducer или обращаться к внешнему состоянию?**

Нет — reducer должен быть детерминированной чистой функцией: одинаковые `(state, action)` на входе всегда должны давать одинаковый результат на выходе, без обращения к внешним изменяемым данным (текущему времени, случайным числам, глобальным переменным, другим hooks).

**Q8: В чём разница между `dispatch({ type: 'SET_ITEMS', items })` и `dispatch({ type: 'ITEM_ADDED', item })` с точки зрения архитектуры?**

Первый вариант ("командный" стиль) заставляет компонент самостоятельно вычислять новое значение массива, что дублирует логику, которая должна жить в reducer. Второй ("событийный" стиль) описывает произошедшее событие, оставляя всю логику вычисления нового state внутри reducer — более тестируемый и предсказуемый подход, аналогичный Flux/Redux-конвенциям.

**Q9: Как протестировать reducer в изоляции от React?**

Поскольку reducer — чистая функция `(state, action) => newState`, её можно тестировать напрямую без рендеринга компонентов и без React Testing Library: `expect(cartReducer(initialState, { type: 'ADD_ITEM', item })).toEqual(expectedState)`. Это одно из главных практических преимуществ паттерна.

**Q10: Что произойдёт, если reducer получит неизвестный `action.type`?**

По конвенции `switch` должен иметь ветку `default`, возвращающую текущий `state` без изменений — это защищает от непреднамеренных ре-рендеров и делает поведение предсказуемым при опечатке в типе action или при получении action, предназначенного для другого reducer.

---

## 5. Практическое задание

Реализуй `todoReducer` и компонент `TodoApp` на его основе:

1. Действия: `ADD`, `TOGGLE`, `REMOVE`, `SET_FILTER` (`'all' | 'active' | 'completed'`).
2. State: `{ todos: Todo[]; filter: Filter }`.
3. Вычисляемый (не хранимый в state!) список отфильтрованных todo на основе `filter`.
4. Типизируй все action через discriminated union.

---

## 6. Решение с инсайтом

```typescript
import { useReducer, useMemo } from 'react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

type Filter = 'all' | 'active' | 'completed';

interface TodoState {
  todos: Todo[];
  filter: Filter;
}

type TodoAction =
  | { type: 'ADD'; text: string }
  | { type: 'TOGGLE'; id: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_FILTER'; filter: Filter };

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD':
      return {
        ...state,
        todos: [...state.todos, { id: crypto.randomUUID(), text: action.text, completed: false }],
      };
    case 'TOGGLE':
      return {
        ...state,
        todos: state.todos.map(t => t.id === action.id ? { ...t, completed: !t.completed } : t),
      };
    case 'REMOVE':
      return { ...state, todos: state.todos.filter(t => t.id !== action.id) };
    case 'SET_FILTER':
      return { ...state, filter: action.filter };
    default:
      return state; // защита от неизвестного action.type
  }
}

const initialState: TodoState = { todos: [], filter: 'all' };

function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  // Производное значение — не хранится в state, вычисляется на каждый рендер (🔗 Тема 31)
  const visibleTodos = useMemo(() => {
    switch (state.filter) {
      case 'active':    return state.todos.filter(t => !t.completed);
      case 'completed': return state.todos.filter(t => t.completed);
      default:          return state.todos;
    }
  }, [state.todos, state.filter]);

  return (
    <div>
      <button onClick={() => dispatch({ type: 'ADD', text: `Задача ${state.todos.length + 1}` })}>
        Добавить
      </button>
      <select
        value={state.filter}
        onChange={e => dispatch({ type: 'SET_FILTER', filter: e.target.value as Filter })}
      >
        <option value="all">Все</option>
        <option value="active">Активные</option>
        <option value="completed">Завершённые</option>
      </select>
      <ul>
        {visibleTodos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => dispatch({ type: 'TOGGLE', id: todo.id })}
            />
            {todo.text}
            <button onClick={() => dispatch({ type: 'REMOVE', id: todo.id })}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoApp;
```

> **Инсайт:** `filter` в state, но `visibleTodos` — вычисляемое значение вне state (обёрнутое в `useMemo` для избежания пересчёта на каждый несвязанный рендер, 🔗 Тема 35). Это прямое применение паттерна "derived state antipattern" из Темы 31: если бы `visibleTodos` хранился в отдельном `useState`, пришлось бы вручную пересчитывать его в каждом action reducer'а — источник рассинхронизации. `todoReducer` тестируется без единого рендера React: `todoReducer(initialState, { type: 'ADD', text: 'X' })` — это чистая функция.

---

*Раздел 10 — Хуки состояния и эффектов · Тема 32 из 43*
