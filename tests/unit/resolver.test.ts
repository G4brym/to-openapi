import { describe, expect, it, vi } from "vitest";
import { SchemaResolver } from "../../src/resolver";
import { ToOpenapiError } from "../../src/errors";
import { createMockSchema, createMockObjectSchema } from "../helpers/mock-schemas";

describe("SchemaResolver", () => {
	it("resolves a named schema to a $ref", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		const schema = createMockSchema({ type: "string" });
		resolver.registerNamed("MyString", schema);

		const result = resolver.resolve("MyString");
		expect(result).toEqual({ $ref: "#/components/schemas/MyString" });
	});

	it("throws for unknown named schema", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		expect(() => resolver.resolve("Unknown")).toThrow(ToOpenapiError);
		try {
			resolver.resolve("Unknown");
		} catch (err) {
			expect((err as ToOpenapiError).code).toBe("SCHEMA_RESOLUTION_FAILED");
		}
	});

	it("resolves a registered schema object to $ref", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		const schema = createMockSchema({ type: "string" });
		resolver.registerNamed("MyString", schema);

		const result = resolver.resolve(schema);
		expect(result).toEqual({ $ref: "#/components/schemas/MyString" });
	});

	it("inlines schema on first use when not named", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		const schema = createMockSchema({ type: "number" });

		const result = resolver.resolve(schema);
		expect(result).toEqual({ type: "number" });
	});

	it("promotes to $ref on second use", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		const schema = createMockSchema({ type: "number" });

		resolver.resolve(schema);
		const second = resolver.resolve(schema);
		expect(second).toHaveProperty("$ref");
		expect((second as { $ref: string }).$ref).toMatch(/^#\/components\/schemas\//);
	});

	it("populates components when promoting to $ref", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		const schema = createMockSchema({ type: "boolean" });

		resolver.resolve(schema);
		resolver.resolve(schema);

		const components = resolver.getComponents();
		const names = Object.keys(components);
		expect(names.length).toBe(1);
		expect(Object.values(components)[0]).toEqual({ type: "boolean" });
	});

	it("populates components for named schemas", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		const schema = createMockSchema({ type: "string" });
		resolver.registerNamed("Email", schema);
		resolver.resolve("Email");

		const components = resolver.getComponents();
		expect(components.Email).toEqual({ type: "string" });
	});

	it("uses openapi-3.0 target for version 3.0.3", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.0.3" });
		const inputSpy = vi.fn().mockReturnValue({ type: "string" });
		const schema = {
			"~standard": {
				version: 1 as const,
				vendor: "test",
				jsonSchema: {
					input: inputSpy,
					output: inputSpy,
				},
			},
		};

		resolver.resolve(schema);
		expect(inputSpy).toHaveBeenCalledWith({ target: "openapi-3.0" });
	});

	it("uses draft-2020-12 target for version 3.1.0", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		const inputSpy = vi.fn().mockReturnValue({ type: "string" });
		const schema = {
			"~standard": {
				version: 1 as const,
				vendor: "test",
				jsonSchema: {
					input: inputSpy,
					output: inputSpy,
				},
			},
		};

		resolver.resolve(schema);
		expect(inputSpy).toHaveBeenCalledWith({ target: "draft-2020-12" });
	});

	it("caches resolved schemas", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		const inputSpy = vi.fn().mockReturnValue({ type: "string" });
		const schema = {
			"~standard": {
				version: 1 as const,
				vendor: "test",
				jsonSchema: {
					input: inputSpy,
					output: inputSpy,
				},
			},
		};

		resolver.registerNamed("Cached", schema);
		resolver.resolve("Cached");
		resolver.resolve("Cached");
		expect(inputSpy).toHaveBeenCalledTimes(1);
	});

	it("handles schema resolution error", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		const schema = {
			"~standard": {
				version: 1 as const,
				vendor: "test",
				jsonSchema: {
					input: () => {
						throw new Error("unsupported target");
					},
					output: () => {
						throw new Error("unsupported target");
					},
				},
			},
		};

		expect(() => resolver.resolve(schema)).toThrow(ToOpenapiError);
		try {
			resolver.resolve(schema);
		} catch (err) {
			expect((err as ToOpenapiError).code).toBe("SCHEMA_RESOLUTION_FAILED");
		}
	});

	it("generates deterministic hash for auto-naming", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		const schema = createMockSchema({ type: "string", minLength: 1 });

		resolver.resolve(schema);
		const ref = resolver.resolve(schema) as { $ref: string };
		const name1 = ref.$ref.split("/").pop()!;

		const resolver2 = new SchemaResolver({ openapiVersion: "3.1.0" });
		const schema2 = createMockSchema({ type: "string", minLength: 1 });

		resolver2.resolve(schema2);
		const ref2 = resolver2.resolve(schema2) as { $ref: string };
		const name2 = ref2.$ref.split("/").pop()!;

		expect(name1).toBe(name2);
	});

	it("resolves object schemas correctly", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		const schema = createMockObjectSchema(
			{ name: { type: "string" }, age: { type: "number" } },
			["name"],
		);

		const result = resolver.resolve(schema) as Record<string, unknown>;
		expect(result.type).toBe("object");
		expect(result.properties).toEqual({
			name: { type: "string" },
			age: { type: "number" },
		});
		expect(result.required).toEqual(["name"]);
	});

	it("handles multiple named schemas", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		resolver.registerNamed("User", createMockSchema({ type: "object" }));
		resolver.registerNamed("Task", createMockSchema({ type: "object", title: "Task" }));

		const userRef = resolver.resolve("User");
		const taskRef = resolver.resolve("Task");

		expect(userRef).toEqual({ $ref: "#/components/schemas/User" });
		expect(taskRef).toEqual({ $ref: "#/components/schemas/Task" });

		const components = resolver.getComponents();
		expect(Object.keys(components)).toHaveLength(2);
		expect(components.User).toEqual({ type: "object" });
		expect(components.Task).toEqual({ type: "object", title: "Task" });
	});

	it("returns same $ref for same named schema resolved multiple times", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		const schema = createMockSchema({ type: "string" });
		resolver.registerNamed("Token", schema);

		const ref1 = resolver.resolve("Token");
		const ref2 = resolver.resolve(schema);
		expect(ref1).toEqual(ref2);
	});

	it("returns empty components when nothing resolved", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		expect(resolver.getComponents()).toEqual({});
	});

	it("auto-names with vendor prefix when available", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		const schema = createMockSchema({ type: "string" }, { vendor: "zod" });

		resolver.resolve(schema);
		const ref = resolver.resolve(schema) as { $ref: string };
		expect(ref.$ref).toMatch(/zod_Schema_/);
	});

	it("disambiguates when vendor name collides with existing named schema", () => {
		const resolver = new SchemaResolver({ openapiVersion: "3.1.0" });
		// Pre-register a schema with the name that auto-naming would generate
		const existing = createMockSchema({ type: "object" }, { vendor: "zod" });
		resolver.registerNamed("zod_Schema_0", existing);

		// Now auto-name a different zod schema — should not collide
		const schema = createMockSchema({ type: "string" }, { vendor: "zod" });
		resolver.resolve(schema);
		const ref = resolver.resolve(schema) as { $ref: string };
		const name = ref.$ref.split("/").pop()!;

		expect(name).not.toBe("zod_Schema_0");
		// Should still be in components
		const components = resolver.getComponents();
		expect(components[name]).toEqual({ type: "string" });
	});
});
