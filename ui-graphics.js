/* Local, reusable SVG artwork. Photographs stay content; interface art is vector. */
(() => {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  let paused = false,
    flockTimer,
    routeAnimation;
  const templates = new DOMParser().parseFromString(
    `<svg xmlns="${NS}"><defs>
    <linearGradient id="ui-wing" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#173344"/><stop offset=".32" stop-color="#367d86"/><stop offset=".58" stop-color="#80dcc8"/><stop offset=".81" stop-color="#368b93"/><stop offset="1" stop-color="#143c48"/></linearGradient>
    <linearGradient id="ui-wing-lower" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#286f77"/><stop offset=".44" stop-color="#7bd4b6"/><stop offset=".78" stop-color="#d6b873"/><stop offset="1" stop-color="#434c3b"/></linearGradient>
    <linearGradient id="ui-gold"><stop stop-color="#778b80"/><stop offset=".4" stop-color="#f3dca3"/><stop offset=".7" stop-color="#b88f55"/><stop offset="1" stop-color="#e9dcae"/></linearGradient>
    <linearGradient id="ui-trail"><stop stop-color="#62d7c8" stop-opacity="0"/><stop offset=".6" stop-color="#6ee4d2" stop-opacity=".8"/><stop offset="1" stop-color="#e4cf91"/></linearGradient>
    <radialGradient id="ui-scene-glow"><stop stop-color="#3cb3a3" stop-opacity=".2"/><stop offset="1" stop-color="#3cb3a3" stop-opacity="0"/></radialGradient>
    <radialGradient id="ui-wing-sheen"><stop stop-color="#ceffdf" stop-opacity=".38"/><stop offset="1" stop-color="#57c3c4" stop-opacity="0"/></radialGradient>
    <symbol id="ui-arrow" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></symbol>
    <symbol id="ui-check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></symbol>
    <symbol id="ui-diagonal" viewBox="0 0 24 24"><path d="M6 18 18 6M6 6h12v12"/></symbol>
    <symbol id="ui-back" viewBox="0 0 24 24"><path d="M19 12H5m6-6-6 6 6 6"/></symbol>
    <symbol id="ui-replay" viewBox="0 0 24 24"><path d="M4 10a8 8 0 1 1 .7 6M4 4v6h6"/></symbol>
    <symbol id="ui-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></symbol>
    <symbol id="ui-pause" viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></symbol>
    <symbol id="ui-play" viewBox="0 0 24 24"><path d="m8 4 12 8-12 8Z"/></symbol>
    <symbol id="ui-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></symbol>
    <symbol id="ui-leaf" viewBox="0 0 24 24"><path d="M20 3C8 2 1 9 6 17s17 1 14-14ZM4 21 17 7m-6 6v-5m0 5h5"/></symbol>
    <symbol id="ui-focus" viewBox="0 0 24 24"><path d="M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6"/><circle cx="12" cy="12" r="4"/></symbol>
    <symbol id="ui-pin" viewBox="0 0 24 24"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></symbol>
    <symbol id="ui-butterfly-icon" viewBox="0 0 24 24"><path d="M12 8C7 0 1 2 3 8c1 3 5 4 9 5C5 8 2 14 6 18c3 3 5-2 6-5m0-5c5-8 11-6 9 0-1 3-5 4-9 5 7-5 10 1 6 5-3 3-5-2-6-5m0-7v14m0-14-2-3m2 3 2-3"/></symbol>
    <symbol id="ui-wing-half" viewBox="0 0 640 440">
      <path class="wing-upper" d="M317 225C293 179 225 78 130 34 87 14 42 7 25 32 16 57 42 120 83 161 132 210 211 241 317 240Z" fill="url(#ui-wing)" stroke="url(#ui-gold)" stroke-width="2"/>
      <path d="M311 239C267 216 193 209 150 230 119 247 123 279 143 309 156 329 159 346 183 354 217 374 252 333 274 302 295 276 305 257 311 239Z" fill="url(#ui-wing-lower)" stroke="url(#ui-gold)" stroke-width="1.8"/>
      <path d="M309 223C255 153 147 43 35 35M309 229C233 184 117 103 31 53M310 233C217 201 105 159 48 93M310 238C240 224 131 216 78 153M306 244C246 244 180 255 137 272M305 246C259 267 206 307 179 349M307 245C271 280 245 321 220 346M309 243C281 278 276 292 254 322" fill="none" stroke="#174854" stroke-width="2.6"/>
      <path d="M297 209C253 131 190 79 127 50M298 218C224 184 123 127 64 63M297 229C218 216 145 185 88 136M300 245C228 250 176 276 159 302M301 247C259 283 235 320 212 336" fill="none" stroke="#b9ead0" stroke-opacity=".45" stroke-width="1"/>
      <path d="M31 34C40 74 64 115 93 142 145 191 210 216 281 230" fill="none" stroke="#0c2736" stroke-opacity=".7" stroke-width="15"/>
      <path d="M29 33C52 95 88 139 132 167" class="wing-rim" fill="none" stroke="#eddbaa" stroke-width="2" stroke-dasharray="3 12" stroke-linecap="round"/>
      <path d="M145 270C148 298 165 323 187 338" fill="none" stroke="#244941" stroke-width="12" stroke-opacity=".6"/>
      <path d="M144 268C150 298 166 322 188 340" fill="none" stroke="#efe0ac" stroke-width="2" stroke-dasharray="3 10" stroke-linecap="round"/>
      <ellipse cx="156" cy="112" rx="76" ry="40" transform="rotate(34 156 112)" fill="url(#ui-wing-sheen)"/>
      <path class="wing-vein-flow" d="M312 232Q177 178 42 45M307 244Q218 274 182 343" fill="none" stroke="#e9ffdc" stroke-width="1.4" stroke-dasharray="25 600"/>
      <g fill="#d3ebcb" opacity=".8"><ellipse cx="57" cy="57" rx="2" ry="4" transform="rotate(-40 57 57)"/><ellipse cx="70" cy="81" rx="2" ry="4" transform="rotate(-40 70 81)"/><ellipse cx="88" cy="105" rx="2" ry="4" transform="rotate(-40 88 105)"/><ellipse cx="109" cy="129" rx="2" ry="4" transform="rotate(-40 109 129)"/><circle cx="159" cy="286" r="2"/><circle cx="170" cy="306" r="2"/></g>
    </symbol>
    <symbol id="ui-specimen" viewBox="0 0 640 440">
      <g class="vector-wing wing-vector-left"><use href="#ui-wing-half" width="640" height="440"/></g>
      <g transform="translate(640 0) scale(-1 1)"><g class="vector-wing wing-vector-right"><use href="#ui-wing-half" width="640" height="440"/></g></g>
      <path d="M316 215c-4-12-3-20 4-22 7 2 8 10 4 22l1 61-5 43-5-43Z" fill="url(#ui-gold)" stroke="#0d3436" stroke-width="2"/>
      <ellipse cx="320" cy="208" rx="5" ry="9" fill="#bfe7d0"/><circle cx="320" cy="193" r="5" fill="#d2c898"/>
      <path d="M318 192q-14-25-22-22m26 22q14-25 22-22" fill="none" stroke="#d5d9b4" stroke-width="1.1" stroke-linecap="round"/>
    </symbol>
    <symbol id="ui-card-frame" viewBox="0 0 600 400"><path d="M0 55V0h55M545 0h55v55M600 345v55h-55M55 400H0v-55" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/><path d="M12 28V12h16m544 0h16v16M12 372v16h16m544 0h16v-16" fill="none" stroke="currentColor" stroke-opacity=".45" vector-effect="non-scaling-stroke"/></symbol>
  </defs></svg>`,
    "image/svg+xml",
  );
  const bank = document.importNode(templates.documentElement, true);
  bank.classList.add("svg-bank");
  bank.setAttribute("aria-hidden", "true");
  bank.setAttribute("width", "0");
  bank.setAttribute("height", "0");
  document.body.prepend(bank);
  function symbol(name, viewBox = "0 0 24 24", className = "ui-icon") {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add(...className.split(" "));
    if (name === "specimen") {
      // Keep wing groups in the live DOM so their timelines can be paused and inspected.
      [...bank.querySelector("#ui-specimen").children].forEach((child) =>
        svg.append(child.cloneNode(true)),
      );
    } else {
      const use = document.createElementNS(NS, "use");
      use.setAttribute("href", `#ui-${name}`);
      svg.append(use);
    }
    if (name === "card-frame") svg.setAttribute("preserveAspectRatio", "none");
    return svg;
  }
  function svgMarkup(markup, className) {
    const doc = new DOMParser().parseFromString(
      `<svg xmlns="${NS}" viewBox="0 0 1200 360">${markup}</svg>`,
      "image/svg+xml",
    );
    const svg = document.importNode(doc.documentElement, true);
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add(className);
    return svg;
  }
  function decorateControls(root = document) {
    root.querySelectorAll("button, a").forEach((control) => {
      if (control.dataset.svgControl) return;
      const textNodes = [];
      const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
      while (walker.nextNode())
        if (/[↗→←↻✳]/u.test(walker.currentNode.textContent))
          textNodes.push(walker.currentNode);
      for (const node of textNodes) {
        const parts = node.textContent.split(/([↗→←↻✳])/u);
        const frag = document.createDocumentFragment();
        for (const part of parts)
          frag.append(
            /[↗→←↻✳]/u.test(part)
              ? symbol(
                  {
                    "↗": "diagonal",
                    "→": "arrow",
                    "←": "back",
                    "↻": "replay",
                    "✳": "leaf",
                  }[part],
                )
              : document.createTextNode(part),
          );
        node.replaceWith(frag);
      }
      control.dataset.svgControl = "true";
    });
  }
  function mountSpecimens() {
    document.querySelectorAll(".living-butterfly").forEach((host) => {
      host.replaceChildren(symbol("specimen", "0 0 640 440", "specimen-svg"));
    });
    const brand = document.querySelector(".brand img");
    if (brand)
      brand.replaceWith(
        symbol("butterfly-icon", "0 0 24 24", "brand-symbol ui-icon"),
      );
    document
      .querySelectorAll(".mission-symbol,.protect-note>span,.empty-state>span")
      .forEach((host) => host.replaceChildren(symbol("leaf")));
    document.querySelector(".search-icon").replaceWith(symbol("search"));
  }
  function landscape() {
    let contours = "";
    for (let i = 0; i < 12; i++)
      contours += `<path d="M-100 ${230 + i * 17}C140 ${70 + i * 13} 240 ${410 + i * 12} 470 ${220 + i * 8}S760 ${90 + i * 15} 920 ${210 + i * 8} 1170 ${80 + i * 8} 1300 ${185 + i * 7}"/>`;
    return svgMarkup(
      `<g class="landscape-contours" fill="none" stroke="#8ac7ad" stroke-opacity=".12" stroke-width=".7">${contours}</g><g class="landscape-leaves" fill="none" stroke="#8ac7ad" stroke-width="1" stroke-opacity=".24"><path d="M1170 365q-75-160-160-190m97 104q2-52-48-72 3 49 48 72m-31-46q-1-49-51-59 11 45 51 59M13 370q69-124 103-186m-58 116q-43-5-39-45 33 12 39 45m18-34q42 1 52-38-36 1-52 38"/></g>`,
      "landscape-svg",
    );
  }
  function orbitScene() {
    return svgMarkup(
      `<ellipse cx="770" cy="181" rx="280" ry="131" fill="url(#ui-scene-glow)"/><g class="orbit-lines" fill="none" stroke="#a4d8c3" stroke-opacity=".22" stroke-width=".8"><ellipse cx="790" cy="180" rx="240" ry="126" transform="rotate(-13 790 180)"/><ellipse cx="790" cy="180" rx="196" ry="152" transform="rotate(24 790 180)"/><path class="scene-orbit-trail" d="M550 181a240 126 0 1 1 480 0 240 126 0 1 1-480 0" stroke="url(#ui-trail)" stroke-width="1.7" stroke-dasharray="100 1200"/></g><g class="scene-stars" fill="#d5c492"><path d="m1050 74 2-7 2 7 7 2-7 2-2 7-2-7-7-2Z"/><path d="m570 250 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z"/><circle cx="1055" cy="268" r="2"/><circle cx="635" cy="57" r="1.5"/><circle cx="950" cy="44" r="1"/></g><path d="M104 305C370 70 610 390 1080 93" class="flight-route" fill="none" stroke="url(#ui-trail)" stroke-width="1" stroke-dasharray="5 10"/><g class="tiny-flyer flyer-one"><use href="#ui-butterfly-icon" x="0" y="0" width="22" height="22" fill="none" stroke="#b9d7bb" stroke-width="1"/></g><g class="tiny-flyer flyer-two"><use href="#ui-butterfly-icon" width="14" height="14" fill="none" stroke="#e0bb78" stroke-width="1"/></g>`,
      "orbit-scene-svg",
    );
  }
  function mountStage() {
    const atlas = document.getElementById("atlas");
    const stage = document.createElement("div");
    stage.className = "atlas-stage";
    const copy = document.createElement("div");
    copy.className = "stage-copy";
    const headline = document.createElement("h2");
    headline.textContent = "翅间藏万象";
    const description = document.createElement("p");
    description.textContent = "循着一抹颜色，发现一段生命的故事。";
    const hint = document.createElement("span");
    hint.className = "stage-hint";
    hint.textContent = "轻触蝶翼，唤醒一场飞舞";
    copy.append(headline, description, hint);
    const action = document.createElement("button");
    action.type = "button";
    action.className = "stage-butterfly";
    action.setAttribute("aria-label", "唤醒蝶群");
    const garden = document.createElement("img");
    garden.className = "journal-stage-image";
    garden.src = "assets/journal-garden.webp";
    garden.alt = "";
    garden.width = 1536;
    garden.height = 1024;
    action.append(garden);
    const caption = document.createElement("div");
    caption.className = "stage-caption";
    caption.append(
      symbol("butterfly-icon"),
      document.createTextNode("从这里，遇见金陵的蝴蝶"),
    );
    stage.append(landscape(), orbitScene(), copy, action, caption);
    atlas.querySelector(".page-heading").after(stage);
    action.addEventListener("click", () => releaseFlock(stage));
    const hero = document.querySelector(".hero-art");
    hero.prepend(orbitScene());
    const bg = landscape();
    bg.classList.add("hero-landscape");
    document.querySelector(".hero").prepend(bg);
    const detail = document.querySelector(".detail-photo");
    detail.append(
      symbol("card-frame", "0 0 600 400", "vector-frame detail-vector-frame"),
    );
    document
      .querySelector(".about-visual")
      .append(symbol("card-frame", "0 0 600 400", "vector-frame"));
    const scan = document.querySelector(".scan-frame");
    const ring = document.createElementNS(NS, "svg");
    ring.setAttribute("viewBox", "0 0 200 200");
    ring.classList.add("scan-vector");
    ring.setAttribute("aria-hidden", "true");
    const rings = new DOMParser().parseFromString(
      `<svg xmlns="${NS}"><circle cx="100" cy="100" r="94" fill="none" stroke="#7da996" stroke-opacity=".3" stroke-width=".7"/><circle class="scan-vector-progress" cx="100" cy="100" r="89" fill="none" stroke="#b9debc" stroke-width="1.5" stroke-dasharray="120 440"/><path d="M100 0v15m0 170v15M0 100h15m170 0h15" stroke="#dcc38b" stroke-width="1"/></svg>`,
      "image/svg+xml",
    );
    [...rings.documentElement.children].forEach((c) =>
      ring.append(document.importNode(c, true)),
    );
    scan.append(ring);
  }
  function releaseFlock(stage) {
    if (paused || reduced.matches) return;
    clearTimeout(flockTimer);
    stage.querySelectorAll(".released-butterfly").forEach((el) => el.remove());
    stage.classList.add("awakened");
    for (let i = 0; i < 22; i++) {
      const butterfly = symbol(
        "butterfly-icon",
        "0 0 24 24",
        "released-butterfly ui-icon",
      );
      const angle = (i / 22) * Math.PI * 2;
      butterfly.style.setProperty(
        "--fly-x",
        `${Math.cos(angle) * (180 + i * 9)}px`,
      );
      butterfly.style.setProperty(
        "--fly-y",
        `${Math.sin(angle) * (80 + i * 4)}px`,
      );
      butterfly.style.setProperty("--fly-rotate", `${Math.cos(angle) * 70}deg`);
      butterfly.style.setProperty("--fly-delay", `${i * 17}ms`);
      stage.append(butterfly);
    }
    flockTimer = setTimeout(() => {
      stage.classList.remove("awakened");
      stage
        .querySelectorAll(".released-butterfly")
        .forEach((el) => el.remove());
    }, 2100);
  }
  function enhanceCards() {
    document.querySelectorAll(".butterfly-card").forEach((card, i) => {
      if (card.dataset.vectorCard) return;
      card.dataset.vectorCard = "true";
      card.style.setProperty("--card-delay", `${Math.min(i, 11) * 35}ms`);
      card
        .querySelector(".card-image")
        .append(symbol("card-frame", "0 0 600 400", "vector-frame"));
    });
    decorateControls(document.getElementById("butterfly-grid"));
  }
  function decorateFamilies() {
    document.querySelectorAll(".family-tab").forEach((button, index) => {
      if (button.querySelector("svg")) return;
      const glyph = symbol(index === 0 ? "grid" : "butterfly-icon");
      glyph.classList.add("family-glyph");
      glyph.style.setProperty("--family-hue", String(145 + (index % 5) * 17));
      button.prepend(glyph);
    });
  }
  function mountMotionControl() {
    const group = document.createElement("div");
    group.className = "header-tools";
    document.querySelector(".header").append(group);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.id = "motion-toggle";
    toggle.className = "motion-toggle";
    toggle.setAttribute("aria-label", "暂停动效");
    toggle.setAttribute("aria-pressed", "false");
    toggle.title = "暂停动效";
    toggle.append(symbol("pause"));
    group.prepend(toggle);
    toggle.addEventListener("click", () => {
      paused = !paused;
      document.body.classList.toggle("motion-paused", paused);
      window.ButterflySwarm?.setPaused(paused);
      if (paused) routeAnimation?.cancel();
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.setAttribute("aria-label", paused ? "开启动效" : "暂停动效");
      toggle.title = paused ? "开启动效" : "暂停动效";
      toggle.replaceChildren(symbol(paused ? "play" : "pause"));
      if (paused && !document.getElementById("opening").hidden)
        document.getElementById("opening").click();
    });
  }
  function animateView() {
    const view = document.querySelector(".view:not([hidden])");
    routeAnimation?.cancel();
    if (view && !paused && !reduced.matches)
      routeAnimation = view.animate(
        [
          { opacity: 0, transform: "translateY(18px)", filter: "blur(3px)" },
          { opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
        ],
        { duration: 620, easing: "cubic-bezier(.2,.7,.2,1)" },
      );
    document.querySelector(".atlas-stage")?.classList.remove("awakened");
  }
  document.addEventListener(
    "pointermove",
    (event) => {
      if (paused || reduced.matches || !finePointer.matches) return;
      const card = event.target.closest(".butterfly-card");
      if (card) {
        const box = card.getBoundingClientRect();
        card.style.setProperty(
          "--tilt-x",
          `${((event.clientY - box.top) / box.height - 0.5) * -6}deg`,
        );
        card.style.setProperty(
          "--tilt-y",
          `${((event.clientX - box.left) / box.width - 0.5) * 8}deg`,
        );
      }
      const stage = event.target.closest(".hero-art,.atlas-stage");
      if (stage) {
        const box = stage.getBoundingClientRect();
        stage.style.setProperty(
          "--scene-x",
          `${((event.clientX - box.left) / box.width - 0.5) * 16}px`,
        );
        stage.style.setProperty(
          "--scene-y",
          `${((event.clientY - box.top) / box.height - 0.5) * 10}px`,
        );
      }
    },
    { passive: true },
  );
  document
    .getElementById("butterfly-grid")
    .addEventListener("pointerout", (event) => {
      const card = event.target.closest(".butterfly-card");
      if (card && !card.contains(event.relatedTarget)) {
        card.style.removeProperty("--tilt-x");
        card.style.removeProperty("--tilt-y");
      }
    });
  document.addEventListener("visibilitychange", () =>
    document.body.classList.toggle("page-inactive", document.hidden),
  );
  mountSpecimens();
  mountStage();
  mountMotionControl();
  decorateControls();
  enhanceCards();
  decorateFamilies();
  document
    .querySelectorAll(".detail-copy h2")
    .forEach((heading, index) =>
      heading.prepend(symbol(index ? "pin" : "focus")),
    );
  const gridObserver = new MutationObserver(enhanceCards);
  gridObserver.observe(document.getElementById("butterfly-grid"), {
    childList: true,
  });
  const familyObserver = new MutationObserver(decorateFamilies);
  familyObserver.observe(document.querySelector(".family-tabs"), {
    childList: true,
  });
  addEventListener("hashchange", animateView);
  window.SVGInterface = {
    symbol,
    enhanceCards,
    animateView,
    get paused() {
      return paused;
    },
  };
})();
