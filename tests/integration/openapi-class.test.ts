import { describe, expect, it } from "vitest";
import { OpenAPI } from "../../src/openapi-class";
import { openapi } from "../../src/openapi-fn";
import { createMockObjectSchema, createMockSchema } from "../helpers/mock-schemas";
import type { ToOpenapiPlugin } from "../../src/types";

describe("OpenAPI class", () => {
	it("produces a minimal valid document", () => {
		const api = new OpenAPI({ info: { title: "Test API", version: "1.0.0" } });
		const doc = api.document();

		expect(doc.openapi).toBe("3.1.0");
		expect(doc.info.title).toBe("Test API");
		expect(doc.paths).toEqual({});
	});

	it("freezes the output document", () => {
		const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
		const doc = api.document();
		expect(Object.isFrozen(doc)).toBe(true);
	});

	it("adds routes via .route()", () => {
		const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
		api.route("get", "/tasks", { 200: null });

		const doc = api.document();
		expect(doc.paths["/tasks"]?.get).toBeDefined();
		expect(doc.paths["/tasks"]?.get?.responses?.["200"]).toEqual({
			description: "Successful response",
		});
	});

	it("registers named schemas via .schema()", () => {
		const api = new OpenAPI({ info: { title: "Test", version: "1.0.0" } });
		const taskSchema = createMockSchema({ type: "object" });
		api.schema("Task", taskSchema);
		api.route("get", "/tasks/:id", { 200: "Task" as any });

		const doc = api.document();
		expect(doc.components?.schemas?.Task).toEqual({ type: "object" });
	});

	it("supports method chaining", () => {
		const doc = new OpenAPI({ info: { title: "Test", version: "1.0.0" } })
			.schema("Task", createMockSchema({ type: "object" }))
			.route("get", "/tasks", { 200: null })
			.route("post", "/tasks", { 201: null })
			.document();

		expect(doc.paths["/tasks"]?.get).toBeDefined();
		expect(doc.paths["/tasks"]?.post).toBeDefined();
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
		expect(params![0]!.name).toBe("id");
		expect(params![0]!.in).toBe("path");
	});

	it("respects openapi version option", () => {
		const api = new OpenAPI({
			info: { title: "Test", version: "1.0.0" },
			openapi: "3.0.3",
		});
		const doc = api.document();
		expect(doc.openapi).toBe("3.0.3");
	});

	it("runs plugins", () => {
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
		expect(params![0]!.name).toBe("id");
		expect(params![0]!.in).toBe("path");
	});

	describe("equivalence with openapi()", () => {
		it("produces equivalent output for same input", () => {
			const taskSchema = createMockSchema({ type: "object", properties: { id: { type: "string" } } });
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
		});
	});
});
