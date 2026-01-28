export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean>;
};

export function trackEvent(event: AnalyticsEvent) {
  const target = typeof globalThis !== "undefined" ? (globalThis as any) : undefined;
  const canDispatch =
    target && typeof target.dispatchEvent === "function" && typeof target.CustomEvent === "function";

  if (canDispatch) {
    try {
      target.dispatchEvent(new target.CustomEvent("infamous:analytics", { detail: event }));
    } catch {
      // Ignore analytics dispatch failures.
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", event.name, event.properties ?? {});
  }
}
