import { CounterClient } from "./counter.client";

export function CounterServer() {
  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Interactive Counter
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        This component maintains state and handles user interactions.
      </p>

      <CounterClient />
    </div>
  );
}
