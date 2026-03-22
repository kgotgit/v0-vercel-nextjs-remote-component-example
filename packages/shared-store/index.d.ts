export interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setCount: (value: number) => void;
}

export interface ThemeState {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

/**
 * Cross-bundle counter store backed by window Custom Events.
 */
export declare function useCounterStore(): CounterState;

/**
 * Cross-bundle theme store backed by window Custom Events.
 */
export declare function useThemeStore(): ThemeState;
