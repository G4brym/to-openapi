import { defineConfig } from "vitepress";

export default defineConfig({
	title: "to-openapi",
	description: "Generate OpenAPI specs from Standard Schema",

	themeConfig: {
		nav: [
			{ text: "Guide", link: "/guide/getting-started" },
			{ text: "Frameworks", link: "/frameworks/standalone" },
			{ text: "Plugins", link: "/plugins/overview" },
			{ text: "API", link: "/api/openapi-function" },
			{ text: "Examples", link: "/examples/crud-api" },
		],

		sidebar: {
			"/guide/": [
				{
					text: "Introduction",
					items: [
						{ text: "Why to-openapi?", link: "/guide/why" },
						{ text: "Getting Started", link: "/guide/getting-started" },
					],
				},
				{
					text: "Core Concepts",
					items: [
						{ text: "Route Shorthand", link: "/guide/shorthand" },
						{ text: "Schemas & $ref", link: "/guide/schemas" },
						{ text: "Responses", link: "/guide/responses" },
						{ text: "Request Parameters", link: "/guide/request-params" },
						{ text: "OpenAPI Versions", link: "/guide/openapi-versions" },
					],
				},
				{
					text: "Advanced",
					items: [
						{ text: "Composing Specs", link: "/guide/composing" },
						{ text: "Schema Extensions", link: "/guide/extending" },
						{ text: "TypeScript", link: "/guide/typescript" },
					],
				},
			],
			"/frameworks/": [
				{
					text: "Frameworks",
					items: [
						{ text: "Standalone", link: "/frameworks/standalone" },
						{ text: "Hono", link: "/frameworks/hono" },
						{ text: "Express", link: "/frameworks/express" },
						{ text: "Fastify", link: "/frameworks/fastify" },
						{ text: "Chanfana", link: "/frameworks/chanfana" },
					],
				},
			],
			"/plugins/": [
				{
					text: "Plugins",
					items: [
						{ text: "Overview", link: "/plugins/overview" },
						{ text: "Authoring Plugins", link: "/plugins/authoring" },
					],
				},
				{
					text: "Built-in Plugins",
					items: [
						{ text: "Bearer Auth", link: "/plugins/bearer-auth" },
						{ text: "Auto Tags", link: "/plugins/auto-tags" },
						{ text: "Error Responses", link: "/plugins/error-responses" },
					],
				},
			],
			"/api/": [
				{
					text: "API Reference",
					items: [
						{ text: "openapi()", link: "/api/openapi-function" },
						{ text: "OpenAPI class", link: "/api/openapi-class" },
						{ text: "merge()", link: "/api/merge" },
						{ text: "extend()", link: "/api/extend" },
						{ text: "Types", link: "/api/types" },
						{ text: "Errors", link: "/api/errors" },
						{ text: "Plugin Interface", link: "/api/plugin-interface" },
					],
				},
			],
			"/examples/": [
				{
					text: "Examples",
					items: [
						{ text: "CRUD API", link: "/examples/crud-api" },
						{ text: "Multi-Library", link: "/examples/multi-library" },
						{ text: "Cloudflare Workers", link: "/examples/cloudflare-workers" },
						{ text: "Microservices", link: "/examples/microservices" },
					],
				},
			],
			"/migration/": [
				{
					text: "Migration Guides",
					items: [
						{ text: "From zod-to-openapi", link: "/migration/from-zod-to-openapi" },
						{ text: "From @hono/zod-openapi", link: "/migration/from-hono-zod-openapi" },
						{ text: "From Chanfana v3", link: "/migration/from-chanfana-v3" },
					],
				},
			],
		},

		socialLinks: [{ icon: "github", link: "https://github.com/G4brym/to-openapi" }],

		search: {
			provider: "local",
		},

		editLink: {
			pattern: "https://github.com/G4brym/to-openapi/edit/main/docs/:path",
		},
	},
});
