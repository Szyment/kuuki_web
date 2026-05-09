window.KUUKI_CONFIG = {
  siteName: "Kuuki",
  dashboardUrl: "https://github.com/Szyment/kuuki",
  apiBaseUrl: "https://api.thingspeak.com",
  apiPath: "/channels/3175869/feeds/last.json",
  apiKey: "WSAWQYVYKHSSMRKI",
  apiKeyHeader: "",
  authScheme: "",
  apiQueryKey: "api_key",
  channelId: "3175869",
  fieldLabels: {
    field1: "PM 1.0",
    field2: "PM 2.5",
    field3: "PM 10"
  },
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
