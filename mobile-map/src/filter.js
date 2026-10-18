import { KATEGORI_RENK_A11Y } from "./popup.js";

const KATEGORILER = Object.keys(KATEGORI_RENK_A11Y);
const GUVEN = ["A", "B", "C", "D", "E"];
const GUNCEL = ["Güncel", "Yakın dönem"];
const KONUM_TUR = [
  "uretim_tesisi",
  "genel_merkez",
  "tersane",
  "konuslanma",
  "varsayilan",
  "test_sahasi",
];

/**
 * @typedef {object} FilterState
 * @property {string[]} kategori
 * @property {string[]} guven
 * @property {string[]} guncellik
 * @property {string[]} konum_turu
 * @property {boolean} hasNotes
 */

export function emptyFilters() {
  return {
    kategori: [],
    guven: [],
    guncellik: [],
    konum_turu: [],
    hasNotes: false,
  };
}

export function parseFiltersFromURL(search = window.location.search) {
  const u = new URLSearchParams(search);
  const f = emptyFilters();
  if (u.get("kategori")) f.kategori = u.get("kategori").split(",").filter(Boolean);
  if (u.get("guven")) f.guven = u.get("guven").split(",").filter(Boolean);
  if (u.get("guncellik")) f.guncellik = u.get("guncellik").split(",").filter(Boolean);
  if (u.get("konum_turu")) f.konum_turu = u.get("konum_turu").split(",").filter(Boolean);
  if (u.get("notlar") === "1") f.hasNotes = true;
  return f;
}

export function writeFiltersToURL(filters) {
  const u = new URLSearchParams();
  if (filters.kategori.length) u.set("kategori", filters.kategori.join(","));
  if (filters.guven.length) u.set("guven", filters.guven.join(","));
  if (filters.guncellik.length) u.set("guncellik", filters.guncellik.join(","));
  if (filters.konum_turu.length) u.set("konum_turu", filters.konum_turu.join(","));
  if (filters.hasNotes) u.set("notlar", "1");
  const qs = u.toString();
  const next = qs ? `?${qs}` : window.location.pathname;
  history.replaceState(null, "", next);
}

export function countActive(filters) {
  let n = 0;
  if (filters.kategori.length) n++;
  if (filters.guven.length) n++;
  if (filters.guncellik.length) n++;
  if (filters.konum_turu.length) n++;
  if (filters.hasNotes) n++;
  return n;
}

export function matchFeature(props, filters) {
  if (filters.kategori.length && !filters.kategori.includes(props.kategori)) {
    return false;
  }
  if (filters.guven.length && !filters.guven.includes(props.guven_duzeyi)) {
    return false;
  }
  if (filters.guncellik.length && !filters.guncellik.includes(props.guncellik)) {
    return false;
  }
  if (filters.konum_turu.length && !filters.konum_turu.includes(props.konum_turu)) {
    return false;
  }
  if (filters.hasNotes && !props.notlar) return false;
  return true;
}

/**
 * Render filter UI into container
 */
export function renderFilterUI(container, filters, onChange) {
  container.replaceChildren();

  section(container, "Kategori", () => {
    const wrap = document.createElement("div");
    wrap.className = "chips";
    for (const k of KATEGORILER) {
      const btn = chip(k, filters.kategori.includes(k), () => {
        toggle(filters.kategori, k);
        onChange();
      });
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = KATEGORI_RENK_A11Y[k] || "#888";
      btn.prepend(dot);
      wrap.appendChild(btn);
    }
    return wrap;
  });

  section(container, "Güven düzeyi", () => {
    const wrap = document.createElement("div");
    wrap.className = "chips";
    for (const g of GUVEN) {
      wrap.appendChild(
        chip(g, filters.guven.includes(g), () => {
          toggle(filters.guven, g);
          onChange();
        })
      );
    }
    return wrap;
  });

  section(container, "Güncellik", () => {
    const wrap = document.createElement("div");
    wrap.className = "chips";
    for (const g of GUNCEL) {
      wrap.appendChild(
        chip(g, filters.guncellik.includes(g), () => {
          toggle(filters.guncellik, g);
          onChange();
        })
      );
    }
    return wrap;
  });

  section(container, "Konum türü", () => {
    const wrap = document.createElement("div");
    wrap.className = "chips";
    for (const k of KONUM_TUR) {
      wrap.appendChild(
        chip(k, filters.konum_turu.includes(k), () => {
          toggle(filters.konum_turu, k);
          onChange();
        })
      );
    }
    return wrap;
  });

  section(container, "Diğer", () => {
    const wrap = document.createElement("div");
    wrap.className = "chips";
    wrap.appendChild(
      chip("Notu olanlar", filters.hasNotes, () => {
        filters.hasNotes = !filters.hasNotes;
        onChange();
      })
    );
    return wrap;
  });
}

function section(parent, title, bodyFn) {
  const sec = document.createElement("div");
  sec.className = "filter-section";
  const h = document.createElement("h3");
  h.textContent = title;
  sec.appendChild(h);
  sec.appendChild(bodyFn());
  parent.appendChild(sec);
}

function chip(label, active, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip" + (active ? " active" : "");
  b.textContent = label;
  b.setAttribute("aria-pressed", active ? "true" : "false");
  b.addEventListener("click", onClick);
  return b;
}

function toggle(arr, value) {
  const i = arr.indexOf(value);
  if (i >= 0) arr.splice(i, 1);
  else arr.push(value);
}
