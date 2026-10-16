(() => {
  const menuToggle = document.querySelector('#menu-toggle');
  const primaryNav = document.querySelector('#primary-nav');
  const searchToggle = document.querySelector('#search-toggle');
  const searchPanel = document.querySelector('#search-panel');
  const searchInput = document.querySelector('#site-search');
  const searchClear = document.querySelector('#search-clear');
  const searchHint = document.querySelector('#search-hint');
  const filterButtons = [...document.querySelectorAll('.filter-chip')];
  const newsCards = [...document.querySelectorAll('.news-card')];
  const noResults = document.querySelector('#no-results');
  const contactForm = document.querySelector('#contact-form');
  const formNote = document.querySelector('#form-note');
  const storyTabs = [...document.querySelectorAll('.story-tab')];
  const storyImage = document.querySelector('#story-image');
  const storyLabel = document.querySelector('#story-visual-label');
  const storyQuote = document.querySelector('#story-quote');
  const storyCredit = document.querySelector('#story-credit');
  const storyOpen = document.querySelector('#story-open');
  const storyVideoShell = document.querySelector('#story-video-shell');
  const storyPlayButton = document.querySelector('#story-play-button');
  let activeCategory = 'all';

  // Media is loaded only after a visitor activates it. YouTube plays directly in its
  // card; Instagram posts/reels open in an accessible in-page player instead of a new tab.
  const instagramModal = document.querySelector('#instagram-player-modal');
  const instagramDialog = instagramModal?.querySelector('.instagram-player-dialog');
  const instagramFrameShell = document.querySelector('#instagram-player-frame-shell');
  const instagramTitle = document.querySelector('#instagram-player-title');
  const instagramSource = document.querySelector('#instagram-player-source');
  let instagramReturnFocus = null;

  function closeInlineVideo(shell, restoreFocus = false) {
    if (!shell) return;
    const frame = shell.querySelector(':scope > .inline-video-frame');
    const closeButton = shell.querySelector(':scope > .inline-video-close');
    const finishClose = () => {
      frame?.remove();
      closeButton?.remove();
      shell.classList.remove('is-playing');
      if (restoreFocus) shell.querySelector('.inline-video-trigger')?.focus({ preventScroll: true });
    };
    if (frame && window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.gsap.to([frame, closeButton].filter(Boolean), {
        autoAlpha: 0, scale: 0.985, duration: 0.16, ease: 'power1.in', onComplete: finishClose
      });
    } else {
      finishClose();
    }
  }

  function closeInstagramInline(restoreFocus = true) {
    if (!instagramModal || instagramModal.hidden) return;
    const finishClose = () => {
      if (instagramFrameShell) instagramFrameShell.replaceChildren();
      instagramModal.hidden = true;
      instagramModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('instagram-player-open');
      window.gelvandaleLocomotiveScroll?.start?.();
      if (restoreFocus) instagramReturnFocus?.focus({ preventScroll: true });
      instagramReturnFocus = null;
    };
    if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && instagramDialog) {
      window.gsap.to(instagramDialog, { y: 14, scale: 0.985, autoAlpha: 0, duration: 0.18, ease: 'power2.in', onComplete: finishClose });
      window.gsap.to('.instagram-player-backdrop', { autoAlpha: 0, duration: 0.18, overwrite: true });
    } else {
      finishClose();
    }
  }

  function openInstagramInline(button, shell) {
    const rawPath = button.dataset.instagramPath || shell?.dataset.instagramPath || '';
    const path = rawPath.replace(/^\/+|\/+$/g, '');
    if (!instagramModal || !instagramFrameShell || !/^(p|reel|tv)\/[A-Za-z0-9_-]+$/.test(path)) return;

    document.querySelectorAll('.inline-video-shell.is-playing').forEach((activeShell) => closeInlineVideo(activeShell));
    closeInstagramInline(false);
    instagramReturnFocus = button;
    const title = button.dataset.videoTitle || shell?.dataset.videoTitle || 'Gelvandale Rugby Academy media';
    const source = shell?.dataset.sourceUrl || `https://www.instagram.com/${path}/`;
    if (instagramTitle) instagramTitle.textContent = title;
    if (instagramSource) instagramSource.href = source;

    const frame = document.createElement('iframe');
    frame.className = 'instagram-player-frame';
    frame.src = `https://www.instagram.com/${path}/embed/`;
    frame.title = `${title} — Instagram embed`;
    frame.loading = 'eager';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; clipboard-write; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.setAttribute('loading', 'eager');
    instagramFrameShell.replaceChildren(frame);
    instagramModal.hidden = false;
    instagramModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('instagram-player-open');
    window.gelvandaleLocomotiveScroll?.stop?.();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.gsap && !reduced && instagramDialog) {
      window.gsap.set(instagramDialog, { autoAlpha: 1 });
      window.gsap.fromTo('.instagram-player-backdrop', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22, ease: 'power1.out', overwrite: true });
      window.gsap.fromTo(instagramDialog, { autoAlpha: 0, y: 18, scale: 0.975 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out', overwrite: true });
    } else if (instagramDialog) {
      instagramDialog.style.opacity = '1';
      instagramDialog.style.visibility = 'visible';
      instagramDialog.style.transform = 'none';
    }
    instagramModal.querySelector('[data-close-instagram]:not(.instagram-player-backdrop)')?.focus({ preventScroll: true });
  }

  function playInlineVideo(button) {
    const shell = button.closest('.inline-video-shell');
    const platform = button.dataset.videoPlatform || shell?.dataset.videoPlatform || 'youtube';
    if (platform === 'instagram') {
      openInstagramInline(button, shell);
      return;
    }
    const videoId = button.dataset.videoId || shell?.dataset.videoId;
    if (!shell || !videoId || !/^[A-Za-z0-9_-]{6,}$/.test(videoId)) return;

    closeInstagramInline(false);
    document.querySelectorAll('.inline-video-shell.is-playing').forEach((activeShell) => {
      closeInlineVideo(activeShell);
    });

    const title = button.dataset.videoTitle || shell.dataset.videoTitle || 'Gelvandale Rugby Academy video';
    const frame = document.createElement('iframe');
    frame.className = 'inline-video-frame';
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1&rel=0&controls=1&modestbranding=1`;
    frame.title = title;
    frame.loading = 'eager';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'inline-video-close';
    closeButton.setAttribute('aria-label', 'Close video and return to thumbnail');
    closeButton.title = 'Close video';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => closeInlineVideo(shell, true));

    shell.classList.add('is-playing');
    shell.append(frame, closeButton);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.gsap && !reduced) {
      window.gsap.fromTo(frame, { autoAlpha: 0, scale: 0.985 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power2.out' });
      window.gsap.fromTo(closeButton, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.2, delay: 0.08, ease: 'back.out(1.7)' });
    }
    closeButton.focus({ preventScroll: true });
  }

  document.querySelectorAll('.inline-video-trigger').forEach((button) => {
    button.addEventListener('click', () => playInlineVideo(button));
  });
  instagramModal?.querySelectorAll('[data-close-instagram]').forEach((button) => {
    button.addEventListener('click', () => closeInstagramInline(true));
  });
  instagramModal?.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const closeControl = instagramModal.querySelector('.instagram-player-close');
    const sourceControl = instagramSource;
    if (event.shiftKey && document.activeElement === closeControl) {
      event.preventDefault();
      sourceControl?.focus();
    } else if (!event.shiftKey && document.activeElement === sourceControl) {
      event.preventDefault();
      closeControl?.focus();
    }
  });

  // Graceful enhancement: the complete page remains usable if the CDN is unavailable or
  // the visitor prefers reduced motion. GSAP and ScrollTrigger are pinned to the same release.
  function initGsapInteractions() {
    const gsap = window.gsap;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!gsap || reduceMotion) return;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro
      .from('.utility-note', { y: -10, opacity: 0, duration: 0.42 })
      .from('.site-header .brand', { y: -16, opacity: 0, duration: 0.48 }, '-=0.22')
      .from('.primary-nav > a, .nav-actions > a', { y: -10, opacity: 0, duration: 0.36, stagger: 0.045 }, '-=0.28')
      .from('.hero-intro .eyebrow', { y: 14, opacity: 0, duration: 0.4 }, '-=0.08')
      .from('.hero-intro h1', { y: 38, opacity: 0, duration: 0.72 }, '-=0.18')
      .from('.hero-intro > p', { y: 18, opacity: 0, duration: 0.48 }, '-=0.34')
      .from('.hero-card', { y: 32, opacity: 0, scale: 0.99, duration: 0.75 }, '-=0.2');

    if (window.ScrollTrigger) {
      gsap.to('.hero-card > img', {
        scale: 1.075,
        ease: 'none',
        scrollTrigger: { trigger: '.hero-section', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });

      const headings = [
        '.news-section .section-heading', '#culture .culture-heading', '.partner-title-wrap',
        '.story-heading', '.impact-heading', '.fan-wall-heading', '.social-cta-heading',
        '.support-needs-heading', '.contact-intro', '.visit-content'
      ];
      headings.forEach((selector) => {
        gsap.utils.toArray(selector).forEach((element) => {
          gsap.from(element, {
            y: 28, opacity: 0, duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: element, start: 'top 86%', once: true }
          });
        });
      });

      const staggerGroups = [
        ['.news-grid', '.news-card'],
        ['.partner-logos', '.partner-logos > *'],
        ['.impact-points', '.impact-points > div'],
        ['.fan-wall-grid', '.fan-wall-grid > *'],
        ['.social-card-rail', '.social-card-rail > *'],
        ['.support-needs-grid', '.support-need-card']
      ];
      staggerGroups.forEach(([triggerSelector, itemSelector]) => {
        const trigger = document.querySelector(triggerSelector);
        const items = gsap.utils.toArray(itemSelector);
        if (!trigger || !items.length) return;
        gsap.from(items, {
          y: 26, opacity: 0, duration: 0.58, stagger: 0.09, ease: 'power2.out',
          scrollTrigger: { trigger, start: 'top 83%', once: true }
        });
      });

      gsap.from('.pathway-step', {
        y: 15, opacity: 0, duration: 0.5, stagger: 0.13, ease: 'power2.out',
        scrollTrigger: { trigger: '.pathway-ribbon', start: 'top 96%', once: true }
      });
    }

    // Small, restrained hover responses on desktop. Touch interactions remain click-driven.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.querySelectorAll('.news-card, .support-need-card, .social-card').forEach((card) => {
        card.addEventListener('mouseenter', () => gsap.to(card, { y: -4, duration: 0.22, ease: 'power2.out', overwrite: true }));
        card.addEventListener('mouseleave', () => gsap.to(card, { y: 0, duration: 0.28, ease: 'power2.out', overwrite: true }));
      });
      document.querySelectorAll('.button, .video-play-button, .fan-play-button, .social-video-play').forEach((button) => {
        button.addEventListener('mouseenter', () => gsap.to(button, { scale: 1.025, duration: 0.18, ease: 'power2.out', overwrite: true }));
        button.addEventListener('mouseleave', () => gsap.to(button, { scale: 1, duration: 0.22, ease: 'power2.out', overwrite: true }));
      });
      document.querySelectorAll('.fan-photo, .news-image, .hero-card, .culture-image-wrap, .impact-image').forEach((media) => {
        const image = media.querySelector('img');
        if (!image) return;
        media.addEventListener('mouseenter', () => {
          if (!media.classList.contains('is-playing')) gsap.to(image, { scale: 1.045, duration: 0.55, ease: 'power2.out', overwrite: true });
        });
        media.addEventListener('mouseleave', () => gsap.to(image, { scale: 1, duration: 0.5, ease: 'power2.out', overwrite: true }));
      });
    }
  }
  initGsapInteractions();

  // Locomotive Scroll v5 adds viewport detection, subtle desktop parallax and a scroll
  // callback. The native browser scrollbar stays visible. If the CDN is unavailable,
  // the page falls back to a normal scroll listener and the CSS marquee animation.
  function initLocomotiveEnhancement() {
    const LocomotiveScroll = window.LocomotiveScroll;
    const gsap = window.gsap;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const progressBar = document.querySelector('#scroll-progress-bar');
    const marqueeTrack = document.querySelector('#kinetic-marquee-track');
    let marqueeTween = null;
    let marqueeReset = null;
    let locomotive = null;
    let previousY = window.scrollY || 0;
    let fallbackFrame = 0;

    if (marqueeTrack && gsap && !reduceMotion) {
      marqueeTrack.style.animation = 'none';
      marqueeTween = gsap.fromTo(marqueeTrack, { xPercent: 0 }, {
        xPercent: -50, duration: 26, ease: 'none', repeat: -1
      });
    }

    function onScrollMotion({ progress = 0, direction = 1, velocity = 0 } = {}) {
      if (progressBar) progressBar.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
      if (marqueeTween && gsap && !reduceMotion && Math.abs(velocity) > 0.015) {
        const speed = Math.max(1, Math.min(2.5, 1 + Math.abs(velocity) * 0.8));
        marqueeTween.timeScale(direction >= 0 ? speed : -speed);
        marqueeReset?.kill();
        marqueeReset = gsap.delayedCall(0.18, () => {
          if (marqueeTween) gsap.to(marqueeTween, { timeScale: 1, duration: 0.6, ease: 'power2.out', overwrite: true });
        });
      }
      window.ScrollTrigger?.update();
    }

    if (LocomotiveScroll && !reduceMotion) {
      try {
        const options = {
          lenisOptions: {
            lerp: 0.085,
            smoothWheel: true,
            smoothTouch: false,
            wheelMultiplier: 0.92,
            touchMultiplier: 1.5,
            normalizeWheel: true
          },
          scrollCallback: onScrollMotion
        };
        // Follow Locomotive's supported custom-ticker pattern when GSAP is present,
        // so ScrollTrigger and the scrolling engine share the same frame clock.
        if (gsap?.ticker) {
          options.initCustomTicker = (render) => gsap.ticker.add(render);
          options.destroyCustomTicker = (render) => gsap.ticker.remove(render);
          gsap.ticker.lagSmoothing(0);
        }
        locomotive = new LocomotiveScroll(options);
        document.documentElement.classList.add('has-locomotive');
        window.gelvandaleLocomotiveScroll = locomotive;
        window.addEventListener('load', () => window.ScrollTrigger?.refresh(), { once: true });
        requestAnimationFrame(() => window.ScrollTrigger?.refresh());
      } catch (error) {
        console.warn('Locomotive Scroll could not start; using native scrolling.', error);
      }
    }

    // Keep the progress bar responsive even if Locomotive Scroll does not load, or
    // motion is reduced. This listener also handles browsers with external-script blocks.
    if (!locomotive) {
      const nativeUpdate = () => {
        if (fallbackFrame) return;
        fallbackFrame = requestAnimationFrame(() => {
          fallbackFrame = 0;
          const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
          const y = window.scrollY || document.documentElement.scrollTop || 0;
          const progress = Math.max(0, Math.min(1, y / max));
          const delta = y - previousY;
          previousY = y;
          onScrollMotion({ progress, direction: delta >= 0 ? 1 : -1, velocity: Math.abs(delta) });
        });
      };
      window.addEventListener('scroll', nativeUpdate, { passive: true });
      nativeUpdate();
    }
  }
  initLocomotiveEnhancement();

  function setMenuOpen(open) {
    if (!menuToggle || !primaryNav) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    primaryNav.classList.toggle('is-open', open);
  }

  menuToggle?.addEventListener('click', () => {
    setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  primaryNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));

  function setSearchOpen(open) {
    if (!searchPanel || !searchToggle) return;
    searchPanel.hidden = !open;
    searchToggle.setAttribute('aria-expanded', String(open));
    if (open) searchInput?.focus();
  }
  searchToggle?.addEventListener('click', () => setSearchOpen(searchPanel?.hidden ?? true));

  function applyStoryFilters() {
    const query = (searchInput?.value ?? '').trim().toLocaleLowerCase();
    let shown = 0;
    newsCards.forEach((card) => {
      const categoryMatch = activeCategory === 'all' || card.dataset.category === activeCategory;
      const searchable = `${card.dataset.search ?? ''} ${card.innerText ?? ''}`.toLocaleLowerCase();
      const queryMatch = !query || searchable.includes(query);
      const visible = categoryMatch && queryMatch;
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    if (noResults) noResults.hidden = shown > 0;
    if (searchHint) searchHint.textContent = query
      ? `${shown} ${shown === 1 ? 'story' : 'stories'} match “${query}”.`
      : 'Type to filter the stories below.';
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.filter ?? 'all';
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      applyStoryFilters();
    });
  });
  searchInput?.addEventListener('input', applyStoryFilters);
  searchClear?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    applyStoryFilters();
    searchInput?.focus();
  });

  // These quotations are sourced from published reporting and must keep their attribution.
  const storyContent = {
    vision: {
      videoId: 'aSkc3apwEFA',
      src: 'https://img.youtube.com/vi/aSkc3apwEFA/maxresdefault.jpg',
      alt: 'Thumbnail from the academy media links supplied for this website concept',
      label: 'THE VISION / 01',
      quote: 'Despite what people think and say, not all children are lost to crime and the Gelvandale Academy is proof of that.',
      credit: 'ENRICO GROOTBOOM · THE HERALD, OCTOBER 2025',
      url: 'https://theherald.co.za/sport/rugby/2025-10-21-gelvandale-rugby-academy-invited-to-play-in-namibia/'
    },
    exposure: {
      videoId: 'D9lnzrUF0Yo',
      src: 'https://img.youtube.com/vi/D9lnzrUF0Yo/maxresdefault.jpg',
      alt: 'Thumbnail from the academy media links supplied for this website concept',
      label: 'OPPORTUNITY / 02',
      quote: 'Going to Namibia will give them the exposure they need and deserve because their talent is sometimes missed due to where they stay and attend school.',
      credit: 'ENRICO GROOTBOOM · THE HERALD, OCTOBER 2025',
      url: 'https://theherald.co.za/sport/rugby/2025-10-21-gelvandale-rugby-academy-invited-to-play-in-namibia/'
    },
    support: {
      videoId: 'QpCPL4iM1p0',
      src: 'https://img.youtube.com/vi/QpCPL4iM1p0/maxresdefault.jpg',
      alt: 'Thumbnail from the academy media links supplied for this website concept',
      label: 'COMMUNITY / 03',
      quote: 'My plea is that business owners in our community support these kids who want to live a better life, after all, they will be representing their community, EP and the whole of SA.',
      credit: 'ENRICO GROOTBOOM · THE HERALD, OCTOBER 2025',
      url: 'https://theherald.co.za/sport/rugby/2025-10-21-gelvandale-rugby-academy-invited-to-play-in-namibia/'
    }
  };

  storyTabs.forEach((button) => {
    button.addEventListener('click', () => {
      const story = storyContent[button.dataset.story];
      if (!story || !storyImage || !storyLabel || !storyQuote || !storyCredit || !storyOpen) return;
      storyTabs.forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      if (storyVideoShell?.classList.contains('is-playing')) closeInlineVideo(storyVideoShell);
      if (storyVideoShell) {
        storyVideoShell.dataset.videoId = story.videoId;
        storyVideoShell.dataset.videoTitle = `Gelvandale Rugby Academy — ${story.label.toLowerCase()}`;
      }
      if (storyPlayButton) storyPlayButton.dataset.videoId = story.videoId;
      const updateStory = () => {
        storyImage.src = story.src;
        storyImage.alt = story.alt;
        storyImage.onerror = () => {
          storyImage.onerror = null;
          storyImage.src = story.src.replace('/maxresdefault.jpg', '/hqdefault.jpg');
        };
        storyLabel.textContent = story.label;
        storyQuote.textContent = story.quote;
        storyCredit.textContent = story.credit;
        storyOpen.href = story.url;
      };
      if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.gsap.to([storyImage, storyQuote], { opacity: 0, duration: 0.12, onComplete: () => {
          updateStory();
          window.gsap.to([storyImage, storyQuote], { opacity: 1, duration: 0.28, ease: 'power2.out', clearProps: 'opacity' });
        }});
      } else {
        storyImage.style.opacity = '0.35';
        window.setTimeout(() => { updateStory(); storyImage.style.opacity = '1'; }, 110);
      }
    });
  });

  // Local front-end validation only: no message is sent or saved.
  contactForm?.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('input', () => {
      if (field.hasAttribute('aria-invalid')) field.removeAttribute('aria-invalid');
      if (formNote?.classList.contains('error')) {
        formNote.classList.remove('error');
        formNote.textContent = 'Demo only — this form validates in your browser but does not send or store messages. Contact integration is still to be connected.';
      }
    });
  });
  contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = [...contactForm.querySelectorAll('input[required], select[required], textarea[required]')];
    const invalidFields = fields.filter((field) => !field.checkValidity());
    if (invalidFields.length) {
      invalidFields.forEach((field) => field.setAttribute('aria-invalid', 'true'));
      invalidFields[0].focus();
      formNote?.classList.remove('success');
      formNote?.classList.add('error');
      if (formNote) formNote.textContent = 'Please complete the required fields and check the email address.';
      contactForm.reportValidity();
      return;
    }
    formNote?.classList.remove('error');
    formNote?.classList.add('success');
    if (formNote) formNote.textContent = 'The form looks complete. This concept does not send or store messages; connect the academy email or form service before launch.';
    contactForm.reset();
    contactForm.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setSearchOpen(false);
      setMenuOpen(false);
      document.querySelectorAll('.inline-video-shell.is-playing').forEach((shell) => closeInlineVideo(shell, true));
      closeInstagramInline(true);
    }
  });
  const desktopMedia = window.matchMedia('(min-width: 851px)');
  desktopMedia.addEventListener?.('change', (event) => {
    if (event.matches) setMenuOpen(false);
  });
})();
