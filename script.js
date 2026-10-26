// Original Canvas 2D magnetic field across the viewport.
const mountContactMagnetField = (canvas) => {
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return null;

  const spacing = 48;
  const radius = 260;
  const opacity = 0.25;
  const fade = 0.65;
  const stretch = 0.35;
  const baseAngle = -10 * Math.PI / 180;
  const state = { width: 0, height: 0, ratio: 1, lines: [], pulses: [] };
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, clientX: 0, clientY: 0, inside: false };
  let frame = 0;
  let lastFrame = 0;
  let alive = true;
  let visible = true;

  const wrapAngle = (angle) => ((((angle + Math.PI / 2) % Math.PI) + Math.PI) % Math.PI) - Math.PI / 2;

  function requestDraw() {
    if (!frame && alive && visible && document.visibilityState !== 'hidden') {
      lastFrame = performance.now();
      frame = requestAnimationFrame(drawFrame);
    }
  }

  function drawField(now = performance.now()) {
    if (!visible) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (!width || !height) return;
    state.ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    state.width = width;
    state.height = height;
    canvas.width = Math.max(1, Math.round(width * state.ratio));
    canvas.height = Math.max(1, Math.round(height * state.ratio));
    state.lines = [];
    const columns = Math.max(2, Math.min(40, Math.ceil(width / spacing)));
    const rows = Math.max(2, Math.min(24, Math.ceil(height / spacing)));
    for (let row = 1; row <= rows; row += 1) {
      for (let column = 1; column <= columns; column += 1) {
        state.lines.push({
          x: width * column / (columns + 1),
          y: height * row / (rows + 1),
          angle: baseAngle,
          scale: 1
        });
      }
    }
    lastFrame = now;
    drawFrame(now);
  }

  function pointerMove(event) {
    if (event.pointerType === 'touch') return;
    pointer.clientX = event.clientX;
    pointer.clientY = event.clientY;
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    pointer.inside = true;
    requestDraw();
  }

  function pointerLeave() {
    pointer.inside = false;
    requestDraw();
  }

  function pointerDown(event) {
    if (event.pointerType === 'touch') return;
    pointerMove(event);
    const farthest = Math.max(
      Math.hypot(pointer.targetX, pointer.targetY),
      Math.hypot(state.width - pointer.targetX, pointer.targetY),
      Math.hypot(pointer.targetX, state.height - pointer.targetY),
      Math.hypot(state.width - pointer.targetX, state.height - pointer.targetY)
    );
    state.pulses.push({ x: pointer.targetX, y: pointer.targetY, age: 0, life: Math.min(2.4, farthest / 360 + 0.5) });
    if (state.pulses.length > 3) state.pulses.shift();
    requestDraw();
  }

  function drawFrame(now) {
    frame = 0;
    if (!alive || !visible || document.visibilityState === 'hidden') return;
    const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
    lastFrame = now;
    const ease = 1 - Math.exp(-dt / 0.12);
    pointer.x += (pointer.targetX - pointer.x) * ease;
    pointer.y += (pointer.targetY - pointer.y) * ease;
    state.pulses = state.pulses.filter((pulse) => (pulse.age += dt) < pulse.life);

    context.setTransform(state.ratio, 0, 0, state.ratio, 0, 0);
    context.clearRect(0, 0, state.width, state.height);
    context.lineWidth = 1;
    context.lineCap = 'round';
    let moving = Math.abs(pointer.targetX - pointer.x) + Math.abs(pointer.targetY - pointer.y) > 0.08;

    state.lines.forEach((line) => {
      const dx = line.x - pointer.x;
      const dy = line.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const proximity = pointer.inside ? Math.max(0, 1 - distance / radius) : 0;
      const emphasis = proximity * proximity * (3 - 2 * proximity);
      const orbitAngle = Math.atan2(dy, dx) + Math.PI / 2;
      const desiredAngle = baseAngle + wrapAngle(orbitAngle - baseAngle) * emphasis;
      let pulseSpin = 0;
      let pulseFlash = 0;
      state.pulses.forEach((pulse) => {
        const travelled = pulse.age * 360;
        const pulseDistance = Math.hypot(line.x - pulse.x, line.y - pulse.y);
        const band = Math.exp(-(((travelled - pulseDistance) / 42) ** 2));
        pulseSpin += band * 0.28;
        pulseFlash += band * Math.max(0, 1 - pulse.age / pulse.life);
      });

      const targetAngle = desiredAngle + pulseSpin;
      const angleDelta = wrapAngle(targetAngle - line.angle);
      line.angle += angleDelta * ease;
      const targetScale = 1 + stretch * emphasis + Math.min(0.18, pulseFlash * 0.1);
      line.scale += (targetScale - line.scale) * ease;
      if (Math.abs(angleDelta) > 0.002 || Math.abs(targetScale - line.scale) > 0.002) moving = true;

      const tint = Math.min(1, emphasis + pulseFlash * 0.24);
      const red = Math.round(168 + (192 - 168) * tint);
      const green = Math.round(85 + (132 - 85) * tint);
      const blue = Math.round(247 + (252 - 247) * tint);
      const alpha = opacity * (1 - fade * (1 - emphasis)) + Math.min(0.12, pulseFlash * 0.035);
      const half = (14 * line.scale) / 2;
      context.save();
      context.translate(line.x, line.y);
      context.rotate(line.angle);
      context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${Math.min(1, Math.max(0, alpha))})`;
      context.beginPath();
      context.moveTo(-half, 0);
      context.lineTo(half, 0);
      context.stroke();
      context.restore();
    });

    if (moving || state.pulses.length) frame = requestAnimationFrame(drawFrame);
  }

  window.addEventListener('pointermove', pointerMove, { passive: true });
  window.addEventListener('pointerdown', pointerDown, { passive: true });
  document.documentElement.addEventListener('pointerleave', pointerLeave);
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (visible) drawField();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);
  const onResize = () => drawField();
  window.addEventListener('resize', onResize, { passive: true });
  canvas.classList.add('is-active');
  drawField();

  return () => {
    alive = false;
    cancelAnimationFrame(frame);
    window.removeEventListener('pointermove', pointerMove);
    window.removeEventListener('pointerdown', pointerDown);
    window.removeEventListener('resize', onResize);
    document.documentElement.removeEventListener('pointerleave', pointerLeave);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    canvas.classList.remove('is-active');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };
};

(() => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress');
  const progressFill = progress?.querySelector('span');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.primary-navigation');
  const sectionLinks = [...(navigation?.querySelectorAll('a[href^="#"]') || [])]
    .map((link) => ({ link, section: document.getElementById(link.getAttribute('href').slice(1)) }))
    .filter((item) => item.section);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  root.classList.add('js-enabled');

  // ==========================================
  // SITE PRELOADER SCREEN (HOMEPAGE ONLY)
  // ==========================================
  const loader = document.getElementById('site-loader');
  if (loader) {
    // If coming back from another page or back-forward navigation, skip immediately
    if (document.documentElement.classList.contains('skip-loader')) {
      loader.hidden = true;
      document.body.classList.remove('is-loading');
    } else {
      document.body.classList.add('is-loading');
      const percentageEl = loader.querySelector('.site-loader__percentage');
      const progressEl = loader.querySelector('.site-loader__progress');
      const startTime = performance.now();
      const duration = 2250;

      const stepLoader = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        const percent = Math.round(ease * 100);

        if (percentageEl) percentageEl.textContent = `${percent}%`;
        if (progressEl) progressEl.setAttribute('aria-valuenow', String(percent));

        if (progress < 1) {
          requestAnimationFrame(stepLoader);
        } else {
          setTimeout(() => {
            loader.classList.add('is-done');
            document.body.classList.remove('is-loading');
            setTimeout(() => {
              loader.hidden = true;
            }, 450);
          }, 180);
        }
      };

      requestAnimationFrame(stepLoader);
    }

    // Handle browser bfcache restore
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        loader.hidden = true;
        document.body.classList.remove('is-loading');
      }
    });
  }

  // If currently browsing a project subpage, flag in session so returning home skips the loader
  if (window.location.pathname.includes('/projects/') || window.location.pathname.includes('projects/')) {
    try {
      sessionStorage.setItem('returning_from_subpage', 'true');
    } catch(e) {}
  }


  // ==========================================
  // BENTO GRID INTERACTIVE FILTERING
  // ==========================================
  const bentoGrid = document.querySelector('.bento-grid');
  const bentoCards = bentoGrid ? [...bentoGrid.querySelectorAll('.bento-card, .bento-stacked-wrap')] : [];
  const bentoFilterPills = document.querySelectorAll('.bento-filter-pill');

  if (bentoFilterPills.length) {
    bentoFilterPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        bentoFilterPills.forEach((p) => {
          p.classList.remove('is-active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('is-active');
        pill.setAttribute('aria-selected', 'true');

        const filter = pill.dataset.filter;

        bentoCards.forEach((card) => {
          const categories = (card.dataset.category || '').split(',').map((c) => c.trim());
          if (filter === 'all' || categories.includes(filter)) {
            card.classList.remove('is-dimmed');
          } else {
            card.classList.add('is-dimmed');
          }
        });
      });
    });
  }

  // Make each card click navigate to its target project
  if (bentoCards.length) {
    bentoCards.forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a:not(.bento-card-hitbox), button')) return;
        const href = card.dataset.href;
        if (href) {
          if (href.startsWith('http')) {
            window.open(href, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = href;
          }
        }
      });
    });
  }

  // ==========================================
  // REVEAL ANIMATIONS
  // ==========================================
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    root.classList.add('has-motion');

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal], .content-section, .projects-section-dark').forEach((element) => revealObserver.observe(element));
  }

  // ==========================================
  // SCROLL PROGRESS & ACTIVE LINK
  // ==========================================
  let scrollFrame = 0;
  const updateScrollState = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      progressFill?.style.setProperty('transform', `scaleY(${ratio})`);
      progress?.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));


      header?.classList.toggle('is-scrolled', window.scrollY > 20);

      const marker = window.innerHeight * 0.36;
      let currentLink = null;
      sectionLinks.forEach(({ link, section }) => {
        if (section.getBoundingClientRect().top <= marker) currentLink = link;
      });
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        currentLink = sectionLinks[sectionLinks.length - 1]?.link || currentLink;
      }
      sectionLinks.forEach(({ link }) => {
        if (link === currentLink) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });

      scrollFrame = 0;
    });
  };

  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  updateScrollState();

  // ==========================================
  // MOBILE MENU TOGGLE
  // ==========================================
  if (menuButton && navigation) {
    const closeMenu = () => {
      navigation.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
    };

    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') !== 'true';
      navigation.classList.toggle('is-open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMenu());
    });
  }

  // ==========================================
  // HERO ROTATING TEXT ANIMATION
  // ==========================================
  const textRotators = document.querySelectorAll('.text-rotator');

  textRotators.forEach((rotator) => {
    const items = [...rotator.querySelectorAll('.text-rotator__item')];
    if (items.length <= 1) return;

    let currentIndex = items.findIndex((el) => el.classList.contains('is-active'));
    if (currentIndex < 0) currentIndex = 0;

    let timer = null;
    let isPaused = false;
    const intervalMs = parseInt(rotator.dataset.interval, 10) || 3000;

    const updateWidth = (index) => {
      const activeItem = items[index];
      if (activeItem) {
        rotator.style.width = `${activeItem.offsetWidth}px`;
      }
    };

    const setWord = (nextIndex) => {
      if (items.length <= 1) return;
      const prevItem = items[currentIndex];
      currentIndex = (nextIndex + items.length) % items.length;
      const nextItem = items[currentIndex];

      if (prevItem && prevItem !== nextItem) {
        prevItem.classList.remove('is-active');
        prevItem.classList.add('is-exiting');
        setTimeout(() => {
          prevItem.classList.remove('is-exiting');
        }, 500);
      }

      nextItem.classList.remove('is-exiting');
      nextItem.classList.add('is-active');
      updateWidth(currentIndex);
    };

    const startRotator = () => {
      if (reduceMotion.matches) return;
      stopRotator();
      timer = setInterval(() => {
        if (!isPaused && document.visibilityState === 'visible') {
          setWord(currentIndex + 1);
        }
      }, intervalMs);
    };

    const stopRotator = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    rotator.addEventListener('mouseenter', () => { isPaused = true; });
    rotator.addEventListener('mouseleave', () => { isPaused = false; });

    document.addEventListener('visibilitychange', () => {
      isPaused = document.hidden;
    });

    window.addEventListener('resize', () => {
      updateWidth(currentIndex);
    }, { passive: true });

    // Measure after fonts are loaded
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => updateWidth(currentIndex));
    } else {
      setTimeout(() => updateWidth(currentIndex), 100);
    }

    updateWidth(currentIndex);
    startRotator();
  });

  // ==========================================
  // ACCORDION GALLERY AUTO-CYCLE & INTERACTION
  // ==========================================
  const accordionGalleries = document.querySelectorAll('[data-accordion-gallery]');

  accordionGalleries.forEach((gallery) => {
    const panels = [...gallery.querySelectorAll('.ag-panel')];
    if (panels.length <= 1) return;

    let currentIndex = panels.findIndex((p) => p.getAttribute('aria-checked') === 'true');
    if (currentIndex < 0) {
      const defaultIdx = parseInt(gallery.dataset.defaultIndex, 10);
      currentIndex = Number.isInteger(defaultIdx) ? defaultIdx : 0;
    }

    let timer = null;
    let isPaused = false;
    const intervalMs = parseInt(gallery.dataset.interval, 10) || 3000;

    const setActive = (index) => {
      currentIndex = (index + panels.length) % panels.length;
      panels.forEach((panel, i) => {
        const isActive = i === currentIndex;
        panel.setAttribute('aria-checked', String(isActive));
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('tabindex', isActive ? '0' : '-1');

        if (i < currentIndex) {
          panel.style.setProperty('--ag-tilt', '-5deg');
        } else if (i > currentIndex) {
          panel.style.setProperty('--ag-tilt', '5deg');
        } else {
          panel.style.setProperty('--ag-tilt', '0deg');
        }
      });
    };

    const next = () => {
      setActive(currentIndex + 1);
    };

    const startAutoPlay = () => {
      if (reduceMotion.matches) return;
      stopAutoPlay();
      timer = setInterval(() => {
        if (!isPaused && document.visibilityState === 'visible') {
          next();
        }
      }, intervalMs);
    };

    const stopAutoPlay = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    // User interaction (hover / click / focus)
    panels.forEach((panel, i) => {
      panel.addEventListener('mouseenter', () => {
        isPaused = true;
        setActive(i);
      });

      panel.addEventListener('click', () => {
        setActive(i);
        startAutoPlay();
      });

      panel.addEventListener('focus', () => {
        isPaused = true;
        setActive(i);
      });
    });

    gallery.addEventListener('mouseenter', () => {
      isPaused = true;
    });

    gallery.addEventListener('mouseleave', () => {
      isPaused = false;
    });

    // Keyboard navigation (arrows)
    gallery.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(currentIndex + 1);
        panels[currentIndex]?.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(currentIndex - 1);
        panels[currentIndex]?.focus();
      }
    });

    // Pause when tab is hidden
    document.addEventListener('visibilitychange', () => {
      isPaused = document.hidden;
    });

    // Initialize
    setActive(currentIndex);
    startAutoPlay();
  });

  // ==========================================
  // MAGNETIC CANVAS BACKGROUND
  // ==========================================
  const magnetCanvas = document.querySelector('.magnet-lines-canvas');
  let removeMagnetField = null;
  const syncMagnet = () => {
    if (finePointer.matches && !reduceMotion.matches && magnetCanvas && !removeMagnetField) {
      removeMagnetField = mountContactMagnetField(magnetCanvas);
    } else if ((!finePointer.matches || reduceMotion.matches) && removeMagnetField) {
      removeMagnetField();
      removeMagnetField = null;
    }
  };
  syncMagnet();
})();
