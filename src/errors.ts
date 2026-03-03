export type ToOpenapiErrorCode =
	| "INVALID_ROUTE_KEY"
	| "DUPLICATE_PATH"
	| "DUPLICATE_SCHEMA"
	| "SCHEMA_RESOLUTION_FAILED"
	| "INVALID_DEFINITION";

export class ToOpenapiError extends Error {
	readonly code: ToOpenapiErrorCode;

	constructor(code: ToOpenapiErrorCode, message: string) {
		super(message);
		Object.setPrototypeOf(this, new.target.prototype);
		this.name = "ToOpenapiError";
		this.code = code;
	}
}
