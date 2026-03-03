# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`to-openapi` — a TypeScript library that generates OpenAPI 3.0.3/3.1.0 specs from any Standard Schema implementation (Zod, ArkType, Valibot, etc.). Provides a declarative `openapi()` function, a chainable `OpenAPI` class builder, a `merge()` utility for microservices, and a composable plugin system.

## Commands

```bash
npm run build        # Build ESM + CJS with tsup
npm run test         # Run all tests (vitest run)
npm run typecheck    # Type-check (tsc --noEmit)
npm run check        # Lint with biome
npm run format       # Auto-fix lint/format with biome

# Single test file
npx vitest run tests/unit/paths.test.ts

# Docs dev server
npm run docs:dev
```

## Code Style

- **Formatter**: Biome — tabs, double quotes, 100-char line width
- **Imports**: Biome `organizeImports` enabled; use `import type` for type-only imports (`verbatimModuleSyntax`)
- **Strict TS**: `strict: true`, `noUncheckedIndexedAccess: true`
- Tests allow `any` and non-null assertions (`noExplicitAny: off`, `noNonNullAssertion: off` in `tests/`)

## Architecture

### Data Flow

Route shorthand definitions → plugin `transformRoute` → `shorthand.ts` expands to OpenAPI operations → `resolver.ts` converts Standard Schemas to JSON Schema (with caching/dedup) → `assembler.ts` builds the final document → plugin `transformDocument` → deep-frozen output.

### Key Modules

- **`openapi-fn.ts`** — Declarative API: parses route keys (`"GET /users/:id"`), processes webhooks, applies plugins, assembles document
- **`openapi-class.ts`** — Imperative builder: chainable `.schema()`, `.route()`, `.webhook()`, `.document()` methods; same internal pipeline
- **`shorthand.ts`** — Largest module; expands route shorthands into full OpenAPI operations (parameters, body, responses, vendor extensions)
- **`resolver.ts`** — `SchemaResolver` class: resolves `StandardJSONSchemaV1` → JSON Schema via `schema["~standard"].jsonSchema.input()`, WeakMap caching, auto-extracts schemas used 2+ times to `components/schemas`
- **`assembler.ts`** — Builds path items, collects component schemas, validates no duplicates, adds webhooks (3.1 only)
- **`paths.ts`** — Parses route keys and webhook keys, extracts path params, normalizes `:id` → `{id}`
- **`merge.ts`** — Merges multiple OpenAPI documents (paths, schemas, security schemes, tags, webhooks)
- **`types.ts`** — All TypeScript interfaces; `RouteShorthand` supports status codes as numeric keys, `x-*` vendor extensions via index signatures

### Plugin System

Plugins implement `ToOpenapiPlugin` with optional hooks: `transformRoute`, `transformSchema`, `transformDocument`. Built-in plugins live in `src/plugins/` and are exported as separate entry points (`to-openapi/plugins/bearer-auth`, etc.).

### Testing

- **Unit tests** (`tests/unit/`): test individual modules with `createMockSchema()` / `createMockObjectSchema()` helpers from `tests/helpers/mock-schemas.ts`
- **Integration tests** (`tests/integration/`): end-to-end through both APIs
- **Snapshot tests** (`tests/snapshot/`): validate output against OpenAPI spec validator (`@seriousme/openapi-schema-validator`)
- **Type-level tests** (`tests/type-level/`): `.test-d.ts` files checked via vitest typecheck

### Package Exports

Main export (`to-openapi`) plus separate plugin entry points (`to-openapi/plugins/*`), each with ESM/CJS/types. Configured in `package.json` exports map and `tsup.config.ts` entry points.
