import { deleteTask, getTask, updateTask } from "@/lib/store";
import { parsePatch } from "@/lib/validate";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const task = await getTask(id);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
  return Response.json({ task });
}

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parsePatch(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error, fields: parsed.fields }, { status: 400 });
  }

  const result = await updateTask(id, parsed.data);
  if ("missing" in result) return Response.json({ error: "Task not found" }, { status: 404 });
  if ("error" in result) {
    return Response.json(
      { error: result.error, fields: { endTime: result.error } },
      { status: 400 },
    );
  }
  return Response.json({ task: result.task });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const removed = await deleteTask(id);
  if (!removed) return Response.json({ error: "Task not found" }, { status: 404 });
  return Response.json({ ok: true });
}
