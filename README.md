# shadcn/ui monorepo template

This is a Next.js monorepo template with shadcn/ui.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Adding Dependencies

```bash
pnpm --filter web add @tanstack/react-query
```

## Adding Nestjs Components

```bash
pnpm --filter api exec nest g module domain --no-spec
pnpm --filter api exec nest g controller domain --no-spec
pnpm --filter api exec nest g service domain --no-spec
```

## Prisma

```bash
docker compose exec api pnpm exec prisma migrate dev --name name
pnpm --filter api exec prisma generate

docker compose exec api pnpm exec prisma studio --hostname 0.0.0.0 --port 51212 --browser none
```
