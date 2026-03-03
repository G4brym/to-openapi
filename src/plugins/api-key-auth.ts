import type { OpenAPIDocument, RouteDefinition, ToOpenapiPlugin } from "../types.js";

export interface ApiKeyAuthOptions {
	schemeName?: string;
	name: string;
	in: "header" | "query" | "cookie";
	description?: string;
	exclude?: string[];
}

export function apiKeyAuth(options: ApiKeyAuthOptions): ToOpenapiPlugin {
	const schemeName = options.schemeName ?? "apiKeyAuth";
	const excludeSet = new Set(options.exclude ?? []);

	return {
		name: "apiKeyAuth",

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
			const securityScheme = {
				type: "apiKey" as const,
				name: options.name,
				in: options.in,
				...(options.description ? { description: options.description } : {}),
			};

			return {
				...doc,
				components: {
					...doc.components,
					securitySchemes: {
						...(doc.components?.securitySchemes ?? {}),
						[schemeName]: securityScheme,
					},
				},
				security: doc.security ?? [{ [schemeName]: [] }],
			};
		},
	};
}
