"use client";

import { useEffect } from "react";
import { setState } from "@/lib/store";

/** Placeholder until the boot-sequence preloader lands: marks the app ready on mount. */
export function Preloader() {
  useEffect(() => {
    setState({ ready: true });
  }, []);
  return null;
}
