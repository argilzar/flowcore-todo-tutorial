import { sleep } from "bun";
import { pathways, sql } from "./pathways";

// you can add this after each write to see more slowly what's happening.
async function dump(label: string) {
	await sleep(300); // give Flowcore -> handler -> DB time
	const [row] = await sql`SELECT * FROM todo WHERE id = ${id}`;
	console.log(`\n🔎 ${label}`);
	console.table(row);
}

const id = crypto.randomUUID();

await pathways.write("todo-items/todo-item.created.v0", {
	data: {
		id,
		title: "Buy milk",
		description: "2 litres, semi-skimmed",
		done: false,
	},
});

await pathways.write("todo-items/todo-item.renamed.v0", {
	data: { id, newTitle: "Buy oat milk" },
});

await pathways.write("todo-items/todo-item.completed.v0", {
	data: { id },
});

await pathways.write("todo-items/todo-item.reopened.v0", {
	data: { id },
});

console.log("\n✅ demo events sent");

await sql.end();
process.exit(0);
