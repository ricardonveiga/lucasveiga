(function(){
  const overlay = document.getElementById('conversaLightbox');
  if (!overlay) return;

  const previewEl = document.getElementById('conversaLightboxPreview');
  const autorEl = document.getElementById('conversaLightboxAutor');
  const btnClose = document.getElementById('conversaLightboxClose');
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
    return {
      id: card.getAttribute('data-conversa-id') || card.dataset.reactionId,
      autor: card.getAttribute('data-autor-nome') || 'Anônimo',
      autorId: card.getAttribute('data-autor-id') || '',
      visibilidade: card.getAttribute('data-visibility') || 'todos',
      tipo: card.getAttribute('data-tipo') || '',
      texto: card.getAttribute('data-texto') || '',
      arquivo: card.getAttribute('data-arquivo') || ''
    };
  }

  function abrir(dados){
    previewEl.innerHTML = '';
    previewEl.style.backgroundImage = 'none';
    previewEl.style.backgroundColor = '';

    if (dados.tipo === 'audio') {
      if (dados.arquivo) {
        const audioEl = document.createElement('audio');
        audioEl.controls = true;
        audioEl.autoplay = true;
        audioEl.src = dados.arquivo;
        audioEl.style.width = '100%';
        previewEl.style.padding = '2rem 0.5rem';
        previewEl.appendChild(audioEl);
      }
    } else if (dados.arquivo) {
      previewEl.style.backgroundImage = `url('${dados.arquivo}')`;
      previewEl.style.backgroundSize = 'contain';
      previewEl.style.backgroundRepeat = 'no-repeat';
      previewEl.style.backgroundPosition = 'center';
      previewEl.style.backgroundColor = '#000';
    }

    if (dados.texto) {
      const p = document.createElement('p');
      p.className = 'photo-lightbox-caption';
      p.textContent = `"${dados.texto}"`;
      previewEl.parentElement.insertBefore(p, autorEl);
      p.dataset.temp = '1';
    }

    autorEl.textContent = `— ${dados.autor}`;

    if (window.ReactionsAPI && dados.id) {
      ReactionsAPI.buildInteractiveBar(dados.id, reactionsContainer, dados.visibilidade, dados.autorId);
      ReactionsAPI.buildCommentsPanel(dados.id, commentsContainer, dados.visibilidade, dados.autorId);
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function fechar(){
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    // Limpa a legenda temporária de texto (recriada a cada abertura)
    inner.querySelectorAll('[data-temp="1"]').forEach(el => el.remove());
    previewEl.innerHTML = '';
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('audio')) return;
    const card = e.target.closest('[data-conversa-id]');
    if (!card) return;
    if (e.target.closest('#conversaLightbox')) return;
    abrir(extrairDados(card));
  });

  btnClose.addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  document.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('active') && e.key === 'Escape') fechar();
  });
})();
