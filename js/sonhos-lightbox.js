(function(){
  const lightbox = document.getElementById('sonhoLightbox');
  if (!lightbox) return;

  const preview = document.getElementById('sonhoLightboxPreview');
  const textoEl = document.getElementById('sonhoLightboxTexto');
  const autorEl = document.getElementById('sonhoLightboxAutor');
  const btnFechar = document.getElementById('sonhoLightboxClose');

  function abrir(card){
    const imagem = card.getAttribute('data-imagem');
    const video = card.getAttribute('data-video');
    const texto = card.getAttribute('data-texto');
    const autor = card.getAttribute('data-autor');

    preview.innerHTML = '';

    if (imagem) {
      const img = document.createElement('img');
      img.src = imagem;
      img.style.maxWidth = '100%';
      img.style.borderRadius = '10px';
      preview.appendChild(img);
    } else if (video) {
      const videoEl = document.createElement('video');
      videoEl.src = video;
      videoEl.controls = true;
      videoEl.style.maxWidth = '100%';
      videoEl.style.borderRadius = '10px';
      preview.appendChild(videoEl);
    }

    textoEl.textContent = texto ? `"${texto}"` : '';
    textoEl.style.display = texto ? 'block' : 'none';
    autorEl.textContent = autor || 'Anônimo';

    const itemId = card.getAttribute('data-sonho-id');
    const visibilidade = card.getAttribute('data-visibility') || 'todos';
    const autorId = card.getAttribute('data-autor-id') || '';
    const reacoesEl = document.getElementById('sonhoLightboxReacoes');
    const comentariosEl = document.getElementById('sonhoLightboxComentarios');
    if (window.ReactionsAPI && itemId && reacoesEl && comentariosEl) {
      ReactionsAPI.buildInteractiveBar(itemId, reacoesEl, visibilidade, autorId);
      ReactionsAPI.buildCommentsPanel(itemId, comentariosEl, visibilidade, autorId);
    }

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function fechar(){
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    preview.innerHTML = '';
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-sonho-id]');
    if (card) abrir(card);
  });

  if (btnFechar) btnFechar.addEventListener('click', fechar);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) fechar();
  });
})();