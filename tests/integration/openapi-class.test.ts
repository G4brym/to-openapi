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
