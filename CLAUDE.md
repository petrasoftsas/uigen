# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**UIGen** — an AI-powered React component generator. Users describe a component in chat, Claude generates it using tool calls, and a live preview renders the result inside an iframe with no files written to disk.

## Commands

```bash
# Initial setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (http://localhost:3000)
npm run dev

# Build
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx

# Reset the SQLite database
npm run db:reset
```

Tests use Vitest + jsdom + React Testing Library. Prisma client is generated to `src/generated/prisma` (non-standard location, configured in `prisma/schema.prisma`).

## Architecture

### Virtual File System (`src/lib/file-system.ts`)
All generated code lives in an in-memory `VirtualFileSystem` — nothing is written to disk. The VFS is serialized to JSON and stored in the `Project.data` column (SQLite). On load it is deserialized back into a `VirtualFileSystem` instance.

### AI Chat Pipeline (`src/app/api/chat/route.ts`)
The `/api/chat` POST route uses the Vercel AI SDK (`streamText`) with two tools exposed to Claude:
- **`str_replace_editor`** (`src/lib/tools/str-replace.ts`) — `create`, `str_replace`, and `insert` commands that operate on the server-side VFS instance.
- **`file_manager`** (`src/lib/tools/file-manager.ts`) — `rename` and `delete` commands.

Tool call results are streamed back to the client. The client-side `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) mirrors every tool call against its own VFS copy via `handleToolCall`.

### Live Preview (`src/components/preview/PreviewFrame.tsx`)
`PreviewFrame` re-renders the iframe every time `refreshTrigger` changes. It calls `createImportMap` which:
1. Transforms every `.jsx/.tsx/.js/.ts` file in the VFS using Babel standalone.
2. Creates blob URLs for each transformed module.
3. Builds an ES module import map (third-party packages resolved via `esm.sh`).
4. Injects Tailwind CDN and any CSS files as `<style>` tags.

The resulting HTML is set as `iframe.srcdoc`. Entry point defaults to `/App.jsx`.

### Authentication (`src/lib/auth.ts`)
JWT-based auth using `jose`. Sessions are stored as HTTP-only cookies (`auth-token`, 7-day expiry). `JWT_SECRET` defaults to `"development-secret-key"` when the env var is absent. `src/lib/auth.ts` is server-only.

### Provider / Mock Mode (`src/lib/provider.ts`)
When `ANTHROPIC_API_KEY` is absent, a `MockLanguageModel` is used that returns static component code without calling the API. The real model is `claude-haiku-4-5`.

### Data Model
Two Prisma models in `prisma/schema.prisma` (SQLite):
- **User** — email + bcrypt password
- **Project** — belongs to an optional User; `messages` (JSON array) and `data` (JSON VFS snapshot) stored as plain strings.

Projects are owned by authenticated users. Anonymous users get a session-local project that is not persisted.

### Context Providers
- `FileSystemContext` — holds the client-side VFS, selected file, and `handleToolCall`.
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — wraps Vercel AI SDK's `useChat`, serializes VFS state into each request body.
