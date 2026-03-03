# Getting Started

## Installation

```bash
npm install to-openapi
```

to-openapi has a single peer dependency on `@standard-schema/spec` for type definitions. Your schema library (Zod, Valibot, ArkType, etc.) must implement the Standard Schema interface.

## Your First Spec with `openapi()`

The `openapi()` function takes a single declarative definition object and returns a complete OpenAPI document.

```ts
import { openapi } from 'to-openapi'
import { z } from 'zod'

const PetSchema = z.object({
  id: z.number(),
  name: z.string(),
})

const doc = openapi({
  info: { title: 'Pet Store', version: '1.0.0' },
  paths: {
    'GET /pets': {
      summary: 'List all pets',
      200: PetSchema,
    },
  },
})
```

The route key `"GET /pets"` defines both the HTTP method and path. The `200` key defines a response -- the schema is automatically wrapped in `application/json` content.

## Your First Spec with `OpenAPI`

The `OpenAPI` class provides a builder-style API. Call `.route()` to add routes and `.document()` to produce the final output.

```ts
import { OpenAPI } from 'to-openapi'
import { z } from 'zod'

const PetSchema = z.object({
  id: z.number(),
  name: z.string(),
})

const api = new OpenAPI({
  info: { title: 'Pet Store', version: '1.0.0' },
})

api.route('get', '/pets', {
  summary: 'List all pets',
  200: PetSchema,
})

const doc = api.document()
```

The `.route()` method takes the HTTP method, path, and a route shorthand object. The shorthand format is the same as in the declarative API.

## Choosing Between the Two APIs

Both APIs produce identical output. The choice depends on your use case.

| | `openapi()` function | `OpenAPI` class |
|---|---|---|
| **Style** | Declarative, single object | Imperative, builder pattern |
| **Best for** | Static specs, config files | Dynamic route registration |
| **Schema registration** | `schemas` option in definition | `.schema()` method |
| **Route registration** | All at once in `paths` | One at a time via `.route()` |

Use `openapi()` when you know all your routes up front. Use the `OpenAPI` class when routes are registered dynamically -- for example, from a plugin system or framework middleware.

## Output

The returned `doc` is a plain JavaScript object conforming to the OpenAPI 3.1.0 specification. Serialize it however you like:

```ts
// JSON output
const json = JSON.stringify(doc, null, 2)

// Write to file
import { writeFileSync } from 'node:fs'
writeFileSync('openapi.json', JSON.stringify(doc, null, 2))
```

The document is deeply frozen (immutable). Attempting to modify it will throw in strict mode.

## Next Steps

- [Route Shorthand](/guide/shorthand) -- the full route definition format
- [Schemas & $ref](/guide/schemas) -- how schemas become `$ref` references
- [Responses](/guide/responses) -- all response definition styles
