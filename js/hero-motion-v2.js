// BELGIN KUYUMCULUK — Signature Hero Motion v2
(function () {
  'use strict';

  const hero = document.querySelector('.hero-signature');
  const poster = hero?.querySelector('.hero-media img');
  if (!hero || !poster) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData === true;

  // Neutralize v1 without touching the source photo.
  const style = document.createElement('style');
  style.setAttribute('data-hero-motion-v2', '1');
  style.textContent = `
    .hero-signature.hero-motion-active .hero-media { opacity: 1 !important; }
    .hero-signature .hero-motion-canvas { display: none !important; }
    .hero-motion-canvas-v2 {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      display: block;
      opacity: 0;
      pointer-events: none;
      transition: opacity 260ms ease;
    }
    .hero-signature.hero-motion-v2-active .hero-media { opacity: 0 !important; }
    .hero-signature.hero-motion-v2-active .hero-motion-canvas-v2 { opacity: 1 !important; }
    @media (prefers-reduced-motion: reduce) {
      .hero-motion-canvas-v2 { display: none !important; }
      .hero-signature.hero-motion-v2-active .hero-media { opacity: 1 !important; }
    }
  `;
  document.head.appendChild(style);

  function disable(reason) {
    hero.classList.remove('hero-motion-v2-active');
    hero.dataset.heroMotionV2 = reason || 'disabled';
  }

  if (reducedMotion.matches || saveData) {
    disable(reducedMotion.matches ? 'reduced-motion' : 'save-data');
    return;
  }

  document.querySelectorAll('.hero-motion-canvas-v2').forEach((node) => node.remove());
  hero.classList.remove('hero-motion-active');

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-motion-canvas-v2';
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
    disable('webgl-unavailable');
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

  // Coordinates are tied to the 1916×821 master hero image.
  // Only face pixels move; jewellery, hair, shoulders and background remain locked.
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

      if (p.x > 275.0 && p.x < 585.0 && p.y > 330.0 && p.y < 535.0 && u_progress > 0.0001) {
        vec2 d = vec2(0.0);

        // Closed-mouth smile: corners lift and open outward slightly.
        d += influence(p, vec2(363.0, 466.0), 62.0) * vec2(-4.0, -13.5);
        d += influence(p, vec2(495.0, 466.0), 62.0) * vec2( 4.0, -13.5);

        // Keep the lip centre restrained so the expression stays premium, not cartoonish.
        d += influence(p, vec2(429.0, 463.0), 52.0) * vec2(0.0, -2.4);

        // Cheek lift creates the perceptual smile; no jewellery pixels are touched.
        d += influence(p, vec2(374.0, 414.0), 92.0) * vec2(-1.4, -5.0);
        d += influence(p, vec2(488.0, 414.0), 92.0) * vec2( 1.4, -5.0);

        // Very small nasolabial lift avoids the pasted-lips look.
        d += influence(p, vec2(401.0, 438.0), 55.0) * vec2(-0.5, -2.2);
        d += influence(p, vec2(459.0, 438.0), 55.0) * vec2( 0.5, -2.2);

        sample_p = p - d * u_progress;
      }

      vec2 src_uv = clamp(sample_p / u_image_size, vec2(0.0), vec2(1.0));
      // DOM image uploads use top-origin row order with UNPACK_FLIP_Y_WEBGL=false.
      // src_uv is already top-origin, so sampling must not apply a second Y flip.
      gl_FragColor = texture2D(u_image, src_uv);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('[HeroMotionV2] shader compile failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    canvas.remove();
    disable('shader-failed');
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[HeroMotionV2] program link failed:', gl.getProgramInfoLog(program));
    canvas.remove();
    disable('link-failed');
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
    const maxPixels = 2400000;
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
      if (now - lastFrameAt >= 28 || linear >= 1) {
        render(from + (to - from) * easeSilk(linear));
        lastFrameAt = now;
      }
      if (linear < 1) rafId = requestAnimationFrame(tick);
      else {
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
      animateSegment(0, 1, 1450, () => {
        timerId = window.setTimeout(() => {
          animateSegment(1, 0, 1550, () => {
            timerId = window.setTimeout(() => {
              running = false;
              runCycle();
            }, 4200);
          });
        }, 1850);
      });
    }, 1100);
  }

  async function uploadPosterTexture() {
    try {
      // decoding="async" can report complete before pixels are safe for texImage2D.
      // Wait for decode explicitly to avoid silent static fallback on Chromium/Safari.
      if (typeof poster.decode === 'function') {
        try { await poster.decode(); } catch (_decodeError) {
          if (!poster.naturalWidth) throw _decodeError;
        }
      }

      if (!poster.naturalWidth || !poster.naturalHeight) throw new Error('poster-not-ready');

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, poster);

      render(0);
      requestAnimationFrame(() => {
        if (!canAnimate()) return;
        hero.classList.add('hero-motion-v2-active');
        hero.dataset.heroMotionV2 = 'active';
        runCycle();
      });
    } catch (error) {
      console.warn('[HeroMotionV2] texture initialization failed:', error?.message || error);
      canvas.remove();
      disable('texture-failed');
    }
  }

  const observer = new IntersectionObserver((entries) => {
    inView = entries[0]?.isIntersecting !== false;
    if (canAnimate()) runCycle();
    else clearSchedule(true);
  }, { threshold: 0.05 });
  observer.observe(hero);

  document.addEventListener('visibilitychange', () => {
    if (canAnimate()) runCycle();
    else clearSchedule(true);
  });

  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) {
      clearSchedule(true);
      disable('reduced-motion');
    } else if (!saveData) {
      hero.classList.add('hero-motion-v2-active');
      hero.dataset.heroMotionV2 = 'active';
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
    disable('context-lost');
  });

  if (poster.complete && poster.naturalWidth) {
    requestAnimationFrame(() => uploadPosterTexture());
  } else {
    poster.addEventListener('load', () => uploadPosterTexture(), { once: true });
  }
})();
