const SUPABASE_GET_UPLOAD_URL = 'https://igvtlqkkflpjrgasapos.supabase.co/functions/v1/get-upload-url';
const SUPABASE_SALVAR_MIDIA_URL = 'https://igvtlqkkflpjrgasapos.supabase.co/functions/v1/salvar-midia';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

const ANO_MINIMO = 2006;
const ANO_MAXIMO = 2026;

const arquivoInputEl = document.getElementById('conteudoArquivo');
const uploadBoxTextoEl = arquivoInputEl.closest('.upload-box').querySelector('span');
const textoOriginalUpload = uploadBoxTextoEl.innerHTML;

let arquivosAcumulados = [];

// Descobre o que esta página espera (imagem ou vídeo) a partir do atributo
// accept do próprio input — assim o mesmo script funciona certo tanto em
// Fotos (accept="image/*") quanto em Vídeos (accept="video/*").
const tipoEsperado = arquivoInputEl.accept.includes('video')
  ? 'video'
  : arquivoInputEl.accept.includes('image')
    ? 'image'
    : null;
const tipoEsperadoTexto = tipoEsperado === 'video' ? 'vídeo' : 'foto';

const listaArquivosEl = document.createElement('div');
listaArquivosEl.id = 'listaArquivosSelecionados';
listaArquivosEl.className = 'lista-arquivos-selecionados';
arquivoInputEl.closest('.upload-box').insertAdjacentElement('afterend', listaArquivosEl);

function mesmoArquivo(a, b){
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

function renderizarListaArquivos(){
  listaArquivosEl.innerHTML = '';

  if (arquivosAcumulados.length === 0) {
    uploadBoxTextoEl.innerHTML = textoOriginalUpload;
    return;
  }

  uploadBoxTextoEl.innerHTML = `✅ ${arquivosAcumulados.length} arquivo(s) selecionado(s)<br><small>Clique aqui de novo para adicionar mais</small>`;

  const cabecalho = document.createElement('div');
  cabecalho.className = 'lista-arquivos-cabecalho';
  cabecalho.innerHTML = `<span>${arquivosAcumulados.length} arquivo(s) prontos para enviar juntos, com a mesma descrição/ano/evento</span>`;

  const btnLimpar = document.createElement('button');
  btnLimpar.type = 'button';
  btnLimpar.className = 'btn-limpar-selecao';
  btnLimpar.textContent = 'Limpar seleção';
  btnLimpar.addEventListener('click', () => {
    arquivosAcumulados = [];
    arquivoInputEl.value = '';
    renderizarListaArquivos();
  });
  cabecalho.appendChild(btnLimpar);
  listaArquivosEl.appendChild(cabecalho);

  arquivosAcumulados.forEach((arquivo, indice) => {
    const item = document.createElement('div');
    item.className = 'item-arquivo-selecionado';

    const nome = document.createElement('span');
    nome.textContent = arquivo.name;

    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.className = 'btn-remover-arquivo';
    btnRemover.setAttribute('aria-label', 'Remover este arquivo');
    btnRemover.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>';
    btnRemover.addEventListener('click', () => {
      arquivosAcumulados.splice(indice, 1);
      renderizarListaArquivos();
    });

    item.appendChild(nome);
    item.appendChild(btnRemover);
    listaArquivosEl.appendChild(item);
  });
}

arquivoInputEl.addEventListener('change', () => {
  const novos = Array.from(arquivoInputEl.files);
  const rejeitados = [];

  novos.forEach(novo => {
    if (tipoEsperado && !novo.type.startsWith(tipoEsperado + '/')) {
      rejeitados.push(novo.name);
      return;
    }
    const jaExiste = arquivosAcumulados.some(a => mesmoArquivo(a, novo));
    if (!jaExiste) arquivosAcumulados.push(novo);
  });

  arquivoInputEl.value = '';
  renderizarListaArquivos();

  if (rejeitados.length > 0 && window.avisoSite) {
    const mensagem = rejeitados.length === 1
      ? `"${rejeitados[0]}" não é um arquivo de ${tipoEsperadoTexto} e não foi adicionado.`
      : `${rejeitados.length} arquivos não eram de ${tipoEsperadoTexto} e não foram adicionados.`;
    window.avisoSite(mensagem, '⚠️');
  }
});

function sanitizeFileName(nome){
  const timestamp = Date.now();
  const aleatorio = Math.random().toString(36).slice(2, 8);
  const limpo = nome.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `${timestamp}-${aleatorio}-${limpo}`;
}

async function enviarUmArquivo(arquivo, ano, evento, texto, visibilidade, autorId){
  const tipo = arquivo.type.startsWith('video') ? 'video' : 'foto';

  // Passo 1: pede autorização de upload (rápido, não toca no arquivo).
  const respAutorizacao = await fetch(SUPABASE_GET_UPLOAD_URL, {
    headers: {
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      apikey: SUPABASE_PUBLISHABLE_KEY
    }
  });
  const autorizacao = await respAutorizacao.json();
  if (!respAutorizacao.ok || autorizacao.erro) {
    throw new Error(autorizacao.erro || 'Não foi possível preparar o envio.');
  }

  // Passo 2: envia o arquivo direto do navegador pro Backblaze, sem passar
  // pelo Supabase. É por isso que arquivos grandes (vídeos) não estouram
  // mais limite de tempo/memória de function.
  const nomeArquivo = sanitizeFileName(arquivo.name);
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

  // Passo 3: avisa o Supabase pra salvar os dados (rápido, só texto).
  const respSalvar = await fetch(SUPABASE_SALVAR_MIDIA_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      apikey: SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tipo,
      descricao: texto,
      ano,
      nome_evento: evento,
      visibilidade,
      autor_id: autorId,
      autor_tipo: sessionStorage.getItem('tipoAcesso') === 'membro' ? 'membro' : 'visitante',
      url_arquivo: urlArquivo
    })
  });

  const resultado = await respSalvar.json();
  if (!respSalvar.ok || resultado.erro) {
    throw new Error(resultado.erro || 'Erro desconhecido ao salvar.');
  }
  return resultado;
}

