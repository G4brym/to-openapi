import type { RouteDefinition, ToOpenapiPlugin } from "../types.js";

export interface AutoTagsOptions {
	prefix?: string;
}

export function autoTags(options: AutoTagsOptions = {}): ToOpenapiPlugin {
	return {
		name: "autoTags",

		transformRoute(route: RouteDefinition): RouteDefinition {
			if (route.tags && route.tags.length > 0) {
				return route;
			}

			const segments = route.path.split("/").filter(Boolean);
			const firstSegment = segments[0];
			if (!firstSegment) {
				return route;
			}

			// Skip path params as tags
			if (firstSegment.startsWith("{") && firstSegment.endsWith("}")) {
				return route;
			}

			const tag = options.prefix ? `${options.prefix}${firstSegment}` : firstSegment;

			return {
				...route,
				tags: [tag],
			};
		},
	};
}
