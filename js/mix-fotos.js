(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

  const btnMixFotos = document.getElementById('btnMixFotos');
  const btnMixVideos = document.getElementById('btnMixVideos');
  const overlay = document.getElementById('mixOverlay');
  const stage = document.getElementById('mixStage');
  const caption = document.getElementById('mixCaption');
  const btnClose = document.getElementById('mixClose');

  if (!overlay || !stage) return;

  let intervaloMix = null;
  let indiceAtual = 0;
  let itensAtuais = [];

  function nivelAcesso(){
    const tipoAcesso = sessionStorage.getItem('tipoAcesso');
    if (tipoAcesso !== 'membro') return 'visitante';
    const grupo = sessionStorage.getItem('grupoUsuario');
    return grupo === 'familia' ? 'familia' : 'membro';
  }

  async function buscarItens(tipo){
    const nivel = nivelAcesso();
    const filtro = nivel === 'visitante'
      ? '&visibilidade=eq.publico'
      : '&visibilidade=neq.privado';

    try {
      const resp = await window.supaFetch(
        `${SUPABASE_URL}/rest/v1/midias?tipo=eq.${tipo}&status=eq.aprovado${filtro}&select=*&order=criado_em.desc&limit=50`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const dados = await resp.json();
      return Array.isArray(dados) ? dados : [];
    } catch (e) {
      console.error('Erro ao buscar itens para o Mix:', e);
      return [];
    }
  }

  function embaralhar(lista){
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  function limparSlideAnterior(){
    const slideAnterior = stage.querySelector('.mix-slide.active, .mix-video-el.active');
    if (slideAnterior) slideAnterior.classList.remove('active');
  }

  function mostrarItem(item){
    stage.innerHTML = '';

    if (item.tipo === 'video') {
      const video = document.createElement('video');
      video.className = 'mix-video-el';
      video.src = item.url_arquivo;
      video.controls = false;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      stage.appendChild(video);
      requestAnimationFrame(() => video.classList.add('active'));
    } else {
      const slide = document.createElement('div');
      slide.className = 'mix-slide';
      slide.style.backgroundImage = `url('${item.url_arquivo}')`;
      stage.appendChild(slide);
      requestAnimationFrame(() => slide.classList.add('active'));
    }

    caption.textContent = item.nome_evento
      ? `${item.nome_evento}${item.ano ? ' · ' + item.ano : ''}`
      : (item.ano || '');
  }

  function avancar(){
    if (itensAtuais.length === 0) return;
    indiceAtual = (indiceAtual + 1) % itensAtuais.length;
    mostrarItem(itensAtuais[indiceAtual]);
  }

  async function abrirMix(tipo){
    const itens = await buscarItens(tipo);

    if (itens.length === 0) {
      if (window.avisoSite) {
        window.avisoSite(
          tipo === 'video'
            ? 'Nenhum vídeo aprovado ainda para mostrar no Mix.'
            : 'Nenhuma foto aprovada ainda para mostrar no Mix.',
          '🎬'
        );
      }
      return;
    }

    itensAtuais = embaralhar(itens);
    indiceAtual = 0;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    mostrarItem(itensAtuais[0]);

    if (intervaloMix) clearInterval(intervaloMix);
    intervaloMix = setInterval(avancar, 5000);
  }

  function fecharMix(){
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    stage.innerHTML = '';
    caption.textContent = '';
    if (intervaloMix) clearInterval(intervaloMix);
    intervaloMix = null;
  }

  if (btnMixFotos) {
    btnMixFotos.addEventListener('click', () => abrirMix('foto'));
  }
  if (btnMixVideos) {
    btnMixVideos.addEventListener('click', () => abrirMix('video'));
  }
  if (btnClose) {
    btnClose.addEventListener('click', fecharMix);
  }

  document.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('active') && e.key === 'Escape') fecharMix();
  });
})();