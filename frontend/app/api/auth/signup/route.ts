"use server";

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // In a real app, you'd validate and store the user.
    // Here we simply return success.
    return NextResponse.json({ success: true, user: { email: data.email, name: data.name, company: data.company, role: data.role } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
