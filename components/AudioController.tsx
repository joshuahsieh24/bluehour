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
  // Tracks whether the browser blocked autoplay — cleared on successful user-initiated play
  const blockedRef = useRef(false);
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
    if (!active) return;

    // Switching to a silent scene (e.g. "still hour") — fade out and stop.
    // Must happen before the audioSrc guard so we don't leave the previous
    // Howler instance running when the new scene has no audio.
    if (!scene.audioSrc) {
      if (howlRef.current) {
        const h = howlRef.current;
        howlRef.current = null;
        h.fade(h.volume(), 0, 500);
        setTimeout(() => h.unload(), 600);
      }
      return;
    }

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

      blockedRef.current = false;

      const howl = new Howl({
        src: [scene.audioSrc!],
        loop: true,
        volume: 0,
        html5: true,
        onload: () => {
          if (cancelled) return;
          onAudioReady?.();
          setLoaded(true);
          // Only start fading in if not muted and autoplay wasn't blocked
          // (blockedRef may not be set yet at this point — handled in onplayerror)
          if (!muted && !blockedRef.current) {
            howl.fade(0, volume, 1500);
          }
        },
        onloaderror: () => {
          // Silent fail — app works fine without audio
        },
        onplayerror: () => {
          // Browser blocked autoplay — stop the fade attempt and surface the UI control
          blockedRef.current = true;
          howl.volume(0);
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

  // Mute / unmute — also handles the post-block resume
  useEffect(() => {
    if (!howlRef.current) return;
    if (muted) {
      howlRef.current.fade(howlRef.current.volume(), 0, 600);
    } else {
      if (blockedRef.current) {
        // User explicitly unblocked audio — re-attempt play
        blockedRef.current = false;
        howlRef.current.volume(0);
        howlRef.current.play();
        howlRef.current.fade(0, volume, 1000);
      } else {
        howlRef.current.fade(howlRef.current.volume(), volume, 600);
      }
    }
  }, [muted, volume]);

  // Volume change (when not muted)
  useEffect(() => {
    if (!howlRef.current || muted || blockedRef.current) return;
    howlRef.current.fade(howlRef.current.volume(), volume, 400);
  }, [volume, muted]);

  // Cleanup on deactivate
  useEffect(() => {
    if (!active) {
      destroyHowl();
    }
  }, [active, destroyHowl]);

  // Cleanup on unmount
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
