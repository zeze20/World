import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../store";
import type { ViewerHandle } from "../cesium/Viewer";
import { formatDistance } from "../geo/index.js";
import { LayerPanel } from "./LayerPanel";
import { TelemetryPanel } from "./TelemetryPanel";
import i18n from "../i18n";

interface Props {
  viewer: ViewerHandle | null;
}

export function Toolbar({ viewer }: Props) {
  const { t } = useTranslation();
  const [showLayers, setShowLayers] = useState(false);
  const {
    cameraPosition,
    measureActive,
    measureDistanceM,
    setMeasureActive,
    clearMeasure,
    addBookmark,
    language,
    setLanguage,
    showHelp,
    setShowHelp,
    isFlying,
    bookmarks,
    removeBookmark,
    showTelemetry,
    setShowTelemetry,
  } = useAppStore();

  const toggleLang = () => {
    const next = language === "tr" ? "en" : "tr";
    setLanguage(next);
    i18n.changeLanguage(next);
  };

  const onAddBookmark = () => {
    if (!cameraPosition) return;
    const name = prompt(
      language === "tr" ? "Yer işareti adı:" : "Bookmark name:",
      `${cameraPosition.latitude.toFixed(4)}, ${cameraPosition.longitude.toFixed(4)}`
    );
    if (name) addBookmark(name, cameraPosition);
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "flex-end",
          zIndex: 10,
        }}
      >
        <div className="panel" style={{ padding: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" className="btn" onClick={onAddBookmark} data-testid="add-bookmark">
            📍 {t("addBookmark")}
          </button>
          <button
            type="button"
            className={`btn ${measureActive ? "btn-primary" : ""}`}
            onClick={() => (measureActive ? clearMeasure() : setMeasureActive(true))}
            aria-pressed={measureActive}
            data-testid="measure-toggle"
          >
            📏 {measureActive ? t("clearMeasure") : t("measureDistance")}
          </button>
          <button
            type="button"
            className={`btn ${showLayers ? "btn-primary" : ""}`}
            onClick={() => setShowLayers((v) => !v)}
            aria-expanded={showLayers}
            data-testid="layers-toggle"
          >
            🗺 {t("layers")}
          </button>
          <button type="button" className="btn" onClick={toggleLang} data-testid="lang-toggle">
            {language === "tr" ? "EN" : "TR"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setShowHelp(!showHelp)}
            aria-expanded={showHelp}
          >
            ❓ {t("help")}
          </button>
          <button
            type="button"
            className={`btn ${showTelemetry ? "btn-primary" : ""}`}
            onClick={() => setShowTelemetry(!showTelemetry)}
            data-testid="telemetry-toggle"
          >
            📊
          </button>
          {isFlying && (
            <button type="button" className="btn" onClick={() => viewer?.cancelFlight()}>
              ✕ {t("cancelFlight")}
            </button>
          )}
        </div>

        {showLayers && <LayerPanel viewer={viewer} />}
        {showTelemetry && <TelemetryPanel />}

        {measureDistanceM != null && (
          <div className="panel" style={{ padding: "8px 12px", fontSize: 14 }} data-testid="measure-result">
            {t("distance")}:{" "}
            <strong>
              {formatDistance(measureDistanceM, language === "tr" ? "tr-TR" : "en-US")}
            </strong>
          </div>
        )}

        {showHelp && (
          <div className="panel" style={{ padding: 12, maxWidth: 280, fontSize: 13 }}>
            <p style={{ margin: 0 }}>{t("helpNav")}</p>
          </div>
        )}

        {bookmarks.length > 0 && (
          <div
            className="panel"
            style={{ padding: 10, maxWidth: 280, maxHeight: 220, overflow: "auto" }}
            data-testid="bookmarks-list"
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{t("bookmarks")}</div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {bookmarks.map((b) => (
                <li
                  key={b.id}
                  style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}
                >
                  <button
                    type="button"
                    className="btn"
                    style={{ flex: 1, justifyContent: "flex-start", fontSize: 13 }}
                    onClick={() =>
                      viewer?.flyTo({
                        ...b.position,
                        height: Math.max(b.position.height, 1500),
                      })
                    }
                  >
                    {b.name}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    aria-label="Delete"
                    onClick={() => removeBookmark(b.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div
        className="panel"
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "6px 14px",
          fontSize: 13,
          fontVariantNumeric: "tabular-nums",
          zIndex: 10,
          whiteSpace: "nowrap",
        }}
        aria-live="polite"
        data-testid="coords-bar"
      >
        {cameraPosition ? (
          <>
            {t("lat")}: {cameraPosition.latitude.toFixed(5)}° · {t("lon")}:{" "}
            {cameraPosition.longitude.toFixed(5)}° · {t("height")}:{" "}
            {cameraPosition.height > 1000
              ? `${(cameraPosition.height / 1000).toFixed(1)} km`
              : `${Math.round(cameraPosition.height)} m`}
          </>
        ) : (
          "—"
        )}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 8,
          right: 12,
          fontSize: 11,
          color: "var(--muted)",
          zIndex: 10,
          maxWidth: 280,
          textAlign: "right",
        }}
      >
        {t("attribution")}
      </div>
    </>
  );
}
