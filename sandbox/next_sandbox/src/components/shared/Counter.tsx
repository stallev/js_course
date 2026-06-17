'use client';

import { useState, useEffect } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCount(prev => prev + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="">
      <div className="text-2xl font-bold text-center mb-4 text-gray-700 font-mono text-4xl fit-content w-fit mx-auto bg-gray-100 p-4 rounded-md">{count}</div>
      <div className="flex justify-center gap-4">
        <button onClick={() => setCount(count + 1)} className="bg-blue-500 text-white px-4 py-2 rounded-md">Increment</button>
        <button onClick={() => setCount(count - 1)} className="bg-red-500 text-white px-4 py-2 rounded-md">Decrement</button>
      </div>
    </div>
  );
};

export default Counter;