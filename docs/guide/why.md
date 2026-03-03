# Why to-openapi?

## The Problem

Generating OpenAPI specifications from code should be straightforward. In practice, it is not.

**Schema-library coupling.** Most OpenAPI generators are tightly coupled to a single schema library. `zod-to-openapi` only works with Zod. `@hono/zod-openapi` only works with Zod inside Hono. If you switch schema libraries -- from Zod to Valibot, ArkType, or TypeBox -- you throw away your OpenAPI tooling and start over.

**Manual spec writing.** The alternative is writing OpenAPI YAML or JSON by hand. This works but is tedious, error-prone, and disconnected from the types your code actually uses. Schemas drift from reality over time.

## The Solution

to-openapi uses the [Standard Schema](https://github.com/standard-schema/standard-schema) interface as a universal adapter. Any schema library that implements Standard Schema -- Zod, Valibot, ArkType, and others -- works with to-openapi out of the box. No plugins, no adapters, no lock-in.

```
Schema Library  -->  Standard Schema  -->  to-openapi  -->  OpenAPI 3.1
(Zod, Valibot,      (~standard.jsonSchema)                  (or 3.0.3)
 ArkType, etc.)
```

Your schema library produces JSON Schema through the Standard Schema interface. to-openapi consumes that JSON Schema and assembles a complete OpenAPI document with proper `$ref` handling, parameter extraction, and response definitions.

## Comparison

| Feature | to-openapi | zod-to-openapi | @hono/zod-openapi |
|---|---|---|---|
| **Schema Support** | Any Standard Schema library | Zod only | Zod only |
| **API Style** | Declarative function + builder class | Builder class | Hono route integration |
| **Plugin System** | Yes (transform routes, schemas, documents) | No | No |
| **Spec Merging** | Built-in `merge()` function | Manual | Manual |
| **OpenAPI Versions** | 3.1.0 and 3.0.3 | 3.0.x and 3.1.x | 3.0.x |

## Design Principles

- **Schema-agnostic.** Works with any library that implements the Standard Schema interface.
- **Two APIs.** A declarative `openapi()` function for simple cases and an `OpenAPI` builder class for dynamic construction. Same output either way.
- **Automatic `$ref` deduplication.** When the same schema object appears in multiple places, it is automatically extracted to `components/schemas` and referenced via `$ref`.
- **Composable.** The `merge()` function combines multiple OpenAPI documents. Build specs per-module, per-team, or per-service and merge them at the boundary.
- **Immutable output.** The returned document is deeply frozen. No accidental mutations.

## Next Steps

- [Getting Started](/guide/getting-started) -- install and build your first spec
- [Route Shorthand](/guide/shorthand) -- the concise route definition format
- [Schemas & $ref](/guide/schemas) -- how schemas are resolved and deduplicated
