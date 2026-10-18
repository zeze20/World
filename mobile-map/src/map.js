import {
  buildSystemDetail,
  buildClusterList,
  renkFor,
} from "./popup.js";
import {
  emptyFilters,
  parseFiltersFromURL,
  writeFiltersToURL,
  countActive,
  matchFeature,
  renderFilterUI,
} from "./filter.js";

const GEOJSON_URL = "./public/data/turkiye_savunma_sistemleri.geojson";
const TR_BOUNDS = [
  [35.8, 25.5],
  [42.3, 45.0],
];

const KUME_LABEL = {
  "tusas-kahramankazan": "TUSAŞ Kahramankazan",
  "aselsan-ankara": "ASELSAN Ankara",
  "baykar-arnavutkoy": "Baykar (İstanbul)",
  "roketsan-elmadag": "Roketsan Elmadağ",
  "bmc-gebze": "BMC Gebze",
  "tei-eskisehir": "TEI Eskişehir",
  "havelsan-ankara": "HAVELSAN Ankara",
  "sedef-tuzla": "Sedef Tuzla",
  "anadolu-tersane": "Anadolu Tersanesi",
  "sefine-yalova": "Sefine Yalova",
  "otokar-sakarya": "Otokar Sakarya",
  "stm-ankara": "STM Ankara",
  "asfat-ankara": "ASFAT Ankara",
  "sage-ankara": "TÜBİTAK SAGE",
};

let map;
let clusterGroup;
let allFeatures = [];
let filters = parseFiltersFromURL();
let sheetOpen = false;

const $ = (id) => document.getElementById(id);

init();

async function init() {
  setupMap();
  setupUI();
  setupOffline();
  registerSW();

  try {
    const res = await fetch(GEOJSON_URL, { cache: "default" });
    const geo = await res.json();
    allFeatures = geo.features || [];
    rebuildLayer();
    $("loading").hidden = true;
  } catch (e) {
    $("loading").textContent = "Veri yüklenemedi";
    console.error(e);
  }

  renderFilterUI($("filter-root"), filters, onFiltersChanged);
  updateBadge();
}

function setupMap() {
  map = L.map("map", {
    zoomControl: false,
    attributionControl: true,
    tap: true,
    maxBounds: TR_BOUNDS,
    maxBoundsViscosity: 0.6,
  }).setView([39.0, 35.2], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: 16,
    iconCreateFunction(cluster) {
      const count = cluster.getChildCount();
      const size = count < 5 ? "small" : count < 12 ? "medium" : "large";
      return L.divIcon({
        html: `<div><span>${count}</span></div>`,
        className: `marker-cluster marker-cluster-${size}`,
        iconSize: L.point(44, 44),
      });
    },
  });

  map.addLayer(clusterGroup);

  map.on("click", () => {
    if (window.matchMedia("(min-width: 900px)").matches) closeSheet();
  });
}

function rebuildLayer() {
  clusterGroup.clearLayers();

  // Group by kume_id for facility markers when multiple systems share site
  const byKume = new Map();
  const singles = [];

  for (const f of allFeatures) {
    const p = f.properties;
    if (!matchFeature(p, filters)) continue;
    const kid = p.kume_id;
    if (kid) {
      if (!byKume.has(kid)) byKume.set(kid, []);
      byKume.get(kid).push(f);
    } else {
      singles.push(f);
    }
  }

  for (const [kid, feats] of byKume) {
    if (feats.length === 1) {
      addPointMarker(feats[0]);
    } else {
      addFacilityMarker(kid, feats);
    }
  }
  for (const f of singles) addPointMarker(f);

  if (clusterGroup.getLayers().length) {
    try {
      map.fitBounds(clusterGroup.getBounds(), { padding: [40, 40], maxZoom: 8 });
    } catch {
      /* empty */
    }
  }
}

function addPointMarker(feature) {
  const [lon, lat] = feature.geometry.coordinates;
  const p = feature.properties;
  const color = renkFor(p.kategori);
  const marker = L.circleMarker([lat, lon], {
    radius: 10,
    color: "#fff",
    weight: 1.5,
    fillColor: color,
    fillOpacity: 0.95,
  });
  marker.on("click", (e) => {
    L.DomEvent.stopPropagation(e);
    openSystem(p);
  });
  marker.bindTooltip(p.isim, { direction: "top", opacity: 0.9 });
  // a11y
  marker.on("add", () => {
    const el = marker._path || marker.getElement?.();
    if (el) {
      el.setAttribute(
        "aria-label",
        `${p.isim} — ${p.kategori} — ${p.durum_etiketi || ""}`
      );
      el.setAttribute("tabindex", "0");
    }
  });
  clusterGroup.addLayer(marker);
}

