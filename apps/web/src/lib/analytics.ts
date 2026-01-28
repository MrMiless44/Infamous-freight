type AnalyticsPayload = Record<string, string | number | boolean>;

export function trackEvent(name: string, payload?: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  const detail = {
    name,
    payload: payload ?? {},
    ts: Date.now(),
  };
  window.dispatchEvent(new CustomEvent("ffe:analytics", { detail }));
  const dataLayer = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({ event: name, ...payload });
  }
}
