# Auto Tags Plugin

The Auto Tags plugin automatically assigns tags to your OpenAPI operations based on the first segment of their URL path. This organizes endpoints into logical groups in tools like Swagger UI without requiring you to manually tag every route.

## Installation

The plugin is included with `to-openapi` -- no extra packages needed.

```ts
import { autoTags } from 'to-openapi/plugins/auto-tags';
```

## Basic Usage

```ts
import { openapi } from 'to-openapi';
import { autoTags } from 'to-openapi/plugins/auto-tags';

const doc = openapi({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [autoTags()],
  paths: {
    'GET /users': { 200: UserListSchema },
    'POST /users': { body: CreateUserSchema, 201: UserSchema },
    'GET /users/{id}': { 200: UserSchema },
    'GET /posts': { 200: PostListSchema },
    'GET /posts/{id}/comments': { 200: CommentListSchema },
  },
});
```

The generated operations will have these tags:

| Route                       | Generated Tag |
| --------------------------- | ------------- |
| `GET /users`                | `users`       |
| `POST /users`               | `users`       |
| `GET /users/{id}`           | `users`       |
| `GET /posts`                | `posts`       |
| `GET /posts/{id}/comments`  | `posts`       |

## Options

The plugin accepts an optional `AutoTagsOptions` object:

```ts
export interface AutoTagsOptions {
  prefix?: string;
}
```

| Option   | Type     | Default | Description                                              |
| -------- | -------- | ------- | -------------------------------------------------------- |
| `prefix` | `string` | --      | A string to prepend to every generated tag name.         |

## Example with Prefix

```ts
import { openapi } from 'to-openapi';
import { autoTags } from 'to-openapi/plugins/auto-tags';

const doc = openapi({
  info: { title: 'My API', version: '2.0.0' },
  plugins: [autoTags({ prefix: 'api-' })],
  paths: {
    'GET /users': { 200: UserListSchema },
    'GET /orders': { 200: OrderListSchema },
  },
});
```

This produces:

| Route         | Generated Tag |
| ------------- | ------------- |
| `GET /users`  | `api-users`   |
| `GET /orders` | `api-orders`  |

## Tag Generation Logic

The plugin uses the following rules to determine the tag:

1. **Split the path** into segments and take the first non-empty segment. For example, `/users/{id}` splits into `["users", "{id}"]` and the first segment is `users`.

2. **Skip path parameters.** If the first segment is a path parameter (starts with `{` and ends with `}`), no tag is generated. This handles unusual routes like `/{tenant}/resources` where the leading segment is dynamic.

3. **Respect existing tags.** If a route already has `tags` defined (a non-empty array), the plugin leaves it untouched. This lets you manually override specific routes:

```ts
const doc = openapi({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [autoTags()],
  paths: {
    'GET /users': { 200: UserListSchema },           // tag: "users" (auto)
    'GET /admin/stats': {
      tags: ['admin-dashboard'],                      // tag: "admin-dashboard" (manual, preserved)
      200: StatsSchema,
    },
  },
});
```

4. **Apply prefix.** If the `prefix` option is set, it is prepended to the generated tag. A route at `/users` with `prefix: "v2-"` produces the tag `v2-users`.

## Using with the Class-based API

```ts
import { OpenAPI } from 'to-openapi';
import { autoTags } from 'to-openapi/plugins/auto-tags';

const api = new OpenAPI({
  info: { title: 'My API', version: '1.0.0' },
  plugins: [autoTags()],
});

api.route('get', '/users', { 200: UserListSchema });
api.route('get', '/posts', { 200: PostListSchema });

const doc = api.document();
// GET /users is tagged "users", GET /posts is tagged "posts"
```

## Related

- [Plugin Overview](./overview.md) -- how plugins work and execution order
- [Bearer Auth Plugin](./bearer-auth.md) -- add bearer token authentication
- [Error Responses Plugin](./error-responses.md) -- add common error responses
- [Authoring Plugins](./authoring.md) -- create your own plugins
