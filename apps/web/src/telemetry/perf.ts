/**
 * Lightweight client performance telemetry.
 * No PII / exact coordinates sent. Dev panel only by default.
 */

export interface PerfSample {
  fps: number;
  frameTimeMs: number;
  timestamp: number;
}

export interface PerfSnapshot {
  fps: number;
  avgFrameMs: number;
  minFps: number;
  samples: number;
  longTasks: number;
}

const samples: PerfSample[] = [];
const MAX_SAMPLES = 120;
let longTaskCount = 0;
let rafId = 0;
let lastTs = 0;
let frames = 0;
let fpsWindowStart = 0;
let currentFps = 0;

export function startPerfMonitor(): void {
  if (typeof performance === "undefined") return;
  lastTs = performance.now();
  fpsWindowStart = lastTs;
  frames = 0;

  const loop = (ts: number) => {
    frames += 1;
    const dt = ts - lastTs;
    lastTs = ts;
    if (ts - fpsWindowStart >= 1000) {
      currentFps = Math.round((frames * 1000) / (ts - fpsWindowStart));
      samples.push({
        fps: currentFps,
        frameTimeMs: dt,
        timestamp: ts,
      });
      if (samples.length > MAX_SAMPLES) samples.shift();
      frames = 0;
      fpsWindowStart = ts;
    }
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  // Long task observer when available
  try {
    const obs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.duration > 50) longTaskCount += 1;
      }
    });
    obs.observe({ type: "longtask", buffered: true } as PerformanceObserverInit);
  } catch {
    // not supported
  }
}

export function stopPerfMonitor(): void {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

export function getPerfSnapshot(): PerfSnapshot {
  if (samples.length === 0) {
    return { fps: currentFps, avgFrameMs: 0, minFps: 0, samples: 0, longTasks: longTaskCount };
  }
  const fpsList = samples.map((s) => s.fps);
  const avgFrame =
    samples.reduce((a, s) => a + s.frameTimeMs, 0) / samples.length;
  return {
    fps: currentFps,
    avgFrameMs: Math.round(avgFrame * 10) / 10,
    minFps: Math.min(...fpsList),
    samples: samples.length,
    longTasks: longTaskCount,
  };
}
