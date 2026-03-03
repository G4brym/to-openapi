# Plugin Overview

Plugins let you customize and extend the OpenAPI document that `to-openapi` generates. They hook into three stages of the generation pipeline, giving you fine-grained control over routes, schemas, and the final document.

## The `ToOpenapiPlugin` Interface

Every plugin is a plain object that implements the `ToOpenapiPlugin` interface:

```ts
import type { ToOpenapiPlugin } from 'to-openapi';

const myPlugin: ToOpenapiPlugin = {
  name: 'my-plugin',

  // Called once per route, before the route is expanded into an OpenAPI operation
  transformRoute(route) {
    return route;
  },

  // Called each time a schema is resolved (request body, response, etc.)
  transformSchema(schema, context) {
    return schema;
  },

  // Called once after the full OpenAPI document has been assembled
  transformDocument(document) {
    return document;
  },
};
```

All three transform methods are optional. A plugin only needs `name` and whichever hooks it uses.

| Property            | Type                                                         | Required | Description                                      |
| ------------------- | ------------------------------------------------------------ | -------- | ------------------------------------------------ |
| `name`              | `string`                                                     | Yes      | A unique identifier for the plugin.              |
| `transformRoute`    | `(route: RouteDefinition) => RouteDefinition`                | No       | Modify each route before it is expanded.         |
| `transformSchema`   | `(schema: SchemaOrRef, context: SchemaContext) => SchemaOrRef`| No       | Modify schemas during resolution.                |
| `transformDocument` | `(document: OpenAPIDocument) => OpenAPIDocument`             | No       | Modify the final assembled document.             |

## Execution Order

Plugins run **in array order**. If you pass `[pluginA, pluginB]`, then for every hook:

1. `pluginA`'s hook runs first.
2. `pluginB`'s hook receives the result from `pluginA`.

The three hooks fire at different stages of the pipeline:

1. **`transformRoute`** -- runs once per route, before the route shorthand is expanded into an OpenAPI operation object. Use this to inject tags, security requirements, default responses, or any other per-route modifications.

2. **`transformSchema`** -- runs each time a schema is resolved for request bodies and responses. The `context` argument tells you where the schema is being used:
   - `context.location` is `"body"` or `"response"`.
   - `context.name` is the schema name if it is a named/registered schema (otherwise `undefined`).

3. **`transformDocument`** -- runs once after the entire document has been assembled (all paths, components, servers, security, tags). Use this for document-wide modifications like adding security schemes or global metadata.

## Passing Plugins

Plugins are passed via the `plugins` option, which is available in both the functional and class-based APIs.

### Functional API (`openapi()`)

```ts
import { openapi } from 'to-openapi';
import { bearerAuth } from 'to-openapi/plugins/bearer-auth';
import { autoTags } from 'to-openapi/plugins/auto-tags';

const doc = openapi({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [bearerAuth(), autoTags()],
  paths: {
    'GET /users': {
      200: UserSchema,
    },
  },
});
```

### Class-based API (`OpenAPI`)

```ts
import { OpenAPI } from 'to-openapi';
import { errorResponses } from 'to-openapi/plugins/error-responses';

const api = new OpenAPI({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [errorResponses([{ status: 500, description: 'Internal Server Error' }])],
});

api.route('get', '/users', { 200: UserSchema });

const doc = api.document();
```

## Built-in Plugins

`to-openapi` ships with three built-in plugins:

| Plugin | Import | Description |
| ------ | ------ | ----------- |
| [Bearer Auth](./bearer-auth.md) | `to-openapi/plugins/bearer-auth` | Adds bearer token security to all routes with optional path exclusions. |
| [Auto Tags](./auto-tags.md) | `to-openapi/plugins/auto-tags` | Automatically tags operations based on the first URL path segment. |
| [Error Responses](./error-responses.md) | `to-openapi/plugins/error-responses` | Adds common error responses (400, 401, 500, etc.) to routes that don't already define them. |

## Writing Your Own

See [Authoring Plugins](./authoring.md) for a step-by-step guide to creating custom plugins, including testing strategies and a full worked example.
