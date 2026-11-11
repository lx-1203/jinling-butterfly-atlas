window.Catalog = {
  filterCatalog(records, family, query) {
    const value = query.trim().toLocaleLowerCase("zh-CN");
    return records.filter(
      (item) =>
        (family === "全部" || item.family === family) &&
        (!value || item.name.toLocaleLowerCase("zh-CN").includes(value)),
    );
  },
  parseRoute(hash, records) {
    if (hash.startsWith("#species/")) {
      const species = records.find((item) => item.id === hash.slice(9));
      return species
        ? { view: "detail", species, gallery: false }
        : { view: "atlas", gallery: false };
    }
    if (hash === "#gallery") return { view: "atlas", gallery: true };
    return {
      view: ["#atlas", "#about"].includes(hash) ? hash.slice(1) : "intro",
      gallery: false,
    };
  },
};
