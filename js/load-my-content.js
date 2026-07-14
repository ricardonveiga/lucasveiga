(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

  const container = document.getElementById('meuConteudoTrack');
  if (!container) return;

  const usuarioId = sessionStorage.getItem('usuarioId');
  if (!usuarioId) return;

  async function carregar(){
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/midias?autor_id=eq.${usuarioId}&select=*&order=criado_em.desc`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const dados = await resp.json();
      if (!Array.isArray(dados) || dados.length === 0) {
        container.innerHTML = '';
        container.classList.add('marquee-vazio');
        const vazio = document.createElement('p');
        vazio.className = 'hint-text';
        vazio.style.margin = '0';
        vazio.textContent = 'Você ainda não compartilhou nada — envie algo pra ver aqui.';
        container.appendChild(vazio);
        return;
      }

      container.classList.remove('marquee-vazio');
      container.innerHTML = '';

      dados.forEach(item => {
        const ehVideo = item.tipo === 'video';
        const card = document.createElement('div');
        card.className = 'media-card ' + (ehVideo ? 'video-card' : 'photo-card');
        card.setAttribute('data-photo-id', item.id);
        card.setAttribute('data-video-id', item.id);
        card.setAttribute('data-descricao', item.descricao || '');
        card.setAttribute('data-evento', item.nome_evento || '');
        card.setAttribute('data-year-label', item.ano || 'Sem data');
        card.setAttribute('data-visibility', item.visibilidade);
        card.dataset.bgUrl = item.url_arquivo || '';

        if (!ehVideo) {
          card.style.backgroundImage = `url('${item.url_arquivo}')`;
        } else {
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
        }

        let rotuloVisibilidade = 'Todos';
        if (item.visibilidade === 'familia') rotuloVisibilidade = 'Família';
        if (item.visibilidade === 'membros') rotuloVisibilidade = 'Membros';

        const rotuloStatus = item.visibilidade === 'privado'
          ? 'Não compartilhado'
          : `${rotuloVisibilidade} · ${item.status === 'aprovado' ? 'Aprovado' : 'Aguardando aprovação'}`;

        const classeBadge = item.visibilidade === 'privado'
          ? 'badge-privado'
          : (item.status === 'aprovado' ? 'badge-aprovado' : 'badge-pendente');

        const badge = document.createElement('span');
        badge.className = 'badge ' + classeBadge;
        badge.textContent = rotuloStatus;
        card.appendChild(badge);

        if (ehVideo) {
          const play = document.createElement('div');
          play.className = 'play-btn';
          play.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
          card.appendChild(play);
        }

        // Tag mínima: apenas evento + ano, sem descrição
        const tag = document.createElement('span');
        tag.className = 'media-tag';
        tag.innerHTML = `<span>${item.nome_evento || 'Sem evento'}</span><em>${item.ano || ''}</em>`;
        card.appendChild(tag);

        container.appendChild(card);
      });

      if (window.ReactionsAPI) ReactionsAPI.refreshAllBadges();
      if (typeof marcarCardsFavoritos === 'function') marcarCardsFavoritos();

    } catch (e) {
      console.error('Erro ao carregar seu conteúdo:', e);
    }
  }

  carregar();
})();