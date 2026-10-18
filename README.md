# AetherGlobe

**Bağımsız 3B küresel keşif platformu** — Google Earth benzeri deneyim, özgün mimari ve hukuka uygun veri kaynakları.

> Bu proje Google Earth veya Google Maps’in kopyası değildir. Google verisi, markası veya arayüz kimliği kullanılmaz.

## Özellikler (MVP 0.1)

- Etkileşimli 3B dünya küresi (CesiumJS + WGS84)
- Fare, klavye ve dokunmatik navigasyon
- Koordinat gösterimi
- Yer / koordinat araması (OpenStreetMap Nominatim) + kamera uçuşu
- Yer işaretleri (yerel depolama)
- Geodezik mesafe ölçümü
- Türkçe / İngilizce arayüz
- Temel erişilebilirlik (klavye odağı, ARIA)
- `@aetherglobe/geo-core` — test edilmiş koordinat dönüşümleri

## Gereksinimler

- Node.js ≥ 20
- pnpm ≥ 9

## Kurulum

```bash
git clone https://github.com/YOUR_USERNAME/aetherglobe.git
cd aetherglobe
pnpm install
pnpm --filter @aetherglobe/geo-core build
pnpm dev
```

Tarayıcıda: http://localhost:5173

## Testler

```bash
pnpm --filter @aetherglobe/geo-core test
```

## Lisans ve veri

- Kod: Apache-2.0
- Harita döşemeleri: OpenStreetMap — [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) ve atıf zorunludur
- Geocoding: Nominatim — kullanım politikasına uyun; üretimde kendi instance veya ticari sağlayıcı önerilir
- Ayrıntılar: `docs/data-licenses.md`

## Mimari

Bkz. `docs/architecture.md` ve `docs/adr/`.

## Yol haritası

1. ~~Repo iskeleti + geo-core + temel küre~~ (bu sürüm)
2. Daha iyi imagery / terrain sağlayıcıları (lisans doğrulamalı)
3. Vektör katmanlar ve etiketler
4. Gelişmiş ölçüm ve kullanıcı verisi senkronizasyonu
5. Performans bütçeleri ve erişilebilirlik denetimi

## Katkı

Issue ve PR’lar memnuniyetle karşılanır. Büyük değişikliklerden önce lütfen bir ADR açın.

## Uyarı

Üretim kullanımından önce:
- Tüm veri lisanslarını hukuk uzmanıyla doğrulayın
- Nominatim / OSM tile politikalarına uyun veya alternatif sağlayıcı kullanın
- API anahtarlarını istemciye gömmeyin
