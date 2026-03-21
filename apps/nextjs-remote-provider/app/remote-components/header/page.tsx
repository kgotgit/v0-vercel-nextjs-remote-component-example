"use client";

import { useState } from "react";

export default function HeaderComponent() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-gray-900 text-white rounded-xl overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">
            RC
          </div>
          <span className="font-semibold">Remote Header</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
            Home
          </a>
          <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
            Features
          </a>
          <a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">
            Docs
          </a>
          <button className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
            Get Started
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-gray-300 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <nav className="md:hidden px-6 pb-4 flex flex-col gap-2">
          <a href="#" className="py-2 text-sm text-gray-300 hover:text-white">Home</a>
          <a href="#" className="py-2 text-sm text-gray-300 hover:text-white">Features</a>
          <a href="#" className="py-2 text-sm text-gray-300 hover:text-white">Docs</a>
          <button className="mt-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-lg">
            Get Started
          </button>
        </nav>
      )}
    </header>
  );
}
