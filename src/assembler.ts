import { ToOpenapiError } from "./errors.js";
import type { SchemaResolver } from "./resolver.js";
import type {
	ComponentsObject,
	HttpMethod,
	OpenAPIDocument,
	OpenAPIOptions,
	OperationObject,
	PathItemObject,
	SecuritySchemeObject,
	ToOpenapiDefinition,
} from "./types.js";

export interface AssembleInput {
	info: ToOpenapiDefinition["info"];
	openapiVersion: "3.0.3" | "3.1.0";
	servers?: ToOpenapiDefinition["servers"];
	security?: ToOpenapiDefinition["security"];
	securitySchemes?: Record<string, SecuritySchemeObject>;
	tags?: ToOpenapiDefinition["tags"];
	externalDocs?: ToOpenapiDefinition["externalDocs"];
}

export function assembleDocument(
	options: AssembleInput,
	routes: { method: HttpMethod; path: string; operation: OperationObject }[],
	resolver: SchemaResolver,
	webhooks?: { method: HttpMethod; name: string; operation: OperationObject }[],
): OpenAPIDocument {
	const paths: Record<string, PathItemObject> = {};
	const operationIds = new Set<string>();

	for (const route of routes) {
		if (!paths[route.path]) {
			paths[route.path] = {};
		}

		// biome-ignore lint/style/noNonNullAssertion: path is guaranteed to exist from the check above
		const pathItem = paths[route.path]!;
		if (pathItem[route.method]) {
			throw new ToOpenapiError(
				"DUPLICATE_PATH",
				`Duplicate operation: ${route.method.toUpperCase()} ${route.path}`,
			);
		}

		if (route.operation.operationId) {
			if (operationIds.has(route.operation.operationId)) {
				throw new ToOpenapiError(
					"DUPLICATE_PATH",
					`Duplicate operationId: "${route.operation.operationId}"`,
				);
			}
			operationIds.add(route.operation.operationId);
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

	if (webhooks && webhooks.length > 0) {
		const webhookPaths: Record<string, PathItemObject> = {};
		for (const webhook of webhooks) {
			if (!webhookPaths[webhook.name]) {
				webhookPaths[webhook.name] = {};
			}
			// biome-ignore lint/style/noNonNullAssertion: name is guaranteed to exist from the check above
			const pathItem = webhookPaths[webhook.name]!;
			if (pathItem[webhook.method]) {
				throw new ToOpenapiError(
					"DUPLICATE_PATH",
					`Duplicate webhook operation: ${webhook.method.toUpperCase()} ${webhook.name}`,
				);
			}
			pathItem[webhook.method] = webhook.operation;
		}
		doc.webhooks = webhookPaths;
	}

	return doc;
}
