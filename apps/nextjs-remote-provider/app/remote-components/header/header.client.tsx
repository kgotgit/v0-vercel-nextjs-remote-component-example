"use client";

import { useState, type ReactNode } from "react";

type HeaderClientProps = {
  children: ReactNode;
};

export function HeaderClient({ children }: HeaderClientProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden p-2 text-gray-300 hover:text-white"
        aria-expanded={menuOpen}
        aria-label="Toggle navigation menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {menuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {menuOpen && <nav className="md:hidden px-6 pb-4 flex flex-col gap-2">{children}</nav>}
    </>
  );
}
