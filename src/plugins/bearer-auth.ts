import type { OpenAPIDocument, RouteDefinition, StdspecPlugin } from "../types.js";

export interface BearerAuthOptions {
	schemeName?: string;
	bearerFormat?: string;
	description?: string;
	exclude?: string[];
}

export function bearerAuth(options: BearerAuthOptions = {}): StdspecPlugin {
	const schemeName = options.schemeName ?? "bearerAuth";
	const excludeSet = new Set(options.exclude ?? []);

	return {
		name: "bearerAuth",

		transformRoute(route: RouteDefinition): RouteDefinition {
			if (excludeSet.has(route.path)) {
				return route;
			}
			if (route.security) {
				return route;
			}
			return {
				...route,
				security: [{ [schemeName]: [] }],
			};
		},

		transformDocument(doc: OpenAPIDocument): OpenAPIDocument {
			const existingSchemes = doc.components?.securitySchemes ?? {};
			const existingSchemas = doc.components?.schemas;

			const securityScheme = {
				type: "http" as const,
				scheme: "bearer",
				...(options.bearerFormat ? { bearerFormat: options.bearerFormat } : {}),
				...(options.description ? { description: options.description } : {}),
			};

			return {
				...doc,
				components: {
					...doc.components,
					...(existingSchemas ? { schemas: existingSchemas } : {}),
					securitySchemes: {
						...existingSchemes,
						[schemeName]: securityScheme,
					},
				},
				security: doc.security ?? [{ [schemeName]: [] }],
			};
		},
	};
}
