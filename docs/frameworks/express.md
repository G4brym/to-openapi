# Express

[Express](https://expressjs.com/) is the most widely used Node.js web framework. This guide shows how to generate an OpenAPI spec with `to-openapi` and serve it from an Express application, optionally with Swagger UI.

## Basic Setup

Generate your spec and serve it from a `GET /openapi.json` endpoint.

```ts
import express from "express";
import { openapi } from "to-openapi";
import { z } from "zod";

const spec = openapi({
  info: {
    title: "Express API",
    version: "1.0.0",
    description: "A sample Express API with OpenAPI spec",
  },
  servers: [{ url: "http://localhost:3000" }],
  paths: {
    "GET /products": {
      summary: "List products",
      tags: ["Products"],
      query: z.object({
        category: z.string().optional(),
        limit: z.number().optional(),
      }),
      200: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          price: z.number(),
          category: z.string(),
        })
      ),
    },
    "POST /products": {
      summary: "Create a product",
      tags: ["Products"],
      body: z.object({
        name: z.string(),
        price: z.number(),
        category: z.string(),
      }),
      201: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        category: z.string(),
      }),
      400: { description: "Validation error" },
    },
    "GET /products/{id}": {
      summary: "Get a product by ID",
      tags: ["Products"],
      params: z.object({
        id: z.string(),
      }),
      200: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        category: z.string(),
      }),
      404: { description: "Product not found" },
    },
    "PUT /products/{id}": {
      summary: "Update a product",
      tags: ["Products"],
      params: z.object({
        id: z.string(),
      }),
      body: z.object({
        name: z.string(),
        price: z.number(),
        category: z.string(),
      }),
      200: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        category: z.string(),
      }),
      404: { description: "Product not found" },
    },
    "DELETE /products/{id}": {
      summary: "Delete a product",
      tags: ["Products"],
      params: z.object({
        id: z.string(),
      }),
      204: { description: "Product deleted" },
      404: { description: "Product not found" },
    },
  },
});

const app = express();
app.use(express.json());

// Serve the OpenAPI spec
app.get("/openapi.json", (_req, res) => {
  res.json(spec);
});

// Implement your routes
app.get("/products", (_req, res) => {
  res.json([]);
});

app.post("/products", (req, res) => {
  const product = { id: "1", ...req.body };
  res.status(201).json(product);
});

app.get("/products/:id", (req, res) => {
  res.json({
    id: req.params.id,
    name: "Widget",
    price: 9.99,
    category: "gadgets",
  });
});

app.put("/products/:id", (req, res) => {
  res.json({ id: req.params.id, ...req.body });
});

app.delete("/products/:id", (_req, res) => {
  res.status(204).end();
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
  console.log("OpenAPI spec at http://localhost:3000/openapi.json");
});
```

## Serving Swagger UI

Use [`swagger-ui-express`](https://www.npmjs.com/package/swagger-ui-express) to serve an interactive API documentation page alongside your spec.

```sh
npm install swagger-ui-express
npm install -D @types/swagger-ui-express
```

```ts
import express from "express";
import swaggerUi from "swagger-ui-express";
import { openapi } from "to-openapi";
import { z } from "zod";

const spec = openapi({
  info: {
    title: "Express API",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:3000" }],
  paths: {
    "GET /users": {
      summary: "List users",
      tags: ["Users"],
      200: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        })
      ),
    },
    "POST /users": {
      summary: "Create a user",
      tags: ["Users"],
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

const app = express();
app.use(express.json());

// Serve the raw OpenAPI spec
app.get("/openapi.json", (_req, res) => {
  res.json(spec);
});

// Serve Swagger UI at /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

// Implement your routes
app.get("/users", (_req, res) => {
  res.json([]);
});

app.post("/users", (req, res) => {
  res.status(201).json({ id: "1", ...req.body });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
  console.log("Swagger UI at http://localhost:3000/docs");
  console.log("OpenAPI spec at http://localhost:3000/openapi.json");
});
```

## Using the Class-Based API

The `OpenAPI` class builder lets you register routes one at a time, which can be useful when organizing routes across multiple files.

```ts
import express from "express";
import { OpenAPI } from "to-openapi";
import { z } from "zod";

const api = new OpenAPI({
  info: {
    title: "Express API",
    version: "1.0.0",
  },
});

const app = express();
app.use(express.json());

// Register routes with both Express and the OpenAPI builder
api.route("get", "/orders", {
  summary: "List orders",
  tags: ["Orders"],
  200: z.array(
    z.object({
      id: z.string(),
      total: z.number(),
      status: z.enum(["pending", "shipped", "delivered"]),
    })
  ),
});

app.get("/orders", (_req, res) => {
  res.json([]);
});

api.route("post", "/orders", {
  summary: "Create an order",
  tags: ["Orders"],
  body: z.object({
    items: z.array(
      z.object({
        productId: z.string(),
        quantity: z.number(),
      })
    ),
  }),
  201: z.object({
    id: z.string(),
    total: z.number(),
    status: z.literal("pending"),
  }),
});

app.post("/orders", (req, res) => {
  res.status(201).json({
    id: "1",
    total: 29.99,
    status: "pending",
  });
});

// Serve the spec (call .document() to generate)
app.get("/openapi.json", (_req, res) => {
  res.json(api.document());
});

app.listen(3000);
```