document.getElementById('btnPublicar').addEventListener('click', async () => {
  const textoEl = document.getElementById('conteudoTexto');
  const anoEl = document.getElementById('conteudoAno');
  const eventoEl = document.getElementById('conteudoEvento');
  const btn = document.getElementById('btnPublicar');

  const texto = textoEl.value.trim();
  const ano = anoEl.value.trim();
  const evento = eventoEl.value.trim();
  const arquivos = arquivosAcumulados;
  const checkboxes = document.querySelectorAll('input[name="visibilidade"]:checked');

  if (arquivos.length === 0) {
    window.avisoSite('Selecione uma ou mais fotos/vídeos antes de publicar.', '📎');
    return;
  }
  if (!ano) {
    anoEl.focus();
    window.avisoSite('Informe o ano — é obrigatório para organizar a linha do tempo.', '📅');
    return;
  }
  const anoNumero = Number(ano);
  if (!Number.isInteger(anoNumero) || anoNumero < ANO_MINIMO || anoNumero > ANO_MAXIMO) {
    anoEl.focus();
    window.avisoSite(`O ano precisa estar entre ${ANO_MINIMO} e ${ANO_MAXIMO}.`, '📅');
    return;
  }
  if (!evento) {
    eventoEl.focus();
    window.avisoSite('Informe o nome do evento ou momento — é obrigatório.', '🏷️');
    return;
  }
  if (checkboxes.length === 0) {
    window.avisoSite('Selecione ao menos uma opção de visibilidade.', '👀');
    return;
  }

  const visibilidade = checkboxes[0].value;
  const autorId = sessionStorage.getItem('usuarioId') || '';

  btn.disabled = true;
  const textoOriginalBtn = btn.textContent;

  let sucesso = 0;
  let falhas = 0;

  for (let i = 0; i < arquivos.length; i++) {
    btn.textContent = arquivos.length > 1
      ? `Enviando ${i + 1} de ${arquivos.length}...`
      : 'Enviando...';

    try {
      await enviarUmArquivo(arquivos[i], ano, evento, texto, visibilidade, autorId);
      sucesso++;
    } catch (erro) {
      falhas++;
      console.error('Falha ao enviar arquivo:', arquivos[i].name, erro);
    }
  }

  btn.disabled = false;
  btn.textContent = textoOriginalBtn;

  const mensagemAprovacao = visibilidade === 'privado'
    ? 'já ficou disponível para você, sem precisar de aprovação.'
    : 'aparecerá para outras pessoas assim que for aprovado pelo administrador.';

  if (sucesso > 0 && falhas === 0) {
    const mensagemFinal = arquivos.length === 1
      ? `Conteúdo adicionado em "${evento}" (${ano})! Ele ${mensagemAprovacao}`
      : `${sucesso} arquivos adicionados em "${evento}" (${ano})! Eles ${mensagemAprovacao}`;
    window.avisoSite(mensagemFinal, '✅');

    arquivosAcumulados = [];
    arquivoInputEl.value = '';
    textoEl.value = '';
    anoEl.value = '';
    eventoEl.value = '';
    checkboxes.forEach(c => (c.checked = false));
    renderizarListaArquivos();

  } else if (sucesso > 0 && falhas > 0) {
    window.avisoSite(`${sucesso} arquivo(s) publicado(s) com sucesso, mas ${falhas} falharam. Tente reenviar os que falharam.`, '⚠️');
  } else {
    window.avisoSite('Não foi possível publicar agora. Tente novamente em instantes.', '❌');
  }
});