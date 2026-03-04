# Zod

[Zod](https://zod.dev) is a TypeScript-first schema validation library. It natively implements the [Standard Schema](https://github.com/standard-schema/standard-schema) interface, so Zod schemas work directly with to-openapi -- no extra packages required.

## Installation

```bash
npm install zod
```

## Defining Schemas

```ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]),
  bio: z.string().optional(),
  createdAt: z.string().datetime(),
});

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "user", "guest"]),
});

const ErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
});
```

## Using with to-openapi

Pass Zod schemas directly to `openapi()` -- as request bodies, responses, or named schemas:

```ts
import { z } from "zod";
import { openapi } from "to-openapi";

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const ErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
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

Use `.optional()` to mark fields as not required in the generated schema:

```ts
const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});
```

### Arrays

Wrap a schema in `.array()` to produce a JSON Schema `{ type: "array", items: ... }`:

```ts
const TagListSchema = z.array(z.string());

const UserListSchema = z.array(UserSchema);
```

### Enums

Use `z.enum()` for string enums. The values appear in the generated JSON Schema `enum` field:

```ts
const StatusSchema = z.enum(["active", "inactive", "suspended"]);
```

### Descriptions

Call `.describe()` on any schema to add a `description` field to the generated JSON Schema:

```ts
const TokenSchema = z.object({
  accessToken: z.string().describe("JWT access token"),
  expiresIn: z.number().describe("Token lifetime in seconds"),
});
```

### Discriminated Unions

Use `z.discriminatedUnion()` to model polymorphic responses:

```ts
const EventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("click"), x: z.number(), y: z.number() }),
  z.object({ type: z.literal("keypress"), key: z.string() }),
]);
```

## Related

- [Schemas & $ref](/guide/schemas) -- how schemas become `$ref` references
- [Schema Extensions](/guide/extending) -- adding OpenAPI-specific fields to schemas
- [Multi-Library Example](/examples/multi-library) -- the same API defined with Zod, ArkType, and Valibot
