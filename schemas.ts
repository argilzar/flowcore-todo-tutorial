import { z } from "zod";

/* full snapshot on create */
export const todoCreated = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().optional(),
	done: z.literal(false),
});

/* deltas thereafter */
export const todoRenamed = z.object({ id: z.string(), newTitle: z.string() });
export const todoCompleted = z.object({ id: z.string() });
export const todoReopened = z.object({ id: z.string() });
export const todoDeleted = z.object({ id: z.string() });
