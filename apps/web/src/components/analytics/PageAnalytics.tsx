"use client";

import { useEffect } from "react";
import { trackEvent } from "@infamous-freight/shared";

export function PageAnalytics({
  eventName,
  properties,
}: {
  eventName: string;
  properties?: Record<string, string | number | boolean>;
}) {
  useEffect(() => {
    trackEvent({ name: eventName, properties });
  }, [eventName, properties]);

  return null;
}
