const DEFAULT_LIVE_DATA = {
  status: "DOBRY",
  statusColor: "green",
  description:
    "Powietrze jest w dobrym zakresie. Możecie normalnie prowadzić zajęcia.",
  location: "Klasa 2D",
  lastUpdated: "12:42",
  lastUpdatedRelative: "2 min temu",
  measurements: [
    { label: "PM 1.0", value: 8, unit: "µg/m³", status: "Dobry" },
    { label: "PM 2.5", value: 14, unit: "µg/m³", status: "Dobry" },
    { label: "PM 10", value: 27, unit: "µg/m³", status: "Dobry" }
  ]
};

const STORAGE_KEY = "kuuki:last-live-data";

const elements = {
  heroLiveBadge: document.getElementById("hero-live-badge"),
  heroLiveBadgeText: document.getElementById("hero-live-badge-text"),
  statusPill: document.getElementById("status-pill"),
  statusLabel: document.getElementById("status-label"),
  statusDescription: document.getElementById("status-description"),
  measurementGrid: document.getElementById("measurement-grid"),
  locationValue: document.getElementById("location-value"),
  lastUpdatedValue: document.getElementById("last-updated-value"),
  statusFallbackNote: document.getElementById("status-fallback-note"),
  footerDataState: document.getElementById("footer-data-state"),
  dashboardHeroLink: document.getElementById("dashboard-hero-link"),
  dashboardNavLink: document.getElementById("dashboard-nav-link"),
  dashboardCardLink: document.getElementById("dashboard-card-link"),
  navToggle: document.querySelector(".nav-toggle"),
  navPanel: document.getElementById("site-menu")
};

const config = window.KUUKI_CONFIG || {};

function normalizeMeasurement(item) {
  if (!item) return null;

  return {
    label: String(item.label || item.name || item.metric || "PM"),
    value:
      item.value === null || item.value === undefined || Number.isNaN(Number(item.value))
        ? "—"
        : Number(item.value),
    unit: String(item.unit || "µg/m³"),
    status: String(item.status || item.level || "Brak danych")
  };
}

function normalizeLiveData(raw) {
  const payload = raw?.data ?? raw?.live ?? raw ?? {};
  const measurements = Array.isArray(payload.measurements)
    ? payload.measurements.map(normalizeMeasurement).filter(Boolean)
    : [
        normalizeMeasurement({
          label: "PM 1.0",
          value: payload.pm1 ?? payload.pm1_0 ?? payload.pm_1_0,
          unit: payload.unit,
          status: payload.pm1Status ?? payload.status
        }),
        normalizeMeasurement({
          label: "PM 2.5",
          value: payload.pm25 ?? payload.pm2_5 ?? payload.pm_2_5,
          unit: payload.unit,
          status: payload.pm25Status ?? payload.status
        }),
        normalizeMeasurement({
          label: "PM 10",
          value: payload.pm10 ?? payload.pm_10,
          unit: payload.unit,
          status: payload.pm10Status ?? payload.status
        })
      ].filter((item) => item && item.value !== "—");

  return {
    status: String(payload.status || DEFAULT_LIVE_DATA.status),
    statusColor: String(payload.statusColor || inferStatusColor(payload.status)).toLowerCase(),
    description: String(payload.description || DEFAULT_LIVE_DATA.description),
    location: String(
      payload.location || payload.sensorLocation || config.fallbackLocation || DEFAULT_LIVE_DATA.location
    ),
    lastUpdated: formatAbsoluteTime(payload.lastUpdated || payload.updatedAt) || config.fallbackLastUpdated,
    lastUpdatedRelative:
      payload.lastUpdatedRelative ||
      formatRelativeTime(payload.lastUpdated || payload.updatedAt) ||
      config.fallbackLastUpdatedRelative,
    updatedAtRaw: payload.lastUpdated || payload.updatedAt || "",
    measurements: measurements.length ? measurements : DEFAULT_LIVE_DATA.measurements
  };
}

function inferStatusColor(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("dobr")) return "green";
  if (value.includes("umiark") || value.includes("moder")) return "amber";
  if (value.includes("zł") || value.includes("bad")) return "red";
  return "green";
}

function formatAbsoluteTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatRelativeTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("pl-PL", { numeric: "auto" });

  const ranges = [
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 }
  ];

  for (const range of ranges) {
    if (Math.abs(diffSeconds) >= range.seconds || range.unit === "minute") {
      return rtf.format(Math.round(diffSeconds / range.seconds), range.unit);
    }
  }

  return "przed chwilą";
}

function setStatusTheme(statusColor, isFallback) {
  const pill = elements.statusPill;
  const badge = elements.heroLiveBadge;
  const root = document.documentElement;

  if (!pill || !badge || !root) return;

  const palette = {
    green: {
      dot: "#1fa97d",
      soft: "#e9f9f3",
      text: "#1a8f6b"
    },
    amber: {
      dot: "#cc8b18",
      soft: "#fff6e6",
      text: "#9b6b12"
    },
    red: {
      dot: "#d05959",
      soft: "#fff0f0",
      text: "#b13e3e"
    }
  };

  const theme = palette[statusColor] || palette.green;

  pill.style.background = theme.soft;
  pill.style.color = theme.text;
  badge.querySelector(".live-dot").style.background = isFallback ? theme.text : theme.dot;
  badge.querySelector(".live-dot").style.boxShadow = isFallback
    ? "0 0 0 6px rgba(204, 139, 24, 0.12)"
    : `0 0 0 6px ${hexToRgba(theme.dot, 0.14)}`;
  root.style.setProperty("--good", theme.dot);
  root.style.setProperty("--good-soft", theme.soft);
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const chunk = value.length === 3 ? value.split("").map((char) => char + char) : value.match(/../g);
  const [r, g, b] = chunk.map((part) => Number.parseInt(part, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMeasurements(measurements) {
  elements.measurementGrid.innerHTML = measurements
    .map(
      (item) => `
        <article class="measurement-item">
          <p class="measurement-label">${escapeHtml(item.label)}</p>
          <p class="measurement-value">${escapeHtml(item.value)}</p>
          <p class="measurement-unit">${escapeHtml(item.unit)}</p>
          <p class="measurement-status">${escapeHtml(item.status)}</p>
        </article>
      `
    )
    .join("");
}

function renderFallbackMessage(message) {
  if (!message) {
    elements.statusFallbackNote.classList.add("hidden");
    elements.statusFallbackNote.textContent = "";
    return;
  }

  elements.statusFallbackNote.classList.remove("hidden");
  elements.statusFallbackNote.textContent = message;
}

function renderLiveData(data, options = {}) {
  const {
    isFallback = false,
    sourceLabel = "Dane live aktywne",
    fallbackMessage = null,
    loading = false,
    badgeText = ""
  } = options;

  const relativeTimestamp =
    data.lastUpdatedRelative || formatRelativeTime(data.updatedAtRaw) || data.lastUpdated;

  elements.statusLabel.textContent = data.status;
  elements.statusDescription.textContent = data.description;
  elements.locationValue.textContent = data.location;
  elements.lastUpdatedValue.textContent = data.lastUpdated;
  elements.heroLiveBadgeText.textContent =
    badgeText ||
    (loading
      ? "Ładowanie danych live…"
      : isFallback
        ? `Brak live · ostatnia poprawna aktualizacja ${relativeTimestamp}`
        : `LIVE · aktualizacja ${relativeTimestamp}`);
  elements.footerDataState.textContent = sourceLabel;

  setStatusTheme(data.statusColor, isFallback);
  renderMeasurements(data.measurements);

  if (fallbackMessage) {
    renderFallbackMessage(fallbackMessage);
  } else if (isFallback) {
    renderFallbackMessage(
      `Brak aktualnych danych. Ostatnia poprawna aktualizacja: ${relativeTimestamp}.`
    );
  } else {
    renderFallbackMessage("");
  }
}

function loadCachedData() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function saveCachedData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* Ignore storage errors. */
  }
}

function buildRequest() {
  if (!config.apiBaseUrl) return null;

  const url = new URL(config.apiPath || "/", config.apiBaseUrl);

  if (config.apiQueryKey && config.apiKey) {
    url.searchParams.set(config.apiQueryKey, config.apiKey);
  }

  const headers = {};
  if (config.apiKey && config.apiKeyHeader) {
    headers[config.apiKeyHeader] = config.authScheme
      ? `${config.authScheme} ${config.apiKey}`
      : config.apiKey;
  }

  return {
    url: url.toString(),
    options: {
      method: "GET",
      headers
    }
  };
}

async function fetchWithTimeout(resource, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    Number(config.requestTimeoutMs || 10000)
  );

  try {
    return await fetch(resource, {
      ...options,
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchLiveData() {
  const request = buildRequest();
  if (!request) {
    throw new Error("Brak skonfigurowanego endpointu API.");
  }

  const response = await fetchWithTimeout(request.url, request.options);
  if (!response.ok) {
    throw new Error(`API zwróciło status ${response.status}.`);
  }

  const payload = await response.json();
  return normalizeLiveData(payload);
}

async function refreshLiveData() {
  if (!config.apiBaseUrl) {
    renderLiveData(normalizeLiveData(DEFAULT_LIVE_DATA), {
      isFallback: false,
      sourceLabel: "Tryb demonstracyjny danych",
      badgeText: `DEMO · aktualizacja ${config.fallbackLastUpdatedRelative || DEFAULT_LIVE_DATA.lastUpdatedRelative}`
    });
    return;
  }

  try {
    const data = await fetchLiveData();
    renderLiveData(data, {
      isFallback: false,
      sourceLabel: "Dane live aktywne"
    });
    saveCachedData(data);
  } catch (error) {
    const cached = loadCachedData();
    const fallback = cached || normalizeLiveData(DEFAULT_LIVE_DATA);
    renderLiveData(fallback, {
      isFallback: true,
      sourceLabel: cached ? "Tryb awaryjny: ostatni poprawny odczyt" : "Tryb demonstracyjny danych",
      fallbackMessage: cached
        ? null
        : "Brak aktualnych danych. Połącz stronę z API w config.js, aby zastąpić dane demonstracyjne."
    });
  }
}

function configureDashboardLinks() {
  const links = [
    elements.dashboardHeroLink,
    elements.dashboardNavLink,
    elements.dashboardCardLink
  ];

  for (const link of links) {
    if (!link) continue;

    if (config.dashboardUrl) {
      link.href = config.dashboardUrl;
      link.classList.remove("is-disabled");
      link.removeAttribute("aria-disabled");
      if (link.id === "dashboard-hero-link") {
        link.innerHTML = 'Zobacz dane live <span aria-hidden="true">→</span>';
      }
      continue;
    }

    link.href = "#faq";
    link.classList.add("is-disabled");
    link.setAttribute("aria-disabled", "true");
    if (link.id === "dashboard-hero-link") {
      link.innerHTML = "Dashboard w przygotowaniu";
    }
  }
}

function setupMobileNav() {
  if (!elements.navToggle || !elements.navPanel) return;

  elements.navToggle.addEventListener("click", () => {
    const nextState = elements.navToggle.getAttribute("aria-expanded") !== "true";
    elements.navToggle.setAttribute("aria-expanded", String(nextState));
    elements.navPanel.classList.toggle("is-open", nextState);
  });

  elements.navPanel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      elements.navToggle.setAttribute("aria-expanded", "false");
      elements.navPanel.classList.remove("is-open");
    });
  });
}

function init() {
  configureDashboardLinks();
  setupMobileNav();
  renderLiveData(normalizeLiveData(DEFAULT_LIVE_DATA), {
    isFallback: false,
    sourceLabel: "Ładowanie danych…",
    loading: true
  });
  refreshLiveData();

  const refreshInterval = Number(config.refreshIntervalMs || 0);
  if (refreshInterval > 0) {
    window.setInterval(refreshLiveData, refreshInterval);
  }
}

async function boot() {
  await (window.KUUKI_CONFIG_READY || Promise.resolve());
  init();
}

boot();
