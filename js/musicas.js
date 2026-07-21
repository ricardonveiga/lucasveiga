(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';
  const HEADERS = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  const usuarioId = sessionStorage.getItem('usuarioId');
  const nomeUsuario = sessionStorage.getItem('nomeUsuario') || '';
  const tipoAcesso = sessionStorage.getItem('tipoAcesso') === 'membro' ? 'membro' : 'visitante';
  const isAdmin = sessionStorage.getItem('papelUsuario') === 'admin';

  const autorInput = document.getElementById('sugestaoAutor');
  const autorErro = document.getElementById('sugestaoAutorErro');
  const inputMusica = document.getElementById('musicaSugerida');
  const musicaErro = document.getElementById('musicaSugeridaErro');
  const descricaoInput = document.getElementById('musicaDescricao');
  const descricaoErro = document.getElementById('musicaDescricaoErro');
  const btnEnviar = document.getElementById('btnSugerirMusica');
  const listaEl = document.getElementById('listaSugestoesMusicas');
  const painelAdmin = document.getElementById('painelSugestoesAdmin');

  // Qualquer pessoa pode sugerir — pré-preenche o nome de quem já está
  // logado, mas deixa editável.
  if (autorInput && nomeUsuario) autorInput.value = nomeUsuario;

  [inputMusica, descricaoInput].forEach(campo => {
    if (campo && window.anexarSeletorEmoji) window.anexarSeletorEmoji(campo);
  });

  // A lista de sugestões (com o botão de aprovar) é só para o admin.
  if (isAdmin && painelAdmin) {
    painelAdmin.style.display = '';
    carregarSugestoes();
  }

  function formatarData(iso){
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch(e){ return ''; }
  }

  function limparErros(){
    autorErro.textContent = '';
    musicaErro.textContent = '';
    descricaoErro.textContent = '';
    [autorInput, inputMusica, descricaoInput].forEach(c => c.style.borderColor = '');
  }

  async function enviarSugestao(){
    limparErros();

    const autorNome = autorInput.value.trim();
    const musica = inputMusica.value.trim();
    const descricao = descricaoInput.value.trim();

    let temErro = false;
    if (!autorNome) {
      autorErro.textContent = 'Informe seu nome.';
      autorInput.style.borderColor = '#e07a7a';
      temErro = true;
    }
    if (!musica) {
      musicaErro.textContent = 'Escreva o nome da música.';
      inputMusica.style.borderColor = '#e07a7a';
      temErro = true;
    }
    if (!descricao) {
      descricaoErro.textContent = 'Conte por que essa música é especial — é obrigatório.';
      descricaoInput.style.borderColor = '#e07a7a';
      temErro = true;
    }
    if (temErro) return;

    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';

    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/sugestoes_musicas`, {
        method: 'POST',
        headers: { ...HEADERS, Prefer: 'return=minimal' },
        body: JSON.stringify({
          autor_id: usuarioId ? Number(usuarioId) : null,
          autor_tipo: tipoAcesso,
          autor_nome: autorNome,
          musica,
          descricao,
          status: 'pendente'
        })
      });

      if (!resp.ok) throw new Error('Falha ao enviar');

      inputMusica.value = '';
      descricaoInput.value = '';
      if (window.avisoSite) window.avisoSite('Sugestão enviada! Obrigado por ajudar a completar a playlist do Lucas.', '🎵');
      if (isAdmin) carregarSugestoes();
    } catch (e) {
      musicaErro.textContent = 'Não foi possível enviar agora. Tente novamente.';
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

      // Avisa a pessoa pelo sino, se ela tiver conta no site
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

    if (item.descricao) {
      const descEl = document.createElement('p');
      descEl.className = 'sugestao-musica-descricao';
      descEl.textContent = item.descricao;
      cartao.appendChild(descEl);
    }

    const meta = document.createElement('p');
    meta.className = 'sugestao-musica-meta';
    meta.textContent = `— ${item.autor_nome || 'Anônimo'} · ${formatarData(item.criado_em)}`;
    cartao.appendChild(meta);

    const selo = document.createElement('span');
    selo.className = 'sugestao-status';
    selo.textContent = item.status === 'adicionada' ? 'Adicionada ✓' : 'Aguardando';
    cartao.appendChild(selo);

    if (item.status !== 'adicionada') {
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
        vazio.textContent = 'Nenhuma sugestão recebida ainda.';
        listaEl.appendChild(vazio);
        return;
      }

      dados.forEach(item => listaEl.appendChild(criarCartaoSugestao(item)));
    } catch (e) {
      listaEl.innerHTML = '<p class="hint-text">Não foi possível carregar as sugestões agora.</p>';
    }
  }
})();
