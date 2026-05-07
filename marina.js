(function () {

    // ─── 0. CONFIG — Centro Optico Marina (Tray store 1269258) ───────────────────
    const apiKey = 'pl_live_2e8a1216deb73095ebfc5be077e83801a0c95ecaa0f00258d352857fe610f03a';
    window.PROVOU_LEVOU_API_KEY = apiKey;

    let BUTTON_MODE = 'both';
    const STORE_ID = '1269258';
    const API_HOST = 'https://lojista.provoulevou.com.br';
    const WEBHOOK_PROVA = 'https://n8n.segredosdodrop.com/webhook/gerador-oculos';
    const MARINA_LOGO = 'https://images.tcdn.com.br/img/img_prod/1269258/1701713968_marina_centro_ptico.png';
    const PROVOU_LOGO = 'https://i.ibb.co/MD3B4FQf/Logo-provou-preto-1.png';
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
        /* ── Fontes ── */
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        :root {
            --c-bg: #ffffff;
            --c-surface: #f0fafa;
            --c-ink: #111111;
            --c-muted: #999;
            --c-line: #b8dde8;
            --c-accent: #111111;
            --c-danger: #cc3333;
            --font-display: 'Bebas Neue', sans-serif;
            --font-body: 'DM Sans', sans-serif;
        }

        /* ── Trigger (selo sobre foto) ── */
        @keyframes q-shake { 0%,50%,100%{transform:rotate(0deg)} 10%,30%{transform:rotate(-10deg)} 20%,40%{transform:rotate(10deg)} }
        .q-btn-trigger-ia {
            position: absolute; top: 14px; right: 70px; z-index: 100;
            background: none; border: none; padding: 0; cursor: pointer;
            width: 70px; height: 70px;
            display: flex; align-items: center; justify-content: center;
            filter: drop-shadow(0 3px 10px rgba(0,0,0,0.22));
            animation: q-shake 3s infinite;
            transition: filter 0.2s;
        }
        .q-btn-trigger-ia:hover { filter: drop-shadow(0 6px 18px rgba(0,0,0,0.32)); }
        .q-btn-trigger-ia img { width: 100%; height: 100%; object-fit: contain; }
        @media (min-width: 768px) { .q-btn-trigger-ia { width: 70px; height: 70px; } }

        /* ── Inline button ── */
        .q-btn-inline-provador {
            display: flex; align-items: center; justify-content: center; gap: 7px;
            width: 100%; padding: 13px 16px;
            background: transparent; color: var(--c-ink);
            border: 1.5px solid var(--c-ink); border-radius: 0;
            font-family: 'Work Sans', var(--font-body), sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;
            cursor: pointer; transition: background 0.25s, color 0.25s;
            margin-bottom: 10px; box-sizing: border-box;
        }
        .q-btn-inline-provador:hover { background: var(--c-ink); color: #fff; }
        .q-btn-inline-provador svg { width: 14px; height: 14px; flex-shrink: 0; }

        /* ── Modal overlay ── */
        @keyframes q-modal-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        #q-modal-ia {
            display: none; position: fixed; inset: 0; z-index: 999999;
            background: rgba(230,248,252,0.97);
            font-family: var(--font-body);
            overflow-y: auto; box-sizing: border-box;
        }
        #q-modal-ia * { box-sizing: border-box; }

        /* ── Card ── */
        .q-card-ia {
            width: 100%; min-height: 100vh;
            background: var(--c-bg); color: var(--c-ink);
            display: flex; flex-direction: column; position: relative;
            animation: q-modal-in 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        @media (min-width: 768px) {
            #q-modal-ia { display: none; align-items: center; justify-content: center; }
            .q-card-ia {
                width: 440px; max-width: 92vw; min-height: auto;
                max-height: 96vh; border: none;
                box-shadow: 0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
                overflow: hidden;
            }
        }

        /* ── Close ── */
        .q-close-ia {
            position: absolute; top: 18px; right: 18px;
            background: none; border: none;
            font-size: 26px; font-weight: 300; color: var(--c-muted);
            cursor: pointer; z-index: 10; line-height: 1; padding: 4px 6px;
            transition: color 0.2s;
        }
        .q-close-ia:hover { color: var(--c-ink); }

        /* ── Content scroll ── */
        .q-content-scroll {
            flex: 1; padding: 0; overflow-y: auto;
            text-align: left; display: flex; flex-direction: column;
        }
        .q-content-scroll::-webkit-scrollbar { width: 3px; }
        .q-content-scroll::-webkit-scrollbar-thumb { background: var(--c-line); }

        @media (max-width: 767px) {
            #q-modal-ia { display:none; overflow-y:auto; align-items:flex-start; justify-content:center; }
            #q-modal-ia[style*="flex"] { display:flex !important; }
            .q-card-ia { width:100%; border:none; margin:0; min-height:100svh; }
            .q-content-scroll { flex: 1; }
        }

        /* ── Header strip ── */
        #q-header-provador {
            padding: 28px 28px 0;
            display: flex; flex-direction: column; align-items: center;
            text-align: center; gap: 10px;
            border-bottom: 1px solid var(--c-line);
            padding-bottom: 22px; margin-bottom: 0;
        }
        #q-header-provador h1 {
            margin: 0;
            font-family: var(--font-display);
            font-size: 28px; letter-spacing: 4px;
            color: var(--c-ink); text-transform: uppercase;
            font-weight: 400; line-height: 1;
        }

        /* ── Main step ── */
        #q-step-photo {
            display: flex; flex-direction: column; padding: 28px 28px 32px;
            gap: 0; align-items: stretch;
        }

        /* ── Labels & inputs ── */
        .q-field-label {
            display: block; font-size: 10px; font-weight: 600;
            letter-spacing: 2px; text-transform: uppercase;
            color: var(--c-muted); margin-bottom: 8px;
        }
        .q-phone-wrap { margin-bottom: 28px; }
        .q-input {
            display: block; width: 100%; height: 52px;
            padding: 0 16px; margin: 0;
            background: var(--c-surface); border: 1.5px solid transparent;
            border-bottom: 1.5px solid var(--c-line); border-radius: 0;
            font-size: 16px; font-family: var(--font-body); font-weight: 400;
            color: var(--c-ink); outline: none;
            -webkit-appearance: none; appearance: none; transition: border-color 0.2s;
        }
        .q-input:focus { border-color: var(--c-ink); background: #fff; }
        .q-input::placeholder { color: #bbb; }
        .q-status-msg {
            display: none; font-size: 11px; color: var(--c-danger);
            font-weight: 500; margin-top: 6px; letter-spacing: 0.3px;
        }

        /* ── Section label ── */
        .q-section-label {
            font-family: var(--font-display);
            font-size: 20px; letter-spacing: 3px; text-transform: uppercase;
            color: var(--c-ink); margin: 0 0 14px; font-weight: 400;
            text-align: center;
        }

        /* ── Tip ── */
        .q-tip-box {
            display: flex; align-items: center; gap: 9px;
            background: var(--c-surface);
            padding: 11px 14px; margin-bottom: 20px;
            font-size: 11.5px; color: var(--c-muted); line-height: 1.45;
            border-radius: 6px;
        }
        .q-tip-box i { color: var(--c-ink); font-size: 15px; flex-shrink: 0; }

        /* ── Face frame ── */
        @keyframes q-frame-pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        .q-face-frame {
            position: relative; width: 200px; height: 260px;
            margin: 0 auto 24px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden; background: var(--c-surface);
            border-radius: 4px;
            transition: transform 0.2s;
        }
        .q-face-frame:hover { transform: scale(1.015); }
        .q-face-frame img { width: 100%; height: 100%; object-fit: cover; display: none; }
        .q-face-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .q-face-placeholder i { font-size: 72px; color: #d0d0d0; }
        /* Corner marks — clean editorial style */
        .q-face-corner {
            position: absolute; width: 20px; height: 20px;
            border-color: var(--c-ink); border-style: solid;
            transition: border-color 0.2s;
        }
        .q-face-corner-tl { top: 0; left: 0; border-width: 2px 0 0 2px; }
        .q-face-corner-tr { top: 0; right: 0; border-width: 2px 2px 0 0; }
        .q-face-corner-bl { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
        .q-face-corner-br { bottom: 0; right: 0; border-width: 0 2px 2px 0; }

        /* ── Upload buttons ── */
        .q-upload-btns {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 8px; width: 100%; margin-bottom: 24px;
        }
        .q-upload-btn {
            display: flex; align-items: center; justify-content: center; gap: 7px;
            padding: 12px 8px;
            border: 1.5px solid var(--c-line);
            background: transparent; color: var(--c-ink);
            font-family: var(--font-body); font-size: 12px; font-weight: 500;
            cursor: pointer; transition: border-color 0.2s, background 0.2s; border-radius: 4px;
        }
        .q-upload-btn:hover { border-color: var(--c-ink); background: var(--c-surface); }
        .q-upload-btn i { font-size: 16px; }

        /* ── Terms ── */
        .q-terms-row {
            display: flex; align-items: flex-start; gap: 10px;
            font-size: 11.5px; color: var(--c-muted); cursor: pointer;
            line-height: 1.5; margin-bottom: 20px;
            justify-content: center; text-align: center;
        }
        .q-terms-row input { margin-top: 3px; cursor: pointer; accent-color: var(--c-ink); flex-shrink: 0; }
        .q-terms-row a { color: var(--c-ink); text-decoration: underline; text-underline-offset: 2px; }

        /* ── CTA buttons ── */
        .q-btn-black {
            width: 100%; height: 52px;
            background: var(--c-ink); color: #fff;
            border: none; border-radius: 0;
            font-family: var(--font-display); font-size: 17px;
            letter-spacing: 3px; text-transform: uppercase;
            cursor: pointer; transition: opacity 0.2s; box-sizing: border-box;
        }
        .q-btn-black:hover:not(:disabled) { opacity: 0.82; }
        .q-btn-black:disabled { background: #ccc; cursor: not-allowed; }
        .q-btn-outline {
            width: 100%; height: 52px;
            background: transparent; color: var(--c-ink);
            border: 1.5px solid var(--c-line); border-radius: 0;
            font-family: var(--font-display); font-size: 17px;
            letter-spacing: 3px; text-transform: uppercase;
            cursor: pointer; transition: border-color 0.2s, background 0.2s; box-sizing: border-box;
        }
        .q-btn-outline:hover { border-color: var(--c-ink); background: var(--c-surface); }

        /* ── PIX screen ── */
        #q-step-pix {
            display: none; text-align: center;
            padding: 36px 28px; flex-direction: column; gap: 16px; align-items: center;
        }
        #q-step-pix h2 {
            font-family: var(--font-display); font-size: 24px;
            letter-spacing: 3px; text-transform: uppercase; margin: 0; font-weight: 400;
        }
        .q-pix-subtitle { font-size: 13px; color: var(--c-muted); margin: 0; line-height: 1.6; }
        .q-pix-qr { width: 180px; height: 180px; border: 1px solid var(--c-line); padding: 6px; margin: 0 auto; }
        .q-pix-qr img { width: 100%; height: 100%; }
        .q-pix-copiacola { display: flex; gap: 8px; width: 100%; max-width: 320px; margin: 0 auto; }
        .q-pix-copiacola input {
            flex: 1; height: 40px; padding: 0 12px; border: 1px solid var(--c-line);
            background: var(--c-surface); font-size: 11px; font-family: var(--font-body);
            outline: none; min-width: 0;
        }
        .q-pix-copiacola button {
            height: 40px; padding: 0 14px; background: var(--c-ink); color: #fff;
            border: none; font-size: 10px; font-weight: 600; letter-spacing: 1px;
            text-transform: uppercase; cursor: pointer;
        }
        .q-pix-status { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--c-muted); }
        @keyframes q-pix-pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        .q-pix-waiting { animation: q-pix-pulse 1.5s infinite ease-in-out; color: #d97706; }
        .q-pix-approved { color: #16a34a; }
        .q-pix-cancel { font-size: 11px; color: var(--c-muted); text-decoration: underline; cursor: pointer; margin-top: 4px; }

        /* ── Loading ── */
        @keyframes q-slide { from{transform:translateX(-100%)} to{transform:translateX(100%)} }
        @keyframes q-alt-show { 0%,5%{opacity:0;transform:translateY(6px)} 15%,45%{opacity:1;transform:translateY(0)} 55%,100%{opacity:0;transform:translateY(-6px)} }
        @keyframes q-alt-hide { 0%,55%{opacity:0;transform:translateY(6px)} 65%,95%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-6px)} }
        #q-loading-box {
            display: none; padding: 28px;
            text-align: center; flex: 1; flex-direction: column;
            align-items: center; justify-content: center; min-height: 60vh;
        }
        .q-loading-texts {
            position: relative; height: 36px; width: 100%;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 24px;
        }
        .q-loading-t1, .q-loading-t2 {
            position: absolute; width: 100%;
            display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .q-loading-t1 {
            font-family: var(--font-display); font-size: 18px; letter-spacing: 4px;
            text-transform: uppercase; color: var(--c-ink);
            animation: q-alt-show 3.6s ease-in-out infinite;
        }
        .q-loading-t2 {
            animation: q-alt-hide 3.6s ease-in-out infinite;
            text-decoration: none; opacity: 0;
        }
        .q-loading-t2 span {
            font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
            color: var(--c-muted); font-family: var(--font-body);
        }
        .q-loading-t2 img { height: 26px; width: auto; opacity: 0.7; }
        .q-loading-bar { height: 1px; background: var(--c-line); width: 100%; position: relative; overflow: hidden; }
        .q-loading-bar > div {
            position: absolute; top: 0; left: 0; height: 100%; width: 35%;
            background: var(--c-ink); animation: q-slide 1.4s infinite linear;
        }

        /* ── Result ── */
        #q-step-result { display: none; flex-direction: column; gap: 0; align-items: stretch; }

        .q-res-title {
            display: block;
            font-family: var(--font-display); font-size: 18px;
            letter-spacing: 3px; text-transform: uppercase;
            color: var(--c-ink); padding: 20px 28px 16px; margin: 0;
            border-bottom: 1px solid var(--c-line);
            text-align: center;
        }
        .q-res-subtitle, .q-res-note { display: none; }

        #q-result-img-col {
            width: 100%; max-height: 72vh; background: var(--c-surface);
            overflow: hidden; display: flex; align-items: center; justify-content: center;
        }
        #q-result-img-col img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }

        #q-result-actions-col {
            display: flex; flex-direction: column; gap: 10px;
            padding: 20px 28px 0;
        }
        .q-res-mobile-only { margin: 0; }

        /* ── Related products ── */
        #q-related-products { padding: 0 28px 28px; }
        #q-related-products h4 {
            font-family: var(--font-display); font-size: 13px;
            letter-spacing: 3px; text-transform: uppercase;
            color: var(--c-muted); margin: 20px 0 12px; font-weight: 400;
        }
        .q-related-grid {
            display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
        }
        .q-related-grid::-webkit-scrollbar { display: none; }
        .q-related-card {
            flex: 0 0 calc(33.333% - 7px); min-width: 88px;
            text-decoration: none; color: var(--c-ink);
            display: flex; flex-direction: column; gap: 6px;
        }
        .q-related-card img {
            width: 100%; aspect-ratio: 1/1; object-fit: cover;
            border: 1px solid var(--c-line); display: block; border-radius: 3px;
        }
        .q-related-card-name {
            font-size: 10px; font-weight: 500; line-height: 1.4; color: var(--c-ink);
            overflow: hidden; display: -webkit-box;
            -webkit-line-clamp: 2; -webkit-box-orient: vertical;
        }

        /* Desktop result split */
        @media (min-width: 768px) {
            .q-card-ia.is-result { width: 780px !important; max-width: 90vw !important; max-height: 92vh !important; }
                /* .q-powered-footer always visible */
            .q-card-ia.is-result .q-content-scroll {
                padding: 0 !important; overflow-y: auto !important;
                display: flex !important; flex-direction: column !important;
            }
            .q-card-ia.is-result #q-step-result {
                display: flex !important; flex-direction: row !important;
                flex-wrap: wrap !important; width: 100%; align-items: stretch; gap: 0;
            }
            .q-card-ia.is-result .q-res-title {
                flex-basis: 100%; order: -1;
                font-size: 16px; letter-spacing: 3px;
                padding: 16px 24px; border-bottom: 1px solid var(--c-line);
            }
            .q-card-ia.is-result #q-result-img-col {
                width: 44% !important; min-height: 360px !important;
                border-right: 1px solid var(--c-line); flex-shrink: 0;
            }
            .q-card-ia.is-result #q-result-img-col img {
                width: 100% !important; height: 100% !important;
                object-fit: cover !important; object-position: top center !important;
            }
            .q-card-ia.is-result #q-result-actions-col {
                width: 56% !important; padding: 28px 24px !important;
                display: flex !important; flex-direction: column !important;
                justify-content: flex-start; gap: 12px;
                overflow-y: auto;
            }
            .q-card-ia.is-result .q-btn-black,
            .q-card-ia.is-result .q-btn-outline { height: 58px !important; font-size: 15px !important; }
            .q-card-ia.is-result #q-related-products { padding: 0; margin-top: 4px; }
            .q-card-ia.is-result .q-res-mobile-only { display: flex !important; }
        }

        /* ── Error screen ── */
        #q-step-error {
            display: none; flex-direction: column; gap: 20px;
            align-items: center; text-align: center;
            padding: 52px 28px;
        }
        #q-step-error h2 {
            font-family: var(--font-display); font-size: 22px;
            letter-spacing: 3px; text-transform: uppercase; margin: 0; font-weight: 400;
        }
        #q-step-error p { font-size: 13px; color: var(--c-muted); margin: 0; line-height: 1.6; }

        /* ── Footer ── */
        .q-powered-footer {
            background: var(--c-surface); padding: 14px 20px;
            display: flex; align-items: center; justify-content: center; gap: 9px;
            flex-shrink: 0; border-top: 1px solid var(--c-line); text-decoration: none;
        }
        .q-powered-footer span { font-size: 9.5px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--c-muted); }
        /* ── Marina: teal #6dadbc + pink #e54e88 ── */
        :root { --c-surface: #f0fafa; --c-line: #b8dde8; }
        .q-btn-black { background: #6dadbc !important; }
        .q-btn-black:hover:not(:disabled) { background: #5b9daa !important; }
        .q-btn-black:disabled { background: #b8dde8 !important; }
        .q-face-corner { border-color: #6dadbc !important; }
        .q-terms-row a { color: #e54e88 !important; }
        .q-upload-btn:hover { border-color: #6dadbc; color: #6dadbc; }
        .q-btn-outline:hover { border-color: #6dadbc; color: #6dadbc; }
        .q-input:focus { border-color: #6dadbc !important; }
        .q-loading-bar > div { background: #6dadbc !important; }
        .q-tip-box { background: #e8f7fa !important; border-left-color: #6dadbc !important; color: #2d6b7a !important; }
        .q-tip-box i { color: #6dadbc !important; }
        #q-related-products h4 { color: #6dadbc !important; }
        .q-quantic-logo { height: 20px; opacity: 0.7; }
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
        marinaImg.style.cssText = 'height:28px;width:auto;object-fit:contain;';
        marinaImg.onerror = function() { this.style.display = 'none'; };
        header.appendChild(marinaImg);
        scroll.appendChild(header);

        // Step upload — new design with face frame
        var stepUpload = document.createElement('div');
        stepUpload.id = 'q-step-photo';

        // Phone
        var phoneWrap = document.createElement('div');
        phoneWrap.className = 'q-phone-wrap';
        var phoneLbl = document.createElement('span');
        phoneLbl.className = 'q-field-label';
        phoneLbl.textContent = 'Seu WhatsApp';
        phoneWrap.appendChild(phoneLbl);
        var phoneInput = document.createElement('input');
        phoneInput.type = 'tel';
        phoneInput.id = 'q-phone';
        phoneInput.className = 'q-input';
        phoneInput.placeholder = '(11) 99999-9999';
        phoneInput.maxLength = 15;
        phoneWrap.appendChild(phoneInput);
        var phoneErr = document.createElement('div');
        phoneErr.id = 'q-phone-error';
        phoneErr.className = 'q-status-msg';
        phoneErr.textContent = 'Insira um número válido';
        phoneWrap.appendChild(phoneErr);
        stepUpload.appendChild(phoneWrap);

        // Section label
        var sectionLbl = document.createElement('p');
        sectionLbl.className = 'q-section-label';
        sectionLbl.textContent = 'Envie sua foto';
        stepUpload.appendChild(sectionLbl);

        // Tip box
        var tipBox = document.createElement('div');
        tipBox.className = 'q-tip-box';
        var tipIcon = document.createElement('i');
        tipIcon.className = 'ph ph-lightbulb';
        var tipSpan = document.createElement('span');
        tipSpan.textContent = 'Use uma foto nítida, de frente, com boa iluminação.';
        tipBox.appendChild(tipIcon);
        tipBox.appendChild(tipSpan);
        stepUpload.appendChild(tipBox);

        // Face frame
        var faceFrame = document.createElement('div');
        faceFrame.className = 'q-face-frame';
        faceFrame.id = 'q-face-frame';
        ['tl','tr','bl','br'].forEach(function(c) {
            var corner = document.createElement('div');
            corner.className = 'q-face-corner q-face-corner-' + c;
            faceFrame.appendChild(corner);
        });
        var preImg = document.createElement('img');
        preImg.id = 'q-pre-img';
        preImg.alt = 'Sua foto';
        faceFrame.appendChild(preImg);
        var facePlaceholder = document.createElement('div');
        facePlaceholder.className = 'q-face-placeholder';
        facePlaceholder.id = 'q-face-placeholder';
        var faceIcon = document.createElement('i');
        faceIcon.className = 'ph ph-user-circle';
        faceIcon.style.cssText = 'font-size:80px;color:#d4d4d4;';
        facePlaceholder.appendChild(faceIcon);
        faceFrame.appendChild(facePlaceholder);
        stepUpload.appendChild(faceFrame);

        // Upload buttons
        var uploadBtns = document.createElement('div');
        uploadBtns.className = 'q-upload-btns';
        var cameraBtn = document.createElement('button');
        cameraBtn.className = 'q-upload-btn';
        cameraBtn.id = 'q-btn-camera';
        cameraBtn.type = 'button';
        var camI = document.createElement('i');
        camI.className = 'ph ph-camera';
        cameraBtn.appendChild(camI);
        cameraBtn.appendChild(document.createTextNode(' Tirar foto'));
        var galleryBtn = document.createElement('button');
        galleryBtn.className = 'q-upload-btn';
        galleryBtn.id = 'q-btn-gallery';
        galleryBtn.type = 'button';
        var galI = document.createElement('i');
        galI.className = 'ph ph-image';
        galleryBtn.appendChild(galI);
        galleryBtn.appendChild(document.createTextNode(' Da galeria'));
        var cameraInput = document.createElement('input');
        cameraInput.type = 'file';
        cameraInput.id = 'q-camera-input';
        cameraInput.accept = 'image/*';
        cameraInput.setAttribute('capture', 'user');
        cameraInput.style.display = 'none';
        var galleryInput = document.createElement('input');
        galleryInput.type = 'file';
        galleryInput.id = 'q-gallery-input';
        galleryInput.accept = 'image/*';
        galleryInput.style.display = 'none';
        uploadBtns.appendChild(cameraBtn);
        uploadBtns.appendChild(galleryBtn);
        uploadBtns.appendChild(cameraInput);
        uploadBtns.appendChild(galleryInput);
        stepUpload.appendChild(uploadBtns);

        // realInput alias for PIX compat
        var realInput = galleryInput;
        var trigUpload = { onclick: null }; // stub for compat

        var termsLabel = document.createElement('label');
        termsLabel.className = 'q-terms-row';
        termsLabel.style.cssText = 'margin-top:20px;margin-bottom:20px;';
        var termsCheck = document.createElement('input');
        termsCheck.type = 'checkbox';
        termsCheck.id = 'q-accept-terms';
        termsLabel.appendChild(termsCheck);
        var termsSpan = document.createElement('span');
        termsSpan.textContent = 'Concordo com os ';
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
        // Alternating texts
        var loadingTexts = document.createElement('div');
        loadingTexts.className = 'q-loading-texts';
        var loadingT1 = document.createElement('div');
        loadingT1.className = 'q-loading-t1';
        loadingT1.textContent = 'Gerando Prova Virtual...';
        var loadingT2 = document.createElement('a');
        loadingT2.className = 'q-loading-t2';
        loadingT2.href = 'https://provoulevou.com.br';
        loadingT2.target = '_blank';
        var t2Span = document.createElement('span');
        t2Span.textContent = 'Powered by';
        var t2Img = document.createElement('img');
        t2Img.src = 'https://i.ibb.co/MD3B4FQf/Logo-provou-preto-1.png';
        t2Img.alt = 'Provou Levou';
        loadingT2.appendChild(t2Span);
        loadingT2.appendChild(t2Img);
        loadingTexts.appendChild(loadingT1);
        loadingTexts.appendChild(loadingT2);
        loadingBox.appendChild(loadingTexts);
        var loadingBar = document.createElement('div');
        loadingBar.className = 'q-loading-bar';
        var loadingFill = document.createElement('div');
        loadingBar.appendChild(loadingFill);
        loadingBox.appendChild(loadingBar);
        scroll.appendChild(loadingBox);

        // Result
        var stepResult = document.createElement('div');
        stepResult.id = 'q-step-result';
        var resTitle = document.createElement('span');
        resTitle.className = 'q-res-title';
        resTitle.textContent = 'Veja como ficou em você ✨';
        stepResult.appendChild(resTitle);
        var resultImgCol = document.createElement('div');
        resultImgCol.id = 'q-result-img-col';
        var finalImg = document.createElement('img');
        finalImg.id = 'q-final-view-img';
        resultImgCol.appendChild(finalImg);
        var resultActCol = document.createElement('div');
        resultActCol.id = 'q-result-actions-col';
        var backBtn = document.createElement('button');
        backBtn.className = 'q-btn-outline';
        backBtn.id = 'q-btn-back';
        backBtn.textContent = 'Voltar ao Produto';
        resultActCol.appendChild(backBtn);
        var retryBtn = document.createElement('p');
        retryBtn.className = 'q-btn-black q-res-mobile-only';
        retryBtn.id = 'q-retry-btn';
        retryBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;';
        var retryIcon = document.createElement('i');
        retryIcon.className = 'ph ph-camera';
        retryBtn.appendChild(retryIcon);
        retryBtn.appendChild(document.createTextNode(' Tentar outra foto'));
        resultActCol.appendChild(retryBtn);

        // Related products section
        var relatedSection = document.createElement('div');
        relatedSection.id = 'q-related-products';
        relatedSection.style.display = 'none';
        var relatedH4 = document.createElement('h4');
        relatedH4.textContent = 'Veja também';
        var relatedGrid = document.createElement('div');
        relatedGrid.className = 'q-related-grid';
        relatedGrid.id = 'q-related-grid';
        relatedSection.appendChild(relatedH4);
        relatedSection.appendChild(relatedGrid);
        resultActCol.appendChild(relatedSection);

        stepResult.appendChild(resultImgCol);
        stepResult.appendChild(resultActCol);
        scroll.appendChild(stepResult);

        // Error step
        var stepError = document.createElement('div');
        stepError.id = 'q-step-error';
        stepError.style.display = 'none';
        var errH2 = document.createElement('h2');
        errH2.textContent = 'Provador fora do ar';
        var errP = document.createElement('p');
        errP.textContent = 'Voltamos em breve 🙏';
        var errBtn = document.createElement('button');
        errBtn.className = 'q-btn-outline';
        errBtn.id = 'q-error-back';
        errBtn.textContent = 'Voltar ao Produto';
        stepError.appendChild(errH2);
        stepError.appendChild(errP);
        stepError.appendChild(errBtn);
        scroll.appendChild(stepError);

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
            if (preImg) preImg.style.display = 'none';
            var fp = document.getElementById('q-face-placeholder');
            if (fp) fp.style.display = 'flex';
            checkFields();
        };

        document.getElementById('q-btn-camera').onclick = function() { cameraInput.click(); };
        document.getElementById('q-btn-gallery').onclick = function() { galleryInput.click(); };
        document.getElementById('q-face-frame').onclick = function() { galleryInput.click(); };


        function loadRelatedProducts() {
            var grid = document.getElementById('q-related-grid');
            var section = document.getElementById('q-related-products');
            if (!grid || !section) return;

            // Tray Marina: article.product-card with data-ga4-* attributes
            var items = document.querySelectorAll('.section_related_products article.product-card, .showroom-swiper article.product-card');
            if (!items.length) items = document.querySelectorAll('article.product-card');
            var products = [];

            items.forEach(function(item) {
                if (products.length >= 3) return;
                var name = item.getAttribute('data-ga4-name') || '';
                var price = item.getAttribute('data-ga4-price') || '';
                if (price) price = 'R$ ' + parseFloat(price).toLocaleString('pt-BR', {minimumFractionDigits:2});
                // Image from .image-lazy-container data-src
                var imgContainer = item.querySelector('.image-lazy-container');
                var imgSrc = imgContainer ? (imgContainer.getAttribute('data-src') || '') : '';
                // Link
                var linkEl = item.querySelector('a[href*="oticasmarina"]');
                var link = linkEl ? linkEl.getAttribute('href') : '';
                if (name && imgSrc) {
                    products.push({ name: name, img: imgSrc, link: link });
                }
            });

            if (!products.length) return;

            while (grid.firstChild) grid.removeChild(grid.firstChild);
            products.forEach(function(p) {
                var a = document.createElement('a');
                a.className = 'q-related-card';
                a.href = p.link || '#';
                a.target = '_blank';
                var img = document.createElement('img');
                img.src = p.img;
                img.alt = p.name;
                img.loading = 'lazy';
                var nameEl = document.createElement('span');
                nameEl.className = 'q-related-card-name';
                nameEl.textContent = p.name;
                a.appendChild(img);
                a.appendChild(nameEl);
                grid.appendChild(a);
            });
            section.style.display = 'block';
        }

        function showError() {
            var lb = document.getElementById('q-loading-box');
            var su = document.getElementById('q-step-photo');
            var se = document.getElementById('q-step-error');
            if (lb) lb.style.display = 'none';
            if (su) su.style.display = 'none';
            if (se) se.style.display = 'flex';
        }
        var _eb = document.getElementById('q-error-back'); if (_eb) _eb.onclick = function() { closeModal(); };


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

        function handlePhotoSelected(file) {
            if (!file) return;
            userPhoto = file;
            var rd = new FileReader();
            rd.onload = function(ev) {
                preImg.src = ev.target.result;
                preImg.style.display = 'block';
                var fp = document.getElementById('q-face-placeholder');
                if (fp) fp.style.display = 'none';
                checkFields();
            };
            rd.readAsDataURL(file);
        }
        cameraInput.onchange = function(e) { handlePhotoSelected(e.target.files[0]); };
        galleryInput.onchange = function(e) { handlePhotoSelected(e.target.files[0]); };

        genBtn.onclick = async function() {
            if (!userPhoto) return;
            var keyToUse = window.PROVOU_LEVOU_API_KEY;
            if (!keyToUse) { alert('Erro: API Key não configurada.'); return; }

            // Tray injeta window.dataLayer[0].urlImage com a imagem correta do produto
            var prodImg =
                (window.dataLayer && window.dataLayer[0] && window.dataLayer[0].urlImage) ||
                document.querySelector('meta[property="og:image"]')?.content ||
                '';
            var prodName = document.querySelector('h1.product-name, h1.product__title, .product-single__title, h1')?.innerText || document.title;

            stepUpload.style.display = 'none';
            loadingBox.style.display = 'flex';

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

                // Coleta até 4 fotos do produto: 1ª como binary (compat), 2ª-4ª como base64 text
                var allProdImgs = [];
                if (prodImg) allProdImgs.push(prodImg);
                try {
                    // Marina/Tray: galeria principal usa .product_gallery / .carousel_gallery + .carousel_gallery_miniatures
                    var galSel = '.product_gallery img, .carousel_gallery img, .carousel_gallery_miniatures img, .product-image-magnify img, .product-zoom img, [data-zoom-image]';
                    var imgEls = document.querySelectorAll(galSel);
                    imgEls.forEach(function(el) {
                        var src = el.getAttribute('data-zoom-image') || el.getAttribute('data-src') || el.getAttribute('data-original') || el.src;
                        if (!src) return;
                        if (/data:image|placeholder|spacer|blank/i.test(src)) return;
                        // Filtra logo/badge/ícones — só aceita img_prod
                        if (!/img_prod\//i.test(src)) return;
                        // Upgrade Tray thumbs (90_nome.jpg → nome.jpg = full-res)
                        src = src.replace(/\/(\d{2,4})_([^/]+\.(jpg|jpeg|png|webp))/i, '/$2');
                        var clean = src.split('?')[0];
                        if (!allProdImgs.some(function(u){ return u.split('?')[0] === clean; })) {
                            allProdImgs.push(src);
                        }
                    });
                } catch (_) {}
                allProdImgs = allProdImgs.slice(0, 4);
                console.log('[PL Marina] Enviando', allProdImgs.length, 'fotos do produto');
                for (var _pi = 0; _pi < allProdImgs.length; _pi++) {
                    try {
                        var _b = await fetch(allProdImgs[_pi]).then(function(r) { return r.blob(); });
                        if (_pi === 0) {
                            fd.append('product_image', _b, 'product.jpg');
                        } else {
                            var _b64 = await new Promise(function(resolve, reject) {
                                var _r = new FileReader();
                                _r.onloadend = function() { resolve(_r.result.split(',')[1]); };
                                _r.onerror = reject;
                                _r.readAsDataURL(_b);
                            });
                            fd.append('product_image_' + (_pi+1) + '_b64', _b64);
                        }
                    } catch (_) {}
                }

                var res = await fetch(WEBHOOK_PROVA, { method: 'POST', body: fd });

                var ct = res.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    var data = await res.json();
                    if (data.error) {
                        loadingBox.style.display = 'none';
                        stepUpload.style.display = 'flex';
                        showError();
                        return;
                    }
                }

                if (res.ok) {
                    var blob = await res.blob();
                    loadingBox.style.display = 'none';
                    finalImg.src = URL.createObjectURL(blob);
                    card.classList.add('is-result');
                    stepResult.style.display = 'flex';
                    loadRelatedProducts();
                } else if (res.status === 401 || res.status === 403) {
                    loadingBox.style.display = 'none';
                    stepUpload.style.display = 'flex';
                    showError();
                } else {
                    throw new Error('HTTP ' + res.status);
                }
            } catch (e) {
                loadingBox.style.display = 'none';
                stepUpload.style.display = 'flex';
                showError();
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
