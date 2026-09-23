(function () {
  var removed = false;
  function removePreloader() {
    if (removed) return;
    removed = true;
    var el = document.getElementById('preloader');
    if (!el) return;
    el.style.transition = 'opacity 0.3s ease';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 300);
  }
  // React mount dismisses it first; this is the safety net
  window.addEventListener('load', function () {
    setTimeout(removePreloader, 300);
  });
  // Max 4s: never let hanging fonts/CDN trap the user on the preloader
  setTimeout(removePreloader, 4000);
})();
