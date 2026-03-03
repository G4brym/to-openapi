# Schemas & $ref

to-openapi works with any schema library that implements the [Standard Schema](https://github.com/standard-schema/standard-schema) interface. This page explains how schemas are resolved, deduplicated, and referenced in the generated OpenAPI document.

## The Standard Schema Interface

A Standard Schema object exposes a `~standard` property with a `jsonSchema` accessor. The `jsonSchema` object has `input()` and `output()` methods that return plain JSON Schema objects:

```ts
const schema = {
  '~standard': {
    version: 1,
    vendor: 'zod',
    jsonSchema: {
      input(options) {
        // Returns JSON Schema based on the target format
        // options.target is 'draft-2020-12' for OpenAPI 3.1
        // or 'openapi-3.0' for OpenAPI 3.0.3
        return { type: 'string' }
      },
      output(options) {
        return { type: 'string' }
      },
    },
  },
}
```

Libraries like Zod, Valibot, and ArkType implement this interface. You do not need to construct these objects manually.

## Auto-Deduplication

When the same schema **object** (by reference identity) is used in multiple places, to-openapi detects this on the second use and automatically extracts it to `components/schemas`. Subsequent uses become `$ref` pointers.

```ts
import { openapi } from 'to-openapi'
import { z } from 'zod'

const ItemSchema = z.object({ name: z.string(), price: z.number() })

const doc = openapi({
  info: { title: 'API', version: '1.0.0' },
  paths: {
    'GET /items': { 200: ItemSchema },
    'POST /items': { body: ItemSchema, 201: ItemSchema },
  },
})

// ItemSchema appears 3 times (same object reference).
// It is extracted once to components/schemas and referenced via $ref.
```

The auto-generated name is derived from the schema's vendor and an internal counter. For predictable names, use named schemas instead.

## Named Schemas

Register schemas by name to control the key used in `components/schemas`.

With the `openapi()` function, use the `schemas` option:

```ts
const doc = openapi({
  info: { title: 'API', version: '1.0.0' },
  schemas: {
    Pet: PetSchema,
    Error: ErrorSchema,
  },
  paths: {
    'GET /pets': { 200: PetSchema },
  },
})
```

With the `OpenAPI` class, use the `.schema()` method:

```ts
const api = new OpenAPI({ info: { title: 'API', version: '1.0.0' } })

api.schema('Pet', PetSchema)
api.schema('Error', ErrorSchema)

api.route('get', '/pets', { 200: PetSchema })
const doc = api.document()
```

## $ref Promotion

Named schemas are always placed in `components/schemas` and referenced via `$ref` wherever they appear:

```json
{
  "components": {
    "schemas": {
      "Pet": {
        "type": "object",
        "properties": {
          "id": { "type": "number" },
          "name": { "type": "string" }
        },
        "required": ["id", "name"]
      }
    }
  },
  "paths": {
    "/pets": {
      "get": {
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Pet" }
              }
            }
          }
        }
      }
    }
  }
}
```

## Inline vs Referenced Schemas

| Scenario | Result |
|---|---|
| Schema used once, not named | Inlined directly in the operation |
| Schema used once, named via `schemas` or `.schema()` | Placed in `components/schemas`, referenced via `$ref` |
| Same schema object used 2+ times, not named | Auto-extracted to `components/schemas` with generated name |
| Same schema object used 2+ times, named | Placed in `components/schemas` under the given name |

## String References

You can reference a named schema by its string name in response definitions:

```ts
const doc = openapi({
  info: { title: 'API', version: '1.0.0' },
  schemas: { Pet: PetSchema },
  paths: {
    'GET /pets/:id': {
      200: 'Pet', // Resolves to { $ref: '#/components/schemas/Pet' }
    },
  },
})
```

If the string does not match a registered schema name, a `SCHEMA_RESOLUTION_FAILED` error is thrown.

## Related

- [Responses](/guide/responses) -- all response definition styles
- [Extending Schemas](/guide/extending) -- adding OpenAPI-specific fields to schemas
- [Request Parameters](/guide/request-params) -- how parameter schemas are resolved
