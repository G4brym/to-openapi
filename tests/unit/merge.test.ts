import { describe, expect, it } from "vitest";
import { merge } from "../../src/merge";
import { StdspecError } from "../../src/errors";
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

		expect(() => merge(base, source)).toThrow(StdspecError);
		try {
			merge(base, source);
		} catch (err) {
			expect((err as StdspecError).code).toBe("DUPLICATE_PATH");
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

		expect(() => merge(base, source)).toThrow(StdspecError);
		try {
			merge(base, source);
		} catch (err) {
			expect((err as StdspecError).code).toBe("DUPLICATE_SCHEMA");
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
		const names = result.tags!.map((t) => t.name);
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

		expect(() => merge(base, source)).toThrow(StdspecError);
		try {
			merge(base, source);
		} catch (err) {
			expect((err as StdspecError).code).toBe("DUPLICATE_SCHEMA");
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
});
