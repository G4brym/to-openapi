# Types

All types are exported from the main `to-openapi` package and can be imported for use in your TypeScript code.

```ts
import type {
  HttpMethod,
  ReferenceObject,
  SchemaOrRef,
  InfoObject,
  ServerObject,
  ExternalDocsObject,
  TagObject,
  SecurityRequirementObject,
  SecuritySchemeObject,
  MediaTypeObject,
  ParameterObject,
  RequestBodyObject,
  ResponseObject,
  ExampleObject,
  HeaderObject,
  ResponseShorthandObject,
  BodyShorthandObject,
  OperationObject,
  PathItemObject,
  ComponentsObject,
  OpenAPIDocument,
  SchemaContext,
  RouteShorthand,
  RouteDefinition,
  ParsedRoute,
  ToOpenapiPlugin,
  ToOpenapiDefinition,
  OpenAPIOptions,
  ToOpenapiErrorCode,
} from 'to-openapi'
```

## Type Reference

### `HttpMethod`

The set of supported HTTP methods.

```ts
type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "head" | "options" | "trace"
```

---

### `ReferenceObject`

A JSON Reference object as used in OpenAPI.

```ts
interface ReferenceObject {
  $ref: string
}
```

---

### `SchemaOrRef`

A union of a generic schema object or a reference object.

```ts
type SchemaOrRef = Record<string, unknown> | ReferenceObject
```

---

### `InfoObject`

API metadata corresponding to the OpenAPI Info Object.

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

---

### `ServerObject`

Describes a server (host) for the API.

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

---

### `ExternalDocsObject`

A link to external documentation.

```ts
interface ExternalDocsObject {
  url: string
  description?: string
}
```

---

### `TagObject`

Metadata for a tag used to group operations.

```ts
interface TagObject {
  name: string
  description?: string
  externalDocs?: ExternalDocsObject
}
```

---

### `SecurityRequirementObject`

Specifies which security schemes are required for an operation.

```ts
interface SecurityRequirementObject {
  [name: string]: string[]
}
```

Each key is the name of a security scheme defined in `components.securitySchemes`. The value is an array of scope names (for OAuth2) or an empty array for other scheme types.

---

### `SecuritySchemeObject`

Defines a security scheme for the API.

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

---

### `MediaTypeObject`

Describes a media type with its schema and examples.

```ts
interface MediaTypeObject {
  schema?: SchemaOrRef
  example?: unknown
  examples?: Record<string, unknown>
  encoding?: Record<string, unknown>
}
```

---

### `ParameterObject`

Describes a single operation parameter.

```ts
interface ParameterObject {
  name: string
  in: "query" | "header" | "path" | "cookie"
  description?: string
  required?: boolean
  deprecated?: boolean
  schema?: SchemaOrRef
  style?: string
  explode?: boolean
}
```

---

### `RequestBodyObject`

Describes the request body for an operation.

```ts
interface RequestBodyObject {
  description?: string
  content: Record<string, MediaTypeObject>
  required?: boolean
}
```

---

### `ResponseObject`

Describes a single response from an operation.

```ts
interface ResponseObject {
  description: string
  headers?: Record<string, unknown>
  content?: Record<string, MediaTypeObject>
  links?: Record<string, unknown>
}
```

---

### `ExampleObject`

Describes an example value for a media type.

```ts
interface ExampleObject {
  summary?: string
  description?: string
  value?: unknown
  externalValue?: string
}
```

---

### `HeaderObject`

Describes a single response header.

```ts
interface HeaderObject {
  schema?: SchemaOrRef
  description?: string
  required?: boolean
  example?: unknown
}
```

---

### `ResponseShorthandObject`

A shorthand for defining responses with custom content types, headers, or examples.

```ts
interface ResponseShorthandObject {
  schema?: StandardJSONSchemaV1 | string
  contentType?: string
  description?: string
  headers?: Record<string, HeaderObject>
  example?: unknown
  examples?: Record<string, ExampleObject>
}
```

When `schema` is omitted, it is inferred from `contentType` (`text/*` → `{ type: "string" }`, `application/octet-stream` → `{ type: "string", format: "binary" }`).

---

### `BodyShorthandObject`

A shorthand for defining request bodies with custom content types or examples.

```ts
interface BodyShorthandObject {
  schema?: StandardJSONSchemaV1
  contentType?: string
  description?: string
  required?: boolean
  example?: unknown
  examples?: Record<string, ExampleObject>
}
```

---

### `OperationObject`

Describes a single API operation on a path.

```ts
interface OperationObject {
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  deprecated?: boolean
  security?: SecurityRequirementObject[]
  parameters?: ParameterObject[]
  requestBody?: RequestBodyObject
  responses?: Record<string, ResponseObject | ReferenceObject>
  externalDocs?: ExternalDocsObject
}
```

---

### `PathItemObject`

Describes the operations available on a single path.

