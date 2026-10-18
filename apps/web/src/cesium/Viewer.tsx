import { useEffect, useRef } from "react";
import {
  Viewer as CesiumViewer,
  Cartesian3,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartographic,
  Color,
  HeightReference,
  Entity,
  UrlTemplateImageryProvider,
  EllipsoidTerrainProvider,
  GeoJsonDataSource,
  defined,
  RequestScheduler,
} from "cesium";
import { haversineDistance, formatDistance } from "../geo/index.js";
import type { Geodetic } from "../geo/index.js";
import { useAppStore } from "../store";

export interface ViewerHandle {
  flyTo: (geo: Geodetic, duration?: number) => void;
  cancelFlight: () => void;
  getCameraGeodetic: () => Geodetic | null;
  setTerrainEnabled: (enabled: boolean, useWorldTerrain?: boolean) => void;
  setCountriesVisible: (visible: boolean) => void;
}

interface Props {
  onReady?: (handle: ViewerHandle) => void;
}

/** Simplified world countries GeoJSON (Natural Earth derived, public domain) – small sample for MVP */
const COUNTRIES_GEOJSON_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

export function GlobeViewer({ onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const measureEntities = useRef<Entity[]>([]);
  const countriesDs = useRef<GeoJsonDataSource | null>(null);

  const setCameraPosition = useAppStore((s) => s.setCameraPosition);
  const measureActive = useAppStore((s) => s.measureActive);
  const addMeasurePoint = useAppStore((s) => s.addMeasurePoint);
  const measurePoints = useAppStore((s) => s.measurePoints);
  const setMeasureDistance = useAppStore((s) => s.setMeasureDistance);
  const setIsFlying = useAppStore((s) => s.setIsFlying);
  const setErrorMessage = useAppStore((s) => s.setErrorMessage);
  const layersEnabled = useAppStore((s) => s.layersEnabled);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    // Limit concurrent requests for controlled networking
    RequestScheduler.maximumRequestsPerServer = 6;

    const viewer = new CesiumViewer(containerRef.current, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      terrainProvider: new EllipsoidTerrainProvider(),
      baseLayer: false,
    });

    // Avoid hard crash on bad tiles (common on mobile)
    viewer.scene.rethrowRenderErrors = false;
    viewer.scene.globe.baseColor = Color.fromCssColorString("#1a4a6e");
    viewer.scene.globe.enableLighting = false;
    viewer.scene.fog.enabled = true;
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.requestRenderMode = false;

    // Touch-friendly camera inertia
    {
      const c = viewer.scene.screenSpaceCameraController;
      c.inertiaSpin = 0.85;
      c.inertiaTranslate = 0.85;
      c.inertiaZoom = 0.75;
      c.minimumZoomDistance = 80;
      c.maximumZoomDistance = 45_000_000;
    }

    // Mobile-safe tiles (CARTO; OSM data — attribution in UI)
    try {
      viewer.imageryLayers.removeAll();
      const tiles = new UrlTemplateImageryProvider({
        url: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        credit: "© OpenStreetMap © CARTO",
        maximumLevel: 18,
      });
      viewer.imageryLayers.addImageryProvider(tiles);
    } catch (e) {
      console.warn("Imagery failed", e);
      setErrorMessage("Harita görüntüsü yüklenemedi; küre kullanılabilir");
    }

    viewer.scene.renderError.addEventListener(() => {
      console.warn("Cesium render error ignored");
    });

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(28.9784, 41.0082, 12_000_000),
    });

    const updateCameraPos = () => {
      const carto = viewer.camera.positionCartographic;
      if (!carto) return;
      setCameraPosition({
        latitude: CesiumMath.toDegrees(carto.latitude),
        longitude: CesiumMath.toDegrees(carto.longitude),
        height: carto.height,
      });
    };
    viewer.camera.moveEnd.addEventListener(updateCameraPos);
    updateCameraPos();

    // Keyboard navigation
    const canvas = viewer.scene.canvas;
    canvas.setAttribute("tabindex", "0");
    canvas.setAttribute("aria-label", "AetherGlobe 3D globe – use arrow keys to pan, +/- to zoom");

    const onKeyDown = (e: KeyboardEvent) => {
      const cam = viewer.camera;
      const amount = e.shiftKey ? 0.5 : 0.15;
      switch (e.key) {
        case "ArrowLeft":
          cam.rotateLeft(amount * 0.5);
          e.preventDefault();
          break;
        case "ArrowRight":
          cam.rotateRight(amount * 0.5);
          e.preventDefault();
          break;
        case "ArrowUp":
          cam.rotateUp(amount * 0.3);
          e.preventDefault();
          break;
        case "ArrowDown":
          cam.rotateDown(amount * 0.3);
          e.preventDefault();
          break;
        case "+":
        case "=":
          cam.zoomIn(cam.positionCartographic.height * 0.15);
          e.preventDefault();
          break;
        case "-":
        case "_":
          cam.zoomOut(cam.positionCartographic.height * 0.15);
          e.preventDefault();
          break;
        case "r":
        case "R":
          cam.flyTo({
            destination: Cartesian3.fromDegrees(28.9784, 41.0082, 12_000_000),
            duration: 1.5,
          });
          e.preventDefault();
          break;
        default:
          break;
      }
    };
    canvas.addEventListener("keydown", onKeyDown);

    // Measure click
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: { position: { x: number; y: number } }) => {
      if (!useAppStore.getState().measureActive) return;
      const ray = viewer.camera.getPickRay(movement.position);
      if (!ray) return;
      const hit = viewer.scene.globe.pick(ray, viewer.scene);
      if (!defined(hit) || !hit) return;
      const carto = Cartographic.fromCartesian(hit);
      const geo: Geodetic = {
        latitude: CesiumMath.toDegrees(carto.latitude),
        longitude: CesiumMath.toDegrees(carto.longitude),
        height: carto.height,
      };
      addMeasurePoint({ position: geo, cartesian: hit });
    }, ScreenSpaceEventType.LEFT_CLICK);

    // Load countries vector (Natural Earth via geo-countries – public domain style data)
    GeoJsonDataSource.load(COUNTRIES_GEOJSON_URL, {
      stroke: Color.fromCssColorString("#38bdf8").withAlpha(0.7),
      fill: Color.fromCssColorString("#38bdf8").withAlpha(0.08),
      strokeWidth: 1.5,
      clampToGround: true,
    })
      .then((ds) => {
        countriesDs.current = ds;
        viewer.dataSources.add(ds);
        ds.show = useAppStore.getState().layersEnabled["countries"] !== false;
      })
      .catch(() => {
        console.warn("Countries GeoJSON could not be loaded (offline or CORS)");
      });

    const handle: ViewerHandle = {
      flyTo(geo, duration = 2.5) {
        setIsFlying(true);
        const prefersReduced =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(
            geo.longitude,
            geo.latitude,
            Math.max(geo.height || 2500, 800)
          ),
          duration: prefersReduced ? 0 : duration,
          complete: () => setIsFlying(false),
          cancel: () => setIsFlying(false),
        });
      },
      cancelFlight() {
        viewer.camera.cancelFlight();
        setIsFlying(false);
      },
      getCameraGeodetic() {
        const c = viewer.camera.positionCartographic;
        if (!c) return null;
        return {
          latitude: CesiumMath.toDegrees(c.latitude),
          longitude: CesiumMath.toDegrees(c.longitude),
          height: c.height,
        };
      },
      setTerrainEnabled(enabled, useWorldTerrain = false) {
        if (!enabled) {
          viewer.terrainProvider = new EllipsoidTerrainProvider();
          return;
        }
        if (useWorldTerrain) {
          // Requires Cesium ion token in VITE_CESIUM_ION_TOKEN – optional
          const token = (import.meta as any).env?.VITE_CESIUM_ION_TOKEN;
          if (token) {
            (window as any).Cesium.Ion.defaultAccessToken = token;
            // Dynamic import pattern avoided; user enables via env
            import("cesium").then((C) => {
              if (C.createWorldTerrainAsync) {
                C.createWorldTerrainAsync().then((tp) => {
                  viewer.terrainProvider = tp;
                });
              }
            });
          } else {
            console.info("World terrain needs VITE_CESIUM_ION_TOKEN – using ellipsoid");
            viewer.terrainProvider = new EllipsoidTerrainProvider();
          }
        } else {
          viewer.terrainProvider = new EllipsoidTerrainProvider();
        }
      },
      setCountriesVisible(visible) {
        if (countriesDs.current) countriesDs.current.show = visible;
      },
    };

    viewerRef.current = viewer;
    onReady?.(handle);

    return () => {
      canvas.removeEventListener("keydown", onKeyDown);
      handler.destroy();
      viewer.camera.moveEnd.removeEventListener(updateCameraPos);
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [onReady, setCameraPosition, addMeasurePoint, setIsFlying, setErrorMessage]);

  // React to layer toggles
  useEffect(() => {
    const handle = viewerRef.current;
    if (!handle) return;
    // countries
    if (countriesDs.current) {
      countriesDs.current.show = !!layersEnabled["countries"];
    }
  }, [layersEnabled]);

  // Measure drawing
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    for (const e of measureEntities.current) {
      viewer.entities.remove(e);
    }
    measureEntities.current = [];

    const pts = measurePoints;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const e = viewer.entities.add({
        position: Cartesian3.fromDegrees(
          p.position.longitude,
          p.position.latitude,
          p.position.height
        ),
        point: {
          pixelSize: 12,
          color: Color.CYAN,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: `${i + 1}`,
          font: "14px sans-serif",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 3,
          style: 2,
          verticalOrigin: 1, // TOP
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });
      measureEntities.current.push(e);
    }

    if (pts.length === 2) {
      const dist = haversineDistance(pts[0].position, pts[1].position);
      setMeasureDistance(dist);
      const mid = Cartesian3.midpoint(
        Cartesian3.fromDegrees(pts[0].position.longitude, pts[0].position.latitude, 0),
        Cartesian3.fromDegrees(pts[1].position.longitude, pts[1].position.latitude, 0),
        new Cartesian3()
      );
      const line = viewer.entities.add({
        polyline: {
          positions: [
            Cartesian3.fromDegrees(
              pts[0].position.longitude,
              pts[0].position.latitude,
              pts[0].position.height
            ),
            Cartesian3.fromDegrees(
              pts[1].position.longitude,
              pts[1].position.latitude,
              pts[1].position.height
            ),
          ],
          width: 3,
          material: Color.CYAN.withAlpha(0.85),
          clampToGround: true,
        },
        position: mid,
        label: {
          text: formatDistance(dist),
          font: "16px sans-serif",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 3,
          style: 2,
        },
      });
      measureEntities.current.push(line);
    } else {
      setMeasureDistance(null);
    }
  }, [measurePoints, setMeasureDistance]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
      role="application"
      aria-label="AetherGlobe 3D dünya görünümü"
    />
  );
}
