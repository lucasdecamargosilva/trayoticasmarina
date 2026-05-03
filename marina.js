(function () {
    // ===============================================
    // 0. CHUMBAR A API KEY AQUI DIRETO NO CÓDIGO
    // ===============================================
    const apiKey = "pl_live_2e8a1216deb73095ebfc5be077e83801a0c95ecaa0f00258d352857fe610f03a";
    window.PROVOU_LEVOU_API_KEY = apiKey;

    const WEBHOOK_PROVA = 'https://n8n.segredosdodrop.com/webhook/gerador-oculos';
    const WEBHOOK_PIX = 'https://n8n.segredosdodrop.com/webhook/cacife-pix';
    const WEBHOOK_PIX_STATUS = 'https://n8n.segredosdodrop.com/webhook/cacife-pix-status';
    const WEBHOOK_CHECK_LIMIT = 'https://n8n.segredosdodrop.com/webhook/cacife-check-limit';
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


    function detectProduct(name) {
        const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (/tailoring/.test(n) || /\d\/\d\s*short/.test(n) || /\b(1\/5|2\/5|3\/5|4\/5)\b/.test(n)) return { category: 'bottom', fit: 'tailoring' };
        if (/underwear|cueca/.test(n)) return { category: 'bottom', fit: 'underwear' };
        if (/sweatpant|sweatshort|sweat pant|sweat short|calca|bermuda/.test(n)) return { category: 'bottom', fit: 'sweat' };
        if (/henley/.test(n)) return { category: 'top', fit: 'boxyHenley' };
        if (/boxy.*(hoodie|crewneck|crew)/.test(n) || /(hoodie|crewneck|crew).*boxy/.test(n)) return { category: 'top', fit: 'boxyHoodie' };
        if (/puffer|jacket/.test(n)) return { category: 'top', fit: 'puffer' };
        if (/vest/.test(n)) return { category: 'top', fit: 'vest' };
        if (/(hoodie|hoodie zip|half zip|crewneck|crew neck)/.test(n) && !/oversized|boxy|short sleeve/.test(n)) return { category: 'top', fit: 'hoodie' };
        if (/oversized.*(hoodie|crewneck|crew|short sleeve)/.test(n) || /short sleeve.*(hoodie|crewneck)/.test(n)) return { category: 'top', fit: 'oversizedSS' };
        if (/oversized|boxy tee|2\/4/.test(n)) return { category: 'top', fit: 'oversized' };
        return { category: 'top', fit: 'regular' };
    }


    function estimarTorax(altura, peso) {
        if (altura < 3) altura *= 100;
        let circ = 0.65 * peso + 56;
        const imc = peso / Math.pow(altura / 100, 2);
        if (imc > 30) circ += 4; else if (imc > 25) circ += 2;
        return circ;
    }


    function findClosest(arr, val) {
        let idx = 0, minDiff = Infinity;
        arr.forEach((v, i) => { const d = Math.abs(v - val); if (d < minDiff) { minDiff = d; idx = i; } });
        return idx;
    }


    let recommendedSize = 'M';
    let currentProduct = { category: 'top', fit: 'regular' };

    function calculateFinalSize() {
        // Feature desativada: não faz mais cálculos de tamanho
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
            position: absolute; top: 15px; right: 15px; z-index: 9999;
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
            .q-content-scroll { flex:none; }
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
        .q-loading-t2 img { height: 26px; width: auto; filter: brightness(0); opacity: 0.6; }
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
            .q-card-ia.is-result #q-header-provador { display: none !important; }
            .q-card-ia.is-result .q-powered-footer { display: none !important; }
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
                justify-content: flex-start; gap: 10px;
                overflow-y: auto;
            }
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

        /* ── Marina brand overrides: teal #6dadbc primary, pink #e54e88 accent ── */
        .q-btn-black { background: #6dadbc !important; }
        .q-btn-black:hover:not(:disabled) { background: #5b9daa !important; }
        .q-btn-black:disabled { background: #b8dde8 !important; }
        .q-face-corner { border-color: #6dadbc !important; }
        .q-terms-row a { color: #e54e88 !important; }
        .q-upload-btn:hover { border-color: #6dadbc !important; color: #6dadbc !important; background: #e8f7fa !important; }
        .q-btn-outline:hover { border-color: #6dadbc !important; color: #6dadbc !important; background: #e8f7fa !important; }
        .q-input:focus { border-color: #6dadbc !important; }
        .q-loading-bar > div { background: #6dadbc !important; }
        .q-tip-box { background: #e8f7fa !important; border-left-color: #6dadbc !important; color: #2d6b7a !important; }
        .q-tip-box i { color: #6dadbc !important; }
        #q-related-products h4 { color: #6dadbc !important; }
        .q-pix-approved { color: #6dadbc !important; }
        .q-quantic-logo { height: 20px; filter: brightness(0); opacity: 0.5; }
    `;


    // ─── IMAGEM DO BOTÃO (trigger) ─────────────────────────────────────────────
    const stampImageHTML = `<img src="https://cdn.shopify.com/s/files/1/0636/6334/1746/files/logo_provador.png?v=1772494793" alt="Provador Virtual" style="width:100%;height:100%;object-fit:contain;">`;



    // ─── HTML ─────────────────────────────────────────────────────────────────────


    const html = `
        <div id="q-modal-ia">
            <div class="q-card-ia">
                <button type="button" class="q-close-ia" id="q-close-btn">&times;</button>
                <div class="q-content-scroll">

                    <!-- Main step -->
                    <div id="q-step-photo">
                        <div id="q-header-provador">
                            <h1>Provador Virtual</h1>
                            <img
                                src="https://images.tcdn.com.br/img/img_prod/1269258/1701713968_marina_centro_ptico.png"
                                alt="Oticas Marina"
                                style="height:48px;width:auto;"
                            />
                        </div>

                        <!-- WhatsApp -->
                        <div class="q-phone-wrap">
                            <span class="q-field-label">Seu WhatsApp</span>
                            <input type="tel" id="q-phone" class="q-input" placeholder="(11) 99999-9999" maxlength="15">
                            <div id="q-phone-error" class="q-status-msg">N&#250;mero inv&#225;lido</div>
                        </div>

                        <!-- Photo section -->
                        <p class="q-section-label">Envie sua foto</p>
                        <div class="q-tip-box">
                            <i class="ph ph-lightbulb"></i>
                            <span>Use uma foto n&#237;tida, de frente, com boa ilumina&#231;&#227;o.</span>
                        </div>

                        <!-- Face frame -->
                        <div class="q-face-frame" id="q-face-frame">
                            <div class="q-face-corner q-face-corner-tl"></div>
                            <div class="q-face-corner q-face-corner-tr"></div>
                            <div class="q-face-corner q-face-corner-bl"></div>
                            <div class="q-face-corner q-face-corner-br"></div>
                            <img id="q-pre-img" alt="Sua foto">
                            <div class="q-face-placeholder" id="q-face-placeholder">
                                <i class="ph ph-user-circle" style="font-size:80px;color:#d4d4d4;"></i>
                            </div>
                        </div>

                        <!-- Upload buttons -->
                        <div class="q-upload-btns">
                            <button class="q-upload-btn" id="q-btn-camera">
                                <i class="ph ph-camera"></i> Tirar foto
                            </button>
                            <button class="q-upload-btn" id="q-btn-gallery">
                                <i class="ph ph-image"></i> Da galeria
                            </button>
                            <input type="file" id="q-camera-input" accept="image/*" capture="user" style="display:none">
                            <input type="file" id="q-gallery-input" accept="image/*" style="display:none">
                        </div>

                        <!-- Terms -->
                        <label class="q-terms-row">
                            <input type="checkbox" id="q-accept-terms">
                            <span>Concordo com os <a href="http://provoulevou.com.br/termos.html" target="_blank">Termos e Condi&#231;&#245;es</a></span>
                        </label>

                        <button class="q-btn-black" id="q-btn-generate" disabled>Provar &#243;culos</button>
                    </div>

                    <!-- PIX -->
                    <div id="q-step-pix">
                        <h2>Prova Extra</h2>
                        <p class="q-pix-subtitle">Limite de 3 provas atingido.<br>Pague R$1 via PIX para mais uma:</p>
                        <div class="q-pix-qr"><img id="q-pix-qr-img" alt="QR Code PIX"></div>
                        <div class="q-pix-copiacola">
                            <input type="text" id="q-pix-code" readonly placeholder="C&#243;digo PIX...">
                            <button id="q-pix-copy-btn">Copiar</button>
                        </div>
                        <div id="q-pix-status-msg" class="q-pix-status q-pix-waiting">Aguardando pagamento...</div>
                        <p class="q-pix-cancel" id="q-pix-cancel">Cancelar</p>
                    </div>

                    <!-- Loading -->
                    <div id="q-loading-box">
                        <div class="q-loading-texts">
                            <div class="q-loading-t1">Gerando sua prova...</div>
                            <a href="https://provoulevou.com.br" target="_blank" class="q-loading-t2">
                                <span>Powered by</span>
                                <img src="https://provoulevou.com.br/assets/provoulevou-logo.png" alt="Provou Levou">
                            </a>
                        </div>
                        <div class="q-loading-bar"><div></div></div>
                    </div>

                    <!-- Resultado -->
                    <div id="q-step-result">
                        <span class="q-res-title">Veja como ficou em voc&ecirc; &#x2728;</span>
                        <div id="q-result-img-col">
                            <img id="q-final-view-img">
                        </div>
                        <div id="q-result-actions-col">
                            <button class="q-btn-outline" id="q-btn-back">Voltar ao Produto</button>
                            <button class="q-btn-black q-res-mobile-only" id="q-retry-btn" style="display:flex;align-items:center;justify-content:center;gap:8px;">
                                <i class="ph ph-camera"></i> Tentar outra foto
                            </button>
                            <div id="q-related-products" style="display:none;">
                                <h4>Veja tamb&eacute;m</h4>
                                <div class="q-related-grid" id="q-related-grid"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Erro -->
                    <div id="q-step-error">
                        <h2>Provador fora do ar</h2>
                        <p>Voltamos em breve &#x1F64F;</p>
                        <button class="q-btn-outline" id="q-error-back">Voltar ao Produto</button>
                    </div>

                </div>
                <a href="https://provoulevou.com.br" target="_blank" class="q-powered-footer">
                    <span>Powered by</span>
                    <img src="https://provoulevou.com.br/assets/provoulevou-logo.png" class="q-quantic-logo" alt="Provou Levou">
                </a>
            </div>
        </div>
    `;


    // ─── INIT ─────────────────────────────────────────────────────────────────────


    function init() {
        // --- FILTRO DE CATEGORIA (HAT) ---
        const productNameNormalized = (document.querySelector('h1.product__title,.product-single__title,h1')?.innerText || document.title).toUpperCase();
        if (productNameNormalized.includes('HAT')) {
            return;
        }

        // Fontes (async, não bloqueia render)
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        // Phosphor Icons — carregado lazily na primeira abertura do modal
        // (não carrega na init para não impactar o tempo de carregamento da página)

        const styleTag = document.createElement('style');
        styleTag.textContent = styles;
        document.head.appendChild(styleTag);

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        document.body.appendChild(modalContainer);


        // ── Botão imagem PNG ──
        const openBtn = document.createElement('button');
        openBtn.className = 'q-btn-trigger-ia';
        openBtn.id = 'q-open-ia';
        openBtn.setAttribute('aria-label', 'Abrir Provador Virtual');
        openBtn.innerHTML = stampImageHTML;


        const imgContainers = ['.js-product-slide', '.product-image-column', '.js-swiper-product', '[data-store^="product-image-"]', '.product__media-wrapper', '.product-gallery__media', '.product__media', '.product-image-main', '.product-media-container', '[data-media-id]', '.product__media-item', '.product-gallery', '.product-single__media', '.media-gallery'];

        function tryPlaceTriggerBtn() {
            // 1ª prioridade: container que tenha <img> dentro (evita cair em slide de vídeo)
            for (const sel of imgContainers) {
                const els = document.querySelectorAll(sel);
                for (const el of els) {
                    if (el.querySelector('img')) {
                        if (window.getComputedStyle(el).position === 'static') el.style.position = 'relative';
                        el.appendChild(openBtn);
                        return true;
                    }
                }
            }
            // 2ª prioridade: qualquer container correspondente
            for (const sel of imgContainers) {
                const el = document.querySelector(sel);
                if (el) {
                    if (window.getComputedStyle(el).position === 'static') el.style.position = 'relative';
                    el.appendChild(openBtn);
                    return true;
                }
            }
            return false;
        }

        if (!tryPlaceTriggerBtn()) {
            // Container não pronto ainda (ex: após F5 no mobile).
            // Observa DOM até 5s aguardando o container aparecer.
            const observer = new MutationObserver(() => {
                if (tryPlaceTriggerBtn()) observer.disconnect();
            });
            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
                observer.disconnect();
                if (!openBtn.isConnected) {
                    openBtn.style.cssText = 'position:fixed;bottom:30px;right:20px;top:auto;z-index:100;';
                    document.body.appendChild(openBtn);
                }
            }, 5000);
        }


        const modal = document.getElementById('q-modal-ia');

        // ── Botão inline acima do botão de compra ──
        const inlineBtn = document.createElement('button');
        inlineBtn.className = 'q-btn-inline-provador';
        inlineBtn.type = 'button';

        const inlineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        inlineSvg.setAttribute('viewBox', '0 0 24 24');
        inlineSvg.setAttribute('fill', 'none');
        inlineSvg.setAttribute('stroke', 'currentColor');
        inlineSvg.setAttribute('stroke-width', '1.5');
        inlineSvg.setAttribute('stroke-linecap', 'round');
        inlineSvg.setAttribute('stroke-linejoin', 'round');
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.setAttribute('d', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2');
        const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle1.setAttribute('cx', '12');
        circle1.setAttribute('cy', '7');
        circle1.setAttribute('r', '4');
        inlineSvg.appendChild(path1);
        inlineSvg.appendChild(circle1);
        inlineBtn.appendChild(inlineSvg);

        const inlineBtnText = document.createTextNode('Provador Virtual');
        inlineBtn.appendChild(inlineBtnText);

        inlineBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const prodName = document.querySelector('h1.product__title,.product-single__title,h1')?.innerText || document.title;
            applyProduct(detectProduct(prodName));
            populateImageSelector();
            openModal();
        });

        // Posiciona acima do botão de compra
        const buyBtn = document.querySelector('.js-addtocart, .btn-add-to-cart, [data-component="product.add-to-cart"]');
        if (buyBtn) {
            buyBtn.parentNode.insertBefore(inlineBtn, buyBtn);
        } else {
            const variantsContainer = document.querySelector('.js-product-variants');
            if (variantsContainer) {
                variantsContainer.parentNode.insertBefore(inlineBtn, variantsContainer.nextSibling);
            }
        }
        const genBtn      = document.getElementById('q-btn-generate');
        const nextBtn     = null; // single-step flow — no next button
        const phoneStep   = null;
        const photoStep   = document.getElementById('q-step-photo');
        const uploadStep  = photoStep; // alias for PIX/error refs

        const closeBtn    = document.getElementById('q-close-btn');
        const backBtn     = document.getElementById('q-btn-back');
        const retryBtn    = document.getElementById('q-retry-btn');
        const cameraInput = document.getElementById('q-camera-input');
        const galleryInput= document.getElementById('q-gallery-input');
        const phoneInput  = document.getElementById('q-phone');
        const preImg      = document.getElementById('q-pre-img');
        const facePlaceholder = document.getElementById('q-face-placeholder');

        // keep realInput alias so PIX code still works
        const realInput   = galleryInput;

        let userPhoto = null;
        let selectedProductImgUrl = '';

        // Upgrade Nuvemshop CDN URLs to 1024px version
        function upgradeImgUrl(url) {
            if (url.includes('mitiendanube.com') || url.includes('nuvemshop.com')) {
                return url.replace(/-\d+-\d+\.webp/, '-1024-1024.webp');
            }
            return url;
        }

        function extractImages() {
            const containersSelectors = '.js-product-slide, .product-image-column, .js-swiper-product, [data-store^="product-image-"], .product__media-wrapper, .product-gallery__media, .product__media, .product-image-main, .product-media-container, [data-media-id], .product__media-item, .product-gallery, .product-single__media, .media-gallery, [data-component="product.gallery"], .swiper-slide:not(.swiper-slide-duplicate), .slider-wrapper';
            const possibleContainers = Array.from(document.querySelectorAll(containersSelectors));
            let imgEls = [];
            possibleContainers.forEach(c => {
                if (!c.closest('#q-modal-ia')) {
                    const foundImgs = c.querySelectorAll('img');
                    imgEls.push(...Array.from(foundImgs));
                }
            });
            let uniqueImgs = [];
            imgEls.forEach(img => {
                let src = img.dataset?.src || img.getAttribute('data-src') || img.src;

                if (src && src.includes('data:image')) {
                    const parentA = img.closest('a');
                    if (parentA && parentA.href && !parentA.href.includes('javascript:')) {
                        src = parentA.href;
                    } else if (img.getAttribute('data-srcset')) {
                        src = img.getAttribute('data-srcset').split(',')[0].trim().split(' ')[0];
                    }
                }

                if (!src || src.includes('data:image')) return;

                const lowerSrc = src.toLowerCase();
                const invalidKeywords = ['provador', 'logo', 'provoulevou', 'icon', 'play', 'video', 'transparent', 'placeholder', 'blank', 'spacer'];
                if (invalidKeywords.some(kw => lowerSrc.includes(kw))) return;

                // Filter out tiny images (1x1 pixels, spacers, etc.)
                if (img.naturalWidth > 0 && img.naturalWidth < 50) return;
                if (img.naturalHeight > 0 && img.naturalHeight < 50) return;

                let cleanSrc = src.split('?')[0].replace(/-\d+-\d+\.webp|_\d+x\d+/, '');

                // Upgrade to 1024px version
                src = upgradeImgUrl(src);

                if (!uniqueImgs.some(u => u.split('?')[0].replace(/-\d+-\d+\.webp|_\d+x\d+/, '') === cleanSrc)) {
                    uniqueImgs.push(src);
                }
            });
            if (uniqueImgs.length === 0) {
                const og = document.querySelector('meta[property="og:image"]')?.content;
                if (og) uniqueImgs.push(upgradeImgUrl(og));
            }
            return uniqueImgs.slice(0, 2);
        }

        function populateImageSelector() {
            const imgs = extractImages();
            const group = document.getElementById('q-photo-selector-group');
            if (group) group.style.display = 'none';
            selectedProductImgUrl = imgs[0] || '';
        }

        function openModal() {
            // Lazy-load Phosphor Icons na primeira abertura
            if (!window.phosphorIconsLoaded) {
                var ph = document.createElement('script');
                ph.src = 'https://unpkg.com/@phosphor-icons/web';
                document.head.appendChild(ph);
                window.phosphorIconsLoaded = true;
            }
            modal.style.display = 'flex';
            lockBodyScroll();
        }


        function closeModal() {
            modal.style.display = 'none';
            unlockBodyScroll();
        }


        function applyProduct(product) {
            currentProduct = product;
        }


        openBtn.onclick = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const prodName = document.querySelector('h1.product__title,.product-single__title,h1')?.innerText || document.title;
            applyProduct(detectProduct(prodName));
            populateImageSelector();
            openModal();
        };


        closeBtn.onclick = () => closeModal();
        backBtn.onclick = () => closeModal();


        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });


        retryBtn.onclick = () => {
            document.getElementById('q-step-result').style.display = 'none';
            photoStep.style.display = 'flex';
            document.querySelector('.q-card-ia').classList.remove('is-result');
            userPhoto = null;
            preImg.style.display = 'none';
            if (facePlaceholder) facePlaceholder.style.display = 'flex';
            checkFields();
        };

        // Camera / gallery buttons
        document.getElementById('q-btn-camera').onclick = function() { cameraInput.click(); };
        document.getElementById('q-btn-gallery').onclick = function() { galleryInput.click(); };
        document.getElementById('q-face-frame').onclick = function() { galleryInput.click(); };

        function loadRelatedProducts() {
            var grid = document.getElementById('q-related-grid');
            var section = document.getElementById('q-related-products');
            if (!grid || !section) return;

            var items = document.querySelectorAll('.js-swiper-related .js-item-product');
            if (!items.length) items = document.querySelectorAll('.js-item-product');
            var products = [];

            items.forEach(function(item) {
                if (products.length >= 3) return;
                var container = item.querySelector('[data-variants]');
                if (!container) return;
                try {
                    var variants = JSON.parse(container.getAttribute('data-variants'));
                    if (!variants || !variants.length) return;
                    var v = variants[0];
                    var imgRaw = v.image_url || '';
                    var img = imgRaw ? 'https:' + imgRaw.replace(/\\/g, '').replace('-1024-1024.webp', '-480-0.webp') : '';
                    var price = v.price_short || '';
                    // Name from img alt (Nuvemshop sets it reliably)
                    var imgEl = item.querySelector('img[alt]');
                    var name = imgEl ? imgEl.getAttribute('alt').trim() : '';
                    // Link from any anchor pointing to /produtos/
                    var linkEl = item.querySelector('a[href*="/produtos/"]');
                    var link = linkEl ? linkEl.getAttribute('href') : '';
                    if (img && (name || price)) {
                        products.push({ name: name, img: img, price: price, link: link });
                    }
                } catch(e) {}
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
            var su = photoStep;
            var se = document.getElementById('q-step-error');
            if (lb) lb.style.display = 'none';
            if (su) su.style.display = 'none';
            if (se) se.style.display = 'flex';
        }
        var _eb = document.getElementById('q-error-back'); if (_eb) _eb.onclick = function() { closeModal(); };



        phoneInput.addEventListener('input', function (e) {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
            checkPhoneStep();
        });

        function checkPhoneStep() {
            const nums = phoneInput.value.replace(/\D/g, '');
            const phoneOk = nums.length >= 10 && nums.length <= 11;
            document.getElementById('q-phone-error').style.display = (phoneInput.value.length > 0 && !phoneOk) ? 'block' : 'none';
            phoneInput.style.borderColor = (phoneInput.value.length > 0 && !phoneOk) ? '#ef4444' : 'var(--q-border)';
            checkFields();
        }

        function checkFields() {
            const nums = phoneInput.value.replace(/\D/g, '');
            const phoneOk = nums.length >= 10 && nums.length <= 11;
            genBtn.disabled = !(userPhoto && phoneOk && document.getElementById('q-accept-terms').checked);
        }

        document.getElementById('q-accept-terms').onchange = checkFields;

        function handlePhotoSelected(file) {
            if (!file) return;
            userPhoto = file;
            const rd = new FileReader();
            rd.onload = ev => {
                preImg.src = ev.target.result;
                preImg.style.display = 'block';
                if (facePlaceholder) facePlaceholder.style.display = 'none';
                checkFields();
            };
            rd.readAsDataURL(file);
        }

        cameraInput.onchange  = (e) => handlePhotoSelected(e.target.files[0]);
        galleryInput.onchange = (e) => handlePhotoSelected(e.target.files[0]);


        function resizeImage(fileOrBlob, maxSize) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width, h = img.height;
                    if (w <= maxSize && h <= maxSize) { resolve(fileOrBlob); return; }
                    if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                    else { w = Math.round(w * maxSize / h); h = maxSize; }
                    const c = document.createElement('canvas');
                    c.width = w; c.height = h;
                    c.getContext('2d').drawImage(img, 0, 0, w, h);
                    c.toBlob(b => resolve(b), 'image/jpeg', 0.95);
                };
                const url = URL.createObjectURL(fileOrBlob instanceof Blob ? fileOrBlob : new Blob([fileOrBlob]));
                img.src = url;
            });
        }

        // ── PIX: polling e controle ──
        let pixPollingTimer = null;

        function stopPixPolling() {
            if (pixPollingTimer) { clearInterval(pixPollingTimer); pixPollingTimer = null; }
        }

        function showPixScreen() {
            uploadStep.style.display = 'none';
            document.getElementById('q-step-pix').style.display = 'block';
            document.getElementById('q-pix-status-msg').textContent = 'Aguardando pagamento...';
            document.getElementById('q-pix-status-msg').className = 'q-pix-status q-pix-waiting';
        }

        function hidePixScreen() {
            stopPixPolling();
            document.getElementById('q-step-pix').style.display = 'none';
        }

        async function createPixAndPoll() {
            showPixScreen();
            try {
                const resp = await fetch(WEBHOOK_PIX, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'cliente@provoulevou.com.br', phone: '55' + phoneInput.value.replace(/\D/g, '') })
                });
                const pix = await resp.json();
                if (!pix.payment_id || !pix.qr_code) throw new Error('PIX inválido');

                document.getElementById('q-pix-qr-img').src = 'data:image/png;base64,' + pix.qr_code_base64;
                document.getElementById('q-pix-code').value = pix.qr_code;

                // Polling a cada 3s por até 5min
                let attempts = 0;
                pixPollingTimer = setInterval(async () => {
                    attempts++;
                    if (attempts > 100) { stopPixPolling(); return; }
                    try {
                        const sr = await fetch(WEBHOOK_PIX_STATUS + '?payment_id=' + pix.payment_id);
                        const st = await sr.json();
                        if (st.status === 'approved') {
                            stopPixPolling();
                            document.getElementById('q-pix-status-msg').textContent = 'Pagamento confirmado!';
                            document.getElementById('q-pix-status-msg').className = 'q-pix-status q-pix-approved';
                            setTimeout(() => {
                                hidePixScreen();
                                runGeneration();
                            }, 1200);
                        }
                    } catch (_) {}
                }, 3000);
            } catch (e) {
                hidePixScreen();
                uploadStep.style.display = 'block';
                alert('Erro ao gerar PIX. Tente novamente.');
            }
        }

        // Botão copiar PIX
        document.getElementById('q-pix-copy-btn').onclick = () => {
            const code = document.getElementById('q-pix-code').value;
            navigator.clipboard.writeText(code).then(() => {
                document.getElementById('q-pix-copy-btn').textContent = 'Copiado!';
                setTimeout(() => { document.getElementById('q-pix-copy-btn').textContent = 'Copiar'; }, 2000);
            });
        };

        // Botão cancelar PIX
        document.getElementById('q-pix-cancel').onclick = () => {
            hidePixScreen();
            uploadStep.style.display = 'block';
        };

        // ── GERAÇÃO PRINCIPAL ──
        async function runGeneration() {
            const keyToUse = window.PROVOU_LEVOU_API_KEY;
            if (!keyToUse || keyToUse.includes("COLOQUE_A_CHAVE_AQUI")) {
                alert("Erro: API Key não configurada neste script.");
                return;
            }

            const prodImg = selectedProductImgUrl || (document.querySelector('meta[property="og:image"]')?.content || '');
            const prodName = document.querySelector('h1.product__title,.product-single__title,h1')?.innerText || document.title;

            uploadStep.style.display = 'none';
            document.getElementById('q-loading-box').style.display = 'flex';

            try {
                const fd = new FormData();
                fd.append('person_image', userPhoto, 'person.jpg');
                fd.append('whatsapp', '55' + phoneInput.value.replace(/\D/g, ''));
                fd.append('phone_raw', phoneInput.value);
                fd.append('product_name', prodName);
                fd.append('product_type', currentProduct.category);
                fd.append('product_fit', currentProduct.fit);
                fd.append('api_key', keyToUse);

                if (currentProduct.category === 'top') {
                    fd.append('height', '');
                    fd.append('weight', '');
                } else {
                    fd.append('height', '');
                    fd.append('weight', '');
                    fd.append('cintura', '');
                    fd.append('quadril', '');
                }

                if (prodImg) {
                    try {
                        const b = await fetch(prodImg).then(r => r.blob());
                        fd.append('product_image', b, 'product.jpg');
                    } catch (_) { }
                }

                calculateFinalSize();

                const res = await fetch(WEBHOOK_PROVA, { method: 'POST', body: fd });

                const contentType = res.headers.get("content-type") || "";
                if (contentType.includes("application/json")) {
                    const data = await res.json();
                    if (data.error) {
                        document.getElementById('q-loading-box').style.display = 'none';
                        photoStep.style.display = 'flex';
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
                    document.getElementById('q-loading-box').style.display = 'none';
                    document.getElementById('q-final-view-img').src = URL.createObjectURL(blob);
                    document.querySelector('.q-card-ia').classList.add('is-result');
                    document.getElementById('q-step-result').style.display = 'flex';
                    loadRelatedProducts();
                } else if (res.status === 401 || res.status === 403) {
                    document.getElementById('q-loading-box').style.display = 'none';
                    photoStep.style.display = 'flex';
                    alert("App desativado nesta loja");
                } else { throw new Error(); }
            } catch (e) {
                document.getElementById('q-loading-box').style.display = 'none';
                photoStep.style.display = 'flex';
                alert('Ocorreu um erro ao processar sua imagem (ou chave/servidor indisponíveis). Tente novamente.');
            }
        }

        genBtn.onclick = async () => {
            if (!userPhoto) return;

            const phone = '55' + phoneInput.value.replace(/\D/g, '');
            genBtn.disabled = true;

            try {
                const resp = await fetch(WEBHOOK_CHECK_LIMIT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone })
                });
                const data = await resp.json();
                if (data.limited) {
                    genBtn.disabled = false;
                    createPixAndPoll();
                    return;
                }
            } catch (_) {
                // se o check falhar, deixa gerar (evita bloquear por erro de rede)
            }

            genBtn.disabled = false;
            runGeneration();
        };
    }

    // ─── EXECUTA APENAS EM PÁGINAS DE PRODUTO ────────────────────────────────────
    const isProductPage = window.location.pathname.includes('/products/') || window.location.pathname.includes('/product/') || window.location.pathname.includes('/produtos/') || window.location.pathname.includes('/produto/') || window.location.pathname.includes('/p/') || window.location.pathname.includes('preview.html') || document.querySelector('meta[property="og:type"][content="product"]');

    if (isProductPage) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
        else init();
    }

})();
