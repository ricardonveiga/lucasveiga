(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

  // Detecta se é página de foto ou de vídeo pelo próprio nome do arquivo
  // (fotos.html / fotos-ano.html vs videos.html / videos-ano.html).
  const tipo = window.location.pathname.includes('video') ? 'video' : 'foto';

  function nivelAcesso(){
    const tipoAcesso = sessionStorage.getItem('tipoAcesso');
    if (tipoAcesso !== 'membro') return 'visitante';
    const grupo = sessionStorage.getItem('grupoUsuario');
    return grupo === 'familia' ? 'familia' : 'membro';
  }

  async function buscarTodasMidias(){
    const nivel = nivelAcesso();
    const meuId = sessionStorage.getItem('usuarioId');
    const filtro = nivel === 'visitante' ? '&visibilidade=eq.todos' : '';

    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/midias?tipo=eq.${tipo}&status=eq.aprovado${filtro}&select=*&order=criado_em.desc&limit=500`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const dados = await resp.json();
      const itens = Array.isArray(dados) ? dados : [];

      if (nivel === 'visitante') return itens;

      // Membros e família também veem os próprios itens "não compartilhar".
      return itens.filter(item => {
        if (item.visibilidade === 'privado') {
          return !!meuId && String(item.autor_id) === String(meuId);
        }
        return true;
      });
    } catch (e) {
      console.error('Erro ao buscar mídias por ano:', e);
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
    card.dataset.bgUrl = item.url_arquivo || '';
    card.style.backgroundImage = `url('${item.url_arquivo}')`;

    const tag = document.createElement('span');
    tag.className = 'media-tag';
    tag.innerHTML = `<span>${item.nome_evento || 'Sem evento'}</span><em>${item.ano || ''}</em>`;
    card.appendChild(tag);

    return card;
  }

  function criarCardVideo(item){
    const card = document.createElement('div');
    card.className = 'media-card video-card';
    card.setAttribute('data-video-id', item.id);
    card.setAttribute('data-descricao', item.descricao || '');
    card.setAttribute('data-year-label', item.ano || 'Sem data');
    card.setAttribute('data-visibility', item.visibilidade);
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

    return card;
  }

  function criarCard(item){
    return tipo === 'video' ? criarCardVideo(item) : criarCardFoto(item);
  }

  function popularTrack(track, itens, mensagemVazia){
    track.innerHTML = '';
    if (itens.length === 0) {
      if (mensagemVazia) {
        track.classList.add('marquee-vazio');
        const vazio = document.createElement('p');
        vazio.className = 'hint-text';
        vazio.style.margin = '0';
        vazio.textContent = mensagemVazia;
        track.appendChild(vazio);
      }
      return;
    }
    track.classList.remove('marquee-vazio');
    const lista = itens.length >= 4 ? [...itens, ...itens] : itens;
    lista.forEach(item => track.appendChild(criarCard(item)));
  }

  // ===== Página com várias seções, uma por ano (fotos.html / videos.html) =====
  async function iniciarPaginaMultiAno(){
    const itens = await buscarTodasMidias();

    const porAno = {};
    itens.forEach(item => {
      const chave = item.ano ? String(item.ano) : 'sem-data';
      if (!porAno[chave]) porAno[chave] = [];
      porAno[chave].push(item);
    });

    document.querySelectorAll('main section[id^="ano-"]').forEach(secao => {
      const ano = secao.id.replace('ano-', '');
      const itensDoAno = porAno[ano] || [];
      const track = secao.querySelector('.marquee-track');

      if (itensDoAno.length === 0) {
        secao.style.display = 'none';
        return;
      }
      secao.style.display = '';
      if (track) popularTrack(track, itensDoAno, null);
    });

    // "Um pouco de cada ano" — fonte de dados da galeria embaralhada
    // (fica sempre oculta na página, só alimenta o lightbox "Ver mais").
    const idMisturado = tipo === 'video' ? 'videos-misturados' : 'todas-misturadas';
    const secaoMisturada = document.getElementById(idMisturado);
    if (secaoMisturada) {
      const track = secaoMisturada.querySelector('.marquee-track');
      if (track) {
        const embaralhado = [...itens].sort(() => Math.random() - 0.5).slice(0, 16);
        popularTrack(track, embaralhado, null);
      }
    }

    if (window.ReactionsAPI) ReactionsAPI.refreshAllBadges();
    if (typeof marcarCardsFavoritos === 'function') marcarCardsFavoritos();
  }

  // ===== Página de um ano só (fotos-ano.html / videos-ano.html) =====
  async function iniciarPaginaAnoUnico(){
    const params = new URLSearchParams(window.location.search);
    const anoSelecionado = params.get('ano') || 'sem-data';

    const tituloAno = document.getElementById('tituloAno');
    if (tituloAno) {
      tituloAno.textContent = anoSelecionado === 'sem-data' ? 'Sem data' : anoSelecionado;
    }

    const itens = await buscarTodasMidias();
    const doAno = itens.filter(item => {
      const chave = item.ano ? String(item.ano) : 'sem-data';
      return chave === anoSelecionado;
    });

    const grid = document.querySelector('.full-grid');
    if (!grid) return;

    grid.innerHTML = '';
    if (doAno.length === 0) {
      const vazio = document.createElement('p');
      vazio.className = 'hint-text';
      vazio.style.margin = '0';
      vazio.textContent = tipo === 'video'
        ? `Nenhum vídeo de ${anoSelecionado === 'sem-data' ? 'sem data' : anoSelecionado} por aqui ainda.`
        : `Nenhuma foto de ${anoSelecionado === 'sem-data' ? 'sem data' : anoSelecionado} por aqui ainda.`;
      grid.appendChild(vazio);
    } else {
      doAno.forEach(item => grid.appendChild(criarCard(item)));
    }

    if (window.ReactionsAPI) ReactionsAPI.refreshAllBadges();
    if (typeof marcarCardsFavoritos === 'function') marcarCardsFavoritos();
  }

  const ehPaginaAnoUnico = !!document.getElementById('tituloAno');
  if (ehPaginaAnoUnico) {
    iniciarPaginaAnoUnico();
  } else {
    iniciarPaginaMultiAno();
  }
})();
