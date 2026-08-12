/* Andrea Cavalluzzo - site behaviour. No dependencies. */
(function () {
  'use strict';

  var root = document.documentElement;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // One owner for the scroll lock, so the menu and the viewer can't strand it.
  var locks = 0;

  function lock(on) {
    locks = Math.max(0, locks + (on ? 1 : -1));
    document.body.style.overflow = locks ? 'hidden' : '';
  }

  /* ---- theme ------------------------------------------------------------ */
  var toggle = document.getElementById('theme');

  function label() {
    toggle.setAttribute(
      'aria-label',
      root.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    );
  }

  if (toggle) {
    label();
    toggle.addEventListener('click', function () {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      label();
      try { localStorage.setItem('theme', root.dataset.theme); } catch (e) { }
    });
  }

  /* ---- Dublin clock ----------------------------------------------------- */
  var clock = document.getElementById('clock');

  if (clock) {
    var time = new Intl.DateTimeFormat('en-IE', {
      timeZone: 'Europe/Dublin', hour: '2-digit', minute: '2-digit', hour12: false
    });
    var tick = function () { clock.textContent = time.format(new Date()); };
    tick();
    setInterval(tick, 20000);
  }

  /* ---- mobile menu ------------------------------------------------------ */
  var mbtn = document.getElementById('menu');
  var sheet = document.getElementById('sheet');

  // The sheet sits over the page, so the page underneath goes inert while it is
  // open - otherwise Tab walks through links nobody can see.
  var buried = [document.getElementById('main'), document.querySelector('.foot')];

  function setMenu(open) {
    if (!mbtn || !sheet || sheet.hidden === !open) return;
    sheet.hidden = !open;
    mbtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    mbtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    buried.forEach(function (el) { if (el) el.inert = open; });
    lock(open);
    // Focus stays on the button: the sheet follows it in the tab order anyway.
    if (!open) mbtn.focus();
  }

  if (mbtn && sheet) {
    mbtn.addEventListener('click', function () { setMenu(sheet.hidden); });

    // Any link in the sheet is a destination, so the menu's job is done.
    sheet.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) setMenu(false);
    });
  }

  /* ---- sticky bar + active section ------------------------------------- */
  var bar = document.querySelector('.bar');
  var links = Array.prototype.slice.call(document.querySelectorAll('.bar-nav a'));
  var sheetLinks = Array.prototype.slice.call(document.querySelectorAll('.sheet-nav a'));
  var targets = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  function onScroll() {
    if (bar) bar.classList.toggle('stuck', window.scrollY > 8);

    var line = window.scrollY + window.innerHeight * 0.32;
    var current = -1;
    targets.forEach(function (sec, i) {
      if (sec.offsetTop <= line) current = i;
    });
    links.forEach(function (a, i) { a.classList.toggle('on', i === current); });
    sheetLinks.forEach(function (a, i) { a.classList.toggle('on', i === current); });
  }

  var queued = false;
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; onScroll(); });
  }, { passive: true });
  onScroll();

  /* ---- reveal on scroll ------------------------------------------------- */
  var hidden = document.querySelectorAll('.reveal');

  if (calm || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(hidden, function (el) { el.classList.add('in'); });
  } else {
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        watcher.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(hidden, function (el) { watcher.observe(el); });
  }

  /* ---- screenshot viewer ----------------------------------------------- */
  var box = document.getElementById('box');
  var boxImg = document.getElementById('box-img');
  var boxCap = document.getElementById('box-cap');
  var boxClose = document.getElementById('box-close');
  var opener = null;

  function open(trigger) {
    var img = trigger.querySelector('img');
    boxImg.src = trigger.dataset.shot;
    boxImg.alt = img ? img.alt : '';
    boxCap.textContent = trigger.dataset.cap || '';
    box.hidden = false;
    lock(true);
    opener = trigger;
    boxClose.focus();
  }

  function close() {
    if (box.hidden) return;
    box.hidden = true;
    boxImg.src = '';
    lock(false);
    if (opener) { opener.focus(); opener = null; }
  }

  if (box) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-shot]'), function (trigger) {
      trigger.addEventListener('click', function () { open(trigger); });
    });

    boxClose.addEventListener('click', close);
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.classList.contains('box-fig')) close();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (box && !box.hidden) close();
    else setMenu(false);
  });

  /* ---- footer year ------------------------------------------------------ */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
