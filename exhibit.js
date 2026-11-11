/* A local exhibition composition, sharing the SVG and catalog behavior. */
(() => {
  "use strict";
  const atlas = document.getElementById("atlas");
  const heading = atlas.querySelector(".page-heading");
  const stage = atlas.querySelector(".atlas-stage");
  const cover = document.createElement("div");
  cover.className = "atlas-cover";
  heading.before(cover);
  const copy = document.createElement("div");
  copy.className = "cover-copy";
  copy.append(...heading.children);
  heading.remove();
  const actions = document.createElement("div");
  actions.className = "cover-actions";
  const jump = document.createElement("button");
  jump.type = "button";
  jump.className = "button primary collection-jump";
  jump.append(
    document.createTextNode("按科探索"),
    window.SVGInterface.symbol("arrow"),
  );
  jump.addEventListener("click", () =>
    atlas
      .querySelector(".atlas-toolbar")
      .scrollIntoView({
        behavior: window.ButterflySwarm.reduced || document.body.classList.contains("motion-paused") ? "auto" : "smooth",
        block: "start",
      }),
  );
  const more = copy.querySelector("#gallery-toggle");
  actions.append(jump);
  const galleryTop = document.createElement("div");
  galleryTop.className = "gallery-top-action";
  galleryTop.append(more);
  atlas.prepend(galleryTop);
  copy.append(actions);
  const featured = window.BUTTERFLIES.find(
    (item) => item.id === "butterfly-05",
  );
  const feature = document.createElement("a");
  feature.className = "feature-species";
  feature.href = `#species/${featured.id}`;
  feature.setAttribute("aria-label", `了解${featured.name}`);
  const photo = document.createElement("div");
  photo.className = "feature-photo";
  const image = document.createElement("img");
  image.src = featured.detailImage;
  image.alt = featured.name;
  image.width = 500;
  image.height = 660;
  photo.append(image);
  const featureCopy = document.createElement("div");
  featureCopy.className = "feature-copy";
  const label = document.createElement("span");
  label.textContent = "蝶类特写";
  const name = document.createElement("h2");
  name.textContent = featured.name;
  featureCopy.append(label, name, window.SVGInterface.symbol("diagonal"));
  feature.append(photo, featureCopy);
  cover.append(copy, stage, feature);
  const collectionHeading = document.createElement("div");
  collectionHeading.className = "collection-heading";
  const title = document.createElement("h2");
  title.textContent = "寻蝶图鉴";
  const description = document.createElement("p");
  description.textContent = "不同的斑纹与颜色，藏着不同的生命故事。";
  collectionHeading.append(title, description);
  atlas.querySelector(".atlas-toolbar").before(collectionHeading);

  function disk(host, variant) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 600 550");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("exhibit-art-disk");
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute(
      "d",
      "M306 26C433 6 558 94 564 231C578 374 475 516 316 527C159 544 34 433 29 287C19 145 156 44 306 26Z",
    );
    path.setAttribute("fill", variant === "hero" ? "#dbeaa2" : "#d9edb2");
    const orbit = document.createElementNS(svg.namespaceURI, "ellipse");
    orbit.setAttribute("cx", "300");
    orbit.setAttribute("cy", "277");
    orbit.setAttribute("rx", "265");
    orbit.setAttribute("ry", "174");
    orbit.setAttribute("transform", "rotate(-25 300 277)");
    orbit.setAttribute("fill", "none");
    orbit.setAttribute("stroke", "#739a6b");
    orbit.setAttribute("stroke-width", "1");
    orbit.setAttribute("stroke-opacity", ".4");
    svg.append(path, orbit);
    host.prepend(svg);
  }
  disk(stage, "atlas");
  disk(document.querySelector(".hero-art"), "hero");
  const heroLabel = document.createElement("span");
  heroLabel.className = "hero-art-label";
  heroLabel.textContent = "从一只蝴蝶，走进自然。";
  document.querySelector(".hero-art").append(heroLabel);
  const currentView = () => {
    const gallery = location.hash === "#gallery";
    cover.hidden = gallery;
    galleryTop.hidden = gallery;
    collectionHeading.hidden = gallery;
    document.body.classList.toggle("exhibit-gallery", gallery);
  };
  addEventListener("hashchange", currentView);
  currentView();

  document.getElementById("stat-families").textContent = window.FAMILIES.length;

  // The page keeps its existing controls and event handlers; these children are visual only.
  document.body.classList.add("wing-polished");
  document.querySelectorAll(".button.primary").forEach((control) => {
    const label = document.createElement("span");
    label.className = "wing-button-label";
    label.textContent = control.textContent.trim();
    const emblem = document.createElement("span");
    emblem.className = "wing-button-emblem";
    emblem.setAttribute("aria-hidden", "true");
    emblem.append(window.SVGInterface.symbol(control.id === "finish" ? "check" : "butterfly-icon"));
    const arrow = document.createElement("span");
    arrow.className = "wing-button-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.append(window.SVGInterface.symbol("diagonal"));
    control.replaceChildren(emblem, label, arrow);
  });

  // Journal art mounts with the page and stage; it never falls back to the old specimen.
  document.querySelector(".hero-art").setAttribute("aria-label", "小蝴蝶的自然花园，艺术插画");

  const photoNotes = document.createElement("div");
  photoNotes.className = "journal-photo-notes";
  for (const id of ["butterfly-01", "butterfly-02"]) {
    const record = window.BUTTERFLIES.find((item) => item.id === id);
    const link = document.createElement("a");
    link.href = `#species/${record.id}`;
    link.className = "journal-photo-note";
    link.setAttribute("aria-label", `了解${record.name}`);
    const thumb = document.createElement("img");
    thumb.src = record.image;
    thumb.alt = record.name;
    thumb.width = 150;
    thumb.height = 120;
    const caption = document.createElement("span");
    caption.textContent = record.name;
    link.append(thumb, caption);
    photoNotes.append(link);
  }
  document.querySelector(".mission").replaceChildren(photoNotes);
  document.querySelectorAll(".hero-bottom .stat").forEach((stat, index) => {
    const icon = window.SVGInterface.symbol(["butterfly-icon", "leaf", "focus"][index]);
    icon.classList.add("journal-stat-icon");
    stat.prepend(icon);
  });
  document.querySelectorAll(".wing-button-arrow").forEach((arrow) => {
    arrow.replaceChildren(window.SVGInterface.symbol("arrow"));
  });
  document.querySelector("#finish .wing-button-label").textContent = "完成";
  document.querySelector(".hero .eyebrow .status-dot").replaceWith(window.SVGInterface.symbol("leaf"));
  for (const host of [document.querySelector(".header"), document.querySelector("footer")]) {
    const sprig = document.createElement("span");
    sprig.className = "journal-sprig";
    sprig.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 3; i++) {
      const flower = document.createElement("i");
      flower.className = "journal-flower";
      sprig.append(flower);
    }
    host.append(sprig);
  }
})();
