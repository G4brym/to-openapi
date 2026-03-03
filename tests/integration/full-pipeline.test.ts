import { describe, expect, it } from "vitest";
import { extend } from "../../src/extend";
import { merge } from "../../src/merge";
import { OpenAPI } from "../../src/openapi-class";
import { openapi } from "../../src/openapi-fn";
import { autoTags } from "../../src/plugins/auto-tags";
import { apiKeyAuth } from "../../src/plugins/api-key-auth";
import { bearerAuth } from "../../src/plugins/bearer-auth";
import { errorResponses } from "../../src/plugins/error-responses";
import { createMockObjectSchema, createMockSchema } from "../helpers/mock-schemas";
import { assertValidOpenAPI } from "../helpers/validate";

describe("full pipeline", () => {
	it("declarative API with plugins produces valid document", async () => {
		const errorSchema = createMockSchema({
			type: "object",
			properties: { message: { type: "string" } },
			required: ["message"],
		});

		const doc = openapi({
			info: { title: "Full Test API", version: "1.0.0" },
			plugins: [
				bearerAuth({ bearerFormat: "JWT" }),
				autoTags(),
				errorResponses([{ status: 500, schema: errorSchema }]),
			],
			schemas: {
				Task: createMockSchema({ type: "object", properties: { id: { type: "string" } } }),
			},
			paths: {
				"GET /tasks": {
					200: createMockSchema({ type: "array" }),
				},
				"POST /tasks": {
					body: createMockSchema({ type: "object" }),
					201: null,
				},
				"GET /health": {
					summary: "Health check",
					200: null,
				},
			},
		});

		// bearerAuth plugin injects security
		expect(doc.components?.securitySchemes?.bearerAuth).toBeDefined();
		expect(doc.security).toEqual([{ bearerAuth: [] }]);

		// autoTags adds tags based on first path segment
		expect(doc.paths["/tasks"]?.get?.tags).toEqual(["tasks"]);
		expect(doc.paths["/tasks"]?.post?.tags).toEqual(["tasks"]);
		expect(doc.paths["/health"]?.get?.tags).toEqual(["health"]);

		// errorResponses adds 500 to all routes
		expect(doc.paths["/tasks"]?.get?.responses?.["500"]).toBeDefined();
		expect(doc.paths["/health"]?.get?.responses?.["500"]).toBeDefined();

		// bearerAuth adds per-route security
		expect(doc.paths["/tasks"]?.get?.security).toEqual([{ bearerAuth: [] }]);

		// Document is frozen
		expect(Object.isFrozen(doc)).toBe(true);
		await assertValidOpenAPI(doc);
	});

	it("imperative API produces same result as declarative for equivalent input", async () => {
		const taskSchema = createMockSchema({ type: "object" });

		const fnDoc = openapi({
			info: { title: "Equiv Test", version: "1.0.0" },
			schemas: { Task: taskSchema },
			paths: {
				"GET /tasks": { 200: null },
				"POST /tasks": { body: createMockSchema({ type: "object" }), 201: null },
			},
		});

		const classDoc = new OpenAPI({ info: { title: "Equiv Test", version: "1.0.0" } })
			.schema("Task", taskSchema)
			.route("get", "/tasks", { 200: null })
			.route("post", "/tasks", { body: createMockSchema({ type: "object" }), 201: null })
			.document();

		// Same structure
		expect(Object.keys(fnDoc.paths)).toEqual(Object.keys(classDoc.paths));
		expect(fnDoc.paths["/tasks"]?.get?.operationId).toBe(
			classDoc.paths["/tasks"]?.get?.operationId,
		);
		expect(fnDoc.paths["/tasks"]?.post?.operationId).toBe(
			classDoc.paths["/tasks"]?.post?.operationId,
		);
		await assertValidOpenAPI(fnDoc);
		await assertValidOpenAPI(classDoc);
	});

	it("merge combines two independently built documents", async () => {
		const tasksDoc = openapi({
			info: { title: "Tasks", version: "1.0.0" },
			schemas: { Task: createMockSchema({ type: "object", title: "Task" }) },
			paths: {
				"GET /tasks": { 200: "Task" as any },
			},
		});

		const usersDoc = openapi({
			info: { title: "Users", version: "1.0.0" },
			schemas: { User: createMockSchema({ type: "object", title: "User" }) },
			paths: {
				"GET /users": { 200: "User" as any },
			},
		});

		// Need unfrozen docs for merge
		const merged = merge(
			JSON.parse(JSON.stringify(tasksDoc)),
			JSON.parse(JSON.stringify(usersDoc)),
		);

		expect(merged.info.title).toBe("Tasks"); // base wins
		expect(merged.paths["/tasks"]).toBeDefined();
		expect(merged.paths["/users"]).toBeDefined();
		expect(merged.components?.schemas?.Task).toBeDefined();
		expect(merged.components?.schemas?.User).toBeDefined();
		await assertValidOpenAPI(merged);
	});

	it("extend modifies schema output in generated document", async () => {
		const baseSchema = createMockSchema({
			type: "object",
			properties: { name: { type: "string" } },
		});
		const extended = extend(baseSchema, {
			properties: { name: { type: "string" }, age: { type: "number" } },
		});

		const doc = openapi({
			info: { title: "Extend Test", version: "1.0.0" },
			paths: {
				"POST /users": {
					body: extended,
					201: null,
				},
			},
		});

		const bodySchema = (doc.paths["/users"]?.post?.requestBody as any)?.content?.[
			"application/json"
		]?.schema;
		expect(bodySchema.properties.age).toEqual({ type: "number" });
		await assertValidOpenAPI(doc);
	});

	it("plugin ordering is respected", () => {
		const order: string[] = [];

		const plugin1 = {
			name: "first",
			transformRoute: (route: any) => {
				order.push("first");
				return { ...route, tags: ["first"] };
			},
		};

		const plugin2 = {
			name: "second",
			transformRoute: (route: any) => {
				order.push("second");
				return { ...route, description: `Tags: ${route.tags?.join(",")}` };
			},
		};

		const doc = openapi({
			info: { title: "Order Test", version: "1.0.0" },
			plugins: [plugin1, plugin2],
			paths: {
				"GET /test": { 200: null },
			},
		});

		expect(order).toEqual(["first", "second"]);
		expect(doc.paths["/test"]?.get?.tags).toEqual(["first"]);
		expect(doc.paths["/test"]?.get?.description).toBe("Tags: first");
	});

	it("apiKeyAuth plugin works in full pipeline", async () => {
		const doc = openapi({
			info: { title: "API Key Test", version: "1.0.0" },
			plugins: [apiKeyAuth({ name: "X-API-Key", in: "header", exclude: ["/health"] })],
			paths: {
				"GET /tasks": { 200: null },
				"GET /health": { 200: null },
			},
		});

		expect(doc.components?.securitySchemes?.apiKeyAuth).toEqual({
			type: "apiKey",
			name: "X-API-Key",
			in: "header",
		});
		expect(doc.paths["/tasks"]?.get?.security).toEqual([{ apiKeyAuth: [] }]);
		expect(doc.paths["/health"]?.get?.security).toBeUndefined();
		await assertValidOpenAPI(doc);
	});

	it("bearerAuth exclude works in full pipeline", async () => {
		const doc = openapi({
			info: { title: "Exclude Test", version: "1.0.0" },
			plugins: [bearerAuth({ exclude: ["/health"] })],
			paths: {
				"GET /tasks": { 200: null },
				"GET /health": { 200: null },
			},
		});

		expect(doc.paths["/tasks"]?.get?.security).toEqual([{ bearerAuth: [] }]);
		expect(doc.paths["/health"]?.get?.security).toBeUndefined();
		await assertValidOpenAPI(doc);
	});
});
