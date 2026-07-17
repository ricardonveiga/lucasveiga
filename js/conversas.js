const SUPABASE_GET_UPLOAD_URL_CONV = 'https://igvtlqkkflpjrgasapos.supabase.co/functions/v1/get-upload-url';
const SUPABASE_SALVAR_CONVERSA_URL = 'https://igvtlqkkflpjrgasapos.supabase.co/functions/v1/salvar-conversa';
const SUPABASE_PUBLISHABLE_KEY_CONV = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

function sanitizeFileNameConversa(nome){
  const timestamp = Date.now();
  const aleatorio = Math.random().toString(36).slice(2, 8);
  const limpo = nome.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `${timestamp}-${aleatorio}-${limpo}`;
}

async function enviarArquivoConversa(arquivo, tipo, texto, visibilidade, autorId, autorNome){
  // Passo 1: autorização de upload (não toca no arquivo).
  const respAutorizacao = await fetch(SUPABASE_GET_UPLOAD_URL_CONV, {
    headers: {
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY_CONV}`,
      apikey: SUPABASE_PUBLISHABLE_KEY_CONV
    }
  });
  const autorizacao = await respAutorizacao.json();
  if (!respAutorizacao.ok || autorizacao.erro) {
    throw new Error(autorizacao.erro || 'Não foi possível preparar o envio.');
  }

  // Passo 2: envia o arquivo direto do navegador pro Backblaze.
  const nomeArquivo = sanitizeFileNameConversa(arquivo.name);
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

  const urlArquivo = `${autorizacao.downloadUrl}/file/${autorizacao.bucketName}/${nomeArquivo}`;

  // Passo 3: avisa o Supabase pra salvar os dados.
  const respSalvar = await fetch(SUPABASE_SALVAR_CONVERSA_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY_CONV}`,
      apikey: SUPABASE_PUBLISHABLE_KEY_CONV,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tipo,
      url_arquivo: urlArquivo,
      texto_lembranca: texto,
      visibilidade,
      autor_id: autorId,
      autor_nome: autorNome
    })
  });

  const resultado = await respSalvar.json();
  if (!respSalvar.ok || resultado.erro) {
    throw new Error(resultado.erro || 'Erro desconhecido ao salvar.');
  }
  return resultado;
}

async function salvarConversaSoTexto(texto, visibilidade, autorId, autorNome){
  const resp = await fetch(SUPABASE_SALVAR_CONVERSA_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY_CONV}`,
      apikey: SUPABASE_PUBLISHABLE_KEY_CONV,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tipo: 'print',
      url_arquivo: '',
      texto_lembranca: texto,
      visibilidade,
      autor_id: autorId,
      autor_nome: autorNome
    })
  });
  const resultado = await resp.json();
  if (!resp.ok || resultado.erro) {
    throw new Error(resultado.erro || 'Erro desconhecido ao salvar.');
  }
  return resultado;
}

const btnPublicarConversa = document.getElementById('btnPublicarConversa');
if (btnPublicarConversa) {
  btnPublicarConversa.addEventListener('click', async () => {
    if (typeof nivelDeAcessoAtual === 'function' && nivelDeAcessoAtual() === 'visitante') {
      window.avisoSite('Adicionar conversas é exclusivo para membros e família.', '🔒');
      return;
    }

    const texto = document.getElementById('conversaTexto').value.trim();
    const printsInput = document.getElementById('conversaPrint');
    const audioInput = document.getElementById('conversaAudio');
    const checkboxes = document.querySelectorAll('input[name="visibilidadeConversa"]:checked');

    const temPrints = printsInput.files.length > 0;
    const temAudio = audioInput.files.length > 0;

    if (!texto && !temPrints && !temAudio) {
      window.avisoSite('Envie um print, um áudio ou escreva algo antes de publicar.', '📎');
      return;
    }
    if (checkboxes.length === 0) {
      window.avisoSite('Selecione ao menos uma opção de visibilidade.', '👀');
      return;
    }

    const visibilidade = checkboxes[0].value;
    const autorId = sessionStorage.getItem('usuarioId') || '';
    const autorNome = sessionStorage.getItem('nomeUsuario') || 'Anônimo';

    const totalArquivos = printsInput.files.length + (temAudio ? 1 : 0);
    let enviados = 0;
    let falharam = 0;

    btnPublicarConversa.disabled = true;
    const textoOriginalBtn = btnPublicarConversa.textContent;

    async function atualizarProgresso(){
      if (totalArquivos > 0) {
        btnPublicarConversa.textContent = `Enviando ${enviados + falharam} de ${totalArquivos}...`;
      } else {
        btnPublicarConversa.textContent = 'Salvando...';
      }
    }
    atualizarProgresso();

    try {
      for (const arquivo of printsInput.files) {
        try {
          await enviarArquivoConversa(arquivo, 'print', texto, visibilidade, autorId, autorNome);
          enviados++;
        } catch (erro) {
          console.error('Falha ao enviar print:', arquivo.name, erro);
          falharam++;
        }
        atualizarProgresso();
      }

      if (temAudio) {
        try {
          await enviarArquivoConversa(audioInput.files[0], 'audio', texto, visibilidade, autorId, autorNome);
          enviados++;
        } catch (erro) {
          console.error('Falha ao enviar áudio:', erro);
          falharam++;
        }
        atualizarProgresso();
      }

      // Se só tinha texto (sem nenhum arquivo), salva mesmo assim como um
      // registro de conversa sem mídia.
      if (!temPrints && !temAudio && texto) {
        await salvarConversaSoTexto(texto, visibilidade, autorId, autorNome);
        enviados++;
      }

      if (falharam > 0 && enviados > 0) {
        window.avisoSite(`${enviados} arquivo(s) publicado(s) com sucesso, mas ${falharam} falharam. Tente reenviar os que falharam.`, '⚠️');
      } else if (falharam > 0 && enviados === 0) {
        window.avisoSite('Não foi possível publicar agora. Tente novamente.', '❌');
      } else {
        const mensagemAprovacao = visibilidade === 'privado'
          ? 'Já ficou disponível para você, sem precisar de aprovação.'
          : 'Vai aparecer para outras pessoas assim que for aprovada pelo administrador.';
        window.avisoSite(`Conversa adicionada! ${mensagemAprovacao}`, '✅');
      }

      document.getElementById('conversaTexto').value = '';
      printsInput.value = '';
      audioInput.value = '';
      document.querySelectorAll('input[name="visibilidadeConversa"]').forEach(c => (c.checked = false));

      if (typeof carregarConversas === 'function') carregarConversas();
    } finally {
      btnPublicarConversa.disabled = false;
      btnPublicarConversa.textContent = textoOriginalBtn;
    }
  });
}
