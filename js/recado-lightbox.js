(function(){
  const overlay = document.getElementById('recadoLightbox');
  if (!overlay) return;

  const previewEl = document.getElementById('recadoLightboxPreview');
  const autorEl = document.getElementById('recadoLightboxAutor');
  const btnClose = document.getElementById('recadoLightboxClose');
  const inner = overlay.querySelector('.photo-lightbox-inner');

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

  function extrairDados(card){
    const id = card.getAttribute('data-recado-id') || card.dataset.reactionId;
    const autor = card.getAttribute('data-autor') || card.querySelector('.recado-autor')?.textContent || 'Anônimo';
    const imagem = card.getAttribute('data-imagem') || '';
    let texto = card.getAttribute('data-texto');
    if (texto == null) {
      const p = card.querySelector('p');
      texto = p ? p.textContent.replace(/^"|"$/g, '') : '';
    }
    const privado = card.getAttribute('data-visibility') === 'privado';
    return { id, autor, imagem, texto, privado };
  }

  function abrir(dados){
    previewEl.innerHTML = '';
    if (dados.imagem) {
      previewEl.style.backgroundImage = `url('${dados.imagem}')`;
      previewEl.style.backgroundSize = 'contain';
      previewEl.style.backgroundRepeat = 'no-repeat';
      previewEl.style.backgroundPosition = 'center';
      previewEl.style.backgroundColor = '#000';
    } else {
      previewEl.style.backgroundImage = 'none';
      previewEl.style.backgroundColor = '';
      const p = document.createElement('p');
      p.textContent = dados.texto ? `"${dados.texto}"` : '';
      previewEl.appendChild(p);
    }

    autorEl.textContent = `— ${dados.autor}`;

    if (window.ReactionsAPI && dados.id) {
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
    const card = e.target.closest('.recado-card');
    if (!card) return;
    if (e.target.closest('#recadoLightbox')) return;
    abrir(extrairDados(card));
  });

  btnClose.addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  document.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('active') && e.key === 'Escape') fechar();
  });
})();