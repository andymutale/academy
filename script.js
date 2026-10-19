(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const root = document.documentElement;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  let lenis = null;
  let lenisRaf = 0;
  let cursor = null;
  let refreshScrollZoom = () => {};
  let refreshMotionStory = () => {};
  let refreshHorizontalRail = () => {};
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* Local preference still applies for this page. */ } }
  };

  // Display preferences. The site remains usable if storage is unavailable.
  const darkToggles = $$('[data-preference="theme"]');
  const motionToggles = $$('[data-preference="motion"]');
  let reduceMotion = storage.get('gra-reduce-motion') === 'true' || (storage.get('gra-reduce-motion') === null && motionQuery.matches);
  const savedTheme = storage.get('gra-theme');
  function setTheme(dark, persist = true) {
    root.dataset.theme = dark ? 'dark' : 'light';
    darkToggles.forEach(toggle => { toggle.checked = dark; });
    if (persist) storage.set('gra-theme', dark ? 'dark' : 'light');
  }
  function setReducedMotion(value, persist = true) {
    reduceMotion = Boolean(value);
    root.classList.toggle('reduce-motion', reduceMotion);
    motionToggles.forEach(toggle => { toggle.checked = reduceMotion; });
    if (persist) storage.set('gra-reduce-motion', String(reduceMotion));
    if (reduceMotion && lenis) {
      lenis.destroy();
      lenis = null;
      cancelAnimationFrame(lenisRaf);
    } else if (!reduceMotion) initLenis();
    root.classList.toggle('cursor-enabled', Boolean(cursor && pointerFine.matches && !reduceMotion));
    if (reduceMotion && window.gsap) {
      try { window.gsap.globalTimeline.getChildren(true, true, false).forEach(animation => animation.kill()); } catch (_) { /* GSAP is optional. */ }
      if (window.ScrollTrigger) window.ScrollTrigger.getAll().forEach(trigger => trigger.kill(false));
      $$('[data-reveal], .title-line').forEach(el => { el.style.opacity = ''; el.style.transform = ''; el.style.visibility = ''; });
    }
    if (reduceMotion) {
      $$('[data-reveal]').forEach(el => el.classList.add('is-visible'));
      closeCursor();
    }
    refreshScrollZoom();
    refreshMotionStory();
    refreshHorizontalRail();
  }
  setTheme(savedTheme === 'dark', false);
  setReducedMotion(reduceMotion, false);
  darkToggles.forEach(toggle => toggle.addEventListener('change', () => setTheme(toggle.checked)));
  motionToggles.forEach(toggle => toggle.addEventListener('change', () => setReducedMotion(toggle.checked)));
  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', event => {
      if (storage.get('gra-reduce-motion') === null) setReducedMotion(event.matches, false);
    });
  }

  // Display menu.
  const displayToggle = $('#display-toggle');
  const displayMenu = $('#display-menu');
  function closeDisplay() {
    if (!displayMenu || !displayToggle) return;
    displayMenu.hidden = true;
    displayToggle.setAttribute('aria-expanded', 'false');
  }
  displayToggle?.addEventListener('click', () => {
    const opening = displayMenu.hidden;
    displayMenu.hidden = !opening;
    displayToggle.setAttribute('aria-expanded', String(opening));
  });
  document.addEventListener('click', event => {
    if (displayMenu && !event.target.closest('.display-wrap')) closeDisplay();
  });

  // Accessible full-screen site navigation shared across every static page.
  const menuToggle = $('#menu-toggle');
  const mobileNav = $('#mobile-nav');
  let lastMenuFocus = null;
  let menuCloseTimer = 0;
  function openMenu() {
    if (!mobileNav || !menuToggle) return;
    window.clearTimeout(menuCloseTimer);
    lastMenuFocus = document.activeElement;
    closeActiveVideo();
    mobileNav.hidden = false;
    mobileNav.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close navigation menu');
    requestAnimationFrame(() => {
      mobileNav.classList.add('is-open');
      mobileNav.querySelector('.mobile-nav-link')?.focus({ preventScroll: true });
    });
  }
  function closeMenu(returnFocus = false) {
    if (!mobileNav || !menuToggle || mobileNav.hidden) return;
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
    const finishClose = () => { mobileNav.hidden = true; };
    const shouldSkipTransition = root.classList.contains('reduce-motion') || motionQuery.matches;
    if (shouldSkipTransition) finishClose();
    else menuCloseTimer = window.setTimeout(finishClose, 360);
    if (returnFocus && lastMenuFocus && typeof lastMenuFocus.focus === 'function') {
      lastMenuFocus.focus({ preventScroll: true });
    }
  }
  menuToggle?.addEventListener('click', () => mobileNav?.hidden ? openMenu() : closeMenu(true));
  $$('#mobile-nav a').forEach(link => link.addEventListener('click', () => closeMenu(true)));
  mobileNav?.addEventListener('click', event => { if (event.target === mobileNav) closeMenu(true); });
  // Close the overlay if a device rotates into the desktop navigation breakpoint.
  window.matchMedia('(min-width: 1021px)').addEventListener?.('change', event => {
    if (event.matches && mobileNav && !mobileNav.hidden) closeMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (mobileNav && !mobileNav.hidden) closeMenu(true);
      closeDisplay();
      closeActiveVideo();
    }
    if (event.key === 'Tab' && mobileNav && !mobileNav.hidden) {
      const focusables = [menuToggle, ...$$('a[href], button:not([disabled]), input:not([disabled]), summary', mobileNav)].filter(el => el && el.getClientRects().length > 0);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  // Active navigation for both root anchors and static directory pages.
  const pathname = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
  const pageKey = pathname === '/' ? 'home' : pathname.split('/').filter(Boolean).pop();
  $$('[data-page-link]').forEach(link => {
    if (link.dataset.pageLink === pageKey) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('is-current');
    }
  });

  // Smooth scrolling uses Lenis when it loads; native CSS scrolling remains as fallback.
  function initLenis() {
    if (reduceMotion || lenis || typeof window.Lenis !== 'function') return;
    try {
      lenis = new window.Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: .9, anchors: false });
      const tick = time => {
        if (!lenis) return;
        lenis.raf(time);
        if (window.ScrollTrigger) window.ScrollTrigger.update();
        lenisRaf = requestAnimationFrame(tick);
      };
      cancelAnimationFrame(lenisRaf);
      lenisRaf = requestAnimationFrame(tick);
      if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
        lenis.on('scroll', window.ScrollTrigger.update);
      }
    } catch (_) { lenis = null; }
  }
  initLenis();
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor || !lenis) return;
    const id = anchor.getAttribute('href');
    const target = id && id.length > 1 ? $(id) : null;
    if (!target) return;
    event.preventDefault();
    lenis.scrollTo(target, { offset: -86, duration: reduceMotion ? 0 : 1.0 });
    history.replaceState(null, '', id);
  });

  // Thin scroll progress indicator.
  const progress = $('#scroll-progress');
  let scrollPending = false;
  function updateProgress() {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
    scrollPending = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();

  // Optional GSAP title entrance and reliable IntersectionObserver fallback.
  function setupReveals() {
    const revealEls = $$('[data-reveal]');
    if (reduceMotion) { revealEls.forEach(el => el.classList.add('is-visible')); return; }
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      revealEls.forEach(el => {
        window.gsap.fromTo(el, { y: 24, autoAlpha: .25 }, {
          y: 0, autoAlpha: 1, duration: .65, ease: 'power2.out', immediateRender: false,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onComplete: () => el.classList.add('is-visible')
        });
      });
    } else if ('IntersectionObserver' in window) {
      revealEls.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; el.style.transition = 'opacity .65s ease, transform .65s ease'; });
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); entry.target.style.opacity = '1'; entry.target.style.transform = 'none'; observer.unobserve(entry.target); }
      }), { threshold: .1, rootMargin: '0px 0px -5% 0px' });
      revealEls.forEach(el => observer.observe(el));
    } else revealEls.forEach(el => el.classList.add('is-visible'));
  }
  setupReveals();
  if (!reduceMotion && window.gsap) {
    const lines = $$('.title-line');
    if (lines.length) window.gsap.fromTo(lines, { yPercent: 112 }, { yPercent: 0, duration: .9, ease: 'power3.out', stagger: .12, delay: .1, clearProps: 'transform' });
  }

  // Try the known public crest URL first; if unavailable, check the current deployment root,
  // then the project asset path. If none exists, show the labelled GRA monogram fallback.
  function fallbackCrest(img) {
    if (!img) return;
    const liveHost = (() => {
      try { return new URL(img.dataset.crestLive || img.currentSrc || img.src).hostname; }
      catch (_) { return ''; }
    })();
    if (img.dataset.crestTriedCurrent !== 'true') {
      img.dataset.crestTriedCurrent = 'true';
      if (window.location.hostname && window.location.hostname !== liveHost) {
        img.src = '/gelvandale-rugby-academy-crest.jpg';
        return;
      }
    }
    if (img.dataset.crestTriedLocal !== 'true' && img.dataset.crestLocal) {
      img.dataset.crestTriedLocal = 'true';
      img.src = img.dataset.crestLocal;
      return;
    }
    if (img.dataset.crestFallback === 'true') return;
    img.dataset.crestFallback = 'true';
    img.hidden = true;
    const fallback = img.nextElementSibling;
    if (fallback) fallback.hidden = false;
  }
  $$('img[data-crest]').forEach(img => {
    img.addEventListener('error', () => fallbackCrest(img));
    if (img.complete && img.naturalWidth === 0) fallbackCrest(img);
  });

  // Fail visibly, never silently swap a dead URL for a different photograph.
  // This keeps the caption/source paired with the image the visitor actually sees.
  function handlePublicPhotoError(image) {
    if (!(image instanceof HTMLImageElement) || !image.matches('[data-public-media]')) return;
    if (image.dataset.errorHandled === 'true') return;
    image.dataset.errorHandled = 'true';
    image.hidden = true;
    const figure = image.closest('figure');
    const caption = figure?.querySelector('figcaption');
    const wrapper = figure || image.closest('.story-card-media, .pathway-image-button, .about-media, .media-photo-link') || image.parentElement;
    if (wrapper) wrapper.classList.add('media-unavailable');
    const note = document.createElement('span');
    note.className = 'media-fallback-note';
    note.textContent = 'Temporary stock image did not load from Pexels. Try the Pexels source link.';
    if (caption) {
      if (!caption.querySelector('.media-fallback-note')) caption.appendChild(note);
    } else if (wrapper && !wrapper.querySelector('.media-fallback-note')) {
      wrapper.appendChild(note);
    }
  }
  document.addEventListener('error', event => handlePublicPhotoError(event.target), true);

  // Inline video: one player at a time, kept in the same aspect-ratio frame.
  const videoPoster = new WeakMap();
  $$('[data-video-shell]').forEach(shell => videoPoster.set(shell, shell.innerHTML));
  let activeVideoShell = null;
  function restoreVideo(shell) {
    if (!shell) return;
    const poster = videoPoster.get(shell);
    if (poster) shell.innerHTML = poster;
    shell.classList.remove('inline-video-playing');
    if (activeVideoShell === shell) activeVideoShell = null;
  }
  function closeActiveVideo() {
    if (activeVideoShell) restoreVideo(activeVideoShell);
  }
  function playInline(shell, id, title) {
    if (!shell || !id) return;
    if (activeVideoShell && activeVideoShell !== shell) restoreVideo(activeVideoShell);
    if (activeVideoShell === shell) return;
    const frame = document.createElement('iframe');
    frame.title = title || 'Gelvandale Rugby Academy video';
    const provider = shell.dataset.videoProvider || 'youtube';
    frame.src = provider === 'dailymotion'
      ? `https://www.dailymotion.com/embed/video/${encodeURIComponent(id)}?autoplay=1&ui-start-screen-info=false`
      : `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1&modestbranding=1&controls=1`;
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.loading = 'eager';
    shell.replaceChildren(frame);
    shell.classList.add('inline-video-playing');
    activeVideoShell = shell;
    // GSAP animates the player into the existing fixed-ratio frame after explicit user action.
    // If GSAP is unavailable or motion is reduced, playback still works without animation.
    if (!reduceMotion && !motionQuery.matches && window.gsap) {
      window.gsap.fromTo(frame, { autoAlpha: 0, scale: 0.985 }, {
        autoAlpha: 1, scale: 1, duration: 0.42, ease: 'power2.out', clearProps: 'transform,opacity,visibility'
      });
    }
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-play-video]');
    if (!button) return;
    const shell = button.closest('[data-video-shell]');
    playInline(shell, shell?.dataset.videoId, shell?.dataset.videoTitle || button.getAttribute('aria-label'));
  });

  // Pathway popups use temporary Pexels stock placeholders until academy-owned media is available.
  const publicMedia = {
    teamA: { src: 'https://images.pexels.com/photos/3679338/pexels-photo-3679338.jpeg?auto=compress&cs=tinysrgb&w=800&q=78&fm=webp', alt: 'Group of men playing rugby; temporary stock image, not Gelvandale Rugby Academy media.', source: 'https://www.pexels.com/photo/group-of-men-playing-rugby-3679338/', credit: 'Pexels stock image · illustrative placeholder' },
    teamB: { src: 'https://images.pexels.com/photos/3693105/pexels-photo-3693105.jpeg?auto=compress&cs=tinysrgb&w=800&q=78&fm=webp', alt: 'Men playing rugby; temporary stock image, not Gelvandale Rugby Academy media.', source: 'https://www.pexels.com/photo/photo-of-men-playing-rugby-3693105/', credit: 'Pexels stock image · illustrative placeholder' },
    coach: { src: 'https://images.pexels.com/photos/8586346/pexels-photo-8586346.jpeg?auto=compress&cs=tinysrgb&w=800&q=78&fm=webp', alt: 'Men playing rugby; temporary stock image, not Gelvandale Rugby Academy media.', source: 'https://www.pexels.com/photo/men-playing-rugby-8586346/', credit: 'Pexels stock image · illustrative placeholder' },
    community: { src: 'https://images.pexels.com/photos/39703728/pexels-photo-39703728.jpeg?auto=compress&cs=tinysrgb&w=800&q=78&fm=webp', alt: 'Pexels stock photo 39703728; illustrative placeholder, not academy media.', source: 'https://images.pexels.com/photos/39703728/pexels-photo-39703728.jpeg?auto=compress&cs=tinysrgb&w=800&q=78&fm=webp', credit: 'Pexels stock image · illustrative placeholder' },
    namibia: { src: 'https://images.pexels.com/photos/3702666/pexels-photo-3702666.jpeg?auto=compress&cs=tinysrgb&w=800&q=78&fm=webp', alt: 'Rugby on a grass field; temporary stock image, not Gelvandale Rugby Academy media.', source: 'https://www.pexels.com/photo/group-of-men-playing-rugby-on-grass-field-3702666/', credit: 'Pexels stock image · illustrative placeholder' },
    golf: { src: 'https://images.pexels.com/photos/39629703/pexels-photo-39629703.jpeg?auto=compress&cs=tinysrgb&w=800&q=78&fm=webp', alt: 'Pexels stock photo 39629703; illustrative placeholder, not academy media.', source: 'https://images.pexels.com/photos/39629703/pexels-photo-39629703.jpeg?auto=compress&cs=tinysrgb&w=800&q=78&fm=webp', credit: 'Pexels stock image · illustrative placeholder' },
    girls: { src: 'https://images.pexels.com/photos/39704273/pexels-photo-39704273.jpeg?auto=compress&cs=tinysrgb&w=800&q=78&fm=webp', alt: 'Pexels stock photo 39704273; illustrative placeholder, not academy media.', source: 'https://images.pexels.com/photos/39704273/pexels-photo-39704273.jpeg?auto=compress&cs=tinysrgb&w=800&q=78&fm=webp', credit: 'Pexels stock image · illustrative placeholder' },
    enrico: { src: 'https://images.pexels.com/photos/17341038/pexels-photo-17341038.jpeg?auto=compress&cs=tinysrgb&w=800&q=78&fm=webp', alt: 'Pexels stock photo 17341038; illustrative placeholder, not academy media.', source: 'https://images.pexels.com/photos/17341038/pexels-photo-17341038.jpeg?auto=compress&cs=tinysrgb&w=800&q=78&fm=webp', credit: 'Pexels stock image · illustrative placeholder' }
  };
  const pathwayDialog = $('#pathway-dialog');
  const pathwayDialogContent = $('#pathway-dialog-content');
  const pathwayDetails = {
    development: {
      label: 'Pathway 01 · Player development', title: 'Build skills and character.',
      body: 'Rugby offers a space to practise commitment, teamwork, fitness and discipline. The academy’s current training schedule and eligibility rules should be confirmed directly before an enquiry is treated as an application.',
      quote: 'Development matters in every part of sport.', source: 'Enrico Grootboom · published comments',
      points: [['Practice', 'Skills improve through repetition and coaching.'], ['Teamwork', 'Learning to work with others is part of the game.'], ['Commitment', 'Progress takes time and consistent effort.']],
      href: 'contact/?topic=Player%20development', hrefLabel: 'Ask about player development', gallery: [publicMedia.teamA, publicMedia.coach, publicMedia.teamB]
    },
    education: {
      label: 'Pathway 02 · Education', title: 'Keep possibilities open.',
      body: 'Education and scholarship opportunities are important to the academy’s public story. Availability, partners and current application routes need confirmation; this page does not promise a scholarship or placement.',
      quote: 'Life has more to offer than what is now happening in our communities.', source: 'Enrico Grootboom · The Herald · October 2025',
      points: [['Learning', 'Keep education visible alongside sport.'], ['Guidance', 'Ask about current routes and requirements.'], ['Opportunity', 'Confirm every scholarship and placement individually.']],
      href: 'contact/?topic=Education%20pathway', hrefLabel: 'Ask about education pathways', gallery: [publicMedia.community, publicMedia.enrico, publicMedia.girls]
    },
    exposure: {
      label: 'Pathway 03 · Player exposure', title: 'Give talent a chance to be seen.',
      body: 'Published reporting describes an invitation to the Day of Dolphin tournament in Swakopmund, Namibia. Tours and events can create visibility, but future invitations and travel programmes must be confirmed rather than assumed.',
      quote: 'Going to Namibia will give them the exposure they need and deserve.', source: 'Enrico Grootboom · The Herald · October 2025',
      points: [['Visibility', 'Talent should have opportunities to be seen.'], ['Experience', 'Playing beyond the local area can broaden perspective.'], ['Next steps', 'Event dates and pathways must be confirmed.']],
      href: 'https://www.theherald.co.za/sport/rugby/2025-10-21-gelvandale-rugby-academy-invited-to-play-in-namibia/', hrefLabel: 'Read the Namibia tour report', gallery: [publicMedia.namibia, publicMedia.teamA, publicMedia.girls]
    },
    community: {
      label: 'Pathway 04 · Community', title: 'Make progress together.',
      body: 'The academy’s story is connected with families, coaches, schools, businesses and supporters. Published fundraising totals are shared totals when multiple beneficiaries are named, and should not be attributed only to the academy.',
      quote: 'Nothing good in life comes easy, but if we can make it a little easier for each other, what a difference could be made.', source: 'Enrico Grootboom · published in The Herald · October 2025',
      points: [['People', 'Families, coaches and communities create support.'], ['Practical help', 'Current needs and costs require approval.'], ['Partnership', 'Sponsorship benefits and arrangements must be confirmed.']],
      href: 'support/', hrefLabel: 'Explore support areas', gallery: [publicMedia.golf, publicMedia.community, publicMedia.enrico]
    }
  };
  let currentPathwayGalleryItems = [];
  let currentPathwayGalleryIndex = 0;
  function renderPathwayGallery(index) {
    if (!pathwayDialogContent || !currentPathwayGalleryItems.length) return;
    currentPathwayGalleryIndex = (index + currentPathwayGalleryItems.length) % currentPathwayGalleryItems.length;
    const item = currentPathwayGalleryItems[currentPathwayGalleryIndex];
    const mainImage = $('[data-pathway-main-image]', pathwayDialogContent);
    const mainLink = $('[data-pathway-main-source]', pathwayDialogContent);
    const credit = $('[data-pathway-main-credit]', pathwayDialogContent);
    if (mainImage) { mainImage.src = item.src; mainImage.alt = item.alt; mainImage.dataset.publicMedia = ''; mainImage.hidden = false; mainImage.dataset.errorHandled = 'false'; }
    if (mainLink) { mainLink.href = item.source; mainLink.setAttribute('aria-label', `Open the source for ${item.alt}`); }
    if (credit) { credit.href = item.source; credit.textContent = `${item.credit} ↗`; }
    $$('[data-pathway-clip]', pathwayDialogContent).forEach((button, i) => button.setAttribute('aria-pressed', String(i === currentPathwayGalleryIndex)));
    const count = $('[data-pathway-gallery-count]', pathwayDialogContent);
    if (count) count.textContent = `${String(currentPathwayGalleryIndex + 1).padStart(2, '0')} / ${String(currentPathwayGalleryItems.length).padStart(2, '0')}`;
  }
  function openPathway(key) {
    closeActiveVideo();
    const item = pathwayDetails[key];
    if (!item || !pathwayDialog || !pathwayDialogContent) return;
    pathwayDialogContent.innerHTML = `<p class="descriptor"></p><h2 id="pathway-dialog-title" class="section-title"></h2><p class="pathway-dialog-body"></p><blockquote class="inner-quote"></blockquote><figure class="dialog-media dialog-photo"><a data-pathway-main-source target="_blank" rel="noopener noreferrer"><img data-pathway-main-image data-public-media alt="" loading="lazy"></a><figcaption><a data-pathway-main-credit target="_blank" rel="noopener noreferrer"></a></figcaption></figure><div class="dialog-gallery" aria-label="Related academy photographs"></div><div class="dialog-gallery-controls"><button type="button" class="text-link-button" data-pathway-gallery-prev>← Previous photo</button><span class="carousel-count" data-pathway-gallery-count>01 / 03</span><button type="button" class="text-link-button" data-pathway-gallery-next>Next photo →</button></div><div class="dialog-facts"></div><a class="button button-primary pathway-dialog-cta"></a>`;
    pathwayDialog.setAttribute('aria-labelledby', 'pathway-dialog-title');
    const d = pathwayDialogContent;
    $('.descriptor', d).textContent = item.label;
    $('.section-title', d).textContent = item.title;
    $('.pathway-dialog-body', d).textContent = item.body;
    $('.inner-quote', d).textContent = `“${item.quote}”`;
    const cite = document.createElement('cite'); cite.textContent = item.source; $('.inner-quote', d).appendChild(cite);
    currentPathwayGalleryItems = item.gallery.slice(); currentPathwayGalleryIndex = 0;
    const gallery = $('.dialog-gallery', d);
    gallery.innerHTML = currentPathwayGalleryItems.map((photo, i) => `<button type="button" data-pathway-clip="${i}" aria-label="Show photo ${i + 1}: ${photo.alt.replace(/"/g, '&quot;')}" aria-pressed="${i === 0}"><img src="${photo.src}" alt="" loading="lazy"><span>${String(i + 1).padStart(2, '0')}</span></button>`).join('');
    renderPathwayGallery(0);
    $('.dialog-facts', d).innerHTML = item.points.map((point, i) => `<article><p class="descriptor">0${i + 1}</p><h3></h3><p></p></article>`).join('');
    $$('.dialog-facts article', d).forEach((article, i) => { $('h3', article).textContent = item.points[i][0]; $('p:not(.descriptor)', article).textContent = item.points[i][1]; });
    const cta = $('.pathway-dialog-cta', d); cta.href = item.href; cta.textContent = `${item.hrefLabel} ↗`;
    if (pathwayDialog.showModal) pathwayDialog.showModal(); else pathwayDialog.setAttribute('open', 'open');
    document.body.classList.add('dialog-open');
  }
  $$('[data-open-pathway]').forEach(button => button.addEventListener('click', () => openPathway(button.dataset.openPathway)));
  function selectPathwayClip(index) { renderPathwayGallery(index); }
  document.addEventListener('click', event => {
    const clipButton = event.target.closest('[data-pathway-clip]');
    if (!clipButton || !pathwayDialogContent) return;
    const index = $$('[data-pathway-clip]', pathwayDialogContent).indexOf(clipButton);
    selectPathwayClip(index);
  });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-pathway-gallery-prev]')) selectPathwayClip(currentPathwayGalleryIndex - 1);
    if (event.target.closest('[data-pathway-gallery-next]')) selectPathwayClip(currentPathwayGalleryIndex + 1);
  });

  // Story reader popup; full source remains available in the external source link.
  const storyDialog = $('#story-dialog');
  const storyDialogContent = $('#story-dialog-content');
  const storyCards = $$('[data-story-card]');
  let readerIndex = 0;
  const visibleStoryCards = () => storyCards.filter(card => !card.hidden);
  function renderStory(index) {
    const cards = visibleStoryCards();
    if (!cards.length) return;
    readerIndex = (index + cards.length) % cards.length;
    const card = cards[readerIndex];
    storyDialogContent.innerHTML = '<p class="descriptor"></p><h2 id="story-dialog-title" class="section-title"></h2><p class="story-dialog-date"></p><p class="story-dialog-summary"></p><a class="text-link story-dialog-source" target="_blank" rel="noopener noreferrer"></a>';
    storyDialog.setAttribute('aria-labelledby', 'story-dialog-title');
    $('.descriptor', storyDialogContent).textContent = card.dataset.category?.split(' ')[0] || 'Story';
    $('#story-dialog-title', storyDialogContent).textContent = card.dataset.title || 'Academy story';
    $('.story-dialog-date', storyDialogContent).textContent = card.dataset.date || '';
    $('.story-dialog-summary', storyDialogContent).textContent = card.dataset.summary || '';
    const source = $('.story-dialog-source', storyDialogContent);
    source.href = card.dataset.source || 'news/';
    if (source.href.includes('/media/')) { source.removeAttribute('target'); source.removeAttribute('rel'); }
    source.textContent = `${card.dataset.sourceLabel || 'Read the original source'} ↗`;
    const previous = $('[data-story-prev]'); const next = $('[data-story-next]');
    previous.disabled = cards.length < 2; next.disabled = cards.length < 2;
    $('[data-story-prev]')?.setAttribute('aria-label', 'Read previous story');
    $('[data-story-next]')?.setAttribute('aria-label', 'Read next story');
  }
  function openStory(card) {
    closeActiveVideo();
    const visible = visibleStoryCards();
    const i = visible.indexOf(card);
    renderStory(i < 0 ? 0 : i);
    if (storyDialog.showModal) storyDialog.showModal(); else storyDialog.setAttribute('open','open');
    document.body.classList.add('dialog-open');
  }
  $$('[data-story-open]').forEach(button => button.addEventListener('click', () => openStory(button.closest('[data-story-card]'))));
  $('[data-story-prev]')?.addEventListener('click', () => renderStory(readerIndex - 1));
  $('[data-story-next]')?.addEventListener('click', () => renderStory(readerIndex + 1));

  // All dialogs have explicit close controls, native Escape handling, and restore focus via native dialog behavior.
  $$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog')?.close()));
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      closeActiveVideo();
      if (dialog === pathwayDialog && pathwayDialogContent) { pathwayDialogContent.replaceChildren(); pathwayDialog.removeAttribute('aria-labelledby'); pathwayDialog.setAttribute('aria-label', 'Pathway details'); }
      if (dialog === storyDialog) { storyDialog.removeAttribute('aria-labelledby'); storyDialog.setAttribute('aria-label', 'Academy story'); }
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
  });

  // Verified fact carousel.
  function makeCarousel(slideSelector, prevSelector, nextSelector, countSelector) {
    const slides = $$(slideSelector);
    if (!slides.length) return;
    let current = Math.max(0, slides.findIndex(slide => slide.classList.contains('is-active')));
    const display = () => {
      slides.forEach((slide, index) => { const active = index === current; slide.hidden = !active; slide.classList.toggle('is-active', active); slide.setAttribute('aria-hidden', String(!active)); });
      const count = $(countSelector); if (count) count.textContent = `${String(current + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    };
    $(prevSelector)?.addEventListener('click', () => { current = (current - 1 + slides.length) % slides.length; display(); });
    $(nextSelector)?.addEventListener('click', () => { current = (current + 1) % slides.length; display(); });
    display();
  }
  makeCarousel('[data-fact-slide]', '[data-fact-prev]', '[data-fact-next]', '[data-fact-count]');
  makeCarousel('[data-quote-slide]', '[data-quote-prev]', '[data-quote-next]', '[data-quote-count]');
  ['[data-fact-carousel]', '[data-quote-carousel]'].forEach(selector => {
    const carousel = $(selector);
    carousel?.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const button = $(event.key === 'ArrowLeft' ? '[data-fact-prev], [data-quote-prev]' : '[data-fact-next], [data-quote-next]', carousel.parentElement);
      button?.click();
    });
  });
  storyDialog?.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); $('[data-story-prev]')?.click(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); $('[data-story-next]')?.click(); }
  });

  // Instant story category filters and live search.
  let activeFilter = 'all';
  let liveQuery = new URLSearchParams(location.search).get('q') || '';
  const storySearches = $$('[data-story-search]');
  storySearches.forEach(input => {
    input.value = liveQuery;
    input.addEventListener('input', () => { liveQuery = input.value.trim().toLowerCase(); storySearches.forEach(other => { if (other !== input) other.value = input.value; }); updateStories(); });
  });
  function updateStories() {
    let count = 0;
    storyCards.forEach(card => {
      const categories = (card.dataset.category || '').toLowerCase().split(/\s+/);
      const searchable = `${card.dataset.search || ''} ${card.dataset.title || ''} ${card.dataset.summary || ''} ${card.textContent}`.toLowerCase();
      const matchesCategory = activeFilter === 'all' || categories.includes(activeFilter);
      const matchesQuery = !liveQuery || searchable.includes(liveQuery);
      card.hidden = !(matchesCategory && matchesQuery);
      if (!card.hidden) count++;
    });
    $$('[data-no-stories]').forEach(empty => empty.hidden = count !== 0);
  }
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter || 'all';
    $$('[data-filter]').forEach(other => { const active = other === button; other.classList.toggle('is-active', active); other.setAttribute('aria-pressed', String(active)); });
    updateStories();
  }));
  $$('[data-clear-search]').forEach(button => button.addEventListener('click', () => { liveQuery = ''; storySearches.forEach(input => input.value = ''); updateStories(); }));
  updateStories();

  // Quiz: four steps, no information collected. The selected path can prefill the demo enquiry topic.
  const quiz = $('[data-path-quiz]');
  if (quiz) {
    const steps = $$('[data-quiz-step]', quiz);
    const next = $('[data-quiz-next]', quiz);
    const back = $('[data-quiz-back]', quiz);
    const error = $('[data-quiz-error]', quiz);
    const result = $('[data-quiz-result]', quiz);
    const progressBar = $('[data-quiz-progress]', quiz);
    const stepLabel = $('[data-quiz-step-label]', quiz);
    let currentStep = 0;
    let chosenTopic = 'Joining the academy';
    function showStep(index) {
      currentStep = Math.max(0, Math.min(steps.length - 1, index));
      steps.forEach((step, i) => step.hidden = i !== currentStep);
      result.hidden = true;
      next.hidden = false;
      back.hidden = currentStep === 0;
      stepLabel.textContent = `Step ${currentStep + 1} of ${steps.length}`;
      progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
      next.innerHTML = currentStep === steps.length - 1 ? 'Find my path <span aria-hidden="true">↗</span>' : 'Next <span aria-hidden="true">↗</span>';
      error.textContent = '';
    }
    next?.addEventListener('click', () => {
      const checked = $('input[type="radio"]:checked', steps[currentStep]);
      if (!checked) { error.textContent = 'Choose an option to continue.'; return; }
      if (currentStep < steps.length - 1) { showStep(currentStep + 1); return; }
      const who = quiz.elements.who?.value || '';
      const interest = quiz.elements.interest?.value || '';
      const need = quiz.elements.need?.value || '';
      const way = quiz.elements.contactWay?.value || '';
      chosenTopic = /sponsor|support/i.test(interest + need + way) || who === 'Business' ? 'Partnership or sponsorship' : /education/i.test(interest + need) ? 'Education pathway' : /player/i.test(interest + who) || /training/i.test(need) ? 'Player development' : 'Joining the academy';
      $('[data-quiz-result-title]', quiz).textContent = who === 'Business' || chosenTopic === 'Partnership or sponsorship' ? 'Start with a support conversation.' : chosenTopic === 'Education pathway' ? 'Ask about education pathways.' : chosenTopic === 'Player development' ? 'Ask about player development.' : 'Start with an enquiry.';
      $('[data-quiz-result-copy]', quiz).textContent = `Your answers suggest “${chosenTopic}” as a starting topic. This is guidance only; it does not indicate programme availability or acceptance.`;
      steps.forEach(step => step.hidden = true); next.hidden = true; back.hidden = true; result.hidden = false; error.textContent = '';
    });
    back?.addEventListener('click', () => showStep(currentStep - 1));
    $('[data-quiz-restart]')?.addEventListener('click', () => { quiz.reset(); showStep(0); });
    $('[data-quiz-to-form]')?.addEventListener('click', () => {
      // Keep one clear conversion endpoint: carry the quiz recommendation into Contact.
      window.location.href = `contact/?topic=${encodeURIComponent(chosenTopic)}`;
    });
    showStep(0);
  }

  // Quiz / ask tabs.
  const startTabs = $$('[data-start-tab]');
  startTabs.forEach(tab => tab.addEventListener('click', () => {
    const selected = tab.dataset.startTab;
    startTabs.forEach(other => {
      const active = other === tab;
      other.setAttribute('aria-selected', String(active));
      other.tabIndex = active ? 0 : -1;
    });
    $$('[data-start-panel]').forEach(panel => { panel.hidden = panel.dataset.startPanel !== selected; });
  }));
  startTabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const targetIndex = event.key === 'Home' ? 0 : event.key === 'End' ? startTabs.length - 1 : event.key === 'ArrowRight' ? (index + 1) % startTabs.length : (index - 1 + startTabs.length) % startTabs.length;
    startTabs[targetIndex].focus(); startTabs[targetIndex].click();
  }));

  // Demo form never pretends to send or store the enquiry.
  $$('[data-demo-form]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const status = $('[data-form-status]', form);
    if (status) status.textContent = 'Demo only: your information was not sent or stored. An approved enquiry service must be connected before this form is enabled.';
  }));
  const params = new URLSearchParams(location.search);
  const requestedTopic = params.get('topic');
  if (requestedTopic && $('#enquiry-topic')) {
    const select = $('#enquiry-topic');
    const match = Array.from(select.options).find(option => option.textContent.toLowerCase() === requestedTopic.toLowerCase() || option.value.toLowerCase() === requestedTopic.toLowerCase());
    if (match) select.value = match.value || match.textContent;
    $('[data-start-tab="ask"]')?.click();
  }

  // Rotate through distinct public photo stories, never invented video IDs.
  const randomStories = [
    { src: publicMedia.teamA.src, alt: publicMedia.teamA.alt, title: 'The academy team and the value of teamwork', label: 'Academy team · teamwork', source: publicMedia.teamA.source },
    { src: publicMedia.namibia.src, alt: publicMedia.namibia.alt, title: 'An invitation beyond borders', label: 'Player exposure · The Herald · 2025', source: publicMedia.namibia.source },
    { src: publicMedia.golf.src, alt: publicMedia.golf.alt, title: 'Community support for shared beneficiaries', label: 'Community · The Herald · 2024', source: publicMedia.golf.source },
    { src: publicMedia.enrico.src, alt: publicMedia.enrico.alt, title: 'The founder’s voice', label: 'Founder profile · Hollywood Foundation', source: publicMedia.enrico.source },
    { src: publicMedia.girls.src, alt: publicMedia.girls.alt, title: 'Girls rugby players meet their idols', label: 'Girls rugby exposure · The Herald · 2025', source: publicMedia.girls.source }
  ];
  let lastRandomStory = -1;
  $('[data-random-story]')?.addEventListener('click', () => {
    const card = $('.faq-random-card');
    const image = $('[data-random-story-source] img', card);
    const sourceLink = $('[data-random-story-source]', card);
    const readLink = $('[data-random-story-read]', card);
    if (!image || !sourceLink || !readLink) return;
    let index = Math.floor(Math.random() * randomStories.length);
    if (randomStories.length > 1 && index === lastRandomStory) index = (index + 1) % randomStories.length;
    lastRandomStory = index;
    const item = randomStories[index];
    image.src = item.src; image.alt = item.alt; image.hidden = false; image.dataset.errorHandled = 'false'; image.dataset.publicMedia = '';
    sourceLink.href = item.source; readLink.href = item.source;
    $('[data-random-story-title]', card).textContent = item.title;
    $('[data-random-story-label]', card).textContent = item.label;
    readLink.textContent = 'Read source ↗';
  });
  let mood = false;
  $('[data-mood-toggle]')?.addEventListener('click', event => {
    mood = !mood;
    const card = $('.faq-random-card');
    card?.classList.toggle('mood-alt', mood);
    event.currentTarget.textContent = `Mood: ${mood ? 'navy' : 'paper'}`;
  });

  // Instagram placeholder modal (official profile URL awaits confirmation).
  const socialDialog = $('#social-dialog');
  $$('[data-social-open]').forEach(button => button.addEventListener('click', () => {
    if (socialDialog?.showModal) socialDialog.showModal(); else socialDialog?.setAttribute('open','open');
  }));

  // Concept notice appears once unless dismissed, with an optional persistent preference.
  const conceptDialog = $('#concept-dialog');
  function closeConcept() {
    if (!conceptDialog) return;
    try { sessionStorage.setItem('gra-concept-session-seen', 'true'); } catch (_) { /* Session storage may be unavailable. */ }
    if ($('#concept-remember')?.checked) storage.set('gra-concept-seen', 'true');
    conceptDialog.close();
  }
  $$('[data-concept-close]').forEach(button => button.addEventListener('click', closeConcept));
  $('[data-open-concept]')?.addEventListener('click', () => { if (conceptDialog?.showModal) { conceptDialog.showModal(); document.body.classList.add('dialog-open'); } });
  conceptDialog?.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    try { sessionStorage.setItem('gra-concept-session-seen', 'true'); } catch (_) { /* Ignore blocked session storage. */ }
  });
  let conceptSeenThisSession = false;
  try { conceptSeenThisSession = sessionStorage.getItem('gra-concept-session-seen') === 'true'; } catch (_) { /* Ignore unavailable session storage. */ }
  if (conceptDialog && storage.get('gra-concept-seen') !== 'true' && !conceptSeenThisSession) {
    // Browser back/escape also uses the native dialog close mechanism.
    try { conceptDialog.showModal(); document.body.classList.add('dialog-open'); } catch (_) { /* Older browsers keep the notice accessible in static text. */ }
  }

  // Custom cursor: a bonus affordance, never the only indication that content is interactive.
  cursor = $('#cursor-magnet');
  root.classList.toggle('cursor-enabled', Boolean(cursor && pointerFine.matches && !reduceMotion));
  let cursorX = 0, cursorY = 0, cursorFrame = false;
  function closeCursor() { cursor?.classList.remove('is-visible'); }
  if (cursor && pointerFine.matches) {
    document.addEventListener('pointermove', event => {
      cursorX = event.clientX; cursorY = event.clientY;
      if (!cursorFrame) {
        cursorFrame = true;
        requestAnimationFrame(() => {
          cursor.style.left = `${cursorX}px`; cursor.style.top = `${cursorY}px`; cursorFrame = false;
        });
      }
    }, { passive: true });
    document.addEventListener('pointerover', event => {
      const target = event.target.closest('[data-cursor]');
      if (!target || reduceMotion) return closeCursor();
      cursor.textContent = target.dataset.cursor || 'Open';
      cursor.classList.add('is-visible');
    });
    document.addEventListener('pointerout', event => {
      const target = event.target.closest('[data-cursor]');
      if (target && !target.contains(event.relatedTarget)) closeCursor();
    });
  } else closeCursor();

  // Scroll-led rugby media sequence adapted from the supplied Butter Scroll reference.
  // Uses the site's existing Lenis + GSAP instances; never creates a second smooth-scroll loop.
  const motionIntro = $('.motion-story-intro');
  const motionEditor = $('.motion-editor-section');
  const motionSentence = $('.motion-story-sentence');
  const motionToggle = $('[data-motion-toggle]');
  const motionToggleLabel = $('[data-motion-toggle-label]');
  const motionStatus = $('[data-motion-status]');
  const motionVideos = $$('[data-motion-video]');
  const motionCells = $$('.motion-cell');
  let motionFlight = null;
  let motionSplit = null;
  let motionObserver = null;
  let motionUserPaused = false;
  let motionIsPlaying = false;

  function setMotionPlaybackState(playing, message) {
    motionIsPlaying = Boolean(playing);
    if (motionToggle) {
      motionToggle.setAttribute('aria-label', motionIsPlaying ? 'Pause stock video previews' : 'Play stock video previews');
      if (motionToggleLabel) motionToggleLabel.textContent = motionIsPlaying ? 'Pause clips' : 'Play clips';
      const icon = $('.motion-play-icon', motionToggle);
      if (icon) icon.textContent = motionIsPlaying ? 'Ⅱ' : '▶';
    }
    if (motionStatus && message) motionStatus.textContent = message;
  }

  function pauseMotionVideos() {
    motionVideos.forEach(video => { try { video.pause(); } catch (_) { /* Video may not be ready yet. */ } });
    setMotionPlaybackState(false, 'Stock video previews are paused.');
  }

  async function playMotionVideos() {
    if (!motionVideos.length) return;
    const attempts = motionVideos.map(video => {
      video.muted = true;
      video.playsInline = true;
      const deferredSources = [...video.querySelectorAll('source[data-src]')];
      let sourceAdded = false;
      deferredSources.forEach(source => {
        if (!source.getAttribute('src') && source.dataset.src) {
          source.src = source.dataset.src;
          sourceAdded = true;
        }
      });
      if (sourceAdded) video.load();
      try { return Promise.resolve(video.play()).then(() => true).catch(() => false); }
      catch (_) { return Promise.resolve(false); }
    });
    await Promise.all(attempts);
    const playing = motionVideos.some(video => !video.paused && !video.ended);
    setMotionPlaybackState(playing, playing
      ? 'Muted stock video previews are playing inline.'
      : 'The stock video previews could not start. Check the connection or press play again.');
  }

  motionToggle?.addEventListener('click', () => {
    if (motionIsPlaying || motionVideos.some(video => !video.paused && !video.ended)) {
      motionUserPaused = true;
      pauseMotionVideos();
    } else {
      motionUserPaused = false;
      playMotionVideos();
    }
  });

  // The panel observer only pauses offscreen videos; downloads start after an explicit Play action.
  if (motionEditor && 'IntersectionObserver' in window) {
    motionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Do not fetch or autoplay stock videos on scroll; load only after Play clips is activated.
        if (!motionIsPlaying && motionStatus) motionStatus.textContent = 'Stock video previews are ready. Select Play clips to load them.';
      } else {
        motionVideos.forEach(video => { try { video.pause(); } catch (_) { /* Ignore unloaded media. */ } });
        setMotionPlaybackState(false, 'Stock video previews are paused while this section is off-screen.');
      }
    }), { threshold: .15, rootMargin: '100px 0px' });
    motionObserver.observe(motionEditor);
  }

  function clearMotionAnimations() {
    if (motionFlight) {
      try { if (motionFlight.scrollTrigger) motionFlight.scrollTrigger.kill(); } catch (_) { /* Already killed by a motion preference change. */ }
      try { motionFlight.kill(); } catch (_) { /* Ignore an already disposed timeline. */ }
      motionFlight = null;
    }
    if (motionSplit) {
      try { motionSplit.revert(); } catch (_) { /* SplitText is optional. */ }
      motionSplit = null;
    }
    if (window.gsap) motionCells.forEach(cell => {
      const visual = $('.motion-cell-media', cell);
      if (visual) window.gsap.set(visual, { clearProps: 'transform' });
    });
  }

  refreshMotionStory = () => {
    clearMotionAnimations();
    if (!motionEditor || !motionIntro || !motionSentence || motionCells.length === 0) return;
    const slots = $$('.motion-slot', motionSentence);
    const visuals = motionCells.map(cell => $('.motion-cell-media', cell));
    if (slots.length !== visuals.length) return;

    if (reduceMotion || motionQuery.matches || !window.gsap || !window.ScrollTrigger) {
      motionVideos.forEach(video => { try { video.pause(); } catch (_) { /* Ignore media not ready. */ } });
      setMotionPlaybackState(false, 'Stock video previews are paused. Use Play clips to start them.');
      return;
    }

    const gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);
    try {
      if (window.SplitText && typeof window.SplitText.create === 'function') {
        motionSplit = window.SplitText.create(motionSentence, { type: 'words' });
        gsap.from(motionSplit.words, {
          opacity: 0,
          duration: .6,
          stagger: .045,
          ease: 'power2.out',
          scrollTrigger: { trigger: motionIntro, start: 'top 70%', once: true }
        });
      }
    } catch (_) { motionSplit = null; /* Text remains readable without SplitText. */ }

    motionFlight = gsap.timeline({
      scrollTrigger: {
        trigger: motionEditor,
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true
      }
    });

    visuals.forEach((visual, index) => {
      if (!visual || !slots[index]) return;
      gsap.set(visual, { transformOrigin: 'top left', rotation: 0 });
      const slot = slots[index];
      const cell = motionCells[index];
      const tilt = index % 2 === 0 ? 9 : -9;
      motionFlight.fromTo(visual, {
        x: () => slot.getBoundingClientRect().left - cell.getBoundingClientRect().left,
        y: () => slot.getBoundingClientRect().top - cell.getBoundingClientRect().top,
        scale: () => Math.max(.08, slot.getBoundingClientRect().width / Math.max(1, cell.getBoundingClientRect().width)),
      }, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'power2.inOut',
        immediateRender: true
      }, index * .1);
      motionFlight.to(visual, {
        rotation: tilt,
        duration: .25,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut'
      }, index * .1 + .3);
    });
    window.ScrollTrigger.refresh();

  };

  refreshMotionStory();

  // Desktop/tablet horizontal media storytelling, driven by the user's vertical scroll.
  // On narrow phones the rail stays natively swipeable: no pinned-scroll hijacking.
  const mediaSection = $('.media-section');
  const mediaRail = $('.media-rail', mediaSection || document);
  let horizontalMediaContext = null;

  refreshHorizontalRail = () => {
    if (horizontalMediaContext) {
      horizontalMediaContext.revert();
      horizontalMediaContext = null;
    }
    if (reduceMotion || !mediaSection || !mediaRail || !window.gsap || !window.ScrollTrigger) return;

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    horizontalMediaContext = gsap.matchMedia();
    horizontalMediaContext.add('(min-width: 801px) and (prefers-reduced-motion: no-preference)', () => {
      const viewport = mediaRail.parentElement;
      if (!viewport) return;

      mediaSection.classList.add('is-horizontal-pinned');
      mediaRail.classList.add('is-gsap-horizontal');

      const getDistance = () => Math.max(0, mediaRail.scrollWidth - viewport.clientWidth);
      if (getDistance() < 24) {
        mediaSection.classList.remove('is-horizontal-pinned');
        mediaRail.classList.remove('is-gsap-horizontal');
        return;
      }

      const tween = gsap.to(mediaRail, {
        x: () => -getDistance(),
        ease: 'none',
        overwrite: true,
        scrollTrigger: {
          trigger: mediaSection,
          start: 'top top+=88',
          end: () => `+=${Math.max(getDistance(), window.innerHeight * 0.45)}`,
          pin: true,
          scrub: 0.75,
          invalidateOnRefresh: true,
          anticipatePin: 1
        }
      });

      // Recalculate once image/layout dimensions settle, while avoiding an extra RAF loop.
      const refreshAfterLoad = () => ScrollTrigger.refresh();
      window.addEventListener('load', refreshAfterLoad, { once: true });

      return () => {
        window.removeEventListener('load', refreshAfterLoad);
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(mediaRail, { clearProps: 'transform' });
        mediaSection.classList.remove('is-horizontal-pinned');
        mediaRail.classList.remove('is-gsap-horizontal');
      };
    });
  };
  refreshHorizontalRail();

  // Dynamic copyright year.
  const year = $('[data-year]'); if (year) year.textContent = String(new Date().getFullYear());
})();
