import type { StandardJSONSchemaV1 } from "@standard-schema/spec";

export function createMockSchema(
	jsonSchema: Record<string, unknown>,
	options?: { vendor?: string },
): StandardJSONSchemaV1 {
	return {
		"~standard": {
			version: 1,
			vendor: options?.vendor ?? "mock",
			jsonSchema: {
				input: (_opts: StandardJSONSchemaV1.Options) => structuredClone(jsonSchema),
				output: (_opts: StandardJSONSchemaV1.Options) => structuredClone(jsonSchema),
			},
		},
	};
}

export function createMockObjectSchema(
	properties: Record<string, Record<string, unknown>>,
	required?: string[],
): StandardJSONSchemaV1 {
	const jsonSchema: Record<string, unknown> = {
		type: "object",
		properties,
	};
	if (required && required.length > 0) {
		jsonSchema.required = required;
	}
	return createMockSchema(jsonSchema);
}
