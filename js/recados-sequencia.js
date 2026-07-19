(function(){
  // "Ver todos em sequência" do Mural: abre uma vitrine em tela cheia com
  // os recados passando um a um, na ordem de adição, agrupados por
  // categoria: primeiro Família, depois Membros, depois Visitantes.
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';
  const TEMPO_POR_RECADO = 6500; // ms

  const btnAbrir = document.getElementById('btnVerTodosRecados');
  if (!btnAbrir) return;

  let itens = [];
  let indiceAtual = 0;
  let timer = null;
  let overlay = null;

  function nivelAcesso(){
    const tipoAcesso = sessionStorage.getItem('tipoAcesso');
    if (tipoAcesso !== 'membro') return 'visitante';
    const grupo = sessionStorage.getItem('grupoUsuario');
    return grupo === 'familia' ? 'familia' : 'membro';
  }

  function podeVer(visibilidade, nivel){
    if (visibilidade === 'todos') return true;
    if (visibilidade === 'membros') return nivel === 'membro' || nivel === 'familia';
    if (visibilidade === 'familia') return nivel === 'familia';
    if (visibilidade === 'ambos') return nivel === 'membro' || nivel === 'familia';
    return false;
  }

  function grupoDoRecado(item){
    if (item.autor_grupo === 'familia') return 'familia';
    if (item.autor_grupo === 'membro') return 'membro';
    if (item.autor_grupo === 'visitante') return 'visitante';
    // Recados antigos, sem o grupo gravado: classifica pelo tipo do autor
    return item.autor_tipo === 'membro' ? 'membro' : 'visitante';
  }

  const ROTULOS = { familia: 'Família', membro: 'Membros', visitante: 'Visitantes' };
  const ORDEM_GRUPOS = { familia: 0, membro: 1, visitante: 2 };

  async function buscarRecados(){
    const nivel = nivelAcesso();
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/recados_mural?status=eq.aprovado&select=*&order=criado_em.asc&limit=500`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const dados = await resp.json();
      const meuId = sessionStorage.getItem('usuarioId');
      const meuTipo = sessionStorage.getItem('tipoAcesso') === 'membro' ? 'membro' : 'visitante';
      const lista = (Array.isArray(dados) ? dados : []).filter(item => {
        if (item.visibilidade === 'privado') {
          const tipoConfere = !item.autor_tipo || item.autor_tipo === meuTipo;
          return !!meuId && tipoConfere && String(item.autor_id) === String(meuId);
        }
        return podeVer(item.visibilidade, nivel);
      });
      // Ordena: grupo (família > membros > visitantes) e, dentro do grupo,
      // ordem de adição (mais antigo primeiro)
      lista.sort((a, b) => {
        const ga = ORDEM_GRUPOS[grupoDoRecado(a)];
        const gb = ORDEM_GRUPOS[grupoDoRecado(b)];
        if (ga !== gb) return ga - gb;
        return new Date(a.criado_em) - new Date(b.criado_em);
      });
      return lista;
    } catch (e) {
      console.error('Erro ao carregar recados para a sequência:', e);
      return [];
    }
  }

  function formatarData(iso){
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch(e){ return ''; }
  }

  function montarOverlay(){
    overlay = document.createElement('div');
    overlay.className = 'recados-sequencia-overlay';
    overlay.innerHTML = `
      <button type="button" class="recados-sequencia-fechar" aria-label="Fechar">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
      </button>
      <p class="recados-sequencia-grupo"></p>
      <div class="recados-sequencia-palco"></div>
      <p class="recados-sequencia-contador"></p>
      <div class="recados-sequencia-nav recados-sequencia-anterior"></div>
      <div class="recados-sequencia-nav recados-sequencia-proximo"></div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.recados-sequencia-fechar').addEventListener('click', fechar);
    overlay.querySelector('.recados-sequencia-anterior').addEventListener('click', () => mostrar(indiceAtual - 1));
    overlay.querySelector('.recados-sequencia-proximo').addEventListener('click', () => mostrar(indiceAtual + 1));
    document.addEventListener('keydown', aoTeclar);
  }

  function aoTeclar(e){
    if (!overlay) return;
    if (e.key === 'Escape') fechar();
    if (e.key === 'ArrowRight') mostrar(indiceAtual + 1);
    if (e.key === 'ArrowLeft') mostrar(indiceAtual - 1);
  }

  function mostrar(indice){
    if (!overlay || itens.length === 0) return;
    indiceAtual = (indice + itens.length) % itens.length;
    const item = itens[indiceAtual];

    overlay.querySelector('.recados-sequencia-grupo').textContent = ROTULOS[grupoDoRecado(item)];
    overlay.querySelector('.recados-sequencia-contador').textContent = `${indiceAtual + 1} de ${itens.length}`;

    const palco = overlay.querySelector('.recados-sequencia-palco');
    palco.innerHTML = '';

    const cartao = document.createElement('div');
    cartao.className = 'recados-sequencia-cartao';

    if (item.imagem_url) {
      const img = document.createElement('img');
      img.src = item.imagem_url;
      img.alt = 'Recado para o Lucas';
      cartao.appendChild(img);
    }
    if (item.texto) {
      const p = document.createElement('p');
      p.className = 'recados-sequencia-texto';
      p.textContent = `"${item.texto}"`;
      cartao.appendChild(p);
    }
    const assinatura = document.createElement('p');
    assinatura.className = 'recados-sequencia-assinatura';
    assinatura.textContent = `— ${item.autor_nome || 'Anônimo'} · ${formatarData(item.criado_em)}`;
    cartao.appendChild(assinatura);

    palco.appendChild(cartao);

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => mostrar(indiceAtual + 1), TEMPO_POR_RECADO);
  }

  function fechar(){
    if (timer) clearTimeout(timer);
    timer = null;
    document.removeEventListener('keydown', aoTeclar);
    if (overlay) overlay.remove();
    overlay = null;
  }

  btnAbrir.addEventListener('click', async () => {
    btnAbrir.disabled = true;
    itens = await buscarRecados();
    btnAbrir.disabled = false;
    if (itens.length === 0) {
      if (window.avisoSite) window.avisoSite('Nenhum recado aprovado por aqui ainda.', '💬');
      return;
    }
    montarOverlay();
    mostrar(0);
  });
})();
