/* UI interactions (classic script, independent of the 3D scene) */
(function () {
  'use strict';
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Hero name: split into letters ---------- */
  var idx = 0;
  $$('#heroName .line').forEach(function (line) {
    if (line.children.length) return; // keep lines with markup (the serif accent) intact
    var text = line.textContent;
    line.textContent = '';
    line.setAttribute('aria-hidden', 'true');
    text.split('').forEach(function (c) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c === ' ' ? ' ' : c;
      s.style.transitionDelay = (idx++ * 0.045) + 's';
      line.appendChild(s);
    });
  });

  /* ---------- Loader ---------- */
  var loader = $('#loader'), num = $('#loadNum'), n = 0;
  var heroName = $('#heroName');
  function finishLoad() {
    loader.classList.add('done');
    setTimeout(function () { heroName.classList.add('go'); startTyping(); }, 350);
  }
  var timer = setInterval(function () {
    n += Math.ceil(Math.random() * 7);
    if (n >= 100) { n = 100; clearInterval(timer); setTimeout(finishLoad, 250); }
    num.textContent = n;
  }, 45);

  /* ---------- Typing effect ---------- */
  var phrases = [
    'secure web applications.',
    'full-stack projects.',
    'ML-powered ideas.',
    'solutions that scale.'
  ];
  var typedEl = $('#typed'), pi = 0, ci = 0, del = false, started = false;
  function startTyping() {
    if (started) return; started = true;
    if (reduce) { typedEl.textContent = phrases[0]; return; }
    (function tick() {
      var full = phrases[pi];
      ci += del ? -1 : 1;
      typedEl.textContent = full.slice(0, ci);
      var wait = del ? 35 : 75;
      if (!del && ci === full.length) { del = true; wait = 1400; }
      else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; wait = 350; }
      setTimeout(tick, wait);
    })();
  }

  /* ---------- Reveal on scroll + counters ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10), suf = el.dataset.suffix || '';
    var t0 = performance.now(), dur = 1600;
    (function step(t) {
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      $$('[data-count]', en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- Nav, progress, mobile menu ---------- */
  var nav = $('#nav'), bar = $('#progress');
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('stuck', y > 30);
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var burger = $('#burger'), menu = $('#menu');
  burger.addEventListener('click', function () { burger.classList.toggle('open'); menu.classList.toggle('open'); });
  $$('#menu a').forEach(function (a) {
    a.addEventListener('click', function () { burger.classList.remove('open'); menu.classList.remove('open'); });
  });

  /* ---------- Custom cursor ---------- */
  if (fine && !reduce) {
    var dot = $('#cursorDot'), ring = $('#cursorRing');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    document.body.classList.add('has-cursor');
    addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', function (e) {
      ring.classList.toggle('hover', !!e.target.closest('a,button,.card,.sphere'));
    });
  }

  /* ---------- Magnetic buttons + 3D tilt ---------- */
  if (fine && !reduce) {
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.3, y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transition = 'transform .15s';
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)';
        el.style.transform = '';
      });
    });
    $$('.tilt').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transform = 'perspective(900px) rotateY(' + ((px - 0.5) * 14) + 'deg) rotateX(' + ((0.5 - py) * 14) + 'deg) translateZ(8px)';
        el.style.setProperty('--gx', (px * 100) + '%');
        el.style.setProperty('--gy', (py * 100) + '%');
        var g = $('.glare', el);
        if (g) { g.style.setProperty('--gx', (px * 100) + '%'); g.style.setProperty('--gy', (py * 100) + '%'); }
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- 3D skills sphere ---------- */
  var sphere = $('#sphere');
  if (sphere) {
    var words = ['HTML5', 'CSS3', 'JavaScript', 'PHP', 'Python', 'Java', 'C', 'C++', 'SQL', 'MySQL', 'MongoDB',
                 'AWS', 'CCNA', 'Cybersecurity', 'Machine Learning', 'Data Analytics', 'Full-Stack', 'Networking'];
    var tags = words.map(function (w) {
      var d = document.createElement('span'); d.className = 'tag'; d.textContent = w; sphere.appendChild(d); return d;
    });
    var N = tags.length, pts = [];
    for (var i = 0; i < N; i++) {
      var phi = Math.acos(-1 + (2 * i + 1) / N), theta = Math.sqrt(N * Math.PI) * phi;
      pts.push({ x: Math.cos(theta) * Math.sin(phi), y: Math.sin(theta) * Math.sin(phi), z: Math.cos(phi) });
    }
    var ax = 0.004, ay = 0.006, dragging = false, lx = 0, ly = 0, visible = true;
    function render() {
      var R = sphere.clientWidth * 0.42;
      var sx = Math.sin(ax), cx = Math.cos(ax), sy = Math.sin(ay), cy = Math.cos(ay);
      for (var i = 0; i < N; i++) {
        var p = pts[i];
        var y1 = p.y * cx - p.z * sx, z1 = p.y * sx + p.z * cx;
        var x2 = p.x * cy + z1 * sy, z2 = -p.x * sy + z1 * cy;
        p.x = x2; p.y = y1; p.z = z2;
        var s = (z2 + 2) / 3;
        tags[i].style.transform = 'translate(-50%,-50%) translate3d(' + (x2 * R) + 'px,' + (y1 * R) + 'px,0) scale(' + (0.6 + s * 0.6) + ')';
        tags[i].style.opacity = (0.25 + s * 0.75).toFixed(2);
        tags[i].style.zIndex = Math.round(s * 100);
      }
    }
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(sphere);
    (function loop() {
      if (visible) {
        if (!dragging && !reduce) { ax *= 0.96; ay *= 0.96; if (Math.abs(ax) < 0.002) ax = 0.002 * Math.sign(ax || 1); if (Math.abs(ay) < 0.005) ay = 0.005 * Math.sign(ay || 1); }
        render();
      }
      requestAnimationFrame(loop);
    })();
    function down(x, y) { dragging = true; lx = x; ly = y; }
    function move(x, y) { if (!dragging) return; ay = (x - lx) * 0.0016; ax = -(y - ly) * 0.0016; lx = x; ly = y; }
    sphere.addEventListener('mousedown', function (e) { down(e.clientX, e.clientY); });
    addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
    addEventListener('mouseup', function () { dragging = false; });
    sphere.addEventListener('touchstart', function (e) { down(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    sphere.addEventListener('touchmove', function (e) { move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    sphere.addEventListener('touchend', function () { dragging = false; });
  }

  /* ---------- Project cards: tap to flip on touch ---------- */
  if (!fine) {
    $$('.card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        card.classList.toggle('flipped');
      });
    });
  }

  /* ---------- Contact particle text ---------- */
  (function particleText() {
    var cv = $('#fxText'); if (!cv) return;
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var words = ['VK', '</>', "LET'S BUILD"], wi = 0;
    var dpr = Math.min(devicePixelRatio || 1, 2), W = 0, H = 0, parts = [], mouse = { x: -999, y: -999 };

    function size() {
      var r = cv.getBoundingClientRect();
      W = cv.width = Math.max(1, r.width * dpr); H = cv.height = Math.max(1, r.height * dpr);
    }
    function targets(text) {
      var off = document.createElement('canvas'); off.width = W; off.height = H;
      var o = off.getContext('2d');
      o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
      var fs = Math.min(H * 0.72, W / Math.max(text.length * 0.62, 2));
      o.font = '800 ' + fs + 'px "Syne","Space Grotesk",sans-serif';
      o.fillText(text, W / 2, H / 2);
      var data = o.getImageData(0, 0, W, H).data, pts = [], step = Math.max(4, Math.round(6 * dpr));
      for (var y = 0; y < H; y += step) for (var x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) pts.push({ x: x, y: y });
      }
      return pts;
    }
    function setWord() {
      if (!W || !H) return;
      var pts = targets(words[wi]); wi = (wi + 1) % words.length;
      for (var i = 0; i < pts.length; i++) {
        if (!parts[i]) parts[i] = { x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, c: Math.random() < 0.5 ? '#ff8a1f' : '#ff3d00' };
        parts[i].tx = pts[i].x; parts[i].ty = pts[i].y; parts[i].on = true;
      }
      for (var j = pts.length; j < parts.length; j++) parts[j].on = false;
    }
    var reduceM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i]; if (!p.on) continue;
        var dx = p.tx - p.x, dy = p.ty - p.y;
        p.vx = (p.vx + dx * 0.02) * 0.82; p.vy = (p.vy + dy * 0.02) * 0.82;
        var mdx = p.x - mouse.x, mdy = p.y - mouse.y, d2 = mdx * mdx + mdy * mdy, rad = 55 * dpr;
        if (d2 < rad * rad) { var d = Math.sqrt(d2) || 1, f = (rad - d) / rad * 6; p.vx += (mdx / d) * f; p.vy += (mdy / d) * f; }
        p.x += p.vx; p.y += p.vy;
        ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 2 * dpr, 2 * dpr);
      }
      requestAnimationFrame(frame);
    }
    function start() {
      size(); setWord();
      if (reduceM) {
        for (var i = 0; i < parts.length; i++) if (parts[i].on) { parts[i].x = parts[i].tx; parts[i].y = parts[i].ty; }
      }
      frame();
    }
    cv.addEventListener('mousemove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left) * dpr; mouse.y = (e.clientY - r.top) * dpr; });
    cv.addEventListener('mouseleave', function () { mouse.x = mouse.y = -999; });
    addEventListener('resize', function () { size(); setWord(); });
    // build once the section is first seen (keeps it cheap until needed)
    var once = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { start(); if (!reduceM) setInterval(setWord, 4200); once.disconnect(); } }, { threshold: 0.2 });
    once.observe(cv);
  })();

  /* ---------- Copy email ---------- */
  var copyBtn = $('#copyMail'), hint = $('#copyHint');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var mail = copyBtn.dataset.mail;
      function ok() { hint.textContent = 'copied ✓'; setTimeout(function () { hint.textContent = 'click to copy'; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(mail).then(ok, function () { location.href = 'mailto:' + mail; }); }
      else { location.href = 'mailto:' + mail; }
    });
  }

  $('#year').textContent = new Date().getFullYear();
})();
