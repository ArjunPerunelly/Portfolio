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
      ['.skills-list > .skill-row', 85]
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

    document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));
  }

  let frame = 0;
  const updateScrollState = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      progressFill?.style.setProperty('transform', `scaleX(${ratio})`);
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

    window.matchMedia('(min-width: 701px)').addEventListener('change', (event) => {
      if (event.matches) closeMenu();
    });
  }
})();
