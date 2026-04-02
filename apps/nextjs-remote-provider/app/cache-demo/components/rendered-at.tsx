"use client";

import { useEffect, useState } from "react";

export function RenderedAt() {
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    setTimestamp(new Date().toISOString());
  }, []);

  return <>{timestamp || "Client render pending..."}</>;
}
