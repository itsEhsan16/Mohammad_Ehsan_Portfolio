"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type ComponentProps, type Ref } from "react";
import { scrollToHash, transitionTo } from "@/lib/transition";
import { click } from "@/lib/audio";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  /** Morph the WebGL plane inside this link into the next page (shared-element transition). */
  morph?: boolean;
  ref?: Ref<HTMLAnchorElement>;
};

/**
 * next/link with page transitions. Uses `onNavigate`, which only fires for real
 * client-side navigations — modifier-clicks and new tabs behave natively.
 */
export function TransitionLink({ href, morph, onNavigate, onClick, ref, ...rest }: Props) {
  const router = useRouter();
  const clicked = useRef<HTMLAnchorElement | null>(null);

  return (
    <Link
      ref={ref}
      href={href}
      onClick={(e) => {
        clicked.current = e.currentTarget;
        click();
        onClick?.(e);
      }}
      onNavigate={(e) => {
        onNavigate?.(e);
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname) {
          // same page: smooth-scroll to the anchor (or the top) instead of re-navigating
          e.preventDefault();
          if (url.hash) {
            scrollToHash(url.hash);
            history.replaceState(null, "", url.hash);
          } else {
            scrollToHash("#top");
          }
          return;
        }
        e.preventDefault();
        void transitionTo(router, href, { morphFrom: morph ? clicked.current : null });
      }}
      {...rest}
    />
  );
}
