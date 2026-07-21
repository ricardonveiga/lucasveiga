(function(){
  // Página pública de Músicas: só o envio de sugestões. A moderação
  // (ver sugestões, marcar como adicionada) fica no Painel Admin.
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

  const autorInput = document.getElementById('sugestaoAutor');
  const autorErro = document.getElementById('sugestaoAutorErro');
  const inputMusica = document.getElementById('musicaSugerida');
  const musicaErro = document.getElementById('musicaSugeridaErro');
  const descricaoInput = document.getElementById('musicaDescricao');
  const descricaoErro = document.getElementById('musicaDescricaoErro');
  const btnEnviar = document.getElementById('btnSugerirMusica');

  // Qualquer pessoa pode sugerir — pré-preenche o nome de quem já está
  // logado, mas deixa editável.
  if (autorInput && nomeUsuario) autorInput.value = nomeUsuario;

  [inputMusica, descricaoInput].forEach(campo => {
    if (campo && window.anexarSeletorEmoji) window.anexarSeletorEmoji(campo);
  });

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
      const resp = await window.supaFetch(`${SUPABASE_URL}/rest/v1/sugestoes_musicas`, {
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
    } catch (e) {
      musicaErro.textContent = 'Não foi possível enviar agora. Tente novamente.';
    }

    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar sugestão ♥';
  }

  if (btnEnviar) btnEnviar.addEventListener('click', enviarSugestao);
})();
