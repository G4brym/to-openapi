import { StdspecError } from "./errors.js";
import type { SchemaResolver } from "./resolver.js";
import type {
	ComponentsObject,
	HttpMethod,
	OpenAPIDocument,
	OperationObject,
	PathItemObject,
	SecuritySchemeObject,
	StdspecDefinition,
	OpenAPIOptions,
} from "./types.js";

export interface AssembleInput {
	info: StdspecDefinition["info"];
	openapiVersion: "3.0.3" | "3.1.0";
	servers?: StdspecDefinition["servers"];
	security?: StdspecDefinition["security"];
	securitySchemes?: Record<string, SecuritySchemeObject>;
	tags?: StdspecDefinition["tags"];
	externalDocs?: StdspecDefinition["externalDocs"];
}

export function assembleDocument(
	options: AssembleInput,
	routes: { method: HttpMethod; path: string; operation: OperationObject }[],
	resolver: SchemaResolver,
): OpenAPIDocument {
	const paths: Record<string, PathItemObject> = {};

	for (const route of routes) {
		if (!paths[route.path]) {
			paths[route.path] = {};
		}

		const pathItem = paths[route.path]!;
		if (pathItem[route.method]) {
			throw new StdspecError(
				"DUPLICATE_PATH",
				`Duplicate operation: ${route.method.toUpperCase()} ${route.path}`,
			);
		}

		pathItem[route.method] = route.operation;
	}

	const components: ComponentsObject = {};

	const schemas = resolver.getComponents();
	if (Object.keys(schemas).length > 0) {
		components.schemas = schemas;
	}

	if (options.securitySchemes && Object.keys(options.securitySchemes).length > 0) {
		components.securitySchemes = options.securitySchemes;
	}

	const doc: OpenAPIDocument = {
		openapi: options.openapiVersion,
		info: options.info,
		paths,
	};

	if (Object.keys(components).length > 0) {
		doc.components = components;
	}

	if (options.servers && options.servers.length > 0) {
		doc.servers = options.servers;
	}

	if (options.security && options.security.length > 0) {
		doc.security = options.security;
	}

	if (options.tags && options.tags.length > 0) {
		doc.tags = options.tags;
	}

	if (options.externalDocs) {
		doc.externalDocs = options.externalDocs;
	}

	return doc;
}
