# AetherGlobe

**Bağımsız 3B küresel keşif platformu** — Google Earth benzeri deneyim, özgün mimari ve hukuka uygun veri kaynakları.

> Bu proje Google Earth veya Google Maps’in kopyası değildir. Google verisi, markası veya arayüz kimliği kullanılmaz.

## MVP 0.1 özellikleri

- Etkileşimli 3B dünya küresi (CesiumJS + WGS84)
- Fare, klavye (ok / +/- / R) ve dokunmatik navigasyon
- Koordinat gösterimi
- Yer / koordinat araması (Nominatim) + kamera uçuşu (hareket azaltma desteği)
- Yer işaretleri (localStorage)
- Geodezik mesafe ölçümü
- **Katman yönetimi**: OSM imagery, elipsoid / opsiyonel world terrain, ülke sınırları (vektör)
- **IndexedDB önbellek** (arama sonuçları, LRU)
- **Performans telemetrisi** (FPS, long tasks)
- Offline / hata banner’ları
- Türkçe / İngilizce arayüz
- Temel erişilebilirlik (klavye, ARIA, focus)
- Playwright E2E duman testleri
- `@aetherglobe/geo-core` — test edilmiş koordinat dönüşümleri

## Gereksinimler

- Node.js ≥ 20
- npm ≥ 10

## Kurulum ve çalıştırma

```bash
git clone https://github.com/zeze20/World.git
cd World
cd apps/web
npm install
npm run dev
```

Tarayıcı: http://localhost:5173

### Opsiyonel: Cesium World Terrain

`.env` dosyasına:

```
VITE_CESIUM_ION_TOKEN=your_token_here
```

Ardından katman panelinden “Dünya arazisi (ion)” açın.

### Testler

```bash
# geo-core birim testleri
cd packages/geo-core && npm install && npm test

# E2E (Playwright)
cd apps/web
npx playwright install chromium
npm run test:e2e
```

## Lisans ve veri

- Kod: **Apache-2.0**
- Harita döşemeleri: OpenStreetMap — [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) ve atıf zorunlu
- Geocoding: Nominatim — kullanım politikasına uyun
- Ülke sınırları: geo-countries / Natural Earth (public domain tarzı)
- Ayrıntılar: `docs/data-licenses.md`

## Mimari

Bkz. `docs/architecture.md` ve `docs/adr/`.

## Yol haritası (sonraki)

- Gerçek DEM / quantized-mesh arazi (lisanslı)
- Stil tanımlı vektör döşemeler (MapLibre uyumlu)
- Daha agresif tile istek planlayıcı ve disk önbelleği
- Hesap / senkronizasyon
- Gelişmiş ölçüm (alan, profil)

## Uyarı

Üretimden önce tüm veri lisanslarını hukuk uzmanıyla doğrulayın. OSM/Nominatim kotasına uyun veya kendi sağlayıcınızı kullanın.
