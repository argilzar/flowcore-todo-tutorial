import type { FlowcoreLegacyEvent } from "@flowcore/pathways";
import { pathwaysRouter, pathways, sql } from "./pathways";
import "./handlers";

interface CreateTodoRequest {
	title: string;
	description?: string;
}

interface UpdateTodoRequest {
	title?: string;
	done?: boolean;
}

const server = Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);

		// Serve static files
		if (req.method === "GET" && url.pathname === "/") {
			const file = Bun.file("./public/index.html");
			return new Response(file);
		}

		if (req.method === "GET" && url.pathname.startsWith("/public/")) {
			const filePath = `.${url.pathname}`;
			const file = Bun.file(filePath);
			if (await file.exists()) {
				return new Response(file);
			}
		}

		// REST API Endpoints for Frontend
		
		// GET /api/todos - List all todos
		if (req.method === "GET" && url.pathname === "/api/todos") {
			try {
				const todos = await sql`SELECT * FROM todo ORDER BY id`;
				return new Response(JSON.stringify(todos), {
					status: 200,
					headers: { 
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*"
					},
				});
			} catch (error) {
				console.error("❌ Error fetching todos:", error);
				return new Response(
					JSON.stringify({ error: "Failed to fetch todos" }),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		// POST /api/todos - Create a new todo
		if (req.method === "POST" && url.pathname === "/api/todos") {
			try {
				const body = await req.json() as CreateTodoRequest;
				const { title, description } = body;
				
				if (!title || typeof title !== "string") {
					return new Response(
						JSON.stringify({ error: "Title is required and must be a string" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				const id = crypto.randomUUID();
				
				// Use Flowcore pathways to create the todo
				await pathways.write("todo-items/todo-item.created.v0", {
					data: {
						id,
						title,
						description: description || "",
						done: false,
					},
				});

				return new Response(
					JSON.stringify({ id, title, description, done: false }),
					{
						status: 201,
						headers: { 
							"Content-Type": "application/json",
							"Access-Control-Allow-Origin": "*"
						},
					},
				);
			} catch (error) {
				console.error("❌ Error creating todo:", error);
				return new Response(
					JSON.stringify({ error: "Failed to create todo" }),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		// PUT /api/todos/:id - Update a todo
		if (req.method === "PUT" && url.pathname.startsWith("/api/todos/")) {
			try {
				const pathParts = url.pathname.split("/");
				const id = pathParts[3];
				
				if (!id) {
					return new Response(
						JSON.stringify({ error: "Todo ID is required" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				const body = await req.json() as UpdateTodoRequest;
				const { title, done } = body;

				if (title && typeof title === "string") {
					await pathways.write("todo-items/todo-item.renamed.v0", {
						data: { id, newTitle: title },
					});
				}

				if (typeof done === "boolean") {
					if (done) {
						await pathways.write("todo-items/todo-item.completed.v0", {
							data: { id },
						});
					} else {
						await pathways.write("todo-items/todo-item.reopened.v0", {
							data: { id },
						});
					}
				}

				// Wait a bit for the events to be processed
				await new Promise(resolve => setTimeout(resolve, 100));
				
				// Fetch updated todo
				const [todo] = await sql`SELECT * FROM todo WHERE id = ${id}`;
				
				return new Response(JSON.stringify(todo), {
					status: 200,
					headers: { 
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*"
					},
				});
			} catch (error) {
				console.error("❌ Error updating todo:", error);
				return new Response(
					JSON.stringify({ error: "Failed to update todo" }),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		// DELETE /api/todos/:id - Delete a todo
		if (req.method === "DELETE" && url.pathname.startsWith("/api/todos/")) {
			try {
				const pathParts = url.pathname.split("/");
				const id = pathParts[3];
				
				if (!id) {
					return new Response(
						JSON.stringify({ error: "Todo ID is required" }),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
				
				await pathways.write("todo-items/todo-item.deleted.v0", {
					data: { id },
				});

				return new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { 
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*"
					},
				});
			} catch (error) {
				console.error("❌ Error deleting todo:", error);
				return new Response(
					JSON.stringify({ error: "Failed to delete todo" }),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		// Handle CORS preflight requests
		if (req.method === "OPTIONS") {
			return new Response(null, {
				status: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, x-secret",
				},
			});
		}

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
console.log(`🌐 Frontend available at: http://localhost:${server.port}`);
console.log(
	`📡 Transformer endpoint: http://localhost:${server.port}/api/transformer`,
);
