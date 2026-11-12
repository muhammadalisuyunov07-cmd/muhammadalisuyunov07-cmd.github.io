/**
 * ============================================================================
 * KOREA MARKET DASHBOARD - CLIENT APPLICATION
 * ============================================================================
 *
 * ARCHITECTURE & SECURITY NOTICE:
 * ----------------------------------------------------------------------------
 * 1. ZERO SCRAPING: This site NEVER scrapes Naver Finance, Yahoo Finance,
 *    Google Finance, KRX, or any external market pages. Scraping violates
 *    terms of service and breaks without notice.
 * 2. ZERO CLIENT-SIDE SECRETS: Never store API keys, tokens, or credentials
 *    in client-side JavaScript. This repository is hosted on GitHub Pages
 *    as public static assets.
 * 3. PRODUCTION INTEGRATION PATH:
 *    To integrate official live stock data in the future:
 *    a) Use an authorized market data API (e.g., Korea Investment & Securities
 *       Open API, KOSCOM, or Financial Supervisory Service Open DART).
 *    b) Fetch and process data via a scheduled GitHub Actions workflow or a
 *       secure serverless function (AWS Lambda, Cloudflare Workers, etc.).
 *    c) Store the private API credentials exclusively in GitHub Secrets or
 *       environment variables.
 *    d) Output sanitized, static JSON files (e.g. data/stocks.json) into the
 *       repository or serve through an authenticated read-only caching proxy.
 * 4. STRICT PRIVACY: No cookies, trackers, analytics, or behavioral recording.
 *    Only localStorage is utilized for user preferences (theme, language) and
 *    temporary client caching of exchange rates.
 * ============================================================================
 */

