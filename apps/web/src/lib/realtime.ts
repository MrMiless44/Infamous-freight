export function connectSSE(onEvent: (type: string, data: unknown) => void) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"}/realtime/stream`;
  const es = new EventSource(url);

  es.addEventListener("load.updated", (e: MessageEvent) => onEvent("load.updated", JSON.parse(e.data)));
  es.addEventListener("assignment.created", (e: MessageEvent) => onEvent("assignment.created", JSON.parse(e.data)));
  es.addEventListener("shipment.updated", (e: MessageEvent) => onEvent("shipment.updated", JSON.parse(e.data)));

  return () => es.close();
}
