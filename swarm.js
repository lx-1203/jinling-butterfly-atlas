/* One batched WebGL draw for the opening flock. No external runtime or CDN. */
(() => {
  const canvas = document.querySelector("#swarm");
  const openingElement = document.getElementById("opening");
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = preference.matches;
  let manuallyPaused = false;
  let mode = 0,
    targetMode = 0,
    frame = 0,
    last = 0,
    elapsed = 0,
    clock = 0;
  let burst = 0,
    burstTarget = 0;
  let width = innerWidth,
    height = innerHeight,
    ratio = 1;
  let gl,
    fallback,
    contextLost = false;
  const maxCount = 12000;
  const duration = 6.4;
  let released = false;
  let openingFinished = false, revealAnnounced = false, lastPhase = "ambient";
  const mobile = () => Math.min(width, height) < 640;
  const particleCount = () => fallback ? (mobile() ? 480 : 800) : (mobile() ? 6000 : maxCount);
  const smooth = (a, b, value) => {
    const p = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return p * p * (3 - 2 * p);
  };

  function butterflyTexture() {
    const atlas = document.createElement("canvas");
    atlas.width = 128;
    atlas.height = 128;
    const c = atlas.getContext("2d");
    const wing = new Path2D(
      "M 63 61 C 53 42 35 9 9 13 C 0 33 14 60 39 68 C 13 60 10 83 24 100 C 36 113 53 94 61 74 L 63 61 Z",
    );
    for (const side of [1, -1]) {
      c.save();
      if (side === -1) {
        c.translate(128, 0);
        c.scale(-1, 1);
      }
      const gradient = c.createLinearGradient(12, 17, 65, 88);
      gradient.addColorStop(0, "#a3d3cc");
      gradient.addColorStop(0.5, "#dcebe8");
      gradient.addColorStop(1, "#afc6db");
      c.fillStyle = gradient;
      c.fill(wing);
      c.strokeStyle = "#f5ecd2";
      c.lineWidth = 1;
      c.stroke(wing);
      c.save();
      c.clip(wing);
      c.strokeStyle = "#7a9caa66";
      c.lineWidth = 1.3;
      for (let i = 0; i < 7; i++) {
        c.beginPath();
        c.moveTo(62, 67);
        c.lineTo(8 + i * 8, 9 + i * 2);
        c.stroke();
      }
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(61, 70);
        c.lineTo(17 + i * 8, 102);
        c.stroke();
      }
      c.restore();
      c.fillStyle = "#fff4d1";
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.ellipse(15 + i * 6, 23 + i * 8, 1.8, 2.8, -0.4, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }
    c.fillStyle = "#609dc4";
    c.beginPath();
    c.ellipse(64, 66, 2, 21, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#78a9bd";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(63, 48);
    c.quadraticCurveTo(55, 38, 56, 35);
    c.moveTo(65, 48);
    c.quadraticCurveTo(73, 38, 72, 35);
    c.stroke();
    return atlas;
  }
  const texture = butterflyTexture();
  const tintedSprites = new Map();
  let updateBrandGPU = () => {};
  const seeds = new Float32Array(maxCount * 4);
  const shape = new Float32Array(maxCount * 2);
  const colors = new Float32Array(maxCount * 3);
  function sampleBrand() {
  const pixels = texture.getContext("2d").getImageData(0, 0, 128, 128).data;
  const occupied = [];
  for (let pixel = 0; pixel < 128 * 128; pixel++)
    if (pixels[pixel * 4 + 3] >= 100) occupied.push(pixel);
  if (!occupied.length) throw new Error("The brand texture is empty");
  for (let i = 0; i < maxCount; i++) {
    seeds[i * 4] = Math.random();
    seeds[i * 4 + 1] = Math.random();
    seeds[i * 4 + 2] = Math.random();
    seeds[i * 4 + 3] = Math.random();
    const pixel = occupied[Math.floor(Math.random() * occupied.length)];
    const x = pixel % 128, y = Math.floor(pixel / 128);
    shape[i * 2] = (x + Math.random()) / 64 - 1;
    shape[i * 2 + 1] = 1 - (y + Math.random()) / 64;
    for (let channel = 0; channel < 3; channel++)
      colors[i * 3 + channel] = pixels[(y * 128 + x) * 4 + channel] / 255;
  }
  }
  sampleBrand();
  async function loadBrand() {
    try {
      const source = document.querySelector(".brand-logo");
      if (!source) throw new Error("Missing local brand SVG");
      const svg = source.cloneNode(true);
      svg.setAttribute("width", "512");
      svg.setAttribute("height", "418");
      svg.removeAttribute("class");
      const image = new Image();
      image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
      await image.decode();
      const context = texture.getContext("2d");
      context.clearRect(0, 0, 128, 128);
      context.drawImage(image, 0, 12, 128, 104);
      sampleBrand();
      tintedSprites.clear();
      updateBrandGPU();
      const stamp = openingElement.querySelector(".opening-static-logo");
      stamp.src = image.src;
      openingElement.dataset.brand = "ready";
      window.ButterflySwarm.brandSource = "inline-logo";
    } catch {
      // The local SVG remains visible even if canvas sampling is unavailable.
      openingElement.dataset.brand = "fallback";
      openingElement.classList.add("brand-fallback");
      window.ButterflySwarm.brandSource = "static-logo";
    }
  }
  function initGL() {
    gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
      premultipliedAlpha: true,
    });
    if (!gl) return false;
    const vertex = `
      attribute vec4 aSeed;
      attribute vec2 aShape;
      attribute vec3 aColor;
      uniform vec2 uResolution;
      uniform float uTime, uClock, uMode, uRatio, uBurst;
      varying vec3 vColor;
      varying float vAlpha, vFlap, vAngle;
      void main() {
        float t = uTime;
        float z = aSeed.z;
        float aspect = uResolution.x / uResolution.y;
        float x = mod(aSeed.x * 2.8 + t * (.017 + z * .06), 2.8) - 1.4;
        float y = (aSeed.y * 2.4 - 1.2) + sin(x * 3.0 + t * .35 + aSeed.w * 12.0) * .13;
        float angle = aSeed.w * 6.283 + t * (.07 + .12 * z);
        float radius = .15 + aSeed.x * 1.5;
        vec2 vortex = vec2(cos(angle) * radius / aspect, sin(angle) * radius);
        vec2 ambient = mix(vec2(x,y), vortex, .05);
        float gather = smoothstep(.15,2.4,t);
        float release = smoothstep(3.2,4.8,t);
        float clear = smoothstep(5.2,6.4,t);
        float fit = min(.88, aspect * .82);
        vec2 silhouette = aShape * vec2(fit/aspect,fit);
        silhouette.x *= .94 + .06 * cos(uClock * 1.35);
        silhouette.y += sin(uClock * .85) * .012;
        vec2 scattered = vec2(aSeed.x*3.6-1.8,aSeed.y*3.6-1.8);
        scattered += vec2(sin(t+aSeed.w*8.0),cos(t*.7+aSeed.x*9.0))*.035;
        vec2 formed = mix(scattered,silhouette,gather);
        float flyTime = max(0.0,t-3.2);
        vec2 flight = vec2(mod(aSeed.x*3.4+flyTime*(.15+z*.7),3.4)-1.7,
                           aSeed.y*2.6-1.3 + sin(aSeed.x*8.0+flyTime)*.18);
        vec2 position = mix(ambient,mix(formed,flight,release),uMode);
        float side = aSeed.x < .5 ? -1.0 : 1.0;
        position.x += side * clear * (1.8 + z) * uMode;
        position.y += sin(aSeed.w*6.28)*clear*.35*uMode;
        position *= 1.0 + uBurst * 2.5;
        gl_Position = vec4(position, 0.0, 1.0);
        float nearSize = 2.0 + pow(z, 8.0) * 62.0;
        float gatherSize = mix(nearSize*.55,4.0+aSeed.w*2.0,gather);
        gl_PointSize = min(90.0,mix(nearSize*.65,mix(gatherSize,nearSize,release),uMode)*uRatio);
        float formedAlpha = mix(.25,.92,gather);
        vAlpha = mix(mix(.035,.24,z)*.20,mix(formedAlpha,mix(.10,.55,z),release)*(1.0-clear),uMode);
        vColor = aColor;
        vFlap = .65 + .35 * abs(sin(uClock * (1.0 + aSeed.w) + aSeed.x * 20.0));
        vAngle = sin(aSeed.w * 6.28 + uClock * .17) * .25;
      }`;
    const fragment = `precision mediump float;
      uniform sampler2D uTexture;
      varying vec3 vColor;
      varying float vAlpha, vFlap, vAngle;
      void main() {
        vec2 uv = gl_PointCoord - .5;
        float c = cos(vAngle), s = sin(vAngle);
        uv = mat2(c,-s,s,c)*uv;
        uv.x /= vFlap;
        uv += .5;
        if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0) discard;
        vec4 tex = texture2D(uTexture,uv);
        if(tex.a<.05) discard;
        gl_FragColor = vec4(mix(tex.rgb, vColor, .85), tex.a * vAlpha);
      }`;
    function shader(kind, source) {
      const s = gl.createShader(kind);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    const program = gl.createProgram();
    const vs = shader(gl.VERTEX_SHADER, vertex),
      fs = shader(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    const attr = gl.getAttribLocation(program, "aSeed");
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, 4, gl.FLOAT, false, 0, 0);
    const shapeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, shape, gl.STATIC_DRAW);
    const shapeAttr = gl.getAttribLocation(program, "aShape");
    gl.enableVertexAttribArray(shapeAttr);
    gl.vertexAttribPointer(shapeAttr, 2, gl.FLOAT, false, 0, 0);
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    const colorAttr = gl.getAttribLocation(program, "aColor");
    gl.enableVertexAttribArray(colorAttr);
    gl.vertexAttribPointer(colorAttr, 3, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      texture,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);
    gl.enable(gl.BLEND);
    // Match the browser's premultiplied canvas compositing without dark fringes.
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    const uniforms = Object.fromEntries(
      ["uTime", "uClock", "uResolution", "uMode", "uRatio", "uBurst"].map((key) => [
        key,
        gl.getUniformLocation(program, key),
      ]),
    );
    fallback = null;
    updateBrandGPU = () => {
      if (contextLost) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, shape, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture);
    };
    window.ButterflySwarm.renderer = "webgl";
    return () => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.uTime, elapsed);
      gl.uniform1f(uniforms.uClock, clock);
      gl.uniform1f(uniforms.uMode, mode);
      gl.uniform1f(uniforms.uRatio, ratio);
      gl.uniform1f(uniforms.uBurst, burst);
      gl.uniform2f(uniforms.uResolution, width, height);
      gl.drawArrays(gl.POINTS, 0, mode > 0.01 ? particleCount() : 100);
    };
  }
  function initFallback() {
    // A WebGL context cannot be replaced by a 2D context on the same canvas.
    fallback = document.createElement("canvas");
    fallback.setAttribute("aria-hidden", "true");
    fallback.className = "swarm-fallback";
    fallback.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;";
    canvas.after(fallback);
    canvas.style.display = "none";
    const c = fallback.getContext("2d");
    window.ButterflySwarm.renderer = "canvas2d";
    return () => {
      c.clearRect(0, 0, width, height);
      const total = mode > 0.01 ? particleCount() : 24;
      const gather = smooth(.15, 2.4, elapsed);
      const release = smooth(3.2, 4.8, elapsed);
      const clear = smooth(5.2, 6.4, elapsed);
      const aspect = width / height;
      const fit = Math.min(.88, aspect * .82);
      for (let i = 0; i < total; i++) {
        const s = i * 4,
          z = seeds[s + 2],
          nearSize = 4 + z ** 5 * 52;
        const flyTime = Math.max(0, elapsed - 3.2);
        const flightX = ((seeds[s]*3.4+flyTime*(.15+z*.7))%3.4)-1.7;
        const flightY = seeds[s+1]*2.6-1.3+Math.sin(seeds[s]*8+flyTime)*.18;
        const sx = shape[i*2]*fit/aspect*(.94+.06*Math.cos(clock*1.35));
        const sy = shape[i*2+1]*fit+Math.sin(clock*.85)*.012;
        const formedX = (seeds[s]*3.6-1.8)*(1-gather)+sx*gather;
        const formedY = (seeds[s+1]*3.6-1.8)*(1-gather)+sy*gather;
        const px = formedX*(1-release)+flightX*release+(seeds[s]<.5?-1:1)*clear*(1.8+z);
        const py = formedY*(1-release)+flightY*release;
        const ambientX = ((seeds[s]+elapsed*.025)%1.2-.1)*width;
        const x = ambientX*(1-mode)+(px*.5+.5)*width*mode;
        const y = seeds[s+1]*height*(1-mode)+(.5-py*.5)*height*mode;
        const size = mode > .5 ? (nearSize*(1-gather)+(mobile()?5.5:6.5)*gather)*(1-release)+nearSize*release : nearSize;
        c.globalAlpha = mode > .5 ? (.5+gather*.3)*(1-clear) : .04;
        c.save();
        c.translate(x, y);
        c.rotate(-0.3);
        c.scale(0.65 + 0.35 * Math.abs(Math.sin(clock * 1.5 + i)), 1);
        let sprite = texture;
        if (mode > .5 && gather > .5) {
          const rgb = [...colors.subarray(i*3,i*3+3)].map(value => Math.round(value*15)*17);
          const key = rgb.join(",");
          if (!tintedSprites.has(key)) {
            const tint = document.createElement("canvas");
            tint.width = tint.height = 64;
            const ink = tint.getContext("2d");
            ink.drawImage(texture, 0, 0, 64, 64);
            ink.globalCompositeOperation = "source-in";
            ink.fillStyle = `rgb(${key})`;
            ink.fillRect(0, 0, 64, 64);
            tintedSprites.set(key, tint);
          }
          sprite = tintedSprites.get(key);
        }
        c.drawImage(sprite, -size / 2, -size / 2, size, size);
        c.restore();
      }
    };
  }
  window.ButterflySwarm = {
    get count() { return particleCount(); },
    duration: duration * 1000,
    get phase() { return targetMode === 1 ? lastPhase : "ambient"; },
    renderer: "initializing",
    opening(value) {
      if (value) {
        released = false;
        mode = 1;
        elapsed = 0;
        burst = 0;
        burstTarget = 0;
        openingFinished = false;
        revealAnnounced = false;
        lastPhase = "gather";
        openingElement.style.setProperty("--opening-veil", "1");
        openingElement.dataset.phase = "gather";
      } else if (targetMode === 1) burstTarget = 1;
      targetMode = value ? 1 : 0;
      start();
    },
    release() {
      released = true;
      elapsed = Math.max(elapsed, 3.2);
      start();
    },
    setPaused(value) {
      manuallyPaused = Boolean(value);
      if (manuallyPaused) stop();
      else start();
    },
    get reduced() {
      return reduced || manuallyPaused || contextLost;
    },
    get active() {
      return !!frame;
    },
  };
  let draw;
  try {
    draw = initGL() || initFallback();
  } catch {
    draw = initFallback();
  }
  function resize() {
    width = innerWidth;
    height = innerHeight;
    ratio = Math.min(devicePixelRatio || 1, mobile() ? 1.25 : 1.5);
    if (fallback) {
      fallback.width = width * ratio;
      fallback.height = height * ratio;
      fallback.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
    } else {
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }
  function tick(now) {
    frame = 0;
    if (reduced || manuallyPaused || document.hidden || contextLost) return;
    const delta = Math.min((now - last) / 1000, 0.15);
    last = now;
    clock += delta;
    const stamp = openingElement.querySelector(".opening-static-logo");
    if (targetMode === 1 && stamp)
      stamp.style.transform = `translateY(${-Math.sin(clock*.85)*height*.006}px) scaleX(${.94+.06*Math.cos(clock*1.35)})`;
    elapsed = targetMode === 1 && !released ? Math.min(3.1, elapsed + delta) : elapsed + delta;
    mode += (targetMode - mode) * Math.min(1, delta * 2.5);
    burst += (burstTarget - burst) * Math.min(1, delta * 2);
    if (Math.abs(mode - targetMode) < 0.001) mode = targetMode;
    draw();
    if (targetMode === 1) {
      const phase = elapsed < 2.4 ? "gather" : elapsed < 3.2 ? "formed" : elapsed < 5.2 ? "fly" : "reveal";
      if (phase !== lastPhase) openingElement.dataset.phase = lastPhase = phase;
      const clear = smooth(5.2, duration, elapsed);
      openingElement.style.setProperty("--opening-veil", String(1-clear));
      if (clear > 0 && !revealAnnounced) {
        revealAnnounced = true;
        dispatchEvent(new Event("butterfly-opening-reveal"));
      }
      if (elapsed >= duration && !openingFinished) {
        openingFinished = true;
        dispatchEvent(new Event("butterfly-opening-complete"));
      }
    }
    // Completion may call opening(false), which can already schedule the next frame.
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function start() {
    if (
      !frame &&
      !reduced &&
      !manuallyPaused &&
      !document.hidden &&
      !contextLost
    ) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () =>
    document.hidden ? stop() : start(),
  );
  preference.addEventListener("change", (e) => {
    reduced = e.matches;
    if (reduced) {
      stop();
      if (gl && !contextLost) gl.clear(gl.COLOR_BUFFER_BIT);
      if (fallback) fallback.getContext("2d").clearRect(0, 0, width, height);
    } else start();
  });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    contextLost = true;
    openingElement.classList.add("brand-fallback");
    stop();
    if (targetMode === 1) dispatchEvent(new Event("butterfly-opening-complete"));
  });
  canvas.addEventListener("webglcontextrestored", () => {
    contextLost = false;
    if (window.ButterflySwarm.brandSource === "inline-logo") openingElement.classList.remove("brand-fallback");
    try { draw = initGL() || initFallback(); }
    catch { draw = initFallback(); }
    resize();
    start();
  });
  addEventListener("pagehide", stop);
  addEventListener("pageshow", start);
  resize();
  openingElement.classList.add("particle-opening");
  start();
  loadBrand();
})();
