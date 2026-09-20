import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  credits: integer('credits').default(3),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: serial("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  projectId: varchar("project_id").notNull().unique(),
  projectName: varchar("project_name").notNull(),
  userEmail: varchar("user_email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
