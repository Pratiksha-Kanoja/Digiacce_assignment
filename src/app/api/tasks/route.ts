import { connection } from "next/server";
import { listTasks, createTask } from "@/lib/store";
import { parseCreate } from "@/lib/validate";

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const today = url.searchParams.get("today") ?? undefined;
  const tasks = await listTasks(query, today);
  return Response.json({ tasks });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseCreate(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error, fields: parsed.fields }, { status: 400 });
  }

  const task = await createTask(parsed.data);
  return Response.json({ task }, { status: 201 });
}
