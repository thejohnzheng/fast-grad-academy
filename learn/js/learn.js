(function(){
  var buttons = document.querySelectorAll('[data-filter]');
  var cards = document.querySelectorAll('[data-category]');
  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      var filter = btn.getAttribute('data-filter');
      buttons.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      cards.forEach(function(card){
        var cats = card.getAttribute('data-category') || '';
        card.style.display = filter === 'all' || cats.indexOf(filter) !== -1 ? '' : 'none';
      });
    });
  });

  document.querySelectorAll('[data-copy-link]').forEach(function(btn){
    btn.addEventListener('click', function(){
      navigator.clipboard.writeText(window.location.href).then(function(){
        var original = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function(){ btn.textContent = original; }, 1600);
      });
    });
  });
})();
