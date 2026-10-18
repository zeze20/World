# Türkiye Savunma Haritası (Mobil)

Leaflet + markercluster, bottom sheet, filtre drawer, PWA.

## Hızlı başlat (bilgisayar)

```bash
cd mobile-map
npx --yes serve -p 5174 .
# http://127.0.0.1:5174
```

## Telefon (aynı Wi‑Fi)

1. Bilgisayarda `npx serve -p 5174 .` çalıştırın.
2. Bilgisayar IP: `ip a` / `ipconfig` (ör. 192.168.1.20)
3. Telefonda tarayıcı: `http://192.168.1.20:5174`

## Termux (Android)

```bash
pkg update && pkg install nodejs-lts git
git clone https://github.com/zeze20/World.git
cd World/mobile-map
npx --yes serve -p 8080 .
# Telefonda: http://127.0.0.1:8080
```

## GitHub Pages (isteğe bağlı)

`mobile-map` klasörünü Pages root yapın veya `docs/` altına kopyalayın.
