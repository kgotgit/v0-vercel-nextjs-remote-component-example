# v0-vercel-nextjs-remote-component-example

This repository is now a Turborepo-based monorepo.

## Workspace Layout

- `apps/nextjs-remote-provider`: Next.js remote component provider app
- `apps/react-spa-consumer`: Vite React SPA consumer app
- `packages/*`: shared reusable packages

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run all apps in development mode:

```bash
pnpm dev
```

Build all apps:

```bash
pnpm build
```

## Run a Single App

Next.js provider:

```bash
pnpm --filter nextjs-remote-component-provider dev
```

React SPA consumer:

```bash
pnpm --filter react-spa-consumer dev
```
