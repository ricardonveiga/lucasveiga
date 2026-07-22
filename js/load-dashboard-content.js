(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

  const trackFotos = document.getElementById('fotosCarrosselTrack');
  const trackVideos = document.getElementById('videosCarrosselTrack');
  if (!trackFotos && !trackVideos) return;

  function nivelAcesso(){
    const tipoAcesso = sessionStorage.getItem('tipoAcesso');
    if (tipoAcesso !== 'membro') return 'visitante';
    const grupo = sessionStorage.getItem('grupoUsuario');
    return grupo === 'familia' ? 'familia' : 'membro';
  }

  async function buscarMidias(tipo){
    const nivel = nivelAcesso();
    const meuId = sessionStorage.getItem('usuarioId');

    // Visitante só vê o que é público — sem exceção.
    if (nivel === 'visitante') {
      try {
        const resp = await window.supaFetch(
          `${SUPABASE_URL}/rest/v1/midias?tipo=eq.${tipo}&status=eq.aprovado&visibilidade=eq.todos&select=*&order=criado_em.desc&limit=200`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`
            }
          }
        );
        const dados = await resp.json();
        return Array.isArray(dados) ? dados : [];
      } catch (e) {
        console.error(`Erro ao buscar ${tipo}s para o dashboard:`, e);
        return [];
      }
    }

    // Membros e família: veem tudo que não é privado, MAIS os próprios itens
    // marcados como "não compartilhar" (só o autor enxerga os dele).
    try {
      const resp = await window.supaFetch(
        `${SUPABASE_URL}/rest/v1/midias?tipo=eq.${tipo}&status=eq.aprovado&select=*&order=criado_em.desc&limit=200`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const dados = await resp.json();
      const itens = Array.isArray(dados) ? dados : [];
      return itens
        .filter(item => {
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
    } catch (e) {
      console.error(`Erro ao buscar ${tipo}s para o dashboard:`, e);
      return [];
    }
  }

  function criarCardFoto(item){
    const card = document.createElement('div');
    card.className = 'media-card photo-card';
    card.setAttribute('data-photo-id', item.id);
    card.setAttribute('data-descricao', item.descricao || '');
    card.setAttribute('data-evento', item.nome_evento || '');
    card.setAttribute('data-year-label', item.ano || 'Sem data');
    card.setAttribute('data-visibility', item.visibilidade);
    card.setAttribute('data-autor-id', item.autor_id ?? '');
    card.dataset.bgUrl = item.url_arquivo || '';
    card.style.backgroundImage = `url('${item.url_arquivo}')`;

    const tag = document.createElement('span');
    tag.className = 'media-tag';
    tag.innerHTML = `<span>${item.nome_evento || 'Sem evento'}</span><em>${item.ano || ''}</em>`;
    card.appendChild(tag);

    window.anexarBotaoExcluir(card, 'midias', item.id);
    return card;
  }

  function criarCardVideo(item){
    const card = document.createElement('div');
    card.className = 'media-card video-card';
    card.setAttribute('data-video-id', item.id);
    card.setAttribute('data-descricao', item.descricao || '');
    card.setAttribute('data-year-label', item.ano || 'Sem data');
    card.setAttribute('data-visibility', item.visibilidade);
    card.setAttribute('data-autor-id', item.autor_id ?? '');
    card.dataset.videoUrl = item.url_arquivo || '';

    if (item.url_arquivo) {
      const thumb = document.createElement('video');
      thumb.className = 'video-card-thumb';
      thumb.src = item.url_arquivo;
      thumb.muted = true;
      thumb.preload = 'metadata';
      thumb.playsInline = true;
      card.appendChild(thumb);
    }

    const play = document.createElement('div');
    play.className = 'play-btn';
    play.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    card.appendChild(play);

    const caption = document.createElement('span');
    caption.className = 'media-caption';
    caption.innerHTML = `${item.nome_evento || 'Sem evento'} <em>${item.ano || ''}</em>`;
    card.appendChild(caption);

    window.anexarBotaoExcluir(card, 'midias', item.id);
    return card;
  }

  function renderizarVazio(track, mensagem){
    track.innerHTML = '';
    track.classList.add('marquee-vazio');
    const aviso = document.createElement('p');
    aviso.className = 'hint-text';
    aviso.style.margin = '0';
    aviso.textContent = mensagem;
    track.appendChild(aviso);
  }

  async function carregarFotos(){
    if (!trackFotos) return;
    const itens = await buscarMidias('foto');

    if (itens.length === 0) {
      renderizarVazio(trackFotos, 'Nenhuma foto aprovada ainda — adicione a sua também!');
      return;
    }

    window.renderizarCarrossel(trackFotos, itens, (item) => criarCardFoto(item));

    if (window.ReactionsAPI) ReactionsAPI.refreshAllBadges();
    if (typeof marcarCardsFavoritos === 'function') marcarCardsFavoritos();
  }

  async function carregarVideos(){
    if (!trackVideos) return;
    const itens = await buscarMidias('video');

    if (itens.length === 0) {
      renderizarVazio(trackVideos, 'Nenhum vídeo aprovado ainda — adicione o seu também!');
      return;
    }

    window.renderizarCarrossel(trackVideos, itens, (item) => criarCardVideo(item));

    if (window.ReactionsAPI) ReactionsAPI.refreshAllBadges();
  }

  carregarFotos();
  carregarVideos();
})();