(function(){
  const overlay = document.getElementById('photoLightbox');
  if (!overlay) return;

  const inner = overlay.querySelector('.photo-lightbox-inner');
  const previewEl = document.getElementById('photoLightboxPreview');
  const eventoEl = document.getElementById('photoLightboxEvento');
  const captionEl = document.getElementById('photoLightboxCaption');
  const yearEl = document.getElementById('photoLightboxYear');
  const btnClose = document.getElementById('photoLightboxClose');
  const btnFavoritar = document.getElementById('photoLightboxFavoritar');

  const painelEscolha = document.getElementById('photoLightboxEscolha');
  const listaEscolha = document.getElementById('photoLightboxListaEscolha');
  const btnCancelarEscolha = document.getElementById('photoLightboxCancelarEscolha');

  let reactionsContainer = overlay.querySelector('.lightbox-reactions-container');
  if (!reactionsContainer) {
    reactionsContainer = document.createElement('div');
    reactionsContainer.className = 'lightbox-reactions-container';
    inner.insertBefore(reactionsContainer, painelEscolha);
  }
  let commentsContainer = overlay.querySelector('.lightbox-comments-container');
  if (!commentsContainer) {
    commentsContainer = document.createElement('div');
    commentsContainer.className = 'lightbox-comments-container';
    inner.appendChild(commentsContainer);
  }

  let fotoAtual = null;

  function atualizarBotaoFavoritar(){
    if (ehFavorita(fotoAtual.id)) {
      btnFavoritar.textContent = '★ Favoritada — clique para remover';
      btnFavoritar.classList.add('is-favorita');
    } else {
      btnFavoritar.textContent = '☆ Marcar como favorita';
      btnFavoritar.classList.remove('is-favorita');
    }
  }

  function abrir(dados){
    fotoAtual = dados;
    if (eventoEl) eventoEl.textContent = dados.evento || '';
    captionEl.textContent = dados.descricao || 'Sem descrição';
    yearEl.textContent = dados.year || 'Sem data';
    previewEl.style.backgroundImage = dados.bgUrl ? `url('${dados.bgUrl}')` : 'none';
    painelEscolha.style.display = 'none';
    atualizarBotaoFavoritar();

    if (window.ReactionsAPI) {
      ReactionsAPI.buildInteractiveBar(dados.id, reactionsContainer, dados.privado);
      ReactionsAPI.buildCommentsPanel(dados.id, commentsContainer, dados.privado);
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function fechar(){
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.photo-card[data-photo-id]');
    if (!card) return;
    if (e.target.closest('#galleryLightbox') || e.target.closest('#photoLightbox') || e.target.closest('#videoLightbox')) return;

    // IMPORTANTE: o ID REAL da foto (data-photo-id) tem prioridade sobre
    // o ID auxiliar usado pelas reações (dataset.reactionId). Isso garante
    // que "favoritar" e a estrelinha do card sempre usem exatamente o
    // mesmo identificador, sem depender de qual script rodou primeiro.
    abrir({
      id: card.getAttribute('data-photo-id') || card.dataset.reactionId,
      descricao: card.getAttribute('data-descricao') || card.getAttribute('data-caption'),
      evento: card.getAttribute('data-evento'),
      year: card.getAttribute('data-year-label'),
      bgUrl: card.dataset.bgUrl || '',
      privado: card.getAttribute('data-visibility') === 'privado'
    });
  });

  btnClose.addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  document.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('active') && e.key === 'Escape') fechar();
  });

  btnFavoritar.addEventListener('click', async () => {
    const resultado = alternarFavorita({
      id: fotoAtual.id,
      caption: fotoAtual.descricao,
      evento: fotoAtual.evento,
      year: fotoAtual.year,
      url: fotoAtual.bgUrl
    });

    if (resultado === 'cheia') {
      mostrarEscolhaDeSubstituicao();
      return;
    }

    atualizarBotaoFavoritar();
    if (typeof marcarCardsFavoritos === 'function') marcarCardsFavoritos();
    if (typeof atualizarBannerRotativo === 'function') await atualizarBannerRotativo();
  });

  function mostrarEscolhaDeSubstituicao(){
    const favoritas = obterFavoritas();
    listaEscolha.innerHTML = '';

    favoritas.forEach(fav => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'escolha-substituir-item';
      item.textContent = `Substituir: ${fav.evento || fav.caption || 'Foto sem evento'} (${fav.year || 'sem data'})`;
      item.addEventListener('click', async () => {
        substituirFavorita(fav.id, {
          id: fotoAtual.id,
          caption: fotoAtual.descricao,
          evento: fotoAtual.evento,
          year: fotoAtual.year,
          url: fotoAtual.bgUrl
        });
        painelEscolha.style.display = 'none';
        atualizarBotaoFavoritar();
        if (typeof marcarCardsFavoritos === 'function') marcarCardsFavoritos();
        if (typeof atualizarBannerRotativo === 'function') await atualizarBannerRotativo();
      });
      listaEscolha.appendChild(item);
    });

    painelEscolha.style.display = 'block';
  }

  btnCancelarEscolha.addEventListener('click', () => {
    painelEscolha.style.display = 'none';
  });
})();