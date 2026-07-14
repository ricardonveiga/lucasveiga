(function(){
  const overlay = document.getElementById('galleryLightbox');
  if (!overlay) return;

  const trackEl = document.getElementById('galleryLightboxTrack');
  const titleEl = document.getElementById('galleryLightboxTitle');
  const counterEl = document.getElementById('galleryLightboxCounter');
  const btnClose = document.getElementById('galleryLightboxClose');
  const btnPrev = document.getElementById('galleryLightboxPrev');
  const btnNext = document.getElementById('galleryLightboxNext');

  let itens = [];
  let indiceAtual = 0;

  function itemVisivel(el){
    return el.style.display !== 'none';
  }

  function renderizarItemAtual(){
    trackEl.innerHTML = '';
    if (itens.length === 0) return;
    trackEl.appendChild(itens[indiceAtual].cloneNode(true));
    counterEl.textContent = `${indiceAtual + 1} / ${itens.length}`;
  }

  function abrirGaleria(idSecao, titulo){
    const secao = document.getElementById(idSecao);
    if (!secao) return;

    const cards = secao.querySelectorAll('.marquee-track > *');
    itens = Array.from(cards).filter(itemVisivel);

    if (itens.length === 0) {
      alert('Não há itens disponíveis para o seu perfil nesta seção.');
      return;
    }

    titleEl.textContent = titulo;
    indiceAtual = 0;
    renderizarItemAtual();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function fecharGaleria(){
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.btn-misturar[data-gallery-target]').forEach(botao => {
    botao.addEventListener('click', (e) => {
      e.preventDefault();
      abrirGaleria(
        botao.getAttribute('data-gallery-target'),
        botao.getAttribute('data-gallery-title')
      );
    });
  });

  btnClose.addEventListener('click', fecharGaleria);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fecharGaleria(); });

  btnPrev.addEventListener('click', () => {
    if (itens.length === 0) return;
    indiceAtual = (indiceAtual - 1 + itens.length) % itens.length;
    renderizarItemAtual();
  });

  btnNext.addEventListener('click', () => {
    if (itens.length === 0) return;
    indiceAtual = (indiceAtual + 1) % itens.length;
    renderizarItemAtual();
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;
    if (e.key === 'Escape') fecharGaleria();
    if (e.key === 'ArrowLeft') btnPrev.click();
    if (e.key === 'ArrowRight') btnNext.click();
  });
})();