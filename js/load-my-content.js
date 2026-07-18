(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

  const container = document.getElementById('meuConteudoTrack');
  if (!container) return;

  const usuarioId = sessionStorage.getItem('usuarioId');

  function mostrarMensagem(texto){
    container.innerHTML = '';
    container.classList.add('marquee-vazio');
    const p = document.createElement('p');
    p.className = 'hint-text';
    p.style.margin = '0';
    p.textContent = texto;
    container.appendChild(p);
  }

  if (!usuarioId) {
    mostrarMensagem('Você ainda não compartilhou nada — envie algo pra ver aqui.');
    return;
  }

  const HEADERS = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`
  };

  function badgeStatus(item){
    let rotuloVisibilidade = 'Todos';
    if (item.visibilidade === 'familia') rotuloVisibilidade = 'Família';
    if (item.visibilidade === 'membros') rotuloVisibilidade = 'Membros';
    if (item.visibilidade === 'ambos') rotuloVisibilidade = 'Membros e família';

    const rotulo = item.visibilidade === 'privado'
      ? 'Não compartilhado'
      : `${rotuloVisibilidade} · ${item.status === 'aprovado' ? 'Aprovado' : 'Aguardando aprovação'}`;

    const classe = item.visibilidade === 'privado'
      ? 'badge-privado'
      : (item.status === 'aprovado' ? 'badge-aprovado' : 'badge-pendente');

    const badge = document.createElement('span');
    badge.className = 'badge ' + classe;
    badge.textContent = rotulo;
    return badge;
  }

  function cardMidia(item, rotuloTipo){
    const ehVideo = item.tipo === 'video';
    const ehAudio = item.tipo === 'audio';
    const card = document.createElement('div');
    card.className = 'media-card ' + ((ehVideo || ehAudio) ? 'video-card' : 'photo-card');
    card.setAttribute('data-visibility', item.visibilidade);

    if (!ehVideo && !ehAudio && item.url_arquivo) {
      card.style.backgroundImage = `url('${item.url_arquivo}')`;
    } else if (ehVideo && item.url_arquivo) {
      const thumb = document.createElement('video');
      thumb.className = 'video-card-thumb';
      thumb.src = item.url_arquivo;
      thumb.muted = true;
      thumb.preload = 'metadata';
      thumb.playsInline = true;
      card.appendChild(thumb);
    }

    card.appendChild(badgeStatus(item));

    if (ehVideo || ehAudio) {
      const play = document.createElement('div');
      play.className = 'play-btn';
      play.innerHTML = ehAudio
        ? '<span style="font-size:1.1rem;">🎧</span>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
      card.appendChild(play);
    }

    const tag = document.createElement('span');
    tag.className = 'media-tag';
    tag.innerHTML = `<span>${rotuloTipo}</span><em>${item.ano || ''}</em>`;
    card.appendChild(tag);

    return card;
  }

  const CORES = ['color-a', 'color-b', 'color-c', 'color-d'];

  function cardTexto(item, rotuloTipo, emoji, texto, indice){
    const card = document.createElement('div');
    card.className = 'recado-card ' + CORES[indice % CORES.length];
    card.setAttribute('data-visibility', item.visibilidade);

    card.appendChild(badgeStatus(item));

    const em = document.createElement('span');
    em.className = 'recado-emoji';
    em.textContent = emoji;
    card.appendChild(em);

    const tipo = document.createElement('span');
    tipo.className = 'recado-tipo';
    tipo.textContent = rotuloTipo;
    card.appendChild(tipo);

    const p = document.createElement('p');
    const resumo = (texto || '').length > 90 ? (texto || '').slice(0, 90) + '…' : (texto || '');
    p.textContent = `"${resumo}"`;
    card.appendChild(p);

    const autor = document.createElement('span');
    autor.className = 'recado-autor';
    autor.textContent = 'Você';
    card.appendChild(autor);

    return card;
  }

  async function buscar(tabela){
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/${tabela}?autor_id=eq.${usuarioId}&select=*&order=criado_em.desc&limit=100`,
        { headers: HEADERS }
      );
      const dados = await resp.json();
      return Array.isArray(dados) ? dados : [];
    } catch (e) {
      console.error(`Erro ao carregar ${tabela}:`, e);
      return [];
    }
  }

  async function carregar(){
    const [midias, recados, sonhos, conversas, homenagens] = await Promise.all([
      buscar('midias'),
      buscar('recados_mural'),
      buscar('sonhos_sinais'),
      buscar('conversas'),
      buscar('homenagens')
    ]);

    const todos = [
      ...midias.map(i => ({ origem: 'midia', ...i })),
      ...recados.map(i => ({ origem: 'recado', ...i })),
      ...sonhos.map(i => ({ origem: 'sonho', ...i })),
      ...conversas.map(i => ({ origem: 'conversa', ...i })),
      ...homenagens.map(i => ({ origem: 'homenagem', ...i }))
    ].sort((a, b) => new Date(b.criado_em || 0) - new Date(a.criado_em || 0));

    if (todos.length === 0) {
      mostrarMensagem('Você ainda não compartilhou nada — envie algo pra ver aqui.');
      return;
    }

    container.classList.remove('marquee-vazio');
    container.innerHTML = '';

    todos.forEach((item, indice) => {
      let card;
      if (item.origem === 'midia') {
        card = cardMidia(item, item.tipo === 'video' ? 'Vídeo' : 'Foto');
      } else if (item.origem === 'conversa') {
        if (item.url_arquivo) {
          card = cardMidia(item, item.tipo === 'audio' ? 'Áudio de conversa' : 'Print de conversa');
        } else {
          card = cardTexto(item, 'Conversa', '💬', item.texto_lembranca, indice);
        }
      } else if (item.origem === 'homenagem') {
        card = cardMidia(item, 'Homenagem');
      } else if (item.origem === 'sonho') {
        card = cardTexto(item, 'Sonho ou Sinal', '✨', item.texto, indice);
      } else {
        const emoji = item.metodo === 'tela' ? '🎨' : item.metodo === 'foto' ? '📷' : '♥';
        if (item.imagem_url) {
          card = cardMidia({ ...item, url_arquivo: item.imagem_url, tipo: 'foto' }, 'Recado');
        } else {
          card = cardTexto(item, 'Recado', emoji, item.texto, indice);
        }
      }
      container.appendChild(card);
    });
  }

  carregar();
})();
