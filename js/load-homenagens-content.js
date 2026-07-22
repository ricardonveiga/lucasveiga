(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';
  const ITENS_POR_PAGINA = 10;

  const track = document.getElementById('homenagensGrid');
  if (!track) return;

  const paginacaoEl = document.getElementById('homenagensPaginacao');
  const btnAnterior = document.getElementById('homenagensPaginaAnterior');
  const btnProxima = document.getElementById('homenagensPaginaProxima');
  const paginaTextoEl = document.getElementById('homenagensPaginaTexto');

  let todosOsItens = [];
  let paginaAtual = 0;

  function nivelAcesso(){
    const tipoAcesso = sessionStorage.getItem('tipoAcesso');
    if (tipoAcesso !== 'membro') return 'visitante';
    const grupo = sessionStorage.getItem('grupoUsuario');
    return grupo === 'familia' ? 'familia' : 'membro';
  }

  function formatarData(dataIso){
    try {
      const d = new Date(dataIso);
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return '';
    }
  }

  function criarCardHomenagem(item){
    const ehVideo = item.tipo === 'video';
    const card = document.createElement('div');
    card.className = 'media-card ' + (ehVideo ? 'video-card' : 'photo-card');
    card.setAttribute('data-homenagem-id', item.id);
    card.setAttribute('data-visibility', item.visibilidade);
    card.setAttribute('data-autor-id', item.autor_id ?? '');
    card.setAttribute('data-texto', item.texto || '');
    card.setAttribute('data-autor', item.autor_nome || 'Anônimo');
    card.setAttribute('data-data', formatarData(item.criado_em));
    card.setAttribute('data-video', ehVideo ? (item.url_arquivo || '') : '');

    if (item.url_arquivo) {
      if (!ehVideo) {
        card.style.backgroundImage = `url('${item.url_arquivo}')`;
        card.setAttribute('data-imagem', item.url_arquivo);
      } else {
        const thumb = document.createElement('div');
        thumb.style.position = 'absolute';
        thumb.style.inset = '0';
        thumb.style.display = 'flex';
        thumb.style.alignItems = 'center';
        thumb.style.justifyContent = 'center';
        thumb.style.backgroundColor = '#000';
        thumb.innerHTML = '<div class="play-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>';
        card.appendChild(thumb);
      }
    } else {
      card.style.background = 'linear-gradient(160deg, rgba(200,160,90,0.18), rgba(0,0,0,0.4))';
    }

    const caption = document.createElement('span');
    caption.className = 'media-caption';
    caption.innerHTML = `${item.autor_nome || 'Anônimo'} <em>${formatarData(item.criado_em)}</em>`;
    card.appendChild(caption);

    window.anexarBotaoExcluir(card, 'homenagens', item.id);
    return card;
  }

  async function carregarHomenagens(){
    const nivel = nivelAcesso();
    const filtro = nivel === 'visitante' ? '&visibilidade=eq.todos' : '';

    try {
      const resp = await window.supaFetch(
        `${SUPABASE_URL}/rest/v1/homenagens?status=eq.aprovado${filtro}&select=*&order=criado_em.desc&limit=500`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const dados = await resp.json();
      let itens = Array.isArray(dados) ? dados : [];

      if (nivel !== 'visitante') {
        const meuId = sessionStorage.getItem('usuarioId');
        itens = itens.filter(item => {
          if (item.visibilidade === 'privado') {
            const meuTipo = sessionStorage.getItem('tipoAcesso') === 'membro' ? 'membro' : 'visitante';
            const tipoConfere = !item.autor_tipo || item.autor_tipo === meuTipo;
            return !!meuId && tipoConfere && String(item.autor_id) === String(meuId);
          }
          // Conteúdo "família" é exclusivo de quem está no grupo família —
          // membro comum não vê (bug corrigido: antes qualquer não-visitante via tudo).
          if (item.visibilidade === 'familia') return nivel === 'familia';
          return true;
        });
      }

      todosOsItens = itens;
      paginaAtual = 0;
      renderizarPagina();
    } catch (e) {
      console.error('Erro ao carregar homenagens:', e);
    }
  }

  function renderizarPagina(){
    track.innerHTML = '';

    if (todosOsItens.length === 0) {
      track.classList.add('marquee-vazio');
      const vazio = document.createElement('p');
      vazio.className = 'hint-text';
      vazio.style.margin = '0';
      vazio.textContent = 'Nenhuma homenagem por aqui ainda.';
      track.appendChild(vazio);
      if (paginacaoEl) paginacaoEl.style.display = 'none';
      return;
    }

    // Sem controle de página na tela (widget do dashboard) = carrossel
    // contínuo, precisa duplicar os itens pro loop ficar suave.
    if (!paginacaoEl) {
      window.renderizarCarrossel(track, todosOsItens, (item) => criarCardHomenagem(item));
      if (window.ReactionsAPI) ReactionsAPI.refreshAllBadges();
      return;
    }

    // No celular, a página de Homenagens também vira carrossel rolando —
    // igual ao Mural — em vez da grade paginada.
    const carrosselMobile = window.matchMedia('(max-width: 900px)').matches;
    if (carrosselMobile) {
      track.classList.remove('full-grid');
      track.classList.add('marquee-track');
      if (track.parentElement) track.parentElement.style.overflow = 'hidden';
      paginacaoEl.style.display = 'none';
      window.renderizarCarrossel(track, todosOsItens, (item) => criarCardHomenagem(item));
      if (window.ReactionsAPI) ReactionsAPI.refreshAllBadges();
      return;
    }

    const inicio = paginaAtual * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    todosOsItens.slice(inicio, fim).forEach(item => track.appendChild(criarCardHomenagem(item)));

    if (window.ReactionsAPI) ReactionsAPI.refreshAllBadges();

    const totalPaginas = Math.ceil(todosOsItens.length / ITENS_POR_PAGINA);
    if (paginacaoEl) paginacaoEl.style.display = totalPaginas > 1 ? 'flex' : 'none';
    if (paginaTextoEl) paginaTextoEl.textContent = `Página ${paginaAtual + 1} de ${totalPaginas}`;
    if (btnAnterior) btnAnterior.disabled = paginaAtual === 0;
    if (btnProxima) btnProxima.disabled = paginaAtual >= totalPaginas - 1;
  }

  if (btnAnterior) {
    btnAnterior.addEventListener('click', () => {
      if (paginaAtual > 0) {
        paginaAtual -= 1;
        renderizarPagina();
        track.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
  if (btnProxima) {
    btnProxima.addEventListener('click', () => {
      const totalPaginas = Math.ceil(todosOsItens.length / ITENS_POR_PAGINA);
      if (paginaAtual < totalPaginas - 1) {
        paginaAtual += 1;
        renderizarPagina();
        track.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  window.carregarHomenagens = carregarHomenagens;
  carregarHomenagens();
})();
