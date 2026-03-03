export function deepMerge<T extends Record<string, unknown>>(
	target: T,
	source: Record<string, unknown>,
): T {
	const result = { ...target } as Record<string, unknown>;

	for (const key of Object.keys(source)) {
		const sourceVal = source[key];
		const targetVal = result[key];

		if (sourceVal === undefined) {
			continue;
		}

		if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
			result[key] = deepMerge(
				targetVal as Record<string, unknown>,
				sourceVal as Record<string, unknown>,
			);
		} else {
			result[key] = sourceVal;
		}
	}

	return result as T;
}

export function deepFreeze<T extends object>(obj: T): Readonly<T> {
	Object.freeze(obj);

	for (const value of Object.values(obj)) {
		if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
			deepFreeze(value as object);
		}
	}

	return obj;
}

export function isStandardJSONSchema(value: unknown): boolean {
	if (value === null || typeof value !== "object") {
		return false;
	}
	const std = (value as Record<string, unknown>)["~standard"];
	if (std === null || typeof std !== "object") {
		return false;
	}
	const jsonSchema = (std as Record<string, unknown>).jsonSchema;
	return jsonSchema !== null && typeof jsonSchema === "object";
}

export function isFullResponseObject(value: unknown): boolean {
	if (value === null || typeof value !== "object") {
		return false;
	}
	if (isStandardJSONSchema(value)) {
		return false;
	}
	const obj = value as Record<string, unknown>;
	return "content" in obj || "description" in obj;
}

export function isFullRequestBodyObject(value: unknown): boolean {
	if (value === null || typeof value !== "object") {
		return false;
	}
	if (isStandardJSONSchema(value)) {
		return false;
	}
	const obj = value as Record<string, unknown>;
	return "content" in obj;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== "object") {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}
