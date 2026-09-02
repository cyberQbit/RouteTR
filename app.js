// --------------------------------------------------------------------------
// ROUTE TR — PRODUCTION ENGINE (ROBUST MAP & SEARCH LOGIC)
// --------------------------------------------------------------------------

(function () {
  'use strict';

  // Constants & Storage
  const STORAGE_KEY = 'route_tr_travel_log_v1';
  const STORAGE_KEY_GOALS = 'route_tr_goals_v1';
  const TOTAL_PROVINCES = 81;

  // Achievement/Badge System
  const BADGES_CATALOG = {
    // Milestone Badges
    'first_five': { id: 'first_five', name: '🥾 İlk Adım', desc: '5 ili ziyaret et', check: (state) => countVisitedProvinces(state) >= 5, icon: '🥾' },
    'ten_provinces': { id: 'ten_provinces', name: '🎒 On İlde Hıkayeniz', desc: '10 ili ziyaret et', check: (state) => countVisitedProvinces(state) >= 10, icon: '🎒' },
    'thirty_provinces': { id: 'thirty_provinces', name: '🧭 Rota Uzmanı', desc: '30 ili ziyaret et', check: (state) => countVisitedProvinces(state) >= 30, icon: '🧭' },
    'all_provinces': { id: 'all_provinces', name: '🏆 Türkiye Fatihi', desc: 'Tüm 81 ili ziyaret et', check: (state) => countVisitedProvinces(state) === 81, icon: '🏆' },
    
    // Regional Badges
    'marmara_master': { id: 'marmara_master', name: '🌊 Marmara Ustası', desc: 'Marmara bölgesini tamamla', check: (state) => isRegionComplete(state, 'Marmara'), icon: '🌊' },
    'aegean_explorer': { id: 'aegean_explorer', name: '☀️ Ege Kaşifi', desc: 'Ege bölgesini tamamla', check: (state) => isRegionComplete(state, 'Ege'), icon: '☀️' },
    'mediterranean_traveler': { id: 'mediterranean_traveler', name: '🏖️ Akdeniz Seyyahı', desc: 'Akdeniz bölgesini tamamla', check: (state) => isRegionComplete(state, 'Akdeniz'), icon: '🏖️' },
    'anatolian_master': { id: 'anatolian_master', name: '🗻 Anadolu Ustası', desc: 'İç Anadolu bölgesini tamamla', check: (state) => isRegionComplete(state, 'İç Anadolu'), icon: '🗻' },
    'blacksea_wanderer': { id: 'blacksea_wanderer', name: '⛵ Karadeniz Gezgini', desc: 'Karadeniz bölgesini tamamla', check: (state) => isRegionComplete(state, 'Karadeniz'), icon: '⛵' },
    'eastern_pioneer': { id: 'eastern_pioneer', name: '🏔️ Doğu Öncüsü', desc: 'Doğu Anadolu bölgesini tamamla', check: (state) => isRegionComplete(state, 'Doğu Anadolu'), icon: '🏔️' },
    'southeastern_scout': { id: 'southeastern_scout', name: '🔥 Güneydoğu Keşifçi', desc: 'Güneydoğu Anadolu bölgesini tamamla', check: (state) => isRegionComplete(state, 'Güneydoğu Anadolu'), icon: '🔥' },
    
    // District Badges
    'hundred_districts': { id: 'hundred_districts', name: '🏘️ Yüz İlçe', desc: '100 ilçeyi keşfet', check: (state) => countVisitedDistricts(state) >= 100, icon: '🏘️' },
    'thousand_km': { id: 'thousand_km', name: '🛣️ Bin Kilometre', desc: '1000+ km yolculuk', check: (state) => countVisitedDistricts(state) >= 50, icon: '🛣️' }, // Proxy
    
    // Experience Badges
    'lifer': { id: 'lifer', name: '🏡 Yaşayan Gezgin', desc: '5 yerde yaşadığın yeri işaretle', check: (state) => countProvincesByStatus(state, 'lived') >= 5, icon: '🏡' },
    'transit_master': { id: 'transit_master', name: '🚗 Transit Profesi', desc: '15 transit mola noktası işaretle', check: (state) => countProvincesByStatus(state, 'transit') >= 15, icon: '🚗' },
    'poi_collector': { id: 'poi_collector', name: '📍 POI Koleksiyoncusu', desc: '50 POI topla', check: (state) => countTotalPois(state) >= 50, icon: '📍' },
  };

  // Application State
  let travelState = {};
  let userGoals = {};
  let activeProvince = null;
  let currentFilterRegion = 'all';
  let currentFilterStatus = 'all';
  let searchQuery = '';

  // DOM Elements
  const svgMapContainer = document.getElementById('turkey-svg-map');
  const explorerGrid = document.getElementById('provinces-grid');
  const mapTooltip = document.getElementById('map-tooltip');
  
  // Dashboard Stat Elements
  const statOverallScore = document.getElementById('stat-overall-score');
  const statVisitedProvinces = document.getElementById('stat-visited-provinces');
  const statVisitedDistricts = document.getElementById('stat-visited-districts');
  const statVisitedPois = document.getElementById('stat-visited-pois');
  const statTravelerTitle = document.getElementById('stat-traveler-title');

  // Modal Elements
  const modalOverlay = document.getElementById('province-modal');
  const modalPlate = document.getElementById('modal-plate');
  const modalName = document.getElementById('modal-name');
  const modalRegion = document.getElementById('modal-region');
  const modalScoreBadge = document.getElementById('modal-score-badge');
  const modalDistrictsGrid = document.getElementById('modal-districts-grid');
  const modalPoiList = document.getElementById('modal-poi-list');
  const modalNotes = document.getElementById('modal-notes');
  const customPoiInput = document.getElementById('custom-poi-input');
  const addPoiBtn = document.getElementById('btn-add-poi');
  const closeModalBtn = document.getElementById('btn-close-modal');
  const modalSaveBtn = document.getElementById('btn-modal-save');
  const selectAllDistrictsBtn = document.getElementById('btn-select-all-districts');
  const clearDistrictsBtn = document.getElementById('btn-clear-districts');

  // Filter & Search
  const searchInput = document.getElementById('search-province');
  const filterRegionSelect = document.getElementById('filter-region');
  const filterStatusSelect = document.getElementById('filter-status');

  // Actions
  const exportJsonBtn = document.getElementById('btn-export-json');
  const importJsonBtn = document.getElementById('btn-import-json');
  const jsonFileInput = document.getElementById('json-file-input');
  const resetDataBtn = document.getElementById('btn-reset-data');
  const postcardBtn = document.getElementById('btn-generate-postcard');
  const postcardModal = document.getElementById('postcard-modal');
  const closePostcardBtn = document.getElementById('btn-close-postcard');
  const downloadPostcardBtn = document.getElementById('btn-download-postcard');
  const postcardCanvas = document.getElementById('postcard-canvas');

  // ========== BADGE & GOAL HELPERS ==========
  function countVisitedProvinces(state) {
    return Object.values(state).filter(p => p.status && p.status !== 'unvisited').length;
  }

  function countVisitedDistricts(state) {
    return Object.values(state).reduce((sum, p) => sum + (p.visitedDistricts ? p.visitedDistricts.length : 0), 0);
  }

  function countTotalPois(state) {
    return Object.values(state).reduce((sum, p) => sum + (p.visitedPois ? p.visitedPois.length : 0), 0);
  }

  function countProvincesByStatus(state, status) {
    return Object.values(state).filter(p => p.status === status).length;
  }

  function isRegionComplete(state, region) {
    if (typeof PROVINCES_DATA === 'undefined') return false;
    const regionProvinces = PROVINCES_DATA.filter(p => p.region === region);
    if (regionProvinces.length === 0) return false;
    return regionProvinces.every(p => {
      const pData = state[p.plate];
      const score = calculateProvinceScore(p.plate);
      return score >= 50; // At least 50% completion
    });
  }

  function getUnlockedBadges(state) {
    const unlocked = [];
    Object.values(BADGES_CATALOG).forEach(badge => {
      if (badge.check(state)) {
        unlocked.push(badge.id);
      }
    });
    return unlocked;
  }

  function getBadgeProgress(badgeId, state) {
    const badge = BADGES_CATALOG[badgeId];
    if (!badge) return 0;

    if (badgeId === 'first_five') return Math.min(100, (countVisitedProvinces(state) / 5) * 100);
    if (badgeId === 'ten_provinces') return Math.min(100, (countVisitedProvinces(state) / 10) * 100);
    if (badgeId === 'thirty_provinces') return Math.min(100, (countVisitedProvinces(state) / 30) * 100);
    if (badgeId === 'all_provinces') return Math.min(100, (countVisitedProvinces(state) / 81) * 100);
    if (badgeId === 'hundred_districts') return Math.min(100, (countVisitedDistricts(state) / 100) * 100);
    if (badgeId === 'poi_collector') return Math.min(100, (countTotalPois(state) / 50) * 100);
    if (badgeId === 'lifer') return Math.min(100, (countProvincesByStatus(state, 'lived') / 5) * 100);
    if (badgeId === 'transit_master') return Math.min(100, (countProvincesByStatus(state, 'transit') / 15) * 100);

    return 0;
  }

  // ========== SMART SUGGESTIONS ==========
  function getSmartSuggestions(state) {
    if (typeof PROVINCES_DATA === 'undefined') return [];
    
    const visited = new Set();
    const unvisited = [];

    PROVINCES_DATA.forEach(p => {
      if (state[p.plate] && state[p.plate].status !== 'unvisited') {
        visited.add(p.plate);
      } else {
        unvisited.push(p);
      }
    });

    // Priority: unvisited provinces adjacent to or in same region as visited ones
    const suggestions = [];
    const suggestedPlates = new Set();

    PROVINCES_DATA.filter(p => visited.has(p.plate)).forEach(visitedProvince => {
      unvisited.forEach(unvisitedProvince => {
        if (!suggestedPlates.has(unvisitedProvince.plate) && 
            (unvisitedProvince.region === visitedProvince.region || 
             isAdjacentRegion(visitedProvince.region, unvisitedProvince.region))) {
          suggestions.push({
            province: unvisitedProvince,
            reason: `${visitedProvince.name}'nin yanında`,
          });
          suggestedPlates.add(unvisitedProvince.plate);
        }
      });
    });

    return suggestions.slice(0, 3);
  }

  function isAdjacentRegion(region1, region2) {
    const adjacency = {
      'Marmara': ['Ege', 'İç Anadolu'],
      'Ege': ['Marmara', 'Akdeniz', 'İç Anadolu'],
      'Akdeniz': ['Ege', 'İç Anadolu', 'Doğu Anadolu'],
      'İç Anadolu': ['Marmara', 'Ege', 'Akdeniz', 'Karadeniz', 'Doğu Anadolu'],
      'Karadeniz': ['İç Anadolu', 'Doğu Anadolu'],
      'Doğu Anadolu': ['İç Anadolu', 'Karadeniz', 'Güneydoğu Anadolu'],
      'Güneydoğu Anadolu': ['Akdeniz', 'Doğu Anadolu'],
    };
    return (adjacency[region1] || []).includes(region2);
  }

  // Turkish-aware normalization for robust search
  function normalizeText(text) {
    if (!text) return '';
    return text
      .toString()
      .trim()
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 's')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'o')
      .toLowerCase();
  }

  // ========== DYNAMIC OG META TAG UPDATES ==========
  function updateOGMetaTags() {
    const avgScore = (Object.values(travelState).reduce((sum, p) => sum + calculateProvinceScore(PROVINCES_DATA.find(prov => PROVINCES_DATA.indexOf(prov) === Object.keys(travelState).indexOf(Object.keys(travelState).find(plate => travelState[plate] === p)))), 0) / TOTAL_PROVINCES).toFixed(1);
    
    // Simplified: just update title for now
    const traveler = getTravelerTitle(parseFloat(avgScore));
    const visited = Object.values(travelState).filter(p => p.status && p.status !== 'unvisited').length;
    
    // Update page title dynamically
    const ogTitle = `${traveler.title} • Route TR — %${avgScore} Keşif`;
    document.title = ogTitle;
    
    // Update OG description meta tag
    const ogDesc = `${visited}/81 il, ${Object.values(travelState).reduce((sum, p) => sum + (p.visitedDistricts ? p.visitedDistricts.length : 0), 0)} ilçe, ${Object.values(travelState).reduce((sum, p) => sum + (p.visitedPois ? p.visitedPois.length : 0), 0)} POI. Route TR ile Türkiye'yi keşfet.`;
    
    let ogDescMeta = document.querySelector('meta[property="og:description"]');
    if (!ogDescMeta) {
      ogDescMeta = document.createElement('meta');
      ogDescMeta.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescMeta);
    }
    ogDescMeta.setAttribute('content', ogDesc);
  }

  // Application Lifecycle
  async function init() {
    loadState();
    // 1. Immediately render built-in map so it never appears blank
    renderBuiltinSvgMap();
    // 2. Render cards and stats
    renderExplorerGrid();
    updateDashboard();
    updateMapFills();
    updateOGMetaTags();
    attachEventListeners();
    // 3. Try to load external SVG file if provided in repo
    await tryLoadExternalSvgMap();
  }

  // State Persistence
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        travelState = JSON.parse(raw);
      }
    } catch (e) {
      travelState = {};
    }

    try {
      const rawGoals = localStorage.getItem(STORAGE_KEY_GOALS);
      if (rawGoals) {
        userGoals = JSON.parse(rawGoals);
      }
    } catch (e) {
      userGoals = {};
    }

    if (typeof PROVINCES_DATA !== 'undefined') {
      PROVINCES_DATA.forEach(p => {
        if (!travelState[p.plate]) {
          travelState[p.plate] = {
            status: 'unvisited',
            visitedDistricts: [],
            visitedPois: [],
            customPois: [],
            notes: ''
          };
        }
      });
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(travelState));
      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(userGoals));
      updateOGMetaTags();
    } catch (e) {}
  }

  // Score Calculation
  function calculateProvinceScore(plate) {
    const data = travelState[plate];
    const pMeta = PROVINCES_DATA.find(p => p.plate === plate);
    if (!data || !pMeta || data.status === 'unvisited') return 0;

    const totalDistricts = pMeta.districts.length || 1;
    const visitedDistrictsCount = (data.visitedDistricts || []).length;
    const districtRatio = Math.min(1, visitedDistrictsCount / totalDistricts);

    const allPois = [...pMeta.pois, ...(data.customPois || [])];
    const totalPois = allPois.length || 1;
    const visitedPoisCount = (data.visitedPois || []).length;
    const poiRatio = Math.min(1, visitedPoisCount / totalPois);

    if (data.status === 'transit') {
      return Math.min(30, Math.round(15 + districtRatio * 10 + poiRatio * 5));
    }

    if (data.status === 'lived') {
      return Math.min(100, Math.round(70 + districtRatio * 15 + poiRatio * 15));
    }

    return Math.min(100, Math.round(30 + districtRatio * 40 + poiRatio * 30));
  }

  function getHeatmapColor(status, percentage) {
    if (status === 'unvisited' || percentage === 0) return '#182032';
    if (status === 'transit') return '#f59e0b';
    if (status === 'lived') return '#2563eb';
    
    if (percentage <= 35) return '#fb923c';
    if (percentage <= 70) return '#ea580c';
    if (percentage < 100) return '#dc2626';
    return '#9333ea';
  }

  function getTravelerTitle(avgPercentage) {
    if (avgPercentage === 0) return { title: 'Ev Kuşu 🪹', color: '#9ca3af' };
    if (avgPercentage < 10) return { title: 'Çaylak Gezgin 🎒', color: '#fb923c' };
    if (avgPercentage < 25) return { title: 'Yol Meraklısı 🧭', color: '#f59e0b' };
    if (avgPercentage < 50) return { title: 'Karayolu Kaşifi 🚙', color: '#ea580c' };
    if (avgPercentage < 75) return { title: 'Anadolu Seyyahı 🦅', color: '#dc2626' };
    if (avgPercentage < 95) return { title: 'Usta Rota Kaptanı 👑', color: '#8b5cf6' };
    return { title: 'Türkiye Fatihi 🏆', color: '#ec4899' };
  }

  function checkProvinceMatch(p) {
    const pData = travelState[p.plate];
    const normQuery = normalizeText(searchQuery);

    let matchesSearch = true;
    if (normQuery) {
      const matchName = normalizeText(p.name).includes(normQuery);
      const matchPlate = p.plate.includes(normQuery);
      const matchDistrict = (p.districts || []).some(d => normalizeText(d).includes(normQuery));
      const matchPoi = (p.pois || []).some(poi => normalizeText(poi).includes(normQuery));
      const matchCustom = (pData.customPois || []).some(c => normalizeText(c).includes(normQuery));
      matchesSearch = matchName || matchPlate || matchDistrict || matchPoi || matchCustom;
    }

    const matchesRegion = currentFilterRegion === 'all' || p.region === currentFilterRegion;
    
    let matchesStatus = true;
    if (currentFilterStatus === 'visited') matchesStatus = pData.status === 'visited';
    else if (currentFilterStatus === 'transit') matchesStatus = pData.status === 'transit';
    else if (currentFilterStatus === 'lived') matchesStatus = pData.status === 'lived';
    else if (currentFilterStatus === 'unvisited') matchesStatus = pData.status === 'unvisited';

    return matchesSearch && matchesRegion && matchesStatus;
  }

  // 1. Render Built-In SVG Map (Ensures map is NEVER blank)
  function renderBuiltinSvgMap() {
    if (!svgMapContainer || typeof PROVINCES_DATA === 'undefined') return;

    svgMapContainer.innerHTML = '';
    svgMapContainer.setAttribute('viewBox', '0 0 1007 437');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <pattern id="transit-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" stroke-width="2.5" />
      </pattern>
    `;
    svgMapContainer.appendChild(defs);

    // Layer 1: Districts
    const districtsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    districtsGroup.setAttribute('id', 'districts-layer');

    PROVINCES_DATA.forEach(p => {
      const dPaths = p.district_paths || [{ name: p.name, d: p.svg_d }];

      dPaths.forEach((dItem, idx) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('id', `dist-${p.plate}-${idx}`);
        path.setAttribute('class', 'district-path interactive-province');
        path.setAttribute('data-plate', p.plate);
        path.setAttribute('data-province', p.name);
        path.setAttribute('data-district', dItem.name);
        path.setAttribute('d', dItem.d);

        path.addEventListener('mouseenter', (e) => showTooltip(e, p.plate, dItem.name));
        path.addEventListener('mousemove', moveTooltip);
        path.addEventListener('mouseleave', hideTooltip);
        path.addEventListener('click', () => openProvinceModal(p.plate));

        districtsGroup.appendChild(path);
      });
    });
    svgMapContainer.appendChild(districtsGroup);

    // Layer 2: Province Borders
    const provincesBorderGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    provincesBorderGroup.setAttribute('id', 'provinces-border-layer');

    PROVINCES_DATA.forEach(p => {
      const pBorder = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pBorder.setAttribute('id', `pborder-${p.plate}`);
      pBorder.setAttribute('class', 'province-thick-border');
      pBorder.setAttribute('d', p.svg_d);
      pBorder.setAttribute('fill', 'none');
      provincesBorderGroup.appendChild(pBorder);
    });
    svgMapContainer.appendChild(provincesBorderGroup);

    // Layer 3: Country Outer Border
    if (typeof COUNTRY_BORDER_SVG_D !== 'undefined' && COUNTRY_BORDER_SVG_D) {
      const countryBorder = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      countryBorder.setAttribute('id', 'country-outer-border');
      countryBorder.setAttribute('class', 'country-thick-border');
      countryBorder.setAttribute('d', COUNTRY_BORDER_SVG_D);
      countryBorder.setAttribute('fill', 'none');
      svgMapContainer.appendChild(countryBorder);
    }

    // Layer 4: Province Labels
    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelsGroup.setAttribute('id', 'labels-layer');

    PROVINCES_DATA.forEach(p => {
      if (p.center) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', p.center[0]);
        text.setAttribute('y', p.center[1]);
        text.setAttribute('class', 'province-label');
        text.textContent = p.name;
        labelsGroup.appendChild(text);
      }
    });
    svgMapContainer.appendChild(labelsGroup);
  }

  // 2. Try to Load External SVG file if available (e.g. TR-adm2-with-city-borders.svg)
  async function tryLoadExternalSvgMap() {
    const candidateFiles = [
      'TR-adm2-with-city-borders.svg',
      'TR-adm1.svg',
      'turkey.svg'
    ];

    let loadedSvgText = null;
    for (const filename of candidateFiles) {
      try {
        const resp = await fetch(filename);
        if (resp.ok) {
          loadedSvgText = await resp.text();
          break;
        }
      } catch (e) {}
    }

    if (loadedSvgText) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(loadedSvgText, 'image/svg+xml');
      const svgRoot = doc.querySelector('svg');
      if (svgRoot) {
        svgMapContainer.setAttribute('viewBox', svgRoot.getAttribute('viewBox') || '0 0 1007 437');
        svgMapContainer.innerHTML = svgRoot.innerHTML;
        setupSvgMapEvents();
        updateMapFills();
      }
    }
  }

  // Setup Map Elements
  function setupSvgMapEvents() {
    PROVINCES_DATA.forEach(p => {
      const normName = normalizeText(p.name);
      const elements = svgMapContainer.querySelectorAll(`
        #path-${p.plate}, 
        #tr-${p.plate}, 
        #TR-${p.plate}, 
        #tr${p.plate}, 
        #TR${p.plate}, 
        #${normName}, 
        [data-plate="${p.plate}"], 
        [data-plakakodu="${p.plate}"], 
        [data-iladi="${p.name}" i], 
        [data-name="${p.name}" i]
      `);

      elements.forEach(el => {
        el.setAttribute('data-plate', p.plate);
        el.setAttribute('data-name', p.name);
        el.classList.add('interactive-province');

        el.addEventListener('mouseenter', (e) => showTooltip(e, p.plate));
        el.addEventListener('mousemove', moveTooltip);
        el.addEventListener('mouseleave', hideTooltip);
        el.addEventListener('click', () => openProvinceModal(p.plate));
      });
    });
  }

  // Update Map Fills & Filter Focus
  function updateMapFills() {
    PROVINCES_DATA.forEach(p => {
      const pData = travelState[p.plate];
      const pScore = calculateProvinceScore(p.plate);
      const pColor = getHeatmapColor(pData.status, pScore);
      const isMatched = checkProvinceMatch(p);

      const dPaths = p.district_paths || [{ name: p.name, d: p.svg_d }];

      dPaths.forEach((dItem, idx) => {
        const path = document.getElementById(`dist-${p.plate}-${idx}`);
        if (!path) return;

        if (searchQuery && !isMatched) {
          path.style.opacity = '0.2';
        } else {
          path.style.opacity = '1';
        }

        const isDistrictVisited = (pData.visitedDistricts || []).includes(dItem.name);

        if (pData.status === 'transit') {
          path.setAttribute('fill', 'url(#transit-hatch)');
        } else if (pData.status === 'lived') {
          path.setAttribute('fill', isDistrictVisited ? '#3b82f6' : '#1e3a8a');
        } else if (isDistrictVisited) {
          path.setAttribute('fill', pColor);
        } else if (pData.status === 'visited') {
          path.setAttribute('fill', '#26334d');
        } else {
          path.setAttribute('fill', '#182032');
        }
      });

      const pBorder = document.getElementById(`pborder-${p.plate}`);
      if (pBorder) {
        if (searchQuery && isMatched) {
          pBorder.style.stroke = '#f97316';
          pBorder.style.strokeWidth = '3px';
        } else {
          pBorder.style.stroke = '#4b5563';
          pBorder.style.strokeWidth = '2.2px';
        }
      }
    });
  }

  function showTooltip(e, plate, districtName) {
    const pMeta = PROVINCES_DATA.find(p => p.plate === plate);
    if (!pMeta) return;
    const pData = travelState[plate];
    const score = calculateProvinceScore(plate);

    let statusText = 'Gitmedim';
    if (pData.status === 'transit') statusText = '🚗 Transit / Mola';
    else if (pData.status === 'visited') statusText = '🎒 Gezdim';
    else if (pData.status === 'lived') statusText = '🏡 Yaşadım';

    const isDistVisited = districtName && (pData.visitedDistricts || []).includes(districtName);

    mapTooltip.innerHTML = `
      <div style="font-weight:700; font-size:0.92rem; margin-bottom:2px;">
        <span style="color:var(--accent-amber);">${pMeta.plate}</span> ${pMeta.name}
        ${districtName ? `<span style="color:#9ca3af; font-weight:normal;">› ${districtName}</span>` : ''}
      </div>
      <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px;">
        ${pMeta.region} • ${statusText} ${isDistVisited ? '<span style="color:#10b981; font-weight:bold;">(İlçe Gezildi ✓)</span>' : ''}
      </div>
      <div style="font-size:0.75rem;">
        Keşif Skoru: <strong style="color:var(--accent-orange);">${score}%</strong>
      </div>
      <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">
        ${(pData.visitedDistricts || []).length}/${pMeta.districts.length} İlçe • ${(pData.visitedPois || []).length} POI
      </div>
    `;
    mapTooltip.style.display = 'block';
    moveTooltip(e);
  }

  function moveTooltip(e) {
    if (!svgMapContainer) return;
    const mapRect = svgMapContainer.getBoundingClientRect();
    const x = e.clientX - mapRect.left;
    const y = e.clientY - mapRect.top;
    mapTooltip.style.left = `${x}px`;
    mapTooltip.style.top = `${y}px`;
  }

  function hideTooltip() {
    if (mapTooltip) mapTooltip.style.display = 'none';
  }

  // Render Explorer Directory Cards
  function renderExplorerGrid() {
    if (!explorerGrid || typeof PROVINCES_DATA === 'undefined') return;
    explorerGrid.innerHTML = '';

    const filtered = PROVINCES_DATA.filter(checkProvinceMatch);

    if (filtered.length === 0) {
      explorerGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:2rem; color:var(--text-muted);">Aramanızla eşleşen şehir veya ilçe bulunamadı.</div>';
      return;
    }

    filtered.forEach(p => {
      const pData = travelState[p.plate];
      const score = calculateProvinceScore(p.plate);

      let statusBadge = '<span class="progress-pill">0%</span>';
      if (pData.status === 'lived') {
        statusBadge = `<span class="progress-pill" style="background:rgba(37,99,235,0.25); color:#60a5fa;">Yaşadım (${score}%)</span>`;
      } else if (pData.status === 'transit') {
        statusBadge = `<span class="progress-pill" style="background:rgba(245,158,11,0.25); color:#fbbf24;">Transit (${score}%)</span>`;
      } else if (score > 0) {
        statusBadge = `<span class="progress-pill" style="background:rgba(249,115,22,0.25); color:#fed7aa;">${score}%</span>`;
      }

      const card = document.createElement('div');
      card.className = 'province-card';
      card.innerHTML = `
        <div class="province-card-left">
          <span class="plate-badge">${p.plate}</span>
          <div>
            <div class="province-card-title">${p.name}</div>
            <div class="province-card-region">${p.region} • ${(pData.visitedDistricts || []).length}/${p.districts.length} İlçe</div>
          </div>
        </div>
        <div>
          ${statusBadge}
        </div>
      `;
      card.addEventListener('click', () => openProvinceModal(p.plate));
      explorerGrid.appendChild(card);
    });
  }

  // Update Top Stats Dashboard
  // ========== RENDER BADGES & SUGGESTIONS ==========
  function renderBadges() {
    const badgesGrid = document.getElementById('badges-grid');
    if (!badgesGrid) return;
    
    badgesGrid.innerHTML = '';
    const unlockedBadges = getUnlockedBadges(travelState);

    Object.values(BADGES_CATALOG).forEach(badge => {
      const isUnlocked = unlockedBadges.includes(badge.id);
      const progress = getBadgeProgress(badge.id, travelState);

      const card = document.createElement('div');
      card.className = `badge-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.title = badge.desc;

      card.innerHTML = `
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-name">${badge.name}</div>
        <div class="badge-desc">${badge.desc}</div>
        <div class="badge-progress">
          <div class="badge-progress-bar" style="width: ${Math.min(100, progress)}%"></div>
        </div>
        <div class="badge-status">${isUnlocked ? '✓ Açıldı' : `${Math.round(progress)}%`}</div>
      `;

      badgesGrid.appendChild(card);
    });
  }

  function renderSuggestions() {
    const suggestionsGrid = document.getElementById('suggestions-grid');
    if (!suggestionsGrid) return;

    suggestionsGrid.innerHTML = '';
    const suggestions = getSmartSuggestions(travelState);

    if (suggestions.length === 0) {
      suggestionsGrid.innerHTML = '<div class="suggestion-empty">🎉 Tüm yakınlardaki ilçeler zaten işaretlenmiş! Yeni bölgeler keşfetmeyi deneyin.</div>';
      return;
    }

    suggestions.forEach(sug => {
      const card = document.createElement('div');
      card.className = 'suggestion-card';
      card.style.cursor = 'pointer';
      card.onclick = () => openProvinceModal(sug.province.plate);

      card.innerHTML = `
        <div class="suggestion-province-name">${sug.province.name}</div>
        <div class="suggestion-plate">Plaka: ${sug.province.plate}</div>
        <div class="suggestion-region">📍 ${sug.province.region}</div>
        <div class="suggestion-reason">${sug.reason}</div>
      `;

      suggestionsGrid.appendChild(card);
    });
  }

  function updateDashboard() {
    if (typeof PROVINCES_DATA === 'undefined') return;
    let totalScoreSum = 0;
    let visitedCount = 0;
    let transitCount = 0;
    let livedCount = 0;
    let totalVisitedDistrictsCount = 0;
    let totalVisitedPoisCount = 0;

    PROVINCES_DATA.forEach(p => {
      const pData = travelState[p.plate];
      const score = calculateProvinceScore(p.plate);
      totalScoreSum += score;

      if (pData.status === 'visited') visitedCount++;
      else if (pData.status === 'transit') transitCount++;
      else if (pData.status === 'lived') livedCount++;

      totalVisitedDistrictsCount += (pData.visitedDistricts || []).length;
      totalVisitedPoisCount += (pData.visitedPois || []).length;
    });

    const averageScore = (totalScoreSum / TOTAL_PROVINCES).toFixed(1);
    const activeProvincesCount = visitedCount + livedCount + transitCount;

    if (statOverallScore) statOverallScore.textContent = `%${averageScore}`;
    if (statVisitedProvinces) statVisitedProvinces.textContent = `${activeProvincesCount} / 81`;
    if (statVisitedDistricts) statVisitedDistricts.textContent = `${totalVisitedDistrictsCount} İlçe`;
    if (statVisitedPois) statVisitedPois.textContent = `${totalVisitedPoisCount} Nokta`;

    const titleObj = getTravelerTitle(parseFloat(averageScore));
    if (statTravelerTitle) {
      statTravelerTitle.textContent = titleObj.title;
      statTravelerTitle.style.color = titleObj.color;
    }

    // Update badges and suggestions
    renderBadges();
    renderSuggestions();
  }

  // Modal Open & Edit
  function openProvinceModal(plate) {
    activeProvince = PROVINCES_DATA.find(p => p.plate === plate);
    if (!activeProvince) return;

    const pData = travelState[plate];

    modalPlate.textContent = activeProvince.plate;
    modalName.textContent = activeProvince.name;
    modalRegion.textContent = activeProvince.region;
    modalNotes.value = pData.notes || '';

    const radioInputs = document.querySelectorAll('input[name="visit-status"]');
    radioInputs.forEach(r => {
      r.checked = r.value === pData.status;
      const label = r.closest('.status-label');
      if (label) label.classList.toggle('selected', r.checked);
    });

    renderModalDistricts();
    renderModalPois();
    updateModalHeaderScore();

    modalOverlay.classList.add('active');
  }

  function closeProvinceModal() {
    if (activeProvince) {
      travelState[activeProvince.plate].notes = modalNotes.value.trim();
      saveState();
      updateMapFills();
      renderExplorerGrid();
      updateDashboard();
    }
    modalOverlay.classList.remove('active');
    activeProvince = null;
  }

  function renderModalDistricts() {
    if (!activeProvince) return;
    const pData = travelState[activeProvince.plate];
    modalDistrictsGrid.innerHTML = '';

    activeProvince.districts.forEach(d => {
      const isSelected = (pData.visitedDistricts || []).includes(d);
      const pill = document.createElement('div');
      pill.className = `district-pill ${isSelected ? 'active' : ''}`;
      pill.textContent = (isSelected ? '✓ ' : '') + d;

      pill.addEventListener('click', () => {
        if (!pData.visitedDistricts) pData.visitedDistricts = [];
        if (pData.visitedDistricts.includes(d)) {
          pData.visitedDistricts = pData.visitedDistricts.filter(item => item !== d);
        } else {
          pData.visitedDistricts.push(d);
          if (pData.status === 'unvisited') setModalStatus('visited');
        }
        renderModalDistricts();
        updateModalHeaderScore();
      });

      modalDistrictsGrid.appendChild(pill);
    });
  }

  function renderModalPois() {
    if (!activeProvince) return;
    const pData = travelState[activeProvince.plate];
    modalPoiList.innerHTML = '';

    const allPois = [...activeProvince.pois, ...(pData.customPois || [])];

    allPois.forEach(poi => {
      const isChecked = (pData.visitedPois || []).includes(poi);
      const isCustom = (pData.customPois || []).includes(poi);

      const item = document.createElement('label');
      item.className = `poi-item ${isChecked ? 'checked' : ''}`;
      item.innerHTML = `
        <input type="checkbox" ${isChecked ? 'checked' : ''} />
        <span style="flex:1;">${poi} ${isCustom ? '<small style="color:var(--accent-amber);">(Özel)</small>' : ''}</span>
      `;

      const checkbox = item.querySelector('input');
      checkbox.addEventListener('change', () => {
        if (!pData.visitedPois) pData.visitedPois = [];
        if (checkbox.checked) {
          if (!pData.visitedPois.includes(poi)) pData.visitedPois.push(poi);
          if (pData.status === 'unvisited') setModalStatus('visited');
        } else {
          pData.visitedPois = pData.visitedPois.filter(item => item !== poi);
        }
        item.classList.toggle('checked', checkbox.checked);
        updateModalHeaderScore();
      });

      modalPoiList.appendChild(item);
    });
  }

  function updateModalHeaderScore() {
    if (!activeProvince) return;
    const score = calculateProvinceScore(activeProvince.plate);
    modalScoreBadge.textContent = `%${score}`;
  }

  function setModalStatus(newStatus) {
    if (!activeProvince) return;
    travelState[activeProvince.plate].status = newStatus;
    const radioInputs = document.querySelectorAll('input[name="visit-status"]');
    radioInputs.forEach(r => {
      r.checked = r.value === newStatus;
      const label = r.closest('.status-label');
      if (label) label.classList.toggle('selected', r.checked);
    });
    updateModalHeaderScore();
  }

  // Postcard Generator (HTML5 Canvas)
  function generateEnhancedPostcard() {
    const width = 1200;
    const height = 800;
    const ctx = postcardCanvas.getContext('2d');
    postcardCanvas.width = width;
    postcardCanvas.height = height;

    // Background
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, width, height);

    // Subtle texture
    const imageData = ctx.createImageData(1, 1);
    imageData.data[3] = 10;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#2e3a52';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('ROUTE TR', 50, 75);

    ctx.fillStyle = '#f9fafb';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('TÜRKİYE SEYAHAT VE KEŞİF GÜNLÜĞÜ', 230, 72);

    let totalScoreSum = 0;
    let visitedCount = 0;
    let totalDistrictsCount = 0;
    let totalPoisCount = 0;

    PROVINCES_DATA.forEach(p => {
      const pData = travelState[p.plate];
      totalScoreSum += calculateProvinceScore(p.plate);
      if (pData.status !== 'unvisited') visitedCount++;
      totalDistrictsCount += (pData.visitedDistricts || []).length;
      totalPoisCount += (pData.visitedPois || []).length;
    });

    const avgScore = (totalScoreSum / TOTAL_PROVINCES).toFixed(1);
    const traveler = getTravelerTitle(parseFloat(avgScore));

    // Score Badge
    ctx.fillStyle = '#1a2236';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(width - 320, 40, 270, 70, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('KEŞİF SKORU', width - 300, 65);

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`%${avgScore}`, width - 300, 98);

    ctx.fillStyle = traveler.color;
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(traveler.title, width - 210, 85);

    // Render SVG map
    const svgEl = document.getElementById('turkey-svg-map');
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = function () {
      ctx.drawImage(img, 80, 130, 1040, 440);
      URL.revokeObjectURL(url);

      // Stats footer
      ctx.fillStyle = '#111827';
      ctx.fillRect(40, height - 130, width - 80, 95);

      ctx.fillStyle = '#f9fafb';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`📍 Ziyaret Edilen: ${visitedCount} / 81 İl`, 60, height - 100);
      ctx.fillText(`🏙️ Keşfedilen: ${totalDistrictsCount} İlçe`, 350, height - 100);
      ctx.fillText(`⭐ POI: ${totalPoisCount} Nokta`, 640, height - 100);

      // Badges
      const unlockedBadges = getUnlockedBadges(travelState);
      let badgeX = 60;
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Rozetler:', 60, height - 50);
      badgeX = 180;
      unlockedBadges.slice(0, 5).forEach(badgeId => {
        const badge = BADGES_CATALOG[badgeId];
        if (badge) {
          ctx.fillText(badge.icon, badgeX, height - 50);
          badgeX += 35;
        }
      });
      if (unlockedBadges.length > 5) {
        ctx.fillText(`+${unlockedBadges.length - 5}`, badgeX, height - 50);
      }

      const today = new Date().toLocaleDateString('tr-TR');
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Oluşturuldu: ${today} • Route TR (cyberQbit)`, width - 340, height - 18);

      postcardModal.classList.add('active');
    };
    img.src = url;
  }

  function generatePostcard() {
    const ctx = postcardCanvas.getContext('2d');
    const width = 1200;
    const height = 675;
    postcardCanvas.width = width;
    postcardCanvas.height = height;

    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0b0f19');
    bgGradient.addColorStop(1, '#070b13');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#2e3a52';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('ROUTE TR', 50, 75);

    ctx.fillStyle = '#f9fafb';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('TÜRKİYE SEYAHAT VE KEŞİF GÜNLÜĞÜ', 230, 72);

    let totalScoreSum = 0;
    let visitedCount = 0;
    let totalDistrictsCount = 0;
    let totalPoisCount = 0;

    PROVINCES_DATA.forEach(p => {
      const pData = travelState[p.plate];
      totalScoreSum += calculateProvinceScore(p.plate);
      if (pData.status !== 'unvisited') visitedCount++;
      totalDistrictsCount += (pData.visitedDistricts || []).length;
      totalPoisCount += (pData.visitedPois || []).length;
    });

    const avgScore = (totalScoreSum / TOTAL_PROVINCES).toFixed(1);
    const traveler = getTravelerTitle(parseFloat(avgScore));

    ctx.fillStyle = '#1a2236';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(width - 320, 40, 270, 70, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('KEŞİF SKORU', width - 300, 65);

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`%${avgScore}`, width - 300, 98);

    ctx.fillStyle = traveler.color;
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(traveler.title, width - 210, 85);

    const svgEl = document.getElementById('turkey-svg-map');
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = function () {
      ctx.drawImage(img, 80, 130, 1040, 440);
      URL.revokeObjectURL(url);

      ctx.fillStyle = '#111827';
      ctx.fillRect(40, height - 70, width - 80, 45);

      ctx.fillStyle = '#f9fafb';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`📍 Ziyaret Edilen: ${visitedCount} / 81 İl`, 60, height - 42);
      ctx.fillText(`🏙️ Keşfedilen: ${totalDistrictsCount} İlçe`, 350, height - 42);
      ctx.fillText(`⭐ Özel Lokasyon / POI: ${totalPoisCount} Nokta`, 640, height - 42);
      
      const today = new Date().toLocaleDateString('tr-TR');
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Oluşturuldu: ${today} • Route TR (cyberQbit)`, width - 340, height - 42);

      postcardModal.classList.add('active');
    };
    img.src = url;
  }

  // Attach Event Listeners
  function attachEventListeners() {
    document.querySelectorAll('input[name="visit-status"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (!activeProvince) return;
        setModalStatus(e.target.value);
      });
    });

    selectAllDistrictsBtn.addEventListener('click', () => {
      if (!activeProvince) return;
      travelState[activeProvince.plate].visitedDistricts = [...activeProvince.districts];
      if (travelState[activeProvince.plate].status === 'unvisited') setModalStatus('visited');
      renderModalDistricts();
      updateModalHeaderScore();
    });

    clearDistrictsBtn.addEventListener('click', () => {
      if (!activeProvince) return;
      travelState[activeProvince.plate].visitedDistricts = [];
      renderModalDistricts();
      updateModalHeaderScore();
    });

    addPoiBtn.addEventListener('click', () => {
      if (!activeProvince) return;
      const val = customPoiInput.value.trim();
      if (!val) return;
      if (!travelState[activeProvince.plate].customPois) travelState[activeProvince.plate].customPois = [];
      travelState[activeProvince.plate].customPois.push(val);
      if (!travelState[activeProvince.plate].visitedPois) travelState[activeProvince.plate].visitedPois = [];
      travelState[activeProvince.plate].visitedPois.push(val);
      customPoiInput.value = '';
      if (travelState[activeProvince.plate].status === 'unvisited') setModalStatus('visited');
      renderModalPois();
      updateModalHeaderScore();
    });

    closeModalBtn.addEventListener('click', closeProvinceModal);
    modalSaveBtn.addEventListener('click', closeProvinceModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeProvinceModal();
    });

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderExplorerGrid();
      updateMapFills();
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const firstMatch = PROVINCES_DATA.find(checkProvinceMatch);
        if (firstMatch) {
          openProvinceModal(firstMatch.plate);
        }
      }
    });

    filterRegionSelect.addEventListener('change', (e) => {
      currentFilterRegion = e.target.value;
      renderExplorerGrid();
      updateMapFills();
    });

    filterStatusSelect.addEventListener('change', (e) => {
      currentFilterStatus = e.target.value;
      renderExplorerGrid();
      updateMapFills();
    });

    exportJsonBtn.addEventListener('click', () => {
      const jsonStr = JSON.stringify(travelState, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `route-tr-travel-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    importJsonBtn.addEventListener('click', () => jsonFileInput.click());
    jsonFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          travelState = parsed;
          saveState();
          updateMapFills();
          renderExplorerGrid();
          updateDashboard();
          alert('Seyahat verileriniz başarıyla yüklendi!');
        } catch (err) {
          alert('Geçersiz JSON dosyası formatı!');
        }
      };
      reader.readAsText(file);
    });

    resetDataBtn.addEventListener('click', () => {
      if (confirm('Tüm işaretlemeleriniz ve seyahat geçmişiniz sıfırlanacak. Emin misiniz?')) {
        localStorage.removeItem(STORAGE_KEY);
        loadState();
        updateMapFills();
        renderExplorerGrid();
        updateDashboard();
      }
    });

    postcardBtn.addEventListener('click', generateEnhancedPostcard);
    closePostcardBtn.addEventListener('click', () => postcardModal.classList.remove('active'));
    postcardModal.addEventListener('click', (e) => {
      if (e.target === postcardModal) postcardModal.classList.remove('active');
    });

    downloadPostcardBtn.addEventListener('click', () => {
      const dataUrl = postcardCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Route-TR-Seyahat-Karti-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProvinceModal();
        postcardModal.classList.remove('active');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
