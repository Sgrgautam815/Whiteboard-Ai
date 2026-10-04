import { boolean, integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

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
  isArchived: boolean("is_archived").default(false).notNull(),
  sharedWith: jsonb("shared_with").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const whiteboardData=pgTable('whiteboardData',{
  id: serial("id").primaryKey(),
   projectId:varchar('projectid').notNull().unique().references(()=> projects.projectId),
   elements:jsonb('element'),
   appState:jsonb('appState'),
   files:jsonb('files'),
   previewImage:text('previewImage'),
   updatedAt:timestamp("created_at").defaultNow().notNull()
});

export const liveRooms = pgTable("live_rooms", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id").notNull().unique(),
  boardId: varchar("board_id").notNull().references(() => projects.projectId),
  createdBy: varchar("created_by").notNull(),
  status: varchar("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});
  




 
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
