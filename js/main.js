(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const pad = n => String(n).padStart(2, '0');
  const arrow = '<svg><use href="#i-arrow"/></svg>';

  /* ---------- mobile nav ---------- */
  const nav = $('#nav'), toggle = $('.menu-toggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    toggle.innerHTML = `<svg><use href="#i-${open ? 'close' : 'menu'}"/></svg>`;
  });
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.contains('open') && toggle.click()));

  /* ---------- hero slider ---------- */
  const slides = [
    { title: "Capturing Love's Essence", tag: 'Bridal Portrait' },
    { title: 'Every Laugh Preserved', tag: 'Wedding' },
    { title: 'Forever in Frames', tag: 'Ceremony' },
    { title: 'Forever Remembered Fondly', tag: 'Reception' },
  ];
  const imgs = $$('.hero-slides img');
  const bar = $('.progress .bar i'), cur = $('.progress .cur');
  const DURATION = 6000;
  let hi = 0, start = performance.now();

  function goHero(k) {
    imgs[hi].classList.remove('on');
    hi = k;
    imgs[hi].classList.add('on');
    cur.textContent = pad(hi + 1);
    start = performance.now();
  }
  (function tick(now) {
    const p = Math.min((now - start) / DURATION, 1);
    bar.style.width = p * 100 + '%';
    if (p >= 1) goHero((hi + 1) % slides.length);
    requestAnimationFrame(tick);
  })(performance.now());

  /* ---------- services carousel ---------- */
  const services = [
    { name: 'Wedding Day Coverage', img: 5, desc: 'From the first look to the last dance, every emotion, smile and detail of your day, documented with authenticity.' },
    { name: 'Engagement Sessions', img: 6, desc: 'Celebrate the promise with relaxed, natural portraits that tell the beginning of your story.' },
    { name: 'Bridal Portraits', img: 4, desc: 'Timeless, editorial portraits that capture the bride in all her grace and detail.' },
    { name: 'Destination Weddings', img: 3, desc: 'Wherever you say “I do”, our team travels with you to capture it beautifully.' },
    { name: 'Second Shooter', img: 2, desc: 'Add a second photographer so no angle, guest or candid moment is ever missed.' },
    { name: 'Prints & Products', img: 1, desc: 'High-quality prints, albums and keepsakes made to hold your memories for a lifetime.' },
  ];
  const list = $('.svc-list'), track = $('.track');
  list.innerHTML = services.map((s, i) => `<li><button data-i="${i}">${s.name}</button></li>`).join('');
  track.innerHTML = services.map(s => `<figure><img src="img/services/services-bg-${s.img}.jpg" alt="${s.name}"></figure>`).join('');
  $('.svc-total').textContent = pad(services.length);
  let si = 0;
  function goSvc(i) {
    si = (i + services.length) % services.length;
    const fig = track.children[si];
    track.style.transform = `translateX(${-fig.offsetLeft}px)`;
    $$('button', list).forEach((b, k) => b.classList.toggle('on', k === si));
    [...track.children].forEach((f, k) => f.classList.toggle('active', k === si));
    $('.svc-title').textContent = services[si].name;
    $('.svc-desc').textContent = services[si].desc;
    $('.svc-cur').textContent = pad(si + 1);
  }
  list.addEventListener('click', e => { const b = e.target.closest('button'); if (b) goSvc(+b.dataset.i); });
  $('.svc-nav .prev').addEventListener('click', () => goSvc(si - 1));
  $('.svc-nav .next').addEventListener('click', () => goSvc(si + 1));
  addEventListener('resize', () => goSvc(si));
  goSvc(0);

  // swipe on the carousel
  let sx = null;
  track.addEventListener('touchstart', e => (sx = e.touches[0].clientX), { passive: true });
  track.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) goSvc(si + (dx < 0 ? 1 : -1));
    sx = null;
  });

  /* ---------- why us ---------- */
  const reasons = [
    { t: 'Unparalleled customer satisfaction', s: 'Your vision guides every frame', img: 'img/contact/contact-bg.jpg', pos: '50% 25%' },
    { t: 'Timely delivery', s: 'Your memories, in your hands on time', img: 'img/menu/menu-6.jpg', pos: '50% 30%' },
    { t: 'Budget-friendly, customizable packages', s: 'Tailored to your day and your budget', img: 'img/menu/menu-1.jpg', pos: '50% 25%' },
    { t: 'Experienced storytellers', s: 'Years of experience and a passion for stories', img: 'img/about/about-bg.jpg', pos: '50% 30%' },
  ];
  const whyText = "Our team of talented photographers brings years of experience and a passion for storytelling to every shoot, so your photos not only look beautiful but evoke the feelings of your day for years to come.";
  const rows = $('.rows'), fig = $('.why-media figure');
  rows.innerHTML = reasons.map((r, i) => `<button class="row" data-i="${i}">
    <span class="n">${pad(i + 1)}</span><span class="t">${r.t}<small>${r.s}</small></span><span class="ic">${arrow}</span></button>`).join('');
  fig.innerHTML = reasons.map(r => `<img src="${r.img}" alt="" loading="lazy" style="object-position:${r.pos}">`).join('');
  $('.why-txt').textContent = whyText;
  function goWhy(i) {
    $$('.row', rows).forEach((r, k) => r.classList.toggle('on', k === i));
    $$('img', fig).forEach((m, k) => m.classList.toggle('on', k === i));
    $('.why-cap').textContent = reasons[i].t;
  }
  rows.addEventListener('mouseover', e => { const r = e.target.closest('.row'); if (r) goWhy(+r.dataset.i); });
  rows.addEventListener('click', e => { const r = e.target.closest('.row'); if (r) goWhy(+r.dataset.i); });
  goWhy(0);

  /* ---------- lightbox ---------- */
  const lb = $('.lightbox'), lbImg = $('img', lb), lbCap = $('p', lb);
  const openLightbox = (src, caption) => {
    lbImg.src = src;
    lbImg.alt = lbCap.textContent = caption;
    lb.classList.add('open');
  };
  // the whole portfolio card opens the full-size image, not just its button
  $$('.card').forEach(card => card.addEventListener('click', () => {
    const n = $('.card-btn', card).dataset.lb;
    openLightbox(`img/works/works-large/works-page-img-carousel-item-large-${n}.jpg`, $('h3', card).textContent);
  }));

  // services carousel: a side photo moves the carousel to it; the active photo opens full screen
  track.addEventListener('click', e => {
    const fig = e.target.closest('figure');
    if (!fig) return;
    const i = [...track.children].indexOf(fig);
    if (i === si) openLightbox($('img', fig).getAttribute('src'), services[i].name);
    else goSvc(i);
  });
  const close = () => lb.classList.remove('open');
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.x')) close(); });
  addEventListener('keydown', e => e.key === 'Escape' && close());

  /* ---------- reveal + active nav ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));

  const links = $$('.nav-links a');
  const so = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['home', 'about', 'services', 'works', 'contact'].forEach(id => so.observe(document.getElementById(id)));

  $('#yr').textContent = new Date().getFullYear();
})();
