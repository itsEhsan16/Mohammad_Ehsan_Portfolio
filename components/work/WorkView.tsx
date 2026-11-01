"use client";

import { useSyncExternalStore } from "react";
import type { FieldItem } from "@/lib/field/types";
import { getServerWorkView, getWorkView, subscribeWorkView } from "@/lib/field/view";
import { WorkField } from "./WorkField";

/**
 * /work shows the field or the index. The server always renders the index (for
 * no-JS, crawlers and the first paint); the pre-paint script hides it when the
 * field is due, and the field takes over as soon as React hydrates.
 */
export function WorkView({ items, children }: { items: FieldItem[]; children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribeWorkView, getWorkView, getServerWorkView);
  if (mode === "field" && items.length) return <WorkField items={items} />;
  return <div data-work-index>{children}</div>;
}
