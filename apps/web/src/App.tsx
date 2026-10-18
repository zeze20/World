import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { GlobeViewer, type ViewerHandle } from "./cesium/Viewer";
import { SearchBar } from "./components/SearchBar";
import { Toolbar } from "./components/Toolbar";

export function App() {
  const { t } = useTranslation();
  const [viewer, setViewer] = useState<ViewerHandle | null>(null);

  const onReady = useCallback((handle: ViewerHandle) => {
    setViewer(handle);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <header
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          className="panel"
          style={{
            padding: "8px 14px",
            fontWeight: 700,
            letterSpacing: 0.3,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
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
