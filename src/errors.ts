export type StdspecErrorCode =
	| "INVALID_ROUTE_KEY"
	| "DUPLICATE_PATH"
	| "DUPLICATE_SCHEMA"
	| "SCHEMA_RESOLUTION_FAILED"
	| "INVALID_DEFINITION";

export class StdspecError extends Error {
	readonly code: StdspecErrorCode;

	constructor(code: StdspecErrorCode, message: string) {
		super(message);
		Object.setPrototypeOf(this, new.target.prototype);
		this.name = "StdspecError";
		this.code = code;
	}
}
