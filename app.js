(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const { filterCatalog, parseRoute } = window.Catalog;
  const records = window.BUTTERFLIES;
  const views = [...document.querySelectorAll(".view")];
  const opening = $("opening"),
    dialog = $("recognition");
  const backgroundSurfaces = document.querySelectorAll(
    ".header, #main, footer, .skip-link",
  );
  let family = "全部",
    query = "",
    gallery = false,
    selected = null,
    photoIndex = 0;
  let photoRequest = 0;
  let catalogReturn = { hash: "#atlas", top: 0, id: null };
  let pendingCatalogReturn = null;
  let openingTimer,
    closeTimer,
    scanTimer,
    scanPhotoTimer,
    scanOrigin,
    scanItem,
    scanGeneration = 0,
    activeScan = false,
    openingVisible = false;

  let departing = false, detailFrame = 0, detailText = "";
  const quietDetail = () => window.ButterflySwarm.reduced;
  function finishDetailAnimation() {
    cancelAnimationFrame(detailFrame);
    if (!selected) return;
    $("detail-description").textContent = detailText;
    $("confidence-value").textContent = "91.35%";
    $("confidence-ring").style.strokeDashoffset = String(100 - 91.35);
    $("show-description").hidden = true;
  }
  function animateDetail() {
    cancelAnimationFrame(detailFrame);
    const start = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - start) / 1500);
      const value = 91.35 * (1 - Math.pow(1 - progress, 3));
      $("confidence-value").textContent = value.toFixed(2) + "%";
      $("confidence-ring").style.strokeDashoffset = String(100 - value);
      const count = Math.floor((now - start) / 28);
      $("detail-description").textContent = Array.from(detailText).slice(0,count).join("");
      if (quietDetail() || (progress === 1 && count >= Array.from(detailText).length)) finishDetailAnimation();
      else detailFrame = requestAnimationFrame(tick);
    };
    $("detail-description").textContent = "";
    $("show-description").hidden = quietDetail();
    if (quietDetail()) finishDetailAnimation();
    else detailFrame = requestAnimationFrame(tick);
  }
  function enterSite() {
    if (!openingVisible || departing) return;
    departing = true;
    if (window.ButterflySwarm.reduced) { finishOpening(); return; }
    window.ButterflySwarm.release();
    openingTimer = setTimeout(finishOpening, 3800);
  }
  function finishOpening() {
    if (!openingVisible) return;
    openingVisible = false;
    clearTimeout(openingTimer);
    opening.classList.add("exiting");
    opening.inert = true;
    backgroundSurfaces.forEach((element) => (element.inert = false));
    document.body.classList.remove("intro-active");
    window.ButterflySwarm.opening(false);
    if (location.hash === "#opening" || !location.hash)
      history.replaceState(null, "", "#intro");
    route();
    closeTimer = setTimeout(() => {
      opening.hidden = true;
      document.body.classList.remove("opening-active");
    }, 1300);
    $("main").focus({ preventScroll: true });
  }
  function showOpening() {
    clearTimeout(openingTimer);
    clearTimeout(closeTimer);
    cancelScan();
    departing = false;
    opening.classList.toggle("static-opening", window.ButterflySwarm.reduced);
    views.forEach((v) => (v.hidden = v.id !== "intro"));
    openingVisible = true;
    backgroundSurfaces.forEach((element) => (element.inert = true));
    opening.hidden = false;
    opening.inert = false;
    opening.classList.remove("exiting");
    document.body.classList.add("opening-active", "intro-active");
    window.ButterflySwarm.opening(true);
    window.scrollTo(0, 0);
    opening.focus({ preventScroll: true });
    // Wait for explicit click, tap or keyboard input; never auto-advance.
  }
  function renderFamilyTabs() {
    const fragment = document.createDocumentFragment();
    ["全部", ...window.FAMILIES].forEach((name) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "family-tab" + (name === family ? " active" : "");
      button.textContent = name;
      button.setAttribute("aria-pressed", String(name === family));
      button.addEventListener("click", () => {
        family = name;
        document.querySelectorAll(".family-tab").forEach((b) => {
          const active = b.textContent === family;
          b.classList.toggle("active", active);
          b.setAttribute("aria-pressed", String(active));
        });
        renderGrid();
      });
      fragment.append(button);
    });
    document.querySelector(".family-tabs").replaceChildren(fragment);
  }
  function renderGrid() {
    const items = gallery
      ? records.flatMap(item => photosFor(item).map(photo => ({ ...item, image: photo, detailImage: photo })))
      : filterCatalog(records, family, query);
    if (!gallery) items.sort((a,b) => window.FAMILIES.indexOf(a.family) - window.FAMILIES.indexOf(b.family));
    const fragment = document.createDocumentFragment();
    let lastFamily = null;
    if (!gallery && !query.trim() && family === "全部") {
      // Empty client families stay discoverable through the same filter tabs.
      window.FAMILIES.filter(name => !items.some(item => item.family === name)).forEach(name => {
        const slot = document.createElement("p");
        slot.className = "family-placeholder";
        slot.textContent = name + " · 物种资料待提供";
        fragment.append(slot);
      });
    }
    items.forEach((item, index) => {
      if (!gallery && item.family !== lastFamily) {
        const heading = document.createElement("h2");
        heading.className = "family-group-heading";
        heading.textContent = item.family;
        fragment.append(heading);
        lastFamily = item.family;
      }
      const card = document.createElement("button");
      card.type = "button";
      card.className = "butterfly-card";
      card.dataset.speciesId = item.id;
      card.setAttribute(
        "aria-label",
        gallery
          ? `查看第 ${index + 1} 张蝴蝶图片的物种档案`
          : `查看${item.name}的物种档案`,
      );
      const imageBox = document.createElement("div");
      imageBox.className = "card-image";
      const image = document.createElement("img");
      image.src = item.image;
      image.alt = gallery ? "蝴蝶参考照片" : item.name;
      image.loading = index < 8 ? "eager" : "lazy";
      image.width = 500;
      image.height = 400;
      image.addEventListener("error", () => {
        image.alt = "图片暂时无法显示，仍可点击查看物种档案";
      });
      const arrow = document.createElement("span");
      arrow.className = "card-hover";
      arrow.textContent = "↗";
      arrow.setAttribute("aria-hidden", "true");
      imageBox.append(image, arrow);
      card.append(imageBox);
      if (!gallery) {
        const copy = document.createElement("div");
        copy.className = "card-copy";
        const name = document.createElement("h2");
        name.textContent = item.name;
        const tag = document.createElement("span");
        tag.textContent = item.family;
        copy.append(name, tag);
        card.append(copy);
      }
      card.addEventListener("click", () => beginScan(item, card));
      fragment.append(card);
    });
    $("butterfly-grid").replaceChildren(fragment);
    $("result-count").textContent =
      `${family === "全部" ? "全部蝴蝶" : family} · ${items.length} 种`;
    $("empty-state").hidden = items.length !== 0;
    $("empty-description").textContent = query.trim()
      ? "没有找到相符的蝴蝶，换一个名字试试。"
      : `${family}的物种资料正在整理中，先去认识其他蝴蝶吧。`;
  }
  function setGallery(value) {
    gallery = value;
    $("atlas").classList.toggle("gallery-mode", value);
    document.querySelector(".atlas-toolbar").hidden = value;
    document.querySelector(".gallery-note").hidden = !value;
    document.querySelector(".result-meta").hidden = value;
    $("gallery-toggle").hidden = value;
    const heading = $("atlas-heading");
    if (value) heading.textContent = "凭直觉，遇见一只蝶";
    else {
      const emphasis = document.createElement("span");
      emphasis.textContent = "蝶境";
      heading.replaceChildren(document.createTextNode("走进金陵"), document.createElement("br"), emphasis);
    }
    renderGrid();
  }
  function showDetail(item) {
    selected = item;
    photoIndex = 0;
    $("detail-image").alt = item.name;
    $("detail-name").textContent = item.name;
    $("detail-family").textContent = item.family;
    detailText = item.description;
    $("detail-description-accessible").textContent = detailText;
    $("confidence-value").textContent = "0.00%";
    $("confidence-ring").style.strokeDashoffset = "100";
    animateDetail();
    $("detail-distribution").textContent = item.distribution;
    showPhoto();
  }
  function photosFor(item) {
    return item.photos?.length
      ? item.photos
      : [...new Set([item.detailImage, item.image])];
  }
  function showPhoto(retry = false) {
    if (!selected) return;
    const photos = photosFor(selected);
    const image = $("detail-image");
    const message = $("photo-message");
    const request = ++photoRequest;
    const source = photos[photoIndex] + (retry ? `?retry=${request}` : "");
    const expected = new URL(source, document.baseURI).href;
    const current = () => request === photoRequest && image.src === expected;
    $("photo-count").textContent = `${photoIndex + 1} / ${photos.length}`;
    $("photo-switch").disabled = photos.length < 2;
    $("photo-switch").setAttribute(
      "aria-label",
      `切换参考照片，当前第 ${photoIndex + 1} 张，共 ${photos.length} 张`,
    );
    message.hidden = false;
    $("photo-status").textContent = "图片加载中…";
    $("retry-photo").hidden = true;
    image.hidden = true;
    image.onload = () => {
      if (!current() || image.naturalWidth === 0) return;
      image.hidden = false;
      message.hidden = true;
    };
    image.onerror = () => {
      if (!current()) return;
      image.hidden = true;
      $("photo-status").textContent = "这张照片未能加载，可重试或切换下一张。";
      $("retry-photo").hidden = false;
    };
    image.src = source;
    if (image.complete && image.naturalWidth > 0) image.onload();
  }
  function route(focus = false) {
    cancelScan();
    cancelAnimationFrame(detailFrame);
    if (location.hash === "#opening") {
      showOpening();
      return;
    }
    if (openingVisible) finishOpening();
    const result = parseRoute(location.hash, records);
    if (result.view === "detail" && !$("atlas").hidden) {
      catalogReturn = {
        hash: gallery ? "#gallery" : "#atlas",
        top: window.scrollY,
        id: result.species.id,
      };
    } else if (result.view === "detail" && $("detail").hidden) {
      catalogReturn = { hash: "#atlas", top: 0, id: null };
    }
    if (result.view !== "atlas") pendingCatalogReturn = null;
    views.forEach((v) => (v.hidden = v.id !== result.view));
    document.querySelectorAll("[data-nav]").forEach((a) => {
      const active =
        a.dataset.nav === result.view ||
        (result.view === "detail" && a.dataset.nav === "atlas");
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    if (result.view === "atlas") setGallery(result.gallery);
    if (result.view === "detail") showDetail(result.species);
    document.title = `${result.species ? result.species.name + " · " : ""}护蝶志 · 金陵有蝶`;
    if (focus) {
      window.scrollTo(0, 0);
      $("main").focus({ preventScroll: true });
    }
    if (result.view === "atlas" && pendingCatalogReturn) {
      const saved = pendingCatalogReturn;
      pendingCatalogReturn = null;
      requestAnimationFrame(() => {
        if (location.hash !== saved.hash) return;
        window.scrollTo(0, saved.top);
        document.querySelector(
          `.butterfly-card[data-species-id="${saved.id}"]`,
        )?.focus({ preventScroll: true });
      });
    }
  }
  function returnToCatalog() {
    pendingCatalogReturn = { ...catalogReturn };
    location.hash = catalogReturn.hash;
  }
  function cancelScan() {
    clearTimeout(scanTimer);
    clearTimeout(scanPhotoTimer);
    scanGeneration++;
    activeScan = false;
    $("scan-image").onload = null;
    $("scan-image").onerror = null;
    dialog.setAttribute("aria-busy", "false");
    if (dialog.open) dialog.close();
  }
  function beginScan(item, origin, retry = false) {
    if (activeScan) return;
    scanOrigin = origin;
    scanItem = item;
    activeScan = true;
    const generation = ++scanGeneration;
    const current = () => activeScan && generation === scanGeneration;
    const quiet = () => window.ButterflySwarm.reduced;
    const image = $("scan-image");
    let photoReady = false, pagesReady = false;
    const steps = [...document.querySelectorAll(".scan-steps span")];
    steps.forEach((s) => s.classList.remove("done"));
    dialog.dataset.phase = "opening";
    dialog.setAttribute("aria-busy", "true");
    $("recognition-title").textContent = "翻开一页，遇见一只蝶";
    $("scan-status").textContent = "小蝶正在翻手帐…";
    $("scan-error-actions").hidden = true;
    $("retry-scan").disabled = true;
    $("cancel-recognition").hidden = false;
    image.hidden = true;
    image.alt = item.name + "的参考照片";
    const fail = () => {
      if (!current()) return;
      clearTimeout(scanTimer);
      clearTimeout(scanPhotoTimer);
      image.onload = image.onerror = null;
      image.hidden = true;
      dialog.dataset.phase = "error";
      dialog.setAttribute("aria-busy", "false");
      $("recognition-title").textContent = "这一页没打开";
      $("scan-status").textContent = "照片暂时没能送达，再试一次吧。";
      $("scan-error-actions").hidden = false;
      $("retry-scan").disabled = false;
      $("cancel-recognition").hidden = true;
      $("retry-scan").focus({ preventScroll: true });
    };
    const complete = () => {
      if (!current() || !photoReady || !pagesReady || dialog.dataset.phase === "error" || dialog.dataset.phase === "complete") return;
      clearTimeout(scanPhotoTimer);
      dialog.dataset.phase = "complete";
      dialog.setAttribute("aria-busy", "false");
      $("recognition-title").textContent = "这一页，找到了";
      $("scan-status").textContent = "带你去看看它的故事";
      steps.forEach((step) => step.classList.add("done"));
      scanTimer = setTimeout(() => {
        if (!current()) return;
        activeScan = false;
        image.onload = image.onerror = null;
        dialog.close();
        location.hash = `#species/${item.id}`;
      }, quiet() ? 85 : 1100);
    };
    image.onload = () => {
      if (!current() || dialog.dataset.phase === "error" || image.naturalWidth === 0) return;
      photoReady = true;
      image.hidden = false;
      complete();
    };
    image.onerror = fail;
    scanPhotoTimer = setTimeout(fail, 8000);
    if (!dialog.open) dialog.showModal();
    image.src = (item.detailImage || item.image) + (retry ? `?loader-retry=${generation}` : "");
    if (image.complete && image.naturalWidth > 0) image.onload();
    scanTimer = setTimeout(() => {
      if (!current() || dialog.dataset.phase === "error") return;
      dialog.dataset.phase = "loading";
      steps[0].classList.add("done");
      scanTimer = setTimeout(() => {
        if (!current() || dialog.dataset.phase === "error") return;
        steps[1].classList.add("done");
        $("scan-status").textContent = "正在整理这次相遇…";
        scanTimer = setTimeout(() => {
          if (!current() || dialog.dataset.phase === "error") return;
          pagesReady = true;
          if (!photoReady) $("scan-status").textContent = "照片还在路上，请稍候…";
          complete();
        }, quiet() ? 45 : 1200);
      }, quiet() ? 45 : 1200);
    }, quiet() ? 45 : 400);
  }
  $("retry-scan").addEventListener("click", () => {
    if (dialog.dataset.phase !== "error" || $("retry-scan").disabled) return;
    const item = scanItem, origin = scanOrigin;
    cancelScan();
    beginScan(item, origin, true);
  });
  $("return-scan").addEventListener("click", () => {
    const fromCatalog = !$("atlas").hidden;
    cancelScan();
    if (fromCatalog) scanOrigin?.focus();
    else returnToCatalog();
  });
  $("cancel-recognition").addEventListener("click", () => {
    cancelScan();
    scanOrigin?.focus();
  });
  dialog.addEventListener("cancel", () => {
    cancelScan();
    scanOrigin?.focus();
  });
  $("search").addEventListener("input", (event) => {
    query = event.target.value;
    renderGrid();
  });
  $("clear-filters").addEventListener("click", () => {
    family = "全部";
    query = "";
    $("search").value = "";
    renderFamilyTabs();
    renderGrid();
  });
  $("gallery-toggle").addEventListener(
    "click",
    () => (location.hash = "#gallery"),
  );
  $("back-classified").addEventListener(
    "click",
    () => (location.hash = "#atlas"),
  );
  $("back-to-atlas").addEventListener(
    "click",
    returnToCatalog,
  );
  $("photo-switch").addEventListener("click", () => {
    if (!selected) return;
    photoIndex = (photoIndex + 1) % photosFor(selected).length;
    showPhoto();
  });
  $("retry-photo").addEventListener("click", () => showPhoto(true));
  $("next-butterfly").addEventListener("click", () => {
    const index = records.findIndex((b) => b.id === selected?.id);
    beginScan(records[(index + 1) % records.length], $("next-butterfly"));
  });
  $("finish").addEventListener("click", () => { location.hash = "#opening"; });
  $("show-description").addEventListener("click", finishDetailAnimation);
  $("motion-toggle")?.addEventListener("click", finishDetailAnimation);
  new MutationObserver(() => {
    if (document.body.classList.contains("motion-paused") && !$("detail").hidden) finishDetailAnimation();
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  opening.addEventListener("click", enterSite);
  opening.addEventListener("keydown", (e) => {
    if (["Enter", " ", "Escape"].includes(e.key)) {
      e.preventDefault();
      enterSite();
    }
  });

  addEventListener("hashchange", () => route(true));
  addEventListener("butterfly-opening-reveal", () => {
    if (openingVisible) document.body.classList.remove("intro-active");
  });
  addEventListener("butterfly-opening-complete", () => { if (departing) finishOpening(); });
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
    "change",
    (e) => {
      opening.classList.toggle("static-opening", e.matches);
      if (e.matches && departing) finishOpening();
      if (e.matches && !$("detail").hidden) finishDetailAnimation();
    },
  );
  renderFamilyTabs();
  route();
  requestAnimationFrame(() => window.scrollTo(0, 0));
  addEventListener("load", () => setTimeout(() => window.scrollTo(0, 0), 0), {
    once: true,
  });
  if (!location.hash || location.hash === "#opening")
    showOpening();
  else {
    opening.hidden = true;
    window.ButterflySwarm.opening(false);
  }
})();
