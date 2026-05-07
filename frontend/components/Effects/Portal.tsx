"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Portals children to <body>. Required for fixed-position overlays
// because parent backdrop-filter / transform / will-change creates a
// containing block that breaks `position: fixed`.
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
