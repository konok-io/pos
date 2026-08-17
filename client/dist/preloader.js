window.addEventListener('load', function() {
  setTimeout(function() {
    var preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      preloader.style.transition = 'opacity 0.3s ease';
      setTimeout(function() { preloader.remove(); }, 300);
    }
  }, 300);
});
