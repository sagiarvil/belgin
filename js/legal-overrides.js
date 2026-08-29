// BELGIN KUYUMCULUK — runtime legal integration layer
(function () {
  'use strict';

  const SELECT_COLLECTION = Object.freeze({
    internalPage: 'ikinci-el',
    label: 'Seçkin Ürünler',
    href: '/seckin-urunler/'
  });

  function exposeSelectCollectionRoute() {
    // Preserve the internal page/category key to avoid breaking catalogue filters,
    // while publishing a new customer-facing route.
    window.SEO_CATEGORY_ROUTES = Object.freeze({
      ...(window.SEO_CATEGORY_ROUTES || {}),
      [SELECT_COLLECTION.internalPage]: SELECT_COLLECTION.href
    });
  }

  function renameSelectCollectionEntryPoints() {
    const links = document.querySelectorAll('a[data-page="ikinci-el"]');
    links.forEach((link) => link.setAttribute('href', SELECT_COLLECTION.href));

    const desktopMain = document.querySelector('.nav-desktop > ul > li > a[data-page="ikinci-el"]');
    if (desktopMain) {
      desktopMain.innerHTML = 'Seçkin Ürünler <span class="nav-arrow">▾</span>';
    }

    const desktopItem = desktopMain?.closest('li');
    const dropdownHeader = desktopItem?.querySelector('.nav-dropdown-header > span');
    if (dropdownHeader) dropdownHeader.textContent = 'SEÇKİN ÜRÜNLER KOLEKSİYONU';

    const desktopAll = desktopItem?.querySelector('.nav-dropdown-single-item.nav-all-item .nav-item-title');
    if (desktopAll) desktopAll.textContent = 'TÜMÜ (Seçkin Ürünler)';

    const mobileFirstLink = document.querySelector('.mobile-nav-accordion-sub a[data-page="ikinci-el"]');
    const mobileBlock = mobileFirstLink?.closest('.mobile-nav-accordion-sub')?.parentElement;
    const mobileHeaderLabel = mobileBlock?.querySelector('.mobile-nav-accordion-header > span:first-child');
    if (mobileHeaderLabel) mobileHeaderLabel.textContent = '🪙 Seçkin Ürünler (32)';
    if (mobileFirstLink) mobileFirstLink.textContent = '⭐ TÜMÜ (Seçkin Ürünler - 32)';

    const heroTab = document.querySelector('.hero-tab-btn[onclick*="filterHeroTab(\'ikinci-el\'"]');
    if (heroTab) heroTab.textContent = '🪙 Seçkin Ürünler';

    const footerLink = document.querySelector('.footer-art a[data-page="ikinci-el"]');
    if (footerLink) footerLink.textContent = 'Seçkin Ürünler (32)';

    const categoryTitle = document.querySelector('#page-ikinci-el h2');
    if (categoryTitle) categoryTitle.textContent = 'Seçkin Ürünler';
  }

  function normalizeSelectCollectionSeo() {
    if (location.pathname.replace(/\/+$/, '') !== '/seckin-urunler') return;

    document.title = 'Seçkin Ürünler | Ekspertizli Saat & Mücevher | Belgin Kuyumculuk';

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute(
        'content',
        'İzmir Buca’da ekspertiz ve orijinallik kontrolünden geçirilmiş seçkin saat ve mücevher koleksiyonu. Kondisyon raporu, güvenli ödeme ve takas imkânı.'
      );
    }

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', 'https://www.belginkuyumculuk.com/seckin-urunler/');

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', 'https://www.belginkuyumculuk.com/seckin-urunler/');
  }

  function activateDirectSelectCollectionRoute() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    if (path !== '/seckin-urunler') return;

    if (typeof Router !== 'undefined' && typeof Router.navigate === 'function') {
      Router.navigate(SELECT_COLLECTION.internalPage, false);
    }
  }

  /*
   * Signature hero micro-expression.
   *
   * The motion is generated from the exact live hero photograph in WebGL. No
   * synthetic face frame, third-party video, face model or jewellery rewrite is
   * introduced. Only a very small local texture displacement around the mouth
   * and lower cheeks is applied, so the model moves from a neutral expression to
   * a restrained closed-mouth smile and returns to the untouched source frame.
   *
   * Failure mode is intentionally static: reduced-motion, Save-Data, missing
   * WebGL, context loss, texture failure, hidden/off-screen hero or any runtime
   * exception leaves the existing <picture> hero untouched.
   */
  function installHeroMicroExpression() {
    const hero = document.querySelector('.hero-signature');
    const poster = hero?.querySelector('.hero-media img');
    if (!hero || !poster || hero.dataset.microExpressionReady === '1') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const saveData = navigator.connection?.saveData === true;
    if (reducedMotion.matches || saveData) return;

    const style = document.createElement('style');
    style.setAttribute('data-hero-micro-expression', 'v1');
    style.textContent = `
      .hero-signature .hero-media {
        transition: opacity 420ms ease;
      }
      .hero-motion-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        display: block;
        opacity: 0;
        pointer-events: none;
        transition: opacity 420ms ease;
      }
      .hero-signature.hero-motion-active .hero-media {
        opacity: 0;
      }
      .hero-signature.hero-motion-active .hero-motion-canvas {
        opacity: 1;
      }
      @media (max-width: 768px) {
        .hero-signature.hero-motion-active .hero-motion-canvas {
          opacity: .62;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .hero-motion-canvas { display: none !important; }
        .hero-signature.hero-motion-active .hero-media { opacity: 1 !important; }
      }
    `;
    document.head.appendChild(style);

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-motion-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.querySelector('.hero-gradient-overlay'));

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      premultipliedAlpha: false,
      powerPreference: 'low-power'
    });

    if (!gl) {
      canvas.remove();
      return;
    }

    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision highp float;
      uniform sampler2D u_image;
      uniform vec2 u_view_size;
      uniform vec2 u_image_size;
      uniform float u_progress;
      varying vec2 v_uv;

      float influence(vec2 p, vec2 c, float radius) {
        float t = clamp(1.0 - distance(p, c) / radius, 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
      }

      void main() {
        vec2 view_uv = vec2(v_uv.x, 1.0 - v_uv.y);
        float cover = max(u_view_size.x / u_image_size.x, u_view_size.y / u_image_size.y);
        vec2 rendered = u_image_size * cover;
        vec2 offset = (u_view_size - rendered) * 0.5;
        vec2 p = (view_uv * u_view_size - offset) / cover;
        vec2 sample_p = p;

        if (p.x > 300.0 && p.x < 565.0 && p.y > 345.0 && p.y < 545.0 && u_progress > 0.0001) {
          vec2 d = vec2(0.0);
          d += influence(p, vec2(363.0, 466.0), 58.0) * vec2(-2.5, -9.0);
          d += influence(p, vec2(495.0, 466.0), 58.0) * vec2( 2.5, -9.0);
          d += influence(p, vec2(429.0, 463.0), 48.0) * vec2( 0.0, -1.7);
          d += influence(p, vec2(377.0, 430.0), 78.0) * vec2(-1.0, -2.7);
          d += influence(p, vec2(481.0, 430.0), 78.0) * vec2( 1.0, -2.7);
          sample_p = p - d * u_progress;
        }

        vec2 src_uv = clamp(sample_p / u_image_size, vec2(0.0), vec2(1.0));
        gl_FragColor = texture2D(u_image, vec2(src_uv.x, 1.0 - src_uv.y));
      }
    `;

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      canvas.remove();
      return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      canvas.remove();
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const viewSizeLocation = gl.getUniformLocation(program, 'u_view_size');
    const imageSizeLocation = gl.getUniformLocation(program, 'u_image_size');
    const progressLocation = gl.getUniformLocation(program, 'u_progress');
    const imageLocation = gl.getUniformLocation(program, 'u_image');
    gl.uniform1i(imageLocation, 0);

    let viewWidth = 0;
    let viewHeight = 0;
    let inView = true;
    let running = false;
    let rafId = 0;
    let timerId = 0;
    let lastFrameAt = 0;
    let contextLost = false;

    function easeSilk(t) {
      const x = Math.max(0, Math.min(1, t));
      return x * x * (3 - 2 * x);
    }

    function resizeCanvas() {
      const rect = hero.getBoundingClientRect();
      viewWidth = Math.max(1, rect.width);
      viewHeight = Math.max(1, rect.height);

      let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const maxPixels = 2200000;
      const projected = viewWidth * viewHeight * dpr * dpr;
      if (projected > maxPixels) {
        dpr = Math.max(1, Math.sqrt(maxPixels / (viewWidth * viewHeight)));
      }

      const pixelWidth = Math.max(1, Math.round(viewWidth * dpr));
      const pixelHeight = Math.max(1, Math.round(viewHeight * dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        gl.viewport(0, 0, pixelWidth, pixelHeight);
      }
    }

    function render(progress) {
      if (contextLost || !poster.naturalWidth || !poster.naturalHeight) return;
      resizeCanvas();
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform2f(viewSizeLocation, viewWidth, viewHeight);
      gl.uniform2f(imageSizeLocation, poster.naturalWidth, poster.naturalHeight);
      gl.uniform1f(progressLocation, progress);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function canAnimate() {
      return !contextLost && !reducedMotion.matches && !saveData && inView && !document.hidden;
    }

    function clearSchedule(resetFrame) {
      if (rafId) cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
      rafId = 0;
      timerId = 0;
      running = false;
      lastFrameAt = 0;
      if (resetFrame && !contextLost) render(0);
    }

    function animateSegment(from, to, duration, done) {
      const startedAt = performance.now();
      lastFrameAt = 0;

      const tick = (now) => {
        if (!canAnimate()) {
          clearSchedule(true);
          return;
        }

        const linear = Math.min(1, (now - startedAt) / duration);
        if (now - lastFrameAt >= 32 || linear >= 1) {
          const eased = easeSilk(linear);
          render(from + (to - from) * eased);
          lastFrameAt = now;
        }

        if (linear < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          rafId = 0;
          done();
        }
      };

      rafId = requestAnimationFrame(tick);
    }

    function runCycle() {
      if (running || !canAnimate()) return;
      running = true;
      render(0);

      timerId = window.setTimeout(() => {
        animateSegment(0, 1, 1800, () => {
          timerId = window.setTimeout(() => {
            animateSegment(1, 0, 1800, () => {
              timerId = window.setTimeout(() => {
                running = false;
                runCycle();
              }, 4000);
            });
          }, 2600);
        });
      }, 1800);
    }

    function activate() {
      if (!canAnimate()) return;
      render(0);
      requestAnimationFrame(() => {
        hero.classList.add('hero-motion-active');
        hero.dataset.microExpressionReady = '1';
        runCycle();
      });
    }

    function uploadPosterTexture() {
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, poster);
        activate();
      } catch (_error) {
        hero.classList.remove('hero-motion-active');
        canvas.remove();
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting !== false;
        if (canAnimate()) runCycle();
        else clearSchedule(true);
      },
      { threshold: 0.05 }
    );
    observer.observe(hero);

    document.addEventListener('visibilitychange', () => {
      if (canAnimate()) runCycle();
      else clearSchedule(true);
    });

    reducedMotion.addEventListener?.('change', () => {
      if (reducedMotion.matches) {
        clearSchedule(true);
        hero.classList.remove('hero-motion-active');
      } else if (!saveData) {
        hero.classList.add('hero-motion-active');
        runCycle();
      }
    });

    window.addEventListener('resize', () => {
      if (!contextLost) render(0);
    }, { passive: true });

    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      contextLost = true;
      clearSchedule(false);
      hero.classList.remove('hero-motion-active');
    });

    if (poster.complete && poster.naturalWidth) uploadPosterTexture();
    else poster.addEventListener('load', uploadPosterTexture, { once: true });
  }

  exposeSelectCollectionRoute();
  renameSelectCollectionEntryPoints();
  activateDirectSelectCollectionRoute();
  normalizeSelectCollectionSeo();
  installHeroMicroExpression();
})();
