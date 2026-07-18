(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';
  const ITENS_POR_PAGINA = 10;

  const track = document.getElementById('sonhosCarrosselTrack');
  if (!track) return;

  const paginacaoEl = document.getElementById('sonhosPaginacao');
  const btnAnterior = document.getElementById('sonhosPaginaAnterior');
  const btnProxima = document.getElementById('sonhosPaginaProxima');
  const paginaTextoEl = document.getElementById('sonhosPaginaTexto');

  let todosOsItens = [];
  let paginaAtual = 0;

  const CORES = ['color-a', 'color-b', 'color-c', 'color-d'];

  function criarCardSonho(item, indice){
    const card = document.createElement('div');
    card.className = 'recado-card ' + CORES[indice % CORES.length] + ((item.imagem_url || item.video_url) ? ' recado-card-media' : '');
    card.setAttribute('data-sonho-id', item.id);
    card.setAttribute('data-autor', item.autor_nome || '');
    card.setAttribute('data-texto', item.texto || '');
    card.setAttribute('data-imagem', item.imagem_url || '');
    card.setAttribute('data-video', item.video_url || '');

    const emoji = document.createElement('span');
    emoji.className = 'recado-emoji';
    emoji.textContent = item.video_url ? '🎬' : item.imagem_url ? '📷' : '🌙';
    card.appendChild(emoji);

    const tipo = document.createElement('span');
    tipo.className = 'recado-tipo';
    tipo.textContent = 'Sonho ou sinal';
    card.appendChild(tipo);

    if (item.imagem_url) {
      const thumb = document.createElement('div');
      thumb.className = 'recado-media-thumb';
      thumb.style.backgroundImage = `url('${item.imagem_url}')`;
      thumb.style.backgroundSize = 'contain';
      thumb.style.backgroundRepeat = 'no-repeat';
      thumb.style.backgroundPosition = 'center';
      thumb.style.backgroundColor = '#000';
      card.appendChild(thumb);
    } else if (item.video_url) {
      const thumb = document.createElement('div');
      thumb.className = 'recado-media-thumb';
      thumb.style.display = 'flex';
      thumb.style.alignItems = 'center';
      thumb.style.justifyContent = 'center';
      thumb.style.backgroundColor = '#000';
      thumb.style.color = 'var(--ink-dim)';
      thumb.style.fontSize = '0.78rem';
      thumb.textContent = '🎬 Vídeo';
      card.appendChild(thumb);
    }

    if (item.texto) {
      const texto = document.createElement('p');
      texto.textContent = `"${item.texto}"`;
      card.appendChild(texto);
    }

    const autor = document.createElement('span');
    autor.className = 'recado-autor';
    autor.textContent = item.autor_nome || 'Anônimo';
    card.appendChild(autor);

    return card;
  }

  function podeVerSonho(item){
    if (item.visibilidade === 'privado') {
      const meuId = sessionStorage.getItem('usuarioId');
      const meuTipo = sessionStorage.getItem('tipoAcesso') === 'membro' ? 'membro' : 'visitante';
            const tipoConfere = !item.autor_tipo || item.autor_tipo === meuTipo;
            return !!meuId && tipoConfere && String(item.autor_id) === String(meuId);
    }
    const nivel = nivelDeAcessoAtual();
    if (nivel === 'visitante') return false;
    if (item.visibilidade === 'ambos') return true;
    if (item.visibilidade === 'familia') return nivel === 'familia';
    if (item.visibilidade === 'membros') return nivel === 'membro';
    return false;
  }

  async function carregarSonhos(){
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/sonhos_sinais?status=eq.aprovado&select=*&order=criado_em.desc&limit=500`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const dados = await resp.json();
      const itens = (Array.isArray(dados) ? dados : []).filter(item => podeVerSonho(item));

      todosOsItens = itens;
      paginaAtual = 0;
      renderizarPagina();
    } catch (e) {
      console.error('Erro ao carregar sonhos e sinais:', e);
    }
  }

  function renderizarPagina(){
    track.innerHTML = '';

    if (todosOsItens.length === 0) {
      track.classList.add('marquee-vazio');
      const vazio = document.createElement('p');
      vazio.className = 'hint-text';
      vazio.style.margin = '0';
      vazio.textContent = 'Nenhum sonho ou sinal por aqui ainda — registre o seu também!';
      track.appendChild(vazio);
      if (paginacaoEl) paginacaoEl.style.display = 'none';
      return;
    }

    // Sem controle de página na tela (widget do dashboard) = carrossel
    // contínuo, precisa duplicar os itens pro loop ficar suave.
    if (!paginacaoEl) {
      track.classList.remove('marquee-vazio');
      const paraExibir = [...todosOsItens, ...todosOsItens];
      paraExibir.forEach((item, indice) => track.appendChild(criarCardSonho(item, indice)));
      if (window.ReactionsAPI) ReactionsAPI.refreshAllBadges();
      return;
    }

    const inicio = paginaAtual * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    const itensDaPagina = todosOsItens.slice(inicio, fim);

    itensDaPagina.forEach((item, indice) => {
      track.appendChild(criarCardSonho(item, indice));
    });

    if (window.ReactionsAPI) ReactionsAPI.refreshAllBadges();

    const totalPaginas = Math.ceil(todosOsItens.length / ITENS_POR_PAGINA);
    if (paginacaoEl) {
      paginacaoEl.style.display = totalPaginas > 1 ? 'flex' : 'none';
    }
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

  window.carregarSonhos = carregarSonhos;
  carregarSonhos();
})();
