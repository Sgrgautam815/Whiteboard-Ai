CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"author_id" serial NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" varchar NOT NULL,
	"project_name" varchar NOT NULL,
	"user_email" varchar NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"credits" integer DEFAULT 3,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "whiteboardData" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectid" varchar NOT NULL,
	"element" jsonb,
	"appState" jsonb,
	"files" jsonb,
	"previewImage" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whiteboardData_projectid_unique" UNIQUE("projectid")
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whiteboardData" ADD CONSTRAINT "whiteboardData_projectid_projects_project_id_fk" FOREIGN KEY ("projectid") REFERENCES "public"."projects"("project_id") ON DELETE no action ON UPDATE no action;