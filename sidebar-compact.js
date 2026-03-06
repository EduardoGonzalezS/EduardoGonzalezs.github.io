(function () {
  var COMPACT_MIN = 992;
  var COMPACT_MAX = 1500;
  var DELAY = 3000;
  var timer = null;

  function inRange() {
    return window.innerWidth >= COMPACT_MIN && window.innerWidth <= COMPACT_MAX;
  }

  function compact() {
    if (inRange()) document.body.classList.add('sidebar-compact');
  }

  function expand() {
    document.body.classList.remove('sidebar-compact');
  }

  function resetTimer() {
    clearTimeout(timer);
    if (inRange()) timer = setTimeout(compact, DELAY);
    else expand();
  }

  function init() {
    var sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    if (inRange()) resetTimer();

    sidebar.addEventListener('mouseenter', function () {
      clearTimeout(timer);
      expand();
    });

    sidebar.addEventListener('mouseleave', function () {
      resetTimer();
    });

    window.addEventListener('resize', resetTimer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
