(function(){
  const overlay = document.getElementById('videoLightbox');
  if (!overlay) return;

  const inner = overlay.querySelector('.photo-lightbox-inner');
  const previewEl = document.getElementById('videoLightboxPreview');
  const captionEl = document.getElementById('videoLightboxCaption');
  const yearEl = document.getElementById('videoLightboxYear');
  const btnClose = document.getElementById('videoLightboxClose');

  let reactionsContainer = overlay.querySelector('.lightbox-reactions-container');
  if (!reactionsContainer) {
    reactionsContainer = document.createElement('div');
    reactionsContainer.className = 'lightbox-reactions-container';
    inner.appendChild(reactionsContainer);
  }
  let commentsContainer = overlay.querySelector('.lightbox-comments-container');
  if (!commentsContainer) {
    commentsContainer = document.createElement('div');
    commentsContainer.className = 'lightbox-comments-container';
    inner.appendChild(commentsContainer);
  }

  function abrir(dados){
    captionEl.textContent = dados.caption || 'Sem descrição';
    yearEl.textContent = dados.year || 'Sem data';

    if (dados.videoUrl) {
      previewEl.innerHTML = '';
      const videoEl = document.createElement('video');
      videoEl.src = dados.videoUrl;
      videoEl.controls = true;
      videoEl.autoplay = true;
      videoEl.playsInline = true;
      videoEl.style.width = '100%';
      videoEl.style.maxHeight = '70vh';
      videoEl.style.borderRadius = '10px';
      previewEl.appendChild(videoEl);
    } else {
      // Cards de demonstração sem arquivo real por trás (ex: galerias de
      // exemplo) continuam mostrando só o ícone, sem tentar tocar nada.
      previewEl.innerHTML = `
        <div class="video-lightbox-play">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      `;
    }

    if (window.ReactionsAPI) {
      ReactionsAPI.buildInteractiveBar(dados.id, reactionsContainer, dados.visibilidade, dados.autorId);
      ReactionsAPI.buildCommentsPanel(dados.id, commentsContainer, dados.visibilidade, dados.autorId);
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function fechar(){
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    const videoTocando = previewEl.querySelector('video');
    if (videoTocando) videoTocando.pause();
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.video-card');
    if (!card) return;
    if (e.target.closest('#galleryLightbox') || e.target.closest('#photoLightbox') || e.target.closest('#videoLightbox')) return;

    const captionElCard = card.querySelector('.media-caption');
    let caption = '';
    let year = '';

    if (captionElCard) {
      const em = captionElCard.querySelector('em');
      caption = captionElCard.childNodes[0] ? captionElCard.childNodes[0].textContent.trim() : '';
      year = em ? em.textContent.trim() : '';
    }

    const mediaId = card.dataset.reactionId
      || card.dataset.mediaId
      || card.dataset.videoId
      || (window.ReactionsAPI ? ReactionsAPI.getMediaId(card) : 'video-' + caption);

    abrir({
      id: mediaId,
      caption,
      year,
      videoUrl: card.dataset.videoUrl || '',
      visibilidade: card.getAttribute('data-visibility'),
      autorId: card.getAttribute('data-autor-id') || ''
    });
  });

  btnClose.addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  document.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('active') && e.key === 'Escape') fechar();
  });
})();