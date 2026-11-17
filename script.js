// Second Look: the scroll story.
// Every scene is pinned and scrubbed by scroll: the scroll position IS the timeline.
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !window.gsap || !window.ScrollTrigger || !window.Lenis) return; // plain page stays

  document.documentElement.classList.add('motion');
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scroll, driven by GSAP's clock so both stay in step.
  const lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  /* ---------- text prep ---------- */

  // Typed text: one span per character.
  $$('.type').forEach((el) => {
    el.innerHTML = [...el.textContent].map((c) => `<span class="ch">${c}</span>`).join('');
  });

  // Headlines: each word sits in a clipping box so it can rise up from behind an edge.
  // Keeps <br> and <em> as they are.
  function splitWords(node) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const box = document.createElement('span');
          box.className = 'w';
          box.innerHTML = `<span>${part}</span>`;
          frag.appendChild(box);
        });
        child.replaceWith(frag);
      } else if (child.nodeName !== 'BR') {
        splitWords(child);
      }
    });
  }
  $$('.copy h2, .pattern__h, .end h2, .title h1').forEach(splitWords);
  const words = (sel) => $$(`${sel} .w > span`);

  /* ---------- HUD ---------- */

  const crumb = $('.hud__crumb');
  function setRoom(el) {
    crumb.textContent = el.dataset.crumb;
    document.body.classList.toggle('on-paper', el.classList.contains('paper-scene') || el.classList.contains('s-morning'));
  }
  gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
  gsap.to('.hint', { opacity: 0, scrollTrigger: { start: 0, end: 200, scrub: true } });

  const scene = (sel, length, build) => {
    const el = $(sel);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: el, start: 'top top', end: `+=${length}%`, pin: $('.pin', el), scrub: 1,
      },
    });
    build(tl, el);
    return tl;
  };

  /* ---------- intro: the title rises on load ---------- */
  gsap.from(words('.title h1'), { yPercent: 110, duration: 1.1, stagger: 0.08, ease: 'expo.out', delay: 0.2 });
  gsap.from('.title p', { opacity: 0, y: 14, duration: 1, delay: 0.7, ease: 'power2.out' });

  /* ---------- depth: the night room follows the pointer ---------- */
  if (window.matchMedia('(pointer: fine)').matches) {
    const layers = $$('.s-night .depth').map((g) => ({
      x: gsap.quickTo(g, 'x', { duration: 1.2, ease: 'power3.out' }),
      y: gsap.quickTo(g, 'y', { duration: 1.2, ease: 'power3.out' }),
      depth: Number(g.dataset.depth),
    }));
    window.addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      layers.forEach((l) => { l.x(nx * l.depth * 2); l.y(ny * l.depth); });
    });
  }

  /* ---------- 01 · night ---------- */
  // The line said at dinner, the laugh, the "it was a joke" text. The clock runs past
  // midnight, the room closes in, and the voice in her head gets louder, until she writes it down.
  // Hand angles: hour = h*30 + m*0.5, minute = m*6, plus full turns as time passes.
  const CLOCK = '640 290';
  gsap.set('.hand-h', { rotation: 277.5, svgOrigin: CLOCK }); // 9:15
  gsap.set('.hand-m', { rotation: 90, svgOrigin: CLOCK });
  const voices = $$('.voice');
  const say = (tl, i, at, hold = 0.22) => tl
    .fromTo(voices[i], { opacity: 0, y: 18, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.1, ease: 'power2.out' }, at)
    .to(voices[i], { opacity: 0, y: -12, filter: 'blur(4px)', duration: 0.08 }, at + hold);

  scene('.s-night', 600, (tl) => {
    tl.to('.title', { yPercent: -60, opacity: 0, duration: 0.3 });
    // the line, said out loud at dinner: the room flinches with her
    say(tl, 0, 0.3, 0.26);
    tl.to('.vignette', { keyframes: { opacity: [0, 0.6, 0.25] }, duration: 0.14 }, 0.36);
    say(tl, 1, 0.64, 0.2);
    // home. the clock runs to 11:41 and the text arrives
    tl.to('.hand-m', { rotation: 966, duration: 0.35, ease: 'power1.inOut' }, 0.6)
      .to('.hand-h', { rotation: 350.5, duration: 0.35, ease: 'power1.inOut' }, 0.6)
      .fromTo('.notif', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.1, ease: 'back.out(2)' }, 0.92)
      .to('.phone', { keyframes: { x: [0, -4, 4, -3, 3, -1, 0] }, duration: 0.12 }, 0.94);
    say(tl, 2, 1.08, 0.2);
    // past midnight, still awake
    tl.to('.notif', { opacity: 0, y: -10, duration: 0.08 }, 1.35)
      .to('.hand-m', { rotation: 1512, duration: 0.5, ease: 'power1.inOut' }, 1.3)
      .to('.hand-h', { rotation: 396, duration: 0.5, ease: 'power1.inOut' }, 1.3)
      .to('.vignette', { opacity: 0.65, duration: 0.4 }, 1.3)
      .to('.pool', { opacity: 0.05, duration: 0.4 }, 1.3);
    say(tl, 3, 1.45);
    tl.to('.vignette', { opacity: 0.95, duration: 0.3 }, 1.72);
    say(tl, 4, 1.8);
    // the turn: a little warmth comes back
    tl.to('.vignette', { opacity: 0.35, duration: 0.25 }, 2.1);
    say(tl, 5, 2.13, 0.28);
    tl.to('.room__all', { scale: 14, svgOrigin: '815 550', duration: 0.7, ease: 'power2.in' }, 2.5)
      .to('.vignette', { opacity: 0, duration: 0.3 }, 2.6)
      .to('.s-night .wash', { opacity: 1, duration: 0.18 }, 3.05);
  });

  /* ---------- 02 · write ---------- */
  // The note types itself as you scroll; the stamp lands with a thump.
  scene('.s-write', 200, (tl, el) => {
    tl.from(words('.s-write h2'), { yPercent: 110, stagger: 0.03, duration: 0.25, ease: 'power3.out' })
      .from($('.copy p', el), { y: 20, opacity: 0, duration: 0.2 }, 0.15)
      .from('.slip--main', { y: 80, rotate: -6, opacity: 0, duration: 0.3, ease: 'power2.out' }, 0.05)
      .to($$('.ch', el), { opacity: 1, stagger: 0.008, duration: 0.01 }, 0.35)
      .from('.s-write .stamp', { scale: 2.4, opacity: 0, rotate: -20, duration: 0.12, ease: 'back.out(3)' }, '+=0.05')
      .to('.slip--main', { keyframes: { y: [0, 6, -2, 0] }, duration: 0.1 }, '<0.08')
      .to({}, { duration: 0.25 });
  });

  /* ---------- 03 · keep ---------- */
  // Next morning: the last line is struck, doubt is written, and the front slip
  // slides aside to show the first words were kept underneath.
  scene('.s-keep', 240, (tl, el) => {
    tl.from(words('.s-keep h2'), { yPercent: 110, stagger: 0.03, duration: 0.25, ease: 'power3.out' })
      .from($('.copy p', el), { y: 20, opacity: 0, duration: 0.2 }, 0.15)
      .from('.slip--before', { opacity: 0, duration: 0.01 }, 0)
      .from('.edited', { opacity: 0, duration: 0.1 }, 0.35)
      // the voices crowd in while she softens her own note
      .fromTo('.whisper', { opacity: 0, filter: 'blur(8px)', x: (i) => (i % 2 ? 30 : -30) },
        { opacity: 0.85, filter: 'blur(0px)', x: 0, stagger: 0.08, duration: 0.18 }, 0.3)
      .to('.slips .slip', { keyframes: { x: [0, -3, 3, -2, 0] }, duration: 0.2 }, 0.45)
      .to('.strike', { backgroundSize: '100% 2px', color: '#9a9187', duration: 0.25 }, 0.5)
      .to('.doubt', { opacity: 1, duration: 0.2 }, 0.7)
      // the first words come back into view, and the voices fade
      .to('.whisper', { opacity: 0, filter: 'blur(10px)', y: -16, stagger: 0.04, duration: 0.2 }, 1.15)
      .to('.slip--front', { xPercent: 28, yPercent: 62, rotate: 6, duration: 0.45, ease: 'power1.inOut' }, 0.95)
      .to('.slip--before', { xPercent: -6, yPercent: -24, rotate: -2, duration: 0.45, ease: 'power1.inOut' }, 0.95)
      .from('.stamp--kept', { scale: 2.2, opacity: 0, rotate: -18, duration: 0.12, ease: 'back.out(3)' }, 1.3)
      .to({}, { duration: 0.25 });
  });

  /* ---------- 04 · pattern ---------- */
  // Fourteen notes land on a time river; nine get circled, threaded together and counted.
  const notes = [
    { at: 3, later: false, hit: true }, { at: 10, later: true, hit: false }, { at: 17, later: false, hit: true },
    { at: 24, later: false, hit: true }, { at: 31, later: true, hit: false }, { at: 38, later: false, hit: true },
    { at: 46, later: false, hit: false }, { at: 52, later: false, hit: true }, { at: 58, later: true, hit: true },
    { at: 65, later: false, hit: false }, { at: 72, later: false, hit: true }, { at: 80, later: true, hit: false },
    { at: 88, later: false, hit: true }, { at: 96, later: false, hit: true },
  ];
  const dotsBox = $('.river__dots');
  notes.forEach((n) => {
    const d = document.createElement('i');
    d.className = `dot${n.later ? ' later' : ''}${n.hit ? ' hit' : ''}`;
    d.style.left = `${n.at}%`;
    dotsBox.appendChild(d);
  });
  // The thread: an arc above the line from each circled note to the next.
  const hits = notes.filter((n) => n.hit).map((n) => n.at);
  const threadD = hits.reduce((d, x, i) => {
    if (i === 0) return `M${x} 41`;
    const prev = hits[i - 1];
    return `${d} Q${(prev + x) / 2} ${41 - Math.min(30, (x - prev) * 2.2)} ${x} 41`;
  }, '');
  $('.river__thread path').setAttribute('d', threadD);

  scene('.s-pattern', 280, (tl, el) => {
    const counter = { n: 0 };
    const count = $('.count', el);
    tl.from(words('.pattern__h'), { yPercent: 110, stagger: 0.03, duration: 0.25, ease: 'power3.out' })
      .from('.river__line', { scaleX: 0, duration: 0.3 }, 0.1)
      .from('.river__months, .river__key', { opacity: 0, duration: 0.2 }, 0.2)
      .from('.dot', { y: -140, opacity: 0, scale: 0.4, stagger: 0.035, duration: 0.15, ease: 'back.out(2)' }, 0.25)
      .to('.dot.hit', { '--hit': 1, stagger: 0.04, duration: 0.05 }, 0.9)
      .to('.river__thread path', { strokeDashoffset: 0, duration: 0.45, ease: 'power1.inOut' }, 0.95)
      .from('.card--fact', { y: 40, opacity: 0, duration: 0.2 }, 1.0)
      .to(counter, { n: 9, duration: 0.4, onUpdate: () => { count.textContent = Math.round(counter.n); } }, 1.05)
      .from('.card--yours', { y: 40, opacity: 0, duration: 0.2 }, 1.45)
      .from('.closing', { y: 30, opacity: 0, duration: 0.2 }, 1.65)
      .to({}, { duration: 0.3 });
  });

  /* ---------- 05 · morning ---------- */
  // Dust in the sunbeam (idle), then the paper fades into daylight and the sun rises.
  const motes = $('.motes');
  for (let i = 0; i < 22; i += 1) {
    const m = document.createElement('i');
    m.className = 'mote';
    m.style.left = `${35 + Math.random() * 40}%`;
    m.style.top = `${30 + Math.random() * 55}%`;
    m.style.setProperty('--d', `${7 + Math.random() * 7}s`);
    m.style.setProperty('--delay', `${-Math.random() * 10}s`);
    m.style.setProperty('--dx', `${-30 + Math.random() * 90}px`);
    m.style.setProperty('--dy', `${-50 - Math.random() * 90}px`);
    motes.appendChild(m);
  }

  scene('.s-morning', 160, (tl) => {
    tl.to('.wash--in', { opacity: 0, duration: 0.35 })
      .from('.room--day', { scale: 1.1, duration: 0.6, ease: 'power2.out' }, 0)
      .from('.sun', { y: 140, duration: 0.8 }, 0)
      .from('.beam, .motes', { opacity: 0, duration: 0.6 }, 0.15)
      .from(words('.end h2'), { yPercent: 110, stagger: 0.04, duration: 0.3, ease: 'power3.out' }, 0.35)
      .from('.end p', { y: 20, opacity: 0, stagger: 0.1, duration: 0.25 }, 0.6)
      .to({}, { duration: 0.25 });
  });

  // Room label: made after the pins so the positions include the pinned scroll.
  // onEnter fires for every room crossed in order, so even a jump lands on the right one.
  $$('.scene').forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 50%', end: 'bottom 50%',
      onEnter: () => setRoom(el), onEnterBack: () => setRoom(el),
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
