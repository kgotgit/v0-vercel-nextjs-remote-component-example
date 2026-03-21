"use client";

import { useState } from "react";

export default function CounterComponent() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Interactive Counter
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        This component maintains state and handles user interactions.
      </p>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setCount((c) => c - 1)}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-lg shadow-sm transition-colors"
        >
          −
        </button>
        <div className="min-w-[80px] text-center">
          <span className="text-3xl font-bold text-indigo-600">{count}</span>
        </div>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-lg shadow-sm transition-colors"
        >
          +
        </button>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setCount(0)}
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
    </div>
  );
}
