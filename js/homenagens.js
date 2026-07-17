const SUPABASE_GET_UPLOAD_URL_HOM = 'https://igvtlqkkflpjrgasapos.supabase.co/functions/v1/get-upload-url';
const SUPABASE_SALVAR_HOMENAGEM_URL = 'https://igvtlqkkflpjrgasapos.supabase.co/functions/v1/salvar-homenagem';
const SUPABASE_PUBLISHABLE_KEY_HOM = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

function sanitizeFileNameHomenagem(nome){
  const timestamp = Date.now();
  const aleatorio = Math.random().toString(36).slice(2, 8);
  const limpo = nome.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `${timestamp}-${aleatorio}-${limpo}`;
}

function nivelAtualHomenagem(){
  const tipoAcesso = sessionStorage.getItem('tipoAcesso');
  if (tipoAcesso !== 'membro') return 'visitante';
  const grupo = sessionStorage.getItem('grupoUsuario');
  return grupo === 'familia' ? 'familia' : 'membro';
}

async function enviarArquivoHomenagem(arquivo, tipo, texto, visibilidade, autorId, autorNome, autorGrupo){
  let urlArquivo = '';

  if (arquivo) {
    const respAutorizacao = await fetch(SUPABASE_GET_UPLOAD_URL_HOM, {
      headers: {
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY_HOM}`,
        apikey: SUPABASE_PUBLISHABLE_KEY_HOM
      }
    });
    const autorizacao = await respAutorizacao.json();
    if (!respAutorizacao.ok || autorizacao.erro) {
      throw new Error(autorizacao.erro || 'Não foi possível preparar o envio.');
    }

    const nomeArquivo = sanitizeFileNameHomenagem(arquivo.name);
    const respUpload = await fetch(autorizacao.uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: autorizacao.authorizationToken,
        'X-Bz-File-Name': encodeURIComponent(nomeArquivo),
        'Content-Type': arquivo.type || 'b2/x-auto',
        'X-Bz-Content-Sha1': 'do_not_verify'
      },
      body: arquivo
    });
    if (!respUpload.ok) {
      throw new Error('Falha ao enviar o arquivo para o armazenamento.');
    }

    urlArquivo = `${autorizacao.downloadUrl}/file/${autorizacao.bucketName}/${nomeArquivo}`;
  }

  const respSalvar = await fetch(SUPABASE_SALVAR_HOMENAGEM_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY_HOM}`,
      apikey: SUPABASE_PUBLISHABLE_KEY_HOM,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tipo,
      url_arquivo: urlArquivo,
      texto,
      visibilidade,
      autor_id: autorId,
      autor_nome: autorNome,
      autor_grupo: autorGrupo
    })
  });

  const resultado = await respSalvar.json();
  if (!respSalvar.ok || resultado.erro) {
    throw new Error(resultado.erro || 'Erro desconhecido ao salvar.');
  }
  return resultado;
}

const btnPublicarHomenagem = document.getElementById('btnPublicarHomenagem');
if (btnPublicarHomenagem) {
  btnPublicarHomenagem.addEventListener('click', async () => {
    const nivel = nivelAtualHomenagem();
    if (nivel === 'visitante') {
      window.avisoSite('Deixar uma homenagem é exclusivo para membros e família.', '🔒');
      return;
    }

    const texto = document.getElementById('homenagemTexto').value.trim();
    const arquivoInput = document.getElementById('homenagemArquivo');
    const checkboxes = document.querySelectorAll('input[name="visibilidadeHomenagem"]:checked');
    const arquivo = arquivoInput.files.length > 0 ? arquivoInput.files[0] : null;

    if (!texto && !arquivo) {
      window.avisoSite('Escreva sua homenagem ou anexe uma foto/vídeo antes de publicar.', '💐');
      return;
    }
    if (checkboxes.length === 0) {
      window.avisoSite('Selecione ao menos uma opção de visibilidade.', '👀');
      return;
    }

    const visibilidade = checkboxes[0].value;
    const autorId = sessionStorage.getItem('usuarioId') || '';
    const autorNome = sessionStorage.getItem('nomeUsuario') || 'Anônimo';
    const tipo = arquivo && arquivo.type.startsWith('video') ? 'video' : 'foto';

    btnPublicarHomenagem.disabled = true;
    const textoOriginalBtn = btnPublicarHomenagem.textContent;
    btnPublicarHomenagem.textContent = 'Publicando...';

    try {
      await enviarArquivoHomenagem(arquivo, tipo, texto, visibilidade, autorId, autorNome, nivel);

      const mensagemAprovacao = visibilidade === 'privado'
        ? 'Já ficou disponível para você, sem precisar de aprovação.'
        : 'Vai aparecer para outras pessoas assim que for aprovada pelo administrador.';
      window.avisoSite(`Homenagem publicada! ${mensagemAprovacao}`, '💐');

      document.getElementById('homenagemTexto').value = '';
      arquivoInput.value = '';
      document.querySelectorAll('input[name="visibilidadeHomenagem"]').forEach(c => (c.checked = false));

      if (typeof carregarHomenagens === 'function') carregarHomenagens();
    } catch (erro) {
      window.avisoSite('Não foi possível publicar agora. Detalhe: ' + erro.message, '❌');
    } finally {
      btnPublicarHomenagem.disabled = false;
      btnPublicarHomenagem.textContent = textoOriginalBtn;
    }
  });
}
