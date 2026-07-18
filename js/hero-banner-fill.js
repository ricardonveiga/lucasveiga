(function(){
  // Preenche o banner inteiro sem NUNCA cortar pássaros, silhueta ou
  // assinatura. Como a imagem original é mais "quadrada" que o banner em
  // telas largas, o object-fit:cover sozinho seria obrigado a cortar o
  // topo/base. Este script resolve isso montando, no próprio navegador,
  // uma versão mais larga da imagem: mantém o arquivo original intacto e
  // sem nenhum corte no centro, e estende só as bordas laterais com o
  // próprio céu da imagem (espelhado e desfocado). Roda de novo sempre
  // que a tela for redimensionada — totalmente responsivo.

  const IMG_SRC = 'images/bannersuperior_dashboard5.png';
  const FATIA_ESPELHO = 90; // largura da amostra de céu usada para estender cada lado

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
      const c = document.createElement('canvas').getContext('2d');
      return 'filter' in c;
    } catch(e){
      return false;
    }
  }
  const TEM_BLUR = suportaFilterCanvas();

  async function atualizarBanner(){
    const origem = await carregarImagemOriginal();
    if (!origem) return; // se algo falhar, o <img> normal continua exibindo o arquivo original

    const larguraBox = banner.clientWidth;
    const alturaBox = banner.clientHeight;
    if (!larguraBox || !alturaBox) return;

    const razaoBox = larguraBox / alturaBox;
    const razaoImagem = origem.width / origem.height;

    // Banner mais "alto" (ou igual) que a imagem: o cover comum já
    // preenche tudo sem precisar cortar nada de importante. Só entra em
    // ação quando o banner fica mais largo que a proporção da imagem.
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

    const canvas = document.createElement('canvas');
    canvas.width = larguraCanvas;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Faixa esquerda: espelha a borda esquerda da própria imagem e
    // estica até preencher o espaço, com desfoque para dissolver a
    // repetição — mesma técnica usada em fotos de capa profissionais.
    if (destX > 0) {
      ctx.save();
      ctx.translate(destX, 0);
      ctx.scale(-1, 1);
      if (TEM_BLUR) ctx.filter = 'blur(16px)';
      ctx.drawImage(origem, 0, 0, FATIA_ESPELHO, H, 0, 0, destX, H);
      ctx.restore();
    }

    // Faixa direita: mesma lógica, espelhando a borda direita.
    if (larguraDireita > 0) {
      ctx.save();
      ctx.translate(destX + W + larguraDireita, 0);
      ctx.scale(-1, 1);
      if (TEM_BLUR) ctx.filter = 'blur(16px)';
      ctx.drawImage(origem, W - FATIA_ESPELHO, 0, FATIA_ESPELHO, H, 0, 0, larguraDireita, H);
      ctx.restore();
    }

    // A imagem original entra por cima, 100% nítida, sem nenhum corte —
    // pássaros, silhueta e assinatura sempre inteiros, no tamanho real.
    ctx.drawImage(origem, destX, 0);

    try {
      img.src = canvas.toDataURL('image/jpeg', 0.92);
    } catch (e) {
      // Se por algum motivo o canvas falhar (ex: navegador muito antigo),
      // mantém o arquivo original — nunca quebra a página.
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
