(() => {
  const API = "https://liangrui-admin.floot.app/_api/site-content";
  const FALLBACK_IMAGE = "https://nantong-liangrui.floot.app/_cdn/static/52705473-d496-4b9e-9dc1-1cdcb48e0c77-hero.jpg";

  const text = (selector, value) => {
    const el = document.querySelector(selector);
    if (el && typeof value === "string") el.textContent = value;
  };

  const setMeta = (name, value) => {
    const el = document.querySelector('meta[name="' + name + '"]');
    if (el && value) el.setAttribute("content", value);
  };

  const updateContactLinks = (content) => {
    const email = content.company.email;
    const whatsapp = content.company.whatsapp;
    const digits = whatsapp.replace(/\D/g, "");

    document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
      a.setAttribute("href", "mailto:" + email);
      if (a.textContent && a.textContent.includes("@")) a.textContent = email;
    });

    document.querySelectorAll('a[href^="https://wa.me/"]').forEach((a) => {
      const old = a.getAttribute("href") || "";
      const query = old.includes("?") ? old.slice(old.indexOf("?")) : "";
      a.setAttribute("href", "https://wa.me/" + digits + query);
      if (a.textContent && /\+?86[\s\d]+/.test(a.textContent)) a.textContent = whatsapp;
    });

    document.querySelectorAll('form[action^="https://formsubmit.co/"]').forEach((form) => {
      form.setAttribute("action", "https://formsubmit.co/" + email);
    });

    document.querySelectorAll(".contact-meta").forEach((box) => {
      const rows = box.querySelectorAll("div");
      rows.forEach((row) => {
        const label = row.querySelector("span")?.textContent?.trim().toLowerCase();
        const strong = row.querySelector("strong");
        if (!strong) return;
        if (label === "company") strong.textContent = content.company.name;
        if (label === "location") strong.textContent = content.company.location;
        if (label === "email") strong.innerHTML = '<a href="mailto:' + email + '">' + email + "</a>";
        if (label === "whatsapp") strong.innerHTML = '<a href="https://wa.me/' + digits + '" target="_blank" rel="noopener">' + whatsapp + "</a>";
      });
    });

    document.querySelectorAll("footer p").forEach((p) => {
      if (p.textContent && p.textContent.includes("©")) p.textContent = "© 2026 " + content.company.name;
    });
  };

  const updateCatalogLinks = (content) => {
    if (!content.seo.catalogUrl) return;
    document.querySelectorAll('a[href*="liangrui-catalog.pdf"], a.catalog-link').forEach((a) => {
      a.setAttribute("href", content.seo.catalogUrl);
    });
  };

  const updateProducts = (content) => {
    const grid = document.querySelector(".product-grid");
    if (!grid) return;

    const products = content.products.filter((p) => p.status === "Published");
    grid.innerHTML = "";

    products.forEach((p, index) => {
      const article = document.createElement("article");
      article.className = "product-card reveal" + (index === 0 ? " product-card-feature" : "");
      article.dataset.product = p.name;

      const img = document.createElement("img");
      img.src = p.imageUrl || FALLBACK_IMAGE;
      img.alt = p.name;
      img.loading = index === 0 ? "eager" : "lazy";

      const body = document.createElement("div");
      const label = document.createElement("span");
      label.textContent = String(index + 1).padStart(2, "0") + " · " + p.name.toUpperCase();
      const h3 = document.createElement("h3");
      h3.textContent = p.name;
      const desc = document.createElement("p");
      desc.textContent = p.description || [p.size, p.material].filter(Boolean).join(" · ");
      const button = document.createElement("button");
      button.className = "product-link";
      button.type = "button";
      button.textContent = "Ask about this style →";
      button.addEventListener("click", () => {
        const select = document.querySelector("#rfq-product");
        if (select) {
          select.value = p.name;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        document.querySelector("#inquiry")?.scrollIntoView({ behavior: "smooth" });
      });

      body.append(label, h3, desc, button);
      article.append(img, body);
      grid.appendChild(article);
    });

    document.querySelectorAll("#rfq-product").forEach((select) => {
      const current = select.value;
      select.innerHTML = "";
      const first = document.createElement("option");
      first.value = "";
      first.textContent = "Select a product";
      select.appendChild(first);
      products.forEach((p) => {
        const option = document.createElement("option");
        option.value = p.name;
        option.textContent = p.name;
        select.appendChild(option);
      });
      const custom = document.createElement("option");
      custom.value = "Custom / Other";
      custom.textContent = "Custom / Other";
      select.appendChild(custom);
      if ([...select.options].some((o) => o.value === current)) select.value = current;
    });
  };

  const updateFaq = (content) => {
    const list = document.querySelector(".faq-list");
    if (!list) return;
    list.innerHTML = "";
    content.faqs.forEach((item) => {
      const details = document.createElement("details");
      details.className = "reveal";
      const summary = document.createElement("summary");
      summary.textContent = item.question;
      const p = document.createElement("p");
      p.textContent = item.answer;
      details.append(summary, p);
      list.appendChild(details);
    });
  };

  const updateHomepage = (content) => {
    if (!document.querySelector(".hero")) return;
    text(".hero h1", content.homepage.headline);
    text(".hero .lede", content.homepage.paragraph);

    const primary = document.querySelector(".hero-actions .btn-primary");
    if (primary) primary.textContent = content.homepage.primaryButton;

    const catalogButton = [...document.querySelectorAll(".hero-actions a")].find((a) =>
      (a.textContent || "").toLowerCase().includes("catalog")
    );
    if (catalogButton) catalogButton.textContent = content.homepage.secondaryButton;

    const facts = document.querySelectorAll(".hero-facts strong");
    if (facts[0]) facts[0].textContent = content.oem.sampleLeadTime;
    if (facts[1]) facts[1].textContent = content.oem.moq;

    text(".proof-copy p:first-child", content.oem.experience);

    document.title = content.seo.title || document.title;
    setMeta("description", content.seo.description);

    const org = [...document.querySelectorAll('script[type="application/ld+json"]')].find((s) =>
      (s.textContent || "").includes('"@type": "Organization"')
    );
    if (org) {
      try {
        const data = JSON.parse(org.textContent || "{}");
        data.name = content.company.name;
        data.email = content.company.email;
        data.telephone = content.company.whatsapp;
        org.textContent = JSON.stringify(data);
      } catch (_) {}
    }

    updateProducts(content);
    updateFaq(content);
  };

  const updateLanding = (content) => {
    if (!document.querySelector(".ad-hero")) return;
    text(".ad-hero h1", content.landing.headline);
    text(".ad-hero .lede", content.landing.paragraph);
    const proofs = document.querySelectorAll(".ad-proof span");
    if (proofs[0]) proofs[0].textContent = content.landing.sampleBadge;
    if (proofs[1]) proofs[1].textContent = content.landing.moqBadge;
    text(".proof-copy p:first-child", content.oem.experience);
  };


  const setupInquiryCapture = () => {
    const form = document.querySelector("#rfq-form");
    if (!form || form.dataset.crmCapture === "1") return;
    form.dataset.crmCapture = "1";

    form.addEventListener("submit", () => {
      try {
        const data = new FormData(form);
        const val = (name) => String(data.get(name) || "").trim();
        const payload = {
          name: val("name"),
          company: val("company"),
          email: val("email"),
          phone: val("phone"),
          website: val("website"),
          product: val("product"),
          quantity: val("quantity"),
          size: val("size"),
          message: val("message"),
          utm_source: val("utm_source"),
          utm_medium: val("utm_medium"),
          utm_campaign: val("utm_campaign"),
          utm_term: val("utm_term"),
          utm_content: val("utm_content"),
          landing_page: val("landing_page") || window.location.pathname,
          referrer: val("referrer") || document.referrer || "direct",
          honey: val("_honey")
        };

        fetch("https://liangrui-admin.floot.app/_api/inquiry", {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify(payload),
          mode: "cors",
          keepalive: true
        }).catch(() => {});
      } catch (_) {
        // Email submission remains the fallback even if CRM capture fails.
      }
    }, { capture: true });
  };

  setupInquiryCapture();

  fetch(API, { mode: "cors" })
    .then((r) => {
      if (!r.ok) throw new Error("CMS unavailable");
      return r.json();
    })
    .then(({ content }) => {
      updateContactLinks(content);
      updateCatalogLinks(content);
      updateHomepage(content);
      updateLanding(content);
      document.documentElement.dataset.cms = "loaded";
    })
    .catch((err) => {
      console.warn("Liangrui CMS fallback: using static page content.", err);
      document.documentElement.dataset.cms = "fallback";
    });
})();
