(() => {
  const canvas = document.querySelector('.wheel-morph');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const greenState = { top: [47, 197, 139], bottom: [13, 121, 101], moveZ: -27.59, speed: .03, morph: .25 };
  const lightState = { top: [157, 242, 207], bottom: [47, 197, 139], moveZ: -33.79, speed: .037, morph: .33 };
  const states = [greenState, lightState, greenState];
  const pointCount = 340;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const points = Array.from({ length: pointCount }, (_, index) => {
    const y = 1 - (index / (pointCount - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = goldenAngle * index;
    const x = Math.cos(angle) * ring;
    const z = Math.sin(angle) * ring;
    return { x, y, z, theta: Math.atan2(z, x), phiZ: Math.acos(y) };
  });

  const lerp = (start, end, amount) => start + (end - start) * amount;
  let size = 0;
  let elapsed = 0;
  let rotationTime = 0;
  let lastTimestamp = 0;
  let frameId = 0;
  let visible = false;

  function draw(frameStep) {
    if (!size) return;

    const phaseDuration = 4545.45;
    const phase = (elapsed % phaseDuration) / phaseDuration * states.length;
    const fromIndex = Math.floor(phase);
    const from = states[fromIndex];
    const to = states[(fromIndex + 1) % states.length];
    const blend = .5 - .5 * Math.cos((phase - fromIndex) * Math.PI);
    const speed = lerp(from.speed, to.speed, blend);
    const morphStrength = lerp(from.morph, to.morph, blend);
    const moveZ = lerp(from.moveZ, to.moveZ, blend);
    const depthScale = Math.pow(25, moveZ / 100);
    rotationTime += speed * frameStep;

    const rotX = rotationTime * -.3;
    const rotY = rotationTime * .3;
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const sphereSize = size * .8;
    const top = from.top.map((value, index) => lerp(value, to.top[index], blend));
    const bottom = from.bottom.map((value, index) => lerp(value, to.bottom[index], blend));
    const colors = Array.from({ length: 64 }, (_, index) => {
      const amount = index / 63;
      return `rgb(${top.map((value, channel) => Math.round(lerp(value, bottom[channel], amount))).join(', ')})`;
    });

    ctx.clearRect(0, 0, size, size);
    for (const point of points) {
      const morph = Math.sin(point.theta * 4 + rotationTime * 2) *
        Math.cos(point.phiZ * 3 - rotationTime) * morphStrength;
      const radius = 1 + morph;
      let x = point.x * radius;
      let y = point.y * radius;
      let z = point.z * radius;
      const turnedY = y * cosX - z * sinX;
      z = y * sinX + z * cosX;
      y = turnedY;
      const turnedX = x * cosY - z * sinY;
      z = x * sinY + z * cosY;
      x = turnedX;

      const scale = (3 / (3 + z)) * depthScale;
      const px = size / 2 + x * scale * sphereSize;
      const py = size / 2 + y * scale * sphereSize;
      ctx.fillStyle = colors[Math.round((1 - point.y) * .5 * 63)];
      ctx.beginPath();
      ctx.arc(px, py, Math.max(.5, scale * 2), 0, Math.PI * 2);
      ctx.fill();
    }
    canvas.classList.add('is-ready');
  }

  function resize() {
    const nextSize = canvas.getBoundingClientRect().width;
    if (!nextSize) return;
    size = nextSize;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * pixelRatio);
    canvas.height = Math.round(size * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    draw(0);
  }

  function animate(timestamp) {
    const delta = lastTimestamp ? Math.min(timestamp - lastTimestamp, 50) : 1000 / 60;
    lastTimestamp = timestamp;
    elapsed += delta;
    draw(delta / (1000 / 60));
    frameId = requestAnimationFrame(animate);
  }

  function sync() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    lastTimestamp = 0;
    if (visible && !document.hidden && !reducedMotion.matches) {
      frameId = requestAnimationFrame(animate);
    }
  }

  resize();
  if ('ResizeObserver' in window) {
    new ResizeObserver(resize).observe(canvas);
  } else {
    window.addEventListener('resize', resize);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    }, { rootMargin: '100px' }).observe(canvas);
  } else {
    visible = true;
    sync();
  }
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
})();
