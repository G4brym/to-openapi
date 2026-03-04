import { describe, expectTypeOf, it } from "vitest";
import { ToOpenapiError } from "../../src/errors";
import type { ToOpenapiErrorCode } from "../../src/errors";

describe("error types", () => {
	describe("ToOpenapiErrorCode", () => {
		it("accepts INVALID_ROUTE_KEY", () => {
			expectTypeOf<"INVALID_ROUTE_KEY">().toMatchTypeOf<ToOpenapiErrorCode>();
		});

		it("accepts DUPLICATE_PATH", () => {
			expectTypeOf<"DUPLICATE_PATH">().toMatchTypeOf<ToOpenapiErrorCode>();
		});

		it("accepts DUPLICATE_SCHEMA", () => {
			expectTypeOf<"DUPLICATE_SCHEMA">().toMatchTypeOf<ToOpenapiErrorCode>();
		});

		it("accepts SCHEMA_RESOLUTION_FAILED", () => {
			expectTypeOf<"SCHEMA_RESOLUTION_FAILED">().toMatchTypeOf<ToOpenapiErrorCode>();
		});

		it("accepts INVALID_DEFINITION", () => {
			expectTypeOf<"INVALID_DEFINITION">().toMatchTypeOf<ToOpenapiErrorCode>();
		});

		it("rejects non-member string", () => {
			expectTypeOf<"NOT_A_REAL_CODE">().not.toMatchTypeOf<ToOpenapiErrorCode>();
		});
	});

	describe("ToOpenapiError", () => {
		it("extends Error", () => {
			expectTypeOf<ToOpenapiError>().toMatchTypeOf<Error>();
		});

		it("has code property of type ToOpenapiErrorCode", () => {
			expectTypeOf<ToOpenapiError["code"]>().toEqualTypeOf<ToOpenapiErrorCode>();
		});
	});
});
