# Remote Component Conventions

Use this pattern for remote components in the Next.js provider app.

## File naming

- `page.tsx` — route entry, server component
- `component-name.server.tsx` — server-rendered UI shell
- `component-name.client.tsx` — client-only behavior and interactivity

## Structure

### `page.tsx`
- Wrap the exported UI in `RemoteComponent`
- Import the server component only
- Keep this file server-only

Example:

```tsx
import { RemoteComponent } from "remote-components/next";
import { CounterServer } from "./counter.server";

export default function CounterPage() {
  return (
    <RemoteComponent>
      <CounterServer />
    </RemoteComponent>
  );
}
```

### `*.server.tsx`
- Render all static markup
- Own layout, headings, copy, and non-interactive structure
- Import `*.client.tsx` only where interaction is needed
- Do not add `"use client"`

Example:

```tsx
import { CounterClient } from "./counter.client";

export function CounterServer() {
  return (
    <div>
      <h2>Interactive Counter</h2>
      <CounterClient />
    </div>
  );
}
```

### `*.client.tsx`
- Add `"use client"`
- Keep only state, event handlers, and interactive UI
- Avoid duplicating static shell markup unless required for the interaction boundary

Example:

```tsx
"use client";

import { useState } from "react";

export function CounterClient() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
```

## Goal

- maximize server rendering
- minimize client JavaScript
- reduce hydration surface
- isolate behavior in small client boundaries

## Current examples

- `counter.server.tsx` + `counter.client.tsx`
- `header.server.tsx` + `header.client.tsx`
