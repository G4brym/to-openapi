import { describe, expect, it } from "vitest";
import { OpenAPI } from "../../src/openapi-class";
import { openapi } from "../../src/openapi-fn";
import type { ToOpenapiPlugin } from "../../src/types";
import { createMockObjectSchema, createMockSchema } from "../helpers/mock-schemas";
import { assertValidOpenAPI } from "../helpers/validate";

describe("OpenAPI class", () => {
	it("produces a minimal valid document", async () => {
		const api = new OpenAPI({ info: { title: "Test API", version: "1.0.0" } });
		const doc = api.document();

		expect(doc.openapi).toBe("3.1.0");
		expect(doc.info.title).toBe("Test API");
		expect(doc.paths).toEqual({});
		await assertValidOpenAPI(doc);
	});

	it("freezes the output document", () => {
		const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
		const doc = api.document();
		expect(Object.isFrozen(doc)).toBe(true);
	});

	it("adds routes via .route()", async () => {
		const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
		api.route("get", "/tasks", { 200: null });

		const doc = api.document();
		expect(doc.paths["/tasks"]?.get).toBeDefined();
		expect(doc.paths["/tasks"]?.get?.responses?.["200"]).toEqual({
			description: "Successful response",
		});
		await assertValidOpenAPI(doc);
	});

	it("registers named schemas via .schema()", async () => {
		const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
		const taskSchema = createMockSchema({ type: "object" });
		api.schema("Task", taskSchema);
		api.route("get", "/tasks/:id", { 200: "Task" as any });

		const doc = api.document();
		expect(doc.components?.schemas?.Task).toEqual({ type: "object" });
		await assertValidOpenAPI(doc);
	});

	it("supports method chaining", async () => {
		const doc = new OpenAPI({ info: { title: "Test", version: "1.0.0" } })
			.schema("Task", createMockSchema({ type: "object" }))
			.route("get", "/tasks", { 200: null })
			.route("post", "/tasks", { 201: null })
			.document();

		expect(doc.paths["/tasks"]?.get).toBeDefined();
		expect(doc.paths["/tasks"]?.post).toBeDefined();
		await assertValidOpenAPI(doc);
	});

	it("normalizes :param to {param} in paths", () => {
		const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
		api.route("get", "/tasks/:id", { 200: null });

		const doc = api.document();
		expect(doc.paths["/tasks/{id}"]).toBeDefined();
	});

	it("auto-detects path params", () => {
		const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
		api.route("get", "/tasks/:id", { 200: null });

		const doc = api.document();
		const params = doc.paths["/tasks/{id}"]?.get?.parameters;
		expect(params).toHaveLength(1);
		expect(params?.[0]?.name).toBe("id");
		expect(params?.[0]?.in).toBe("path");
	});

	it("respects openapi version option", () => {
		const api = new OpenAPI({
			info: { title: "Test", version: "1.0.0" },
			openapi: "3.0.3",
		});
		const doc = api.document();
		expect(doc.openapi).toBe("3.0.3");
	});

	it("runs plugins", async () => {
		const plugin: ToOpenapiPlugin = {
			name: "test-plugin",
			transformRoute: (route) => ({ ...route, tags: ["auto"] }),
		};

		const api = new OpenAPI({
			info: { title: "Test", version: "1.0.0" },
			plugins: [plugin],
		});
		api.route("get", "/tasks", { 200: null });

		const doc = api.document();
		expect(doc.paths["/tasks"]?.get?.tags).toEqual(["auto"]);
		await assertValidOpenAPI(doc);
	});

	it("uses plugin-modified path for output and path params", () => {
		const prefixPlugin: ToOpenapiPlugin = {
			name: "prefix",
			transformRoute: (route) => ({
				...route,
				path: `/v1${route.path}`,
			}),
		};

		const api = new OpenAPI({
			info: { title: "Test", version: "1.0.0" },
			plugins: [prefixPlugin],
		});
		api.route("get", "/tasks/:id", { 200: null });

		const doc = api.document();

		expect(doc.paths["/v1/tasks/{id}"]).toBeDefined();
		expect(doc.paths["/tasks/{id}"]).toBeUndefined();

		const params = doc.paths["/v1/tasks/{id}"]?.get?.parameters;
		expect(params).toHaveLength(1);
		expect(params?.[0]?.name).toBe("id");
		expect(params?.[0]?.in).toBe("path");
	});

	it("adds webhooks via .webhook()", async () => {
		const doc = new OpenAPI({ info: { title: "Test", version: "1.0.0" } })
			.webhook("post", "orderCreated", {
				body: createMockSchema({ type: "object", properties: { orderId: { type: "string" } } }),
				200: null,
			})
			.document();

		expect(doc.webhooks).toBeDefined();
		expect(doc.webhooks?.orderCreated?.post).toBeDefined();
		expect(doc.webhooks?.orderCreated?.post?.responses?.["200"]).toEqual({
			description: "Successful response",
		});
		await assertValidOpenAPI(doc);
	});

	it("supports webhook chaining with routes", async () => {
		const doc = new OpenAPI({ info: { title: "Test", version: "1.0.0" } })
			.route("get", "/tasks", { 200: null })
			.webhook("post", "taskCreated", { 200: null })
			.document();

		expect(doc.paths["/tasks"]?.get).toBeDefined();
		expect(doc.webhooks?.taskCreated?.post).toBeDefined();
		await assertValidOpenAPI(doc);
	});

	it("throws when webhooks used with OpenAPI 3.0.3", () => {
		const api = new OpenAPI({
			info: { title: "Test", version: "1.0.0" },
			openapi: "3.0.3",
		});
		api.webhook("post", "orderCreated", { 200: null });

		expect(() => api.document()).toThrow("Webhooks are only supported in OpenAPI 3.1.0");
	});

	it("produces valid document with no routes", async () => {
		const api = new OpenAPI({ info: { title: "Empty", version: "1.0.0" } });
		const doc = api.document();
		expect(doc.paths).toEqual({});
		await assertValidOpenAPI(doc);
	});

	it("throws DUPLICATE_PATH when same route registered twice", () => {
		const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
		api.route("get", "/tasks", { 200: null });
		api.route("get", "/tasks", { 200: null });

		expect(() => api.document()).toThrow("Duplicate operation");
	});

	it("produces document with empty webhook name", async () => {
		const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
		api.webhook("post", "", { 200: null });

		const doc = api.document();
		expect(doc.webhooks?.[""]).toBeDefined();
		expect(doc.webhooks?.[""]?.post).toBeDefined();
	});

	describe("misuse and bad configuration", () => {
		it("calling document() twice produces consistent output", () => {
			const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
			api.route("get", "/tasks", { 200: null });

			const doc1 = api.document();
			const doc2 = api.document();

			expect(JSON.stringify(doc1)).toBe(JSON.stringify(doc2));
		});

		it("route added after document() is included in second call", () => {
			const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
			api.route("get", "/tasks", { 200: null });

			const doc1 = api.document();
			expect(doc1.paths["/users"]).toBeUndefined();

			api.route("get", "/users", { 200: null });
			const doc2 = api.document();
			expect(doc2.paths["/users"]?.get).toBeDefined();
			expect(doc2.paths["/tasks"]?.get).toBeDefined();
		});

		it("schema registered after first document() is seen in second call", () => {
			const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
			api.route("get", "/tasks", { 200: null });

			const doc1 = api.document();
			expect(doc1.components?.schemas?.Task).toBeUndefined();

			api.schema("Task", createMockSchema({ type: "object" }));
			api.route("get", "/tasks/:id", { 200: "Task" as any });
			const doc2 = api.document();
			expect(doc2.components?.schemas?.Task).toBeDefined();
		});

		it("mutating frozen output throws TypeError", () => {
			const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
			api.route("get", "/tasks", { 200: null });
			const doc = api.document();

			expect(() => {
				(doc.paths as any)["/new"] = {};
			}).toThrow(TypeError);
		});

		it("invalid HTTP method string is accepted by assembler", () => {
			const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
			api.route("invalid" as any, "/test", { 200: null });

			const doc = api.document();
			expect((doc.paths["/test"] as any)?.invalid).toBeDefined();
		});
	});

	describe("equivalence with openapi()", () => {
		it("produces equivalent output for same input", async () => {
			const taskSchema = createMockSchema({
				type: "object",
				properties: { id: { type: "string" } },
			});
			const querySchema = createMockObjectSchema({ page: { type: "integer" } });

			const fnDoc = openapi({
				info: { title: "Test", version: "1.0.0" },
				schemas: { Task: taskSchema },
				paths: {
					"GET /tasks": {
						query: querySchema,
						200: createMockSchema({ type: "array" }),
					},
				},
			});

			const classApi = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
			classApi.schema("Task", taskSchema);
			classApi.route("get", "/tasks", {
				query: querySchema,
				200: createMockSchema({ type: "array" }),
			});
			const classDoc = classApi.document();

			expect(fnDoc.openapi).toBe(classDoc.openapi);
			expect(fnDoc.info).toEqual(classDoc.info);
			expect(Object.keys(fnDoc.paths)).toEqual(Object.keys(classDoc.paths));

			const fnOp = fnDoc.paths["/tasks"]?.get;
			const classOp = classDoc.paths["/tasks"]?.get;
			expect(fnOp?.parameters).toEqual(classOp?.parameters);
			expect(fnOp?.operationId).toEqual(classOp?.operationId);
			await assertValidOpenAPI(fnDoc);
			await assertValidOpenAPI(classDoc);
		});
	});
});
