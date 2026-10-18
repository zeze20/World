import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  tr: {
    translation: {
      appName: "AetherGlobe",
      searchPlaceholder: "Yer veya koordinat ara…",
      search: "Ara",
      flyTo: "Uç",
      coordinates: "Koordinatlar",
      lat: "Enlem",
      lon: "Boylam",
      height: "Yükseklik",
      bookmarks: "Yer işaretleri",
      addBookmark: "Yer işareti ekle",
      measure: "Ölçüm",
      measureDistance: "Mesafe ölç",
      clearMeasure: "Ölçümü temizle",
      layers: "Katmanlar",
      imagery: "Uydu / Görüntü",
      language: "Dil",
      help: "Yardım",
      helpNav:
        "Fare: sürükle = pan, sağ tık = eğ, tekerlek = zoom. Klavye: ok tuşları, +/- zoom, R sıfırla.",
      offline: "Bağlantı sorunu – önbellek kullanılıyor",
      attribution: "Veri: Natural Earth / OSM katkıları · AetherGlobe bağımsız bir projedir",
      noResults: "Sonuç bulunamadı",
      bookmarkSaved: "Yer işareti kaydedildi",
      distance: "Mesafe",
      cancelFlight: "Uçuşu iptal et",
    },
  },
  en: {
    translation: {
      appName: "AetherGlobe",
      searchPlaceholder: "Search place or coordinates…",
      search: "Search",
      flyTo: "Fly",
      coordinates: "Coordinates",
      lat: "Latitude",
      lon: "Longitude",
      height: "Height",
      bookmarks: "Bookmarks",
      addBookmark: "Add bookmark",
      measure: "Measure",
      measureDistance: "Measure distance",
      clearMeasure: "Clear measurement",
      layers: "Layers",
      imagery: "Imagery",
      language: "Language",
      help: "Help",
      helpNav:
        "Mouse: drag = pan, right-drag = tilt, wheel = zoom. Keyboard: arrows, +/- zoom, R reset.",
      offline: "Connection issue – using cache",
      attribution: "Data: Natural Earth / OSM contributors · AetherGlobe is an independent project",
      noResults: "No results found",
      bookmarkSaved: "Bookmark saved",
      distance: "Distance",
      cancelFlight: "Cancel flight",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "tr",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
