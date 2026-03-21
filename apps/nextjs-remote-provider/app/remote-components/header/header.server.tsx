import { HeaderClient } from "./header.client";
import { HeaderNavLinks } from "./header-nav-links";

export function HeaderServer() {
  return (
    <header className="bg-gray-900 text-white rounded-xl overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">
            RC
          </div>
          <span className="font-semibold">Remote Header</span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <HeaderNavLinks />
        </nav>

        <HeaderClient>
          <HeaderNavLinks mobile />
        </HeaderClient>
      </div>
    </header>
  );
}
