# muhammadalisuyunov07-cmd.github.io


## Korea Market Dashboard (`stocks.html`)

A fast, accessible, mobile-first fintech dashboard showcasing South Korean blue-chip equities alongside daily foreign exchange reference rates from the European Central Bank.

### 1. Key Features
- **Stock Market Cards:** Bilingual display (Korean / English) for 6 major Korean equities (Samsung Electronics, SK Hynix, NAVER, Kakao, Hyundai Motor, and LG Energy Solution) with daily change pills, volume metrics, and inline SVG sparklines.
- **Interactive 30-Day Modal Chart:** Accessible modal dialog (`<dialog>` with `aria-modal`, keyboard trapping, and Escape handling) rendering high-DPI canvas charts with interactive hover tooltips.
- **Search & Sort:** Instant client-side search by Korean name, English name, or 6-digit KRX ticker code, with sorting by price, % change, or company name.
- **Currency Panel & Live Converter:** Converts between South Korean Won (KRW) and USD, EUR, JPY, and CNY using daily official European Central Bank reference exchange rates.
- **Privacy & Fast Performance:** Zero external tracking scripts, zero web font downloads (uses system fonts only), zero cookies, and client-side caching in `localStorage`.
- **Accessibility & Themes:** WCAG AA contrast, reduced-motion queries, dark and light theme toggle, and English/Korean bilingual toggle.

### 2. Data Sources & Provenance
1. **Equities Data (Synthetic Sample Data):**
   - **Location:** `data/stocks.json`
   - **Notice:** All stock figures, historical prices, and volume statistics are **SAMPLE DATA** provided for interface demonstration and educational testing. They are **not real-time or commercial trading prices**.
   - Marked explicitly with `_meta: { "sample": true }` in the JSON dataset and an amber warning banner across the dashboard.
2. **Foreign Exchange Rates (European Central Bank via Frankfurter):**
   - **Endpoint:** `https://api.frankfurter.dev/v1/latest?base=KRW&symbols=USD,EUR,JPY,CNY`
   - **Policy:** Keyless, rate-limit friendly API powered by published European Central Bank (ECB) daily reference rates.
   - **Caching:** Rates are cached in browser `localStorage` for 1 hour (60 minutes) to prevent redundant network calls and avoid hammering the public API.
   - **Graceful Fallback:** In offline or restricted network environments, cached rates or static ECB reference benchmarks are displayed with an informative notice.

### 3. How to Safely Add Official Live Stock Data in the Future
To transition this dashboard from synthetic sample data to live market prices without risking API ban, legal violation, or security breaches:

1. **Use an Authorized API:**
   - Obtain an official market data license or open developer API credentials (e.g., Korea Investment & Securities KIS Open API, KOSCOM, or Financial Supervisory Service Open DART).
   - **Never scrape** Naver Finance, Yahoo Finance, Google Finance, KRX, or any external portal. Client-side scraping violates terms of service and triggers automated IP bans.
2. **Never Store Secrets in Client Code:**
   - GitHub Pages is a public static file host. Storing API keys, client secrets, or bearer tokens in JavaScript or HTML exposes them immediately to the public.
3. **Recommended Safe Architecture (Serverless / Scheduled Action):**
   - Store private API credentials in **GitHub Secrets** (or server environment variables).
   - Create a scheduled **GitHub Actions workflow** (or a backend serverless cron worker, e.g., Cloudflare Worker or AWS Lambda) that runs at market close.
   - The workflow queries the official API server-side, validates the data, sanitizes it, and writes an updated `data/stocks.json` file back into the repository.
   - The browser continues to fetch only sanitized static JSON, requiring zero authentication keys on the client.

### 4. Crawler & AI Bot Directives (`robots.txt`)
- The repository includes a `robots.txt` file and `<meta name="robots" content="noai, noimageai">` tags requesting AI training scrapers (such as `GPTBot`, `CCBot`, `Google-Extended`, `anthropic-ai`, `ClaudeBot`, and `Bytespider`) to refrain from scraping content.
- **Important Note:** `robots.txt` and `noai` metadata represent a standard polite advisory convention among web services, not an encrypted technical boundary or DRM mechanism.

### 5. License & Terms
- Copyright (c) 2026 Muhammadali. All rights reserved.
- Proprietary: No permission is granted to copy, modify, or redistribute this code without written permission from the author.
