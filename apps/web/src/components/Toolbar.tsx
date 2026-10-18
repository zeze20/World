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
  const [showBookmarks, setShowBookmarks] = useState(false);
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
    const name = window.prompt(
      language === "tr" ? "Yer işareti adı:" : "Bookmark name:",
      `${cameraPosition.latitude.toFixed(4)}, ${cameraPosition.longitude.toFixed(4)}`
    );
    if (name) {
      addBookmark(name, cameraPosition);
      setShowBookmarks(true);
    }
  };

  const onMeasure = () => {
    if (measureActive) clearMeasure();
    else setMeasureActive(true);
  };

  const closePanels = () => {
    setShowLayers(false);
    setShowHelp(false);
    setShowTelemetry(false);
  };

  const actionButtons = (
    <>
      <button
        type="button"
        className="btn"
        onClick={onAddBookmark}
        data-testid="add-bookmark"
        title={t("addBookmark")}
        aria-label={t("addBookmark")}
      >
        <span aria-hidden>📍</span>
        <span className="btn-label">{t("addBookmark")}</span>
      </button>
      <button
        type="button"
        className={`btn ${measureActive ? "btn-primary" : ""}`}
        onClick={onMeasure}
        aria-pressed={measureActive}
        data-testid="measure-toggle"
        title={measureActive ? t("clearMeasure") : t("measureDistance")}
        aria-label={measureActive ? t("clearMeasure") : t("measureDistance")}
      >
        <span aria-hidden>📏</span>
        <span className="btn-label">
          {measureActive ? t("clearMeasure") : t("measureDistance")}
        </span>
      </button>
      <button
        type="button"
        className={`btn ${showLayers ? "btn-primary" : ""}`}
        onClick={() => {
          setShowLayers((v) => !v);
          setShowBookmarks(false);
          setShowHelp(false);
        }}
        aria-expanded={showLayers}
        data-testid="layers-toggle"
        title={t("layers")}
        aria-label={t("layers")}
      >
        <span aria-hidden>🗺</span>
        <span className="btn-label">{t("layers")}</span>
      </button>
      <button
        type="button"
        className="btn"
        onClick={toggleLang}
        data-testid="lang-toggle"
        title={t("language")}
        aria-label={t("language")}
      >
        {language === "tr" ? "EN" : "TR"}
      </button>
      <button
        type="button"
        className={`btn ${showHelp ? "btn-primary" : ""}`}
        onClick={() => {
          setShowHelp(!showHelp);
          setShowLayers(false);
        }}
        aria-expanded={showHelp}
        title={t("help")}
        aria-label={t("help")}
      >
        <span aria-hidden>❓</span>
        <span className="btn-label">{t("help")}</span>
      </button>
      <button
        type="button"
        className={`btn ${showTelemetry ? "btn-primary" : ""}`}
        onClick={() => setShowTelemetry(!showTelemetry)}
        data-testid="telemetry-toggle"
        title={t("telemetry")}
        aria-label={t("telemetry")}
      >
        📊
      </button>
      {bookmarks.length > 0 && (
        <button
          type="button"
          className={`btn ${showBookmarks ? "btn-primary" : ""}`}
          onClick={() => {
            setShowBookmarks((v) => !v);
            setShowLayers(false);
          }}
          aria-expanded={showBookmarks}
          title={t("bookmarks")}
          aria-label={t("bookmarks")}
        >
          <span aria-hidden>⭐</span>
          <span className="btn-label">{t("bookmarks")}</span>
        </button>
      )}
      {isFlying && (
        <button
          type="button"
          className="btn"
          onClick={() => viewer?.cancelFlight()}
          aria-label={t("cancelFlight")}
        >
          ✕ <span className="btn-label">{t("cancelFlight")}</span>
        </button>
      )}
    </>
  );

  return (
    <>
      {/* Desktop / tablet top-right dock */}
      <div className="toolbar-dock">
        <div className="panel toolbar-actions">{actionButtons}</div>

        {showLayers && <LayerPanel viewer={viewer} />}
        {showTelemetry && <TelemetryPanel />}

        {measureDistanceM != null && (
          <div className="panel side-panel" data-testid="measure-result" style={{ padding: "8px 12px" }}>
            {t("distance")}:{" "}
            <strong>
              {formatDistance(measureDistanceM, language === "tr" ? "tr-TR" : "en-US")}
            </strong>
          </div>
        )}

        {showHelp && (
          <div className="panel side-panel">
            <p style={{ margin: 0, fontSize: 13 }}>{t("helpNav")}</p>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--muted)" }}>
              {t("helpTouch")}
            </p>
          </div>
        )}

        {showBookmarks && bookmarks.length > 0 && (
          <div className="panel side-panel" data-testid="bookmarks-list">
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
                    onClick={() => {
                      viewer?.flyTo({
                        ...b.position,
                        height: Math.max(b.position.height, 1500),
                      });
                      closePanels();
                      setShowBookmarks(false);
                    }}
                  >
                    {b.name}
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon"
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

      {/* Mobile bottom action bar */}
      <div className="panel mobile-bar" role="toolbar" aria-label="Mobile tools">
        <button
          type="button"
          className="btn btn-icon"
          onClick={onAddBookmark}
          aria-label={t("addBookmark")}
        >
          📍
        </button>
        <button
          type="button"
          className={`btn btn-icon ${measureActive ? "btn-primary" : ""}`}
          onClick={onMeasure}
          aria-pressed={measureActive}
          aria-label={measureActive ? t("clearMeasure") : t("measureDistance")}
        >
          📏
        </button>
        <button
          type="button"
          className={`btn btn-icon ${showLayers ? "btn-primary" : ""}`}
          onClick={() => {
            setShowLayers((v) => !v);
            setShowBookmarks(false);
            setShowHelp(false);
          }}
          aria-expanded={showLayers}
          aria-label={t("layers")}
        >
          🗺
        </button>
        <button type="button" className="btn btn-icon" onClick={toggleLang} aria-label={t("language")}>
          {language === "tr" ? "EN" : "TR"}
        </button>
        <button
          type="button"
          className={`btn btn-icon ${showHelp ? "btn-primary" : ""}`}
          onClick={() => {
            setShowHelp(!showHelp);
            setShowLayers(false);
          }}
          aria-label={t("help")}
        >
          ❓
        </button>
        {bookmarks.length > 0 && (
          <button
            type="button"
            className={`btn btn-icon ${showBookmarks ? "btn-primary" : ""}`}
            onClick={() => {
              setShowBookmarks((v) => !v);
              setShowLayers(false);
            }}
            aria-label={t("bookmarks")}
          >
            ⭐
          </button>
        )}
        {isFlying && (
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => viewer?.cancelFlight()}
            aria-label={t("cancelFlight")}
          >
            ✕
          </button>
        )}
      </div>

      <div className="panel coords-bar" aria-live="polite" data-testid="coords-bar">
        {cameraPosition ? (
          <>
            {t("lat")}: {cameraPosition.latitude.toFixed(4)}° · {t("lon")}:{" "}
            {cameraPosition.longitude.toFixed(4)}° ·{" "}
            {cameraPosition.height > 1000
              ? `${(cameraPosition.height / 1000).toFixed(1)} km`
              : `${Math.round(cameraPosition.height)} m`}
          </>
        ) : (
          "—"
        )}
      </div>

      <div className="attribution">{t("attribution")}</div>
    </>
  );
}
