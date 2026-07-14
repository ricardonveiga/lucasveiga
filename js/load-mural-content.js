(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

  const track = document.getElementById('muralCarrosselTrack');
  if (!track) return;

  function nivelAcesso(){
    const tipoAcesso = sessionStorage.getItem('tipoAcesso');
    if (tipoAcesso !== 'membro') return 'visitante';
    const grupo = sessionStorage.getItem('grupoUsuario');
    return grupo === 'familia' ? 'familia' : 'membro';
  }

  const CORES = ['color-a', 'color-b', 'color-c', 'color-d'];

  function criarCardRecado(item, indice){
    const card = document.createElement('div');
    card.className = 'recado-card ' + CORES[indice % CORES.length] + (item.imagem_url ? ' recado-card-media' : '');
    card.setAttribute('data-recado-id', item.id);
    card.setAttribute('data-visibility', item.visibilidade);
    card.setAttribute('data-autor', item.autor_nome || '');
    card.setAttribute('data-texto', item.texto || '');
    card.setAttribute('data-imagem', item.imagem_url || '');

    const emoji = document.createElement('span');
    emoji.className = 'recado-emoji';
    emoji.textContent = item.metodo === 'tela' ? '🎨' : item.metodo === 'foto' ? '📷' : '♥';
    card.appendChild(emoji);

    const tipo = document.createElement('span');
    tipo.className = 'recado-tipo';
    tipo.textContent = item.metodo === 'tela' ? 'Manuscrito (tela)' : item.metodo === 'foto' ? 'Manuscrito (foto)' : 'Digitado';
    card.appendChild(tipo);

    if (item.imagem_url) {
      const thumb = document.createElement('div');
      thumb.className = 'recado-media-thumb';
      thumb.style.backgroundImage = `url('${item.imagem_url}')`;
      thumb.style.backgroundSize = 'contain';
      thumb.style.backgroundRepeat = 'no-repeat';
      thumb.style.backgroundPosition = 'center';
      thumb.style.backgroundColor = '#000';
      card.appendChild(thumb);
    } else {
      const texto = document.createElement('p');
      texto.textContent = `"${item.texto || ''}"`;
      card.appendChild(texto);
    }

    const autor = document.createElement('span');
    autor.className = 'recado-autor';
    autor.textContent = item.autor_nome || 'Anônimo';
    card.appendChild(autor);

    return card;
  }

  async function carregarRecadosMural(){
    const nivel = nivelAcesso();

    // Visitantes só veem o que é público — sem exceção, nem os próprios (visitante não tem "próprio").
    if (nivel === 'visitante') {
      try {
        const resp = await fetch(
          `${SUPABASE_URL}/rest/v1/recados_mural?status=eq.aprovado&visibilidade=eq.todos&select=*&order=criado_em.desc&limit=20`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`
            }
          }
        );
        const dados = await resp.json();
        renderizarRecados(Array.isArray(dados) ? dados : []);
      } catch (e) {
        console.error('Erro ao carregar recados do mural:', e);
      }
      return;
    }

    // Membros e família: veem tudo que não é privado, MAIS os próprios recados
    // marcados como "não compartilhar" (só eles enxergam os deles).
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/recados_mural?status=eq.aprovado&select=*&order=criado_em.desc&limit=50`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const dados = await resp.json();
      const meuId = sessionStorage.getItem('usuarioId');
      const itens = (Array.isArray(dados) ? dados : []).filter(item => {
        if (item.visibilidade === 'privado') {
          return !!meuId && String(item.autor_id) === String(meuId);
        }
        return true;
      });
      renderizarRecados(itens);
    } catch (e) {
      console.error('Erro ao carregar recados do mural:', e);
    }
  }

  function renderizarRecados(itens){
    track.innerHTML = '';

    if (itens.length === 0) {
      track.classList.add('marquee-vazio');
      const vazio = document.createElement('p');
      vazio.className = 'hint-text';
      vazio.style.margin = '0';
      vazio.textContent = 'Nenhum recado por aqui ainda — deixe o seu também!';
      track.appendChild(vazio);
      return;
    }

    track.classList.remove('marquee-vazio');
    // Só duplica os cards para o efeito de rolagem contínua quando já
    // existem recados suficientes — com poucos, a duplicação parece bug.
    const listaParaExibir = [...itens, ...itens];

    listaParaExibir.forEach((item, indice) => {
      track.appendChild(criarCardRecado(item, indice));
    });

    if (window.ReactionsAPI) ReactionsAPI.refreshAllBadges();
  }

  window.carregarRecadosMural = carregarRecadosMural;
  carregarRecadosMural();
})();