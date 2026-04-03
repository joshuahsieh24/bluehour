"use client";

import { useEffect, useState, useCallback } from "react";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const enter = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setDenied(true);
    }
  }, []);

  const exit = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {/* ignore */}
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen) {
      exit();
    } else {
      enter();
    }
  }, [isFullscreen, enter, exit]);

  return { isFullscreen, toggle, enter, exit, denied };
}
