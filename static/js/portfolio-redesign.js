(function () {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function syncHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 18);
  }

  function closeMenu() {
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 760) closeMenu();
    },
    { passive: true }
  );

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  document.querySelectorAll(".reveal").forEach((element) => {
    revealObserver.observe(element);
  });

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activeLink = navLinks.find((link) => link.getAttribute("href") === "#" + entry.target.id);
        navLinks.forEach((link) => link.classList.toggle("is-active", link === activeLink));
      });
    },
    { rootMargin: "-38% 0px -52% 0px", threshold: 0.01 }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  const canvas = document.getElementById("ambient-canvas");
  const ctx = canvas.getContext("2d");
  const pointer = { x: -9999, y: -9999 };
  let points = [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frameId = 0;

  function createPoints() {
    const density = width < 760 ? 32000 : 18000;
    const maxPoints = width < 760 ? 42 : 96;
    const minPoints = width < 760 ? 22 : 36;
    const count = Math.min(maxPoints, Math.max(minPoints, Math.round((width * height) / density)));
    points = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      hue: index % 3
    }));
  }

  function resizeCanvas() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    createPoints();
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;

    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];

      if (!reduceMotion) {
        point.x += point.vx;
        point.y += point.vy;

        if (point.x < -20) point.x = width + 20;
        if (point.x > width + 20) point.x = -20;
        if (point.y < -20) point.y = height + 20;
        if (point.y > height + 20) point.y = -20;
      }

      const pointerDistance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
      if (pointerDistance < 170) {
        const pull = (170 - pointerDistance) / 170;
        point.x += (point.x - pointer.x) * pull * 0.012;
        point.y += (point.y - pointer.y) * pull * 0.012;
      }

      for (let j = i + 1; j < points.length; j += 1) {
        const next = points[j];
        const distance = Math.hypot(point.x - next.x, point.y - next.y);
        if (distance > 145) continue;

        const alpha = (1 - distance / 145) * 0.2;
        ctx.strokeStyle = "rgba(126, 224, 182, " + alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
      }

      const colors = ["rgba(126, 224, 182, 0.62)", "rgba(255, 107, 87, 0.55)", "rgba(242, 190, 92, 0.55)"];
      ctx.fillStyle = colors[point.hue];
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.35, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!reduceMotion) {
      frameId = window.requestAnimationFrame(draw);
    }
  }

  window.addEventListener("resize", resizeCanvas, { passive: true });
  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    },
    { passive: true }
  );
  window.addEventListener(
    "pointerleave",
    () => {
      pointer.x = -9999;
      pointer.y = -9999;
    },
    { passive: true }
  );

  resizeCanvas();

  if (!reduceMotion && !frameId) {
    frameId = window.requestAnimationFrame(draw);
  }
})();
