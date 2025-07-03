import { pathways, sql } from "./pathways";

pathways.handle("todo-items/todo-item.created.v0", async ({ payload }) => {
	console.log("Todo Item CREATED", payload);
	await sql`
    INSERT INTO todo (id, title, description, done)
    VALUES (${payload.id}, ${payload.title}, ${payload.description ?? null}, ${
			payload.done
		})
  `;
});

pathways.handle("todo-items/todo-item.renamed.v0", async ({ payload }) => {
	console.log("Todo Item RENAMED", payload);
	await sql`
    UPDATE todo
    SET title = ${payload.newTitle}
    WHERE id  = ${payload.id}
  `;
});

pathways.handle("todo-items/todo-item.completed.v0", async ({ payload }) => {
	console.log("Todo Item COMPLETED", payload);
	await sql`UPDATE todo SET done = true  WHERE id = ${payload.id}`;
});

pathways.handle("todo-items/todo-item.reopened.v0", async ({ payload }) => {
	console.log("Todo Item REOPENED", payload);
	await sql`UPDATE todo SET done = false WHERE id = ${payload.id}`;
});

pathways.handle("todo-items/todo-item.deleted.v0", async ({ payload }) => {
	console.log("Todo Item DELETED", payload);
	await sql`DELETE FROM todo WHERE id = ${payload.id}`;
});
