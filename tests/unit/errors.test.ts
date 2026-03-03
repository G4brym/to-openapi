import { describe, expect, it } from "vitest";
import { StdspecError } from "../../src/errors";
import type { StdspecErrorCode } from "../../src/errors";

describe("StdspecError", () => {
	it("creates an error with code and message", () => {
		const err = new StdspecError("INVALID_ROUTE_KEY", "bad route");
		expect(err.message).toBe("bad route");
		expect(err.code).toBe("INVALID_ROUTE_KEY");
		expect(err.name).toBe("StdspecError");
	});

	it("is an instance of Error", () => {
		const err = new StdspecError("DUPLICATE_PATH", "duplicate");
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(StdspecError);
	});

	it("supports all error codes", () => {
		const codes: StdspecErrorCode[] = [
			"INVALID_ROUTE_KEY",
			"DUPLICATE_PATH",
			"DUPLICATE_SCHEMA",
			"SCHEMA_RESOLUTION_FAILED",
			"INVALID_DEFINITION",
		];
		for (const code of codes) {
			const err = new StdspecError(code, `test ${code}`);
			expect(err.code).toBe(code);
		}
	});

	it("has a stack trace", () => {
		const err = new StdspecError("INVALID_ROUTE_KEY", "test");
		expect(err.stack).toBeDefined();
		expect(err.stack).toContain("StdspecError");
	});

	it("code property matches the provided code", () => {
		const err = new StdspecError("SCHEMA_RESOLUTION_FAILED", "resolution failed");
		expect(err.code).toBe("SCHEMA_RESOLUTION_FAILED");
		expect(err.message).toBe("resolution failed");
	});
});
