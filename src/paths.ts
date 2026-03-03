import { StdspecError } from "./errors.js";
import type { HttpMethod, ParsedRoute } from "./types.js";

const VALID_METHODS = new Set<string>([
	"get",
	"post",
	"put",
	"patch",
	"delete",
	"head",
	"options",
	"trace",
]);

export function parseRouteKey(key: string): ParsedRoute {
	const trimmed = key.trim();
	const spaceIndex = trimmed.search(/\s+/);

	if (spaceIndex === -1) {
		throw new StdspecError(
			"INVALID_ROUTE_KEY",
			`Invalid route key "${key}": expected "METHOD /path" format`,
		);
	}

	const rawMethod = trimmed.slice(0, spaceIndex);
	const rawPath = trimmed.slice(spaceIndex).trim();

	const method = rawMethod.toLowerCase();
	if (!VALID_METHODS.has(method)) {
		throw new StdspecError(
			"INVALID_ROUTE_KEY",
			`Invalid HTTP method "${rawMethod}" in route key "${key}"`,
		);
	}

	if (!rawPath.startsWith("/")) {
		throw new StdspecError(
			"INVALID_ROUTE_KEY",
			`Invalid path "${rawPath}" in route key "${key}": path must start with "/"`,
		);
	}

	const pathParams: string[] = [];

	const path = rawPath.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, param: string) => {
		pathParams.push(param);
		return `{${param}}`;
	});

	const braceParamRegex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
	let match: RegExpExecArray | null;
	while ((match = braceParamRegex.exec(path)) !== null) {
		const param = match[1]!;
		if (!pathParams.includes(param)) {
			pathParams.push(param);
		}
	}

	return {
		method: method as HttpMethod,
		path,
		pathParams,
	};
}

export function extractPathParams(path: string): string[] {
	const params: string[] = [];
	const regex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
	let match: RegExpExecArray | null;
	while ((match = regex.exec(path)) !== null) {
		params.push(match[1]!);
	}
	return params;
}
