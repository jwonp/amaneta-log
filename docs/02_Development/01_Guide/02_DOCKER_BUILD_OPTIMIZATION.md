# Docker Build Optimization

## Summary

The Compose build was failing during `COPY . .` because both dev images were sending the entire repository as Docker build context and then copying it into the image. In this workspace, that included local dependency and build artifacts such as root `node_modules` and `apps/web/.next`, which made the context about 4.2 GB and exposed BuildKit to file-system churn inside dependency trees.

## What changed

### 1. Added a root `.dockerignore`

The new `.dockerignore` excludes local-only artifacts that should never be part of the image build context:

- `node_modules` and `**/node_modules`
- `.next`, `dist`, `build`, `coverage`
- `.turbo`, `.playwright-mcp`
- `.git`, `.DS_Store`
- local `.env` files
- `docs/` and `.vscode/`

This removes roughly these local artifacts from the context on the current machine:

- `node_modules`: 2.7 GB
- `apps/web/.next`: 269 MB
- `.turbo`: 2.9 MB
- `.git`: 1.9 MB
- `.playwright-mcp`: 140 KB

That is a little over 3.0 GB excluded before Docker even starts the copy step, plus about 99k files that no longer need to be scanned/transferred.

### 2. Reworked the dev Dockerfiles

Files:

- `apps/api/dockerfile.dev`
- `apps/web/dockerfile.dev`

These images are used by `docker-compose.yml`, and Compose already bind-mounts the repo into `/app`. Because of that, the image build does not need application source code copied into the image.

The dev Dockerfiles now:

- copy only workspace manifest files needed for dependency resolution
- install only the relevant workspace subtree with `pnpm install --filter api...` or `--filter web...`
- reuse a BuildKit cache mount for the PNPM store
- skip `COPY . .` entirely

This is the main fix for the original build failure.

### 3. Reworked the non-dev Dockerfiles

Files:

- `apps/api/dockerfile`
- `apps/web/dockerfile`

These now:

- copy package manifests first for better dependency-layer caching
- use the same PNPM cache mount pattern
- copy only the app/package source they actually need instead of the whole repo

### 4. Isolated package-level `node_modules` in Compose

File:

- `docker-compose.yml`

Added named volumes for:

- `/app/apps/api/node_modules`
- `/app/apps/web/node_modules`

This prevents the bind mount from leaking host package-level dependencies back into the container and keeps container dependency state reusable across restarts.

## Expected impact

- Fixes the `COPY . .` failure path caused by copying local dependency/build artifacts into the image.
- Cuts Docker context transfer time significantly by removing multi-GB local directories from the build context.
- Improves cache reuse for `pnpm install` through manifest-first layers and a shared BuildKit cache mount.
- Makes dev-image rebuilds cheaper because source code is mounted at runtime instead of baked into the dev image.

## Verification

Static validation completed:

```bash
docker compose config
```

Live image verification could not be completed in that session because Docker Desktop was unavailable.

권장 재검증:

```bash
docker compose down
docker compose build web api
docker compose up -d
```
