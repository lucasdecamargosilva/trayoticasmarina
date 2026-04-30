(function () {
    // ─── LOG HELPER ───────────────────────────────────────────────────────────────
    const LOG = {
        info: () => { },
        ok: () => { },
        warn: () => { },
        error: () => { },
        group: () => { },
        end: () => { },
    };

    // ===============================================
    // 0. CONFIG — Centro Optico Marina (Tray store 1269258)
    // ===============================================
    const apiKey = 'pl_live_2e8a1216deb73095ebfc5be077e83801a0c95ecaa0f00258d352857fe610f03a';
    window.PROVOU_LEVOU_API_KEY = apiKey;

    let BUTTON_MODE = 'both';
    const STORE_ID = '1269258';
    const API_HOST = 'https://lojista.provoulevou.com.br';

    const WEBHOOK_PROVA = 'https://n8n.segredosdodrop.com/webhook/quantic-materialize';
    const LOGO_URL = 'https://provoulevou.com.br/assets/provoulevou-logo.png';

    LOG.info('Script carregado — Provador Virtual Provou Levou (Tray)');

    // ─── DESIGN FETCH (API) ─────────────────────────────────────────────────────
    var _fetchedDesign = null;
    var CACHE_KEY = 'pl_design_' + STORE_ID;
    var CACHE_TTL = 5 * 60 * 1000;

    function getCachedDesign() {
        try {
            var cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                var parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < CACHE_TTL) return parsed.data;
            }
        } catch (e) {}
        return null;
    }

    function cacheDesign(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: data, timestamp: Date.now() }));
        } catch (e) {}
    }

    function loadGoogleFont(family) {
        if (!family || family === 'Inter') return;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=' + family.replace(/ /g, '+') + ':wght@400;500;600;700;800&display=swap';
        document.head.appendChild(link);
    }

    function applyDesignToElement(el, design, isPhotoButton) {
        if (!el || !design) return;
        // Use setProperty with 'important' to override base !important CSS
        if (design.backgroundColor) el.style.setProperty('background-color', design.backgroundColor, 'important');
        if (design.textColor) el.style.setProperty('color', design.textColor, 'important');
        var bw = design.borderWidth !== undefined ? design.borderWidth : 1;
        el.style.setProperty('border', bw + 'px solid ' + (design.borderColor || '#000000'), 'important');
        if (design.borderRadius !== undefined) el.style.setProperty('border-radius', design.borderRadius + 'px', 'important');
        if (design.fontFamily) el.style.setProperty('font-family', design.fontFamily + ', sans-serif', 'important');
        if (design.fontSize) el.style.setProperty('font-size', design.fontSize + 'px', 'important');
        if (design.fontWeight) el.style.setProperty('font-weight', design.fontWeight, 'important');
        if (design.textTransform) el.style.setProperty('text-transform', design.textTransform, 'important');
        if (design.letterSpacing !== undefined) el.style.setProperty('letter-spacing', design.letterSpacing + 'px', 'important');
        if (design.height !== undefined) {
            el.style.setProperty('height', design.height + 'px', 'important');
            // Photo button is square — width matches height
            if (isPhotoButton) el.style.setProperty('width', design.height + 'px', 'important');
        }
        if (design.shadow) {
            el.style.setProperty('box-shadow', '0 4px 12px rgba(0,0,0,' + (design.shadowIntensity || 0.15) + ')', 'important');
        } else {
            el.style.setProperty('box-shadow', 'none', 'important');
        }
        // Remove drop-shadow filter from photo button when custom design is applied
        if (isPhotoButton) el.style.setProperty('filter', 'none', 'important');
        if (design.gradient) {
            el.style.setProperty('background', 'linear-gradient(' + design.gradient.direction + ', ' + design.gradient.colors[0] + ', ' + design.gradient.colors[1] + ')', 'important');
        }
        // Continuous animation effects (not hover-based)
        var anim = design.hoverAnimation || 'none';
        el.classList.remove('mc-anim-shake', 'mc-anim-scale', 'mc-anim-glow', 'mc-anim-slide');
        el.style.animation = '';
        if (anim === 'shake') {
            el.style.animation = 'mc-shake 3s infinite';
            el.classList.add('mc-anim-shake');
        } else if (anim === 'scale') {
            el.style.animation = 'mc-pulse-scale 2s ease-in-out infinite';
        } else if (anim === 'glow') {
            el.style.animation = 'mc-glow 2s ease-in-out infinite';
        } else if (anim === 'slide') {
            el.style.animation = 'mc-float 3s ease-in-out infinite';
        }
        if (design.customCSS) {
            el.style.cssText += ';' + design.customCSS;
        }
    }

    function applyIconColor(img, hex) {
        if (!img || !hex) return;
        // Replace img with a colored div using CSS mask
        var wrapper = document.createElement('div');
        var w = img.style.width || img.getAttribute('width') || '20px';
        var h = img.style.height || img.getAttribute('height') || '20px';
        wrapper.style.cssText = 'display:inline-block;width:' + w + ';height:' + h +
            ';background-color:' + hex +
            ';-webkit-mask-image:url(' + img.src + ')' +
            ';-webkit-mask-size:contain;-webkit-mask-repeat:no-repeat;-webkit-mask-position:center' +
            ';mask-image:url(' + img.src + ')' +
            ';mask-size:contain;mask-repeat:no-repeat;mask-position:center;';
        wrapper.className = 'pl-icon-colored';
        if (img.parentNode) {
            img.parentNode.replaceChild(wrapper, img);
        }
    }

    function applyDesignToButtons() {
        if (!_fetchedDesign) return;
        var designData = _fetchedDesign;

        // Apply styles to BUY button
        var buyBtn = document.querySelector('.pl-btn-provador-buy');
        if (buyBtn && designData.buy_button) {
            applyDesignToElement(buyBtn, designData.buy_button, false);
            var textNode = buyBtn.lastChild;
            if (textNode && textNode.nodeType === 3 && designData.buy_button.label) {
                textNode.textContent = designData.buy_button.label;
            }
            var badge = document.querySelector('.pl-badge-novidade');
            if (badge && designData.buy_button.badgeText) {
                badge.textContent = designData.buy_button.badgeText;
            }
            if (badge && designData.buy_button.badge === false) {
                badge.style.display = 'none';
            }
            // Apply icon color to buy button icon
            if (designData.buy_button.iconColor) {
                var buyIcon = buyBtn.querySelector('img');
                if (buyIcon) applyIconColor(buyIcon, designData.buy_button.iconColor);
            }
        }

        // Apply styles to PHOTO button
        var photoBtn = document.querySelector('.mc-btn-trigger-ia');
        if (photoBtn && designData.photo_button) {
            if (designData.photo_button.customButtonImage) {
                // Custom button image replaces entire button content
                // Safe: customButtonImage is validated server-side as data:image/ URI only
                while (photoBtn.firstChild) photoBtn.removeChild(photoBtn.firstChild);
                // Preserve position-related inline styles (position:fixed, top, left, z-index)
                // Only reset visual styles — do NOT use cssText= which wipes everything
                photoBtn.style.setProperty('background', 'none', 'important');
                photoBtn.style.setProperty('border', 'none', 'important');
                photoBtn.style.setProperty('padding', '0', 'important');
                photoBtn.style.setProperty('cursor', 'pointer');
                // Re-assert display (visual styles only — position comes from container placement)
                photoBtn.style.setProperty('display', 'flex', 'important');
                photoBtn.style.setProperty('align-items', 'center', 'important');
                photoBtn.style.setProperty('justify-content', 'center', 'important');
                var customImg = document.createElement('img');
                customImg.src = designData.photo_button.customButtonImage;
                customImg.alt = 'Provador Virtual';
                customImg.style.cssText = 'width:100%;height:100%;object-fit:contain;pointer-events:none;';
                photoBtn.appendChild(customImg);
                var sz = (designData.photo_button.height || 60) + 'px';
                photoBtn.style.setProperty('width', sz, 'important');
                photoBtn.style.setProperty('height', sz, 'important');
                photoBtn.style.setProperty('filter', 'none', 'important');
                photoBtn.style.setProperty('box-shadow', 'none', 'important');
                // Re-assert position so store CSS cannot override it
                photoBtn.style.setProperty('position', 'absolute', 'important');
                photoBtn.style.setProperty('top', '15px', 'important');
                photoBtn.style.setProperty('right', '15px', 'important');
                photoBtn.style.setProperty('z-index', '9999', 'important');
                // Apply animation
                var anim = designData.photo_button.hoverAnimation || 'none';
                if (anim === 'shake') photoBtn.style.animation = 'mc-shake 3s infinite';
                else if (anim === 'scale') photoBtn.style.animation = 'mc-pulse-scale 2s ease-in-out infinite';
                else if (anim === 'glow') photoBtn.style.animation = 'mc-glow 2s ease-in-out infinite';
                else if (anim === 'slide') photoBtn.style.animation = 'mc-float 3s ease-in-out infinite';
            } else {
                applyDesignToElement(photoBtn, designData.photo_button, true);
                // Re-assert position after applyDesignToElement (customCSS could overwrite)
                photoBtn.style.setProperty('position', 'absolute', 'important');
                photoBtn.style.setProperty('top', '15px', 'important');
                photoBtn.style.setProperty('right', '15px', 'important');
                photoBtn.style.setProperty('z-index', '9999', 'important');
                // Apply icon color to photo button icon
                if (designData.photo_button.iconColor) {
                    var photoIcon = photoBtn.querySelector('img');
                    if (photoIcon) applyIconColor(photoIcon, designData.photo_button.iconColor);
                }
            }
        }

        // Hide/show buttons based on button_mode
        if (BUTTON_MODE === 'image') {
            var buyContainer = document.querySelector('.pl-buy-btn-container');
            if (buyContainer) buyContainer.style.display = 'none';
        } else if (BUTTON_MODE === 'buy') {
            var photoEl = document.querySelector('.mc-btn-trigger-ia');
            if (photoEl) photoEl.style.display = 'none';
        }

        // Apply custom logo inside the provador modal
        if (designData.custom_logo) {
            var headerDiv = document.getElementById('mc-header-provador');
            if (headerDiv) {
                var logoContainer = headerDiv.querySelector('div');
                if (logoContainer) {
                    var logoImg = logoContainer.querySelector('img');
                    if (logoImg) {
                        logoImg.src = designData.custom_logo;
                        logoImg.alt = 'Logo da loja';
                    }
                }
            }
        }

    }

    function fetchDesignFromAPI() {
        if (!STORE_ID || !API_HOST) return Promise.resolve(null);
        var cached = getCachedDesign();
        if (cached) return Promise.resolve(cached);
        return fetch(API_HOST + '/api/design/' + STORE_ID)
            .then(function(res) { return res.ok ? res.json() : null; })
            .then(function(data) {
                if (!data) return null;
                cacheDesign(data);
                if (data.photo_button && data.photo_button.fontFamily) loadGoogleFont(data.photo_button.fontFamily);
                if (data.buy_button && data.buy_button.fontFamily) loadGoogleFont(data.buy_button.fontFamily);
                return data;
            })
            .catch(function() { return null; });
    }

    // Fetch design data (buttons are applied later in init() after DOM elements exist)
    fetchDesignFromAPI().then(function(designData) {
        if (!designData) return;
        _fetchedDesign = designData;
        if (designData.button_mode) {
            BUTTON_MODE = designData.button_mode;
        }
        // If init() already ran, apply now
        applyDesignToButtons();
    });

    // ─── TABELAS DE TAMANHOS ──────────────────────────────────────────────────────

    const SIZES_TOP = ['XXP', 'XP', 'P', 'M', 'G', 'XG', 'XXG', '3XG', '4XG', '5XG'];
    const SIZES_BOTTOM = ['36/XXP', '38/XP', '40/P', '42/M', '44/G', '46/XG', '48/XXG', '50/3XG', '52/4XG', '54/5XG'];
    const SIZES_BOTTOM_SW = ['XXP', 'XP', 'P', 'M', 'G', 'XG', 'XXG', '3XG', '4XG', '5XG'];

    const GRADE = {
        regular: [49, 51, 54, 57, 61, 62, 64, 66, 70, 73],
        oversized: [58, 60, 62, 64, 66, 70, 73, 76, 79, 83],
        oversizedSS: [58, 61, 63, 67, 70, 74, 78, 82, 87, 92],
        hoodie: [50, 53, 55, 58, 62, 65, 69, 74, 79, 83],
        boxyHoodie: [61, 77, 78, 79, 80, 81, 82, 83, 84, 85],
        puffer: [53, 56, 59, 61, 70, 74, 78, 82, 86, 90],
        vest: [52, 55, 57, 59, 63, 66, 70, 72, 76, 82],
        boxyHenley: [54, 56, 58, 64, 66, 68, 70, 76, 78, 84],
        bottomTailoring: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
        bottomSweat: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
        underwear: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
        quadrilTailoring: [48, 50, 52, 56, 58, 60, 62, 64, 66, 68],
        quadrilSweat: [48, 50, 52, 54, 56, 58, 60, 62, 64, 66],
        quadrilUnderwear: [50, 52, 54, 56, 58, 60, 62, 64, 66, 68],
    };

    // ─── DETECÇÃO DO PRODUTO ──────────────────────────────────────────────────────

    function detectProduct(name) {
        const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        LOG.group('Detecção de produto');
        LOG.info('Nome bruto: "' + name + '"');
        LOG.info('Nome normalizado: "' + n + '"');
        let result;
        if (/tailoring/.test(n) || /\d\/\d\s*short/.test(n) || /\b(1\/5|2\/5|3\/5|4\/5)\b/.test(n)) result = { category: 'bottom', fit: 'tailoring' };
        else if (/underwear|cueca/.test(n)) result = { category: 'bottom', fit: 'underwear' };
        else if (/sweatpant|sweatshort|sweat pant|sweat short|calca|bermuda/.test(n)) result = { category: 'bottom', fit: 'sweat' };
        else if (/henley/.test(n)) result = { category: 'top', fit: 'boxyHenley' };
        else if (/boxy.*(hoodie|crewneck|crew)/.test(n) || /(hoodie|crewneck|crew).*boxy/.test(n)) result = { category: 'top', fit: 'boxyHoodie' };
        else if (/puffer|jacket/.test(n)) result = { category: 'top', fit: 'puffer' };
        else if (/vest/.test(n)) result = { category: 'top', fit: 'vest' };
        else if (/(hoodie|hoodie zip|half zip|crewneck|crew neck)/.test(n) && !/oversized|boxy|short sleeve/.test(n)) result = { category: 'top', fit: 'hoodie' };
        else if (/oversized.*(hoodie|crewneck|crew|short sleeve)/.test(n) || /short sleeve.*(hoodie|crewneck)/.test(n)) result = { category: 'top', fit: 'oversizedSS' };
        else if (/oversized|boxy tee|2\/4/.test(n)) result = { category: 'top', fit: 'oversized' };
        else result = { category: 'top', fit: 'regular' };
        LOG.ok('Produto detectado:', result);
        LOG.end();
        return result;
    }

    // ─── CÁLCULOS DE MEDIDAS ──────────────────────────────────────────────────────

    function estimarTorax(altura, peso) {
        if (altura < 3) altura *= 100;
        let circ = 0.65 * peso + 56;
        const imc = peso / Math.pow(altura / 100, 2);
        if (imc > 30) circ += 4; else if (imc > 25) circ += 2;
        LOG.info('Tórax estimado: ' + circ.toFixed(1) + 'cm  |  IMC: ' + imc.toFixed(1));
        return circ;
    }

    function findClosest(arr, val) {
        let idx = 0, minDiff = Infinity;
        arr.forEach((v, i) => { const d = Math.abs(v - val); if (d < minDiff) { minDiff = d; idx = i; } });
        return idx;
    }

    let recommendedSize = 'M';
    let currentProduct = { category: 'top', fit: 'regular' };

    function calcTop(fit) {
        const altura = parseFloat(document.getElementById('mc-h-val').value);
        const peso = parseFloat(document.getElementById('mc-w-val').value);
        if (!altura || !peso) return;
        const torax = estimarTorax(altura, peso);
        const folga = { regular: 4, oversized: 8, oversizedSS: 8, hoodie: 6, boxyHoodie: 12, puffer: 10, vest: 5, boxyHenley: 9 };
        const larguraAlvo = torax / 2 + (folga[fit] || 4);
        recommendedSize = SIZES_TOP[findClosest(GRADE[fit], larguraAlvo)];
        LOG.group('Cálculo de tamanho (top)');
        LOG.info('Fit: ' + fit + '  |  Folga: ' + (folga[fit] || 4) + 'cm');
        LOG.info('Largura alvo (meia-tórax + folga): ' + larguraAlvo.toFixed(1) + 'cm');
        LOG.ok('Tamanho recomendado: ' + recommendedSize);
        LOG.end();
        // if (document.getElementById('mc-res-letter')) document.getElementById('mc-res-letter').innerText = recommendedSize;
    }

    function calcBottom(fit) {
        const cintura = parseFloat(document.getElementById('mc-cin-val').value);
        const quadril = parseFloat(document.getElementById('mc-quad-val').value);
        if (!cintura || !quadril) return;
        let gradeC, gradeQ, sizes;
        if (fit === 'tailoring') { gradeC = GRADE.bottomTailoring; gradeQ = GRADE.quadrilTailoring; sizes = SIZES_BOTTOM; }
        else if (fit === 'underwear') { gradeC = GRADE.underwear; gradeQ = GRADE.quadrilUnderwear; sizes = SIZES_BOTTOM_SW; }
        else { gradeC = GRADE.bottomSweat; gradeQ = GRADE.quadrilSweat; sizes = SIZES_BOTTOM_SW; }
        const idxC = findClosest(gradeC, cintura / 2);
        const idxQ = findClosest(gradeQ, quadril / 2);
        recommendedSize = sizes[Math.max(idxC, idxQ)];
        LOG.group('Cálculo de tamanho (bottom)');
        LOG.info('Fit: ' + fit + '  |  Cintura: ' + cintura + 'cm  |  Quadril: ' + quadril + 'cm');
        LOG.info('Índice cintura: ' + idxC + '  |  Índice quadril: ' + idxQ + '  →  usado: ' + Math.max(idxC, idxQ));
        LOG.ok('Tamanho recomendado: ' + recommendedSize);
        LOG.end();
        // if (document.getElementById('mc-res-letter')) document.getElementById('mc-res-letter').innerText = recommendedSize;
    }

    function calculateFinalSize() {
        // Feature temporariamente desativada: não faz cálculos de tamanho
        return;
    }

    // ─── LOCK / UNLOCK SCROLL DA PÁGINA ──────────────────────────────────────────

    let scrollY = 0;

    function lockBodyScroll() {
        scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflowY = 'scroll';
    }

    function unlockBodyScroll() {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflowY = '';
        window.scrollTo(0, scrollY);
    }

    // ─── ESTILOS ──────────────────────────────────────────────────────────────────

    const styles = `
        :root {
            --mc-primary: #000000;
            --mc-bg: #ffffff;
            --mc-border: #000000;
            --mc-gray: #f5f5f5;
            --mc-text: #000000;
            --mc-text-light: #666666;
        }
        .mc-btn-trigger-ia {
            position: absolute;
            top: 15px;
            right: 15px;
            z-index: 9999;
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            width: 60px;
            height: 60px;
            display: flex;
            pointer-events: auto !important;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 2px 6px rgba(0,0,0,0.18));
            transition: transform 0.2s ease, filter 0.2s ease;
        }
        .mc-btn-trigger-ia:hover {
            filter: drop-shadow(0 4px 12px rgba(0,0,0,0.28));
        }
        .mc-btn-trigger-ia img { width: 100%; height: 100%; object-fit: contain; }

        /* ── Botão inline (acima do comprar) ── */
        .pl-buy-btn-container {
            width: 100%;
            margin-bottom: 15px;
            position: relative;
        }
        .pl-btn-provador-buy {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 10px !important;
            width: 100% !important;
            height: 50px !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            border: 1px solid #000000 !important;
            border-radius: 0px !important;
            font-family: 'Inter', sans-serif !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 2px !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            text-decoration: none !important;
        }
        .pl-btn-provador-buy:hover {
            background-color: #000000 !important;
            color: #ffffff !important;
        }
        .pl-btn-provador-buy svg { fill: currentColor; }
        .pl-badge-novidade {
            position: absolute;
            top: -28px;
            right: -85px;
            background: #000;
            color: #fff;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            white-space: nowrap;
            z-index: 2;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            font-family: 'Inter', sans-serif;
            animation: mc-float-badge 3s ease-in-out infinite;
        }
        @keyframes mc-float-badge {
            0%, 100% { transform: translateY(0) rotate(2deg); }
            50% { transform: translateY(-5px) rotate(-1deg); }
        }
        @media (max-width: 767px) {
            .pl-buy-btn-container { overflow: visible !important; }
            .pl-badge-novidade { right: -55px !important; }
            .pl-svg-linha { right: -45px !important; width: 60px !important; }
        }
        #mc-modal-ia {
            display: none; position: fixed; inset: 0;
            background: rgba(255,255,255,0.98);
            z-index: 999999; align-items: center; justify-content: center;
            font-family: 'Inter', sans-serif;
        }
        .mc-card-ia {
            background: var(--mc-bg); width: 100%; max-width: 480px;
            padding: 0; position: relative; color: var(--mc-text);
            border: 1px solid var(--mc-border); max-height: 94vh;
            display: flex; flex-direction: column; overflow: hidden;
        }
        .mc-content-scroll { padding: 40px 30px; overflow-y: auto; flex: 1; text-align: center; }
        .mc-close-ia {
            position: absolute; top: 20px; right: 20px;
            background: none; border: none; color: var(--mc-text);
            cursor: pointer; font-size: 24px; z-index: 100; font-weight: 300;
        }
        .mc-tips-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
            padding: 20px 0; margin: 20px 0;
            border-top: 1px solid var(--mc-gray); border-bottom: 1px solid var(--mc-gray);
        }
        .mc-tip-item {
            display: flex; flex-direction: column; align-items: center; gap: 8px;
            font-size: 9px; font-weight: 600; letter-spacing: 1px;
            text-transform: uppercase; color: var(--mc-text-light);
        }
        .mc-tip-item i { color: var(--mc-primary); font-size: 20px; }
        .mc-lead-form { margin: 30px 0 20px; display: flex; flex-direction: column; gap: 20px; text-align: left; }
        .mc-input-row { display: flex; gap: 15px; }
        .mc-group { flex: 1; }
        .mc-group label {
            display: block; font-size: 9px; font-weight: 600;
            letter-spacing: 1.5px; color: var(--mc-text); margin-bottom: 8px; text-transform: uppercase;
        }
        .mc-lead-form .mc-input,
        .mc-lead-form input[type="text"].mc-input,
        .mc-lead-form input[type="tel"].mc-input {
            width: 100% !important; 
            height: 60px !important;
            padding: 0 20px !important; 
            border: 1px solid #1b1b1b !important; /* Cor de borda fixa para evitar variação */
            font-size: 16px !important; 
            font-family: inherit !important;
            background: #ffffff !important; 
            color: #1b1b1b !important; 
            outline: none !important; 
            box-sizing: border-box !important;
            border-radius: 0 !important; 
            -webkit-appearance: none !important; 
            appearance: none !important;
            margin: 0 !important;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
        }
        .mc-lead-form .mc-input:focus,
        .mc-lead-form input[type="text"]:focus,
        .mc-lead-form input[type="tel"]:focus { 
            border-width: 2px !important; 
            border-color: #1b1b1b !important; 
        }
        .mc-input-hint { font-size: 9px; color: var(--mc-text-light); letter-spacing: 0.5px; margin-top: 6px; }
        .mc-btn-black {
            background: var(--mc-primary); color: var(--mc-bg);
            border: 1px solid var(--mc-primary); width: 100%; padding: 18px;
            font-family: 'Inter', sans-serif; font-weight: 600; font-size: 11px;
            letter-spacing: 2px; text-transform: uppercase; cursor: pointer; margin-top: 20px; transition: 0.3s;
        }
        .mc-btn-black:disabled { background: var(--mc-gray); color: #999; border-color: var(--mc-gray); cursor: not-allowed; }
        .mc-btn-black:not(:disabled):hover { background: var(--mc-bg); color: var(--mc-primary); }
        .mc-btn-buy {
            background: var(--mc-primary); color: var(--mc-bg);
            border: 1px solid var(--mc-primary); width: 100%; padding: 20px;
            font-family: 'Inter', sans-serif; font-weight: 600; font-size: 12px;
            letter-spacing: 2px; text-transform: uppercase; cursor: pointer; margin-bottom: 15px; transition: 0.3s;
        }
        .mc-btn-buy:hover { background: var(--mc-bg); color: var(--mc-primary); }
        .mc-btn-outline {
            background: var(--mc-bg); color: var(--mc-primary);
            border: 1px solid var(--mc-border); width: 100%; padding: 18px;
            font-family: 'Inter', sans-serif; font-weight: 600; font-size: 11px;
            letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: 0.3s;
        }
        .mc-btn-outline:hover { background: var(--mc-primary); color: var(--mc-bg); }
        .mc-powered-footer {
            background: var(--mc-bg); padding: 20px;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            flex-shrink: 0; border-top: 1px solid var(--mc-gray);
        }
        .mc-quantic-logo { height: 23px; filter: brightness(0); }
        .mc-status-msg {
            display: none; font-size: 9px; letter-spacing: 1px; color: #ef4444;
            margin-top: 8px; font-weight: 600; text-align: left; text-transform: uppercase;
        }
        @keyframes mc-shake {
            0% { transform: rotate(0deg); }
            10% { transform: rotate(-10deg); }
            20% { transform: rotate(10deg); }
            30% { transform: rotate(-10deg); }
            40% { transform: rotate(10deg); }
            50% { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
        }
        @keyframes mc-pulse-scale {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
        }
        @keyframes mc-glow {
            0%, 100% { box-shadow: 0 0 5px rgba(123,47,242,0.2); }
            50% { box-shadow: 0 0 20px rgba(123,47,242,0.6); }
        }
        @keyframes mc-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        @keyframes mc-slide { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
        @keyframes mc-pulse-text { 0%, 100% { opacity: 0.4; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1); } }
        .mc-content-scroll::-webkit-scrollbar { width: 4px; }
        .mc-content-scroll::-webkit-scrollbar-thumb { background: #e5e5e5; }

        @media (min-width: 768px) {
            .mc-card-ia.is-result { width: 820px !important; max-width: 90vw !important; height: 560px !important; border-radius: 0 !important; }
            .mc-card-ia.is-result #mc-header-provador,
            .mc-card-ia.is-result .mc-powered-footer { display: none !important; }
            .mc-card-ia.is-result .mc-content-scroll { padding: 0 !important; height: 100% !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; }
            .mc-card-ia.is-result #mc-step-result { display: flex !important; flex-direction: row !important; width: 100%; height: 100%; align-items: stretch; }
            .mc-card-ia.is-result #mc-result-img-col { width: 45% !important; height: 100% !important; margin: 0 !important; border: none !important; border-right: 1px solid var(--mc-border) !important; position: relative !important; flex-shrink: 0; }
            .mc-card-ia.is-result #mc-result-img-col img { position: absolute !important; top: 0; left: 0; width: 100% !important; height: 100% !important; object-fit: cover !important; object-position: top center !important; }
            .mc-card-ia.is-result #mc-result-actions-col { width: 55% !important; height: 100% !important; padding: 40px !important; display: flex !important; flex-direction: column; justify-content: center; box-sizing: border-box; overflow-y: auto; }
            .mc-card-ia.is-result .mc-res-title { display: block !important; font-size: 20px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--mc-text); margin-bottom: 4px; }
            .mc-card-ia.is-result .mc-res-subtitle { display: block !important; font-size: 11px; color: var(--mc-text-light); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 30px; }
            .mc-card-ia.is-result .mc-metrics-row { display: flex !important; gap: 15px; margin-bottom: 30px; }
            .mc-card-ia.is-result .mc-metric-card { flex: 1; background: transparent; border: 1px solid var(--mc-border); border-radius: 0; padding: 16px; }
            .mc-card-ia.is-result .mc-metric-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: var(--mc-text-light); margin-bottom: 6px; display: block; }
            .mc-card-ia.is-result .mc-metric-value { font-size: 20px; font-weight: 700; color: var(--mc-text); }
            .mc-card-ia.is-result .mc-metric-unit { font-size: 12px; color: var(--mc-text-light); margin-left: 2px; }
            .mc-card-ia.is-result .mc-size-card { display: flex !important; align-items: center; gap: 16px; background: var(--mc-gray); border: 1px solid var(--mc-border); border-radius: 0; padding: 20px; margin-bottom: 24px; }
            .mc-card-ia.is-result .mc-size-circle { width: 44px; height: 44px; border-radius: 50%; background: var(--mc-primary); color: var(--mc-bg); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; flex-shrink: 0; }
            .mc-card-ia.is-result .mc-size-info { flex: 1; }
            .mc-card-ia.is-result .mc-size-info strong { display: block; font-size: 11px; font-weight: 600; color: var(--mc-text); margin-bottom: 4px; letter-spacing: 1.5px; text-transform: uppercase; }
            .mc-card-ia.is-result .mc-size-info span { font-size: 9px; color: var(--mc-text-light); letter-spacing: 1px; text-transform: uppercase; display: block; }
            .mc-card-ia.is-result .mc-size-check { color: var(--mc-primary); font-size: 24px; flex-shrink: 0; }
            .mc-card-ia.is-result .mc-res-note { display: flex !important; align-items: flex-start; gap: 8px; font-size: 10px; color: var(--mc-text-light); font-style: italic; letter-spacing: 1px; margin-bottom: 24px; line-height: 1.5; }
            .mc-card-ia.is-result .mc-res-note i { flex-shrink: 0; margin-top: 1px; font-size: 14px; }
            .mc-card-ia.is-result .mc-btn-buy { border-radius: 0 !important; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 11px !important; padding: 18px !important; margin-bottom: 12px; font-weight: 600; letter-spacing: 2px !important; text-transform: uppercase !important; }
            .mc-card-ia.is-result .mc-btn-outline { border-radius: 0 !important; display: flex; align-items: center; justify-content: center; font-size: 11px !important; padding: 18px !important; margin-top: 0; font-weight: 600; letter-spacing: 2px !important; text-transform: uppercase !important; }
            .mc-card-ia.is-result .mc-res-mobile-only { display: none !important; }
            .mc-card-ia.is-result .mc-close-ia { top: 16px; right: 16px; color: var(--mc-text); z-index: 10; }
        }
        #mc-step-confirm {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(2px);
            z-index: 200;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .mc-confirm-box {
            background: #ffffff;
            width: 100%;
            max-width: 380px;
            padding: 40px 30px;
            border: 1px solid #000;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            animation: mc-popup-zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes mc-popup-zoom {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

    `;

    const CABINE_ICON_URL = 'https://i.ibb.co/50TPgYj/cabine-icone-oficial.png';
    const stampImageHTML = `<img src="https://cdn.shopify.com/s/files/1/0636/6334/1746/files/logo_provador.png?v=1772494793" alt="Provador Virtual" style="width:100%;height:100%;object-fit:contain;">`;


    const html = `
        <div id="mc-modal-ia">
            <div class="mc-card-ia">
                <button type="button" class="mc-close-ia" id="mc-close-btn">&times;</button>
                <div class="mc-content-scroll">
                    <div id="mc-header-provador">
                        <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Provador Virtual</h1>
                        <div style="margin:0 0 4px;text-align:center;">
                            <img src="${LOGO_URL}" alt="Provou Levou" style="height:32px;width:auto;display:inline-block;object-fit:contain;" onerror="this.style.display='none'"/>
                        </div>
                    </div>
                    <div id="mc-step-upload">
                        <div class="mc-lead-form" style="margin-bottom:0;">
                            <div class="mc-group">
                                <label>Seu WhatsApp</label>
                                <input type="tel" id="mc-phone" class="mc-input" placeholder="(11) 99999-9999" maxlength="15">
                                <div id="mc-phone-error" class="mc-status-msg">Insira um n&#250;mero v&#225;lido</div>
                            </div>
                        </div>
                        <p style="margin:20px 0 10px;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--mc-text-light);text-align:center;">Sua foto deve seguir estes requisitos:</p>
                        <div class="mc-tips-grid" style="margin-top:0;">
                            <div class="mc-tip-item"><i class="ph ph-t-shirt"></i><span>Com Roupa</span></div>
                            <div class="mc-tip-item"><i class="ph ph-person"></i><span>Corpo Inteiro</span></div>
                            <div class="mc-tip-item"><i class="ph ph-sun"></i><span>Boa Luz</span></div>
                        </div>
                        <div style="display:flex;gap:20px;justify-content:center;margin-top:20px;">



                            <div id="mc-trigger-upload" style="width:120px;height:160px;border:1px solid var(--mc-border);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:var(--mc-gray);transition:0.3s;">
                                <i class="ph ph-camera-plus" style="font-size:32px;color:var(--mc-primary);margin-bottom:10px;"></i>
                                <span style="font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Enviar Foto</span>
                                <input type="file" id="mc-real-input" accept="image/*" style="display:none">
                            </div>
                            <div id="mc-pre-view" style="display:none;width:120px;height:160px;overflow:hidden;border:1px solid var(--mc-border);">
                                <img id="mc-pre-img" style="width:100%;height:100%;object-fit:cover;">
                            </div>
                        </div>
                        <label style="display:flex;align-items:flex-start;gap:8px;margin-top:8px;cursor:pointer;font-size:12px;line-height:1.4;color:#64748b;">
                            <input type="checkbox" id="mc-accept-terms" style="margin-top:2px;cursor:pointer;accent-color:#000;">
                            Ao continuar, concordo com os <a href="http://provoulevou.com.br/termos.html" target="_blank" style="color:#8b5cf6;text-decoration:underline;">Termos e Condições</a>
                        </label>
                        <button class="mc-btn-black" id="mc-btn-generate" disabled>Ver no meu corpo</button>
                    </div>

                    <!-- PASSO DE CONFIRMAÇÃO (CENTERED POP-UP) -->
                    <div id="mc-step-confirm">
                        <div class="mc-confirm-box">
                            <h2 style="margin:0 0 30px 0;font-size:16px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#000;line-height:1.4;">Sua foto segue estes requisitos?</h2>
                            
                            <div class="mc-tips-grid" style="margin-bottom:35px; border-top:none; border-bottom:none; padding:0;">
                                <div class="mc-tip-item">
                                    <i class="ph ph-t-shirt" style="font-size:24px;"></i>
                                    <span style="font-size:8px;">Com Roupa</span>
                                </div>
                                <div class="mc-tip-item">
                                    <i class="ph ph-person" style="font-size:24px;"></i>
                                    <span style="font-size:8px;">Corpo Inteiro</span>
                                </div>
                                <div class="mc-tip-item">
                                    <i class="ph ph-sun" style="font-size:24px;"></i>
                                    <span style="font-size:8px;">Boa Luz</span>
                                </div>
                            </div>

                            <button class="mc-btn-black" id="mc-btn-confirm-yes" style="margin-top:0; padding: 20px 0;">SIM, GERAR FOTO</button>
                            <button class="mc-btn-outline" id="mc-btn-confirm-no" style="margin-top:15px; border-color:#ff4d4d; color:#ff4d4d; padding: 18px 0; background:none;">N&Atilde;O, QUERO TROCAR</button>
                        </div>
                    </div>


                    <div style="display:none;padding:60px 0;text-align:center;" id="mc-loading-box">
                        <div style="font-weight:600;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-bottom:20px;animation:mc-pulse-text 1.5s infinite ease-in-out;">Gerando Prova Virtual...</div>
                        <div style="height:1px;background:var(--mc-gray);width:100%;position:relative;overflow:hidden;">
                            <div style="position:absolute;top:0;left:0;height:100%;width:30%;background:var(--mc-primary);animation:mc-slide 1.5s infinite linear;"></div>
                        </div>
                    </div>
                    <div id="mc-step-result" style="display:none;flex-direction:column;align-items:center;">
                        <div id="mc-result-img-col" style="width:100%;border:1px solid var(--mc-border);margin-bottom:30px;background:var(--mc-gray);">
                            <img id="mc-final-view-img" style="width:100%;height:auto;display:block;">
                        </div>
                        <div id="mc-result-actions-col" style="width:100%;">
                            <span class="mc-res-title" style="display:none;">Provador Virtual</span>
                            <span class="mc-res-subtitle" style="display:none;">SIMULA&#199;&#195;O BASEADA NO SEU PERFIL CORPORAL</span>
                            <div class="mc-res-note" style="display:none;">
                                <i class="ph ph-info"></i>
                                <span>A simula&#231;&#227;o AI considera o caimento do tecido baseado na sua estrutura corporal informada.</span>
                            </div>
                            <button class="mc-btn-outline" id="mc-btn-back">Voltar ao Produto</button>
                            <p class="mc-res-mobile-only" style="margin-top:30px;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--mc-text-light);cursor:pointer;text-decoration:underline;text-underline-offset:4px;" id="mc-retry-btn">Tentar outra foto</p>
                        </div>
                    </div>
                </div>
                <a href="https://provoulevou.com.br" target="_blank" class="mc-powered-footer" style="text-decoration:none;">
                    <span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--mc-text-light);">Powered by</span>
                    <img src="https://provoulevou.com.br/assets/provoulevou-logo.png" class="mc-quantic-logo" alt="Provou Levou">
                </a>
            </div>
        </div>
    `;

    // ─── INIT ─────────────────────────────────────────────────────────────────────

    function init() {
        LOG.info('Iniciando provador...');

        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        if (!window.phosphorIconsLoaded) {
            const ph = document.createElement('script');
            ph.src = 'https://unpkg.com/@phosphor-icons/web';
            document.head.appendChild(ph);
            window.phosphorIconsLoaded = true;
            LOG.info('Phosphor Icons carregado');
        }

        const styleTag = document.createElement('style');
        styleTag.innerHTML = styles;
        document.head.appendChild(styleTag);
        LOG.ok('Estilos injetados');

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        document.body.appendChild(modalContainer);
        LOG.ok('Modal HTML injetado no DOM');

        // ── Botão trigger (selo na foto) ──
        const openBtn = document.createElement('button');
        openBtn.className = 'mc-btn-trigger-ia';
        openBtn.id = 'mc-open-ia';
        openBtn.setAttribute('aria-label', 'Abrir Provador Virtual');
        openBtn.innerHTML = stampImageHTML;

        // ── Botão inline (acima do comprar) ──
        // Note: The buy button HTML is hardcoded static content (no user input), so innerHTML is safe here.
        function createBuyButton() {
            var container = document.createElement('div');
            container.className = 'pl-buy-btn-container';
            container.style.cssText = 'position:relative;width:100%;margin:20px 0 15px;';

            var badge = document.createElement('div');
            badge.className = 'pl-badge-novidade';
            badge.textContent = 'Novidade!';
            container.appendChild(badge);

            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'pl-svg-linha');
            svg.setAttribute('width', '80');
            svg.setAttribute('height', '40');
            svg.style.cssText = 'position:absolute;top:-20px;right:-65px;pointer-events:none;z-index:1;';
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M75,10 Q50,35 5,32');
            path.setAttribute('stroke', 'black');
            path.setAttribute('stroke-width', '1.2');
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-dasharray', '3,3');
            svg.appendChild(path);
            container.appendChild(svg);

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pl-btn-provador-buy';
            btn.style.cssText = 'width:100%!important;margin:0!important;';

            var icon = document.createElement('img');
            icon.src = 'https://i.ibb.co/50TPgYj/cabine-icone-oficial.png';
            icon.alt = 'Provador';
            icon.style.cssText = 'width:20px;height:20px;margin-right:8px;object-fit:contain;';
            btn.appendChild(icon);
            btn.appendChild(document.createTextNode('Provador Virtual'));

            btn.addEventListener('click', function () {
                document.getElementById('mc-open-ia')?.click();
            });

            container.appendChild(btn);
            return container;
        }

        function placeBuyButton() {
            var trayBuySelectors = [
                // Marina/Twig theme (Oticas Marina, etc.)
                '.frame_product_action_button',
                '[data-buy-action-button]',
                '.buy_action_button',
                // Generic Tray themes
                '.product-buy-button',
                '.wrapper-btn-buy',
                '.button-buy',
                '.buy-button',
                '#buy-button',
                '.botao-comprar',
                '#botao-comprar',
                '.product-buy',
                '.btn-buy',
                'button[name="buy"]',
                'input[name="buy"]',
                '.product-colum-right .box-buy',
                '.box-buy',
                '.product-action',
                '.product-actions',
                '.add-to-cart',
                '#addToCart',
            ];

            for (var i = 0; i < trayBuySelectors.length; i++) {
                var buyEl = document.querySelector(trayBuySelectors[i]);
                if (buyEl) {
                    var buyBtnContainer = createBuyButton();
                    buyEl.parentNode.insertBefore(buyBtnContainer, buyEl);
                    LOG.ok('Botao inline posicionado acima de: "' + trayBuySelectors[i] + '"');
                    return true;
                }
            }
            return false;
        }

        var trayImgContainers = [
            // Marina/Twig theme (Oticas Marina, etc.) — Swiper-based gallery
            '.frame_slider_principal',
            '.carousel_gallery',
            '.product_gallery',
            // Generic Tray themes
            '.produto-imagem',
            '.product-image',
            '.product-images',
            '.product-gallery',
            '.image-show',
            '.box-gallery',
            '.product-colum-left',
        ];
        var fallbackContainers = [
            '.product__media-wrapper', '.product-gallery__media', '.product__media',
            '.product-image-main', '.product-media-container', '[data-media-id]',
            '.product__media-item', '.product-gallery', '.product-single__media', '.media-gallery'
        ];

        // ── Posicionar selo na foto (mode: 'image' ou 'both') ──
        // Strategy: place button INSIDE the image container with position:absolute
        // so it scrolls naturally with the product image (no scroll handler needed).
        var placedImage = false;
        if (BUTTON_MODE === 'image' || BUTTON_MODE === 'both') {
            var allImgSelectors = trayImgContainers.concat(fallbackContainers);
            for (var si = 0; si < allImgSelectors.length; si++) {
                var sel = allImgSelectors[si];
                var el = document.querySelector(sel);
                if (el) {
                    // Ensure parent is a positioning context
                    var computedPos = window.getComputedStyle(el).position;
                    if (computedPos === 'static') {
                        el.style.position = 'relative';
                    }

                    // Place button inside the image container
                    el.appendChild(openBtn);
                    openBtn.style.setProperty('position', 'absolute', 'important');
                    openBtn.style.setProperty('top', '15px', 'important');
                    openBtn.style.setProperty('right', '15px', 'important');
                    openBtn.style.setProperty('z-index', '9999', 'important');
                    openBtn.style.setProperty('width', '60px', 'important');
                    openBtn.style.setProperty('height', '60px', 'important');

                    placedImage = true;
                    LOG.ok('Selo posicionado dentro de: "' + sel + '"');
                    break;
                }
            }
            if (!placedImage) {
                document.body.appendChild(openBtn);
                openBtn.style.cssText = 'position:fixed;bottom:100px;right:20px;z-index:50;width:60px;height:60px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:none;border:none;padding:0;';
                placedImage = true;
            }
        }

        // ── Posicionar botão acima do comprar (mode: 'buy' ou 'both') ──
        if (BUTTON_MODE === 'buy' || BUTTON_MODE === 'both') {
            var buyPlaced = placeBuyButton();

            if (BUTTON_MODE === 'buy') {
                openBtn.style.display = 'none';
                document.body.appendChild(openBtn);
            }

            if (!buyPlaced) {
                // Tray loads product content dynamically — retry until buy button appears
                var retryCount = 0;
                var retryInterval = setInterval(function() {
                    retryCount++;
                    if (placeBuyButton()) {
                        clearInterval(retryInterval);
                        LOG.ok('Botao inline posicionado apos ' + retryCount + ' tentativa(s)');
                        applyDesignToButtons();
                    } else if (retryCount >= 20) {
                        clearInterval(retryInterval);
                        LOG.warn('Nenhum botao de compra encontrado apos 20 tentativas');
                    }
                }, 500);
            }
        }

        // Fallback: se nenhum modo colocou o openBtn no DOM
        if (!placedImage && BUTTON_MODE !== 'buy') {
            document.body.appendChild(openBtn);
            openBtn.style.cssText = 'position:fixed;bottom:100px;right:20px;z-index:50;width:60px;height:60px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:none;border:none;padding:0;';
        }

        const modal = document.getElementById('mc-modal-ia');
        const genBtn = document.getElementById('mc-btn-generate');
        const confirmStep = document.getElementById('mc-step-confirm');
        const confirmBtnYes = document.getElementById('mc-btn-confirm-yes');
        const confirmBtnNo = document.getElementById('mc-btn-confirm-no');
        const confirmImg = document.getElementById('mc-confirm-img');
        const uploadStep = document.getElementById('mc-step-upload');

        const closeBtn = document.getElementById('mc-close-btn');
        const backBtn = document.getElementById('mc-btn-back');
        const retryBtn = document.getElementById('mc-retry-btn');
        const realInput = document.getElementById('mc-real-input');
        const triggerUpload = document.getElementById('mc-trigger-upload');
        const phoneInput = document.getElementById('mc-phone');

        let userPhoto = null;

        function openModal() {

            LOG.info('Modal aberto');
            modal.style.display = 'flex';
            lockBodyScroll();
        }

        function closeModal() {
            LOG.info('Modal fechado');
            modal.style.display = 'none';
            unlockBodyScroll();
        }

        function applyProduct(product) {
            currentProduct = product;
            LOG.info('Categoria: ' + product.category + ' (campos de medidas comentados)');
        }


        openBtn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const prodName = document.querySelector('h1.product-name, h1.product__title, .product-single__title, h1')?.innerText || document.title;
            LOG.info('Botão clicado — produto: "' + prodName + '"');
            applyProduct(detectProduct(prodName));
            openModal();
        };

        closeBtn.onclick = () => { LOG.info('Botão fechar clicado'); closeModal(); };
        backBtn.onclick = () => { LOG.info('Botão "Voltar ao produto" clicado'); closeModal(); };

        modal.addEventListener('click', (e) => {
            if (e.target === modal) { LOG.info('Clique fora do card — fechando modal'); closeModal(); }
        });

        retryBtn.onclick = () => {
            LOG.info('Tentar outra foto — resetando fluxo');
            document.getElementById('mc-step-result').style.display = 'none';
            document.getElementById('mc-step-upload').style.display = 'block';
            document.querySelector('.mc-card-ia').classList.remove('is-result');
            userPhoto = null;
            document.getElementById('mc-pre-view').style.display = 'none';
            checkFields();
        };

        triggerUpload.onclick = () => { LOG.info('Abrindo seletor de arquivo...'); realInput.click(); };

        phoneInput.addEventListener('input', function (e) {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
            checkFields();
        });

        function checkFields() {
            const nums = phoneInput.value.replace(/\D/g, '');
            const phoneOk = nums.length >= 10 && nums.length <= 11;
            document.getElementById('mc-phone-error').style.display = (phoneInput.value.length > 0 && !phoneOk) ? 'block' : 'none';
            phoneInput.style.borderColor = (phoneInput.value.length > 0 && !phoneOk) ? '#ef4444' : 'var(--mc-border)';
            // Medidas ignoradas por enquanto
            // let measOk = currentProduct.category === 'top'
            //     ? !!document.getElementById('mc-h-val').value && !!document.getElementById('mc-w-val').value
            //     : !!document.getElementById('mc-cin-val').value && !!document.getElementById('mc-quad-val').value;
            const allOk = !!userPhoto && phoneOk;
            genBtn.disabled = !(allOk && document.getElementById('mc-accept-terms').checked);
            LOG.info('Validação campos — phone:' + phoneOk + ' foto:' + !!userPhoto + ' → botão ' + (allOk ? 'HABILITADO' : 'desabilitado'));
        }

        ['mc-h-val', 'mc-w-val', 'mc-cin-val', 'mc-quad-val'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', checkFields);
        });

        document.getElementById('mc-accept-terms').onchange = checkFields;

        realInput.onchange = (e) => {
            userPhoto = e.target.files[0];
            if (userPhoto) {
                LOG.ok('Foto selecionada: "' + userPhoto.name + '" (' + (userPhoto.size / 1024).toFixed(0) + 'KB, ' + userPhoto.type + ')');
                const rd = new FileReader();
                rd.onload = ev => {
                    document.getElementById('mc-pre-img').src = ev.target.result;
                    document.getElementById('mc-pre-view').style.display = 'block';
                    checkFields();
                };
                rd.readAsDataURL(userPhoto);
            }
        };

        genBtn.onclick = () => {
            LOG.info('Botão "Ver no meu corpo" clicado');
            if (!userPhoto) {
                LOG.warn('Tentativa de gerar sem foto selecionada');
                return;
            }
            const rd = new FileReader();
            rd.onload = ev => {
                LOG.info('Leitura da foto concluída, exibindo pop-up de confirmação');
                if (confirmImg) confirmImg.src = ev.target.result;
                if (confirmStep) confirmStep.style.display = 'flex';
                // Note: O uploadStep não é escondido aqui para que ele fique ao fundo (escurecido) como na Divine
            };
            rd.readAsDataURL(userPhoto);
        };



        confirmBtnNo.onclick = () => {
            LOG.info('Botão "Não, quero trocar" clicado');
            if (confirmStep) confirmStep.style.display = 'none';
            if (uploadStep) uploadStep.style.display = 'block';
        };


        confirmBtnYes.onclick = async () => {
            LOG.info('Botão "Sim, gerar foto" clicado');
            if (confirmStep) confirmStep.style.display = 'none';
            if (uploadStep) uploadStep.style.display = 'none';
            const loadingBox = document.getElementById('mc-loading-box');
            if (loadingBox) loadingBox.style.display = 'block';


            // 🚨 VALIDAÇÃO BÁSICA NO FRONT 🚨
            const keyToUse = window.PROVOU_LEVOU_API_KEY;
            if (!keyToUse || keyToUse.includes("COLOQUE_A_CHAVE_AQUI")) {
                alert("Erro: API Key não configurada neste script.");
                return;
            }

            const prodImgTag = document.querySelector(
                // Marina/Twig theme — Swiper gallery: prefer active slide, then any loaded image
                '.frame_slider_principal .swiper-slide-active img, ' +
                '.frame_slider_principal .swiper-slide:first-child img.swiper-lazy, ' +
                '.frame_slider_principal img[src]:not([src=""]), ' +
                '.carousel_gallery img[src]:not([src=""]), ' +
                // Generic Tray themes
                '.image-show .box-img.active .zoom img, ' +
                '.image-show .box-img .zoom img, ' +
                '.image-show img, ' +
                '.product__media img, ' +
                'img.product-featured-media, ' +
                '.product-single__photo'
            );
            const prodImg = prodImgTag
                ? (prodImgTag.dataset.src || prodImgTag.dataset.lazy || prodImgTag.src)
                : (document.querySelector('meta[property="og:image"]')?.content || '');
            const prodName = document.querySelector('h1.product-name, h1.product__title, .product-single__title, h1')?.innerText || document.title;



            LOG.group('Enviando para webhook');
            LOG.info('Produto: ' + prodName);
            LOG.info('Imagem do produto: ' + (prodImg || '(não encontrada)'));
            LOG.info('WhatsApp: ' + phoneInput.value);
            LOG.info('Categoria: ' + currentProduct.category + '  |  Fit: ' + currentProduct.fit);

            document.getElementById('mc-step-upload').style.display = 'none';
            document.getElementById('mc-loading-box').style.display = 'block';

            try {
                const fd = new FormData();
                fd.append('person_image', userPhoto);
                fd.append('whatsapp', '55' + phoneInput.value.replace(/\D/g, ''));
                fd.append('phone_raw', phoneInput.value);
                fd.append('product_name', prodName);
                fd.append('product_type', currentProduct.category);
                fd.append('product_fit', currentProduct.fit);

                // 👉 INJETA A CHAVE NO FORM DATA PRO N8N LER
                fd.append('api_key', keyToUse);

                if (currentProduct.category === 'top') {
                    // fd.append('height', document.getElementById('mc-h-val').value);
                    // fd.append('weight', document.getElementById('mc-w-val').value);
                    fd.append('height', '');
                    fd.append('weight', '');
                    LOG.info('Medidas de Top comentadas (enviado vazio)');
                } else {
                    // fd.append('cintura', document.getElementById('mc-cin-val').value);
                    // fd.append('quadril', document.getElementById('mc-quad-val').value);
                    fd.append('height', '');
                    fd.append('weight', '');
                    fd.append('cintura', '');
                    fd.append('quadril', '');
                    LOG.info('Medidas de Bottom comentadas (enviado vazio)');
                }

                if (prodImg) {
                    try {
                        LOG.info('Baixando imagem do produto para anexar...');
                        const b = await fetch(prodImg).then(r => r.blob());
                        fd.append('product_image', b, 'p.png');
                        LOG.ok('Imagem do produto anexada (' + (b.size / 1024).toFixed(0) + 'KB)');
                    } catch (imgErr) {
                        LOG.warn('Não foi possível baixar imagem do produto: ' + imgErr.message);
                    }
                } else {
                    LOG.warn('Imagem do produto não encontrada no DOM — enviando sem ela');
                }

                calculateFinalSize();
                LOG.info('Enviando POST para webhook: ' + WEBHOOK_PROVA);
                const t0 = Date.now();

                const res = await fetch(WEBHOOK_PROVA, { method: 'POST', body: fd });
                const elapsed = Date.now() - t0;
                LOG.info('Resposta recebida em ' + elapsed + 'ms — status: ' + res.status + ' ' + res.statusText);

                const contentType = res.headers.get("content-type") || "";
                if (contentType.includes("application/json")) {
                    const data = await res.json();
                    if (data.error) {
                        LOG.error('Erro da API retornado via JSON:', data.error);
                        LOG.end();
                        document.getElementById('mc-loading-box').style.display = 'none';
                        document.getElementById('mc-step-upload').style.display = 'block';
                        if (data.error === "Chave invalida, vencida ou inativa." || data.error.includes("vencida ou inativa")) {
                            alert("App desativado nesta loja");
                        } else {
                            alert(data.error);
                        }
                        return;
                    }
                }

                if (res.ok) {
                    const blob = await res.blob();
                    LOG.ok('Imagem gerada com sucesso! (' + (blob.size / 1024).toFixed(0) + 'KB, ' + blob.type + ')');
                    LOG.end();

                    document.getElementById('mc-loading-box').style.display = 'none';
                    document.getElementById('mc-final-view-img').src = URL.createObjectURL(blob);

                    // Lógica de exibir medidas na tela foi removida/comentada
                    // const cVal = document.getElementById('mc-cin-val')?.value;

                    document.querySelector('.mc-card-ia').classList.add('is-result');
                    document.getElementById('mc-step-result').style.display = 'flex';
                    LOG.ok('Resultado exibido.');

                } else if (res.status === 401 || res.status === 403) {
                    LOG.error('Webhook retornou erro de permissão: ' + res.status);
                    LOG.end();
                    document.getElementById('mc-loading-box').style.display = 'none';
                    document.getElementById('mc-step-upload').style.display = 'block';
                    alert("Provas virtuais indisponíveis nesta loja no momento. (Assinatura Inativa/Chave Inválida)");
                } else {
                    LOG.error('Webhook retornou erro: ' + res.status);
                    LOG.end();
                    throw new Error('HTTP ' + res.status);
                }
            } catch (e) {
                console.error('------- ERRO DETALHADO capturado no CATCH -------');
                console.error('Nome:', e.name);
                console.error('Mensagem:', e.message);
                console.error('Stack:', e.stack);
                console.error('-------------------------------------------------');
                LOG.error('Falha no fluxo de geração: ' + e.message, e);
                LOG.end();
                document.getElementById('mc-loading-box').style.display = 'none';
                document.getElementById('mc-step-upload').style.display = 'block';
                alert('Ocorreu um erro ao processar sua imagem (ou chave/servidor indisponíveis). Tente novamente.\n\nDetalhe do erro temporário: ' + e.message);
            }
        };

        // Funcionalidade de adicionar ao carrinho removida conforme solicitado



        // Apply design after buttons exist in DOM
        applyDesignToButtons();

        LOG.ok('Provador inicializado com sucesso!');
    }

    // ─── DETECÇÃO DE PÁGINA DE PRODUTO ───────────────────────────────────────────

    // ── Detecção sempre dentro do DOMContentLoaded para garantir que
    // os elementos existam no DOM (script pode ser carregado async)
    function runWhenReady() {
        const path = window.location.pathname;
        const isProductPage =
            window.__MC_FORCE_INIT__ === true ||
            path.includes('/produto/') ||
            path.includes('/p/') ||
            path.includes('/products/') ||
            document.getElementById('product-container') !== null ||
            document.getElementById('form_comprar') !== null ||
            document.querySelector('.botao-comprar') !== null ||
            document.querySelector('#menuVars') !== null ||
            document.querySelector('.product-colum-right') !== null ||
            document.querySelector('.page-product') !== null ||
            document.querySelector('.product-buy-button') !== null ||
            document.querySelector('.button-buy') !== null ||
            document.querySelector('.product-name') !== null;

        LOG.info('Página atual: "' + path + '"  →  é página de produto: ' + isProductPage);

        if (isProductPage) {
            init();
        } else {
            // Tray loads content dynamically — retry detection a few times
            var detectRetry = 0;
            var detectInterval = setInterval(function() {
                detectRetry++;
                var found =
                    document.querySelector('.botao-comprar') !== null ||
                    document.getElementById('form_comprar') !== null ||
                    document.querySelector('#menuVars') !== null ||
                    document.querySelector('.product-colum-right') !== null ||
                    document.querySelector('.page-product') !== null ||
                    document.querySelector('.product-buy-button') !== null ||
                    document.querySelector('.button-buy') !== null ||
                    document.querySelector('.product-name') !== null;
                if (found) {
                    clearInterval(detectInterval);
                    LOG.ok('Página de produto detectada apos ' + detectRetry + ' tentativa(s)');
                    init();
                } else if (detectRetry >= 10) {
                    clearInterval(detectInterval);
                    LOG.warn('Página não é de produto — script não inicializado');
                }
            }, 500);
        }
    }

    if (document.readyState === 'loading') {
        LOG.info('DOM ainda carregando — aguardando DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', runWhenReady);
    } else {
        runWhenReady();
    }

})();
