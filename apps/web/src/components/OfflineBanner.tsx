import { useTranslation } from "react-i18next";
import { useAppStore } from "../store";

export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useAppStore((s) => s.online);
  if (online) return null;
  return (
    <div
      role="status"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background: "rgba(180, 83, 9, 0.92)",
        color: "#fff",
        textAlign: "center",
        padding: "8px 12px",
        paddingTop: "calc(8px + env(safe-area-inset-top, 0px))",
        fontSize: 13,
      }}
    >
      {t("offline")}
    </div>
  );
}
