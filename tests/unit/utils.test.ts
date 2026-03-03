import { describe, expect, it } from "vitest";
import {
	deepFreeze,
	deepMerge,
	isBodyShorthandObject,
	isFullRequestBodyObject,
	isFullResponseObject,
	isResponseShorthandObject,
	isStandardJSONSchema,
} from "../../src/utils";
import { createMockSchema } from "../helpers/mock-schemas";

describe("deepMerge", () => {
	it("merges flat objects", () => {
		expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
	});

	it("overwrites primitive values", () => {
		expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
	});

	it("recursively merges nested objects", () => {
		const target = { nested: { a: 1, b: 2 } };
		const source = { nested: { b: 3, c: 4 } };
		expect(deepMerge(target, source)).toEqual({ nested: { a: 1, b: 3, c: 4 } });
	});

	it("replaces arrays instead of merging", () => {
		expect(deepMerge({ arr: [1, 2] }, { arr: [3] })).toEqual({ arr: [3] });
	});

	it("does not overwrite with undefined", () => {
		expect(deepMerge({ a: 1 }, { a: undefined })).toEqual({ a: 1 });
	});

	it("overwrites with null", () => {
		expect(deepMerge({ a: 1 }, { a: null })).toEqual({ a: null });
	});

	it("does not mutate the original target", () => {
		const target = { a: 1, nested: { b: 2 } };
		const result = deepMerge(target, { nested: { c: 3 } });
		expect(target.nested).toEqual({ b: 2 });
		expect(result.nested).toEqual({ b: 2, c: 3 });
	});

	it("handles empty source", () => {
		expect(deepMerge({ a: 1 }, {})).toEqual({ a: 1 });
	});

	it("handles empty target", () => {
		expect(deepMerge({}, { a: 1 })).toEqual({ a: 1 });
	});

	it("overwrites object with primitive", () => {
		expect(deepMerge({ a: { b: 1 } }, { a: 42 })).toEqual({ a: 42 });
	});

	it("overwrites primitive with object", () => {
		expect(deepMerge({ a: 42 }, { a: { b: 1 } })).toEqual({ a: { b: 1 } });
	});

	it("handles deeply nested structures", () => {
		const target = { a: { b: { c: { d: 1 } } } };
		const source = { a: { b: { c: { e: 2 } } } };
		expect(deepMerge(target, source)).toEqual({ a: { b: { c: { d: 1, e: 2 } } } });
	});
});

describe("deepFreeze", () => {
	it("freezes top-level properties", () => {
		const obj = deepFreeze({ a: 1, b: "hello" });
		expect(Object.isFrozen(obj)).toBe(true);
	});

	it("freezes nested objects", () => {
		const obj = deepFreeze({ nested: { a: 1 } });
		expect(Object.isFrozen(obj.nested)).toBe(true);
	});

	it("freezes deeply nested objects", () => {
		const obj = deepFreeze({ a: { b: { c: { d: 1 } } } });
		expect(Object.isFrozen(obj.a.b.c)).toBe(true);
	});

	it("freezes arrays inside objects", () => {
		const obj = deepFreeze({ items: [1, 2, 3] });
		expect(Object.isFrozen(obj.items)).toBe(true);
	});

	it("throws on mutation attempt", () => {
		const obj = deepFreeze({ a: 1 }) as { a: number };
		expect(() => {
			obj.a = 2;
		}).toThrow();
	});
});

describe("isStandardJSONSchema", () => {
	it("returns true for a valid standard JSON schema", () => {
		const schema = createMockSchema({ type: "string" });
		expect(isStandardJSONSchema(schema)).toBe(true);
	});

	it("returns false for null", () => {
		expect(isStandardJSONSchema(null)).toBe(false);
	});

	it("returns false for a plain object", () => {
		expect(isStandardJSONSchema({ type: "string" })).toBe(false);
	});

	it("returns false for an object with ~standard but no jsonSchema", () => {
		expect(isStandardJSONSchema({ "~standard": { version: 1 } })).toBe(false);
	});

	it("returns false for primitives", () => {
		expect(isStandardJSONSchema("string")).toBe(false);
		expect(isStandardJSONSchema(42)).toBe(false);
		expect(isStandardJSONSchema(undefined)).toBe(false);
	});

	it("returns false when jsonSchema is null", () => {
		expect(isStandardJSONSchema({ "~standard": { jsonSchema: null } })).toBe(false);
	});
});

