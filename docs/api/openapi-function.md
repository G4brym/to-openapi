# `openapi()` Function

The `openapi()` function is the primary declarative API for generating an OpenAPI document from a single definition object. It accepts a complete specification of your API -- info, routes, schemas, plugins, and metadata -- and returns a frozen `OpenAPIDocument`.

## Import

```ts
import { openapi } from 'to-openapi'
```

## Signature

```ts
function openapi(definition: ToOpenapiDefinition): OpenAPIDocument
```

## Parameters

### `definition: ToOpenapiDefinition`

A single object describing the entire API. The full interface is:

```ts
interface ToOpenapiDefinition {
  info: InfoObject
  paths: Record<string, RouteShorthand>
  schemas?: Record<string, StandardJSONSchemaV1>
  plugins?: ToOpenapiPlugin[]
  openapi?: "3.0.3" | "3.1.0"
  servers?: ServerObject[]
  security?: SecurityRequirementObject[]
  securitySchemes?: Record<string, SecuritySchemeObject>
  tags?: TagObject[]
  externalDocs?: ExternalDocsObject
}
```

#### `info` (required)

Type: `InfoObject`

Metadata about the API. This maps directly to the OpenAPI `info` object.

```ts
interface InfoObject {
  title: string
  version: string
  description?: string
  termsOfService?: string
  contact?: {
    name?: string
    url?: string
    email?: string
  }
  license?: {
    name: string
    url?: string
  }
}
```

- `title` (required) -- the name of your API.
- `version` (required) -- the version string for your API (e.g. `"1.0.0"`).
- `description` -- a longer description of the API. Supports Markdown.
- `termsOfService` -- a URL to the terms of service.
- `contact` -- contact information (name, url, email).
- `license` -- license information with a required `name` and optional `url`.

#### `paths` (required)

Type: `Record<string, RouteShorthand>`

An object whose keys are route keys in the format `"METHOD /path"` and whose values are route shorthand definitions. The method is case-insensitive (e.g. `"GET /users"` and `"get /users"` are both valid) and the path must start with `/`.

```ts
{
  "GET /users": { ... },
  "POST /users": { ... },
  "GET /users/{id}": { ... },
  "DELETE /users/{id}": { ... },
}
```

See the [Types reference](./types.md) for the full `RouteShorthand` interface.

#### `schemas` (optional)

Type: `Record<string, StandardJSONSchemaV1>`

Named schemas that will be placed in `components.schemas` in the output document. Other routes can reference these schemas via `$ref`. Each key becomes the schema name in the components section.

```ts
{
  schemas: {
    User: userSchema,
    Error: errorSchema,
  }
}
```

#### `plugins` (optional)

Type: `ToOpenapiPlugin[]`

An array of plugins that can transform routes, schemas, and the final document during generation. See the [Plugin Interface](./plugin-interface.md) reference for details.

#### `openapi` (optional)

Type: `"3.0.3" | "3.1.0"`

Default: `"3.1.0"`

The OpenAPI specification version to target. This affects how schemas are resolved and output.

#### `servers` (optional)

Type: `ServerObject[]`

A list of server objects describing where the API is hosted.

```ts
interface ServerObject {
  url: string
  description?: string
  variables?: Record<string, {
    default: string
    enum?: string[]
    description?: string
  }>
}
```

#### `security` (optional)

Type: `SecurityRequirementObject[]`

Global security requirements applied to all operations unless overridden at the operation level.

```ts
interface SecurityRequirementObject {
  [name: string]: string[]
}
```

#### `securitySchemes` (optional)

Type: `Record<string, SecuritySchemeObject>`

Security scheme definitions that will be placed in `components.securitySchemes`.

```ts
interface SecuritySchemeObject {
  type: "apiKey" | "http" | "oauth2" | "openIdConnect"
  description?: string
  name?: string
  in?: "query" | "header" | "cookie"
  scheme?: string
  bearerFormat?: string
  flows?: Record<string, unknown>
  openIdConnectUrl?: string
}
```

#### `tags` (optional)

Type: `TagObject[]`

Tag definitions for grouping operations.

```ts
interface TagObject {
  name: string
  description?: string
  externalDocs?: ExternalDocsObject
}
```

#### `externalDocs` (optional)

Type: `ExternalDocsObject`

A pointer to external documentation for the API.

```ts
interface ExternalDocsObject {
  url: string
  description?: string
}
```

## Return Value

Returns a deeply frozen `OpenAPIDocument` object. The document is frozen using `Object.freeze` recursively, making it fully immutable. Attempting to modify any property on the returned document will throw a `TypeError` in strict mode.

## Full Example

```ts
import { openapi } from 'to-openapi'
import { z } from 'zod'
import { toJsonSchema } from '@valibot/to-json-schema'

const doc = openapi({
  openapi: '3.1.0',
  info: {
    title: 'Pet Store API',
    version: '1.0.0',
    description: 'A sample API for managing pets',
    contact: {
      name: 'API Support',
      email: 'support@petstore.example.com',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    { url: 'https://api.petstore.example.com/v1', description: 'Production' },
    { url: 'http://localhost:3000/v1', description: 'Local development' },
  ],
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'pets', description: 'Pet management' },
    { name: 'health', description: 'Health checks' },
  ],
  schemas: {
    Pet: z.object({
      id: z.string().uuid(),
      name: z.string(),
      species: z.enum(['dog', 'cat', 'bird']),
    }),
    Error: z.object({
      code: z.number(),
      message: z.string(),
    }),
  },
  paths: {
    'GET /pets': {
      summary: 'List all pets',
      tags: ['pets'],
      query: z.object({
        limit: z.number().int().optional(),
        offset: z.number().int().optional(),
      }),
      200: z.array(z.object({
        id: z.string(),
        name: z.string(),
        species: z.string(),
      })),
    },
    'POST /pets': {
      summary: 'Create a pet',
      tags: ['pets'],
      body: z.object({
        name: z.string(),
        species: z.enum(['dog', 'cat', 'bird']),
      }),
      201: z.object({
        id: z.string(),
        name: z.string(),
        species: z.string(),
      }),
      400: z.object({
        code: z.number(),
        message: z.string(),
      }),
    },
    'GET /pets/{id}': {
      summary: 'Get a pet by ID',
      tags: ['pets'],
      params: z.object({
        id: z.string().uuid(),
      }),
      200: z.object({
        id: z.string(),
        name: z.string(),
        species: z.string(),
      }),
      404: null,
    },
    'GET /health': {
      summary: 'Health check',
      tags: ['health'],
      security: [],
      200: z.object({ status: z.literal('ok') }),
    },
  },
})

// doc is a frozen OpenAPIDocument
console.log(JSON.stringify(doc, null, 2))
```

## Notes

- The route key format must be `"METHOD /path"` where method is one of: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`, `TRACE` (case-insensitive). An invalid route key throws a `ToOpenapiError` with code `INVALID_ROUTE_KEY`.
- Duplicate method+path combinations within the same definition throw a `ToOpenapiError` with code `DUPLICATE_PATH`.
- Duplicate schema names throw a `ToOpenapiError` with code `DUPLICATE_SCHEMA`.
- Numeric keys in a route shorthand (e.g. `200`, `404`) are treated as HTTP status code responses.
- A string value for a status code (e.g. `200: 'User'`) is treated as a reference to a named schema registered via `schemas`. The string must match a registered schema name.
- A `null` value for a status code produces a response with no content body.
- If you need to build the document incrementally, consider using the [`OpenAPI` class](./openapi-class.md) instead.
