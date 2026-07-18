(function(){
  // Preenche o banner inteiro sem NUNCA cortar pássaros, silhueta ou
  // assinatura. Como a imagem original é mais "quadrada" que o banner em
  // telas largas, o object-fit:cover sozinho seria obrigado a cortar o
  // topo/base. Este script resolve isso montando, no próprio navegador,
  // uma versão mais larga da imagem: o núcleo (pássaros, silhueta,
  // assinatura) entra sempre inteiro e no tamanho real, sem corte e sem
  // escala; as bordas dele mesmo se dissolvem em degradê sobre uma
  // extensão de céu (espelhado e desfocado) que preenche os lados —
  // sem linha de emenda visível. Roda de novo a cada redimensionamento
  // de tela: totalmente responsivo.

  const IMG_SRC = 'images/bannersuperior_dashboard5.png';
  const FATIA_BASE = 260;   // amostra de céu usada para esticar a extensão lateral
  const BLUR_BASE = 26;     // desfoque da extensão (px)
  const FADE_W = 110;       // largura da transição em degradê nas bordas do núcleo

  const banner = document.querySelector('.hero-banner');
  const img = banner ? banner.querySelector('.hero-slide-default .hero-image') : null;
  if (!banner || !img) return;

  let imagemOriginal = null;
  let ultimaChaveGerada = null;

  function carregarImagemOriginal(){
    return new Promise((resolve) => {
      if (imagemOriginal) { resolve(imagemOriginal); return; }
      const im = new Image();
      im.onload = () => { imagemOriginal = im; resolve(im); };
      im.onerror = () => resolve(null);
      im.src = IMG_SRC;
    });
  }

  function suportaFilterCanvas(){
    try {
      return 'filter' in document.createElement('canvas').getContext('2d');
    } catch(e){
      return false;
    }
  }
  const TEM_BLUR = suportaFilterCanvas();

  // Desenha a extensão de céu de um dos lados: espelha uma fatia da
  // própria borda da imagem, estica até a largura necessária e desfoca.
  // "larguraTotal" já inclui a sobreposição por baixo do núcleo (fadeW
  // extra), fechando qualquer fresta na emenda.
  function desenharExtensao(ctx, origem, ladoEsquerdo, larguraTotal, H, destXBase){
    if (larguraTotal <= 0) return;
    ctx.save();
    if (ladoEsquerdo) {
      ctx.translate(larguraTotal, 0);
      ctx.scale(-1, 1);
      if (TEM_BLUR) ctx.filter = `blur(${BLUR_BASE}px)`;
      ctx.drawImage(origem, 0, 0, FATIA_BASE, H, 0, 0, larguraTotal, H);
    } else {
      ctx.translate(destXBase + larguraTotal, 0);
      ctx.scale(-1, 1);
      if (TEM_BLUR) ctx.filter = `blur(${BLUR_BASE}px)`;
      ctx.drawImage(origem, origem.width - FATIA_BASE, 0, FATIA_BASE, H, 0, 0, larguraTotal, H);
    }
    ctx.restore();
  }

  // Prepara o núcleo (imagem original, sem corte, sem escala) com as
  // bordas esquerda/direita em degradê de transparência — é isso que
  // dissolve a emenda em vez de deixar um corte reto.
  function nucleoComFade(origem){
    const W = origem.width, H = origem.height;
    const nucleo = document.createElement('canvas');
    nucleo.width = W;
    nucleo.height = H;
    const ctx = nucleo.getContext('2d');
    ctx.drawImage(origem, 0, 0);

    const fw = Math.min(FADE_W, Math.floor(W / 4));

    const gradEsq = ctx.createLinearGradient(0, 0, fw, 0);
    gradEsq.addColorStop(0, 'rgba(0,0,0,1)');
    gradEsq.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = gradEsq;
    ctx.fillRect(0, 0, fw, H);
    ctx.restore();

    const gradDir = ctx.createLinearGradient(W - fw, 0, W, 0);
    gradDir.addColorStop(0, 'rgba(0,0,0,0)');
    gradDir.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = gradDir;
    ctx.fillRect(W - fw, 0, fw, H);
    ctx.restore();

    return { canvas: nucleo, fw };
  }

  async function atualizarBanner(){
    const origem = await carregarImagemOriginal();
    if (!origem) return; // se algo falhar, o <img> original continua aparecendo normalmente

    const larguraBox = banner.clientWidth;
    const alturaBox = banner.clientHeight;
    if (!larguraBox || !alturaBox) return;

    const razaoBox = larguraBox / alturaBox;
    const razaoImagem = origem.width / origem.height;

    // Banner mais "alto" (ou igual) que a imagem: o cover comum já
    // preenche tudo sem cortar nada de importante. Só entra em ação
    // quando o banner fica mais largo que a proporção da imagem.
    if (razaoBox <= razaoImagem + 0.01) {
      if (img.src.indexOf('data:') === 0) img.src = IMG_SRC;
      ultimaChaveGerada = null;
      return;
    }

    const chave = razaoBox.toFixed(2);
    if (chave === ultimaChaveGerada) return; // evita reprocessar a cada pixel de resize
    ultimaChaveGerada = chave;

    const H = origem.height;
    const W = origem.width;
    const larguraCanvas = Math.round(H * razaoBox);
    const destX = Math.round((larguraCanvas - W) / 2);
    const larguraDireita = larguraCanvas - destX - W;

    const { canvas: nucleo, fw } = nucleoComFade(origem);

    const canvas = document.createElement('canvas');
    canvas.width = larguraCanvas;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Extensões avançam por baixo do núcleo (fw a mais) para não sobrar
    // nenhuma fresta exposta na faixa de transição.
    desenharExtensao(ctx, origem, true, destX + fw, H, 0);
    desenharExtensao(ctx, origem, false, larguraDireita + fw, H, destX + W - fw);

    // O núcleo (com as bordas em degradê) entra por cima, sem corte e
    // sem escala — pássaros, silhueta e assinatura sempre no tamanho real.
    ctx.drawImage(nucleo, destX, 0);

    try {
      img.src = canvas.toDataURL('image/jpeg', 0.92);
    } catch (e) {
      // Se o canvas falhar por qualquer motivo, mantém o arquivo original
      // — nunca quebra a página.
      console.error('Erro ao montar o banner estendido:', e);
    }
  }

  let agendado = null;
  function agendarAtualizacao(){
    if (agendado) return;
    agendado = requestAnimationFrame(() => {
      agendado = null;
      atualizarBanner();
    });
  }

  window.addEventListener('load', agendarAtualizacao);
  window.addEventListener('resize', agendarAtualizacao);
  if (window.ResizeObserver) {
    new ResizeObserver(agendarAtualizacao).observe(banner);
  }
  agendarAtualizacao();
})();
