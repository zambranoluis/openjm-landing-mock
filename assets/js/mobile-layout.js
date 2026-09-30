/* v4.23: reversible mobile-only progressive enhancements. */
(() => {
  'use strict';
  const mobile = window.matchMedia('(max-width: 720px)');
  let dispose = null;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function activate() {
    const controller = new AbortController();
    const cleanups = [];
    const listen = (node, event, handler) => node.addEventListener(event, handler, { signal: controller.signal });
    function preserve(node, names) {
      const attrs = names.map(name => [name, node.getAttribute(name)]);
      cleanups.push(() => attrs.forEach(([name, value]) => {
        if (value === null) node.removeAttribute(name);
        else node.setAttribute(name, value);
      }));
    }

    function tabs(container, selector, prefix, label, titles) {
      if (!container) return;
      const panels = Array.from(container.querySelectorAll(selector));
      if (panels.length < 2) return;
      const list = element('div', 'mobile-tablist');
      list.setAttribute('role', 'tablist');
      list.setAttribute('aria-label', label);
      container.classList.add('mobile-tabs-active');
      const buttons = panels.map((panel, index) => {
        preserve(panel, ['id', 'role', 'aria-labelledby', 'tabindex', 'hidden']);
        panel.id ||= `${prefix}-panel-${index}`;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('tabindex', '0');
        const button = element('button', 'mobile-tab');
        button.type = 'button';
        button.id = `${prefix}-tab-${index}`;
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-controls', panel.id);
        panel.setAttribute('aria-labelledby', button.id);
        button.append(element('span', 'mobile-tab-title', titles ? titles[index] : panel.querySelector('h3').textContent));
        if (!titles) {
          const price = panel.querySelector('.plan-price');
          button.append(element('span', 'mobile-tab-price', price ? `${price.querySelector('strong').textContent} / month` : 'Extra credits'));
        }
        list.append(button);
        return button;
      });
      function select(index, focus = false) {
        panels.forEach((panel, i) => {
          panel.hidden = i !== index;
          buttons[i].setAttribute('aria-selected', String(i === index));
          buttons[i].tabIndex = i === index ? 0 : -1;
        });
        if (focus) buttons[index].focus();
      }
      buttons.forEach((button, index) => {
        listen(button, 'click', () => select(index));
        listen(button, 'keydown', event => {
          const keys = { ArrowRight: (index + 1) % buttons.length, ArrowLeft: (index - 1 + buttons.length) % buttons.length, Home: 0, End: buttons.length - 1 };
          if (!(event.key in keys)) return;
          event.preventDefault();
          select(keys[event.key], true);
        });
      });
      if (titles) container.insertBefore(list, panels[0]);
      else container.before(list);
      select(0);
      cleanups.push(() => {
        if (list.contains(document.activeElement)) {
          const index = buttons.findIndex(button => button.getAttribute('aria-selected') === 'true');
          const heading = panels[index].querySelector('h3');
          const old = heading.getAttribute('tabindex');
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
          if (old === null) heading.removeAttribute('tabindex');
          else heading.setAttribute('tabindex', old);
        }
        list.remove();
        container.classList.remove('mobile-tabs-active');
      });
    }

    function benefitIndex() {
      const container = document.querySelector('.benefits-stage');
      if (!container) return;
      const panels = Array.from(container.querySelectorAll('.benefit-panel'));
      if (!panels.length) return;
      const index = element('ol', 'mobile-benefit-index');
      index.setAttribute('aria-label', 'OpenJM benefits');
      container.classList.add('mobile-benefit-index-active');
      panels.forEach((panel, position) => {
        preserve(panel, ['hidden']);
        panel.hidden = true;
        const item = element('li', 'mobile-benefit-item');
        item.append(element('span', 'mobile-benefit-title', panel.querySelector('h3').textContent));
        index.append(item);
      });
      container.insertBefore(index, panels[0]);
      cleanups.push(() => {
        index.remove();
        container.classList.remove('mobile-benefit-index-active');
      });
    }

    function carousel() {
      const track = document.querySelector('.case-grid');
      if (!track) return;
      const slides = Array.from(track.querySelectorAll('.case-card'));
      if (slides.length < 2) return;
      preserve(track, ['id', 'role', 'aria-label', 'aria-roledescription', 'tabindex']);
      track.id ||= 'mobile-use-cases';
      track.setAttribute('role', 'region');
      track.setAttribute('aria-roledescription', 'carousel');
      track.setAttribute('aria-label', 'Use cases');
      track.setAttribute('tabindex', '0');
      slides.forEach((slide, index) => {
        preserve(slide, ['role', 'aria-label', 'aria-roledescription']);
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-label', `${index + 1} of ${slides.length}: ${slide.querySelector('h3').textContent}`);
      });
      let current = 0;
      let timer;
      function go(index, behavior = 'smooth') {
        index = Math.max(0, Math.min(slides.length - 1, index));
        const left = track.scrollLeft + slides[index].getBoundingClientRect().left - track.getBoundingClientRect().left;
        current = index;
        track.scrollTo({ left, behavior });
      }
      listen(track, 'keydown', event => {
        if (event.target !== track) return;
        const keys = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: slides.length - 1 };
        if (!(event.key in keys)) return;
        event.preventDefault();
        go(keys[event.key]);
      });
      listen(track, 'scroll', () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          const left = track.getBoundingClientRect().left;
          const distances = slides.map(slide => Math.abs(slide.getBoundingClientRect().left - left));
          current = distances.indexOf(Math.min(...distances));
        }, 140);
      });
      const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => go(current, 'auto')) : null;
      observer?.observe(track);
      cleanups.push(() => {
        observer?.disconnect();
        window.clearTimeout(timer);
        track.scrollTo({ left: 0, behavior: 'auto' });
      });
    }

    carousel();
    benefitIndex();
    return () => {
      controller.abort();
      cleanups.reverse().forEach(cleanup => cleanup());
    };
  }

  function refresh() {
    if (mobile.matches && !dispose) dispose = activate();
    else if (!mobile.matches && dispose) {
      dispose();
      dispose = null;
    }
  }
  mobile.addEventListener('change', refresh);
  refresh();
})();
