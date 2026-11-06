/* Grandlense — motion layer: hero intro, smooth scroll, reveals, parallax, cursor */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const body = document.body;
  const vh = () => innerHeight;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- split text into word spans ---------- */
  function split(el, cls, wrap) {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const s = document.createElement('span');
            s.className = cls;
            if (wrap) { const i = document.createElement('span'); i.textContent = part; s.append(i); }
            else s.textContent = part;
            frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('btn')) walk(n);
      });
    };
    walk(el);
    return $$('.' + cls, el);
  }

  const heroWords = split($('.hero h1'), 'w', true);
  heroWords.forEach((w, i) => (w.firstChild.style.transitionDelay = `${0.55 + i * 0.06}s`));
  $$('.hero .chip').forEach((c, i) => (c.style.transitionDelay = `${1.1 + i * 0.07}s`));
  $('.hero .progress').style.transitionDelay = '1.5s';

  const lit = $$('.statement, .cta').map(el => ({ el, words: split(el, 'sw', false) }));

  /* ---------- tag reveal targets ---------- */
  const tag = (sel, type, step = 0.08, base = 0) => {
    const groups = new Map();
    $$(sel).forEach(el => {
      const k = el.parentElement;
      const i = groups.get(k) || 0;
      groups.set(k, i + 1);
      el.dataset.a = type;
      el.style.setProperty('--d', `${base + i * step}s`);
    });
  };
  tag('.card', 'clip', 0.12);
  tag('.track figure', 'clip', 0.1);
  tag('.why-media figure', 'clip');
  tag('.rows .row', 'left', 0.08);
  tag('.svc-list li', 'up', 0.05);
  tag('.facts > div', 'up', 0.12);
  tag('.eyebrow', 'up');
  tag('.btn:not(.nav .btn):not(.cta .btn)', 'pop', 0, 0.15);
  tag('.contact-info, footer', 'up', 0.1);
  tag('.svc-meta, .works-head-right .small, .about-left .small', 'up', 0.1);

  /* ---------- numbers count up ---------- */
  const countUp = el => {
    const txt = el.textContent, target = parseInt(txt.replace(/\D/g, ''), 10), suffix = txt.replace(/[\d,]/g, '');
    const t0 = performance.now(), dur = 1800;
    const step = now => {
      const p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * e).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
  }), { threshold: 0.6 });

  if (reduce) {
    body.classList.add('loaded');
    $$('[data-a]').forEach(el => el.classList.add('in'));
    lit.forEach(l => l.words.forEach(w => w.classList.add('lit')));
    return;
  }

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    lenis.stop();
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: a.getAttribute('href') === '#home' ? 0 : -20 });
    });
  }

  /* ---------- hero intro: start once the first hero photo is ready ---------- */
  const firstHero = $('.hero-slides img');
  let started = false;
  const startIntro = () => {
    if (started) return;
    started = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      body.classList.add('loaded');
      lenis?.start();
    }));
  };
  if (firstHero.complete) startIntro();
  else { firstHero.addEventListener('load', startIntro); firstHero.addEventListener('error', startIntro); }
  setTimeout(startIntro, 2500); // don't wait forever on a slow connection

  // Reveals are checked by position each frame instead of IntersectionObserver:
  // Chrome treats an element hidden by its own clip-path (our wipe effect) as not
  // intersecting, so clipped photos would never be told to reveal.
  const pending = new Set();
  const reveal = el => {
    el.classList.add('in');
    setTimeout(() => el.classList.add('settled'), 1900); // hand over to hover/parallax motion
    pending.delete(el);
  };
  const trackWrap = $('.track-wrap');
  let trackDone = false;
  function checkReveals() {
    const h = vh();
    pending.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < h * 0.9 && r.bottom > 0) reveal(el);
    });
    // carousel slides sit off to the side, so reveal them together when the strip enters
    if (!trackDone && trackWrap) {
      const r = trackWrap.getBoundingClientRect();
      if (r.top < h * 0.9 && r.bottom > 0) { $$('.track figure').forEach(reveal); trackDone = true; }
    }
  }
  // start after the hero intro begins so above-the-fold items animate in sequence
  let revealsOn = false;
  setTimeout(() => {
    $$('[data-a]').forEach(el => { if (!el.matches('.track figure')) pending.add(el); });
    $$('.facts b').forEach(b => cio.observe(b));
    revealsOn = true;
  }, 900);

  /* ---------- scroll-driven effects ---------- */
  const nav = $('#nav'), hero = $('.hero'), heroSlides = $('.hero-slides'), heroBody = $('.hero-body');
  const panels = $$('.panel');
  const cards = $$('.card');
  const track = $('.marquee-track');
  let lastY = scrollY, marqueeX = 0, velocity = 0;

  function frame() {
    const y = scrollY, dy = y - lastY;
    lastY = y;
    velocity += (dy - velocity) * 0.1;
    if (revealsOn) checkReveals();

    // nav: glass after leaving the top, hide on scroll down, show on scroll up
    nav.classList.toggle('scrolled', y > 60);
    if (!nav.classList.contains('open')) {
      if (dy > 2 && y > vh() * 0.6) nav.classList.add('hide');
      else if (dy < -2) nav.classList.remove('hide');
    }

    // hero parallax
    const hp = clamp(y / hero.offsetHeight, 0, 1);
    if (body.classList.contains('loaded')) {
      // use the standalone translate property so the intro zoom (transform) keeps playing
      heroSlides.style.translate = `0 ${hp * 22}%`;
      heroBody.style.translate = `0 ${hp * -60}px`;
      heroBody.style.opacity = 1 - hp * 1.3;
    }

    // statements light up word by word as they travel up the screen
    const atBottom = y + vh() >= document.documentElement.scrollHeight - 80;
    lit.forEach(({ el, words }) => {
      const r = el.getBoundingClientRect();
      // text near the end of the page can't scroll far, so finish lighting it once we hit bottom
      const p = atBottom && r.top < vh() ? 1 : clamp((vh() * 0.88 - r.top) / (vh() * 0.5 + r.height * 0.3), 0, 1);
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('lit', i < n));
    });

    // panels grow from an inset rounded card to full bleed
    panels.forEach(p => {
      const r = p.getBoundingClientRect();
      const t = clamp((vh() - r.top) / Math.min(vh() * 0.6, r.height * 0.8), 0, 1);
      const e = 1 - Math.pow(1 - t, 3);
      p.style.scale = String(0.9 + 0.1 * e);
      p.style.borderRadius = `${(1 - e) * 40}px`;
    });

    // card image parallax
    cards.forEach(c => {
      const r = c.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh()) return;
      const p = (r.top + r.height / 2 - vh() / 2) / vh();
      c.style.setProperty('--py', `${p * -10}%`);
    });

    // marquee drifts and speeds up with scroll velocity
    if (track) {
      marqueeX -= 0.6 + Math.abs(velocity) * 0.35;
      const half = track.scrollWidth / 2;
      if (-marqueeX >= half) marqueeX += half;
      track.style.transform = `translateX(${marqueeX}px) skewX(${clamp(-velocity * 0.4, -10, 10)}deg)`;
    }

    requestAnimationFrame(frame);
  }
  if (track) track.innerHTML += track.innerHTML; // duplicate for a seamless loop
  requestAnimationFrame(frame);

  /* ---------- cursor + magnetic buttons (mouse only) ---------- */
  if (fine) {
    const cur = $('.cursor');
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cur.classList.add('on'); });
    document.addEventListener('mouseleave', () => cur.classList.remove('on'));
    (function move() {
      cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
      cur.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(move);
    })();
    // after a carousel click the photo slides under a still mouse, so re-read what's under it
    document.addEventListener('click', () => setTimeout(() => {
      const t = document.elementFromPoint(mx, my);
      const side = t && t.closest('.track figure:not(.active)');
      cur.firstElementChild.textContent = side ? 'Next' : 'View';
    }, 900));
    document.addEventListener('mouseover', e => {
      const t = e.target;
      const side = t.closest('.track figure:not(.active)');
      cur.firstElementChild.textContent = side ? 'Next' : 'View';
      cur.classList.toggle('view', !!t.closest('.card, .track figure'));
      cur.classList.toggle('link', !t.closest('.card, .track figure') && !!t.closest('a, button'));
    });

    $$('.btn .arr, .svc-nav button, .menu-toggle, .row .ic, .lightbox .x').forEach(el => {
      el.classList.add('mag');
      const host = el.closest('.btn, .row') || el;
      host.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        const spin = el.matches('.btn .arr') ? ' rotate(45deg)' : '';
        el.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)${spin}`;
      });
      host.addEventListener('mouseleave', () => (el.style.transform = ''));
    });
  }
})();