```ts
interface PathItemObject {
  summary?: string
  description?: string
  get?: OperationObject
  post?: OperationObject
  put?: OperationObject
  patch?: OperationObject
  delete?: OperationObject
  head?: OperationObject
  options?: OperationObject
  trace?: OperationObject
  parameters?: ParameterObject[]
}
```

---

### `ComponentsObject`

Holds reusable schema and security scheme definitions.

```ts
interface ComponentsObject {
  schemas?: Record<string, SchemaOrRef>
  securitySchemes?: Record<string, SecuritySchemeObject>
  responses?: Record<string, ResponseObject>
  parameters?: Record<string, ParameterObject>
  requestBodies?: Record<string, RequestBodyObject>
}
```

---

### `OpenAPIDocument`

The root OpenAPI document object.

```ts
interface OpenAPIDocument {
  openapi: string
  info: InfoObject
  servers?: ServerObject[]
  paths: Record<string, PathItemObject>
  components?: ComponentsObject
  security?: SecurityRequirementObject[]
  tags?: TagObject[]
  externalDocs?: ExternalDocsObject
}
```

---

### `SchemaContext`

Context passed to `transformSchema` plugin hooks, describing where a schema appears in the document.

```ts
interface SchemaContext {
  name?: string
  location: "body" | "query" | "path" | "header" | "response" | "component"
}
```

- `name` -- the component schema name, if the schema is a named component.
- `location` -- where the schema is being used. Currently `transformSchema` is invoked with:
  - `"body"` -- request body schema
  - `"response"` -- response body schema

---

### `RouteShorthand`

The shorthand format for defining a route. Used as the value type in `ToOpenapiDefinition.paths` and as the `definition` parameter in `OpenAPI.route()`.

```ts
interface RouteShorthand {
  query?: StandardJSONSchemaV1
  params?: StandardJSONSchemaV1
  headers?: StandardJSONSchemaV1
  cookies?: StandardJSONSchemaV1
  body?: StandardJSONSchemaV1 | RequestBodyObject | BodyShorthandObject
  summary?: string
  description?: string
  operationId?: string
  tags?: string[]
  deprecated?: boolean
  security?: SecurityRequirementObject[]
  [statusCode: number]: StandardJSONSchemaV1 | ResponseObject | ResponseShorthandObject | string | null
}
```

Numeric keys (e.g. `200`, `404`) are interpreted as HTTP status code responses. Their values can be:

- `StandardJSONSchemaV1` -- a schema for the response body (served as `application/json`).
- `ResponseObject` -- a full OpenAPI response object with content types, headers, etc.
- `string` -- a reference to a named schema registered via `schemas`. Produces an `application/json` response with a `$ref` to the named component.
- `null` -- a response with no content body (e.g. `204 No Content`).

---

### `RouteDefinition`

Extends `RouteShorthand` with the parsed method and path. This is the type received by `transformRoute` plugin hooks.

```ts
interface RouteDefinition extends RouteShorthand {
  method: HttpMethod
  path: string
}
```

---

### `ParsedRoute`

A parsed route with extracted path parameters.

```ts
interface ParsedRoute {
  method: HttpMethod
  path: string
  pathParams: string[]
}
```

---

### `ToOpenapiPlugin`

The plugin interface for transforming routes, schemas, and documents during generation.

```ts
interface ToOpenapiPlugin {
  name: string
  transformRoute?: (route: RouteDefinition) => RouteDefinition
  transformSchema?: (schema: SchemaOrRef, context: SchemaContext) => SchemaOrRef
  transformDocument?: (document: OpenAPIDocument) => OpenAPIDocument
}
```

See the [Plugin Interface](./plugin-interface.md) reference for detailed documentation.

---

### `ToOpenapiDefinition`

The complete definition object accepted by the `openapi()` function.

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

See the [`openapi()` function](./openapi-function.md) reference for detailed field documentation.

---

### `OpenAPIOptions`

The options object accepted by the `OpenAPI` class constructor. Same as `ToOpenapiDefinition` but without `paths` and `schemas`.

```ts
interface OpenAPIOptions {
  info: InfoObject
  openapi?: "3.0.3" | "3.1.0"
  servers?: ServerObject[]
  security?: SecurityRequirementObject[]
  securitySchemes?: Record<string, SecuritySchemeObject>
  tags?: TagObject[]
  externalDocs?: ExternalDocsObject
  plugins?: ToOpenapiPlugin[]
}
```

See the [`OpenAPI` class](./openapi-class.md) reference for detailed documentation.

---

### `ToOpenapiErrorCode`

A union of all error codes that can be thrown by `ToOpenapiError`.

```ts
type ToOpenapiErrorCode =
  | "INVALID_ROUTE_KEY"
  | "DUPLICATE_PATH"
  | "DUPLICATE_SCHEMA"
  | "SCHEMA_RESOLUTION_FAILED"
  | "INVALID_DEFINITION"
```

See the [Errors](./errors.md) reference for detailed descriptions of each code.
