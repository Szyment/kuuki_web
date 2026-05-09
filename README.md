# Kuuki landing page

Statyczny landing page projektu Kuuki przygotowany pod GitHub Pages.

## Pliki

- `index.html` — struktura strony i sekcje landing page
- `styles.css` — layout, motyw i responsywność
- `main.js` — logika live data, fallback, cache i CTA
- `config.js` — publiczna konfiguracja dashboardu oraz API bez sekretów
- `config.local.js` — lokalne nadpisania, np. read-only API key, ignorowane przez git

## Jak opublikować na GitHub Pages

1. Wgraj repozytorium do GitHuba.
2. Wejdź w `Settings` → `Pages`.
3. W sekcji `Build and deployment` wybierz:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
4. Zapisz ustawienia.

Po chwili strona będzie dostępna pod adresem GitHub Pages repozytorium.

## Konfiguracja live data

Publiczne ustawienia trzymaj w `config.js`:

```js
window.KUUKI_CONFIG = {
  dashboardUrl: "https://twoj-dashboard.example.com",
  apiBaseUrl: "https://twoje-api.example.com",
  apiPath: "/live",
  apiKey: "",
  apiKeyHeader: "x-api-key",
  authScheme: "",
  apiQueryKey: "",
  refreshIntervalMs: 120000
};
```

Lokalny klucz trzymaj w `config.local.js`:

```js
window.KUUKI_LOCAL_CONFIG = {
  apiKey: "twoj-read-only-klucz"
};
```

### Obsługiwane formaty odpowiedzi API

Najprostszy wspierany format:

```json
{
  "status": "DOBRY",
  "statusColor": "green",
  "description": "Powietrze jest w dobrym zakresie. Możecie normalnie prowadzić zajęcia.",
  "location": "Klasa 2D",
  "lastUpdated": "2026-05-09T12:42:00+02:00",
  "measurements": [
    { "label": "PM 1.0", "value": 8, "unit": "µg/m³", "status": "Dobry" },
    { "label": "PM 2.5", "value": 14, "unit": "µg/m³", "status": "Dobry" },
    { "label": "PM 10", "value": 27, "unit": "µg/m³", "status": "Dobry" }
  ]
}
```

Strona ma też fallback:

- jeśli `apiBaseUrl` jest puste, strona pokazuje estetyczny tryb demonstracyjny
- gdy API nie odpowiada, pokazuje ostatni poprawny odczyt z `localStorage`
- jeśli jeszcze nie ma żadnego odczytu, pokazuje dane demonstracyjne

## Uwaga o kluczu API

`config.local.js` jest teraz w `.gitignore`, więc nie wpadnie do repozytorium.

GitHub Pages nadal jest hostingiem statycznym, więc jeśli strona ma pobierać dane bezpośrednio z przeglądarki, taki klucz i tak będzie widoczny dla użytkownika końcowego w network tabie. Dlatego dla produkcji są bezpieczne tylko dwie opcje:

- publiczny klucz tylko do odczytu, bez żadnych uprawnień zapisu
- proxy / backend pośredni, który trzyma sekret po stronie serwera
