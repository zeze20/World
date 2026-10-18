import { useTranslation } from "react-i18next";
import { useAppStore } from "../store";

export function ErrorBanner() {
  const { t } = useTranslation();
  const errorMessage = useAppStore((s) => s.errorMessage);
  const setErrorMessage = useAppStore((s) => s.setErrorMessage);
  if (!errorMessage) return null;
  return (
    <div
      role="alert"
      className="panel"
      style={{
        position: "absolute",
        top: 56,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        padding: "10px 14px",
        borderColor: "var(--danger)",
        maxWidth: 360,
      }}
    >
      <strong>{t("errorTitle")}</strong>
      <p style={{ margin: "6px 0", fontSize: 13 }}>{errorMessage}</p>
      <button type="button" className="btn" onClick={() => setErrorMessage(null)}>
        {t("dismiss")}
      </button>
    </div>
  );
}
