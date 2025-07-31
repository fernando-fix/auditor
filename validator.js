window.onload = function () {
  // Estilo para destaque visual dos elementos com problema
  const style = document.createElement("style");
  style.textContent = `
            .valida-alerta {
            outline: 2px dashed red !important;
            animation: piscar-borda 1s infinite;
            z-index: 9999;
            }
            @keyframes piscar-borda {
            0%, 100% { box-shadow: 0 0 0 2px red; }
            50% { box-shadow: 0 0 0 2px transparent; }
            }
        `;
  document.head.appendChild(style);

  (function validatePage() {
    const results = [];

    const log = () => {
      if (results.length === 0) {
        console.log("%c✅ Nenhum problema encontrado!", "color: green; font-weight: bold;");
      } else {
        console.log("%c🚨 Relatório de Validação Completo:", "color: red; font-weight: bold;");
        results.forEach((res) => {
          if (typeof res === "object") {
            console.warn(res.msg, res.element);
          } else {
            console.warn(res);
          }
        });
      }
    };

    const addResult = (msg, element = null) => {
      if (element && element.classList) {
        element.classList.add("valida-alerta");
        const existingTitle = element.getAttribute("title") || "";
        element.setAttribute("title", existingTitle ? `${existingTitle} | ${msg}` : msg);
      }
      results.push(
        element
          ? {
              msg,
              element,
            }
          : msg
      );
    };

    // (Todas as validações seguem abaixo — sem alterações de lógica)

    ["header", "main", "footer", "nav", "section"].forEach((tag) => {
      if (!document.querySelector(tag)) {
        addResult(`🔸 Ausência da tag semântica <${tag}>.`);
      }
    });

    const title = document.querySelector("title");
    if (!title || !title.textContent.trim()) {
      addResult("🔸 Tag <title> ausente ou vazia.");
    } else {
      const len = title.textContent.trim().length;
      if (len < 30 || len > 65) {
        addResult(`🔸 <title> com tamanho fora do ideal (${len} caracteres).`, title);
      }
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc || !metaDesc.content.trim()) {
      addResult('🔸 <meta name="description"> ausente ou vazia.');
    } else {
      const len = metaDesc.content.trim().length;
      if (len < 70 || len > 160) {
        addResult(`🔸 Meta description com tamanho inadequado (${len} caracteres).`, metaDesc);
      }
    }

    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      addResult('🔸 Tag <link rel="canonical"> ausente.');
    }

    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) {
      const content = robotsMeta.content.toLowerCase();
      if (content.includes("noindex") || content.includes("nofollow")) {
        addResult("⚠️ Meta robots detectado com 'noindex' ou 'nofollow'.", robotsMeta);
      }
    }

    const h1s = document.querySelectorAll("h1");
    if (h1s.length !== 1) {
      addResult(`🔸 Deve haver exatamente 1 <h1>. Encontrado: ${h1s.length}`, h1s[0] || null);
    }

    let lastLevel = 0;
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")];
    headings.forEach((h) => {
      const level = parseInt(h.tagName[1]);
      if (lastLevel && level - lastLevel > 1) {
        addResult(`🔸 Salto de heading: <h${lastLevel}> para <h${level}>.`, h);
      }
      lastLevel = level;
    });

    document.querySelectorAll("a").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || href.trim() === "") {
        addResult("🔸 Link <a> com href vazio ou '#'.", link);
      }
    });

    document.querySelectorAll('a[href^="http"]').forEach((link) => {
      const rel = link.getAttribute("rel");
      const href = link.getAttribute("href");
      const base = new URL(href).origin;
      const base2 = new URL(location.href).origin;
      if (base !== base2 && (!rel || (!rel.includes("noopener") && !rel.includes("noreferrer")))) {
        addResult(`🔸 Link externo sem rel="noopener" ou "noreferrer": ${link.href}`, link);
      }
    });

    document.querySelectorAll("input, select, textarea").forEach((input) => {
      const id = input.id;
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      if (!label && !input.closest("label")) {
        addResult("🔸 Campo de formulário sem label associado.", input);
      }
    });

    if (document.querySelectorAll("[aria-label], [role]").length === 0) {
      addResult("🔸 Nenhum atributo ARIA encontrado.");
    }

    const ids = [...document.querySelectorAll("[id]")];
    const seen = {};
    ids.forEach((el) => {
      const id = el.id;
      if (seen[id]) {
        addResult(`🔸 ID duplicado: '${id}'`, el);
      } else {
        seen[id] = true;
      }
    });

    ["center", "font", "bgsound", "blink", "marquee"].forEach((tag) => {
      const el = document.querySelector(tag);
      if (el) {
        addResult(`🔸 Uso de tag obsoleta: <${tag}>.`, el);
      }
    });

    document.querySelectorAll("[style]").forEach((el) => {
      addResult("🔸 Estilo inline encontrado.", el);
    });

    document.querySelectorAll("*").forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.color === cs.backgroundColor && cs.color !== "rgba(0, 0, 0, 0)") {
        addResult("🔸 Elemento com possível contraste baixo.", el);
      }
    });

    ["og:title", "og:description", "og:image", "og:url"].forEach((tag) => {
      if (!document.querySelector(`meta[property="${tag}"]`)) {
        addResult(`🔸 Meta OG ausente: ${tag}`);
      }
    });
    ["twitter:card", "twitter:title", "twitter:description"].forEach((tag) => {
      if (!document.querySelector(`meta[name="${tag}"]`)) {
        addResult(`🔸 Meta Twitter ausente: ${tag}`);
      }
    });

    if (!document.querySelector('link[rel~="icon"]')) {
      addResult('🔸 Favicon (rel="icon") ausente.');
    }

    const url = window.location.pathname;
    if ((url.match(/[?&]/g) || []).length > 2) {
      addResult(`🔸 URL com muitos parâmetros: ${url}`);
    }

    const loremText = /lorem/i;
    document.querySelectorAll("*").forEach((el) => {
      const text = el.textContent || el.getAttribute("placeholder") || "";
      if (loremText.test(text)) {
        addResult("🔸 Texto lorem encontrado.", el);
      }
    });

    document.querySelectorAll("a, button").forEach((el) => {
      const hasText = Boolean(el.textContent.trim());
      const hasAriaLabel = Boolean(el.getAttribute("aria-label"));
      const hasImgOrSvg = Boolean(el.querySelector("img, svg"));
      if (!hasText && !hasAriaLabel && !hasImgOrSvg) {
        addResult("🔸 Link ou botão sem texto, sem aria-label e sem imagem.", el);
      }
    });

    document.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("width")) addResult("🔸 Imagem sem atributo width", img);
      if (!img.hasAttribute("height")) addResult("🔸 Imagem sem atributo height", img);
      if (!img.hasAttribute("alt")) addResult("🔸 Imagem sem atributo alt", img);
      if (!img.hasAttribute("loading")) addResult("🔸 Imagem sem atributo loading", img);
      if (!img.classList.contains("lazyload")) addResult("🔸 Imagem sem class:lazyload", img);
      if (!img.src.endsWith(".webp") && !img.src.endsWith(".svg")) addResult("🔸 Imagem sem extensão .webp ou .svg", img);

      const naturalRatio = img.naturalWidth / img.naturalHeight;
      const displayedRatio = img.width / img.height;
      if (Math.abs(naturalRatio - displayedRatio) > 0.1) {
        addResult("🔸 Imagem com proporção distorcida.", img);
      }
    });

    log();
  })();
};
