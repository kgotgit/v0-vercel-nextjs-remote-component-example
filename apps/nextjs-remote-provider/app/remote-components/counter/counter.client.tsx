"use client";

import { useCounterStore } from "@repo/shared-store";

export function CounterClient() {
  const { count, increment, decrement, reset, setCount } = useCounterStore();

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          onClick={decrement}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-lg shadow-sm transition-colors"
        >
          -
        </button>
        <div className="min-w-[80px] text-center">
          <span className="text-3xl font-bold text-indigo-600">{count}</span>
        </div>
        <button
          onClick={increment}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-lg shadow-sm transition-colors"
        >
          +
        </button>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={reset}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => setCount(100)}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Set to 100
        </button>
      </div>
    </>
  );
}
