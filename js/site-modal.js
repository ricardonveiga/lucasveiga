(function(){
  function garantirModal(){
    let overlay = document.getElementById('siteModalOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'siteModalOverlay';
    overlay.className = 'site-modal-overlay';
    overlay.innerHTML = `
      <div class="site-modal-box">
        <div id="siteModalIcon" class="site-modal-icon">💬</div>
        <p id="siteModalTexto" class="site-modal-texto"></p>
        <div id="siteModalAcoes" class="site-modal-acoes"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) fecharSiteModal();
    });
    return overlay;
  }

  function fecharSiteModal(){
    const overlay = document.getElementById('siteModalOverlay');
    if (overlay) overlay.classList.remove('active');
  }

  window.avisoSite = function(mensagem, icone){
    const overlay = garantirModal();
    document.getElementById('siteModalIcon').textContent = icone || '💬';
    document.getElementById('siteModalTexto').textContent = mensagem;
    const acoes = document.getElementById('siteModalAcoes');
    acoes.innerHTML = '';
    const btnOk = document.createElement('button');
    btnOk.className = 'btn-publicar';
    btnOk.textContent = 'OK';
    btnOk.addEventListener('click', fecharSiteModal);
    acoes.appendChild(btnOk);
    overlay.classList.add('active');
  };

  window.confirmarSite = function(mensagem){
    return new Promise((resolve) => {
      const overlay = garantirModal();
      document.getElementById('siteModalIcon').textContent = '⚠️';
      document.getElementById('siteModalTexto').textContent = mensagem;
      const acoes = document.getElementById('siteModalAcoes');
      acoes.innerHTML = '';

      const btnCancelar = document.createElement('button');
      btnCancelar.className = 'btn-limpar';
      btnCancelar.textContent = 'Cancelar';
      btnCancelar.addEventListener('click', () => {
        fecharSiteModal();
        resolve(false);
      });

      const btnConfirmar = document.createElement('button');
      btnConfirmar.className = 'btn-publicar';
      btnConfirmar.textContent = 'Confirmar';
      btnConfirmar.addEventListener('click', () => {
        fecharSiteModal();
        resolve(true);
      });

      acoes.appendChild(btnCancelar);
      acoes.appendChild(btnConfirmar);
      overlay.classList.add('active');
    });
  };
})();