(function () {
  'use strict';

  // --- Configuration Constants ---
  const STOCKS_DATA_URL = 'data/stocks.json';
  const FX_API_URL = 'https://api.frankfurter.dev/v1/latest?base=KRW&symbols=USD,EUR,JPY,CNY';
  const FX_CACHE_KEY = 'korea_market_fx_cache_v1';
  const FX_CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache limit

  const THEME_KEY = 'korea_market_theme';
  const LANG_KEY = 'korea_market_lang';

  // Fallback ECB reference rates if network is offline or blocked
  const FX_FALLBACK_RATES = {
    USD: 0.000725, // ~1,379.31 KRW
    EUR: 0.000673, // ~1,485.88 KRW
    JPY: 0.1105,   // ~904.97 KRW per 100 JPY (9.05 KRW/JPY)
    CNY: 0.00518   // ~193.05 KRW
  };

  // --- Bilingual Dictionary ---
  const I18N = {
    en: {
      siteTitle: "Korea Market",
      siteBadge: "Fintech Dashboard",
      backHome: "Portfolio Home",
      themeToggleAria: "Toggle light or dark theme",
      langToggleAria: "Switch language to Korean",
      sampleBannerTitle: "SAMPLE DATA - not real prices",
      sampleBannerDesc: "Demonstration dataset for interface testing only. Not real-time financial market prices.",
      heroTitle: "Korea Market Dashboard",
      heroSubtitle: "Curated KOSPI blue-chips and real-time ECB foreign exchange rates",
      marketStatus: "Simulated Trading Session",
      lastUpdatedPrefix: "Data timestamp:",
      searchPlaceholder: "Search stock by name or 6-digit code...",
      sortLabel: "Sort by:",
      sortName: "Company Name",
      sortChangeDesc: "Top Gainers (%)",
      sortChangeAsc: "Top Losers (%)",
      sortPriceDesc: "Highest Price",
      sortPriceAsc: "Lowest Price",
      emptySearchTitle: "No stocks found",
      emptySearchDesc: "Try searching with a different name or ticker code.",
      volLabel: "Vol:",
      openChartAria: "View 30-day chart for",
      modalDisclaimer: "Notice: Chart figures are historical sample values for demonstration.",
      modalHigh52: "52W High",
      modalLow52: "52W Low",
      modalVolume: "24h Volume",
      modalMarketCap: "Market Cap",
      fxTitle: "KRW Foreign Exchange Rates",
      fxDesc: "Official European Central Bank reference exchange rates",
      fxSourceNote: "Source: European Central Bank via Frankfurter, updated daily.",
      fxFallbackNotice: "(Displaying fallback reference values due to network availability)",
      converterTitle: "Currency Converter",
      convertFrom: "From",
      convertTo: "To",
      swapAria: "Swap currencies",
      termsTitle: "Data Provenance & Terms of Use",
      termsP1: "Stock market data presented on this dashboard is strictly synthetic sample data stored locally in data/stocks.json. It does not reflect real-time pricing from KRX, Naver, or any securities exchange.",
      termsP2: "Foreign currency exchange rates are retrieved from Frankfurter (api.frankfurter.dev), an open API delivering daily reference rates published by the European Central Bank (ECB). Rates are cached in browser localStorage for 60 minutes to minimize server load.",
      termsP3: "This site operates with a strict Content Security Policy and zero analytics or trackers.",
      footerDisclaimerTitle: "Legal & Educational Notice",
      footerDisclaimer: "Educational project. Not investment advice. Stock figures are sample data. Exchange rates are informational and may be delayed or inaccurate.",
      footerCopyright: "(c) 2026 Muhammadali. All rights reserved."
    },
    ko: {
      siteTitle: "한국 시장",
      siteBadge: "핀테크 대시보드",
      backHome: "포트폴리오 홈",
      themeToggleAria: "다크/라이트 테마 변경",
      langToggleAria: "언어를 영어로 변경",
      sampleBannerTitle: "샘플 데이터 - 실제 주가가 아닙니다",
      sampleBannerDesc: "인터페이스 디자인 및 기술 검증을 위한 가상 데이터입니다. 실제 시장 가격이 아닙니다.",
      heroTitle: "한국 주식 시장 대시보드",
      heroSubtitle: "주요 KOSPI 우량주 지표 및 유럽중앙은행(ECB) 기준 환율 정보",
      marketStatus: "가상 거래 세션",
      lastUpdatedPrefix: "데이터 기준시점:",
      searchPlaceholder: "종목명 또는 6자리 종목코드 검색...",
      sortLabel: "정렬 기준:",
      sortName: "종목명순",
      sortChangeDesc: "상승률 높은순",
      sortChangeAsc: "하락률 높은순",
      sortPriceDesc: "주가 높은순",
      sortPriceAsc: "주가 낮은순",
      emptySearchTitle: "검색 결과가 없습니다",
      emptySearchDesc: "다른 종목명이나 종목코드로 다시 검색해 보세요.",
      volLabel: "거래량:",
      openChartAria: "30일 차트 상세보기:",
      modalDisclaimer: "주의: 본 차트 수치는 시연 목적의 가상 샘플 데이터입니다.",
      modalHigh52: "52주 최고",
      modalLow52: "52주 최저",
      modalVolume: "일일 거래량",
      modalMarketCap: "시가총액",
      fxTitle: "원화(KRW) 기준 환율 정보",
      fxDesc: "유럽중앙은행(ECB) 공식 공시 기준 환율",
      fxSourceNote: "출처: 유럽중앙은행(ECB) 제공, Frankfurter API 연동 (일 1회 업데이트).",
      fxFallbackNotice: "(네트워크 상태로 인해 사전 설정된 기준 환율을 표시 중입니다)",
      converterTitle: "실시간 환율 계산기",
      convertFrom: "보유 통화",
      convertTo: "환전 통화",
      swapAria: "통화 위치 변경",
      termsTitle: "데이터 출처 및 이용 안내",
      termsP1: "본 대시보드의 주식 데이터는 data/stocks.json에 저장된 모의 샘플 데이터입니다. KRX, 네이버 증권 등 외부 거래소의 실시간 시세가 아닙니다.",
      termsP2: "환율 정보는 유럽중앙은행(ECB)의 일일 기준 환율 데이터를 전달하는 Frankfurter API(api.frankfurter.dev)를 통해 조회되며, 서버 부하 방지를 위해 브라우저 localStorage에 1시간 동안 캐싱됩니다.",
      termsP3: "본 사이트는 엄격한 콘텐츠 보안 정책(CSP)을 준수하며 일체의 쿠키나 추적 스크립트를 사용하지 않습니다.",
      footerDisclaimerTitle: "법적 고지 및 교육용 안내",
      footerDisclaimer: "본 사이트는 교육용 프로젝트입니다. 투자 권유나 조언이 아니며, 주식 수치는 샘플 데이터입니다. 환율 정보는 단순 참고용으로 지연되거나 부정확할 수 있습니다.",
      footerCopyright: "(c) 2026 Muhammadali. All rights reserved."
    }
  };

  // --- Application State ---
  let currentLang = 'en';
  let currentTheme = 'dark';
  let stocksList = [];
  let fxData = null;
  let fxSourceType = 'live'; // 'live', 'cached', or 'fallback'
  let activeModalStock = null;
  let lastFocusedElement = null;

  // --- DOM Elements ---
  const elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    langToggleBtn: document.getElementById('langToggleBtn'),
    langTextSpan: document.getElementById('langTextSpan'),
    searchInput: document.getElementById('stockSearchInput'),
    sortSelect: document.getElementById('stockSortSelect'),
    stocksGrid: document.getElementById('stocksGrid'),
    marketTimestamp: document.getElementById('marketTimestamp'),
    fxGrid: document.getElementById('fxGrid'),
    fxSourceNote: document.getElementById('fxSourceNote'),
    converterAmount: document.getElementById('converterAmount'),
    converterFrom: document.getElementById('converterFrom'),
    converterTo: document.getElementById('converterTo'),
    converterSwapBtn: document.getElementById('converterSwapBtn'),
    converterSummary: document.getElementById('converterSummary'),
    chartModal: document.getElementById('stockModal'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalTitle: document.getElementById('modalStockTitle'),
    modalSubtitle: document.getElementById('modalStockSubtitle'),
    modalPrice: document.getElementById('modalStockPrice'),
    modalChange: document.getElementById('modalStockChange'),
    modalHigh52: document.getElementById('modalHigh52'),
    modalLow52: document.getElementById('modalLow52'),
    modalVolume: document.getElementById('modalVolume'),
    modalMarketCap: document.getElementById('modalMarketCap'),
    modalCanvas: document.getElementById('modalChartCanvas'),
    modalTooltip: document.getElementById('chartTooltip')
  };

  // --- Security: Data Sanitizer & Validator ---
  function validateStocksPayload(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data._meta || data._meta.sample !== true) return false;
    if (!Array.isArray(data.stocks) || data.stocks.length === 0) return false;

    // Validate structure of each stock item
    for (const item of data.stocks) {
      if (typeof item.ticker !== 'string' || item.ticker.length < 5) return false;
      if (typeof item.nameEn !== 'string' || typeof item.nameKo !== 'string') return false;
      if (typeof item.price !== 'number' || item.price <= 0) return false;
      if (typeof item.change !== 'number' || typeof item.changePercent !== 'number') return false;
      if (typeof item.volume !== 'number') return false;
      if (!Array.isArray(item.history30d) || item.history30d.length === 0) return false;
    }
    return true;
  }

  function validateFxPayload(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.rates || typeof data.rates !== 'object') return false;
    const requiredCurrencies = ['USD', 'EUR', 'JPY', 'CNY'];
    for (const curr of requiredCurrencies) {
      if (typeof data.rates[curr] !== 'number' || data.rates[curr] <= 0) {
        return false;
      }
    }
    return true;
  }

  // --- Number & Currency Formatting ---
  function formatKRW(val) {
    return new Intl.NumberFormat('ko-KR').format(Math.round(val));
  }

  function formatNumber(val) {
    return new Intl.NumberFormat('en-US').format(val);
  }

  function formatMarketCap(valKRW, lang) {
    if (lang === 'ko') {
      const jo = Math.floor(valKRW / 1000000000000);
      const eok = Math.floor((valKRW % 1000000000000) / 100000000);
      return eok > 0 ? `${jo}조 ${eok}억원` : `${jo}조원`;
    } else {
      const trillion = (valKRW / 1000000000000).toFixed(1);
      return `${trillion}T KRW`;
    }
  }

  // --- Internationalization (i18n) Engine ---
  function setLanguage(lang) {
    currentLang = lang === 'ko' ? 'ko' : 'en';
    localStorage.setItem(LANG_KEY, currentLang);
    document.documentElement.lang = currentLang;

    // Update data-i18n elements safely using textContent
    const elementsToTranslate = document.querySelectorAll('[data-i18n]');
    elementsToTranslate.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (I18N[currentLang][key]) {
        el.textContent = I18N[currentLang][key];
      }
    });

    // Update aria labels & placeholders
    if (elements.langTextSpan) {
      elements.langTextSpan.textContent = currentLang === 'ko' ? 'EN' : '한국어';
    }
    if (elements.langToggleBtn) {
      elements.langToggleBtn.setAttribute('aria-label', I18N[currentLang].langToggleAria);
    }
    if (elements.searchInput) {
      elements.searchInput.setAttribute('placeholder', I18N[currentLang].searchPlaceholder);
    }

    // Re-render components with localized names
    renderStocksList();
    renderFxCards();
    updateConverterSummary();
    if (activeModalStock) {
      populateModal(activeModalStock);
    }
  }

  // --- Theme Management ---
  function setTheme(theme) {
    currentTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem(THEME_KEY, currentTheme);

    // Redraw canvas if modal is open to update stroke colors
    if (activeModalStock && elements.chartModal && elements.chartModal.open) {
      drawCanvasChart(activeModalStock.history30d, activeModalStock.change >= 0);
    }
  }

  // --- Safe SVG Creation Helpers ---
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function createSvgElement(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, val] of Object.entries(attrs)) {
      el.setAttribute(key, val);
    }
    return el;
  }

  function generateSparklineSvg(history, isPositive) {
    const width = 160;
    const height = 48;
    const padding = 4;

    const prices = history.map((h) => h.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = prices.map((price, idx) => {
      const x = padding + (idx / (prices.length - 1)) * (width - padding * 2);
      const y = height - padding - ((price - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const svg = createSvgElement('svg', {
      viewBox: `0 0 ${width} ${height}`,
      class: 'sparkline-svg',
      preserveAspectRatio: 'none',
      'aria-hidden': 'true'
    });

    const strokeColor = isPositive ? 'var(--up-color)' : 'var(--down-color)';

    // Trendline polyline
    const polyline = createSvgElement('polyline', {
      fill: 'none',
      stroke: strokeColor,
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      points: points.join(' ')
    });

    // Final point dot
    const lastPoint = points[points.length - 1].split(',');
    const circle = createSvgElement('circle', {
      cx: lastPoint[0],
      cy: lastPoint[1],
      r: '3',
      fill: strokeColor
    });

    svg.appendChild(polyline);
    svg.appendChild(circle);
    return svg;
  }

  // --- Stock Cards Rendering (Safe DOM Construction) ---
  function renderStocksList() {
    if (!elements.stocksGrid) return;

    // Clear current grid safely
    while (elements.stocksGrid.firstChild) {
      elements.stocksGrid.removeChild(elements.stocksGrid.firstChild);
    }

    const query = (elements.searchInput?.value || '').trim().toLowerCase();
    const sortMode = elements.sortSelect?.value || 'change_desc';

    // Filter stocks
    let filtered = stocksList.filter((item) => {
      if (!query) return true;
      const matchTicker = item.ticker.toLowerCase().includes(query);
      const matchEn = item.nameEn.toLowerCase().includes(query);
      const matchKo = item.nameKo.toLowerCase().includes(query);
      return matchTicker || matchEn || matchKo;
    });

    // Sort stocks
    filtered.sort((a, b) => {
      if (sortMode === 'name') {
        const nameA = currentLang === 'ko' ? a.nameKo : a.nameEn;
        const nameB = currentLang === 'ko' ? b.nameKo : b.nameEn;
        return nameA.localeCompare(nameB);
      } else if (sortMode === 'change_desc') {
        return b.changePercent - a.changePercent;
      } else if (sortMode === 'change_asc') {
        return a.changePercent - b.changePercent;
      } else if (sortMode === 'price_desc') {
        return b.price - a.price;
      } else if (sortMode === 'price_asc') {
        return a.price - b.price;
      }
      return 0;
    });

    if (filtered.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'state-message';

      const emptyTitle = document.createElement('h3');
      emptyTitle.textContent = I18N[currentLang].emptySearchTitle;

      const emptyDesc = document.createElement('p');
      emptyDesc.textContent = I18N[currentLang].emptySearchDesc;

      emptyBox.appendChild(emptyTitle);
      emptyBox.appendChild(emptyDesc);
      elements.stocksGrid.appendChild(emptyBox);
      return;
    }

    // Build each card with safe DOM methods
    filtered.forEach((stock) => {
      const card = document.createElement('div');
      card.className = 'stock-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute(
        'aria-label',
        `${I18N[currentLang].openChartAria} ${currentLang === 'ko' ? stock.nameKo : stock.nameEn} (${stock.ticker})`
      );

      // Card Top: Names & Ticker
      const cardTop = document.createElement('div');
      cardTop.className = 'card-top';

      const namesBox = document.createElement('div');
      namesBox.className = 'company-names';

      const primaryName = document.createElement('span');
      primaryName.className = 'company-name-primary';
      primaryName.textContent = currentLang === 'ko' ? stock.nameKo : stock.nameEn;

      const secondaryName = document.createElement('span');
      secondaryName.className = 'company-name-secondary';
      secondaryName.textContent = currentLang === 'ko' ? stock.nameEn : stock.nameKo;

      namesBox.appendChild(primaryName);
      namesBox.appendChild(secondaryName);

      const tickerBadge = document.createElement('span');
      tickerBadge.className = 'ticker-badge';
      tickerBadge.textContent = stock.ticker;

      cardTop.appendChild(namesBox);
      cardTop.appendChild(tickerBadge);

      // Card Mid: Price & Change Pill
      const cardMid = document.createElement('div');
      cardMid.className = 'card-mid';

      const priceBox = document.createElement('div');
      priceBox.className = 'price-box';

      const priceVal = document.createElement('span');
      priceVal.className = 'current-price';
      priceVal.textContent = formatKRW(stock.price);

      const currSym = document.createElement('span');
      currSym.className = 'currency-symbol';
      currSym.textContent = 'KRW';

      priceVal.appendChild(currSym);
      priceBox.appendChild(priceVal);

      const isPositive = stock.change >= 0;
      const changePill = document.createElement('span');
      changePill.className = `change-pill ${isPositive ? 'up' : 'down'}`;

      const arrow = document.createElement('span');
      arrow.className = 'change-arrow';
      arrow.textContent = isPositive ? '▲' : '▼';

      const changeText = document.createTextNode(
        ` ${isPositive ? '+' : ''}${stock.changePercent.toFixed(2)}%`
      );

      changePill.appendChild(arrow);
      changePill.appendChild(changeText);

      cardMid.appendChild(priceBox);
      cardMid.appendChild(changePill);

      // Sparkline Box
      const sparklineBox = document.createElement('div');
      sparklineBox.className = 'sparkline-box';
      const sparklineSvg = generateSparklineSvg(stock.history30d, isPositive);
      sparklineBox.appendChild(sparklineSvg);

      // Card Bottom: Volume & Hint
      const cardBottom = document.createElement('div');
      cardBottom.className = 'card-bottom';

      const volSpan = document.createElement('span');
      volSpan.textContent = `${I18N[currentLang].volLabel} ${formatNumber(stock.volume)}`;

      const hintSpan = document.createElement('span');
      hintSpan.className = 'card-cta-hint';
      hintSpan.textContent = currentLang === 'ko' ? '30일 차트 →' : '30D Chart →';

      cardBottom.appendChild(volSpan);
      cardBottom.appendChild(hintSpan);

      // Assemble card
      card.appendChild(cardTop);
      card.appendChild(cardMid);
      card.appendChild(sparklineBox);
      card.appendChild(cardBottom);

      // Card click & keyboard interaction
      const openModalHandler = () => {
        lastFocusedElement = card;
        openStockModal(stock);
      };

      card.addEventListener('click', openModalHandler);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModalHandler();
        }
      });

      elements.stocksGrid.appendChild(card);
    });
  }

  // --- Modal & 30-Day Canvas Chart ---
  function openStockModal(stock) {
    activeModalStock = stock;
    populateModal(stock);

    if (typeof elements.chartModal.showModal === 'function') {
      elements.chartModal.showModal();
    } else {
      elements.chartModal.setAttribute('open', '');
    }

    // Draw high-resolution canvas chart
    requestAnimationFrame(() => {
      drawCanvasChart(stock.history30d, stock.change >= 0);
    });

    if (elements.modalCloseBtn) {
      elements.modalCloseBtn.focus();
    }
  }

  function closeStockModal() {
    activeModalStock = null;
    if (typeof elements.chartModal.close === 'function') {
      elements.chartModal.close();
    } else {
      elements.chartModal.removeAttribute('open');
    }

    if (lastFocusedElement) {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  }

  function populateModal(stock) {
    if (!stock) return;
    elements.modalTitle.textContent = `${currentLang === 'ko' ? stock.nameKo : stock.nameEn} (${stock.ticker})`;
    elements.modalSubtitle.textContent = currentLang === 'ko' ? stock.sectorKo : stock.sectorEn;
    elements.modalPrice.textContent = `${formatKRW(stock.price)} KRW`;

    const isPositive = stock.change >= 0;
    elements.modalChange.textContent = `${isPositive ? '+' : ''}${formatKRW(stock.change)} KRW (${isPositive ? '+' : ''}${stock.changePercent.toFixed(2)}%)`;
    elements.modalChange.className = `metric-val ${isPositive ? 'up' : 'down'}`;

    elements.modalHigh52.textContent = `${formatKRW(stock.high52w)} KRW`;
    elements.modalLow52.textContent = `${formatKRW(stock.low52w)} KRW`;
    elements.modalVolume.textContent = formatNumber(stock.volume);
    elements.modalMarketCap.textContent = formatMarketCap(stock.marketCapKRW, currentLang);
  }

  function drawCanvasChart(history, isPositive) {
    const canvas = elements.modalCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padX = 50;
    const padY = 30;

    ctx.clearRect(0, 0, w, h);

    const prices = history.map((item) => item.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    // Grid lines & price labels
    const gridRows = 4;
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const textDimColor = isDark ? '#64748b' : '#94a3b8';
    const lineColor = isPositive
      ? (isDark ? '#10b981' : '#047857')
      : (isDark ? '#ef4444' : '#b91c1c');

    ctx.strokeStyle = gridColor;
    ctx.fillStyle = textDimColor;
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridRows; i++) {
      const y = padY + (i / gridRows) * (h - padY * 2);
      const val = max - (i / gridRows) * range;

      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();

      ctx.fillText(formatKRW(val), padX - 8, y);
    }

    // Compute coordinate points
    const points = prices.map((price, idx) => {
      const x = padX + (idx / (prices.length - 1)) * (w - padX - 15);
      const y = h - padY - ((price - min) / range) * (h - padY * 2);
      return { x, y, date: history[idx].date, price };
    });

    // Filled gradient area
    const gradient = ctx.createLinearGradient(0, padY, 0, h - padY);
    gradient.addColorStop(0, isPositive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, h - padY);
    points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(points[points.length - 1].x, h - padY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Chart path line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // End point highlight
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();

    // Attach mousemove tooltip for canvas
    canvas.onmousemove = (evt) => {
      const mouseX = evt.offsetX;
      let closest = points[0];
      let minDistance = Math.abs(mouseX - points[0].x);

      for (let i = 1; i < points.length; i++) {
        const dist = Math.abs(mouseX - points[i].x);
        if (dist < minDistance) {
          minDistance = dist;
          closest = points[i];
        }
      }

      if (elements.modalTooltip) {
        elements.modalTooltip.textContent = `${closest.date}: ${formatKRW(closest.price)} KRW`;
      }
    };
  }

  // --- Currency Exchange (Frankfurter API + Caching) ---
  async function loadFxRates() {
    // 1. Check valid localStorage cache
    const cachedEntry = localStorage.getItem(FX_CACHE_KEY);
    if (cachedEntry) {
      try {
        const parsed = JSON.parse(cachedEntry);
        const age = Date.now() - (parsed.cachedAt || 0);
        if (age < FX_CACHE_DURATION_MS && validateFxPayload(parsed.payload)) {
          fxData = parsed.payload;
          fxSourceType = 'cached';
          renderFxCards();
          updateConverterSummary();
          return;
        }
      } catch (err) {
        // Cache parse failure: proceed to network fetch
      }
    }

    // 2. Fetch live rates from Frankfurter API (at most once per page session)
    try {
      const response = await fetch(FX_API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();

      if (!validateFxPayload(data)) {
        throw new Error('Malformed FX payload');
      }

      fxData = data;
      fxSourceType = 'live';

      // Persist to localStorage cache
      localStorage.setItem(
        FX_CACHE_KEY,
        JSON.stringify({
          cachedAt: Date.now(),
          payload: data
        })
      );
    } catch (err) {
      // 3. Fallback: Check expired cache first, then fallback table
      if (cachedEntry) {
        try {
          const parsed = JSON.parse(cachedEntry);
          if (validateFxPayload(parsed.payload)) {
            fxData = parsed.payload;
            fxSourceType = 'cached';
            renderFxCards();
            updateConverterSummary();
            return;
          }
        } catch (_) {}
      }

      // Final fallback to ECB static verified baseline
      fxData = {
        amount: 1,
        base: 'KRW',
        date: '2026-11-04',
        rates: FX_FALLBACK_RATES
      };
      fxSourceType = 'fallback';
    }

    renderFxCards();
    updateConverterSummary();
  }

  function renderFxCards() {
    if (!elements.fxGrid || !fxData) return;

    while (elements.fxGrid.firstChild) {
      elements.fxGrid.removeChild(elements.fxGrid.firstChild);
    }

    const currencies = [
      { code: 'USD', name: 'US Dollar', nameKo: '미국 달러', flag: '🇺🇸' },
      { code: 'EUR', name: 'Euro', nameKo: '유로', flag: '🇪🇺' },
      { code: 'JPY', name: 'Japanese Yen (100¥)', nameKo: '일본 엔 (100엔)', flag: '🇯🇵', multiplier: 100 },
      { code: 'CNY', name: 'Chinese Yuan', nameKo: '중국 위안', flag: '🇨🇳' }
    ];

    currencies.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'fx-card';

      const pairRow = document.createElement('div');
      pairRow.className = 'fx-pair';

      const symbols = document.createElement('span');
      symbols.className = 'fx-symbols';
      symbols.textContent = `${item.code} / KRW`;

      const flag = document.createElement('span');
      flag.className = 'fx-flag';
      flag.textContent = item.flag;

      pairRow.appendChild(symbols);
      pairRow.appendChild(flag);

      // Frankfurter rates: base = KRW, so rate = how many foreign units per 1 KRW.
      // To display standard "1 Foreign Unit = X KRW":
      const ratePerKRW = fxData.rates[item.code];
      const krwPerUnit = ratePerKRW > 0 ? (1 / ratePerKRW) * (item.multiplier || 1) : 0;

      const rateVal = document.createElement('div');
      rateVal.className = 'fx-rate-val';
      rateVal.textContent = `₩ ${formatKRW(krwPerUnit)}`;

      const rateLabel = document.createElement('div');
      rateLabel.className = 'fx-rate-label';
      rateLabel.textContent = currentLang === 'ko' ? item.nameKo : item.name;

      card.appendChild(pairRow);
      card.appendChild(rateVal);
      card.appendChild(rateLabel);

      elements.fxGrid.appendChild(card);
    });

    // Update note / fallback notice
    if (elements.fxSourceNote) {
      const baseNote = I18N[currentLang].fxSourceNote;
      const fallbackNote = fxSourceType === 'fallback' ? ` ${I18N[currentLang].fxFallbackNotice}` : '';
      elements.fxSourceNote.textContent = `${baseNote} (Date: ${fxData.date || 'ECB latest'})${fallbackNote}`;
    }
  }

  // --- Currency Converter ---
  function updateConverterSummary() {
    if (!fxData || !elements.converterAmount || !elements.converterSummary) return;

    const amount = parseFloat(elements.converterAmount.value) || 0;
    const from = elements.converterFrom.value;
    const to = elements.converterTo.value;

    if (amount <= 0) {
      elements.converterSummary.textContent = '0';
      return;
    }

    // Conversion logic:
    // Frankfurter base is KRW: rates[CURR] = foreign units per 1 KRW
    // Therefore:
    // 1 KRW = rates[CURR] units of foreign currency
    // 1 Foreign Unit = (1 / rates[CURR]) KRW
    let result = 0;

    if (from === to) {
      result = amount;
    } else if (from === 'KRW') {
      const targetRate = fxData.rates[to];
      result = amount * targetRate;
    } else if (to === 'KRW') {
      const fromRate = fxData.rates[from];
      result = fromRate > 0 ? amount / fromRate : 0;
    } else {
      // Cross-currency conversion (e.g. USD to EUR via KRW base)
      const fromRate = fxData.rates[from]; // units per 1 KRW
      const toRate = fxData.rates[to];     // units per 1 KRW
      const amountInKRW = fromRate > 0 ? amount / fromRate : 0;
      result = amountInKRW * toRate;
    }

    const formattedResult = to === 'KRW'
      ? `${formatKRW(result)} KRW`
      : `${result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${to}`;

    elements.converterSummary.textContent = `${formatNumber(amount)} ${from} ≈ ${formattedResult}`;
  }

  // --- Stock Data Ingestion ---
  async function loadStockData() {
    try {
      const response = await fetch(STOCKS_DATA_URL);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();

      if (!validateStocksPayload(data)) {
        throw new Error('Stock data failed security and structure validation');
      }

      stocksList = data.stocks;

      if (elements.marketTimestamp && data._meta.updatedAt) {
        const dateObj = new Date(data._meta.updatedAt);
        elements.marketTimestamp.textContent = `${I18N[currentLang].lastUpdatedPrefix} ${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      renderStocksList();
    } catch (err) {
      if (elements.stocksGrid) {
        while (elements.stocksGrid.firstChild) {
          elements.stocksGrid.removeChild(elements.stocksGrid.firstChild);
        }
        const errorBox = document.createElement('div');
        errorBox.className = 'state-message';
        const errTitle = document.createElement('h3');
        errTitle.textContent = currentLang === 'ko' ? '데이터 로드 실패' : 'Unable to load stock data';
        const errDesc = document.createElement('p');
        errDesc.textContent = currentLang === 'ko'
          ? '로컬 샘플 데이터(data/stocks.json)를 불러올 수 없습니다.'
          : 'Could not load local sample stocks dataset.';
        errorBox.appendChild(errTitle);
        errorBox.appendChild(errDesc);
        elements.stocksGrid.appendChild(errorBox);
      }
    }
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Theme toggle
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', () => {
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
      });
    }

    // Language toggle
    if (elements.langToggleBtn) {
      elements.langToggleBtn.addEventListener('click', () => {
        setLanguage(currentLang === 'en' ? 'ko' : 'en');
      });
    }

    // Search input
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', () => {
        renderStocksList();
      });
    }

    // Sort select
    if (elements.sortSelect) {
      elements.sortSelect.addEventListener('change', () => {
        renderStocksList();
      });
    }

    // Modal close button & Escape key
    if (elements.modalCloseBtn) {
      elements.modalCloseBtn.addEventListener('click', closeStockModal);
    }

    if (elements.chartModal) {
      // Backdrop click closes dialog
      elements.chartModal.addEventListener('click', (e) => {
        const rect = elements.chartModal.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          closeStockModal();
        }
      });

      // Escape key handler
      elements.chartModal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeStockModal();
        }
      });
    }

    // Currency converter controls
    if (elements.converterAmount) {
      elements.converterAmount.addEventListener('input', updateConverterSummary);
    }
    if (elements.converterFrom) {
      elements.converterFrom.addEventListener('change', updateConverterSummary);
    }
    if (elements.converterTo) {
      elements.converterTo.addEventListener('change', updateConverterSummary);
    }
    if (elements.converterSwapBtn) {
      elements.converterSwapBtn.addEventListener('click', () => {
        const temp = elements.converterFrom.value;
        elements.converterFrom.value = elements.converterTo.value;
        elements.converterTo.value = temp;
        updateConverterSummary();
      });
    }

    // Window resize redrawing
    window.addEventListener('resize', () => {
      if (activeModalStock && elements.chartModal && elements.chartModal.open) {
        drawCanvasChart(activeModalStock.history30d, activeModalStock.change >= 0);
      }
    });
  }

  // --- Application Bootstrap ---
  function init() {
    // Determine initial theme - set to dark mode
    let savedTheme = localStorage.getItem(THEME_KEY);
    if (!savedTheme || savedTheme === 'light') {
      savedTheme = 'dark';
      localStorage.setItem(THEME_KEY, 'dark');
    }
    setTheme('dark');

    // Determine initial language
    const savedLang = localStorage.getItem(LANG_KEY);
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      const browserLang = navigator.language || navigator.userLanguage || '';
      setLanguage(browserLang.toLowerCase().startsWith('ko') ? 'ko' : 'en');
    }

    setupEventListeners();
    loadStockData();
    loadFxRates();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
