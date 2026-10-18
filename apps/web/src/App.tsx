import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GlobeViewer, type ViewerHandle } from "./cesium/Viewer";
import { SearchBar } from "./components/SearchBar";
import { Toolbar } from "./components/Toolbar";
import { OfflineBanner } from "./components/OfflineBanner";
import { ErrorBanner } from "./components/ErrorBanner";
import { useAppStore } from "./store";
import { startPerfMonitor, stopPerfMonitor } from "./telemetry/perf";

export function App() {
  const { t } = useTranslation();
  const [viewer, setViewer] = useState<ViewerHandle | null>(null);
  const setOnline = useAppStore((s) => s.setOnline);

  const onReady = useCallback((handle: ViewerHandle) => {
    setViewer(handle);
  }, []);

  useEffect(() => {
    startPerfMonitor();
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    setOnline(navigator.onLine);
    return () => {
      stopPerfMonitor();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [setOnline]);

  return (
    <div className="app-shell" data-testid="app-root">
      <OfflineBanner />
      <ErrorBanner />
      <header className="app-header">
        <div className="panel app-brand">
          <span aria-hidden>🌍</span>
          {t("appName")}
        </div>
        <SearchBar viewer={viewer} />
      </header>

      <Toolbar viewer={viewer} />
      <GlobeViewer onReady={onReady} />
    </div>
  );
}
