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
} from "cesium";
import { haversineDistance, formatDistance } from "../../geo/index.js";
import type { Geodetic } from "../../geo/index.js";
import { useAppStore } from "../store";

export interface ViewerHandle {
  flyTo: (geo: Geodetic, duration?: number) => void;
  cancelFlight: () => void;
  getCameraGeodetic: () => Geodetic | null;
}

interface Props {
  onReady?: (handle: ViewerHandle) => void;
}

export function GlobeViewer({ onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const measureEntities = useRef<Entity[]>([]);

  const setCameraPosition = useAppStore((s) => s.setCameraPosition);
  const measureActive = useAppStore((s) => s.measureActive);
  const addMeasurePoint = useAppStore((s) => s.addMeasurePoint);
  const measurePoints = useAppStore((s) => s.measurePoints);
  const setMeasureDistance = useAppStore((s) => s.setMeasureDistance);
  const setIsFlying = useAppStore((s) => s.setIsFlying);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

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
      // OpenStreetMap / natural Earth style default imagery (no Cesium ion required)
      // Cesium ships with a default Bing or can use OSM via UrlTemplateImageryProvider
      // We keep default for MVP and document attribution.
      terrain: undefined,
    });

    // Prefer open imagery if available; otherwise keep Cesium default with clear attribution.
    // For production replace with a verified open or licensed provider.
    try {
      // OpenStreetMap raster (fair use / tile usage policy applies – rate limit & attribution required)
      const osm = new (window as any).Cesium.OpenStreetMapImageryProvider({
        url: "https://tile.openstreetmap.org/",
      });
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(osm);
    } catch {
      // keep default
    }

    viewer.scene.globe.enableLighting = false;
    viewer.scene.fog.enabled = true;
    viewer.scene.skyAtmosphere.show = true;

    // Initial camera – looking at Earth from space
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

    // Click handler for measurement
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: { position: { x: number; y: number } }) => {
      if (!useAppStore.getState().measureActive) return;
      const cartesian = viewer.scene.pickPosition(movement.position);
      if (!cartesian) {
        // fallback ellipsoid pick
        const ray = viewer.camera.getPickRay(movement.position);
        if (!ray) return;
        const hit = viewer.scene.globe.pick(ray, viewer.scene);
        if (!hit) return;
        const carto = Cartographic.fromCartesian(hit);
        const geo: Geodetic = {
          latitude: CesiumMath.toDegrees(carto.latitude),
          longitude: CesiumMath.toDegrees(carto.longitude),
          height: carto.height,
        };
        addMeasurePoint({ position: geo, cartesian: hit });
        return;
      }
      const carto = Cartographic.fromCartesian(cartesian);
      const geo: Geodetic = {
        latitude: CesiumMath.toDegrees(carto.latitude),
        longitude: CesiumMath.toDegrees(carto.longitude),
        height: carto.height,
      };
      addMeasurePoint({ position: geo, cartesian });
    }, ScreenSpaceEventType.LEFT_CLICK);

    const handle: ViewerHandle = {
      flyTo(geo, duration = 2.5) {
        setIsFlying(true);
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(
            geo.longitude,
            geo.latitude,
            Math.max(geo.height || 2500, 800)
          ),
          duration,
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
    };

    viewerRef.current = viewer;
    onReady?.(handle);

    return () => {
      handler.destroy();
      viewer.camera.moveEnd.removeEventListener(updateCameraPos);
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [onReady, setCameraPosition, addMeasurePoint, setIsFlying]);

  // Draw measure entities when points change
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // clear previous
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
          style: 2, // FILL_AND_OUTLINE
          pixelOffset: new (window as any).Cesium.Cartesian2(0, -20),
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });
      measureEntities.current.push(e);
    }

    if (pts.length === 2) {
      const dist = haversineDistance(pts[0].position, pts[1].position);
      setMeasureDistance(dist);
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
        label: {
          text: formatDistance(dist),
          font: "16px sans-serif",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 3,
          style: 2,
          position: Cartesian3.midpoint(
            Cartesian3.fromDegrees(
              pts[0].position.longitude,
              pts[0].position.latitude,
              0
            ),
            Cartesian3.fromDegrees(
              pts[1].position.longitude,
              pts[1].position.latitude,
              0
            ),
            new Cartesian3()
          ),
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
