import { useTranslation } from "react-i18next";
import { LAYER_REGISTRY } from "../layers/registry";
import { useAppStore } from "../store";
import type { ViewerHandle } from "../cesium/Viewer";

interface Props {
  viewer: ViewerHandle | null;
}

export function LayerPanel({ viewer }: Props) {
  const { t } = useTranslation();
  const layersEnabled = useAppStore((s) => s.layersEnabled);
  const toggleLayer = useAppStore((s) => s.toggleLayer);

  const onToggle = (id: string) => {
    toggleLayer(id);
    const next = !layersEnabled[id];
    if (id === "countries") {
      viewer?.setCountriesVisible(next);
    }
    if (id === "world-terrain") {
      viewer?.setTerrainEnabled(next, true);
    }
    if (id === "ellipsoid-terrain") {
      if (next) viewer?.setTerrainEnabled(true, false);
    }
  };

  return (
    <div className="panel" style={{ padding: 10, minWidth: 220 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{t("layers")}</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {LAYER_REGISTRY.map((layer) => (
          <li key={layer.id} style={{ marginBottom: 6 }}>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={!!layersEnabled[layer.id]}
                onChange={() => onToggle(layer.id)}
                style={{ marginTop: 2 }}
              />
              <span>
                <span style={{ display: "block" }}>{t(layer.nameKey)}</span>
                {layer.descriptionKey && (
                  <span style={{ color: "var(--muted)", fontSize: 11 }}>
                    {t(layer.descriptionKey)}
                  </span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
