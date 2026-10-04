import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://placeholder-url';

const sql = neon(databaseUrl);
export const db = drizzle({ client: sql, schema });
export * from '@/db/schema';

let tablesInitialized = false;

export async function ensureTablesExist() {
  if (tablesInitialized || !process.env.DATABASE_URL) return;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id serial PRIMARY KEY,
        name text,
        email text NOT NULL UNIQUE,
        credits integer DEFAULT 3,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id serial PRIMARY KEY,
        project_id varchar NOT NULL UNIQUE,
        project_name varchar NOT NULL,
        user_email varchar NOT NULL,
        is_archived boolean DEFAULT false NOT NULL,
        shared_with jsonb DEFAULT '[]'::jsonb,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS shared_with jsonb DEFAULT '[]'::jsonb;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "whiteboardData" (
        id serial PRIMARY KEY,
        projectid varchar NOT NULL UNIQUE,
        element jsonb,
        "appState" jsonb,
        files jsonb,
        "previewImage" text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS live_rooms (
        id serial PRIMARY KEY,
        room_id varchar NOT NULL UNIQUE,
        board_id varchar NOT NULL,
        created_by varchar NOT NULL,
        status varchar DEFAULT 'active' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        ended_at timestamp
      );
    `;

    tablesInitialized = true;
  } catch (error) {
    console.error("Auto table creation error:", error);
  }
}

