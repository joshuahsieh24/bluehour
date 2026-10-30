/**
 * Runtime performance probe for bluehour.
 *
 * Paste into the DevTools console on /focus (or inject via a browser
 * automation tool) while a session is running, then:
 *
 *   await window.__bhProbe(6000)
 *
 * Reports, over the sample window:
 *   - frame pacing from requestAnimationFrame (fps, p95 gap, worst gap)
 *   - main-thread long tasks (>50ms) via PerformanceObserver
 *   - <video> decode health via getVideoPlaybackQuality()
 *   - <audio> element state (paused / readyState / volume / src)
 *   - bytes transferred per resource type since navigation
 *
 * Pure measurement; it never mutates app state.
 */
(() => {
  const bytesByType = () => {
    const out = {};
    for (const e of performance.getEntriesByType("resource")) {
      const url = e.name;
      const type = /\.(mp4|webm)(\?|$)/.test(url)
        ? "video"
        : /\.(mp3|ogg|wav|m4a)(\?|$)/.test(url)
        ? "audio"
        : /\.(jpe?g|png|webp|avif|gif|svg)(\?|$)|\/_next\/image/.test(url)
        ? "image"
        : /\.js(\?|$)/.test(url)
        ? "script"
        : /\.css(\?|$)/.test(url)
        ? "style"
        : /\.(woff2?|ttf|otf)(\?|$)/.test(url)
        ? "font"
        : "other";
      out[type] = (out[type] || 0) + (e.transferSize || 0);
    }
    return out;
  };

  const mediaState = () => {
    const videos = [...document.querySelectorAll("video")].map((v) => {
      const q = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
      return {
        src: v.currentSrc.split("/").pop(),
        size: `${v.videoWidth}x${v.videoHeight}`,
        paused: v.paused,
        readyState: v.readyState,
        currentTime: +v.currentTime.toFixed(1),
        droppedFrames: q ? q.droppedVideoFrames : null,
        totalFrames: q ? q.totalVideoFrames : null,
        droppedPct: q && q.totalVideoFrames ? +((100 * q.droppedVideoFrames) / q.totalVideoFrames).toFixed(2) : null,
      };
    });
    const audios = [...document.querySelectorAll("audio")].map((a) => ({
      src: a.currentSrc.split("/").pop() || "(none)",
      paused: a.paused,
      readyState: a.readyState,
      currentTime: +a.currentTime.toFixed(1),
      volume: +a.volume.toFixed(2),
      muted: a.muted,
      error: a.error ? a.error.code : null,
    }));
    return { videos, audios };
  };

  window.__bhProbe = (durationMs = 6000) =>
    new Promise((resolve) => {
      const gaps = [];
      const longTasks = [];
      let last = performance.now();
      let raf;
      let observer = null;
      try {
        observer = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) longTasks.push(+e.duration.toFixed(0));
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch {
        /* longtask unsupported */
      }

      const tick = (now) => {
        gaps.push(now - last);
        last = now;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      setTimeout(() => {
        cancelAnimationFrame(raf);
        if (observer) observer.disconnect();
        const sorted = [...gaps].sort((a, b) => a - b);
        const p = (q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
        const seconds = durationMs / 1000;
        resolve({
          sampleMs: durationMs,
          frames: {
            fps: +(gaps.length / seconds).toFixed(1),
            p50GapMs: +p(0.5).toFixed(1),
            p95GapMs: +p(0.95).toFixed(1),
            worstGapMs: +sorted[sorted.length - 1].toFixed(1),
            framesOver33ms: gaps.filter((g) => g > 33).length,
          },
          longTasks: { count: longTasks.length, totalMs: longTasks.reduce((a, b) => a + b, 0), worstMs: Math.max(0, ...longTasks) },
          media: mediaState(),
          transferBytes: bytesByType(),
          jsHeapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
        });
      }, durationMs);
    });

  return "probe installed: await window.__bhProbe(6000)";
})();
