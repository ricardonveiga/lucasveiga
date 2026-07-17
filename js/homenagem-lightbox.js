(function(){
  const lightbox = document.getElementById('homenagemLightbox');
  if (!lightbox) return;

  const preview = document.getElementById('homenagemLightboxPreview');
  const textoEl = document.getElementById('homenagemLightboxTexto');
  const autorEl = document.getElementById('homenagemLightboxAutor');
  const btnFechar = document.getElementById('homenagemLightboxClose');

  function abrir(card){
    const imagem = card.getAttribute('data-imagem');
    const video = card.getAttribute('data-video');
    const texto = card.getAttribute('data-texto');
    const autor = card.getAttribute('data-autor');
    const data = card.getAttribute('data-data');

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
    autorEl.textContent = `— ${autor || 'Anônimo'}${data ? ', ' + data : ''}`;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function fechar(){
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    preview.innerHTML = '';
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-homenagem-id]');
    if (card) abrir(card);
  });

  if (btnFechar) btnFechar.addEventListener('click', fechar);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) fechar();
  });
})();
