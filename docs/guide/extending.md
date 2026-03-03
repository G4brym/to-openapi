# Schema Extensions

The `extend()` function adds OpenAPI-specific fields to Standard Schema objects. Use it when your schema library does not natively support certain JSON Schema or OpenAPI keywords.

## Import

```ts
import { extend } from 'to-openapi'
```

## Basic Usage

`extend()` takes a Standard Schema object and an overlay object. It returns a new Standard Schema object whose JSON Schema output is the deep-merge of the original schema's output and the overlay.

```ts
import { extend } from 'to-openapi'
import { z } from 'zod'

const EmailSchema = extend(z.string().email(), {
  description: 'A valid email address',
  example: 'user@example.com',
})
```

When to-openapi resolves `EmailSchema`, the resulting JSON Schema will include both the original `type: "string"` (with any format from Zod) and the added `description` and `example` fields.

## How It Works

`extend()` wraps the original schema's `~standard.jsonSchema.input()` and `~standard.jsonSchema.output()` methods. When either is called, it:

1. Calls the original method to get the base JSON Schema.
2. Deep-merges the overlay into the result.
3. Returns the merged object.

The original schema is not mutated. A new Standard Schema-compatible object is returned.

Deep merging means nested objects are merged recursively, while scalar values and arrays in the overlay replace those in the base.

## Examples

### Adding a Description

```ts
const NameSchema = extend(z.string(), {
  description: 'Full name of the user',
})
```

### Adding Example Values

```ts
const AgeSchema = extend(z.number().int().min(0).max(150), {
  example: 25,
})
```

### Setting Format

```ts
const DateSchema = extend(z.string(), {
  format: 'date-time',
  description: 'ISO 8601 date-time string',
})
```

### Adding Enum Documentation

```ts
const StatusSchema = extend(z.enum(['active', 'inactive', 'pending']), {
  description: 'Account status',
  example: 'active',
})
```

### Nested Object Overlay

The overlay is deep-merged, so you can extend nested structures:

```ts
const ItemSchema = extend(
  z.object({ name: z.string(), price: z.number() }),
  {
    description: 'A product item',
    properties: {
      price: { example: 9.99 },
    },
  },
)
```

## Using with Route Definitions

Extended schemas work anywhere a Standard Schema is accepted:

```ts
import { openapi, extend } from 'to-openapi'
import { z } from 'zod'

const PetSchema = extend(
  z.object({
    id: z.number(),
    name: z.string(),
    status: z.enum(['available', 'adopted']),
  }),
  {
    description: 'A pet in the store',
  },
)

const doc = openapi({
  info: { title: 'Pet Store', version: '1.0.0' },
  schemas: { Pet: PetSchema },
  paths: {
    'GET /pets': { 200: PetSchema },
    'POST /pets': { body: PetSchema, 201: PetSchema },
  },
})
```

The `description: 'A pet in the store'` will appear in the resolved schema within `components/schemas/Pet`.

## Related

- [Schemas & $ref](/guide/schemas) -- how schemas are resolved and referenced
- [Route Shorthand](/guide/shorthand) -- where schemas are used in route definitions
- [TypeScript](/guide/typescript) -- type signatures for `extend()`
