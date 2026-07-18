const SUPABASE_FUNCTIONS_URL_SONHO = 'https://igvtlqkkflpjrgasapos.supabase.co/functions/v1/upload-sonho';
const SUPABASE_PUBLISHABLE_KEY_SONHO = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

const chkPrivado = document.querySelector('input[name="visibilidadeSonho"][value="privado"]');
const chkFamiliaGlobal = document.querySelector('input[name="visibilidadeSonho"][value="familia"]');
const chkMembrosGlobal = document.querySelector('input[name="visibilidadeSonho"][value="membros"]');

// "Não compartilhar" é exclusivo: marcar ela desmarca as outras, e vice-versa.
if (chkPrivado && chkFamiliaGlobal && chkMembrosGlobal) {
  chkPrivado.addEventListener('change', () => {
    if (chkPrivado.checked) {
      chkFamiliaGlobal.checked = false;
      chkMembrosGlobal.checked = false;
    }
  });
  [chkFamiliaGlobal, chkMembrosGlobal].forEach(chk => {
    chk.addEventListener('change', () => {
      if (chk.checked) chkPrivado.checked = false;
    });
  });
}

const btnPublicarSonho = document.getElementById('btnPublicarSonho');
if (btnPublicarSonho) {

  btnPublicarSonho.addEventListener('click', async () => {
    const texto = document.getElementById('sonhoTexto').value.trim();
    const fotoInput = document.getElementById('sonhoFoto');
    const videoInput = document.getElementById('sonhoVideo');
    const chkMembros = document.querySelector('input[name="visibilidadeSonho"][value="membros"]');
    const chkFamilia = document.querySelector('input[name="visibilidadeSonho"][value="familia"]');
    const autorInput = document.getElementById('sonhoAutor');
    const autorErro = document.getElementById('sonhoAutorErro');
    const btn = btnPublicarSonho;

    autorErro.textContent = '';
    autorInput.style.borderColor = '';

    const temFoto = fotoInput.files.length > 0;
    const temVideo = videoInput.files.length > 0;

    if (!texto && !temFoto && !temVideo) {
      window.avisoSite('Escreva o que sonhou ou sentiu, ou envie uma foto/vídeo antes de publicar.', '🌙');
      return;
    }

    if (!autorInput.value.trim()) {
      autorInput.style.borderColor = '#e07a7a';
      autorErro.textContent = 'Identifique-se antes de publicar — escreva seu nome.';
      autorInput.focus();
      return;
    }

    let visibilidade;
    if (chkMembros.checked && chkFamilia.checked) visibilidade = 'ambos';
    else if (chkMembros.checked) visibilidade = 'membros';
    else if (chkFamilia.checked) visibilidade = 'familia';
    else visibilidade = 'privado';

    const autorNome = autorInput.value.trim();
    const usuarioId = sessionStorage.getItem('usuarioId') || '';

    const formData = new FormData();
    formData.append('texto', texto);
    formData.append('autor_nome', autorNome);
    formData.append('visibilidade', visibilidade);
    formData.append('usuario_id', usuarioId);
    formData.append('autor_tipo', sessionStorage.getItem('tipoAcesso') === 'membro' ? 'membro' : 'visitante');
    if (temFoto) formData.append('foto', fotoInput.files[0]);
    if (temVideo) formData.append('video', videoInput.files[0]);

    btn.disabled = true;
    const textoOriginalBtn = btn.textContent;
    btn.textContent = 'Publicando...';

    try {
      const resposta = await fetch(SUPABASE_FUNCTIONS_URL_SONHO, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY_SONHO}`,
          apikey: SUPABASE_PUBLISHABLE_KEY_SONHO
        },
        body: formData
      });

      const resultado = await resposta.json();
      if (!resposta.ok || resultado.erro) {
        throw new Error(resultado.erro || 'Erro desconhecido ao enviar.');
      }

      const mensagensAprovacao = {
        privado: 'já ficou disponível só para você, sem precisar de aprovação.',
        membros: 'aparecerá para os membros assim que for aprovado pelo administrador.',
        familia: 'aparecerá para a família assim que for aprovado pelo administrador.',
        ambos: 'aparecerá para os membros e a família assim que for aprovado pelo administrador.'
      };

      window.avisoSite(`Registrado! Ele ${mensagensAprovacao[visibilidade]}`, '✨');

      document.getElementById('sonhoTexto').value = '';
      fotoInput.value = '';
      videoInput.value = '';
      autorInput.value = '';
      chkMembros.checked = false;
      chkFamilia.checked = false;
      if (chkPrivado) chkPrivado.checked = false;

      if (typeof carregarSonhos === 'function') carregarSonhos();

    } catch (erro) {
      window.avisoSite('Não foi possível publicar agora. Detalhe: ' + erro.message, '❌');
    } finally {
      btn.disabled = false;
      btn.textContent = textoOriginalBtn;
    }
  });
}