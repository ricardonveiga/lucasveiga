(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';
  const GERAR_MENSAGEM_URL = 'https://igvtlqkkflpjrgasapos.supabase.co/functions/v1/gerar-mensagem-ia';

  const modalPerguntas = document.getElementById('perguntasModal');
  const modalMensagem = document.getElementById('mensagemModal');
  const listaInbox = document.getElementById('mensagemInboxLista');
  const bell = document.getElementById('notificationBell');
  const letterIcon = document.getElementById('letterIcon');
  if (!modalPerguntas || !bell || !letterIcon || !listaInbox) return;

  const usuarioId = sessionStorage.getItem('usuarioId');
  if (!usuarioId) return;

  // Membro e visitante vêm de tabelas diferentes (usuários × visitantes) e os
  // IDs numéricos podem coincidir. O tipo_usuario separa as caixas de entrada.
  const tipoUsuario = sessionStorage.getItem('tipoAcesso') === 'membro' ? 'membro' : 'visitante';

  // Se a coluna tipo_usuario ainda não existir no banco (SQL de atualização
  // não rodado), o código cai automaticamente no comportamento antigo.
  let colunaTipoDisponivel = true;

  const HEADERS = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`
  };
  const HEADERS_JSON = { ...HEADERS, 'Content-Type': 'application/json', Prefer: 'return=minimal' };

  const CHAVE_ULTIMA_EXIBICAO = 'perguntasUltimaExibicao_' + tipoUsuario + '_' + usuarioId;

  function hoje(){
    return new Date().toISOString().slice(0, 10);
  }
  function jaMostrouHoje(){
    return localStorage.getItem(CHAVE_ULTIMA_EXIBICAO) === hoje();
  }
  function marcarMostradoHoje(){
    localStorage.setItem(CHAVE_ULTIMA_EXIBICAO, hoje());
  }
  function formatarData(iso){
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch(e){
      return '';
    }
  }

  async function gerarMensagemComIA(respostas){
    try {
      const resp = await fetch(GERAR_MENSAGEM_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(respostas)
      });
      const dados = await resp.json();
      if (!resp.ok || dados.erro) throw new Error(dados.erro || 'Falha ao gerar mensagem');
      return dados.mensagem;
    } catch (e) {
      console.error('Erro ao gerar mensagem com IA:', e);
      return null;
    }
  }

  // Agora VERIFICA se o banco aceitou a gravação — antes, uma falha aqui
  // passava despercebida: o sino acendia e a mensagem nunca existia.
  async function salvarRespostas(respostas, mensagemGerada){
    const corpoBase = {
      usuario_id: Number(usuarioId),
      respostas,
      mensagem_gerada: mensagemGerada,
      lida: false
    };

    async function tentar(corpo){
      const resp = await window.supaFetch(`${SUPABASE_URL}/rest/v1/respostas_perguntas`, {
        method: 'POST',
        headers: HEADERS_JSON,
        body: JSON.stringify(corpo)
      });
      if (resp.ok) return { ok: true };
      let detalhe = '';
      try { detalhe = (await resp.json()).message || ''; } catch(e){}
      return { ok: false, status: resp.status, detalhe };
    }

    try {
      if (colunaTipoDisponivel) {
        const r = await tentar({ ...corpoBase, tipo_usuario: tipoUsuario });
        if (r.ok) return { ok: true };
        // Coluna ainda não existe no banco → tenta no formato antigo
        if (r.status === 400 && /tipo_usuario/.test(r.detalhe)) {
          colunaTipoDisponivel = false;
        } else {
          console.error('Erro ao salvar mensagem:', r.status, r.detalhe);
          return { ok: false, detalhe: r.detalhe };
        }
      }
      const r2 = await tentar(corpoBase);
      if (r2.ok) return { ok: true };
      console.error('Erro ao salvar mensagem:', r2.status, r2.detalhe);
      return { ok: false, detalhe: r2.detalhe };
    } catch (e) {
      console.error('Erro ao salvar respostas:', e);
      return { ok: false, detalhe: String(e) };
    }
  }

  async function buscarMensagensLucas(){
    const base = `${SUPABASE_URL}/rest/v1/respostas_perguntas?usuario_id=eq.${usuarioId}` +
      `&select=id,mensagem_gerada,lida,criado_em&order=criado_em.desc`;
    // Inclui também linhas antigas (tipo_usuario nulo, de antes da atualização)
    const filtroTipo = `&or=(tipo_usuario.eq.${tipoUsuario},tipo_usuario.is.null)`;

    async function tentar(url){
      const resp = await window.supaFetch(url, { headers: HEADERS });
      if (!resp.ok) return null;
      const dados = await resp.json();
      return Array.isArray(dados) ? dados : null;
    }

    try {
      if (colunaTipoDisponivel) {
        const dados = await tentar(base + filtroTipo);
        if (dados) return dados;
        colunaTipoDisponivel = false;
      }
      const legado = await tentar(base);
      return legado || [];
    } catch (e) {
      console.error('Erro ao buscar mensagens:', e);
      return [];
    }
  }

  async function buscarNotificacoesModeracao(){
    try {
      const resp = await window.supaFetch(
        `${SUPABASE_URL}/rest/v1/notificacoes_moderacao?usuario_id=eq.${usuarioId}&select=*&order=criado_em.desc`,
        { headers: HEADERS }
      );
      const dados = await resp.json();
      if (!Array.isArray(dados) || dados.length === 0) return [];

      const midiaIds = [...new Set(dados.filter(n => n.midia_id).map(n => n.midia_id))];
      const recadoIds = [...new Set(dados.filter(n => n.recado_id).map(n => n.recado_id))];
      let mapaMidias = new Map();
      let mapaRecados = new Map();

      if (midiaIds.length > 0) {
        const ids = midiaIds.map(id => `"${id}"`).join(',');
        const r = await window.supaFetch(`${SUPABASE_URL}/rest/v1/midias?id=in.(${ids})&select=id,nome_evento,ano`, { headers: HEADERS });
        const d = await r.json();
        if (Array.isArray(d)) mapaMidias = new Map(d.map(m => [String(m.id), m]));
      }
      if (recadoIds.length > 0) {
        const ids = recadoIds.map(id => `"${id}"`).join(',');
        const r = await window.supaFetch(`${SUPABASE_URL}/rest/v1/recados_mural?id=in.(${ids})&select=id,autor_nome`, { headers: HEADERS });
        const d = await r.json();
        if (Array.isArray(d)) mapaRecados = new Map(d.map(rc => [String(rc.id), rc]));
      }

      return dados.map(n => {
        let texto;
        if (n.midia_id) {
          const midia = mapaMidias.get(String(n.midia_id));
          const evento = midia ? (midia.nome_evento || 'Conteúdo') : 'Um conteúdo seu';
          const ano = midia ? midia.ano : '';
          texto = n.status === 'aprovado'
            ? `Boas notícias! "${evento}"${ano ? ' (' + ano + ')' : ''} foi aprovado e já está disponível para quem você compartilhou.`
            : `"${evento}"${ano ? ' (' + ano + ')' : ''} não foi aprovado.${n.motivo ? ' Motivo: ' + n.motivo : ' Nenhum motivo foi informado.'}`;
        } else if (n.recado_id) {
          texto = n.status === 'aprovado'
            ? `Seu recado no Mural foi aprovado e já está disponível para quem você compartilhou.`
            : `Seu recado no Mural não foi aprovado.${n.motivo ? ' Motivo: ' + n.motivo : ' Nenhum motivo foi informado.'}`;
        } else if (n.musica_sugerida) {
          texto = `🎵 Sua sugestão "${n.musica_sugerida}" foi adicionada à playlist do Lucas!`;
        } else if (n.musica_rejeitada) {
          texto = `Sua sugestão "${n.musica_rejeitada}" não foi adicionada.${n.motivo ? ' Motivo: ' + n.motivo : ' Nenhum motivo foi informado.'}`;
        } else {
          texto = n.status === 'aprovado' ? 'Seu conteúdo foi aprovado.' : 'Seu conteúdo não foi aprovado.';
        }
        return { origem: 'moderacao', id: n.id, texto, lida: n.lida, criado_em: n.criado_em };
      });
    } catch (e) {
      console.error('Erro ao buscar notificações de moderação:', e);
      return [];
    }
  }

  async function patchOuDelete(url, metodo, corpo){
    try {
      const resp = await window.supaFetch(url, {
        method: metodo,
        headers: metodo === 'PATCH' ? HEADERS_JSON : HEADERS,
        body: corpo ? JSON.stringify(corpo) : undefined
      });
      if (!resp.ok) {
        let detalhe = '';
        try { detalhe = (await resp.json()).message || ''; } catch(e){}
        console.error(`Falha ${metodo} ${url}:`, resp.status, detalhe);
        return false;
      }
      return true;
    } catch (e) {
      console.error(`Erro ${metodo}:`, e);
      return false;
    }
  }

  function marcarComoLida(id){
    return patchOuDelete(`${SUPABASE_URL}/rest/v1/respostas_perguntas?id=eq.${id}`, 'PATCH', { lida: true });
  }
  function marcarNotificacaoComoLida(id){
    return patchOuDelete(`${SUPABASE_URL}/rest/v1/notificacoes_moderacao?id=eq.${id}`, 'PATCH', { lida: true });
  }
  function excluirMensagem(id){
    return patchOuDelete(`${SUPABASE_URL}/rest/v1/respostas_perguntas?id=eq.${id}`, 'DELETE');
  }
  function excluirNotificacao(id){
    return patchOuDelete(`${SUPABASE_URL}/rest/v1/notificacoes_moderacao?id=eq.${id}`, 'DELETE');
  }

  async function buscarFeedCompleto(){
    const [mensagensLucas, notificacoes] = await Promise.all([
      buscarMensagensLucas(),
      buscarNotificacoesModeracao()
    ]);
    const itensLucas = mensagensLucas.map(m => ({
      origem: 'lucas', id: m.id, texto: m.mensagem_gerada, lida: m.lida, criado_em: m.criado_em
    }));
    return [...itensLucas, ...notificacoes].sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
  }

  async function atualizarSinoBadge(){
    const feed = await buscarFeedCompleto();
    bell.classList.toggle('has-unread', feed.some(item => !item.lida));
  }

  async function renderizarInbox(){
    const feed = await buscarFeedCompleto();
    listaInbox.innerHTML = '';

    if (feed.length === 0) {
      const vazio = document.createElement('p');
      vazio.className = 'mensagem-inbox-vazio';
      vazio.textContent = 'Você ainda não tem mensagens. Clique na carta ao lado para responder algumas perguntas e receber a primeira.';
      listaInbox.appendChild(vazio);
      return;
    }

    feed.forEach(item => {
      const card = document.createElement('div');
      card.className = 'mensagem-inbox-item' + (item.lida ? '' : ' nao-lida');

      const cabecalho = document.createElement('div');
      cabecalho.className = 'mensagem-inbox-cabecalho';

      const data = document.createElement('span');
      data.className = 'mensagem-inbox-data';
      data.textContent = formatarData(item.criado_em) + (item.lida ? '' : ' · nova');

      const btnExcluir = document.createElement('button');
      btnExcluir.className = 'mensagem-inbox-excluir';
      btnExcluir.type = 'button';
      btnExcluir.setAttribute('aria-label', 'Excluir mensagem');
      btnExcluir.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      btnExcluir.addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmar = window.confirmarSite
          ? await window.confirmarSite('Excluir esta mensagem? Essa ação não pode ser desfeita.')
          : window.confirm('Excluir esta mensagem? Essa ação não pode ser desfeita.');
        if (!confirmar) return;
        const conseguiu = item.origem === 'lucas' ? await excluirMensagem(item.id) : await excluirNotificacao(item.id);
        if (!conseguiu && window.avisoSite) {
          window.avisoSite('Não foi possível excluir agora — tente de novo em instantes.', '❌');
        }
        await renderizarInbox();
        await atualizarSinoBadge();
      });

      cabecalho.appendChild(data);
      cabecalho.appendChild(btnExcluir);

      const texto = document.createElement('p');
      texto.className = 'mensagem-inbox-texto';
      texto.textContent = item.texto;

      const assinatura = document.createElement('p');
      assinatura.className = 'mensagem-inbox-assinatura';
      assinatura.textContent = item.origem === 'lucas' ? '— Lucas' : '— Administração do site';

      card.appendChild(cabecalho);
      card.appendChild(texto);
      card.appendChild(assinatura);

      if (!item.lida) {
        card.addEventListener('click', async () => {
          const conseguiu = item.origem === 'lucas' ? await marcarComoLida(item.id) : await marcarNotificacaoComoLida(item.id);
          if (conseguiu) {
            card.classList.remove('nao-lida');
            card.querySelector('.mensagem-inbox-data').textContent = formatarData(item.criado_em);
          }
          atualizarSinoBadge();
        });
      }

      listaInbox.appendChild(card);
    });
  }

  function abrirModalPerguntas(){ modalPerguntas.classList.add('active'); }
  function fecharModalPerguntas(){ modalPerguntas.classList.remove('active'); marcarMostradoHoje(); }
  // Abrir a caixa = ler: marca tudo como lido em lote e apaga o sino.
  async function marcarTudoComoLido(){
    const filtroTipo = colunaTipoDisponivel ? `&or=(tipo_usuario.eq.${tipoUsuario},tipo_usuario.is.null)` : '';
    await Promise.all([
      patchOuDelete(`${SUPABASE_URL}/rest/v1/respostas_perguntas?usuario_id=eq.${usuarioId}&lida=eq.false${filtroTipo}`, 'PATCH', { lida: true }),
      patchOuDelete(`${SUPABASE_URL}/rest/v1/notificacoes_moderacao?usuario_id=eq.${usuarioId}&lida=eq.false`, 'PATCH', { lida: true })
    ]);
    await atualizarSinoBadge();
  }

  async function abrirInbox(){
    await renderizarInbox();
    modalMensagem.classList.add('active');
    marcarTudoComoLido();
  }
  function fecharInbox(){ modalMensagem.classList.remove('active'); }

  letterIcon.addEventListener('click', abrirModalPerguntas);
  document.getElementById('btnPerguntasPular').addEventListener('click', fecharModalPerguntas);

  document.getElementById('btnPerguntasEnviar').addEventListener('click', async () => {
    const respostas = {
      comoElaTeChamava: document.getElementById('pComoElaTeChamava').value.trim(),
      comoVoceAChamava: document.getElementById('pComoVoceAChamava').value.trim(),
      brincadeiraInterna: document.getElementById('pBrincadeiraInterna').value.trim(),
      lembrancaFeliz: document.getElementById('pLembrancaFeliz').value.trim(),
      oQueAdmirava: document.getElementById('pOQueAdmirava').value.trim(),
      oQueElaAdmirava: document.getElementById('pOQueElaAdmirava').value.trim(),
      lembrancaEngracada: document.getElementById('pLembrancaEngracada').value.trim(),
      algoNuncaDisse: document.getElementById('pAlgoNuncaDisse').value.trim(),
      algoQueGostariaOuvir: document.getElementById('pAlgoQueGostariaOuvir').value.trim(),
      momentoAbraco: document.getElementById('pMomentoAbraco').value.trim()
    };

    const algumaResposta = Object.values(respostas).some(v => v && v.length > 0);
    if (!algumaResposta) { fecharModalPerguntas(); return; }

    const btnEnviar = document.getElementById('btnPerguntasEnviar');
    const textoOriginal = btnEnviar.textContent;
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Gerando sua mensagem...';

    const mensagemGerada = await gerarMensagemComIA(respostas);

    if (!mensagemGerada) {
      btnEnviar.disabled = false;
      btnEnviar.textContent = textoOriginal;
      window.avisoSite('Não foi possível gerar a mensagem agora. Tente novamente em instantes.', '❌');
      return;
    }

    btnEnviar.textContent = 'Salvando...';
    const resultado = await salvarRespostas(respostas, mensagemGerada);

    btnEnviar.disabled = false;
    btnEnviar.textContent = textoOriginal;

    // Só confirma e acende o sino se a mensagem REALMENTE foi gravada —
    // antes, uma falha aqui acendia o sino com a caixa vazia.
    if (!resultado.ok) {
      window.avisoSite('A mensagem foi gerada, mas não foi possível salvá-la. Tente novamente em instantes.', '❌');
      return;
    }

    document.querySelectorAll('#perguntasModal textarea').forEach(t => (t.value = ''));

    fecharModalPerguntas();
    await atualizarSinoBadge();
    window.avisoSite('Sua mensagem foi gerada! Clique no sino para ler.', '💌');
  });

  bell.addEventListener('click', abrirInbox);
  document.getElementById('mensagemModalClose').addEventListener('click', fecharInbox);
  modalMensagem.addEventListener('click', (e) => { if (e.target === modalMensagem) fecharInbox(); });

  // Só abre a caixa de perguntas depois que a mensagem diária de
  // boas-vindas (js/mensagem-diaria.js) tiver sido fechada — ou na hora,
  // se ela já tiver sido mostrada hoje.
  let jaLiberou = false;
  window.liberarPerguntasDiarias = function(){
    if (jaLiberou) return;
    jaLiberou = true;
    if (!jaMostrouHoje()) {
      setTimeout(abrirModalPerguntas, 800);
    }
  };
  // Se o script da mensagem diária não estiver presente por algum motivo,
  // não trava a experiência: segue como antes depois de um instante.
  setTimeout(() => {
    if (!document.querySelector('.boas-vindas-overlay')) {
      window.liberarPerguntasDiarias();
    }
  }, 1500);

  atualizarSinoBadge();
})();
