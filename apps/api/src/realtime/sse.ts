import type { Request, Response } from "express";

type Client = { id: string; res: Response; tenantId: string };

const clients = new Map<string, Client>();

export function sseHandler(req: Request, res: Response) {
  const tenantId = String((req as any).auth?.organizationId ?? "");
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  res.write(`event: hello\ndata: ${JSON.stringify({ id })}\n\n`);
  clients.set(id, { id, res, tenantId });

  req.on("close", () => {
    clients.delete(id);
  });
}

export function sseBroadcast(tenantId: string, event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of clients.values()) {
    if (c.tenantId === tenantId) c.res.write(payload);
  }
}
