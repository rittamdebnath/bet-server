import { text, timestamp } from "drizzle-orm/pg-core";

const timestamps = {
	updatedAt: timestamp(),
	createdAt: timestamp().defaultNow().notNull(),
	deletedAt: timestamp(),

	updatedBy: text("updated_by"),
	createdBy: text("created_by").notNull(),
	deletedBy: text("deleted_by"),
};
