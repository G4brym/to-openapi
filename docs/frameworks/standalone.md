# Standalone Usage

You can use `to-openapi` without any web framework at all. This is useful for generating OpenAPI specs as static files, piping output to other tools, or serving the spec from a minimal HTTP server.

## Generate and Write to a JSON File

The simplest use case: generate your spec and write it to disk with Node.js `fs`.

```ts
import { writeFileSync } from "node:fs";
import { openapi } from "to-openapi";
import { z } from "zod";

const spec = openapi({
  info: {
    title: "My API",
    version: "1.0.0",
  },
  paths: {
    "GET /healthz": {
      summary: "Health check",
      200: z.object({
        status: z.enum(["ok", "degraded"]),
      }),
    },
    "POST /users": {
      summary: "Create a user",
      body: z.object({
        name: z.string(),
        email: z.string(),
      }),
      201: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
      }),
    },
  },
});

writeFileSync("openapi.json", JSON.stringify(spec, null, 2));
console.log("Wrote openapi.json");
```

Run it with:

```sh
npx tsx generate-spec.ts
```

## Output to stdout for Piping

Print the spec to stdout so you can pipe it into other tools such as linters, code generators, or converters.

```ts
import { openapi } from "to-openapi";
import { z } from "zod";

const spec = openapi({
  info: {
    title: "My API",
    version: "1.0.0",
  },
  paths: {
    "GET /users": {
      summary: "List users",
      200: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
        })
      ),
    },
  },
});

// Print to stdout for piping
process.stdout.write(JSON.stringify(spec, null, 2));
```

Pipe it into another tool:

```sh
npx tsx generate-spec.ts | npx @redocly/cli lint --stdin
```

## Serve via Node.js HTTP Server

If you want to serve the spec over HTTP without pulling in a framework, use Node.js built-in `http` module.

```ts
import { createServer } from "node:http";
import { openapi } from "to-openapi";
import { z } from "zod";

const spec = openapi({
  info: {
    title: "My API",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:3000" }],
  paths: {
    "GET /users/{id}": {
      summary: "Get user by ID",
      params: z.object({
        id: z.string(),
      }),
      200: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
      }),
      404: { description: "User not found" },
    },
  },
});

const specJson = JSON.stringify(spec, null, 2);

const server = createServer((req, res) => {
  if (req.url === "/openapi.json" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(specJson);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(3000, () => {
  console.log("Serving OpenAPI spec at http://localhost:3000/openapi.json");
});
```

## Using the Class-Based API

The `OpenAPI` class builder works the same way in standalone mode. It is useful when you want to add routes dynamically or build the spec incrementally.

```ts
import { writeFileSync } from "node:fs";
import { OpenAPI } from "to-openapi";
import { z } from "zod";

const api = new OpenAPI({
  info: {
    title: "My API",
    version: "2.0.0",
  },
});

api.route("get", "/pets", {
  summary: "List pets",
  200: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      species: z.enum(["dog", "cat", "bird"]),
    })
  ),
});

api.route("post", "/pets", {
  summary: "Create a pet",
  body: z.object({
    name: z.string(),
    species: z.enum(["dog", "cat", "bird"]),
  }),
  201: z.object({
    id: z.number(),
    name: z.string(),
    species: z.enum(["dog", "cat", "bird"]),
  }),
});

const spec = api.document();
writeFileSync("openapi.json", JSON.stringify(spec, null, 2));
```
