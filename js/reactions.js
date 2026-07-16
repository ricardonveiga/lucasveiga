(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

  const EMOJIS = [
    { key: 'coracao', symbol: '❤️', label: 'Coração' },
    { key: 'felicidade', symbol: '😊', label: 'Felicidade' },
    { key: 'saudade', symbol: '🥺', label: 'Saudade' },
    { key: 'teamo', symbol: '💌', label: 'Te amo' }
  ];

  function headersPadrao(){
    return {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    };
  }

  function meuId(){
    return sessionStorage.getItem('usuarioId') || '';
  }

  function meuNome(){
    return sessionStorage.getItem('nomeUsuario') || 'Anônimo';
  }

  // Regra única pra quem pode reagir/comentar: exatamente quem já pode VER
  // o conteúdo (mesma lógica de "quem enxerga o quê" usada no resto do
  // site). "todos" inclui até visitante/cadastro público; "membros" inclui
  // família e membros; "familia" só família; "privado" só o próprio autor.
  function podeInteragir(visibilidade, autorId){
    const nivel = nivelDeAcessoAtual();
    if (visibilidade === 'privado') {
      const meu = meuId();
      return !!meu && String(autorId) === String(meu);
    }
    if (visibilidade === 'todos') return true;
    if (nivel === 'visitante') return false;
    if (visibilidade === 'familia') return nivel === 'familia';
    if (visibilidade === 'membros') return nivel === 'familia' || nivel === 'membro';
    return false;
  }

  function getMediaId(card, indice){
    return card.dataset.photoId || card.dataset.mediaId || card.dataset.recadoId || card.dataset.videoId
      || ('card-' + (card.closest('section')?.id || 'sec') + '-' + (indice || 0));
  }
  function ehPrivado(card){
    return card && card.getAttribute('data-visibility') === 'privado';
  }

  // ===================== Reações =====================
  const cacheReacoes = {}; // item_id -> [{usuario_id, emoji}, ...]

  async function buscarReacoesLote(itemIds){
    const idsUnicos = [...new Set(itemIds)].filter(Boolean);
    if (idsUnicos.length === 0) return;
    try {
      const filtro = idsUnicos.map(id => `"${id}"`).join(',');
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/reacoes?item_id=in.(${filtro})&select=item_id,usuario_id,emoji`,
        { headers: headersPadrao() }
      );
      const dados = await resp.json();
      idsUnicos.forEach(id => { cacheReacoes[id] = []; });
      (Array.isArray(dados) ? dados : []).forEach(r => {
        if (!cacheReacoes[r.item_id]) cacheReacoes[r.item_id] = [];
        cacheReacoes[r.item_id].push(r);
      });
    } catch (e) {
      console.error('Erro ao buscar reações:', e);
    }
  }

  function totalCount(mediaId){
    return (cacheReacoes[mediaId] || []).length;
  }
  function topEmojis(mediaId, limite){
    const lista = cacheReacoes[mediaId] || [];
    const contagens = {};
    lista.forEach(r => { contagens[r.emoji] = (contagens[r.emoji] || 0) + 1; });
    return EMOJIS
      .map(e => ({ ...e, contagem: contagens[e.key] || 0 }))
      .filter(e => e.contagem > 0)
      .sort((a, b) => b.contagem - a.contagem)
      .slice(0, limite || 2);
  }
  function marcado(mediaId, key){
    const meu = meuId();
    if (!meu) return false;
    return (cacheReacoes[mediaId] || []).some(r => String(r.usuario_id) === String(meu) && r.emoji === key);
  }

  async function toggle(mediaId, key, itemTipo){
    const meu = meuId();
    if (!meu) return;
    const jaTem = marcado(mediaId, key);

    if (jaTem) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/reacoes?item_id=eq.${encodeURIComponent(mediaId)}&usuario_id=eq.${meu}&emoji=eq.${key}`,
        { method: 'DELETE', headers: headersPadrao() }
      );
      cacheReacoes[mediaId] = (cacheReacoes[mediaId] || []).filter(
        r => !(String(r.usuario_id) === String(meu) && r.emoji === key)
      );
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/reacoes`, {
        method: 'POST',
        headers: headersPadrao(),
        body: JSON.stringify({
          item_id: String(mediaId),
          item_tipo: itemTipo || 'midia',
          usuario_id: Number(meu),
          emoji: key
        })
      });
      if (!cacheReacoes[mediaId]) cacheReacoes[mediaId] = [];
      cacheReacoes[mediaId].push({ usuario_id: Number(meu), emoji: key });
    }
  }

  function renderBadge(card, mediaId){
    const antigo = card.querySelector('.reaction-summary');
    if (antigo) antigo.remove();
    if (ehPrivado(card)) return;
    const total = totalCount(mediaId);
    if (total === 0) return;
    const top = topEmojis(mediaId, 2);
    const badge = document.createElement('div');
    badge.className = 'reaction-summary';
    badge.innerHTML = top.map(e => `<span>${e.symbol}</span>`).join('') + `<em>${total}</em>`;
    card.appendChild(badge);
  }

  async function iniciarBadges(){
    const cards = Array.from(document.querySelectorAll('.media-card, .recado-card'));
    const ids = [];
    cards.forEach((card, indice) => {
      const mediaId = getMediaId(card, indice);
      card.dataset.reactionId = mediaId;
      ids.push(mediaId);
    });
    await buscarReacoesLote(ids);
    cards.forEach((card, indice) => {
      renderBadge(card, getMediaId(card, indice));
    });
  }

  function buildInteractiveBar(mediaId, container, visibilidade, autorId){
    container.innerHTML = '';

    if (!podeInteragir(visibilidade, autorId)) {
      const aviso = document.createElement('p');
      aviso.className = 'lightbox-privado-aviso';
      aviso.textContent = visibilidade === 'privado'
        ? 'Este conteúdo não é compartilhado — sem reações ou comentários.'
        : 'Você não tem acesso pra reagir ou comentar neste conteúdo.';
      container.appendChild(aviso);
      return;
    }

    const linha = document.createElement('div');
    linha.className = 'lightbox-reaction-row';

    EMOJIS.forEach(e => {
      const contagem = (cacheReacoes[mediaId] || []).filter(r => r.emoji === e.key).length;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lightbox-reaction-btn' + (marcado(mediaId, e.key) ? ' is-marcado' : '');
      btn.innerHTML = `<span>${e.symbol}</span>` + (contagem > 0 ? `<em>${contagem}</em>` : '');
      btn.setAttribute('aria-label', e.label);
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        await toggle(mediaId, e.key);
        buildInteractiveBar(mediaId, container, visibilidade, autorId);
        const card = document.querySelector(`[data-reaction-id="${mediaId}"]`);
        if (card) renderBadge(card, mediaId);
      });
      linha.appendChild(btn);
    });

    const total = totalCount(mediaId);
    const totalEl = document.createElement('p');
    totalEl.className = 'lightbox-reaction-total';
    totalEl.textContent = total > 0 ? `${total} ${total === 1 ? 'reação' : 'reações'}` : 'Seja o primeiro a reagir';

    container.appendChild(linha);
    container.appendChild(totalEl);
  }

  // ===================== Comentários =====================
  const RANQUE_GRUPO = { familia: 0, membro: 1, visitante: 2 };

  async function buscarComentarios(mediaId, itemTipo){
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/comentarios?item_id=eq.${encodeURIComponent(mediaId)}&item_tipo=eq.${itemTipo || 'midia'}&select=*&order=criado_em.desc`,
        { headers: headersPadrao() }
      );
      const dados = await resp.json();
      const meu = meuId();
      const visiveis = (Array.isArray(dados) ? dados : []).filter(c =>
        c.status === 'aprovado' || (c.status === 'pendente' && meu && String(c.autor_id) === String(meu))
      );
      // Família e membros aparecem primeiro; dentro do mesmo grupo, mais recente primeiro.
      visiveis.sort((a, b) => {
        const rankA = RANQUE_GRUPO[a.autor_grupo] ?? 3;
        const rankB = RANQUE_GRUPO[b.autor_grupo] ?? 3;
        if (rankA !== rankB) return rankA - rankB;
        return new Date(b.criado_em) - new Date(a.criado_em);
      });
      return visiveis;
    } catch (e) {
      console.error('Erro ao buscar comentários:', e);
      return [];
    }
  }

  async function enviarComentario(mediaId, itemTipo, texto){
    const meu = meuId();
    const nivel = nivelDeAcessoAtual();
    await fetch(`${SUPABASE_URL}/rest/v1/comentarios`, {
      method: 'POST',
      headers: headersPadrao(),
      body: JSON.stringify({
        item_id: String(mediaId),
        item_tipo: itemTipo || 'midia',
        autor_id: meu ? Number(meu) : null,
        autor_nome: meuNome(),
        autor_grupo: nivel,
        texto,
        status: 'pendente'
      })
    });
  }

  async function buildCommentsPanel(mediaId, container, visibilidade, autorId){
    container.innerHTML = '';

    if (!podeInteragir(visibilidade, autorId)) return;

    const titulo = document.createElement('p');
    titulo.className = 'lightbox-comments-titulo';
    titulo.textContent = 'Comentários';
    container.appendChild(titulo);

    const lista = document.createElement('div');
    lista.className = 'lightbox-comments-list';
    lista.textContent = 'Carregando comentários...';
    container.appendChild(lista);

    const comentarios = await buscarComentarios(mediaId, 'midia');
    lista.innerHTML = '';

    if (comentarios.length === 0) {
      const vazio = document.createElement('p');
      vazio.className = 'lightbox-comments-vazio';
      vazio.textContent = 'Nenhum comentário ainda.';
      lista.appendChild(vazio);
    } else {
      comentarios.forEach(c => {
        const item = document.createElement('div');
        item.className = 'lightbox-comment-item';
        const p = document.createElement('p');
        p.className = 'lightbox-comment-texto';
        p.textContent = c.texto;
        const meta = document.createElement('span');
        meta.className = 'lightbox-comment-meta';
        meta.textContent = (c.autor_nome || 'Anônimo') + (c.status === 'pendente' ? ' · ' : '');
        if (c.status === 'pendente') {
          const em = document.createElement('em');
          em.textContent = 'Aguardando aprovação';
          meta.appendChild(em);
        }
        item.appendChild(p);
        item.appendChild(meta);
        lista.appendChild(item);
      });
    }

    const form = document.createElement('div');
    form.className = 'lightbox-comment-form';
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Escreva um comentário...';
    textarea.rows = 2;
    const btnEnviar = document.createElement('button');
    btnEnviar.type = 'button';
    btnEnviar.className = 'btn-limpar lightbox-comment-enviar';
    btnEnviar.textContent = 'Comentar';
    btnEnviar.addEventListener('click', async () => {
      const texto = textarea.value.trim();
      if (!texto) return;
      btnEnviar.disabled = true;
      btnEnviar.textContent = 'Enviando...';
      await enviarComentario(mediaId, 'midia', texto);
      textarea.value = '';
      btnEnviar.disabled = false;
      btnEnviar.textContent = 'Comentar';
      buildCommentsPanel(mediaId, container, visibilidade, autorId);
      if (window.avisoSite) {
        window.avisoSite('Comentário enviado! Ele aparecerá para outras pessoas assim que for aprovado pelo administrador.', '💬');
      }
    });
    form.appendChild(textarea);
    form.appendChild(btnEnviar);
    container.appendChild(form);
  }

  window.ReactionsAPI = {
    EMOJIS,
    getMediaId,
    totalCount,
    topEmojis,
    toggle,
    marcado,
    ehPrivado,
    podeInteragir,
    refreshCardBadge: renderBadge,
    refreshAllBadges: iniciarBadges,
    buildInteractiveBar,
    buildCommentsPanel
  };

  document.addEventListener('DOMContentLoaded', iniciarBadges);
})();
