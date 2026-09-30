(() => {
      const menuButton = document.querySelector('.menu-toggle');
      const mobilePanel = document.querySelector('.mobile-panel');
      const closeMenu = () => {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Open navigation');
        mobilePanel.classList.remove('is-open');
      };
      menuButton.addEventListener('click', () => {
        const open = menuButton.getAttribute('aria-expanded') === 'true';
        menuButton.setAttribute('aria-expanded', String(!open));
        menuButton.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
        mobilePanel.classList.toggle('is-open', !open);
      });
      mobilePanel.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
      window.addEventListener('resize', () => { if (window.innerWidth > 1050) closeMenu(); });

      document.querySelectorAll('.faq-list details').forEach(item => {
        item.addEventListener('toggle', () => {
          if (!item.open) return;
          document.querySelectorAll('.faq-list details').forEach(other => {
            if (other !== item) other.removeAttribute('open');
          });
        });
      });

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      document.querySelectorAll('.demo-step, .faq-list details, .footer-brand, .footer-col, .footer-bottom').forEach(el => {
        el.classList.add('reveal');
      });

      [
        '.case-grid .case-card',
        '.demo-script .demo-step',
        '.journey .journey-card',
        '.plans-grid .plan-card',
        '.faq-list details',
        '.footer-grid > *'
      ].forEach(selector => {
        document.querySelectorAll(selector).forEach((el, index) => {
          el.style.setProperty('--reveal-delay', `${Math.min(index, 6) * 85}ms`);
        });
      });

      const useCasesStage = document.querySelector('.case-stage');
      if (useCasesStage) {
        const wheelSectors = [...useCasesStage.querySelectorAll('.case-wheel-art .wheel-sector')];
        const caseCards = [...useCasesStage.querySelectorAll('.case-card')];
        const sectorCardIndexes = [0, 1, 3, 4, 2];
        wheelSectors.forEach((sector, sectorIndex) => {
          const card = caseCards[sectorCardIndexes[sectorIndex]];
          const setHoverState = isHovered => {
            sector.classList.toggle('is-hovered', isHovered);
            card?.classList.toggle('is-hovered', isHovered);
          };
          sector.addEventListener('pointerenter', () => setHoverState(true));
          sector.addEventListener('pointerleave', () => setHoverState(false));
        });
      }

      const reveals = document.querySelectorAll('.reveal');
      const resetDemoSequence = element => {
        if (!element.matches('.demo-script') || element.classList.contains('is-visible')) return;
        element.querySelectorAll('.demo-step').forEach(step => step.classList.remove('is-intro-complete'));
      };
      const easeScrollSequence = document.querySelector('.ease-scroll-sequence');
      const easeScrollCards = easeScrollSequence ? [...easeScrollSequence.querySelectorAll('.journey-card')] : [];
      const easeConnectorLine = easeScrollSequence?.querySelector('.journey-connectors-lines path');
      const easeConnectorNodes = easeScrollSequence ? [...easeScrollSequence.querySelectorAll('.journey-connectors-nodes circle')] : [];
      const easeConnectorNodeOffsets = (() => {
        if (!easeConnectorLine || !easeConnectorNodes.length || typeof easeConnectorLine.getTotalLength !== 'function') return [];
        const totalLength = easeConnectorLine.getTotalLength();
        const sampleCount = 240;
        return easeConnectorNodes.map(node => {
          const targetX = Number(node.getAttribute('cx'));
          const targetY = Number(node.getAttribute('cy'));
          let closestLength = 0;
          let closestDistance = Infinity;
          for (let sample = 0; sample <= sampleCount; sample += 1) {
            const length = (totalLength * sample) / sampleCount;
            const point = easeConnectorLine.getPointAtLength(length);
            const distance = ((point.x - targetX) ** 2) + ((point.y - targetY) ** 2);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestLength = length;
            }
          }
          return totalLength > 0 ? closestLength / totalLength : 0;
        });
      })();
      const easeScrollDesktop = window.matchMedia('(min-width: 721px)');
      const updateEaseScrollSequence = () => {
        if (!easeScrollSequence || !easeScrollCards.length) return;
        if (!easeScrollDesktop.matches) {
          easeScrollCards.forEach(card => {
            card.style.opacity = '';
            card.style.transform = '';
            card.classList.remove('is-scroll-visible');
          });
          if (easeConnectorLine) easeConnectorLine.style.strokeDashoffset = '';
          easeConnectorNodes.forEach(node => {
            node.style.opacity = '';
            node.style.transform = '';
          });
          return;
        }
        const rect = easeScrollSequence.getBoundingClientRect();
        const scrollRange = Math.max(1, easeScrollSequence.offsetHeight - window.innerHeight);
        const progress = Math.max(0, Math.min(1, -rect.top / scrollRange));
        easeScrollSequence.style.setProperty('--ease-scroll-progress', progress.toFixed(3));
        const cardPhases = [];
        easeScrollCards.forEach((card, index) => {
          const phase = Math.max(0, Math.min(1, (progress - index * .29) / .24));
          cardPhases.push(phase);
          const lift = (1 - phase) * 46;
          const scale = .93 + phase * .07;
          card.style.opacity = phase.toFixed(3);
          card.style.transform = `translateY(${lift.toFixed(1)}px) scale(${scale.toFixed(3)})`;
          card.classList.toggle('is-scroll-visible', phase >= .98);
        });
        if (easeConnectorLine && easeConnectorNodeOffsets.length) {
          let connectorProgress = easeConnectorNodeOffsets[0] || 0;
          for (let index = 1; index < easeConnectorNodeOffsets.length; index += 1) {
            const phase = cardPhases[index] || 0;
            if (phase <= 0) break;
            const start = easeConnectorNodeOffsets[index - 1] || 0;
            const end = easeConnectorNodeOffsets[index] || start;
            connectorProgress = Math.max(connectorProgress, start + ((end - start) * phase));
          }
          easeConnectorLine.style.strokeDashoffset = (1 - connectorProgress).toFixed(3);
        }
        easeConnectorNodes.forEach((node, index) => {
          const phase = cardPhases[index] || 0;
          const isCardComplete = phase >= 1;
          node.style.opacity = isCardComplete ? '1' : '0';
          node.style.transform = `scale(${isCardComplete ? '1' : '.45'})`;
        });
      };
      if (easeScrollSequence && reducedMotion.matches) easeScrollSequence.classList.add('is-scroll-static');
      const revealThreshold = .08;
      if ('IntersectionObserver' in window && !reducedMotion.matches) {
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            const shouldReveal = entry.isIntersecting && entry.intersectionRatio >= revealThreshold;
            entry.target.classList.toggle('is-visible', shouldReveal);
            resetDemoSequence(entry.target);
          });
        }, { threshold: [0, revealThreshold], rootMargin: '0px 0px -8% 0px' });
        reveals.forEach(el => observer.observe(el));
      } else {
        reveals.forEach(el => el.classList.add('is-visible'));
      }

      if (!reducedMotion.matches) {
        const updateRevealStates = () => {
          const rootBottom = window.innerHeight * .92;
          reveals.forEach(element => {
            const rect = element.getBoundingClientRect();
            const visibleTop = Math.max(rect.top, 0);
            const visibleBottom = Math.min(rect.bottom, rootBottom);
            const visibleHeight = Math.max(0, visibleBottom - visibleTop);
            const visibleRatio = rect.height > 0 ? visibleHeight / rect.height : 0;
            element.classList.toggle('is-visible', visibleRatio >= revealThreshold);
            resetDemoSequence(element);
          });
        };
        let scrollFrame = 0;
        const updateScrollProgress = () => {
          const scrollable = document.documentElement.scrollHeight - window.innerHeight;
          const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
          document.documentElement.style.setProperty('--scroll-progress', `${Math.min(100, Math.max(0, progress))}%`);
          updateRevealStates();
          updateEaseScrollSequence();
          scrollFrame = 0;
        };
        const requestScrollProgress = () => {
          if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollProgress);
        };
        window.addEventListener('scroll', requestScrollProgress, { passive: true });
        window.addEventListener('resize', requestScrollProgress);
        requestScrollProgress();
      }

      const video = document.getElementById('product-video');
      const steps = [...document.querySelectorAll('.demo-step')];
      steps.forEach(step => {
        const script = step.closest('.demo-script');
        step.addEventListener('transitionend', event => {
          if (event.target === step && event.propertyName === 'transform' && script?.classList.contains('is-visible') && getComputedStyle(step).opacity === '1') {
            step.classList.add('is-intro-complete');
          }
        });
      });
      const syncSteps = () => {
        const duration = video.duration || 9;
        const stage = Math.min(2, Math.floor((video.currentTime / duration) * 3));
        steps.forEach((step, index) => step.classList.toggle('is-active', index === stage));
      };
      video.addEventListener('timeupdate', syncSteps);
      video.addEventListener('loadedmetadata', syncSteps);
      video.play().catch(() => {});
      const demoLive = document.querySelector('.demo-live');
      const demoPanel = document.getElementById('demo-video-panel');
      const demoClose = document.querySelector('.demo-video-close');
      const closeDemo = () => {
        demoPanel.hidden = true;
        demoLive.setAttribute('aria-expanded', 'false');
        demoLive.focus();
      };
      demoLive.addEventListener('click', () => {
        demoPanel.hidden = false;
        demoLive.setAttribute('aria-expanded', 'true');
        video.currentTime = 0;
        video.play().catch(() => {});
        demoClose.focus();
      });
      demoClose.addEventListener('click', closeDemo);
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !demoPanel.hidden) closeDemo();
      });
    })();
