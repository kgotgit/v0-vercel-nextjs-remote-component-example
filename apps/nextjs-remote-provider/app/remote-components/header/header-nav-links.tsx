type HeaderNavLinksProps = {
  mobile?: boolean;
};

export function HeaderNavLinks({ mobile = false }: HeaderNavLinksProps) {
  if (mobile) {
    return (
      <>
        <a href="#" className="py-2 text-sm text-gray-300 hover:text-white">
          Home
        </a>
        <a href="#" className="py-2 text-sm text-gray-300 hover:text-white">
          Features
        </a>
        <a href="#" className="py-2 text-sm text-gray-300 hover:text-white">
          Docs
        </a>
        <button className="mt-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 rounded-lg">
          Get Started
        </button>
      </>
    );
  }

  return (
    <>
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
    </>
  );
}
