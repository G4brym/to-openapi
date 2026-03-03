export const STATUS_DESCRIPTIONS: Record<number, string> = {
	200: "Successful response",
	201: "Resource created",
	202: "Request accepted",
	204: "No content",
	301: "Moved permanently",
	302: "Found",
	304: "Not modified",
	400: "Bad request",
	401: "Unauthorized",
	403: "Forbidden",
	404: "Not found",
	405: "Method not allowed",
	409: "Conflict",
	410: "Gone",
	412: "Precondition failed",
	415: "Unsupported media type",
	422: "Unprocessable entity",
	429: "Too many requests",
	500: "Internal server error",
	502: "Bad gateway",
	503: "Service unavailable",
	504: "Gateway timeout",
};

export function generateOperationId(method: string, path: string): string {
	const normalized = path
		.replace(/[{}]/g, "")
		.replace(/^\//, "")
		.replace(/\/$/g, "")
		.replace(/:/g, "")
		.replace(/\//g, "_")
		.replace(/[^a-zA-Z0-9_]/g, "_");

	const parts = normalized.split("_").filter(Boolean);
	const prefix = method.toLowerCase();

	if (parts.length === 0) {
		return prefix;
	}

	return `${prefix}_${parts.join("_")}`;
}
