# Authoring Plugins

This guide walks through creating your own `to-openapi` plugin from scratch. If you have not read the [Plugin Overview](./overview.md) yet, start there for background on the plugin interface and execution model.

## Plugin Structure

A plugin is any object that satisfies the `ToOpenapiPlugin` interface. At minimum it needs a `name`; everything else is optional:

```ts
import type { ToOpenapiPlugin } from 'to-openapi';

const myPlugin: ToOpenapiPlugin = {
  name: 'my-plugin',
};
```

In practice you will implement a factory function that returns the plugin object, so callers can pass options:

```ts
import type { ToOpenapiPlugin } from 'to-openapi';

export interface MyPluginOptions {
  // ...
}

export function myPlugin(options: MyPluginOptions = {}): ToOpenapiPlugin {
  return {
    name: 'my-plugin',
    // hooks go here
  };
}
```

## Hook: `transformRoute`

```ts
transformRoute(route: RouteDefinition): RouteDefinition
```

Called once for every route **before** it is expanded into an OpenAPI operation. The `route` argument contains the full `RouteDefinition`, which includes `method`, `path`, and all shorthand fields (`query`, `params`, `body`, `tags`, `security`, status code responses, etc.).

Return a new (or the same) `RouteDefinition`. You should avoid mutating the input; spread it instead:

```ts
transformRoute(route) {
  // Add a default tag if the route has none
  if (!route.tags || route.tags.length === 0) {
    return { ...route, tags: ['untagged'] };
  }
  return route;
},
```

Common use cases:

- Injecting default `tags` or `security` requirements
- Adding default error responses to every route
- Filtering or rewriting paths

## Hook: `transformSchema`

```ts
transformSchema(schema: SchemaOrRef, context: SchemaContext): SchemaOrRef
```

Called each time a schema is resolved for a request body or response. The `context` argument tells you where the schema is being used:

- `context.location` -- one of `"body"`, `"query"`, `"path"`, `"header"`, `"response"`, or `"component"`.
- `context.name` -- the registered name of the schema, if it has one (otherwise `undefined`).

A `SchemaOrRef` is either a JSON Schema object (`Record<string, unknown>`) or a `$ref` reference object (`{ $ref: string }`). Your hook receives the already-resolved schema (which may be a `$ref` if it was promoted to `#/components/schemas`).

```ts
transformSchema(schema, context) {
  // Add a title to all response schemas that lack one
  if (context.location === 'response' && !('$ref' in schema) && !schema.title) {
    return { ...schema, title: context.name ?? 'Response' };
  }
  return schema;
},
```

## Hook: `transformDocument`

```ts
transformDocument(document: OpenAPIDocument): OpenAPIDocument
```

Called once after the entire OpenAPI document has been assembled -- all paths, components, servers, security, and tags are in place. This is the right place for document-wide changes:

```ts
transformDocument(doc) {
  return {
    ...doc,
    'x-generated-by': 'my-tooling',
  };
},
```

Common use cases:

- Adding or merging `securitySchemes` into `components`
- Adding global `security` requirements
- Injecting `servers`, `tags`, or `externalDocs`
- Adding vendor extensions (`x-*` properties)

## Full Example: Server-Timing Header Plugin

Here is a complete plugin that adds a `Server-Timing` response header to every response in the generated document:

```ts
import type { ToOpenapiPlugin, OpenAPIDocument, PathItemObject, OperationObject } from 'to-openapi';

export interface ServerTimingOptions {
  description?: string;
}

export function serverTiming(options: ServerTimingOptions = {}): ToOpenapiPlugin {
  const description = options.description ?? 'Server timing metrics';

  return {
    name: 'server-timing',

    transformDocument(doc: OpenAPIDocument): OpenAPIDocument {
      const paths: Record<string, PathItemObject> = {};

      for (const [pathKey, pathItem] of Object.entries(doc.paths)) {
        const newPathItem: PathItemObject = { ...pathItem };

        for (const method of ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'] as const) {
          const operation = newPathItem[method];
          if (!operation) continue;

          newPathItem[method] = addHeaderToOperation(operation, description);
        }

        paths[pathKey] = newPathItem;
      }

      return { ...doc, paths };
    },
  };
}

function addHeaderToOperation(operation: OperationObject, description: string): OperationObject {
  if (!operation.responses) return operation;

  const responses: Record<string, unknown> = {};

  for (const [status, response] of Object.entries(operation.responses)) {
    if ('$ref' in response) {
      responses[status] = response;
      continue;
    }

    responses[status] = {
      ...response,
      headers: {
        ...(response.headers ?? {}),
        'Server-Timing': {
          description,
          schema: { type: 'string' },
        },
      },
    };
  }

  return { ...operation, responses };
}
```

Usage:

```ts
import { openapi } from 'to-openapi';
import { serverTiming } from './plugins/server-timing';

const doc = openapi({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [serverTiming({ description: 'Backend processing duration' })],
  paths: {
    'GET /health': {
      200: null,
    },
  },
});
```

## Testing Plugins

Because plugins are plain objects with pure functions, they are straightforward to unit test. Test each hook in isolation by calling it directly:

```ts
import { describe, it, expect } from 'vitest';
import { serverTiming } from './server-timing';

describe('serverTiming plugin', () => {
  it('has the correct name', () => {
    const plugin = serverTiming();
    expect(plugin.name).toBe('server-timing');
  });

  it('adds Server-Timing header to all responses', () => {
    const plugin = serverTiming();

    const doc = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/health': {
          get: {
            operationId: 'getHealth',
            responses: {
              '200': { description: 'OK' },
            },
          },
        },
      },
    };

    const result = plugin.transformDocument!(doc);

    const headers = result.paths['/health'].get!.responses!['200'];
    expect(headers).toHaveProperty('headers.Server-Timing');
  });

  it('preserves existing headers', () => {
    const plugin = serverTiming();

    const doc = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/data': {
          get: {
            operationId: 'getData',
            responses: {
              '200': {
                description: 'OK',
                headers: {
                  'X-Request-Id': { schema: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    };

    const result = plugin.transformDocument!(doc);
    const resp = result.paths['/data'].get!.responses!['200'] as Record<string, unknown>;
    const headers = resp.headers as Record<string, unknown>;
    expect(headers).toHaveProperty('X-Request-Id');
    expect(headers).toHaveProperty('Server-Timing');
  });
});
```

For integration testing, pass the plugin through the full `openapi()` pipeline and assert on the resulting document structure.

## Tips

- **Keep plugins focused.** Each plugin should do one thing well. Compose multiple small plugins rather than building one large one.
- **Do not mutate inputs.** Always return new objects using the spread operator. The library freezes the final document, and mutation can cause subtle bugs.
- **Order matters.** Plugins execute in array order. If plugin B depends on changes made by plugin A, put A first in the array.
- **Use `transformRoute` for per-route logic** and `transformDocument` for global/document-wide changes. Avoid mixing concerns.

## Related

- [Plugin Overview](./overview.md) -- interface reference and execution model
- [Bearer Auth Plugin](./bearer-auth.md) -- built-in authentication plugin (good reference implementation)
- [Auto Tags Plugin](./auto-tags.md) -- built-in tagging plugin
- [Error Responses Plugin](./error-responses.md) -- built-in error response plugin
