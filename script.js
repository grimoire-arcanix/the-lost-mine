// Reading is never dependent on an observer, animation, or script success.
// Navigation and all narrative content are ordinary HTML.
(() => {
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const links = [...document.querySelectorAll('.chapter-nav-links a')];
  if (!chapters.length) return;
  // A passive scroll listener tracks the current chapter without hiding content
  // or interfering with fragment navigation and browser history.
  let pending = false;
  function update() {
    pending = false;
    let current = null;
    for (const chapter of chapters) {
      if (chapter.getBoundingClientRect().top <= 120) current = chapter.id;
    }
    links.forEach(link => {
      if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }, {passive:true});
  window.addEventListener('hashchange', update);
  window.addEventListener('pageshow', update);
  update();
})();
