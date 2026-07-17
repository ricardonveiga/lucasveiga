(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';
  const ITENS_POR_PAGINA = 10;

  const track = document.getElementById('conversasGrid');
  if (!track) return;

  const paginacaoEl = document.getElementById('conversasPaginacao');
  const btnAnterior = document.getElementById('conversasPaginaAnterior');
  const btnProxima = document.getElementById('conversasPaginaProxima');
  const paginaTextoEl = document.getElementById('conversasPaginaTexto');

  let todosOsItens = [];
  let paginaAtual = 0;

  function nivelAcesso(){
    const tipoAcesso = sessionStorage.getItem('tipoAcesso');
    if (tipoAcesso !== 'membro') return 'visitante';
    const grupo = sessionStorage.getItem('grupoUsuario');
    return grupo === 'familia' ? 'familia' : 'membro';
  }

  function criarCardConversa(item){
    const ehAudio = item.tipo === 'audio';
    const card = document.createElement('div');
    card.className = 'media-card ' + (ehAudio ? 'video-card' : 'photo-card');
    card.setAttribute('data-conversa-id', item.id);
    card.setAttribute('data-visibility', item.visibilidade);
    card.setAttribute('data-autor-id', item.autor_id ?? '');

    if (!ehAudio && item.url_arquivo) {
      card.style.backgroundImage = `url('${item.url_arquivo}')`;
      const badge = document.createElement('span');
      badge.className = 'badge badge-aprovado';
      badge.textContent = 'Print';
      card.appendChild(badge);
    } else if (ehAudio) {
      const wrap = document.createElement('div');
      wrap.style.position = 'absolute';
      wrap.style.inset = '0';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.alignItems = 'center';
      wrap.style.justifyContent = 'center';
      wrap.style.gap = '0.6rem';
      wrap.style.padding = '0.8rem';
      wrap.innerHTML = '<span style="font-size:1.6rem;">🎧</span>';
      if (item.url_arquivo) {
        const audioEl = document.createElement('audio');
        audioEl.controls = true;
        audioEl.src = item.url_arquivo;
        audioEl.style.width = '90%';
        audioEl.addEventListener('click', (e) => e.stopPropagation());
        wrap.appendChild(audioEl);
      }
      card.appendChild(wrap);
    }

    const caption = document.createElement('span');
    caption.className = 'media-caption';
    caption.innerHTML = `${item.autor_nome || 'Anônimo'} <em>${item.texto_lembranca ? '💬' : ''}</em>`;
    card.appendChild(caption);

    return card;
  }

  async function carregarConversas(){
    const nivel = nivelAcesso();
    const filtro = nivel === 'visitante' ? '&visibilidade=eq.todos' : '';

    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/conversas?status=eq.aprovado${filtro}&select=*&order=criado_em.desc&limit=500`,
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
            return !!meuId && String(item.autor_id) === String(meuId);
          }
          return true;
        });
      }

      todosOsItens = itens;
      paginaAtual = 0;
      renderizarPagina();
    } catch (e) {
      console.error('Erro ao carregar conversas:', e);
    }
  }

  function renderizarPagina(){
    track.innerHTML = '';

    if (todosOsItens.length === 0) {
      track.classList.add('marquee-vazio');
      const vazio = document.createElement('p');
      vazio.className = 'hint-text';
      vazio.style.margin = '0';
      vazio.textContent = 'Nenhuma conversa por aqui ainda — adicione a sua também!';
      track.appendChild(vazio);
      if (paginacaoEl) paginacaoEl.style.display = 'none';
      return;
    }

    // Sem controle de página na tela (widget do dashboard) = carrossel
    // contínuo, precisa duplicar os itens pro loop ficar suave.
    if (!paginacaoEl) {
      track.classList.remove('marquee-vazio');
      const paraExibir = [...todosOsItens, ...todosOsItens];
      paraExibir.forEach(item => track.appendChild(criarCardConversa(item)));
      if (window.ReactionsAPI) ReactionsAPI.refreshAllBadges();
      return;
    }

    const inicio = paginaAtual * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    todosOsItens.slice(inicio, fim).forEach(item => track.appendChild(criarCardConversa(item)));

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

  window.carregarConversas = carregarConversas;
  carregarConversas();
})();
