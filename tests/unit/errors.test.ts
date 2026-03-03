import { describe, expect, it } from "vitest";
import { ToOpenapiError } from "../../src/errors";
import type { ToOpenapiErrorCode } from "../../src/errors";

describe("ToOpenapiError", () => {
	it("creates an error with code and message", () => {
		const err = new ToOpenapiError("INVALID_ROUTE_KEY", "bad route");
		expect(err.message).toBe("bad route");
		expect(err.code).toBe("INVALID_ROUTE_KEY");
		expect(err.name).toBe("ToOpenapiError");
	});

	it("is an instance of Error", () => {
		const err = new ToOpenapiError("DUPLICATE_PATH", "duplicate");
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(ToOpenapiError);
	});

	it("supports all error codes", () => {
		const codes: ToOpenapiErrorCode[] = [
			"INVALID_ROUTE_KEY",
			"DUPLICATE_PATH",
			"DUPLICATE_SCHEMA",
			"SCHEMA_RESOLUTION_FAILED",
			"INVALID_DEFINITION",
		];
		for (const code of codes) {
			const err = new ToOpenapiError(code, `test ${code}`);
			expect(err.code).toBe(code);
		}
	});

	it("has a stack trace", () => {
		const err = new ToOpenapiError("INVALID_ROUTE_KEY", "test");
		expect(err.stack).toBeDefined();
		expect(err.stack).toContain("ToOpenapiError");
	});

	it("code property matches the provided code", () => {
		const err = new ToOpenapiError("SCHEMA_RESOLUTION_FAILED", "resolution failed");
		expect(err.code).toBe("SCHEMA_RESOLUTION_FAILED");
		expect(err.message).toBe("resolution failed");
	});
});
