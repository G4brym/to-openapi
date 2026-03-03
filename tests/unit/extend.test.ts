import { describe, expect, it } from "vitest";
import { extend } from "../../src/extend";
import { createMockSchema } from "../helpers/mock-schemas";
import type { StandardJSONSchemaV1 } from "@standard-schema/spec";

describe("extend", () => {
	it("overlays properties onto schema output", () => {
		const schema = createMockSchema({ type: "object", properties: { name: { type: "string" } } });
		const extended = extend(schema, { title: "User" });

		const result = extended["~standard"].jsonSchema.input({ target: "draft-2020-12" });
		expect(result).toEqual({
			type: "object",
			properties: { name: { type: "string" } },
			title: "User",
		});
	});

	it("overlay appears in both input and output", () => {
		const schema = createMockSchema({ type: "string" });
		const extended = extend(schema, { description: "An email" });

		const input = extended["~standard"].jsonSchema.input({ target: "draft-2020-12" });
		const output = extended["~standard"].jsonSchema.output({ target: "draft-2020-12" });
		expect(input.description).toBe("An email");
		expect(output.description).toBe("An email");
	});

	it("preserves original schema", () => {
		const schema = createMockSchema({ type: "string" });
		extend(schema, { title: "Extended" });

		const original = schema["~standard"].jsonSchema.input({ target: "draft-2020-12" });
		expect(original.title).toBeUndefined();
	});

	it("deep merges overlay into base", () => {
		const schema = createMockSchema({
			type: "object",
			properties: { name: { type: "string" } },
		});
		const extended = extend(schema, {
			properties: { age: { type: "number" } },
		});

		const result = extended["~standard"].jsonSchema.input({ target: "draft-2020-12" });
		expect(result.properties).toEqual({
			name: { type: "string" },
			age: { type: "number" },
		});
	});

	it("preserves ~standard.version", () => {
		const schema = createMockSchema({ type: "string" });
		const extended = extend(schema, { title: "Test" });
		expect(extended["~standard"].version).toBe(1);
	});

	it("preserves ~standard.vendor", () => {
		const schema = createMockSchema({ type: "string" }, { vendor: "zod" });
		const extended = extend(schema, { title: "Test" });
		expect(extended["~standard"].vendor).toBe("zod");
	});

	it("is composable: extend(extend(schema, a), b)", () => {
		const schema = createMockSchema({ type: "object" });
		const step1 = extend(schema, { title: "Step1" });
		const step2 = extend(step1, { description: "Step2" });

		const result = step2["~standard"].jsonSchema.input({ target: "draft-2020-12" });
		expect(result.title).toBe("Step1");
		expect(result.description).toBe("Step2");
	});

	it("later overlay overrides earlier", () => {
		const schema = createMockSchema({ type: "object", title: "Original" });
		const extended = extend(schema, { title: "Overridden" });

		const result = extended["~standard"].jsonSchema.input({ target: "draft-2020-12" });
		expect(result.title).toBe("Overridden");
	});

	it("handles empty overlay", () => {
		const schema = createMockSchema({ type: "string" });
		const extended = extend(schema, {});

		const result = extended["~standard"].jsonSchema.input({ target: "draft-2020-12" });
		expect(result).toEqual({ type: "string" });
	});

	it("passes target through to base schema", () => {
		let receivedTarget: string | undefined;
		const schema: StandardJSONSchemaV1 = {
			"~standard": {
				version: 1,
				vendor: "test",
				jsonSchema: {
					input(opts) {
						receivedTarget = opts.target;
						return { type: "string" };
					},
					output(opts) {
						return { type: "string" };
					},
				},
			},
		};

		const extended = extend(schema, { title: "Test" });
		extended["~standard"].jsonSchema.input({ target: "openapi-3.0" });
		expect(receivedTarget).toBe("openapi-3.0");
	});

	it("triple composition stacks correctly", () => {
		const schema = createMockSchema({ type: "object" });
		const a = extend(schema, { title: "A" });
		const b = extend(a, { description: "B" });
		const c = extend(b, { examples: ["C"] });

		const result = c["~standard"].jsonSchema.input({ target: "draft-2020-12" });
		expect(result.title).toBe("A");
		expect(result.description).toBe("B");
		expect(result.examples).toEqual(["C"]);
	});

	it("overlay adds required array", () => {
		const schema = createMockSchema({
			type: "object",
			properties: { name: { type: "string" } },
		});
		const extended = extend(schema, { required: ["name"] });

		const result = extended["~standard"].jsonSchema.input({ target: "draft-2020-12" });
		expect(result.required).toEqual(["name"]);
	});
});
