import { describe, expect, it } from "vitest";
import { ToOpenapiError } from "../../src/errors";
import { merge } from "../../src/merge";
import type { OpenAPIDocument } from "../../src/types";

function makeDoc(overrides: Partial<OpenAPIDocument> = {}): OpenAPIDocument {
	return {
		openapi: "3.1.0",
		info: { title: "Test", version: "1.0.0" },
		paths: {},
		...overrides,
	};
}

describe("merge", () => {
	it("merges paths from multiple documents", () => {
		const base = makeDoc({ paths: { "/tasks": { get: { operationId: "get_tasks" } } } });
		const source = makeDoc({ paths: { "/users": { get: { operationId: "get_users" } } } });

		const result = merge(base, source);
		expect(result.paths["/tasks"]?.get).toBeDefined();
		expect(result.paths["/users"]?.get).toBeDefined();
	});

	it("merges different methods on same path", () => {
		const base = makeDoc({ paths: { "/tasks": { get: { operationId: "get_tasks" } } } });
		const source = makeDoc({ paths: { "/tasks": { post: { operationId: "post_tasks" } } } });

		const result = merge(base, source);
		expect(result.paths["/tasks"]?.get).toBeDefined();
		expect(result.paths["/tasks"]?.post).toBeDefined();
	});

	it("throws DUPLICATE_PATH on conflicting method+path", () => {
		const base = makeDoc({ paths: { "/tasks": { get: { operationId: "a" } } } });
		const source = makeDoc({ paths: { "/tasks": { get: { operationId: "b" } } } });

		expect(() => merge(base, source)).toThrow(ToOpenapiError);
		try {
			merge(base, source);
		} catch (err) {
			expect((err as ToOpenapiError).code).toBe("DUPLICATE_PATH");
		}
	});

	it("merges component schemas", () => {
		const base = makeDoc({ components: { schemas: { Task: { type: "object" } } } });
		const source = makeDoc({ components: { schemas: { User: { type: "object" } } } });

		const result = merge(base, source);
		expect(result.components?.schemas?.Task).toBeDefined();
		expect(result.components?.schemas?.User).toBeDefined();
	});

	it("throws DUPLICATE_SCHEMA on conflicting schema names", () => {
		const base = makeDoc({ components: { schemas: { Task: { type: "object" } } } });
		const source = makeDoc({ components: { schemas: { Task: { type: "string" } } } });

		expect(() => merge(base, source)).toThrow(ToOpenapiError);
		try {
			merge(base, source);
		} catch (err) {
			expect((err as ToOpenapiError).code).toBe("DUPLICATE_SCHEMA");
		}
	});

	it("uses info from base only", () => {
		const base = makeDoc({ info: { title: "Base API", version: "1.0.0" } });
		const source = makeDoc({ info: { title: "Source API", version: "2.0.0" } });

		const result = merge(base, source);
		expect(result.info.title).toBe("Base API");
		expect(result.info.version).toBe("1.0.0");
	});

	it("deduplicates tags by name", () => {
		const base = makeDoc({ tags: [{ name: "tasks" }] });
		const source = makeDoc({ tags: [{ name: "tasks" }, { name: "users" }] });

		const result = merge(base, source);
		expect(result.tags).toHaveLength(2);
		const names = result.tags?.map((t) => t.name);
		expect(names).toContain("tasks");
		expect(names).toContain("users");
	});

	it("uses servers from base when present", () => {
		const base = makeDoc({ servers: [{ url: "https://base.com" }] });
		const source = makeDoc({ servers: [{ url: "https://source.com" }] });

		const result = merge(base, source);
		expect(result.servers).toEqual([{ url: "https://base.com" }]);
	});

	it("uses servers from first source when base has none", () => {
		const base = makeDoc();
		const source = makeDoc({ servers: [{ url: "https://source.com" }] });

		const result = merge(base, source);
		expect(result.servers).toEqual([{ url: "https://source.com" }]);
	});

	it("uses security from base when present", () => {
		const base = makeDoc({ security: [{ bearerAuth: [] }] });
		const source = makeDoc({ security: [{ apiKey: [] }] });

		const result = merge(base, source);
		expect(result.security).toEqual([{ bearerAuth: [] }]);
	});

	it("uses security from first source when base has none", () => {
		const base = makeDoc();
		const source = makeDoc({ security: [{ apiKey: [] }] });

		const result = merge(base, source);
		expect(result.security).toEqual([{ apiKey: [] }]);
	});

	it("throws on duplicate securitySchemes", () => {
		const base = makeDoc({
			components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } } },
		});
		const source = makeDoc({
			components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } } },
		});

		expect(() => merge(base, source)).toThrow(ToOpenapiError);
		try {
			merge(base, source);
		} catch (err) {
			expect((err as ToOpenapiError).code).toBe("DUPLICATE_SCHEMA");
		}
	});

	it("merges multiple sources", () => {
		const base = makeDoc({ paths: { "/a": { get: { operationId: "a" } } } });
		const s1 = makeDoc({ paths: { "/b": { get: { operationId: "b" } } } });
		const s2 = makeDoc({ paths: { "/c": { get: { operationId: "c" } } } });

		const result = merge(base, s1, s2);
		expect(Object.keys(result.paths)).toHaveLength(3);
	});

	it("preserves base externalDocs", () => {
		const base = makeDoc({ externalDocs: { url: "https://docs.base.com" } });
		const source = makeDoc({ externalDocs: { url: "https://docs.source.com" } });

		const result = merge(base, source);
		expect(result.externalDocs?.url).toBe("https://docs.base.com");
	});

	it("merges webhooks from multiple documents", () => {
		const base = makeDoc({
			webhooks: { orderCreated: { post: { operationId: "orderCreated" } } },
		});
		const source = makeDoc({
			webhooks: { userSignedUp: { post: { operationId: "userSignedUp" } } },
		});

		const result = merge(base, source);
		expect(result.webhooks?.orderCreated?.post).toBeDefined();
		expect(result.webhooks?.userSignedUp?.post).toBeDefined();
	});

	it("throws on duplicate webhook operations", () => {
		const base = makeDoc({
			webhooks: { orderCreated: { post: { operationId: "orderCreated" } } },
		});
		const source = makeDoc({
			webhooks: { orderCreated: { post: { operationId: "orderCreated2" } } },
		});

		expect(() => merge(base, source)).toThrow(ToOpenapiError);
	});

	it("merges different methods on same webhook name", () => {
		const base = makeDoc({
			webhooks: { order: { post: { operationId: "orderPost" } } },
		});
		const source = makeDoc({
			webhooks: { order: { get: { operationId: "orderGet" } } },
		});

		const result = merge(base, source);
		expect(result.webhooks?.order?.post).toBeDefined();
		expect(result.webhooks?.order?.get).toBeDefined();
	});

	it("merges empty paths from both documents", () => {
		const base = makeDoc({ paths: {} });
		const source = makeDoc({ paths: {} });

		const result = merge(base, source);
		expect(result.paths).toEqual({});
	});

	it("merges all 8 HTTP methods on the same path", () => {
		const base = makeDoc({
			paths: {
				"/items": {
					get: { operationId: "get" },
					post: { operationId: "post" },
					put: { operationId: "put" },
					patch: { operationId: "patch" },
				},
			},
		});
		const source = makeDoc({
			paths: {
				"/items": {
					delete: { operationId: "delete" },
					head: { operationId: "head" },
					options: { operationId: "options" },
					trace: { operationId: "trace" },
				},
			},
		});

		const result = merge(base, source);
		const item = result.paths["/items"]!;
		expect(item.get).toBeDefined();
		expect(item.post).toBeDefined();
		expect(item.put).toBeDefined();
		expect(item.patch).toBeDefined();
		expect(item.delete).toBeDefined();
		expect(item.head).toBeDefined();
		expect(item.options).toBeDefined();
		expect(item.trace).toBeDefined();
	});

	it("preserves base tag description on duplicate tag name", () => {
		const base = makeDoc({ tags: [{ name: "tasks", description: "Base description" }] });
		const source = makeDoc({ tags: [{ name: "tasks", description: "Source description" }] });

		const result = merge(base, source);
		expect(result.tags).toHaveLength(1);
		expect(result.tags?.[0]?.description).toBe("Base description");
	});

	it("merges securitySchemes without schemas key", () => {
		const base = makeDoc({
			components: { securitySchemes: { bearer: { type: "http", scheme: "bearer" } } },
		});
		const source = makeDoc({
			components: { securitySchemes: { apiKey: { type: "apiKey", name: "key", in: "header" } } },
		});

		const result = merge(base, source);
		expect(result.components?.securitySchemes?.bearer).toBeDefined();
		expect(result.components?.securitySchemes?.apiKey).toBeDefined();
		expect(result.components?.schemas).toBeUndefined();
	});

	it("uses second source servers when base and first source have none", () => {
		const base = makeDoc();
		const s1 = makeDoc();
		const s2 = makeDoc({ servers: [{ url: "https://s2.com" }] });

		const result = merge(base, s1, s2);
		expect(result.servers).toEqual([{ url: "https://s2.com" }]);
	});

	it("uses second source security when base and first source have none", () => {
		const base = makeDoc();
		const s1 = makeDoc();
		const s2 = makeDoc({ security: [{ apiKey: [] }] });

		const result = merge(base, s1, s2);
		expect(result.security).toEqual([{ apiKey: [] }]);
	});

	it("merge() output is NOT frozen (unlike openapi() and OpenAPI.document())", () => {
		const base = makeDoc({ paths: { "/a": { get: { operationId: "a" } } } });
		const source = makeDoc({ paths: { "/b": { get: { operationId: "b" } } } });

		const result = merge(base, source);
		expect(Object.isFrozen(result)).toBe(false);
		expect(Object.isFrozen(result.paths)).toBe(false);
	});

	it("omits webhooks when none present", () => {
		const base = makeDoc();
		const source = makeDoc();

		const result = merge(base, source);
		expect(result.webhooks).toBeUndefined();
	});
});
