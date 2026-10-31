"use client";

/**
 * Registry between React and the WebGL engine. Components register the DOM
 * elements they want rendered as GL planes; the engine (loaded lazily) reads
 * this registry and keeps planes in sync. Works before the engine exists.
 */
export type PlaneVariant = "blueprint" | "halftone" | "stamp" | "plain";

export interface PlaneSpec {
  el: HTMLElement;
  /** Image URL. When absent the engine draws a procedural blueprint card from title/kind. */
  src?: string;
  title: string;
  index?: number;
  kind?: string;
  variant: PlaneVariant;
  /** "live" reads getBoundingClientRect every frame (inside sticky/transformed parents); "cached" offsets a measured rect by scroll. */
  sync?: "cached" | "live";
  /** Shared-element transition key (e.g. "/work/seva"): the case hero with the same key receives the morphing plane. */
  morphKey?: string;
}

type Listener = (type: "add" | "remove", spec: PlaneSpec) => void;

const planes = new Set<PlaneSpec>();
const listeners = new Set<Listener>();

export function addPlane(spec: PlaneSpec) {
  planes.add(spec);
  listeners.forEach((l) => l("add", spec));
}

export function removePlane(spec: PlaneSpec) {
  if (!planes.delete(spec)) return;
  listeners.forEach((l) => l("remove", spec));
}

export function getPlanes() {
  return Array.from(planes);
}

export function onPlanes(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Hero ink-field host element (one at a time). */
let inkHost: HTMLElement | null = null;
const inkListeners = new Set<(el: HTMLElement | null) => void>();
export function setInkHost(el: HTMLElement | null) {
  inkHost = el;
  inkListeners.forEach((l) => l(el));
}
export function getInkHost() {
  return inkHost;
}
export function onInkHost(l: (el: HTMLElement | null) => void) {
  inkListeners.add(l);
  return () => {
    inkListeners.delete(l);
  };
}
