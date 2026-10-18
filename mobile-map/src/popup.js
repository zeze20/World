/** Shared popup / sheet content builders — XSS-safe (no innerHTML with raw data) */

export const KATEGORI_RENK = {
  "Hava Platformları": "#1f4e79",
  "İnsansız Hava Sistemleri": "#e67e22",
  "Kara Sistemleri": "#556b2f",
  "Deniz Sistemleri": "#1a5276",
  "Hava ve Füze Savunma": "#c0392b",
  "Füze ve Mühimmat": "#7b241c",
  "Radar/Sensör/EH": "#6c3483",
  K2HM: "#5d6d7e",
  "Uzay ve Uydu": "#2c3e50",
  "Tahrik ve Motor": "#7f8c8d",
};

/** ColorBrewer-inspired, better separation when zoomed out */
export const KATEGORI_RENK_A11Y = {
  "Hava Platformları": "#377eb8",
  "İnsansız Hava Sistemleri": "#ff7f00",
  "Kara Sistemleri": "#4daf4a",
  "Deniz Sistemleri": "#984ea3",
  "Hava ve Füze Savunma": "#e41a1c",
  "Füze ve Mühimmat": "#a65628",
  "Radar/Sensör/EH": "#f781bf",
  K2HM: "#999999",
  "Uzay ve Uydu": "#66c2a5",
  "Tahrik ve Motor": "#fc8d62",
};

export const DURUM_ROZET = {
  Envanterde: "🟢",
  "Envanterde ve Test": "🟢",
  "Envanterde ve Seri Üretim": "🟢",
  "Envanterde ve Geliştirme": "🟢",
  "Seri Üretimde": "🟢⚙",
  "Seri Üretim ve Teslimat": "🟢⚙",
  "Seri Üretim ve Test": "🟢⚙",
  "Teslimat Sürecinde": "🟢⚙",
  "Envantere Giriş": "🟢⚙",
  "Entegrasyon ve Teslimat": "🟢⚙",
  "Test/Kalifikasyon": "🟡",
  "Tanıtım/Test": "🟡",
  "Sözleşme ve Test": "🟠",
  "Sözleşme ve Tedarik": "🟠",
  Geliştirme: "🔵",
  "Test ve Geliştirme": "🔵",
  "Ertelenmiş/Öncelik Değişmiş": "⚪",
};

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

function rozet(p) {
  return DURUM_ROZET[p.durum_etiketi] || "⚪";
}

/**
 * XSS-safe DOM for a single system detail
 * @param {object} p feature.properties
 * @returns {HTMLElement}
 */
export function buildSystemDetail(p) {
  const root = el("div", "sg-popup");

  const title = el("div", "sg-title", p.isim || "");
  if (p.varyant) {
    const v = el("span", "sg-var", " " + p.varyant);
    title.appendChild(v);
  }
  root.appendChild(title);

  const meta = [p.kategori, p.alt_kategori].filter(Boolean).join(" · ");
  root.appendChild(el("div", "sg-meta", meta));

  root.appendChild(row("Üretici", p.uretici));

  const badges = el("div", "sg-row");
  const b1 = el("span", "sg-badge", `${rozet(p)} ${p.durum_etiketi || ""}`);
  const b2 = el("span", "sg-badge sg-guven", `Güven ${p.guven_duzeyi || "?"}`);
  badges.appendChild(b1);
  badges.appendChild(b2);
  root.appendChild(badges);

  root.appendChild(row("Görev", p.gorev));
  root.appendChild(row("Son gelişme", p.son_gelisme));

  const gunc = [p.guncelleme_tarihi, p.guncellik].filter(Boolean).join(" · ");
  root.appendChild(rowMuted("Güncelleme", gunc));

  const konumParts = [
    p.konum_turu ? `Tür: ${p.konum_turu}` : null,
    p.konum_hassasiyeti ? `Hassasiyet: ${p.konum_hassasiyeti}` : null,
  ].filter(Boolean);
  if (konumParts.length) {
    root.appendChild(rowMuted("Konum meta", konumParts.join(" · ")));
  }
  if (p.konum_aciklama) {
    root.appendChild(rowMuted("Konum", p.konum_aciklama));
  }

  if (p.yerlilik_notu) root.appendChild(row("Yerlilik", p.yerlilik_notu));
  if (p.ihracat_notu) root.appendChild(row("İhracat", p.ihracat_notu));

  const kaynaklar =
    Array.isArray(p.kaynaklar) && p.kaynaklar.length
      ? p.kaynaklar.join(" ")
      : "—";
  root.appendChild(rowMuted("Kaynaklar", kaynaklar));

  if (p.notlar) {
    const notes = el("div", "sg-notes");
    const strong = el("strong", null, "Not: ");
    notes.appendChild(strong);
    notes.appendChild(document.createTextNode(p.notlar));
    root.appendChild(notes);
  }

  return root;
}

/**
 * Cluster / facility list sheet content
 * @param {string} title
 * @param {object[]} systems properties list sorted by oncelik
 * @param {(p: object) => void} onSelect
 */
export function buildClusterList(title, systems, onSelect) {
  const root = el("div", "sg-popup");
  root.appendChild(el("div", "sg-title", title));
  root.appendChild(
    el("div", "sg-meta", `${systems.length} sistem · küme listesi`)
  );

  const ul = el("ul", "sg-list");
  for (const p of systems) {
    const li = el("li");
    li.tabIndex = 0;
    li.setAttribute(
      "aria-label",
      `${p.isim} — ${p.kategori} — ${p.durum_etiketi || ""}`
    );
    const line1 = el("div", "sg-title", p.isim || "");
    if (p.varyant) line1.appendChild(el("span", "sg-var", " " + p.varyant));
    li.appendChild(line1);
    li.appendChild(
      el(
        "div",
        "sg-muted",
        `${rozet(p)} ${p.durum_etiketi || ""} · Güven ${p.guven_duzeyi || "?"} · ${p.kategori || ""}`
      )
    );
    li.addEventListener("click", () => onSelect(p));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(p);
      }
    });
    ul.appendChild(li);
  }
  root.appendChild(ul);
  return root;
}

function row(label, value) {
  const d = el("div", "sg-row");
  const s = el("strong", null, label + ": ");
  d.appendChild(s);
  d.appendChild(document.createTextNode(value || "—"));
  return d;
}

function rowMuted(label, value) {
  const d = row(label, value);
  d.classList.add("sg-muted");
  return d;
}

export function renkFor(kategori) {
  return KATEGORI_RENK_A11Y[kategori] || KATEGORI_RENK[kategori] || "#555";
}
