// Interações do site do WinGlass. Sem bibliotecas; tudo respeita "reduzir movimento".
(() => {
  const root = document.documentElement;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  // Refração de verdade só no Chromium de mesa (backdrop-filter com url() de filtro SVG).
  const brands = navigator.userAgentData?.brands?.map(b => b.brand) ?? [];
  if (brands.some(b => /Chromium/.test(b)) && fine && !calm) root.classList.add("refract");

  // Título: as palavras sobem uma a uma.
  const h1 = document.getElementById("headline");
  if (h1 && !calm) {
    let i = 0;
    const wrap = (text, shine) => text.split(/(\s+)/).map(part => {
      if (/^\s+$/.test(part) || !part) return document.createTextNode(part);
      const w = document.createElement("span");
      w.className = "w";
      const s = document.createElement("span");
      s.textContent = part;
      if (shine) s.className = "shine";
      s.style.setProperty("--i", i++);
      w.append(s);
      return w;
    });
    const nodes = [...h1.childNodes].flatMap(n =>
      n.nodeType === 3 ? wrap(n.textContent, false)
        : n.tagName === "BR" ? [n]
        : wrap(n.textContent, n.classList.contains("shine")));
    h1.replaceChildren(...nodes);
    h1.classList.add("split");
  }

  // Revelar ao rolar.
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
  document.querySelectorAll("[data-reveal]").forEach(el => io.observe(el));

  // Brilho que segue o ponteiro: no fundo, nos cartões (holofote + reflexo) e inclinação leve.
  const glow = document.querySelector(".cursor-glow");
  if (fine && !calm) {
    addEventListener("pointermove", e => {
      glow.style.setProperty("--cx", e.clientX + "px");
      glow.style.setProperty("--cy", e.clientY + "px");
    }, { passive: true });

    document.querySelectorAll(".lg").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        if (el.classList.contains("tilt"))
          el.style.transform = `perspective(1000px) rotateX(${((0.5 - y) * 6).toFixed(2)}deg) rotateY(${((x - 0.5) * 6).toFixed(2)}deg)`;
      });
      if (el.classList.contains("tilt")) el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });

    // Botões magnéticos: puxam um pouco na direção do ponteiro.
    document.querySelectorAll(".magnetic").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  // Palco do topo: endireita conforme rola e acompanha o ponteiro.
  const stage = document.getElementById("stage"), screen = document.getElementById("screen");
  let tiltX = 0, tiltY = 0;
  const flatten = () => {
    const r = stage.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, 1 - (r.top - innerHeight * 0.15) / (innerHeight * 0.75)));
    screen.style.setProperty("--rx", (14 * (1 - p) + tiltX).toFixed(2) + "deg");
    screen.style.setProperty("--ry", tiltY.toFixed(2) + "deg");
  };
  if (!calm) {
    if (fine) stage.addEventListener("pointermove", e => {
      const r = stage.getBoundingClientRect();
      tiltY = ((e.clientX - r.left) / r.width - 0.5) * 8;
      tiltX = (0.5 - (e.clientY - r.top) / r.height) * 6;
      flatten();
    });
    stage.addEventListener("pointerleave", () => { tiltX = tiltY = 0; flatten(); });
  } else screen.style.setProperty("--rx", "0deg");

  // Sequência líquida: os quadros avançam com a rolagem.
  const seq = document.getElementById("liquido");
  const frames = [...document.querySelectorAll("#frames img")];
  const steps = [...document.querySelectorAll("#steps li")];
  const bar = document.getElementById("seqbar");
  let shown = -1;
  const sequence = () => {
    const r = seq.getBoundingClientRect();
    const span = r.height - innerHeight;
    const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
    bar.style.setProperty("--p", p.toFixed(3));
    const k = Math.min(frames.length - 1, Math.floor(p * frames.length));
    if (k === shown) return;
    shown = k;
    frames.forEach((f, j) => f.classList.toggle("on", j === Math.min(k, 3) || (j === 4 && k === 4)));
    steps.forEach((s, j) => s.classList.toggle("on", j <= Math.min(k, 3)));
  };
  // Em telas pequenas a seção não fica presa: os quadros giram sozinhos.
  const narrow = matchMedia("(max-width: 980px)");
  let loop;
  const autoplay = () => {
    clearInterval(loop);
    if (!narrow.matches) return;
    let k = 0;
    loop = setInterval(() => {
      k = (k + 1) % frames.length;
      frames.forEach((f, j) => f.classList.toggle("on", j === Math.min(k, 3) || (j === 4 && k === 4)));
      steps.forEach((s, j) => s.classList.toggle("on", j <= Math.min(k, 3)));
      bar.style.setProperty("--p", ((k + 1) / frames.length).toFixed(3));
    }, calm ? 2600 : 1300);
  };
  narrow.addEventListener("change", autoplay);
  autoplay();

  // Navegação fica mais compacta depois do topo.
  const nav = document.getElementById("nav");

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (!calm) flatten();
      if (!narrow.matches) sequence();
      nav.style.padding = scrollY > 40 ? "6px 6px 6px 14px" : "";
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  // Estúdio de estilos: os mesmos seis estilos do app.
  const studio = document.getElementById("studio");
  const presets = {
    padrao:  { tint: "30, 34, 70",    veil: 0.32, blur: 22, rim: 0.35 },
    cristal: { tint: "210, 235, 255", veil: 0.05, blur: 3,  rim: 0.65 },
    fosco:   { tint: "236, 239, 248", veil: 0.24, blur: 42, rim: 0.5 },
    noite:   { tint: "10, 10, 18",    veil: 0.64, blur: 30, rim: 0.16 },
    aurora:  { tint: "70, 130, 255",  veil: 0.24, blur: 20, rim: 0.45 },
    rose:    { tint: "255, 120, 180", veil: 0.22, blur: 22, rim: 0.45 },
  };
  const sBlur = document.getElementById("s-blur"), sVeil = document.getElementById("s-veil"), sRadius = document.getElementById("s-radius");
  const apply = p => {
    studio.style.setProperty("--tint", p.tint);
    studio.style.setProperty("--veil", p.veil);
    studio.style.setProperty("--blur", p.blur + "px");
    studio.style.setProperty("--rim", p.rim);
    sBlur.value = p.blur;
    sVeil.value = Math.round(p.veil * 100);
  };
  document.querySelectorAll("#presets button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll("#presets button").forEach(o => o.setAttribute("aria-pressed", String(o === b)));
    apply(presets[b.dataset.p]);
  }));
  sBlur.addEventListener("input", () => studio.style.setProperty("--blur", sBlur.value + "px"));
  sVeil.addEventListener("input", () => studio.style.setProperty("--veil", sVeil.value / 100));
  sRadius.addEventListener("input", () => studio.style.setProperty("--r", sRadius.value + "px"));

  // Números contam até o valor (os zeros descem de 100).
  const counter = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      counter.unobserve(e.target);
      const to = +e.target.dataset.count, from = to === 0 ? 100 : 0;
      if (calm) { e.target.textContent = to; continue; }
      const t0 = performance.now(), dur = 1400;
      const tick = now => {
        const k = Math.min(1, (now - t0) / dur), ease = 1 - Math.pow(1 - k, 4);
        e.target.textContent = Math.round(from + (to - from) * ease);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach(el => counter.observe(el));

  // Monitor do sistema: números e gráficos andando como na pílula de verdade (valores de demonstração).
  const meters = [...document.querySelectorAll("#meters .meter")];
  if (meters.length) {
    const fmt = (v, kind) => kind === "net" ? "↓" + (v / 10).toFixed(1).replace(".", ",") + " MB/s" : Math.round(v) + "%";
    const state = meters.map(m => {
      const base = { cpu: 28, ram: 61, gpu: 14, net: 24, disk: 6 }[m.dataset.kind];
      return { el: m, kind: m.dataset.kind, base, v: base, hist: Array.from({ length: 30 }, () => base) };
    });
    const draw = s => {
      const max = s.kind === "net" ? Math.max(40, ...s.hist) * 1.2 : 100;
      const pts = s.hist.map((v, i) => `${(i / (s.hist.length - 1)) * 120},${40 - (v / max) * 36}`);
      s.el.querySelector(".l").setAttribute("d", "M" + pts.join(" L"));
      s.el.querySelector(".a").setAttribute("d", "M0,40 L" + pts.join(" L") + " L120,40 Z");
      s.el.querySelector("span").textContent = fmt(s.v, s.kind);
    };
    const step = () => state.forEach(s => {
      const swing = { cpu: 14, ram: 2, gpu: 16, net: 18, disk: 10 }[s.kind];
      s.v = Math.max(1, Math.min(s.kind === "net" ? 90 : 99, s.v + (Math.random() - 0.5) * swing + (s.base - s.v) * 0.15));
      s.hist.push(s.v); s.hist.shift();
      draw(s);
    });
    state.forEach(draw);
    if (!calm) setInterval(step, 1000);
  }

  // Anotações: o texto se digita sozinho, apaga e recomeça.
  const typed = document.querySelector(".typed");
  if (typed) {
    const full = typed.dataset.type;
    typed.style.whiteSpace = "pre-line";
    if (calm) typed.textContent = full;
    else {
      let n = 0, dir = 1;
      const step = () => {
        n += dir;
        typed.textContent = full.slice(0, n);
        if (n >= full.length) { dir = -1; return setTimeout(step, 2600); }
        if (n <= 0) { dir = 1; return setTimeout(step, 700); }
        setTimeout(step, dir > 0 ? 55 + Math.random() * 60 : 14);
      };
      new IntersectionObserver((en, o) => { if (en[0].isIntersecting) { o.disconnect(); step(); } }).observe(typed);
    }
  }
})();
