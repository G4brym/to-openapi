import { describe, expect, it } from "vitest";
import { openapi } from "../../src/openapi-fn";
import type { ToOpenapiDefinition, ToOpenapiPlugin } from "../../src/types";
import { createMockObjectSchema, createMockSchema } from "../helpers/mock-schemas";
import { assertValidOpenAPI } from "../helpers/validate";

const baseDefinition: ToOpenapiDefinition = {
	info: { title: "Test API", version: "1.0.0" },
	paths: {},
};

describe("openapi()", () => {
	it("produces a minimal valid document", async () => {
		const doc = openapi(baseDefinition);
		expect(doc.openapi).toBe("3.1.0");
		expect(doc.info.title).toBe("Test API");
		expect(doc.paths).toEqual({});
		await assertValidOpenAPI(doc);
	});

	it("defaults to OpenAPI 3.1.0", () => {
		const doc = openapi(baseDefinition);
		expect(doc.openapi).toBe("3.1.0");
	});

	it("respects openapi version override", () => {
		const doc = openapi({ ...baseDefinition, openapi: "3.0.3" });
		expect(doc.openapi).toBe("3.0.3");
	});

	it("freezes the output document", () => {
		const doc = openapi(baseDefinition);
		expect(Object.isFrozen(doc)).toBe(true);
		expect(Object.isFrozen(doc.info)).toBe(true);
	});

	it("expands routes with schemas", async () => {
		const doc = openapi({
			...baseDefinition,
			paths: {
				"GET /tasks": {
					query: createMockObjectSchema({ page: { type: "integer" } }),
					200: createMockSchema({ type: "array", items: { type: "object" } }),
				},
			},
		});

		const getOp = doc.paths["/tasks"]?.get;
		expect(getOp).toBeDefined();
		expect(getOp?.parameters).toHaveLength(1);
		expect(getOp?.parameters?.[0]?.name).toBe("page");
		expect(getOp?.responses?.["200"]).toBeDefined();
		await assertValidOpenAPI(doc);
	});

	it("registers named schemas and creates refs", async () => {
		const taskSchema = createMockSchema({ type: "object", properties: { id: { type: "string" } } });

		const doc = openapi({
			...baseDefinition,
			schemas: { Task: taskSchema },
			paths: {
				"GET /tasks/:id": {
					200: "Task" as any,
				},
			},
		});

		expect(doc.components?.schemas?.Task).toBeDefined();
		const response = doc.paths["/tasks/{id}"]?.get?.responses?.["200"];
		expect(response).toBeDefined();
		await assertValidOpenAPI(doc);
	});

	it("includes servers, tags, and security", async () => {
		const doc = openapi({
			...baseDefinition,
			servers: [{ url: "https://api.example.com" }],
			tags: [{ name: "tasks" }],
			security: [{ bearerAuth: [] }],
			securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
		});

		expect(doc.servers).toHaveLength(1);
		expect(doc.tags).toHaveLength(1);
		expect(doc.security).toHaveLength(1);
		expect(doc.components?.securitySchemes?.bearerAuth).toBeDefined();
		await assertValidOpenAPI(doc);
	});

	it("runs transformRoute plugins", () => {
		const plugin: ToOpenapiPlugin = {
			name: "test-plugin",
			transformRoute: (route) => ({
				...route,
				tags: ["injected"],
			}),
		};

		const doc = openapi({
			...baseDefinition,
			plugins: [plugin],
			paths: {
				"GET /tasks": { 200: null },
			},
		});

		expect(doc.paths["/tasks"]?.get?.tags).toEqual(["injected"]);
	});

	it("runs transformDocument plugins", () => {
		const plugin: ToOpenapiPlugin = {
			name: "test-plugin",
			transformDocument: (doc) => ({
				...doc,
				info: { ...doc.info, description: "Plugin added this" },
			}),
		};

		const doc = openapi({
			...baseDefinition,
			plugins: [plugin],
			paths: {},
		});

		expect(doc.info.description).toBe("Plugin added this");
	});

	it("uses plugin-modified path for output and path params", () => {
		const prefixPlugin: ToOpenapiPlugin = {
			name: "prefix",
			transformRoute: (route) => ({
				...route,
				path: `/v1${route.path}`,
			}),
		};

		const doc = openapi({
			...baseDefinition,
			plugins: [prefixPlugin],
			paths: {
				"GET /tasks/:id": { 200: null },
			},
		});

		// The output document should have the prefixed path
		expect(doc.paths["/v1/tasks/{id}"]).toBeDefined();
		expect(doc.paths["/tasks/{id}"]).toBeUndefined();

		// Path params should still be detected correctly
		const params = doc.paths["/v1/tasks/{id}"]?.get?.parameters;
		expect(params).toHaveLength(1);
		expect(params?.[0]?.name).toBe("id");
		expect(params?.[0]?.in).toBe("path");
	});

	it("handles multiple routes", async () => {
		const doc = openapi({
			...baseDefinition,
			paths: {
				"GET /tasks": { 200: null },
				"POST /tasks": { 201: null },
				"GET /tasks/:id": { 200: null },
				"PUT /tasks/:id": { 200: null },
				"DELETE /tasks/:id": { 204: null },
			},
		});

		expect(Object.keys(doc.paths)).toHaveLength(2);
		expect(doc.paths["/tasks"]?.get).toBeDefined();
		expect(doc.paths["/tasks"]?.post).toBeDefined();
		expect(doc.paths["/tasks/{id}"]?.get).toBeDefined();
		expect(doc.paths["/tasks/{id}"]?.put).toBeDefined();
		expect(doc.paths["/tasks/{id}"]?.delete).toBeDefined();
		await assertValidOpenAPI(doc);
	});

	it("expands cookie parameters into valid document", async () => {
		const doc = openapi({
			...baseDefinition,
			paths: {
				"GET /tasks": {
					cookies: createMockObjectSchema(
						{ session: { type: "string" } },
						["session"],
					),
					200: createMockSchema({ type: "array" }),
				},
			},
		});

		const getOp = doc.paths["/tasks"]?.get;
		expect(getOp?.parameters).toHaveLength(1);
		expect(getOp?.parameters?.[0]).toMatchObject({
			name: "session",
			in: "cookie",
			required: true,
		});
		await assertValidOpenAPI(doc);
	});

	it("runs transformSchema on body and response schemas", () => {
		const stripInternal: ToOpenapiPlugin = {
			name: "strip-internal",
			transformSchema: (schema, context) => {
				if ("$ref" in schema) return schema;
				const { "x-internal": _, ...rest } = schema as Record<string, unknown>;
				return rest;
			},
		};

		const doc = openapi({
			...baseDefinition,
			plugins: [stripInternal],
			paths: {
				"POST /tasks": {
					body: createMockSchema({
						type: "object",
						properties: { name: { type: "string" } },
						"x-internal": true,
					}),
					200: createMockSchema({
						type: "object",
						properties: { id: { type: "string" } },
						"x-internal": true,
					}),
				},
			},
		});

		const bodySchema = (doc.paths["/tasks"]?.post?.requestBody as any)?.content?.[
			"application/json"
		]?.schema;
		expect(bodySchema["x-internal"]).toBeUndefined();
		expect(bodySchema.type).toBe("object");

		const responseSchema = (doc.paths["/tasks"]?.post?.responses?.["200"] as any)?.content?.[
			"application/json"
		]?.schema;
		expect(responseSchema["x-internal"]).toBeUndefined();
		expect(responseSchema.type).toBe("object");
	});
});
