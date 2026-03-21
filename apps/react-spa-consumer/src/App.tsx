import { useState } from "react";
import { RemoteComponent } from "remote-components/html";

// URL of the Next.js remote provider app
// In production, replace with your deployed Next.js app URL
const REMOTE_PROVIDER_URL =
  import.meta.env.VITE_REMOTE_PROVIDER_URL || "http://localhost:4000";

function App() {
  const [activeTab, setActiveTab] = useState<"counter" | "card" | "header">(
    "counter"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">
            React SPA - Remote Component Consumer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Loading components from Next.js app via Vercel Remote Components
          </p>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Tab Buttons */}
        <div className="flex gap-2 mb-8">
          {(["counter", "card", "header"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Component
            </button>
          ))}
        </div>

        {/* Remote Component Container */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">
              Remote: {REMOTE_PROVIDER_URL}/remote-components/{activeTab}
            </span>
          </div>

          <div className="border border-dashed border-gray-300 rounded-lg p-4 min-h-[200px]">
            <RemoteComponent
              key={activeTab}
              source={`${REMOTE_PROVIDER_URL}/remote-components/${activeTab}`}
              fallback={
                <div className="flex items-center justify-center h-40">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500">
                      Loading remote component...
                    </span>
                  </div>
                </div>
              }
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              How it works
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>
                1. Next.js app exposes components via{" "}
                <code className="bg-gray-100 px-1 rounded">/remote-components/*</code>
              </li>
              <li>
                2. This React SPA uses{" "}
                <code className="bg-gray-100 px-1 rounded">RemoteComponent</code> to fetch them
              </li>
              <li>3. Components are rendered with full interactivity</li>
              <li>4. Server-side rendering happens on the Next.js app</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Configuration
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                Remote Provider URL:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  {REMOTE_PROVIDER_URL}
                </code>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Set <code className="bg-gray-100 px-1 rounded">VITE_REMOTE_PROVIDER_URL</code>{" "}
                environment variable to change the provider URL in production.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
