const SUPABASE_FUNCTIONS_URL_RECADO = 'https://igvtlqkkflpjrgasapos.supabase.co/functions/v1/upload-recado';
const SUPABASE_PUBLISHABLE_KEY_RECADO = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

const methodTabs = document.querySelectorAll('.method-tab');
const methodPanels = document.querySelectorAll('.method-panel');

methodTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    methodTabs.forEach(t => t.classList.remove('active'));
    methodPanels.forEach(p => p.classList.remove('active'));

    tab.classList.add('active');
    const metodo = tab.getAttribute('data-method');
    document.getElementById(
      metodo === 'tela' ? 'painelTela' :
      metodo === 'foto' ? 'painelFoto' : 'painelDigitar'
    ).classList.add('active');
  });
});

const canvas = document.getElementById('recadoCanvas');
let desenhoVazio = true;

if (canvas) {
  const ctx = canvas.getContext('2d');

  function ajustarCanvas(){
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const corTinta = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#f2f4f8';
    ctx.strokeStyle = corTinta;
  }
  ajustarCanvas();
  window.addEventListener('resize', ajustarCanvas);

  let desenhando = false;

  function posicao(e){
    const rect = canvas.getBoundingClientRect();
    const ponto = e.touches ? e.touches[0] : e;
    return { x: ponto.clientX - rect.left, y: ponto.clientY - rect.top };
  }

  function iniciarTraço(e){
    desenhando = true;
    desenhoVazio = false;
    const p = posicao(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    e.preventDefault();
  }
  function continuarTraço(e){
    if (!desenhando) return;
    const p = posicao(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    e.preventDefault();
  }
  function pararTraço(){
    desenhando = false;
  }

  canvas.addEventListener('mousedown', iniciarTraço);
  canvas.addEventListener('mousemove', continuarTraço);
  window.addEventListener('mouseup', pararTraço);
  canvas.addEventListener('touchstart', iniciarTraço, { passive: false });
  canvas.addEventListener('touchmove', continuarTraço, { passive: false });
  canvas.addEventListener('touchend', pararTraço);

  document.getElementById('limparAssinatura').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenhoVazio = true;
  });
}

function canvasParaBlob(canvasEl){
  return new Promise(resolve => {
    canvasEl.toBlob(blob => resolve(blob), 'image/png');
  });
}

document.getElementById('btnPublicarRecado').addEventListener('click', async () => {
  const metodoAtivo = document.querySelector('.method-tab.active').getAttribute('data-method');
  const texto = document.getElementById('recadoTexto').value.trim();
  const arquivoFotoInput = document.getElementById('recadoFoto');
  const checkboxes = document.querySelectorAll('input[name="visibilidadeRecado"]:checked');
  const autorInput = document.getElementById('recadoAutor');
  const autorErro = document.getElementById('recadoAutorErro');
  const btn = document.getElementById('btnPublicarRecado');

  autorErro.textContent = '';
  autorInput.style.borderColor = '';

  let temConteudo = false;
  if (metodoAtivo === 'tela') temConteudo = !desenhoVazio;
  if (metodoAtivo === 'foto') temConteudo = arquivoFotoInput.files.length > 0;
  if (metodoAtivo === 'digitar') temConteudo = texto.length > 0;

  if (!temConteudo) {
    const mensagens = {
      tela: 'Escreva sua mensagem na tela antes de publicar.',
      foto: 'Envie a foto da sua mensagem escrita à mão antes de publicar.',
      digitar: 'Digite sua mensagem antes de publicar.'
    };
    window.avisoSite(mensagens[metodoAtivo], '✍️');
    return;
  }

  if (!autorInput.value.trim()) {
    autorInput.style.borderColor = '#e07a7a';
    autorErro.textContent = 'Identifique-se para deixar o recado — escreva seu nome.';
    autorInput.focus();
    return;
  }

  if (checkboxes.length === 0) {
    window.avisoSite('Selecione ao menos uma opção de visibilidade.', '👀');
    return;
  }

  const visibilidade = checkboxes[0].value;
  const autorNome = autorInput.value.trim();
  const usuarioId = sessionStorage.getItem('usuarioId') || '';

  const formData = new FormData();
  formData.append('metodo', metodoAtivo === 'digitar' ? 'digitado' : metodoAtivo);
  formData.append('texto', texto);
  formData.append('autor_nome', autorNome);
  formData.append('visibilidade', visibilidade);
  formData.append('usuario_id', usuarioId);
  formData.append('autor_tipo', sessionStorage.getItem('tipoAcesso') === 'membro' ? 'membro' : 'visitante');

  if (metodoAtivo === 'tela') {
    const blob = await canvasParaBlob(canvas);
    formData.append('arquivo', blob, 'recado-tela.png');
  } else if (metodoAtivo === 'foto') {
    formData.append('arquivo', arquivoFotoInput.files[0]);
  }

  btn.disabled = true;
  const textoOriginalBtn = btn.textContent;
  btn.textContent = 'Publicando...';

  try {
    const resposta = await fetch(SUPABASE_FUNCTIONS_URL_RECADO, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY_RECADO}`,
        apikey: SUPABASE_PUBLISHABLE_KEY_RECADO
      },
      body: formData
    });

    const resultado = await resposta.json();
    if (!resposta.ok || resultado.erro) {
      throw new Error(resultado.erro || 'Erro desconhecido ao enviar.');
    }

    const mensagemAprovacao = visibilidade === 'privado'
      ? 'já ficou disponível para você, sem precisar de aprovação.'
      : 'aparecerá para outras pessoas assim que for aprovado pelo administrador.';

    window.avisoSite(`Recado adicionado! Ele ${mensagemAprovacao}`, '✅');

    document.getElementById('recadoTexto').value = '';
    arquivoFotoInput.value = '';
    autorInput.value = '';
    checkboxes.forEach(c => (c.checked = false));
    if (canvas) {
      const ctx2 = canvas.getContext('2d');
      ctx2.clearRect(0, 0, canvas.width, canvas.height);
      desenhoVazio = true;
    }

    if (typeof carregarRecadosMural === 'function') carregarRecadosMural();

  } catch (erro) {
    window.avisoSite('Não foi possível publicar agora. Detalhe: ' + erro.message, '❌');
  } finally {
    btn.disabled = false;
    btn.textContent = textoOriginalBtn;
  }
});