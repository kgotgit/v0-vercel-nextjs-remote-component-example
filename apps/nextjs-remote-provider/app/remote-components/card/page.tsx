import React from "react";
import { RemoteComponent } from "remote-components/next";

export default function CardComponent() {
  return (
    <RemoteComponent>
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="h-32 bg-gradient-to-br from-emerald-400 to-cyan-500" />
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 text-lg">
          Remote Card Component
        </h3>
        <p className="text-gray-600 mt-2 text-sm leading-relaxed">
          This card is rendered from the Next.js remote provider app. It
          demonstrates how static content can be served as a remote component
          with full SSR support.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            SSR
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
            Remote
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Reusable
          </span>
        </div>
      </div>
    </div>
    </RemoteComponent>
  );
}
