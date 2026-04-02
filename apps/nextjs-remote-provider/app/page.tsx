import Link from "next/link";
import { PROVIDER_APP_META } from "@repo/config";
import {
  getComponentLabel,
  PROVIDER_COMPONENTS,
  PROVIDER_COPY,
  REMOTE_COMPONENT_USAGE_SNIPPET,
} from "@repo/ui";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{PROVIDER_APP_META.title}</h1>
        <p className="text-gray-600 mb-8">{PROVIDER_APP_META.description}</p>

        {/* Cache Components Demo Link */}
        <Link
          href="/cache-demo"
          className="block mb-8 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold">Cache Components Demo</span>
              <p className="text-sm text-blue-100 mt-1">
                PPR + Cache Components + Tag-based Invalidation
              </p>
            </div>
            <span className="text-2xl">-&gt;</span>
          </div>
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">{PROVIDER_COPY.componentsHeading}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {PROVIDER_COMPONENTS.map((component) => (
              <ComponentLink
                key={component.id}
                href={`/remote-components/${component.id}`}
                name={getComponentLabel(component.id)}
                description={component.description}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-900 mb-2">{PROVIDER_COPY.usageHeading}</h3>
          <p className="text-sm text-blue-800">{PROVIDER_COPY.usageIntro}</p>
          <pre className="mt-2 bg-blue-900 text-blue-100 p-3 rounded text-xs overflow-x-auto">
            <code>{REMOTE_COMPONENT_USAGE_SNIPPET}</code>
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
