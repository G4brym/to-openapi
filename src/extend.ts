import type { StandardJSONSchemaV1 } from "@standard-schema/spec";
import { deepMerge } from "./utils.js";

export function extend(
	schema: StandardJSONSchemaV1,
	overlay: Record<string, unknown>,
): StandardJSONSchemaV1 {
	return {
		"~standard": {
			version: schema["~standard"].version,
			vendor: schema["~standard"].vendor,
			...(schema["~standard"].types ? { types: schema["~standard"].types } : {}),
			jsonSchema: {
				input(options: StandardJSONSchemaV1.Options) {
					const base = schema["~standard"].jsonSchema.input(options);
					return deepMerge(base, overlay);
				},
				output(options: StandardJSONSchemaV1.Options) {
					const base = schema["~standard"].jsonSchema.output(options);
					return deepMerge(base, overlay);
				},
			},
		},
	};
}
