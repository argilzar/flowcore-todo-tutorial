import type { FlowcoreLegacyEvent } from "@flowcore/pathways";
import { pathwaysRouter } from "./pathways";
import "./handlers";

const server = Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);

		// POST endpoint to receive events from Flowcore platform
		if (
			req.method === "POST" &&
			(url.pathname === "/api/transformer" ||
				url.pathname === "/api/transformer/")
		) {
			try {
				const body = await req.json();
				const event = body as FlowcoreLegacyEvent;
				const secret = req.headers.get("x-secret") ?? "";

				await pathwaysRouter.processEvent(event, secret);

				return new Response("OK", {
					status: 200,
					headers: { "Content-Type": "text/plain" },
				});
			} catch (error) {
				console.error("❌ Error processing Flowcore event:", error);
				return new Response(
					JSON.stringify({ error: (error as Error).message }),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		return new Response("Not Found", { status: 404 });
	},
});

console.log(`🚀 Server running on http://localhost:${server.port}`);
console.log(
	`📡 Transformer endpoint: http://localhost:${server.port}/api/transformer`,
);
