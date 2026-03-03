# Plugin Interface

Plugins let you transform routes, schemas, and the final document during OpenAPI generation. They are specified as an array in the `plugins` field of `ToOpenapiDefinition` or `OpenAPIOptions`.

## Import

Plugins use the `ToOpenapiPlugin` type:

```ts
import type { ToOpenapiPlugin, RouteDefinition, SchemaOrRef, SchemaContext, OpenAPIDocument } from 'to-openapi'
```

## `ToOpenapiPlugin` Interface

```ts
interface ToOpenapiPlugin {
  name: string
  transformRoute?: (route: RouteDefinition) => RouteDefinition
  transformSchema?: (schema: SchemaOrRef, context: SchemaContext) => SchemaOrRef
  transformDocument?: (document: OpenAPIDocument) => OpenAPIDocument
}
```

### `name`

Type: `string` (required)

A human-readable name for the plugin. Used for debugging and identification. Each plugin must have a `name`.

### `transformRoute`

Type: `(route: RouteDefinition) => RouteDefinition` (optional)

Called once for each route **before** the route is expanded into an OpenAPI operation. Receives the full `RouteDefinition` (which includes the `method`, `path`, and all shorthand fields) and must return a `RouteDefinition`.

Use this hook to:

- Add default tags to routes.
- Inject standard response codes (e.g. `401`, `500`) into every route.
- Modify paths or operation metadata.
- Add security requirements conditionally.

```ts
interface RouteDefinition extends RouteShorthand {
  method: HttpMethod
  path: string
}
```

### `transformSchema`

Type: `(schema: SchemaOrRef, context: SchemaContext) => SchemaOrRef` (optional)

Called for each schema encountered during schema resolution for request bodies and responses. Receives the resolved JSON schema (or `$ref` object) and a `SchemaContext` describing where the schema appears.

Use this hook to:

- Add metadata (descriptions, examples) to schemas based on their location.
- Transform schema formats or properties.
- Replace schemas with `$ref` references.
- Strip or add keywords based on the target OpenAPI version.

### `transformDocument`

Type: `(document: OpenAPIDocument) => OpenAPIDocument` (optional)

Called once after the complete OpenAPI document has been assembled, but before it is frozen. Receives the full `OpenAPIDocument` and must return an `OpenAPIDocument`.

Use this hook to:

- Add or modify top-level fields (servers, security, tags).
- Post-process paths or components.
- Inject custom extensions (`x-` prefixed fields).
- Sort operations or paths.

## `SchemaContext` Type

```ts
interface SchemaContext {
  name?: string
  location: "body" | "query" | "path" | "header" | "response" | "component"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string \| undefined` | The component schema name, if the schema is being resolved as a named component. Otherwise `undefined`. |
| `location` | `"body" \| "response"` | Where the schema is being used in the OpenAPI document. |

### Location Values

- `"body"` -- the schema is used as a request body.
- `"response"` -- the schema is used as a response body.

::: info
The `SchemaContext` type also includes `"query"`, `"path"`, `"header"`, and `"component"` as possible location values for future extensibility, but `transformSchema` is currently only invoked for `"body"` and `"response"` schemas.
:::

## Execution Order

Plugins are executed in the order they appear in the `plugins` array. The overall execution flow is:

```
1. transformRoute    -- called for each route (all plugins, in order)
2. schema resolution -- schemas are resolved to JSON Schema
   2a. transformSchema  -- called for each schema during resolution (all plugins, in order)
3. document assembly -- paths, components, and metadata are assembled
4. transformDocument -- called once on the final document (all plugins, in order)
```

Within each phase, plugins are applied sequentially: the output of one plugin's hook becomes the input to the next plugin's hook.

## Minimal Plugin Example

A plugin that adds a `500` response to every route:

```ts
import type { ToOpenapiPlugin } from 'to-openapi'

const errorResponsePlugin: ToOpenapiPlugin = {
  name: 'error-response',
  transformRoute(route) {
    return {
      ...route,
      500: route[500] ?? null,
    }
  },
}
```

## More Examples

### Auto-Tagging Plugin

A plugin that assigns tags to routes based on their path prefix:

```ts
import type { ToOpenapiPlugin } from 'to-openapi'

const autoTagPlugin: ToOpenapiPlugin = {
  name: 'auto-tag',
  transformRoute(route) {
    if (route.tags && route.tags.length > 0) {
      return route
    }
    const segment = route.path.split('/')[1]
    if (segment) {
      return { ...route, tags: [segment] }
    }
    return route
  },
}

// Usage:
// route('get', '/users', { ... })      -> tags: ['users']
// route('get', '/orders/{id}', { ... }) -> tags: ['orders']
```

### Schema Description Plugin

A plugin that adds descriptions to schemas based on their context:

```ts
import type { ToOpenapiPlugin } from 'to-openapi'

const schemaDescriptionPlugin: ToOpenapiPlugin = {
  name: 'schema-description',
  transformSchema(schema, context) {
    if ('$ref' in schema) return schema

    if (context.location === 'response' && !schema.description) {
      return {
        ...schema,
        description: `Response schema${context.name ? ` for ${context.name}` : ''}`,
      }
    }
    return schema
  },
}
```

### Custom Extension Plugin

A plugin that adds custom `x-` extensions to the final document:

```ts
import type { ToOpenapiPlugin, OpenAPIDocument } from 'to-openapi'

const customExtensionPlugin: ToOpenapiPlugin = {
  name: 'custom-extensions',
  transformDocument(document) {
    return {
      ...document,
      'x-generated-by': 'to-openapi',
      'x-generated-at': new Date().toISOString(),
    } as OpenAPIDocument
  },
}
```

### Path Sorting Plugin

A plugin that sorts paths alphabetically in the final document:

```ts
import type { ToOpenapiPlugin } from 'to-openapi'

const sortPathsPlugin: ToOpenapiPlugin = {
  name: 'sort-paths',
  transformDocument(document) {
    const sortedPaths = Object.keys(document.paths)
      .sort()
      .reduce((acc, key) => {
        acc[key] = document.paths[key]!
        return acc
      }, {} as typeof document.paths)

    return { ...document, paths: sortedPaths }
  },
}
```

## Using Plugins

Plugins are passed via the `plugins` field in the definition or options:

```ts
import { openapi, OpenAPI } from 'to-openapi'

// With the openapi() function
const doc = openapi({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [errorResponsePlugin, autoTagPlugin, sortPathsPlugin],
  paths: {
    'GET /users': { 200: usersSchema },
  },
})

// With the OpenAPI class
const doc2 = new OpenAPI({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [errorResponsePlugin, autoTagPlugin, sortPathsPlugin],
})
  .route('get', '/users', { 200: usersSchema })
  .document()
```

Multiple plugins compose naturally. They are applied in array order, so place plugins that add routes/schemas before plugins that transform the final document.
