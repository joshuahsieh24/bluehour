"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Scene } from "@/lib/types";

// Howler is loaded client-side only
let Howl: typeof import("howler").Howl | null = null;

interface Props {
  scene: Scene;
  muted: boolean;
  volume: number;
  active: boolean;
  onAutoplayBlocked?: () => void;
  onAudioReady?: () => void;
}

export default function AudioController({
  scene,
  muted,
  volume,
  active,
  onAutoplayBlocked,
  onAudioReady,
}: Props) {
  const howlRef = useRef<InstanceType<typeof import("howler").Howl> | null>(null);
  const [, setLoaded] = useState(false);

  const destroyHowl = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.fade(howlRef.current.volume(), 0, 800);
      setTimeout(() => {
        howlRef.current?.unload();
        howlRef.current = null;
      }, 900);
    }
  }, []);

  useEffect(() => {
    if (!scene.audioSrc || !active) return;

    let cancelled = false;

    const init = async () => {
      if (!Howl) {
        try {
          const { Howl: H } = await import("howler");
          Howl = H;
        } catch {
          return;
        }
      }

      if (cancelled) return;

      // Destroy any existing sound
      if (howlRef.current) {
        howlRef.current.unload();
        howlRef.current = null;
      }

      const howl = new Howl({
        src: [scene.audioSrc!],
        loop: true,
        volume: 0,
        html5: true,
        onload: () => {
          if (cancelled) return;
          onAudioReady?.();
          setLoaded(true);
          if (!muted) {
            howl.fade(0, volume, 1500);
          }
        },
        onloaderror: () => {
          // Silent fail — app works without audio
        },
        onplayerror: () => {
          onAutoplayBlocked?.();
        },
      });

      howlRef.current = howl;
      howl.play();
    };

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id, active]);

  // Mute/unmute
  useEffect(() => {
    if (!howlRef.current) return;
    if (muted) {
      howlRef.current.fade(howlRef.current.volume(), 0, 600);
    } else {
      howlRef.current.fade(howlRef.current.volume(), volume, 600);
    }
  }, [muted, volume]);

  // Volume change
  useEffect(() => {
    if (!howlRef.current || muted) return;
    howlRef.current.fade(howlRef.current.volume(), volume, 400);
  }, [volume, muted]);

  // Cleanup on unmount / scene change / deactivate
  useEffect(() => {
    if (!active) {
      destroyHowl();
    }
  }, [active, destroyHowl]);

  useEffect(() => {
    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
        howlRef.current = null;
      }
    };
  }, []);

  return null; // Purely behavioral
}
