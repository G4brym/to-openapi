import type { StandardJSONSchemaV1 } from "@standard-schema/spec";
import type { ResponseObject, RouteDefinition, StdspecPlugin } from "../types.js";

export interface ErrorResponseEntry {
	status: number;
	schema?: StandardJSONSchemaV1;
	description?: string;
}

export function errorResponses(errors: ErrorResponseEntry[]): StdspecPlugin {
	return {
		name: "errorResponses",

		transformRoute(route: RouteDefinition): RouteDefinition {
			const existingKeys = new Set(
				Object.keys(route).filter((k) => {
					const n = Number(k);
					return Number.isInteger(n) && n >= 100 && n <= 599;
				}),
			);

			let modified = false;
			const additions: Record<string, unknown> = {};

			for (const entry of errors) {
				const key = String(entry.status);
				if (existingKeys.has(key)) {
					continue;
				}

				modified = true;
				if (entry.schema) {
					additions[key] = entry.schema;
				} else if (entry.description) {
					additions[key] = { description: entry.description } as ResponseObject;
				} else {
					additions[key] = null;
				}
			}

			if (!modified) {
				return route;
			}

			return { ...route, ...additions };
		},
	};
}
