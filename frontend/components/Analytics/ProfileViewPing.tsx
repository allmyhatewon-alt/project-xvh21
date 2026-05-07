"use client";

import { useEffect } from "react";

export function ProfileViewPing({ username, type = "PROFILE_VIEW" }: { username: string; type?: string }) {
  useEffect(() => {
    fetch(`/api/analytics/${encodeURIComponent(username)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
      keepalive: true,
    }).catch(() => undefined);
  }, [username, type]);

  return null;
}
