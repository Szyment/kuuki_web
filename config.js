window.KUUKI_CONFIG = {
  siteName: "Kuuki",
  dashboardUrl: "",
  apiBaseUrl: "",
  apiPath: "/live",
  apiKey: "",
  apiKeyHeader: "x-api-key",
  authScheme: "",
  apiQueryKey: "",
  refreshIntervalMs: 120000,
  requestTimeoutMs: 10000,
  fallbackLocation: "Klasa 2D",
  fallbackLastUpdated: "12:42",
  fallbackLastUpdatedRelative: "2 min temu"
};

window.KUUKI_CONFIG_READY = new Promise((resolve) => {
  const isLocalPreview =
    window.location.protocol === "file:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (!isLocalPreview) {
    resolve();
    return;
  }

  const script = document.createElement("script");
  script.src = "./config.local.js";
  script.onload = () => {
    if (window.KUUKI_LOCAL_CONFIG && typeof window.KUUKI_LOCAL_CONFIG === "object") {
      Object.assign(window.KUUKI_CONFIG, window.KUUKI_LOCAL_CONFIG);
    }
    resolve();
  };
  script.onerror = () => resolve();
  document.head.appendChild(script);
});
