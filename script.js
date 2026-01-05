/* Cinematic stars + scroll reveals + mobile menu (no build tools needed) */
(function(){
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Mobile menu
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  function closeMenu(){
    if (!menuBtn || !mobileMenu) return;
    menuBtn.setAttribute("aria-expanded","false");
    mobileMenu.style.display = "none";
    mobileMenu.setAttribute("aria-hidden","true");
  }
  function toggleMenu(){
    if (!menuBtn || !mobileMenu) return;
    const open = menuBtn.getAttribute("aria-expanded") === "true";
    if (open) return closeMenu();
    menuBtn.setAttribute("aria-expanded","true");
    mobileMenu.style.display = "block";
    mobileMenu.setAttribute("aria-hidden","false");
  }
  if (menuBtn) menuBtn.addEventListener("click", toggleMenu);
  if (mobileMenu) mobileMenu.addEventListener("click", (e)=>{
    if (e.target && e.target.tagName === "A") closeMenu();
  });
  window.addEventListener("resize", closeMenu);

  // Scroll reveal
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if (en.isIntersecting) en.target.classList.add("visible");
    });
  }, {threshold: 0.12});
  document.querySelectorAll(".reveal").forEach(el => obs.observe(el));

  // Stars canvas
  const canvas = document.getElementById("stars");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", {alpha:true});
  let W = 0, H = 0, DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let stars = [];

  function resize(){
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR,0,0,DPR,0,0);
    seed();
  }

  function rand(min, max){ return Math.random()*(max-min)+min; }

  function seed(){
    const n = Math.floor((W*H) / 12000); // density
    stars = [];
    for (let i=0;i<n;i++){
      stars.push({
        x: rand(0,W),
        y: rand(0,H),
        r: rand(0.6, 1.8),
        v: rand(0.08, 0.32),
        a: rand(0.25, 0.95),
        tw: rand(0.002, 0.014),
        p: rand(0, Math.PI*2)
      });
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);

    // subtle nebula glow (split red/blue)
    const g1 = ctx.createRadialGradient(W*0.25, H*0.25, 0, W*0.25, H*0.25, Math.max(W,H)*0.55);
    g1.addColorStop(0, "rgba(255,58,58,0.12)");
    g1.addColorStop(1, "rgba(255,58,58,0.0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0,0,W,H);

    const g2 = ctx.createRadialGradient(W*0.75, H*0.25, 0, W*0.75, H*0.25, Math.max(W,H)*0.55);
    g2.addColorStop(0, "rgba(58,160,255,0.12)");
    g2.addColorStop(1, "rgba(58,160,255,0.0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0,0,W,H);

    // stars
    for (const s of stars){
      s.p += s.tw;
      const flick = (Math.sin(s.p) + 1) * 0.25;
      const alpha = Math.min(1, s.a + flick);

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(232,238,252,${alpha})`;
      ctx.fill();

      s.y += s.v;
      if (s.y - s.r > H){
        s.y = -s.r;
        s.x = rand(0,W);
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
})();


/* --- V7 HERO PARTICLES (fixed layering + no dark overlay) --- */
(function(){
  const hero = document.querySelector(".hero");
  const canvas = document.getElementById("sparks");
  if (!hero || !canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  let W=0, H=0, DPR=Math.max(1, Math.min(2, window.devicePixelRatio||1));
  let parts=[];
  let last = performance.now();
  let accum = 0;

  const variant = (document.documentElement.getAttribute("data-variant") || "v7-01").toLowerCase();
  const intensity = (variant.includes("dramatic") || variant.includes("20")) ? 1.25 : 1.0;

  function resize(){
    const r = hero.getBoundingClientRect();
    W = Math.max(1, Math.floor(r.width));
    H = Math.max(1, Math.floor(r.height));
    canvas.width = Math.floor(W*DPR);
    canvas.height = Math.floor(H*DPR);
    canvas.style.width = W+"px";
    canvas.style.height = H+"px";
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  function rand(a,b){ return Math.random()*(b-a)+a; }

  function spawn(side){
    // side -1 = red from left, +1 = blue from right
    const x = side < 0 ? rand(-60, W*0.18) : rand(W*0.82, W+60);
    const y = rand(H*0.08, H*0.58);
    const cx = W*0.5 + rand(-12,12);
    const cy = H*0.30 + rand(-18,22);

    const dx = cx-x, dy = cy-y;
    const d = Math.max(80, Math.hypot(dx,dy));
    const sp = rand(360, 620) * intensity;
    const vx = (dx/d)*sp;
    const vy = (dy/d)*sp;

    const c = side < 0 ? [255,58,58] : [58,160,255];
    parts.push({
      x,y,vx,vy,
      r: rand(0.9, 2.4),
      a: rand(0.25, 0.75),
      life: rand(0.55, 0.95),
      c,
      t: 0
    });
  }

  function burst(x,y){
    const n = Math.floor(rand(12, 22) * intensity);
    for (let i=0;i<n;i++){
      const ang = rand(0, Math.PI*2);
      const sp = rand(120, 520) * intensity;
      parts.push({
        x,y,
        vx: Math.cos(ang)*sp,
        vy: Math.sin(ang)*sp,
        r: rand(0.8, 2.2),
        a: rand(0.18, 0.55),
        life: rand(0.18, 0.55),
        c: [232,238,252],
        t: 0
      });
    }
  }

  function step(now){
    const dt = Math.min(0.033, (now-last)/1000);
    last = now;

    // Clear fully transparent (no black overlay)
    ctx.clearRect(0,0,W,H);

    // Draw additive
    ctx.globalCompositeOperation = "lighter";

    // spawn
    accum += dt;
    const rate = 0.022 / intensity;
    while(accum > rate){
      accum -= rate;
      spawn(-1);
      spawn(+1);
    }

    // soft center glow
    const cx=W*0.5, cy=H*0.30;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 140);
    g.addColorStop(0, "rgba(232,238,252,0.10)");
    g.addColorStop(0.35, "rgba(232,238,252,0.04)");
    g.addColorStop(1, "rgba(232,238,252,0.0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    for (let i=parts.length-1;i>=0;i--){
      const p = parts[i];
      p.life -= dt;
      p.t += dt;

      p.x += p.vx*dt;
      p.y += p.vy*dt;

      // drag
      const drag = 0.88;
      p.vx *= drag;
      p.vy *= drag;

      // collision near center for colored incoming
      const d = Math.hypot(p.x-cx, p.y-cy);
      if (d < 16 && (p.c[0] !== 232)){
        burst(cx, cy);
        parts.splice(i,1);
        continue;
      }

      if (p.life <= 0 || p.x < -140 || p.x > W+140 || p.y < -140 || p.y > H+140){
        parts.splice(i,1);
        continue;
      }

      const alpha = Math.max(0, Math.min(1, p.a * (p.life*1.2)));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${alpha})`;
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(step);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(step);
})();
