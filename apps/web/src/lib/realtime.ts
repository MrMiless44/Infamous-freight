import { EventSourcePolyfill } from "event-source-polyfill";

export function connectSSE(onEvent: (type: string, data: unknown) => void) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  const url = `${baseUrl}/realtime/stream`;

  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;

  const es =
    token != null
      ? new EventSourcePolyfill(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      : new EventSource(url);

  es.addEventListener("load.updated", (e: MessageEvent) =>
    onEvent("load.updated", JSON.parse(e.data)),
  );
  es.addEventListener("assignment.created", (e: MessageEvent) =>
    onEvent("assignment.created", JSON.parse(e.data)),
  );
  es.addEventListener("assignment.updated", (e: MessageEvent) =>
    onEvent("assignment.updated", JSON.parse(e.data)),
  );
  return () => es.close();
}
