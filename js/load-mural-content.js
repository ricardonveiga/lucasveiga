(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';
  const ITENS_POR_PAGINA = 10;

  const track = document.getElementById('muralCarrosselTrack');
  if (!track) return;

  const paginacaoEl = document.getElementById('muralPaginacao');
  const btnAnterior = document.getElementById('muralPaginaAnterior');
  const btnProxima = document.getElementById('muralPaginaProxima');
  const paginaTextoEl = document.getElementById('muralPaginaTexto');

  let todosOsItens = [];
  let paginaAtual = 0;

  function nivelAcesso(){
    const tipoAcesso = sessionStorage.getItem('tipoAcesso');
    if (tipoAcesso !== 'membro') return 'visitante';
    const grupo = sessionStorage.getItem('grupoUsuario');
    return grupo === 'familia' ? 'familia' : 'membro';
  }

  const CORES = ['color-a', 'color-b', 'color-c', 'color-d'];

  function criarCardRecado(item, indice){
    const card = document.createElement('div');
    card.className = 'recado-card ' + CORES[indice % CORES.length] + (item.imagem_url ? ' recado-card-media' : '');
    card.setAttribute('data-recado-id', item.id);
    card.setAttribute('data-visibility', item.visibilidade);
    card.setAttribute('data-autor', item.autor_nome || '');
    card.setAttribute('data-texto', item.texto || '');
    card.setAttribute('data-imagem', item.imagem_url || '');

    const emoji = document.createElement('span');
    emoji.className = 'recado-emoji';
    emoji.textContent = item.metodo === 'tela' ? '🎨' : item.metodo === 'foto' ? '📷' : '♥';
    card.appendChild(emoji);

    const tipo = document.createElement('span');
    tipo.className = 'recado-tipo';
    tipo.textContent = item.metodo === 'tela' ? 'Manuscrito (tela)' : item.metodo === 'foto' ? 'Manuscrito (foto)' : 'Digitado';
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
    } else {
      const texto = document.createElement('p');
      texto.textContent = `"${item.texto || ''}"`;
      card.appendChild(texto);
    }

    const autor = document.createElement('span');
    autor.className = 'recado-autor';
    autor.textContent = item.autor_nome || 'Anônimo';
    card.appendChild(autor);

    return card;
  }

  async function carregarRecadosMural(){
    const nivel = nivelAcesso();

    // Visitantes só veem o que é público — sem exceção, nem os próprios (visitante não tem "próprio").
    if (nivel === 'visitante') {
      try {
        const resp = await fetch(
          `${SUPABASE_URL}/rest/v1/recados_mural?status=eq.aprovado&visibilidade=eq.todos&select=*&order=criado_em.desc&limit=500`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`
            }
          }
        );
        const dados = await resp.json();
        iniciarPaginacao(Array.isArray(dados) ? dados : []);
      } catch (e) {
        console.error('Erro ao carregar recados do mural:', e);
      }
      return;
    }

    // Membros e família: veem tudo que não é privado, MAIS os próprios recados
    // marcados como "não compartilhar" (só eles enxergam os deles).
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/recados_mural?status=eq.aprovado&select=*&order=criado_em.desc&limit=500`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const dados = await resp.json();
      const meuId = sessionStorage.getItem('usuarioId');
      const itens = (Array.isArray(dados) ? dados : []).filter(item => {
        if (item.visibilidade === 'privado') {
          const meuTipo = sessionStorage.getItem('tipoAcesso') === 'membro' ? 'membro' : 'visitante';
            const tipoConfere = !item.autor_tipo || item.autor_tipo === meuTipo;
            return !!meuId && tipoConfere && String(item.autor_id) === String(meuId);
        }
        return true;
      });
      iniciarPaginacao(itens);
    } catch (e) {
      console.error('Erro ao carregar recados do mural:', e);
    }
  }

  function iniciarPaginacao(itens){
    todosOsItens = itens;
    paginaAtual = 0;
    renderizarPagina();
  }

  function renderizarPagina(){
    track.innerHTML = '';

    if (todosOsItens.length === 0) {
      const vazio = document.createElement('p');
      vazio.className = 'hint-text';
      vazio.style.margin = '0';
      vazio.textContent = 'Nenhum recado por aqui ainda — deixe o seu também!';
      track.appendChild(vazio);
      if (paginacaoEl) paginacaoEl.style.display = 'none';
      return;
    }

    const inicio = paginaAtual * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    const itensDaPagina = todosOsItens.slice(inicio, fim);

    if (!paginacaoEl) {
      // Dashboard: carrossel contínuo (ou estático, se couber na tela)
      window.renderizarCarrossel(track, itensDaPagina, (item, indice) => criarCardRecado(item, indice));
    } else {
      itensDaPagina.forEach((item, indice) => {
        track.appendChild(criarCardRecado(item, indice));
      });
    }

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

  window.carregarRecadosMural = carregarRecadosMural;
  carregarRecadosMural();
})();