describe("isFullResponseObject", () => {
	it("returns true for object with description", () => {
		expect(isFullResponseObject({ description: "OK" })).toBe(true);
	});

	it("returns true for object with content", () => {
		expect(isFullResponseObject({ content: { "application/json": {} } })).toBe(true);
	});

	it("returns false for a standard JSON schema", () => {
		const schema = createMockSchema({ type: "string" });
		expect(isFullResponseObject(schema)).toBe(false);
	});

	it("returns false for null", () => {
		expect(isFullResponseObject(null)).toBe(false);
	});

	it("returns false for plain object without description or content", () => {
		expect(isFullResponseObject({ foo: "bar" })).toBe(false);
	});
});

describe("isFullRequestBodyObject", () => {
	it("returns true for object with content", () => {
		expect(isFullRequestBodyObject({ content: { "application/json": {} } })).toBe(true);
	});

	it("returns false for object with only description", () => {
		expect(isFullRequestBodyObject({ description: "body" })).toBe(false);
	});

	it("returns false for a standard JSON schema", () => {
		const schema = createMockSchema({ type: "string" });
		expect(isFullRequestBodyObject(schema)).toBe(false);
	});

	it("returns false for null", () => {
		expect(isFullRequestBodyObject(null)).toBe(false);
	});
});

describe("isResponseShorthandObject", () => {
	it("returns true for object with schema", () => {
		expect(isResponseShorthandObject({ schema: createMockSchema({ type: "string" }) })).toBe(true);
	});

	it("returns true for object with contentType", () => {
		expect(isResponseShorthandObject({ contentType: "text/plain" })).toBe(true);
	});

	it("returns true for object with headers", () => {
		expect(isResponseShorthandObject({ headers: { "x-rate-limit": { schema: { type: "integer" } } } })).toBe(true);
	});

	it("returns true for object with example", () => {
		expect(isResponseShorthandObject({ example: { id: "123" } })).toBe(true);
	});

	it("returns true for object with examples", () => {
		expect(isResponseShorthandObject({ examples: { one: { value: 1 } } })).toBe(true);
	});

	it("returns false for object with content (full ResponseObject)", () => {
		expect(isResponseShorthandObject({ content: { "application/json": {} } })).toBe(false);
	});

	it("returns false for a standard JSON schema", () => {
		expect(isResponseShorthandObject(createMockSchema({ type: "string" }))).toBe(false);
	});

	it("returns false for null", () => {
		expect(isResponseShorthandObject(null)).toBe(false);
	});

	it("returns false for plain object without shorthand keys", () => {
		expect(isResponseShorthandObject({ foo: "bar" })).toBe(false);
	});
});

describe("isBodyShorthandObject", () => {
	it("returns true for object with schema", () => {
		expect(isBodyShorthandObject({ schema: createMockSchema({ type: "object" }) })).toBe(true);
	});

	it("returns true for object with contentType", () => {
		expect(isBodyShorthandObject({ contentType: "text/plain" })).toBe(true);
	});

	it("returns true for object with example", () => {
		expect(isBodyShorthandObject({ example: { name: "test" } })).toBe(true);
	});

	it("returns true for object with examples", () => {
		expect(isBodyShorthandObject({ examples: { one: { value: 1 } } })).toBe(true);
	});

	it("returns false for object with content (full RequestBodyObject)", () => {
		expect(isBodyShorthandObject({ content: { "application/json": {} } })).toBe(false);
	});

	it("returns false for a standard JSON schema", () => {
		expect(isBodyShorthandObject(createMockSchema({ type: "object" }))).toBe(false);
	});

	it("returns false for null", () => {
		expect(isBodyShorthandObject(null)).toBe(false);
	});
});
