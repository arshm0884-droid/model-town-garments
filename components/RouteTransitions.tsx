"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function RouteTransitions() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.routeReady = "true";

    root.classList.remove("mt-route-changing");
    void root.offsetWidth;
    root.classList.add("mt-route-changing");

    const timer = window.setTimeout(() => {
      root.classList.remove("mt-route-changing");
    }, 360);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
