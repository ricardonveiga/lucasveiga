(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';
  const HEADERS = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  const usuarioId = sessionStorage.getItem('usuarioId');
  const nomeUsuario = sessionStorage.getItem('nomeUsuario') || 'Anônimo';
  const tipoAcesso = sessionStorage.getItem('tipoAcesso') === 'membro' ? 'membro' : 'visitante';
  const isAdmin = sessionStorage.getItem('papelUsuario') === 'admin';
  const ehVisitante = typeof nivelDeAcessoAtual === 'function' && nivelDeAcessoAtual() === 'visitante';

  const inputMusica = document.getElementById('musicaSugerida');
  const erroEl = document.getElementById('musicaSugeridaErro');
  const btnEnviar = document.getElementById('btnSugerirMusica');
  const listaEl = document.getElementById('listaSugestoesMusicas');
  const formWrap = document.getElementById('formSugestaoMusica');
  const introEl = document.getElementById('sugerirMusicaIntro');

  // Sugerir é exclusivo de membros e família — visitante só visualiza.
  if (ehVisitante && formWrap) {
    introEl.textContent = 'Sugerir músicas é exclusivo para membros e família. Você pode aproveitar a playlist e ver as sugestões já enviadas abaixo.';
    formWrap.remove();
  } else if (inputMusica) {
    if (window.anexarSeletorEmoji) window.anexarSeletorEmoji(inputMusica);
  }

  function formatarData(iso){
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch(e){ return ''; }
  }

  async function enviarSugestao(){
    const musica = inputMusica.value.trim();
    erroEl.textContent = '';

    if (!musica) {
      erroEl.textContent = 'Escreva o nome da música antes de enviar.';
      return;
    }
    if (!usuarioId) {
      erroEl.textContent = 'Não identificamos seu login. Recarregue a página e tente de novo.';
      return;
    }

    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';

    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/sugestoes_musicas`, {
        method: 'POST',
        headers: { ...HEADERS, Prefer: 'return=minimal' },
        body: JSON.stringify({
          autor_id: Number(usuarioId),
          autor_tipo: tipoAcesso,
          autor_nome: nomeUsuario,
          musica,
          status: 'pendente'
        })
      });

      if (!resp.ok) throw new Error('Falha ao enviar');

      inputMusica.value = '';
      if (window.avisoSite) window.avisoSite('Sugestão enviada! Assim que for adicionada à playlist, você recebe um aviso.', '🎵');
      carregarSugestoes();
    } catch (e) {
      erroEl.textContent = 'Não foi possível enviar agora. Tente novamente.';
    }

    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar sugestão ♥';
  }

  if (btnEnviar) btnEnviar.addEventListener('click', enviarSugestao);

  async function marcarComoAdicionada(item, cartao){
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/sugestoes_musicas?id=eq.${item.id}`, {
        method: 'PATCH',
        headers: { ...HEADERS, Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'adicionada' })
      });
      if (!resp.ok) throw new Error('Falha ao atualizar');

      // Avisa a pessoa pelo sino
      if (item.autor_id) {
        await fetch(`${SUPABASE_URL}/rest/v1/notificacoes_moderacao`, {
          method: 'POST',
          headers: { ...HEADERS, Prefer: 'return=minimal' },
          body: JSON.stringify({
            usuario_id: item.autor_id,
            status: 'aprovado',
            musica_sugerida: item.musica,
            lida: false
          })
        });
      }

      cartao.classList.remove('sugestao-pendente');
      cartao.classList.add('sugestao-adicionada');
      const selo = cartao.querySelector('.sugestao-status');
      if (selo) selo.textContent = 'Adicionada ✓';
      const btn = cartao.querySelector('.btn-marcar-adicionada');
      if (btn) btn.remove();
    } catch (e) {
      if (window.avisoSite) window.avisoSite('Não foi possível marcar agora. Tente de novo.', '⚠️');
    }
  }

  function criarCartaoSugestao(item){
    const cartao = document.createElement('div');
    cartao.className = 'sugestao-musica-item ' + (item.status === 'adicionada' ? 'sugestao-adicionada' : 'sugestao-pendente');

    const musicaEl = document.createElement('p');
    musicaEl.className = 'sugestao-musica-nome';
    musicaEl.textContent = `🎵 ${item.musica}`;
    cartao.appendChild(musicaEl);

    const meta = document.createElement('p');
    meta.className = 'sugestao-musica-meta';
    meta.textContent = `— ${item.autor_nome || 'Anônimo'} · ${formatarData(item.criado_em)}`;
    cartao.appendChild(meta);

    const selo = document.createElement('span');
    selo.className = 'sugestao-status';
    selo.textContent = item.status === 'adicionada' ? 'Adicionada ✓' : 'Aguardando';
    cartao.appendChild(selo);

    if (isAdmin && item.status !== 'adicionada') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-limpar btn-marcar-adicionada';
      btn.textContent = 'Marcar como adicionada';
      btn.addEventListener('click', () => marcarComoAdicionada(item, cartao));
      cartao.appendChild(btn);
    }

    return cartao;
  }

  async function carregarSugestoes(){
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/sugestoes_musicas?select=*&order=criado_em.desc&limit=200`,
        { headers: HEADERS }
      );
      const dados = await resp.json();
      listaEl.innerHTML = '';

      if (!Array.isArray(dados) || dados.length === 0) {
        const vazio = document.createElement('p');
        vazio.className = 'hint-text';
        vazio.textContent = 'Nenhuma sugestão por aqui ainda — a próxima pode ser a sua!';
        listaEl.appendChild(vazio);
        return;
      }

      dados.forEach(item => listaEl.appendChild(criarCartaoSugestao(item)));
    } catch (e) {
      listaEl.innerHTML = '<p class="hint-text">Não foi possível carregar as sugestões agora.</p>';
    }
  }

  carregarSugestoes();
})();
