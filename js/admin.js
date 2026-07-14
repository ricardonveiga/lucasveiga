(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

  const gridMidias = document.getElementById('admGrid');
  const gridRecados = document.getElementById('admGridRecados');
  const gridSonhos = document.getElementById('admGridSonhos');
  const listaSection = document.getElementById('listaPendentes');
  const acessoNegado = document.getElementById('acessoNegado');

  const papel = sessionStorage.getItem('papelUsuario');
  if (papel !== 'admin') {
    listaSection.style.display = 'none';
    acessoNegado.style.display = 'block';
    return;
  }

  async function buscarPendentesMidias(){
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/midias?status=eq.pendente&select=*&order=criado_em.asc`,
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
      console.error('Erro ao buscar mídias pendentes:', e);
      return [];
    }
  }

  async function buscarPendentesRecados(){
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/recados_mural?status=eq.pendente&select=*&order=criado_em.asc`,
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
      console.error('Erro ao buscar recados pendentes:', e);
      return [];
    }
  }

  async function buscarPendentesSonhos(){
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/sonhos_sinais?status=eq.pendente&select=*&order=criado_em.asc`,
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
      console.error('Erro ao buscar sonhos e sinais pendentes:', e);
      return [];
    }
  }

  async function atualizarStatusMidia(id, novoStatus, extras){
    await fetch(`${SUPABASE_URL}/rest/v1/midias?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ status: novoStatus, ...(extras || {}) })
    });
  }

  async function atualizarStatusRecado(id, novoStatus, extras){
    await fetch(`${SUPABASE_URL}/rest/v1/recados_mural?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ status: novoStatus, ...(extras || {}) })
    });
  }

  async function atualizarStatusSonho(id, novoStatus, extras){
    await fetch(`${SUPABASE_URL}/rest/v1/sonhos_sinais?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ status: novoStatus, ...(extras || {}) })
    });
  }

  async function criarNotificacao(usuarioId, status, motivo, midiaId, recadoId, sonhoId){
    if (!usuarioId) return;
    await fetch(`${SUPABASE_URL}/rest/v1/notificacoes_moderacao`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        usuario_id: Number(usuarioId),
        midia_id: midiaId || null,
        recado_id: recadoId || null,
        sonho_id: sonhoId || null,
        status,
        motivo: motivo || null
      })
    });
  }

  function criarPainelMotivo(onConfirmar){
    const painelMotivo = document.createElement('div');
    painelMotivo.style.display = 'none';
    painelMotivo.style.marginTop = '0.6rem';

    const textareaMotivo = document.createElement('textarea');
    textareaMotivo.placeholder = 'Explique o motivo da rejeição (a pessoa vai receber essa mensagem)';
    textareaMotivo.style.width = '100%';
    textareaMotivo.style.minHeight = '60px';
    textareaMotivo.style.padding = '0.6rem';
    textareaMotivo.style.borderRadius = '8px';
    textareaMotivo.style.border = '1px solid var(--line)';
    textareaMotivo.style.background = 'var(--card-inner)';
    textareaMotivo.style.color = 'var(--ink)';
    textareaMotivo.style.fontFamily = 'Inter, sans-serif';
    textareaMotivo.style.fontSize = '0.78rem';
    textareaMotivo.style.marginBottom = '0.5rem';
    textareaMotivo.style.boxSizing = 'border-box';

    const btnConfirmarRejeicao = document.createElement('button');
    btnConfirmarRejeicao.className = 'btn-publicar';
    btnConfirmarRejeicao.style.margin = '0';
    btnConfirmarRejeicao.textContent = 'Confirmar rejeição e avisar';
    btnConfirmarRejeicao.addEventListener('click', () => onConfirmar(textareaMotivo.value.trim(), btnConfirmarRejeicao));

    painelMotivo.appendChild(textareaMotivo);
    painelMotivo.appendChild(btnConfirmarRejeicao);
    return painelMotivo;
  }

  // Cria um campinho editável (label + input ou textarea) pra permitir
  // corrigir erros de digitação/português antes de aprovar.
  function criarCampoEditavel(labelTexto, valorInicial, opts){
    opts = opts || {};
    const bloco = document.createElement('div');
    bloco.style.marginBottom = '0.5rem';

    const label = document.createElement('label');
    label.textContent = labelTexto;
    label.style.display = 'block';
    label.style.fontSize = '0.66rem';
    label.style.color = 'var(--ink-dim)';
    label.style.marginBottom = '0.2rem';
    bloco.appendChild(label);

    const campo = document.createElement(opts.multilinha ? 'textarea' : 'input');
    if (!opts.multilinha) campo.type = opts.tipo || 'text';
    campo.value = valorInicial || '';
    campo.style.width = '100%';
    campo.style.padding = '0.45rem 0.6rem';
    campo.style.borderRadius = '6px';
    campo.style.border = '1px solid var(--line)';
    campo.style.background = 'var(--card-inner)';
    campo.style.color = 'var(--ink)';
    campo.style.fontFamily = 'Inter, sans-serif';
    campo.style.fontSize = '0.78rem';
    campo.style.boxSizing = 'border-box';
    if (opts.multilinha) campo.style.minHeight = '55px';

    bloco.appendChild(campo);
    return { bloco, campo };
  }

  function criarCardMidia(item){
    const wrap = document.createElement('div');
    wrap.className = 'content-section';
    wrap.style.padding = '1rem';

    const ehVideo = item.tipo === 'video';

    const preview = document.createElement('div');
    preview.style.width = '100%';
    preview.style.height = '160px';
    preview.style.borderRadius = '8px';
    preview.style.backgroundColor = '#000';
    preview.style.backgroundSize = 'contain';
    preview.style.backgroundRepeat = 'no-repeat';
    preview.style.backgroundPosition = 'center';
    preview.style.marginBottom = '0.7rem';
    if (!ehVideo) preview.style.backgroundImage = `url('${item.url_arquivo}')`;
    if (ehVideo) {
      preview.textContent = '🎬 Vídeo (clique em "abrir arquivo" para conferir)';
      preview.style.display = 'flex';
      preview.style.alignItems = 'center';
      preview.style.justifyContent = 'center';
      preview.style.color = 'var(--ink-dim)';
      preview.style.fontSize = '0.8rem';
    }

    const info = document.createElement('p');
    info.style.fontSize = '0.72rem';
    info.style.margin = '0 0 0.6rem 0';
    info.style.color = 'var(--ink-dim)';
    info.innerHTML = `Visibilidade: ${item.visibilidade} · Autor ID: ${item.autor_id ?? 'desconhecido'}`;

    const campoEvento = criarCampoEditavel('Nome do evento', item.nome_evento);
    const campoAno = criarCampoEditavel('Ano', item.ano, { tipo: 'number' });
    const campoDescricao = criarCampoEditavel('Descrição', item.descricao, { multilinha: true });

    const abrirArquivo = document.createElement('a');
    abrirArquivo.href = item.url_arquivo;
    abrirArquivo.target = '_blank';
    abrirArquivo.rel = 'noopener';
    abrirArquivo.className = 'ver-mais-link';
    abrirArquivo.style.display = 'inline-block';
    abrirArquivo.style.marginBottom = '0.7rem';
    abrirArquivo.textContent = 'Abrir arquivo original';

    const acoes = document.createElement('div');
    acoes.style.display = 'flex';
    acoes.style.gap = '0.6rem';
    acoes.style.marginTop = '0.6rem';

    const btnAprovar = document.createElement('button');
    btnAprovar.className = 'btn-publicar';
    btnAprovar.style.margin = '0';
    btnAprovar.textContent = 'Aprovar';

    const btnRejeitar = document.createElement('button');
    btnRejeitar.className = 'btn-limpar';
    btnRejeitar.textContent = 'Rejeitar';

    function camposEditados(){
      return {
        nome_evento: campoEvento.campo.value.trim(),
        ano: campoAno.campo.value,
        descricao: campoDescricao.campo.value.trim()
      };
    }

    const painelMotivo = criarPainelMotivo(async (motivo, botao) => {
      botao.disabled = true;
      botao.textContent = 'Enviando...';
      await atualizarStatusMidia(item.id, 'rejeitado', camposEditados());
      await criarNotificacao(item.autor_id, 'rejeitado', motivo, item.id, null, null);
      if (window.avisoSite) window.avisoSite(`"${campoEvento.campo.value || 'Conteúdo'}" foi rejeitado e a pessoa foi avisada do motivo.`, '⚠️');
      wrap.remove();
    });

    btnAprovar.addEventListener('click', async () => {
      btnAprovar.disabled = true;
      btnAprovar.textContent = 'Aprovando...';
      await atualizarStatusMidia(item.id, 'aprovado', camposEditados());
      await criarNotificacao(item.autor_id, 'aprovado', null, item.id, null, null);
      if (window.avisoSite) window.avisoSite(`"${campoEvento.campo.value || 'Conteúdo'}" foi aprovado e a pessoa foi avisada.`, '✅');
      wrap.remove();
    });

    btnRejeitar.addEventListener('click', () => {
      painelMotivo.style.display = painelMotivo.style.display === 'none' ? 'block' : 'none';
    });

    acoes.appendChild(btnAprovar);
    acoes.appendChild(btnRejeitar);

    wrap.appendChild(preview);
    wrap.appendChild(info);
    wrap.appendChild(campoEvento.bloco);
    wrap.appendChild(campoAno.bloco);
    wrap.appendChild(campoDescricao.bloco);
    wrap.appendChild(abrirArquivo);
    wrap.appendChild(acoes);
    wrap.appendChild(painelMotivo);

    return wrap;
  }

  function criarCardRecado(item){
    const wrap = document.createElement('div');
    wrap.className = 'content-section';
    wrap.style.padding = '1rem';

    if (item.imagem_url) {
      const preview = document.createElement('div');
      preview.style.width = '100%';
      preview.style.height = '160px';
      preview.style.borderRadius = '8px';
      preview.style.backgroundColor = '#000';
      preview.style.backgroundSize = 'contain';
      preview.style.backgroundRepeat = 'no-repeat';
      preview.style.backgroundPosition = 'center';
      preview.style.marginBottom = '0.7rem';
      preview.style.backgroundImage = `url('${item.imagem_url}')`;
      wrap.appendChild(preview);
    }

    const info = document.createElement('p');
    info.style.fontSize = '0.72rem';
    info.style.margin = '0 0 0.6rem 0';
    info.style.color = 'var(--ink-dim)';
    info.innerHTML = `Método: ${item.metodo} · Visibilidade: ${item.visibilidade} · Autor ID: ${item.autor_id ?? 'visitante'}`;

    const campoAutor = criarCampoEditavel('Nome da pessoa', item.autor_nome);
    const campoTexto = criarCampoEditavel('Texto do recado', item.texto, { multilinha: true });

    const acoes = document.createElement('div');
    acoes.style.display = 'flex';
    acoes.style.gap = '0.6rem';
    acoes.style.marginTop = '0.6rem';

    const btnAprovar = document.createElement('button');
    btnAprovar.className = 'btn-publicar';
    btnAprovar.style.margin = '0';
    btnAprovar.textContent = 'Aprovar';

    const btnRejeitar = document.createElement('button');
    btnRejeitar.className = 'btn-limpar';
    btnRejeitar.textContent = 'Rejeitar';

    function camposEditados(){
      return {
        autor_nome: campoAutor.campo.value.trim(),
        texto: campoTexto.campo.value.trim()
      };
    }

    const painelMotivo = criarPainelMotivo(async (motivo, botao) => {
      botao.disabled = true;
      botao.textContent = 'Enviando...';
      await atualizarStatusRecado(item.id, 'rejeitado', camposEditados());
      await criarNotificacao(item.autor_id, 'rejeitado', motivo, null, item.id, null);
      if (window.avisoSite) window.avisoSite(`O recado de "${campoAutor.campo.value}" foi rejeitado e a pessoa foi avisada do motivo.`, '⚠️');
      wrap.remove();
    });

    btnAprovar.addEventListener('click', async () => {
      btnAprovar.disabled = true;
      btnAprovar.textContent = 'Aprovando...';
      await atualizarStatusRecado(item.id, 'aprovado', camposEditados());
      await criarNotificacao(item.autor_id, 'aprovado', null, null, item.id, null);
      if (window.avisoSite) window.avisoSite(`O recado de "${campoAutor.campo.value}" foi aprovado e a pessoa foi avisada.`, '✅');
      wrap.remove();
    });

    btnRejeitar.addEventListener('click', () => {
      painelMotivo.style.display = painelMotivo.style.display === 'none' ? 'block' : 'none';
    });

    acoes.appendChild(btnAprovar);
    acoes.appendChild(btnRejeitar);

    wrap.appendChild(info);
    wrap.appendChild(campoAutor.bloco);
    wrap.appendChild(campoTexto.bloco);
    wrap.appendChild(acoes);
    wrap.appendChild(painelMotivo);

    return wrap;
  }

  function criarCardSonho(item){
    const wrap = document.createElement('div');
    wrap.className = 'content-section';
    wrap.style.padding = '1rem';

    if (item.imagem_url) {
      const preview = document.createElement('div');
      preview.style.width = '100%';
      preview.style.height = '160px';
      preview.style.borderRadius = '8px';
      preview.style.backgroundColor = '#000';
      preview.style.backgroundSize = 'contain';
      preview.style.backgroundRepeat = 'no-repeat';
      preview.style.backgroundPosition = 'center';
      preview.style.marginBottom = '0.7rem';
      preview.style.backgroundImage = `url('${item.imagem_url}')`;
      wrap.appendChild(preview);
    }

    if (item.video_url) {
      const abrirVideo = document.createElement('a');
      abrirVideo.href = item.video_url;
      abrirVideo.target = '_blank';
      abrirVideo.rel = 'noopener';
      abrirVideo.className = 'ver-mais-link';
      abrirVideo.style.display = 'inline-block';
      abrirVideo.style.marginBottom = '0.7rem';
      abrirVideo.textContent = '🎬 Abrir vídeo enviado';
      wrap.appendChild(abrirVideo);
    }

    const info = document.createElement('p');
    info.style.fontSize = '0.72rem';
    info.style.margin = '0 0 0.6rem 0';
    info.style.color = 'var(--ink-dim)';
    info.innerHTML = `Visibilidade: ${item.visibilidade} · Autor ID: ${item.autor_id ?? 'desconhecido'}`;

    const campoAutor = criarCampoEditavel('Nome da pessoa', item.autor_nome);
    const campoTexto = criarCampoEditavel('Texto', item.texto, { multilinha: true });

    const acoes = document.createElement('div');
    acoes.style.display = 'flex';
    acoes.style.gap = '0.6rem';
    acoes.style.marginTop = '0.6rem';

    const btnAprovar = document.createElement('button');
    btnAprovar.className = 'btn-publicar';
    btnAprovar.style.margin = '0';
    btnAprovar.textContent = 'Aprovar';

    const btnRejeitar = document.createElement('button');
    btnRejeitar.className = 'btn-limpar';
    btnRejeitar.textContent = 'Rejeitar';

    function camposEditados(){
      return {
        autor_nome: campoAutor.campo.value.trim(),
        texto: campoTexto.campo.value.trim()
      };
    }

    const painelMotivo = criarPainelMotivo(async (motivo, botao) => {
      botao.disabled = true;
      botao.textContent = 'Enviando...';
      await atualizarStatusSonho(item.id, 'rejeitado', camposEditados());
      await criarNotificacao(item.autor_id, 'rejeitado', motivo, null, null, item.id);
      if (window.avisoSite) window.avisoSite(`O registro de "${campoAutor.campo.value}" foi rejeitado e a pessoa foi avisada do motivo.`, '⚠️');
      wrap.remove();
    });

    btnAprovar.addEventListener('click', async () => {
      btnAprovar.disabled = true;
      btnAprovar.textContent = 'Aprovando...';
      await atualizarStatusSonho(item.id, 'aprovado', camposEditados());
      await criarNotificacao(item.autor_id, 'aprovado', null, null, null, item.id);
      if (window.avisoSite) window.avisoSite(`O registro de "${campoAutor.campo.value}" foi aprovado e a pessoa foi avisada.`, '✅');
      wrap.remove();
    });

    btnRejeitar.addEventListener('click', () => {
      painelMotivo.style.display = painelMotivo.style.display === 'none' ? 'block' : 'none';
    });

    acoes.appendChild(btnAprovar);
    acoes.appendChild(btnRejeitar);

    wrap.appendChild(info);
    wrap.appendChild(campoAutor.bloco);
    wrap.appendChild(campoTexto.bloco);
    wrap.appendChild(acoes);
    wrap.appendChild(painelMotivo);

    return wrap;
  }

  async function carregarMidias(){
    const itens = await buscarPendentesMidias();
    gridMidias.innerHTML = '';

    if (itens.length === 0) {
      const vazio = document.createElement('p');
      vazio.className = 'hint-text';
      vazio.style.margin = '0';
      vazio.textContent = 'Nenhuma foto/vídeo aguardando aprovação no momento.';
      gridMidias.appendChild(vazio);
      return;
    }

    itens.forEach(item => gridMidias.appendChild(criarCardMidia(item)));
  }

  async function carregarRecados(){
    if (!gridRecados) return;
    const itens = await buscarPendentesRecados();
    gridRecados.innerHTML = '';

    if (itens.length === 0) {
      const vazio = document.createElement('p');
      vazio.className = 'hint-text';
      vazio.style.margin = '0';
      vazio.textContent = 'Nenhum recado aguardando aprovação no momento.';
      gridRecados.appendChild(vazio);
      return;
    }

    itens.forEach(item => gridRecados.appendChild(criarCardRecado(item)));
  }

  async function carregarSonhos(){
    if (!gridSonhos) return;
    const itens = await buscarPendentesSonhos();
    gridSonhos.innerHTML = '';

    if (itens.length === 0) {
      const vazio = document.createElement('p');
      vazio.className = 'hint-text';
      vazio.style.margin = '0';
      vazio.textContent = 'Nenhum sonho ou sinal aguardando aprovação no momento.';
      gridSonhos.appendChild(vazio);
      return;
    }

    itens.forEach(item => gridSonhos.appendChild(criarCardSonho(item)));
  }

  carregarMidias();
  carregarRecados();
  carregarSonhos();
})();