function facilityCentroid(feats) {
  let sx = 0, sy = 0, n = feats.length;
  for (const f of feats) {
    sx += f.geometry.coordinates[0];
    sy += f.geometry.coordinates[1];
  }
  return [sx / n, sy / n];
}

function addFacilityMarker(kid, feats) {
  const [lon, lat] = facilityCentroid(feats);
  const systems = feats
    .map((f) => f.properties)
    .sort((a, b) => {
      const o = { yuksek: 0, orta: 1, dusuk: 2 };
      return (o[a.oncelik_mobil] ?? 3) - (o[b.oncelik_mobil] ?? 3);
    });
  const label = KUME_LABEL[kid] || kid;
  const color = renkFor(systems[0].kategori);

  const marker = L.marker([lat, lon], {
    icon: L.divIcon({
      className: "facility-marker",
      html: `<div style="
        min-width:48px;min-height:48px;border-radius:24px;
        background:${color};border:2px solid #fff;
        display:flex;align-items:center;justify-content:center;
        font-weight:700;font-size:13px;color:#fff;
        box-shadow:0 2px 8px rgba(0,0,0,.4);">${systems.length}</div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    }),
  });
  marker.on("click", (e) => {
    L.DomEvent.stopPropagation(e);
    openCluster(label, systems);
  });
  marker.bindTooltip(`${label} (${systems.length})`, { direction: "top" });
  clusterGroup.addLayer(marker);
}

function openSystem(p) {
  const content = $("sheet-content");
  content.replaceChildren(buildSystemDetail(p));
  openSheet();
}

function openCluster(title, systems) {
  const content = $("sheet-content");
  content.replaceChildren(
    buildClusterList(title, systems, (p) => {
      content.replaceChildren(buildSystemDetail(p));
    })
  );
  openSheet();
}

function openSheet() {
  const sheet = $("sheet");
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
  sheetOpen = true;
}

function closeSheet() {
  const sheet = $("sheet");
  sheet.classList.remove("open");
  sheet.setAttribute("aria-hidden", "true");
  sheetOpen = false;
}

function setupUI() {
  $("btn-filter").addEventListener("click", openDrawer);
  $("btn-drawer-close").addEventListener("click", closeDrawer);
  $("drawer-backdrop").addEventListener("click", closeDrawer);
  $("btn-clear-filters").addEventListener("click", () => {
    filters = emptyFilters();
    onFiltersChanged();
    renderFilterUI($("filter-root"), filters, onFiltersChanged);
  });

  $("btn-zoom-in").addEventListener("click", () => map.zoomIn());
  $("btn-zoom-out").addEventListener("click", () => map.zoomOut());
  $("btn-home").addEventListener("click", () => map.fitBounds(TR_BOUNDS, { padding: [20, 20] }));
  $("btn-locate").addEventListener("click", () => {
    map.locate({ setView: true, maxZoom: 12 });
  });

  // Sheet swipe-down to dismiss (simple touch)
  const sheet = $("sheet");
  let startY = 0;
  sheet.addEventListener(
    "touchstart",
    (e) => {
      startY = e.touches[0].clientY;
    },
    { passive: true }
  );
  sheet.addEventListener(
    "touchend",
    (e) => {
      const dy = e.changedTouches[0].clientY - startY;
      if (dy > 80) closeSheet();
    },
    { passive: true }
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSheet();
      closeDrawer();
    }
  });
}

function openDrawer() {
  $("drawer").classList.add("open");
  $("drawer").setAttribute("aria-hidden", "false");
  $("drawer-backdrop").hidden = false;
  $("btn-filter").setAttribute("aria-expanded", "true");
}

function closeDrawer() {
  $("drawer").classList.remove("open");
  $("drawer").setAttribute("aria-hidden", "true");
  $("drawer-backdrop").hidden = true;
  $("btn-filter").setAttribute("aria-expanded", "false");
}

function onFiltersChanged() {
  writeFiltersToURL(filters);
  updateBadge();
  rebuildLayer();
}

function updateBadge() {
  const n = countActive(filters);
  const badge = $("filter-badge");
  if (n > 0) {
    badge.hidden = false;
    badge.textContent = String(n);
  } else {
    badge.hidden = true;
  }
}

function setupOffline() {
  const banner = $("offline-banner");
  const sync = () => {
    banner.hidden = navigator.onLine;
  };
  window.addEventListener("online", sync);
  window.addEventListener("offline", sync);
  sync();
}

function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./src/sw.js").catch(() => {});
  }
}
