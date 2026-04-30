(function () {

    // ─── 0. CONFIG — Centro Optico Marina (Tray store 1269258) ───────────────────
    const apiKey = 'pl_live_2e8a1216deb73095ebfc5be077e83801a0c95ecaa0f00258d352857fe610f03a';
    window.PROVOU_LEVOU_API_KEY = apiKey;

    let BUTTON_MODE = 'both';
    const STORE_ID = '1269258';
    const API_HOST = 'https://lojista.provoulevou.com.br';
    const WEBHOOK_PROVA = 'https://n8n.segredosdodrop.com/webhook/gerador-oculos';
    const MARINA_LOGO = 'https://images.tcdn.com.br/img/img_prod/1269258/1701713968_marina_centro_ptico.png';
    const PROVOU_LOGO = 'https://provoulevou.com.br/assets/provoulevou-logo.png';
    const STAMP_SRC = 'https://cdn.shopify.com/s/files/1/0636/6334/1746/files/logo_provador.png?v=1772494793';

    // ─── 1. DESIGN FETCH ─────────────────────────────────────────────────────────
    var _fetchedDesign = null;
    var CACHE_KEY = 'pl_design_' + STORE_ID;
    var CACHE_TTL = 5 * 60 * 1000;

    function getCachedDesign() {
        try {
            var c = localStorage.getItem(CACHE_KEY);
            if (c) { var p = JSON.parse(c); if (Date.now() - p.timestamp < CACHE_TTL) return p.data; }
        } catch (e) {}
        return null;
    }

    function cacheDesign(data) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: data, timestamp: Date.now() })); } catch (e) {}
    }

    function loadGoogleFont(family) {
        if (!family || family === 'Inter') return;
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=' + family.replace(/ /g, '+') + ':wght@400;500;600;700;800&display=swap';
        document.head.appendChild(l);
    }

    function applyDesignToElement(el, design, isPhotoButton) {
        if (!el || !design) return;
        if (design.backgroundColor) el.style.setProperty('background-color', design.backgroundColor, 'important');
        if (design.textColor) el.style.setProperty('color', design.textColor, 'important');
        var bw = design.borderWidth !== undefined ? design.borderWidth : 1;
        el.style.setProperty('border', bw + 'px solid ' + (design.borderColor || '#000'), 'important');
        if (design.borderRadius !== undefined) el.style.setProperty('border-radius', design.borderRadius + 'px', 'important');
        if (design.fontFamily) el.style.setProperty('font-family', design.fontFamily + ', sans-serif', 'important');
        if (design.fontSize) el.style.setProperty('font-size', design.fontSize + 'px', 'important');
        if (design.fontWeight) el.style.setProperty('font-weight', design.fontWeight, 'important');
        if (design.textTransform) el.style.setProperty('text-transform', design.textTransform, 'important');
        if (design.letterSpacing !== undefined) el.style.setProperty('letter-spacing', design.letterSpacing + 'px', 'important');
        if (design.height !== undefined) {
            el.style.setProperty('height', design.height + 'px', 'important');
            if (isPhotoButton) el.style.setProperty('width', design.height + 'px', 'important');
        }
        if (design.shadow) {
            el.style.setProperty('box-shadow', '0 4px 12px rgba(0,0,0,' + (design.shadowIntensity || 0.15) + ')', 'important');
        } else {
            el.style.setProperty('box-shadow', 'none', 'important');
        }
        if (isPhotoButton) el.style.setProperty('filter', 'none', 'important');
        if (design.gradient) {
            el.style.setProperty('background', 'linear-gradient(' + design.gradient.direction + ',' + design.gradient.colors[0] + ',' + design.gradient.colors[1] + ')', 'important');
        }
        if (design.customCSS) el.style.cssText += ';' + design.customCSS;
    }

    function applyDesignToButtons() {
        if (!_fetchedDesign) return;
        var d = _fetchedDesign;

        var buyBtn = document.querySelector('.q-btn-inline-provador');
        if (buyBtn && d.buy_button) {
            applyDesignToElement(buyBtn, d.buy_button, false);
            if (d.buy_button.label) {
                var tn = buyBtn.lastChild;
                if (tn && tn.nodeType === 3) tn.textContent = d.buy_button.label;
            }
        }

        var photoBtn = document.querySelector('.q-btn-trigger-ia');
        if (photoBtn && d.photo_button) {
            applyDesignToElement(photoBtn, d.photo_button, true);
            photoBtn.style.setProperty('position', 'absolute', 'important');
            photoBtn.style.setProperty('top', '15px', 'important');
            photoBtn.style.setProperty('right', '15px', 'important');
            photoBtn.style.setProperty('z-index', '9999', 'important');
        }

        if (d.button_mode) BUTTON_MODE = d.button_mode;
        if (BUTTON_MODE === 'image') {
            var ib = document.querySelector('.q-btn-inline-provador');
            if (ib) ib.style.display = 'none';
        } else if (BUTTON_MODE === 'buy') {
            var pb = document.querySelector('.q-btn-trigger-ia');
            if (pb) pb.style.display = 'none';
        }

        if (d.custom_logo) {
            var logoEl = document.querySelector('#q-header-provador img');
            if (logoEl) logoEl.src = d.custom_logo;
        }
    }

    function fetchDesignFromAPI() {
        if (!STORE_ID || !API_HOST) return Promise.resolve(null);
        var cached = getCachedDesign();
        if (cached) return Promise.resolve(cached);
        return fetch(API_HOST + '/api/design/' + STORE_ID)
            .then(function(r) { return r.ok ? r.json() : null; })
            .then(function(data) {
                if (!data) return null;
                cacheDesign(data);
                if (data.photo_button && data.photo_button.fontFamily) loadGoogleFont(data.photo_button.fontFamily);
                if (data.buy_button && data.buy_button.fontFamily) loadGoogleFont(data.buy_button.fontFamily);
                return data;
            })
            .catch(function() { return null; });
    }

    fetchDesignFromAPI().then(function(d) {
        if (!d) return;
        _fetchedDesign = d;
        applyDesignToButtons();
    });

    // ─── 2. UTILS ─────────────────────────────────────────────────────────────────
    let currentProduct = { category: 'top', fit: 'regular' };

    function detectProduct(name) {
        const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (/tailoring/.test(n) || /calca|bermuda|sweatpant/.test(n)) return { category: 'bottom', fit: 'tailoring' };
        if (/boxy.*(hoodie|crewneck)/.test(n)) return { category: 'top', fit: 'boxyHoodie' };
        if (/puffer|jacket/.test(n)) return { category: 'top', fit: 'puffer' };
        if (/vest/.test(n)) return { category: 'top', fit: 'vest' };
        if (/(hoodie|half zip|crewneck)/.test(n) && !/oversized|boxy/.test(n)) return { category: 'top', fit: 'hoodie' };
        if (/oversized/.test(n)) return { category: 'top', fit: 'oversized' };
        return { category: 'top', fit: 'regular' };
    }

    // ─── 3. SCROLL LOCK ──────────────────────────────────────────────────────────
    let scrollY = 0;
    function lockBodyScroll() {
        scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = '-' + scrollY + 'px';
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

    // ─── 4. ESTILOS (design Califa) ───────────────────────────────────────────────
    const styles = `
        :root { --q-primary:#000; --q-bg:#fff; --q-border:#000; --q-gray:#f5f5f5; --q-text:#000; --q-text-light:#666; }

        @keyframes q-shake {
            0%,50%,100% { transform:rotate(0deg); }
            10%,30% { transform:rotate(-10deg); }
            20%,40% { transform:rotate(10deg); }
        }
        .q-btn-trigger-ia {
            position:absolute; top:15px; right:35px; z-index:100;
            background:none; border:none; padding:0; cursor:pointer;
            width:72px; height:72px;
            display:flex; align-items:center; justify-content:center;
            filter:drop-shadow(0 2px 6px rgba(0,0,0,0.18));
            animation:q-shake 3s infinite;
        }
        .q-btn-trigger-ia:hover { filter:drop-shadow(0 4px 12px rgba(0,0,0,0.28)); }
        .q-btn-trigger-ia img { width:100%; height:100%; object-fit:contain; }
        @media (min-width:768px) { .q-btn-trigger-ia { width:65px; height:65px; } }

        .q-btn-inline-provador {
            display:flex; align-items:center; justify-content:center; gap:6px;
            width:100%; padding:14px;
            background:transparent; color:#000;
            border:1px solid #000; border-radius:0;
            font-family:'Inter',sans-serif; font-weight:600; font-size:11px;
            letter-spacing:1.5px; text-transform:uppercase;
            cursor:pointer; transition:background 0.3s,color 0.3s;
            margin-bottom:10px; box-sizing:border-box;
        }
        .q-btn-inline-provador:hover { background:#000; color:#fff; }
        .q-btn-inline-provador svg { width:14px; height:14px; flex-shrink:0; }

        #q-modal-ia {
            display:none; position:fixed; inset:0; z-index:999999;
            background:rgba(255,255,255,0.98);
            font-family:'Inter',sans-serif; overflow-y:auto; box-sizing:border-box;
        }
        #q-modal-ia * { box-sizing:border-box; }
        .q-card-ia {
            width:100%; min-height:100vh; background:#fff; color:#000;
            display:flex; flex-direction:column; position:relative;
        }
        @media (min-width:768px) {
            #q-modal-ia { display:none; align-items:center; justify-content:center; }
            .q-card-ia {
                width:480px; max-width:90vw; min-height:auto;
                max-height:94vh; border:1px solid #000; overflow:hidden;
            }
        }
        .q-close-ia {
            position:absolute; top:16px; right:16px;
            background:none; border:none; font-size:28px; font-weight:300;
            color:#000; cursor:pointer; z-index:10; line-height:1; padding:4px 8px;
        }
        .q-content-scroll {
            flex:1; padding:24px 20px; overflow-y:auto;
            text-align:center; display:flex; flex-direction:column; gap:24px;
        }
        .q-content-scroll::-webkit-scrollbar { width:4px; }
        .q-content-scroll::-webkit-scrollbar-thumb { background:#e5e5e5; }
        @media (max-width:767px) {
            .q-card-ia {
                min-height:auto;
                padding-top:env(safe-area-inset-top,0px);
                padding-bottom:env(safe-area-inset-bottom,0px);
            }
            #q-modal-ia {
                display:none; overflow-y:auto; padding:20px;
                align-items:flex-start; justify-content:center;
            }
            #q-modal-ia[style*="flex"] { display:flex !important; }
            .q-card-ia { width:100%; max-width:420px; border:1px solid #000; margin:auto; }
            .q-content-scroll { flex:none; padding:28px 20px; }
        }

        #q-header-provador {
            text-align:center; display:flex; flex-direction:column;
            gap:10px; align-items:center;
        }
        #q-header-provador h1 {
            margin:0; font-size:18px; font-weight:700;
            letter-spacing:2px; text-transform:uppercase;
        }

        #q-step-upload {
            display:flex; flex-direction:column; gap:24px; align-items:stretch;
        }
        .q-form-row { display:flex; flex-direction:column; gap:8px; width:100%; }
        .q-form-row label {
            display:block; font-size:10px; font-weight:700;
            letter-spacing:1.5px; text-transform:uppercase; color:#000; text-align:center;
        }
        .q-input {
            display:block; width:100%; height:56px; padding:0 16px; margin:0;
            background:transparent; border:1px solid #000; border-radius:0;
            font-size:16px; font-family:'Inter',sans-serif; color:#000;
            text-align:center; outline:none;
            -webkit-appearance:none; appearance:none; box-sizing:border-box;
        }
        .q-input:focus { border-width:2px; padding:0 15px; }
        @media (max-width:767px) {
            .q-input {
                height:72px !important; padding:0 20px !important;
                font-size:22px !important; font-weight:500 !important;
                letter-spacing:0.02em !important;
            }
            .q-input:focus { padding:0 19px !important; }
        }
        .q-input::placeholder { color:#999; }
        .q-status-msg {
            display:none; font-size:10px; letter-spacing:1px; color:#ef4444;
            font-weight:600; text-align:center; text-transform:uppercase; margin-top:4px;
        }

        #q-upload-row {
            display:flex; gap:20px; justify-content:center; flex-wrap:wrap;
        }
        #q-trigger-upload {
            width:140px; height:180px; border:1px solid #000; background:#f5f5f5;
            display:flex; flex-direction:column; align-items:center;
            justify-content:center; gap:10px; cursor:pointer; transition:0.3s;
        }
        #q-trigger-upload:hover { background:#ebebeb; }
        #q-trigger-upload i { font-size:32px; color:#000; }
        #q-trigger-upload span {
            font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
        }
        #q-pre-view { display:none; width:140px; height:180px; border:1px solid #000; overflow:hidden; }
        #q-pre-view img { width:100%; height:100%; object-fit:cover; }

        .q-terms-row {
            display:flex; align-items:flex-start; gap:10px; justify-content:center;
            font-size:12px; line-height:1.5; color:#64748b; cursor:pointer;
            max-width:340px; margin:0 auto; text-align:left;
        }
        .q-terms-row input { margin-top:3px; cursor:pointer; accent-color:#000; flex-shrink:0; }
        .q-terms-row a { color:#8b5cf6; text-decoration:underline; }

        .q-btn-black {
            width:100%; height:54px; background:#000; color:#fff;
            border:1px solid #000; border-radius:0;
            font-family:'Inter',sans-serif; font-weight:700; font-size:12px;
            letter-spacing:2px; text-transform:uppercase;
            cursor:pointer; transition:0.3s; box-sizing:border-box;
        }
        .q-btn-black:hover:not(:disabled) { background:#fff; color:#000; }
        .q-btn-black:disabled { background:#f5f5f5; color:#999; border-color:#e0e0e0; cursor:not-allowed; }
        .q-btn-outline {
            width:100%; height:54px; background:#fff; color:#000;
            border:1px solid #000; border-radius:0;
            font-family:'Inter',sans-serif; font-weight:700; font-size:12px;
            letter-spacing:2px; text-transform:uppercase;
            cursor:pointer; transition:0.3s; box-sizing:border-box;
        }
        .q-btn-outline:hover { background:#000; color:#fff; }

        @keyframes q-slide { from{transform:translateX(-100%)} to{transform:translateX(100%)} }
        @keyframes q-pulse-text { 0%,100%{opacity:0.4;transform:scale(0.98)} 50%{opacity:1;transform:scale(1)} }
        #q-loading-box { display:none; padding:60px 0; text-align:center; }
        #q-loading-box > div:first-child {
            font-weight:700; font-size:12px; letter-spacing:3px;
            text-transform:uppercase; margin-bottom:20px;
            animation:q-pulse-text 1.5s infinite ease-in-out;
        }
        .q-loading-bar { height:2px; background:#f5f5f5; width:100%; position:relative; overflow:hidden; }
        .q-loading-bar > div {
            position:absolute; top:0; left:0; height:100%; width:30%;
            background:#000; animation:q-slide 1.5s infinite linear;
        }

        #q-step-result { display:none; flex-direction:column; gap:24px; align-items:stretch; }
        #q-result-img-col { width:100%; border:1px solid #000; background:#f5f5f5; overflow:hidden; }
        #q-result-img-col img { width:100%; height:auto; display:block; }
        #q-result-actions-col { display:flex; flex-direction:column; gap:12px; }
        .q-res-title,.q-res-subtitle,.q-res-note { display:none; }
        .q-res-mobile-only {
            margin:10px 0 0; font-size:11px; font-weight:600;
            letter-spacing:1px; text-transform:uppercase;
            color:#666; cursor:pointer; text-decoration:underline; text-underline-offset:4px;
        }

        @media (min-width:768px) {
            .q-card-ia.is-result { width:820px !important; max-width:90vw !important; height:560px !important; }
            .q-card-ia.is-result #q-header-provador,
            .q-card-ia.is-result .q-powered-footer { display:none !important; }
            .q-card-ia.is-result .q-content-scroll {
                padding:0 !important; height:100% !important; overflow:hidden !important;
                display:flex !important; flex-direction:column !important; gap:0 !important;
            }
            .q-card-ia.is-result #q-step-result {
                display:flex !important; flex-direction:row !important;
                width:100%; height:100%; align-items:stretch; gap:0 !important;
            }
            .q-card-ia.is-result #q-result-img-col {
                width:45% !important; height:100% !important; margin:0 !important;
                border:none !important; border-right:1px solid #000 !important;
                position:relative !important; flex-shrink:0;
            }
            .q-card-ia.is-result #q-result-img-col img {
                position:absolute !important; top:0; left:0;
                width:100% !important; height:100% !important;
                object-fit:cover !important; object-position:top center !important;
            }
            .q-card-ia.is-result #q-result-actions-col {
                width:55% !important; height:100% !important; padding:40px !important;
                display:flex !important; flex-direction:column !important;
                justify-content:center !important; box-sizing:border-box; overflow-y:auto;
            }
            .q-card-ia.is-result .q-res-title {
                display:block !important; font-size:20px; font-weight:700;
                letter-spacing:2px; text-transform:uppercase; color:#000; margin-bottom:4px;
            }
            .q-card-ia.is-result .q-res-mobile-only { display:none !important; }
            .q-card-ia.is-result .q-close-ia { top:16px; right:16px; z-index:10; }
        }

        .q-powered-footer {
            background:#fff; padding:16px;
            display:flex; align-items:center; justify-content:center; gap:10px;
            flex-shrink:0; border-top:1px solid #f5f5f5; text-decoration:none;
        }
        .q-powered-footer span { font-size:10px; letter-spacing:1px; text-transform:uppercase; color:#666; }
        .q-quantic-logo { height:32px; filter:brightness(0); }
    `;

    // ─── 5. INIT ──────────────────────────────────────────────────────────────────
    function init() {

        // Fonts + Phosphor Icons
        var fl = document.createElement('link');
        fl.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        fl.rel = 'stylesheet';
        document.head.appendChild(fl);
        if (!window.phosphorIconsLoaded) {
            var ph = document.createElement('script');
            ph.src = 'https://unpkg.com/@phosphor-icons/web';
            document.head.appendChild(ph);
            window.phosphorIconsLoaded = true;
        }

        // Styles
        var st = document.createElement('style');
        st.textContent = styles;
        document.head.appendChild(st);

        // Modal HTML — built via DOM (no innerHTML with untrusted input)
        var modal = document.createElement('div');
        modal.id = 'q-modal-ia';

        var card = document.createElement('div');
        card.className = 'q-card-ia';

        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'q-close-ia';
        closeBtn.id = 'q-close-btn';
        closeBtn.textContent = '×';
        card.appendChild(closeBtn);

        var scroll = document.createElement('div');
        scroll.className = 'q-content-scroll';

        // Header
        var header = document.createElement('div');
        header.id = 'q-header-provador';
        var h1 = document.createElement('h1');
        h1.textContent = 'Provador Virtual';
        header.appendChild(h1);
        var marinaImg = document.createElement('img');
        marinaImg.src = MARINA_LOGO;
        marinaImg.alt = 'Centro Optico Marina';
        marinaImg.style.cssText = 'height:36px;width:auto;object-fit:contain;';
        marinaImg.onerror = function() { this.style.display = 'none'; };
        header.appendChild(marinaImg);
        scroll.appendChild(header);

        // Step upload
        var stepUpload = document.createElement('div');
        stepUpload.id = 'q-step-upload';

        var phoneRow = document.createElement('div');
        phoneRow.className = 'q-form-row';
        var phoneLbl = document.createElement('label');
        phoneLbl.textContent = 'Seu Celular';
        phoneRow.appendChild(phoneLbl);
        var phoneInput = document.createElement('input');
        phoneInput.type = 'tel';
        phoneInput.id = 'q-phone';
        phoneInput.className = 'q-input';
        phoneInput.placeholder = '(11) 99999-9999';
        phoneInput.maxLength = 15;
        phoneRow.appendChild(phoneInput);
        var phoneErr = document.createElement('div');
        phoneErr.id = 'q-phone-error';
        phoneErr.className = 'q-status-msg';
        phoneErr.textContent = 'Insira um número válido';
        phoneRow.appendChild(phoneErr);
        stepUpload.appendChild(phoneRow);

        var uploadRow = document.createElement('div');
        uploadRow.id = 'q-upload-row';
        var trigUpload = document.createElement('div');
        trigUpload.id = 'q-trigger-upload';
        var camIcon = document.createElement('i');
        camIcon.className = 'ph ph-camera-plus';
        trigUpload.appendChild(camIcon);
        var camSpan = document.createElement('span');
        camSpan.textContent = 'Enviar Foto';
        trigUpload.appendChild(camSpan);
        var realInput = document.createElement('input');
        realInput.type = 'file';
        realInput.id = 'q-real-input';
        realInput.accept = 'image/*';
        realInput.style.display = 'none';
        trigUpload.appendChild(realInput);
        uploadRow.appendChild(trigUpload);
        var preView = document.createElement('div');
        preView.id = 'q-pre-view';
        var preImg = document.createElement('img');
        preImg.id = 'q-pre-img';
        preView.appendChild(preImg);
        uploadRow.appendChild(preView);
        stepUpload.appendChild(uploadRow);

        var termsLabel = document.createElement('label');
        termsLabel.className = 'q-terms-row';
        var termsCheck = document.createElement('input');
        termsCheck.type = 'checkbox';
        termsCheck.id = 'q-accept-terms';
        termsLabel.appendChild(termsCheck);
        var termsSpan = document.createElement('span');
        termsSpan.textContent = 'Ao continuar, concordo com os ';
        var termsLink = document.createElement('a');
        termsLink.href = 'http://provoulevou.com.br/termos.html';
        termsLink.target = '_blank';
        termsLink.textContent = 'Termos e Condições';
        termsSpan.appendChild(termsLink);
        termsLabel.appendChild(termsSpan);
        stepUpload.appendChild(termsLabel);

        var genBtn = document.createElement('button');
        genBtn.className = 'q-btn-black';
        genBtn.id = 'q-btn-generate';
        genBtn.disabled = true;
        genBtn.textContent = 'Provar óculos';
        stepUpload.appendChild(genBtn);
        scroll.appendChild(stepUpload);

        // Loading
        var loadingBox = document.createElement('div');
        loadingBox.id = 'q-loading-box';
        loadingBox.style.display = 'none';
        var loadingTxt = document.createElement('div');
        loadingTxt.textContent = 'Gerando Prova Virtual...';
        loadingBox.appendChild(loadingTxt);
        var loadingBar = document.createElement('div');
        loadingBar.className = 'q-loading-bar';
        var loadingFill = document.createElement('div');
        loadingBar.appendChild(loadingFill);
        loadingBox.appendChild(loadingBar);
        scroll.appendChild(loadingBox);

        // Result
        var stepResult = document.createElement('div');
        stepResult.id = 'q-step-result';
        var resultImgCol = document.createElement('div');
        resultImgCol.id = 'q-result-img-col';
        var finalImg = document.createElement('img');
        finalImg.id = 'q-final-view-img';
        resultImgCol.appendChild(finalImg);
        var resultActCol = document.createElement('div');
        resultActCol.id = 'q-result-actions-col';
        var resTitle = document.createElement('span');
        resTitle.className = 'q-res-title';
        resTitle.textContent = 'Provador Virtual';
        resultActCol.appendChild(resTitle);
        var backBtn = document.createElement('button');
        backBtn.className = 'q-btn-outline';
        backBtn.id = 'q-btn-back';
        backBtn.textContent = 'Voltar ao Produto';
        resultActCol.appendChild(backBtn);
        var retryBtn = document.createElement('p');
        retryBtn.className = 'q-res-mobile-only';
        retryBtn.id = 'q-retry-btn';
        retryBtn.textContent = 'Tentar outra foto';
        resultActCol.appendChild(retryBtn);
        stepResult.appendChild(resultImgCol);
        stepResult.appendChild(resultActCol);
        scroll.appendChild(stepResult);

        card.appendChild(scroll);

        // Footer
        var footer = document.createElement('a');
        footer.href = 'https://provoulevou.com.br';
        footer.target = '_blank';
        footer.className = 'q-powered-footer';
        var footerSpan = document.createElement('span');
        footerSpan.textContent = 'Powered by';
        footer.appendChild(footerSpan);
        var footerLogo = document.createElement('img');
        footerLogo.src = PROVOU_LOGO;
        footerLogo.className = 'q-quantic-logo';
        footerLogo.alt = 'Provou Levou';
        footer.appendChild(footerLogo);
        card.appendChild(footer);

        modal.appendChild(card);
        document.body.appendChild(modal);

        // ── Trigger button (stamp na foto) ────────────────────────────────────────
        var openBtn = document.createElement('button');
        openBtn.className = 'q-btn-trigger-ia';
        openBtn.id = 'q-open-ia';
        openBtn.setAttribute('aria-label', 'Abrir Provador Virtual');
        var stampImg = document.createElement('img');
        stampImg.src = STAMP_SRC;
        stampImg.alt = 'Provador Virtual';
        stampImg.style.cssText = 'width:100%;height:100%;object-fit:contain;';
        openBtn.appendChild(stampImg);

        if (BUTTON_MODE === 'image' || BUTTON_MODE === 'both') {
            var imgSels = [
                '.frame_slider_principal', '.carousel_gallery', '.product_gallery',
                '.produto-imagem', '.product-image', '.product-images',
                '.image-show', '.box-gallery', '.product-colum-left',
                '.product__media-wrapper', '.product-gallery__media', '.product__media',
                '.product-image-main', '.product-media-container',
                '.product__media-item', '.product-gallery', '.product-single__media', '.media-gallery'
            ];
            var placed = false;
            for (var i = 0; i < imgSels.length; i++) {
                var imgEl = document.querySelector(imgSels[i]);
                if (imgEl) {
                    if (window.getComputedStyle(imgEl).position === 'static') imgEl.style.position = 'relative';
                    imgEl.appendChild(openBtn);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                openBtn.style.cssText = 'position:fixed;bottom:100px;right:20px;z-index:100;width:72px;height:72px;background:none;border:none;padding:0;cursor:pointer;';
                document.body.appendChild(openBtn);
            }
        }

        // ── Inline button (acima do comprar) ──────────────────────────────────────
        if (BUTTON_MODE === 'buy' || BUTTON_MODE === 'both') {
            var inlineBtn = document.createElement('button');
            inlineBtn.className = 'q-btn-inline-provador';
            inlineBtn.type = 'button';
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '1.5');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
            var p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p1.setAttribute('d', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2');
            var c1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c1.setAttribute('cx', '12'); c1.setAttribute('cy', '7'); c1.setAttribute('r', '4');
            svg.appendChild(p1); svg.appendChild(c1);
            inlineBtn.appendChild(svg);
            inlineBtn.appendChild(document.createTextNode('Provador Virtual'));

            inlineBtn.addEventListener('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                currentProduct = detectProduct(document.querySelector('h1.product-name, h1.product__title, .product-single__title, h1')?.innerText || document.title);
                openModal();
            });

            var buySels = [
                '.frame_product_action_button', '[data-buy-action-button]', '.buy_action_button',
                '.product-buy-button', '.wrapper-btn-buy', '.button-buy', '.buy-button', '#buy-button',
                '.botao-comprar', '#botao-comprar', '.product-buy', '.btn-buy',
                'button[name="buy"]', 'input[name="buy"]',
                '.product-colum-right .box-buy', '.box-buy',
                '.product-action', '.product-actions', '.add-to-cart', '#addToCart'
            ];
            for (var j = 0; j < buySels.length; j++) {
                var bel = document.querySelector(buySels[j]);
                if (bel) { bel.parentNode.insertBefore(inlineBtn, bel); break; }
            }

            if (BUTTON_MODE === 'buy') {
                openBtn.style.display = 'none';
                document.body.appendChild(openBtn);
            }
        }

        applyDesignToButtons();

        // ── Eventos ───────────────────────────────────────────────────────────────
        function openModal()  { modal.style.display = 'flex'; lockBodyScroll(); }
        function closeModal() { modal.style.display = 'none'; unlockBodyScroll(); }

        openBtn.onclick = function(e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            currentProduct = detectProduct(document.querySelector('h1.product-name, h1.product__title, .product-single__title, h1')?.innerText || document.title);
            openModal();
        };

        closeBtn.onclick = () => closeModal();
        backBtn.onclick  = () => closeModal();
        modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });

        retryBtn.onclick = function() {
            stepResult.style.display = 'none';
            stepUpload.style.display = 'flex';
            card.classList.remove('is-result');
            userPhoto = null;
            preView.style.display = 'none';
            checkFields();
        };

        trigUpload.onclick = () => realInput.click();

        phoneInput.addEventListener('input', function(e) {
            var x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
            checkFields();
        });

        var userPhoto = null;

        function checkFields() {
            var nums = phoneInput.value.replace(/\D/g, '');
            var phoneOk = nums.length >= 10 && nums.length <= 11;
            phoneErr.style.display = (phoneInput.value.length > 0 && !phoneOk) ? 'block' : 'none';
            phoneInput.style.borderColor = (phoneInput.value.length > 0 && !phoneOk) ? '#ef4444' : '';
            genBtn.disabled = !(userPhoto && phoneOk && termsCheck.checked);
        }

        termsCheck.onchange = checkFields;

        realInput.onchange = function(e) {
            userPhoto = e.target.files[0];
            if (userPhoto) {
                var rd = new FileReader();
                rd.onload = function(ev) {
                    preImg.src = ev.target.result;
                    preView.style.display = 'block';
                    checkFields();
                };
                rd.readAsDataURL(userPhoto);
            }
        };

        genBtn.onclick = async function() {
            if (!userPhoto) return;
            var keyToUse = window.PROVOU_LEVOU_API_KEY;
            if (!keyToUse) { alert('Erro: API Key não configurada.'); return; }

            var prodImgTag = document.querySelector(
                '.frame_slider_principal .swiper-slide-active img, ' +
                '.frame_slider_principal .swiper-slide:first-child img.swiper-lazy, ' +
                '.frame_slider_principal img[src]:not([src=""]), ' +
                '.carousel_gallery img[src]:not([src=""]), ' +
                '.image-show .box-img.active .zoom img, ' +
                '.image-show img, .product__media img'
            );
            var prodImg = prodImgTag
                ? (prodImgTag.dataset.src || prodImgTag.dataset.lazy || prodImgTag.src)
                : (document.querySelector('meta[property="og:image"]')?.content || '');
            var prodName = document.querySelector('h1.product-name, h1.product__title, .product-single__title, h1')?.innerText || document.title;

            stepUpload.style.display = 'none';
            loadingBox.style.display = 'block';

            try {
                var fd = new FormData();
                fd.append('person_image', userPhoto, 'person.jpg');
                fd.append('whatsapp', '55' + phoneInput.value.replace(/\D/g, ''));
                fd.append('phone_raw', phoneInput.value);
                fd.append('product_name', prodName);
                fd.append('product_type', currentProduct.category);
                fd.append('product_fit', currentProduct.fit);
                fd.append('api_key', keyToUse);
                fd.append('height', '');
                fd.append('weight', '');

                if (prodImg) {
                    try {
                        var b = await fetch(prodImg).then(function(r) { return r.blob(); });
                        fd.append('product_image', b, 'product.jpg');
                    } catch (_) {}
                }

                var res = await fetch(WEBHOOK_PROVA, { method: 'POST', body: fd });

                var ct = res.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    var data = await res.json();
                    if (data.error) {
                        loadingBox.style.display = 'none';
                        stepUpload.style.display = 'flex';
                        alert(data.error.includes('vencida ou inativa') ? 'App desativado nesta loja' : data.error);
                        return;
                    }
                }

                if (res.ok) {
                    var blob = await res.blob();
                    loadingBox.style.display = 'none';
                    finalImg.src = URL.createObjectURL(blob);
                    card.classList.add('is-result');
                    stepResult.style.display = 'flex';
                } else if (res.status === 401 || res.status === 403) {
                    loadingBox.style.display = 'none';
                    stepUpload.style.display = 'flex';
                    alert('App desativado nesta loja');
                } else {
                    throw new Error('HTTP ' + res.status);
                }
            } catch (e) {
                loadingBox.style.display = 'none';
                stepUpload.style.display = 'flex';
                alert('Ocorreu um erro ao processar sua imagem. Tente novamente.');
            }
        };
    }

    // ─── 6. DETECÇÃO DE PÁGINA DE PRODUTO (Tray) ─────────────────────────────────
    function runWhenReady() {
        var path = window.location.pathname;
        var isProduct =
            window.__MC_FORCE_INIT__ === true ||
            path.includes('/produto/') || path.includes('/p/') || path.includes('/products/') ||
            document.getElementById('product-container') !== null ||
            document.getElementById('form_comprar') !== null ||
            document.querySelector('.botao-comprar') !== null ||
            document.querySelector('.product-colum-right') !== null ||
            document.querySelector('.page-product') !== null ||
            document.querySelector('.frame_product_action_button') !== null ||
            document.querySelector('h1.product-name') !== null;

        if (isProduct) {
            init();
        } else {
            var tries = 0;
            var iv = setInterval(function() {
                tries++;
                if (document.getElementById('form_comprar') !== null ||
                    document.querySelector('.frame_product_action_button') !== null ||
                    document.querySelector('h1.product-name') !== null) {
                    clearInterval(iv);
                    init();
                } else if (tries >= 10) {
                    clearInterval(iv);
                }
            }, 500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runWhenReady);
    } else {
        runWhenReady();
    }

})();
