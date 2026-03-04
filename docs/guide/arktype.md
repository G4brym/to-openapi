# ArkType

[ArkType](https://arktype.io) is a TypeScript schema library with a concise string-based syntax. It natively implements the [Standard Schema](https://github.com/standard-schema/standard-schema) interface, so ArkType schemas work directly with to-openapi -- no extra packages required.

## Installation

```bash
npm install arktype
```

## Defining Schemas

```ts
import { type } from "arktype";

const UserSchema = type({
  id: "string",
  name: "string",
  email: "string",
  role: "'admin' | 'user' | 'guest'",
  "bio?": "string",
  createdAt: "string",
});

const CreateUserSchema = type({
  name: "string",
  email: "string",
  role: "'admin' | 'user' | 'guest'",
});

const ErrorSchema = type({
  message: "string",
  code: "string",
});
```

## Using with to-openapi

Pass ArkType schemas directly to `openapi()` -- as request bodies, responses, or named schemas:

```ts
import { type } from "arktype";
import { openapi } from "to-openapi";

const UserSchema = type({
  id: "string",
  name: "string",
  email: "string",
  createdAt: "string",
});

const CreateUserSchema = type({
  name: "string",
  email: "string",
});

const UpdateUserSchema = type({
  "name?": "string",
  "email?": "string",
});

const ErrorSchema = type({
  message: "string",
  code: "string",
});

const spec = openapi({
  info: {
    title: "User Service",
    version: "1.0.0",
  },
  schemas: {
    User: UserSchema,
    CreateUser: CreateUserSchema,
    UpdateUser: UpdateUserSchema,
    Error: ErrorSchema,
  },
  paths: {
    "GET /users": {
      summary: "List users",
      tags: ["Users"],
      200: UserSchema,
    },
    "POST /users": {
      summary: "Create user",
      tags: ["Users"],
      body: CreateUserSchema,
      201: UserSchema,
      400: ErrorSchema,
    },
    "GET /users/{id}": {
      summary: "Get user by ID",
      tags: ["Users"],
      200: UserSchema,
      404: ErrorSchema,
    },
    "PUT /users/{id}": {
      summary: "Update user",
      tags: ["Users"],
      body: UpdateUserSchema,
      200: UserSchema,
      404: ErrorSchema,
    },
    "DELETE /users/{id}": {
      summary: "Delete user",
      tags: ["Users"],
      204: null,
      404: ErrorSchema,
    },
  },
});
```

## Common Patterns

### Optional Fields

Append `?` to the key name to mark a field as optional:

```ts
const UpdateUserSchema = type({
  "name?": "string",
  "email?": "string",
});
```

This is equivalent to Zod's `.optional()` -- the field is removed from the `required` array in the generated JSON Schema.

### Unions

Use the `|` operator in string syntax or `type.or()` for unions:

```ts
// String syntax
const StatusSchema = type("'active' | 'inactive' | 'suspended'");

// .or() method
const ResultSchema = type({ data: "string" }).or({ error: "string" });
```

### Nested Objects

Define nested structures inline:

```ts
const OrderSchema = type({
  id: "string",
  customer: {
    name: "string",
    email: "string",
  },
  items: {
    product: "string",
    quantity: "number",
  }[],
});
```

### Arrays

Use the `[]` suffix in string syntax:

```ts
const TagListSchema = type("string[]");

const UserListSchema = type({
  id: "string",
  name: "string",
}[]);
```

## Related

- [Schemas & $ref](/guide/schemas) -- how schemas become `$ref` references
- [Schema Extensions](/guide/extending) -- adding OpenAPI-specific fields to schemas
- [Multi-Library Example](/examples/multi-library) -- the same API defined with Zod, ArkType, and Valibot
