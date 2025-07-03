import {
	PathwayRouter,
	PathwaysBuilder,
	createPostgresPathwayState,
} from "@flowcore/pathways";
import {
	todoCreated,
	todoRenamed,
	todoCompleted,
	todoReopened,
	todoDeleted,
} from "./schemas";
import postgres from "postgres";
import dotenv from "dotenv"; // eslint-disable-line @typescript-eslint/no-var-requires
// @ts-ignore: If type declarations for dotenv are missing
dotenv.config();

const apiKey = process.env.FLOWCORE_API_KEY;
const postgresUrl = process.env.POSTGRES_URL;
const tenant = process.env.FLOWCORE_TENANT;

if (!apiKey || !postgresUrl || !tenant) {
	throw new Error(
		"Missing required environment variables: FLOWCORE_API_KEY, POSTGRES_URL, or FLOWCORE_TENANT",
	);
}

// Initialize the database connection
export const sql = postgres(postgresUrl);

export const pathways = new PathwaysBuilder({
	baseUrl:
		process.env.FLOWCORE_WEBHOOK_BASE_URL || "https://webhook.api.flowcore.io",
	tenant,
	dataCore: "todo-app",
	apiKey,
})
	.withPathwayState(
		createPostgresPathwayState({ connectionString: postgresUrl }),
	)
	.register({
		flowType: "todo-items",
		eventType: "todo-item.created.v0",
		schema: todoCreated,
	})
	.register({
		flowType: "todo-items",
		eventType: "todo-item.renamed.v0",
		schema: todoRenamed,
	})
	.register({
		flowType: "todo-items",
		eventType: "todo-item.completed.v0",
		schema: todoCompleted,
	})
	.register({
		flowType: "todo-items",
		eventType: "todo-item.reopened.v0",
		schema: todoReopened,
	})
	.register({
		flowType: "todo-items",
		eventType: "todo-item.deleted.v0",
		schema: todoDeleted,
	});

export const pathwaysRouter = new PathwayRouter(pathways, "1234");
