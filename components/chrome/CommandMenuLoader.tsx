"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useApp } from "@/lib/store";

const CommandMenu = dynamic(() => import("./CommandMenu"), { ssr: false });

/** Loads the palette bundle only the first time it is opened. */
export function CommandMenuLoader() {
  const open = useApp((s) => s.cmdOpen);
  const [load, setLoad] = useState(false);
  // derived state: once opened, keep the palette mounted
  if (open && !load) setLoad(true);
  return load ? <CommandMenu /> : null;
}
