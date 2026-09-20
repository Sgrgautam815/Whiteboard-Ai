
import { db } from "@/db";
import { users } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const email = user.primaryEmailAddress?.emailAddress;

  if (!email) {
    return NextResponse.json({ message: "User email is missing" }, { status: 400 });
  }

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUser.length > 0) {
    return NextResponse.json(existingUser[0]);
  }

  const result = await db
    .insert(users)
    .values({
      name: user.fullName,
      email,
    })
    .returning();

  return NextResponse.json(result[0]);
}
