# TypeScript

to-openapi is written in TypeScript and exports all types used in its public API. This page lists every exported type and shows common patterns for type-safe usage.

## All Exported Types

The following types are exported from `to-openapi`:

### Core API Types

| Type | Description |
|---|---|
| `ToOpenapiDefinition` | Input to the `openapi()` function |
| `OpenAPIOptions` | Constructor options for the `OpenAPI` class |
| `OpenAPIDocument` | The generated OpenAPI document |
| `RouteShorthand` | Route definition (used in `paths` and `.route()`) |
| `RouteDefinition` | Route shorthand extended with `method` and `path` |
| `HttpMethod` | `"get" \| "post" \| "put" \| "patch" \| "delete" \| "head" \| "options" \| "trace"` |

### Plugin Types

| Type | Description |
|---|---|
| `ToOpenapiPlugin` | Plugin interface with `transformRoute`, `transformSchema`, and `transformDocument` hooks |
| `SchemaContext` | Context passed to `transformSchema` with `name` and `location` fields |
| `SchemaOrRef` | A JSON Schema object or a `$ref` reference object |

### OpenAPI Object Types

| Type | Description |
|---|---|
| `InfoObject` | API metadata (title, version, description, etc.) |
| `ServerObject` | Server URL and variables |
| `TagObject` | Tag name and description |
| `SecurityRequirementObject` | Security requirement mapping |
| `SecuritySchemeObject` | Security scheme definition (apiKey, http, oauth2, openIdConnect) |
| `PathItemObject` | All operations for a single path |
| `OperationObject` | A single API operation |
| `ParameterObject` | Query, path, header, or cookie parameter |
| `RequestBodyObject` | Request body with content types |
| `ResponseObject` | Response with description and content |
| `MediaTypeObject` | Media type with schema and examples |
| `ComponentsObject` | Reusable components (schemas, security schemes, etc.) |
| `ReferenceObject` | A `$ref` pointer (`{ $ref: string }`) |
| `ExternalDocsObject` | External documentation link |

### Error Types

| Type | Description |
|---|---|
| `ToOpenapiError` | Error class thrown by to-openapi (has `code` and `message`) |
| `ToOpenapiErrorCode` | `"INVALID_ROUTE_KEY" \| "DUPLICATE_PATH" \| "DUPLICATE_SCHEMA" \| "SCHEMA_RESOLUTION_FAILED" \| "INVALID_DEFINITION"` |

### Internal Types

| Type | Description |
|---|---|
| `ParsedRoute` | Parsed route with `method`, `path`, and `pathParams` |

## HttpMethod

The `HttpMethod` type is a union of all HTTP methods supported by OpenAPI:

```ts
import type { HttpMethod } from 'to-openapi'

const method: HttpMethod = 'get'
// Valid: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace'
```

## ToOpenapiErrorCode

Error codes identify the category of error:

```ts
import { ToOpenapiError } from 'to-openapi'
import type { ToOpenapiErrorCode } from 'to-openapi'

function handleError(err: ToOpenapiError) {
  switch (err.code) {
    case 'INVALID_ROUTE_KEY':
      // Malformed "METHOD /path" string
      break
    case 'DUPLICATE_PATH':
      // Same method + path defined twice (in merge)
      break
    case 'DUPLICATE_SCHEMA':
      // Same component schema or security scheme name (in merge)
      break
    case 'SCHEMA_RESOLUTION_FAILED':
      // Schema's jsonSchema.input() threw, or string ref not found
      break
    case 'INVALID_DEFINITION':
      // Invalid definition structure
      break
  }
}
```

## Type-Safe Route Definitions

The `RouteShorthand` type accepts status code keys as numeric index signatures alongside named fields:

```ts
import type { RouteShorthand } from 'to-openapi'

const route: RouteShorthand = {
  summary: 'Get a user by ID',
  tags: ['users'],
  params: UserIdParamsSchema,
  200: UserSchema,
  404: null,
}
```

For full route definitions with method and path, use `RouteDefinition`:

```ts
import type { RouteDefinition } from 'to-openapi'

const route: RouteDefinition = {
  method: 'get',
  path: '/users/{id}',
  summary: 'Get a user by ID',
  params: UserIdParamsSchema,
  200: UserSchema,
  404: null,
}
```

## Type-Safe Plugin Definitions

The `ToOpenapiPlugin` interface defines three optional hooks:

```ts
import type { ToOpenapiPlugin, SchemaContext, SchemaOrRef } from 'to-openapi'

const myPlugin: ToOpenapiPlugin = {
  name: 'my-plugin',

  transformRoute(route) {
    // Modify route definitions before processing
    return { ...route, tags: [...(route.tags ?? []), 'auto-tagged'] }
  },

  transformSchema(schema: SchemaOrRef, context: SchemaContext) {
    // Modify resolved schemas
    // context.location is 'body' | 'query' | 'path' | 'header' | 'response' | 'component'
    return schema
  },

  transformDocument(document) {
    // Modify the final assembled document
    return document
  },
}
```

## Type-Safe OpenAPI Document

The `OpenAPIDocument` type represents the full OpenAPI specification:

```ts
import type { OpenAPIDocument } from 'to-openapi'

function processSpec(doc: OpenAPIDocument) {
  console.log(doc.openapi)    // string ("3.1.0" or "3.0.3")
  console.log(doc.info.title) // string
  console.log(doc.paths)      // Record<string, PathItemObject>

  if (doc.components?.schemas) {
    for (const [name, schema] of Object.entries(doc.components.schemas)) {
      console.log(name, schema)
    }
  }
}
```

## Related

- [Getting Started](/guide/getting-started) -- using the function and class APIs
- [Route Shorthand](/guide/shorthand) -- the `RouteShorthand` type in practice
- [Composing Specs](/guide/composing) -- `merge()` function and error types
