(() => {
  const dialog = document.getElementById('lightbox');
  // Ordinary image links remain useful when native modal support is unavailable.
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const links = [...document.querySelectorAll('#album a')];
  if (!links.length) return;
  const close = document.getElementById('lightbox-close');
  const previous = document.getElementById('lightbox-prev');
  const next = document.getElementById('lightbox-next');
  const stage = dialog.querySelector('.viewer-stage');
  const caption = document.getElementById('viewer-caption');
  const status = document.getElementById('viewer-status');
  const count = document.getElementById('viewer-count');
  const original = document.getElementById('viewer-original');
  let index = 0;
  let invoker;
  let revision = 0;
  let scrollY = 0;
  function showImage(value) {
    index = (value + links.length) % links.length;
    const link = links[index];
    const token = ++revision;
    const image = new Image();
    image.id = 'lightbox-image';
    image.alt = link.querySelector('img').alt;
    image.hidden = true;
    stage.replaceChildren(image);
    stage.setAttribute('aria-busy', 'true');
    status.textContent = 'Loading photograph…';
    caption.textContent = link.dataset.caption;
    count.textContent = `${index + 1} / ${links.length}`;
    original.href = link.dataset.original;
    image.onload = () => {
      if (token !== revision) return;
      image.hidden = false;
      stage.setAttribute('aria-busy', 'false');
      status.textContent = 'Use the arrow keys to browse. Escape closes the viewer.';
    };
    image.onerror = () => {
      if (token !== revision) return;
      stage.setAttribute('aria-busy', 'false');
      status.textContent = 'This photograph could not be loaded. Try another, or open the original photograph.';
    };
    // Fetch only the selected viewer image, never the entire archive.
    image.src = link.href;
  }
  links.forEach((link, i) => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      // If opening fails, let the browser follow the ordinary photograph link.
      try { dialog.showModal(); } catch { return; }
      event.preventDefault();
      invoker = link;
      scrollY = window.scrollY;
      document.body.classList.add('viewer-open');
      showImage(i);
      close.focus({preventScroll:true});
    });
  });
  close.addEventListener('click', () => dialog.close());
  previous.addEventListener('click', () => showImage(index - 1));
  next.addEventListener('click', () => showImage(index + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(index - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showImage(index + 1); }
    if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('button:not(:disabled), a[href]')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  dialog.addEventListener('close', () => {
    revision++;
    document.body.classList.remove('viewer-open');
    stage.replaceChildren();
    invoker?.focus({preventScroll:true});
    window.scrollTo({top:scrollY,behavior:'instant'});
  });
})();
