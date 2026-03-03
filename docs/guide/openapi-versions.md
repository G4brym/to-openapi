# OpenAPI Versions

to-openapi supports both OpenAPI 3.1.0 and OpenAPI 3.0.3. The version affects how schemas are resolved and the format of the output document.

## Default Version

The default version is `3.1.0`:

```ts
import { openapi } from 'to-openapi'

const doc = openapi({
  info: { title: 'API', version: '1.0.0' },
  paths: {
    'GET /health': { 200: null },
  },
})

console.log(doc.openapi) // "3.1.0"
```

## Setting OpenAPI 3.0.3

Pass `openapi: '3.0.3'` to use the older specification version.

With the `openapi()` function:

```ts
import { openapi } from 'to-openapi'

const doc = openapi({
  openapi: '3.0.3',
  info: { title: 'API', version: '1.0.0' },
  paths: {
    'GET /health': { 200: null },
  },
})

console.log(doc.openapi) // "3.0.3"
```

With the `OpenAPI` class:

```ts
import { OpenAPI } from 'to-openapi'

const api = new OpenAPI({
  openapi: '3.0.3',
  info: { title: 'API', version: '1.0.0' },
})

api.route('get', '/health', { 200: null })

const doc = api.document()
console.log(doc.openapi) // "3.0.3"
```

## Key Differences

The version you choose determines the JSON Schema target passed to your schema library's Standard Schema implementation:

| OpenAPI Version | JSON Schema Target | Standard Schema `options.target` |
|---|---|---|
| 3.1.0 | JSON Schema Draft 2020-12 | `"draft-2020-12"` |
| 3.0.3 | Modified JSON Schema subset | `"openapi-3.0"` |

### What this means in practice

**OpenAPI 3.1.0** uses full JSON Schema Draft 2020-12. Nullable types are expressed as `{ "type": ["string", "null"] }`. The `examples` keyword is supported.

**OpenAPI 3.0.3** uses a modified subset of JSON Schema Draft 4. Nullable types use the `nullable: true` keyword. Some JSON Schema features like `if`/`then`/`else` are not available.

Your schema library handles this conversion through the Standard Schema interface. When to-openapi resolves a schema, it passes the appropriate `target` value, and the library returns JSON Schema in the correct format.

## When to Use 3.0.3

Use OpenAPI 3.0.3 when:

- Your tooling (Swagger UI, code generators, API gateways) does not yet support 3.1.0.
- You need compatibility with consumers that expect the 3.0.x format.

Use OpenAPI 3.1.0 (the default) when:

- You want full JSON Schema compatibility.
- Your tooling supports the newer spec.

## Related

- [Getting Started](/guide/getting-started) -- installation and first spec
- [Schemas & $ref](/guide/schemas) -- how schemas are resolved
