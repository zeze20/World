import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPerfSnapshot, type PerfSnapshot } from "../telemetry/perf";

export function TelemetryPanel() {
  const { t } = useTranslation();
  const [snap, setSnap] = useState<PerfSnapshot | null>(null);

  useEffect(() => {
    const id = setInterval(() => setSnap(getPerfSnapshot()), 500);
    return () => clearInterval(id);
  }, []);

  if (!snap) return null;

  return (
    <div
      className="panel"
      style={{ padding: "8px 12px", fontSize: 12, fontVariantNumeric: "tabular-nums" }}
      aria-live="off"
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{t("telemetry")}</div>
      <div>
        {t("fps")}: <strong>{snap.fps}</strong> (min {snap.minFps})
      </div>
      <div>
        Frame: {snap.avgFrameMs} ms · {t("longTasks")}: {snap.longTasks}
      </div>
    </div>
  );
}
