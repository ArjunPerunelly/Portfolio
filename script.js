// Original Canvas 2D magnetic field across the viewport. It uses a sparse,
// demand-rendered grid so the static site does not need React or WebGL.
const mountContactMagnetField = (canvas) => {
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return null;

  const spacing = 48;
  const radius = 260;
  const opacity = 0.34;
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
      const red = Math.round(212 + (119 - 212) * tint);
      const green = Math.round(196 + (141 - 196) * tint);
      const blue = Math.round(168 + (122 - 168) * tint);
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
  const skillsMarquee = document.querySelector('.skills-marquee');
  const marqueeToggle = document.querySelector('.skills-marquee-toggle');
  const sectionLinks = [...(navigation?.querySelectorAll('a[href^="#"]') || [])]
    .map((link) => ({ link, section: document.getElementById(link.getAttribute('href').slice(1)) }))
    .filter((item) => item.section);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  root.classList.add('js-enabled');

  if (skillsMarquee && marqueeToggle) {
    const updateMarqueePreference = (event) => {
      const shouldReduce = event?.matches ?? reduceMotion.matches;
      marqueeToggle.hidden = shouldReduce;
      if (shouldReduce) {
        skillsMarquee.classList.remove('is-paused');
        marqueeToggle.textContent = 'Pause ticker';
        marqueeToggle.setAttribute('aria-label', 'Pause skills marquee');
      }
    };

    updateMarqueePreference();
    marqueeToggle.addEventListener('click', () => {
      const isPaused = skillsMarquee.classList.toggle('is-paused');
      marqueeToggle.textContent = isPaused ? 'Resume ticker' : 'Pause ticker';
      marqueeToggle.setAttribute('aria-label', isPaused ? 'Resume skills marquee' : 'Pause skills marquee');
    });

    if (typeof reduceMotion.addEventListener === 'function') {
      reduceMotion.addEventListener('change', updateMarqueePreference);
    } else {
      reduceMotion.addListener?.(updateMarqueePreference);
    }
  }

  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    root.classList.add('has-motion');

    const staggerGroups = [
      ['.project-feature > [data-reveal]', 120],
      ['.about-layout > [data-reveal]', 120],
      ['.skills-grid > .skill-card', 85]
    ];

    staggerGroups.forEach(([selector, interval]) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        element.style.setProperty('--reveal-delay', `${index * interval}ms`);
      });
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

    document.querySelectorAll('[data-reveal], .content-section').forEach((element) => revealObserver.observe(element));
  }

  let frame = 0;
  const updateScrollState = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      progressFill?.style.setProperty('transform', `scaleY(${ratio})`);
      progress?.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
      header?.classList.toggle('is-scrolled', window.scrollY > 16);

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

      frame = 0;
    });
  };

  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  updateScrollState();

  if (menuButton && navigation) {
    const closeMenu = ({ returnFocus = false } = {}) => {
      navigation.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      if (returnFocus) menuButton.focus();
    };

    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') !== 'true';
      navigation.classList.toggle('is-open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMenu());
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        closeMenu({ returnFocus: true });
      }
    });

    const desktopNavigation = window.matchMedia('(min-width: 601px)');
    const closeOnDesktop = (event) => {
      if (event.matches) closeMenu();
    };
    if (typeof desktopNavigation.addEventListener === 'function') {
      desktopNavigation.addEventListener('change', closeOnDesktop);
    } else {
      desktopNavigation.addListener?.(closeOnDesktop);
    }
  }

  const magnetCanvas = document.querySelector('.magnet-lines-canvas');
  const borderGlowTargets = [...document.querySelectorAll('.skill-card, .project-architecture, .contact-card, .button, .primary-navigation a, .nav-linkedin, .nav-github, .menu-toggle, .skills-marquee-toggle, .back-to-top')];
  let removeMagnetField = null;
  let removeBorderGlowTracking = null;
  const syncMagnetField = () => {
    const shouldEnable = finePointer.matches && !reduceMotion.matches;
    if (shouldEnable && !removeMagnetField && magnetCanvas) {
      removeMagnetField = mountContactMagnetField(magnetCanvas);
    } else if (!shouldEnable && removeMagnetField) {
      removeMagnetField();
      removeMagnetField = null;
    }
  };
  const mountBorderGlowTracking = () => {
    const removeListeners = borderGlowTargets.map((element) => {
      const onPointerMove = (event) => {
        if (event.pointerType === 'touch') return;
        const rect = element.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const pointerAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        element.style.setProperty('--border-glow-angle', `${pointerAngle - 20}deg`);
      };
      const onPointerLeave = () => element.style.removeProperty('--border-glow-angle');
      element.addEventListener('pointermove', onPointerMove, { passive: true });
      element.addEventListener('pointerleave', onPointerLeave, { passive: true });
      return () => {
        element.removeEventListener('pointermove', onPointerMove);
        element.removeEventListener('pointerleave', onPointerLeave);
        element.style.removeProperty('--border-glow-angle');
      };
    });

    return () => removeListeners.forEach((remove) => remove());
  };
  const syncBorderGlowTracking = () => {
    const shouldEnable = finePointer.matches && !reduceMotion.matches;
    if (shouldEnable && !removeBorderGlowTracking) {
      removeBorderGlowTracking = mountBorderGlowTracking();
    } else if (!shouldEnable && removeBorderGlowTracking) {
      removeBorderGlowTracking();
      removeBorderGlowTracking = null;
    }
  };
  const syncEffects = () => {
    syncMagnetField();
    syncBorderGlowTracking();
  };
  const teardownEffects = () => {
    removeMagnetField?.();
    removeMagnetField = null;
    removeBorderGlowTracking?.();
    removeBorderGlowTracking = null;
  };
  const watchPreference = (mediaQuery, callback) => {
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', callback);
    } else {
      mediaQuery.addListener?.(callback);
    }
  };
  syncEffects();
  watchPreference(finePointer, syncEffects);
  watchPreference(reduceMotion, syncEffects);
  window.addEventListener('pagehide', teardownEffects);
  window.addEventListener('pageshow', syncEffects);
})();
