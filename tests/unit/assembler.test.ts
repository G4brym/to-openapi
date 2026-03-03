import { describe, expect, it } from "vitest";
import { assembleDocument } from "../../src/assembler";
import { ToOpenapiError } from "../../src/errors";
import { SchemaResolver } from "../../src/resolver";
import type { OperationObject } from "../../src/types";
import { createMockSchema } from "../helpers/mock-schemas";

function makeResolver(version: "3.0.3" | "3.1.0" = "3.1.0") {
	return new SchemaResolver({ openapiVersion: version });
}

const baseInfo = { title: "Test API", version: "1.0.0" };

describe("assembleDocument", () => {
	it("creates a minimal document", () => {
		const resolver = makeResolver();
		const doc = assembleDocument({ info: baseInfo, openapiVersion: "3.1.0" }, [], resolver);

		expect(doc.openapi).toBe("3.1.0");
		expect(doc.info).toEqual(baseInfo);
		expect(doc.paths).toEqual({});
	});

	it("groups operations under path keys", () => {
		const resolver = makeResolver();
		const op: OperationObject = { operationId: "get_tasks", responses: {} };
		const doc = assembleDocument(
			{ info: baseInfo, openapiVersion: "3.1.0" },
			[{ method: "get", path: "/tasks", operation: op }],
			resolver,
		);

		expect(doc.paths["/tasks"]?.get).toEqual(op);
	});

	it("groups multiple methods under same path", () => {
		const resolver = makeResolver();
		const getOp: OperationObject = { operationId: "get_tasks" };
		const postOp: OperationObject = { operationId: "post_tasks" };
		const doc = assembleDocument(
			{ info: baseInfo, openapiVersion: "3.1.0" },
			[
				{ method: "get", path: "/tasks", operation: getOp },
				{ method: "post", path: "/tasks", operation: postOp },
			],
			resolver,
		);

		expect(doc.paths["/tasks"]?.get).toEqual(getOp);
		expect(doc.paths["/tasks"]?.post).toEqual(postOp);
	});

	it("throws ToOpenapiError on duplicate method+path", () => {
		const resolver = makeResolver();
		const op: OperationObject = { operationId: "get_tasks" };
		expect(() =>
			assembleDocument(
				{ info: baseInfo, openapiVersion: "3.1.0" },
				[
					{ method: "get", path: "/tasks", operation: op },
					{ method: "get", path: "/tasks", operation: op },
				],
				resolver,
			),
		).toThrow(ToOpenapiError);

		try {
			assembleDocument(
				{ info: baseInfo, openapiVersion: "3.1.0" },
				[
					{ method: "get", path: "/tasks", operation: op },
					{ method: "get", path: "/tasks", operation: op },
				],
				resolver,
			);
		} catch (err) {
			expect((err as ToOpenapiError).code).toBe("DUPLICATE_PATH");
		}
	});

	it("populates components.schemas from resolver", () => {
		const resolver = makeResolver();
		const schema = createMockSchema({ type: "object" });
		resolver.registerNamed("Task", schema);
		resolver.resolve("Task");

		const doc = assembleDocument({ info: baseInfo, openapiVersion: "3.1.0" }, [], resolver);

		expect(doc.components?.schemas?.Task).toEqual({ type: "object" });
	});

	it("places securitySchemes under components", () => {
		const resolver = makeResolver();
		const doc = assembleDocument(
			{
				info: baseInfo,
				openapiVersion: "3.1.0",
				securitySchemes: {
					bearerAuth: { type: "http", scheme: "bearer" },
				},
			},
			[],
			resolver,
		);

		expect(doc.components?.securitySchemes?.bearerAuth).toEqual({
			type: "http",
			scheme: "bearer",
		});
	});

	it("includes servers when provided", () => {
		const resolver = makeResolver();
		const doc = assembleDocument(
			{
				info: baseInfo,
				openapiVersion: "3.1.0",
				servers: [{ url: "https://api.example.com" }],
			},
			[],
			resolver,
		);

		expect(doc.servers).toEqual([{ url: "https://api.example.com" }]);
	});

	it("includes security when provided", () => {
		const resolver = makeResolver();
		const doc = assembleDocument(
			{
				info: baseInfo,
				openapiVersion: "3.1.0",
				security: [{ bearerAuth: [] }],
			},
			[],
			resolver,
		);

		expect(doc.security).toEqual([{ bearerAuth: [] }]);
	});

	it("includes tags when provided", () => {
		const resolver = makeResolver();
		const doc = assembleDocument(
			{
				info: baseInfo,
				openapiVersion: "3.1.0",
				tags: [{ name: "tasks", description: "Task operations" }],
			},
			[],
			resolver,
		);

		expect(doc.tags).toEqual([{ name: "tasks", description: "Task operations" }]);
	});

	it("includes externalDocs when provided", () => {
		const resolver = makeResolver();
		const doc = assembleDocument(
			{
				info: baseInfo,
				openapiVersion: "3.1.0",
				externalDocs: { url: "https://docs.example.com" },
			},
			[],
			resolver,
		);

		expect(doc.externalDocs).toEqual({ url: "https://docs.example.com" });
	});

	it("omits components when empty", () => {
		const resolver = makeResolver();
		const doc = assembleDocument({ info: baseInfo, openapiVersion: "3.1.0" }, [], resolver);

		expect(doc.components).toBeUndefined();
	});

	it("sets correct openapi version for 3.0.3", () => {
		const resolver = makeResolver("3.0.3");
		const doc = assembleDocument({ info: baseInfo, openapiVersion: "3.0.3" }, [], resolver);

		expect(doc.openapi).toBe("3.0.3");
	});

	it("handles multiple paths", () => {
		const resolver = makeResolver();
		const doc = assembleDocument(
			{ info: baseInfo, openapiVersion: "3.1.0" },
			[
				{ method: "get", path: "/tasks", operation: { operationId: "get_tasks" } },
				{ method: "get", path: "/users", operation: { operationId: "get_users" } },
			],
			resolver,
		);

		expect(Object.keys(doc.paths)).toHaveLength(2);
		expect(doc.paths["/tasks"]).toBeDefined();
		expect(doc.paths["/users"]).toBeDefined();
	});
});
