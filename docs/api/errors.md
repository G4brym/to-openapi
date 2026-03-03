# Errors

All errors thrown by `to-openapi` are instances of `ToOpenapiError`, a custom error class with a machine-readable `code` property for programmatic error handling.

## Import

```ts
import { ToOpenapiError } from 'to-openapi'
import type { ToOpenapiErrorCode } from 'to-openapi'
```

## `ToOpenapiError` Class

```ts
class ToOpenapiError extends Error {
  readonly code: ToOpenapiErrorCode
  readonly name: "ToOpenapiError"

  constructor(code: ToOpenapiErrorCode, message: string)
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `code` | `ToOpenapiErrorCode` | A machine-readable error code identifying the type of error. |
| `message` | `string` | A human-readable description of what went wrong. |
| `name` | `"ToOpenapiError"` | Always the string `"ToOpenapiError"`. Useful for `instanceof` checks and serialization. |

The class extends the built-in `Error` and correctly sets up the prototype chain via `Object.setPrototypeOf`, ensuring that `instanceof ToOpenapiError` works reliably in all environments.

## Error Codes

### `ToOpenapiErrorCode`

```ts
type ToOpenapiErrorCode =
  | "INVALID_ROUTE_KEY"
  | "DUPLICATE_PATH"
  | "DUPLICATE_SCHEMA"
  | "SCHEMA_RESOLUTION_FAILED"
  | "INVALID_DEFINITION"
```

---

### `INVALID_ROUTE_KEY`

Thrown when a route key in `ToOpenapiDefinition.paths` does not match the expected `"METHOD /path"` format.

The method must be a valid uppercase HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`, `TRACE`) and the path must start with `/`.

**Common causes:**

- Missing space between method and path: `"GET/users"`.
- Lowercase method: `"get /users"` (route keys require uppercase methods).
- Missing leading slash: `"GET users"`.
- Invalid method: `"FETCH /users"`.

**Example trigger:**

```ts
openapi({
  info: { title: 'API', version: '1.0.0' },
  paths: {
    'INVALID': { 200: null },  // throws INVALID_ROUTE_KEY
  },
})
```

---

### `DUPLICATE_PATH`

Thrown when the same HTTP method + path combination is defined more than once. This can occur:

- Within a single `ToOpenapiDefinition.paths` object.
- When using `merge()` and two source documents define the same method on the same path.

**Example trigger:**

```ts
import { merge } from 'to-openapi'

// Both documents define GET /users
const merged = merge(docA, docB)  // throws DUPLICATE_PATH
```

---

### `DUPLICATE_SCHEMA`

Thrown when a component name collision occurs. This applies to:

- Duplicate schema names in `components.schemas` during `merge()`.
- Duplicate security scheme names in `components.securitySchemes` during `merge()`.

**Example trigger:**

```ts
import { merge } from 'to-openapi'

// Both documents define a "User" component schema
const merged = merge(docA, docB)  // throws DUPLICATE_SCHEMA
```

---

### `SCHEMA_RESOLUTION_FAILED`

Thrown when a Standard Schema cannot be resolved to a JSON Schema representation. This typically occurs when:

- A schema object does not conform to the `@standard-schema/spec` `StandardJSONSchemaV1` interface.
- The schema's `jsonSchema.input()` or `jsonSchema.output()` method returns an invalid result.

**Example trigger:**

```ts
openapi({
  info: { title: 'API', version: '1.0.0' },
  paths: {
    'GET /test': {
      200: { invalid: 'not a valid schema' } as any,  // throws SCHEMA_RESOLUTION_FAILED
    },
  },
})
```

---

### `INVALID_DEFINITION`

Thrown when the overall definition object is structurally invalid. This is a catch-all for definition-level validation errors that do not fit the other categories.

---

## Catching Errors

### By Instance

```ts
import { openapi, ToOpenapiError } from 'to-openapi'

try {
  const doc = openapi(definition)
} catch (error) {
  if (error instanceof ToOpenapiError) {
    console.error(`[${error.code}] ${error.message}`)
  }
}
```

### By Error Code

```ts
import { openapi, ToOpenapiError } from 'to-openapi'

try {
  const doc = openapi(definition)
} catch (error) {
  if (error instanceof ToOpenapiError) {
    switch (error.code) {
      case 'INVALID_ROUTE_KEY':
        console.error('Bad route key:', error.message)
        break
      case 'DUPLICATE_PATH':
        console.error('Duplicate route:', error.message)
        break
      case 'DUPLICATE_SCHEMA':
        console.error('Duplicate schema:', error.message)
        break
      case 'SCHEMA_RESOLUTION_FAILED':
        console.error('Schema error:', error.message)
        break
      case 'INVALID_DEFINITION':
        console.error('Invalid definition:', error.message)
        break
    }
  }
}
```

### With `merge()`

```ts
import { merge, ToOpenapiError } from 'to-openapi'

try {
  const merged = merge(base, serviceA, serviceB, serviceC)
} catch (error) {
  if (error instanceof ToOpenapiError) {
    if (error.code === 'DUPLICATE_PATH') {
      console.error('Two services define the same endpoint:', error.message)
    }
    if (error.code === 'DUPLICATE_SCHEMA') {
      console.error('Two services define the same component:', error.message)
    }
  }
}
```

### Checking Error Name

Since `ToOpenapiError` sets `this.name = "ToOpenapiError"`, you can also check the `name` property in contexts where `instanceof` may not work (e.g. across module boundaries):

```ts
try {
  const doc = openapi(definition)
} catch (error) {
  if (error instanceof Error && error.name === 'ToOpenapiError') {
    const toaError = error as ToOpenapiError
    console.error(`[${toaError.code}] ${toaError.message}`)
  }
}
```
