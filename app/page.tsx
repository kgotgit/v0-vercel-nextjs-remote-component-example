import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Next.js Remote Component Provider
        </h1>
        <p className="text-gray-600 mb-8">
          This app exposes components via the{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">
            /remote-components/*
          </code>{" "}
          routes using Vercel Remote Components.
        </p>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">
              Available Remote Components
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            <ComponentLink
              href="/remote-components/counter"
              name="Counter"
              description="Interactive counter with increment/decrement buttons"
            />
            <ComponentLink
              href="/remote-components/card"
              name="Card"
              description="Reusable card component with title and content"
            />
            <ComponentLink
              href="/remote-components/header"
              name="Header"
              description="Shared header with navigation links"
            />
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-900 mb-2">Usage</h3>
          <p className="text-sm text-blue-800">
            Consume these components in your React SPA using:
          </p>
          <pre className="mt-2 bg-blue-900 text-blue-100 p-3 rounded text-xs overflow-x-auto">
{`import { RemoteComponent } from 'remote-components/html/host';

<RemoteComponent
  source="http://localhost:3000/remote-components/counter"
  fallback={<Loading />}
/>`}
          </pre>
        </div>
      </div>
    </main>
  );
}

function ComponentLink({
  href,
  name,
  description,
}: {
  href: string;
  name: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
    >
      <div>
        <span className="font-medium text-gray-900">{name}</span>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <span className="text-gray-400">-&gt;</span>
    </Link>
  );
}
