(function(){
  const overlay = document.getElementById('storyViewer');
  if (!overlay) return;

  const track = document.getElementById('storyViewerTrack');
  const btnClose = document.getElementById('storyViewerClose');
  const botoesAbrir = document.querySelectorAll('[data-story-target]');

  let animId = null;
  const velocidadeAuto = 0.5; // mais devagar
  let arrastando = false;
  let ultimoY = 0;
  let pausadoTemporariamente = false;
  let timeoutRetomar = null;

  function popularSequencia(idSecao){
    const secao = document.getElementById(idSecao);
    track.innerHTML = '';
    if (!secao) return;

    let ordemSalva = null;
    try { ordemSalva = JSON.parse(localStorage.getItem('ordemConversa_padrao')); } catch(e){}

    let itens = Array.from(secao.querySelectorAll('.marquee-track > *, .reorder-item, .full-grid > *'));

    if (ordemSalva && ordemSalva.length) {
      itens.sort((a, b) => {
        const idA = a.dataset.itemId || a.dataset.mediaId || '';
        const idB = b.dataset.itemId || b.dataset.mediaId || '';
        const posA = ordemSalva.indexOf(idA);
        const posB = ordemSalva.indexOf(idB);
        if (posA === -1 && posB === -1) return 0;
        if (posA === -1) return 1;
        if (posB === -1) return -1;
        return posA - posB;
      });
    }

    itens.forEach(item => {
      const clone = item.cloneNode(true);
      const badgeVelho = clone.querySelector('.reaction-summary');
      if (badgeVelho) badgeVelho.remove();
      track.appendChild(clone);
    });
  }

  function loop(){
    if (!arrastando && !pausadoTemporariamente) {
      track.scrollTop += velocidadeAuto;
      if (track.scrollTop + track.clientHeight >= track.scrollHeight - 2) {
        track.scrollTop = 0;
      }
    }
    animId = requestAnimationFrame(loop);
  }

  function abrir(idSecao){
    popularSequencia(idSecao);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    track.scrollTop = 0;
    pausadoTemporariamente = false;
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function fechar(){
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    cancelAnimationFrame(animId);
  }

  botoesAbrir.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      abrir(btn.getAttribute('data-story-target'));
    });
  });

  btnClose.addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  document.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('active') && e.key === 'Escape') fechar();
  });

  function iniciarArraste(y){
    arrastando = true;
    ultimoY = y;
    clearTimeout(timeoutRetomar);
  }
  function moverArraste(y){
    if (!arrastando) return;
    const delta = ultimoY - y;
    track.scrollTop += delta;
    ultimoY = y;
  }
  function finalizarArraste(){
    if (!arrastando) return;
    arrastando = false;
    pausadoTemporariamente = true;
    clearTimeout(timeoutRetomar);
    timeoutRetomar = setTimeout(() => { pausadoTemporariamente = false; }, 900);
  }

  track.addEventListener('mousedown', (e) => iniciarArraste(e.clientY));
  window.addEventListener('mousemove', (e) => moverArraste(e.clientY));
  window.addEventListener('mouseup', finalizarArraste);

  track.addEventListener('touchstart', (e) => iniciarArraste(e.touches[0].clientY), { passive: true });
  track.addEventListener('touchmove', (e) => moverArraste(e.touches[0].clientY), { passive: true });
  track.addEventListener('touchend', finalizarArraste);

  track.addEventListener('wheel', () => {
    pausadoTemporariamente = true;
    clearTimeout(timeoutRetomar);
    timeoutRetomar = setTimeout(() => { pausadoTemporariamente = false; }, 900);
  });
})();