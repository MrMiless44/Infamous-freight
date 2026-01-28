"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@infamous-freight/shared";
import { PrimaryButton } from "../ui/PrimaryButton";

export function TrackedPrimaryButton({
  eventName,
  children,
}: {
  eventName: string;
  children: ReactNode;
}) {
  return (
    <PrimaryButton onClick={() => trackEvent({ name: eventName })}>
      {children}
    </PrimaryButton>
  );
}
