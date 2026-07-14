(function(){
  const EMOJIS = [
    { key: 'coracao', symbol: '❤️', label: 'Coração' },
    { key: 'felicidade', symbol: '😊', label: 'Felicidade' },
    { key: 'saudade', symbol: '🥺', label: 'Saudade' },
    { key: 'teamo', symbol: '💌', label: 'Te amo' }
  ];

  function carregarReacoes(){
    try { return JSON.parse(localStorage.getItem('reacoesMidiaLucas')) || {}; }
    catch(e){ return {}; }
  }
  function salvarReacoes(dados){
    localStorage.setItem('reacoesMidiaLucas', JSON.stringify(dados));
  }
  function getMediaId(card, indice){
    return card.dataset.photoId || card.dataset.mediaId || card.dataset.recadoId
      || ('card-' + (card.closest('section')?.id || 'sec') + '-' + (indice || 0));
  }
  function ehPrivado(card){
    return card && card.getAttribute('data-visibility') === 'privado';
  }
  function getRegistro(mediaId){
    return carregarReacoes()[mediaId] || {};
  }
  function totalCount(mediaId){
    const reg = getRegistro(mediaId);
    return EMOJIS.reduce((soma, e) => soma + (reg[e.key] || 0), 0);
  }
  function topEmojis(mediaId, limite){
    const reg = getRegistro(mediaId);
    return EMOJIS
      .map(e => ({ ...e, contagem: reg[e.key] || 0 }))
      .filter(e => e.contagem > 0)
      .sort((a,b) => b.contagem - a.contagem)
      .slice(0, limite || 2);
  }
  function toggle(mediaId, key){
    const dados = carregarReacoes();
    if (!dados[mediaId]) dados[mediaId] = {};
    const jaMarcado = dados[mediaId][key + '_marcado'];
    let contagem = dados[mediaId][key] || 0;
    contagem += jaMarcado ? -1 : 1;
    if (contagem < 0) contagem = 0;
    dados[mediaId][key] = contagem;
    dados[mediaId][key + '_marcado'] = !jaMarcado;
    salvarReacoes(dados);
  }
  function marcado(mediaId, key){
    return !!getRegistro(mediaId)[key + '_marcado'];
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

  function iniciarBadges(){
    document.querySelectorAll('.media-card, .recado-card').forEach((card, indice) => {
      const mediaId = getMediaId(card, indice);
      card.dataset.reactionId = mediaId;
      renderBadge(card, mediaId);
    });
  }

  function buildInteractiveBar(mediaId, container, privado){
    container.innerHTML = '';

    if (privado) {
      const aviso = document.createElement('p');
      aviso.className = 'lightbox-privado-aviso';
      aviso.textContent = 'Este conteúdo não é compartilhado — sem reações ou comentários.';
      container.appendChild(aviso);
      return;
    }

    const linha = document.createElement('div');
    linha.className = 'lightbox-reaction-row';

    EMOJIS.forEach(e => {
      const reg = getRegistro(mediaId);
      const contagem = reg[e.key] || 0;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lightbox-reaction-btn' + (marcado(mediaId, e.key) ? ' is-marcado' : '');
      btn.innerHTML = `<span>${e.symbol}</span>` + (contagem > 0 ? `<em>${contagem}</em>` : '');
      btn.setAttribute('aria-label', e.label);
      btn.addEventListener('click', () => {
        toggle(mediaId, e.key);
        buildInteractiveBar(mediaId, container, false);
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

  function carregarComentarios(){
    try { return JSON.parse(localStorage.getItem('comentariosMidiaLucas')) || {}; }
    catch(e){ return {}; }
  }
  function salvarComentarios(dados){
    localStorage.setItem('comentariosMidiaLucas', JSON.stringify(dados));
  }
  function getComentarios(mediaId){
    return carregarComentarios()[mediaId] || [];
  }
  function addComentario(mediaId, texto, autor){
    const dados = carregarComentarios();
    if (!dados[mediaId]) dados[mediaId] = [];
    dados[mediaId].push({ texto, autor: autor || 'Você', status: 'pendente' });
    salvarComentarios(dados);
  }

  function buildCommentsPanel(mediaId, container, privado){
    container.innerHTML = '';
    if (privado) return;

    const titulo = document.createElement('p');
    titulo.className = 'lightbox-comments-titulo';
    titulo.textContent = 'Comentários';
    container.appendChild(titulo);

    const lista = document.createElement('div');
    lista.className = 'lightbox-comments-list';
    const comentarios = getComentarios(mediaId);

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
        meta.textContent = c.autor + ' · ';
        const em = document.createElement('em');
        em.textContent = 'Aguardando aprovação';
        meta.appendChild(em);
        item.appendChild(p);
        item.appendChild(meta);
        lista.appendChild(item);
      });
    }
    container.appendChild(lista);

    const form = document.createElement('div');
    form.className = 'lightbox-comment-form';
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Escreva um comentário...';
    textarea.rows = 2;
    const btnEnviar = document.createElement('button');
    btnEnviar.type = 'button';
    btnEnviar.className = 'btn-limpar lightbox-comment-enviar';
    btnEnviar.textContent = 'Comentar';
    btnEnviar.addEventListener('click', () => {
      const texto = textarea.value.trim();
      if (!texto) return;
      addComentario(mediaId, texto);
      textarea.value = '';
      buildCommentsPanel(mediaId, container, false);
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
    refreshCardBadge: renderBadge,
    refreshAllBadges: iniciarBadges,
    buildInteractiveBar,
    buildCommentsPanel
  };

  document.addEventListener('DOMContentLoaded', iniciarBadges);
})();