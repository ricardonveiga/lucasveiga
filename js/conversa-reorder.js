(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

  const container = document.getElementById('reorderList');
  if (!container) return;

  const idConversa = container.getAttribute('data-conversa-id') || 'padrao';
  const btnSalvar = document.getElementById('btnSalvarOrdem');
  let arrastando = null;

  function nivelAcesso(){
    const tipoAcesso = sessionStorage.getItem('tipoAcesso');
    if (tipoAcesso !== 'membro') return 'visitante';
    const grupo = sessionStorage.getItem('grupoUsuario');
    return grupo === 'familia' ? 'familia' : 'membro';
  }

  function mostrarMensagem(texto){
    container.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'hint-text';
    p.style.margin = '0';
    p.textContent = texto;
    container.appendChild(p);
    if (btnSalvar) btnSalvar.style.display = 'none';
  }

  function criarItemReorder(item){
    const wrapper = document.createElement('div');
    wrapper.className = 'reorder-item';
    wrapper.setAttribute('data-item-id', String(item.id));
    wrapper.setAttribute('draggable', 'true');

    const handle = document.createElement('span');
    handle.className = 'reorder-handle';
    handle.textContent = '⠿';
    wrapper.appendChild(handle);

    const ehAudio = item.tipo === 'audio';
    const card = document.createElement('div');
    card.className = 'media-card ' + (ehAudio ? 'video-card' : 'photo-card');
    card.setAttribute('data-visibility', item.visibilidade);

    if (!ehAudio && item.url_arquivo) {
      card.style.backgroundImage = `url('${item.url_arquivo}')`;
    }

    const badge = document.createElement('span');
    badge.className = 'badge ' + (item.status === 'aprovado' ? 'badge-aprovado' : 'badge-pendente');
    badge.textContent = ehAudio ? 'Áudio' : 'Print';
    card.appendChild(badge);

    if (ehAudio) {
      const play = document.createElement('div');
      play.className = 'play-btn';
      play.innerHTML = '<span style="font-size:1.1rem;">🎧</span>';
      card.appendChild(play);
    }

    const caption = document.createElement('span');
    caption.className = 'media-caption';
    caption.innerHTML = `${item.autor_nome || 'Anônimo'} <em>${item.texto_lembranca ? '💬' : ''}</em>`;
    card.appendChild(caption);

    wrapper.appendChild(card);
    return wrapper;
  }

  function habilitarArraste(){
    container.querySelectorAll('.reorder-item').forEach(item => {
      item.setAttribute('draggable', 'true');

      item.addEventListener('dragstart', () => {
        arrastando = item;
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        arrastando = null;
      });

      // Suporte a toque (celular): segurar e arrastar
      item.addEventListener('touchstart', (e) => {
        if (!e.target.closest('.reorder-handle')) return;
        arrastando = item;
        item.classList.add('dragging');
      }, { passive: true });

      item.addEventListener('touchmove', (e) => {
        if (!arrastando) return;
        e.preventDefault();
        const toque = e.touches[0];
        const depois = elementoAposY(toque.clientY);
        if (depois == null) {
          container.appendChild(arrastando);
        } else {
          container.insertBefore(arrastando, depois);
        }
      }, { passive: false });

      item.addEventListener('touchend', () => {
        if (arrastando) arrastando.classList.remove('dragging');
        arrastando = null;
      });
    });
  }

  function elementoAposY(y){
    const itens = [...container.querySelectorAll('.reorder-item:not(.dragging)')];
    return itens.reduce((maisProximo, filho) => {
      const box = filho.getBoundingClientRect();
      const distancia = y - box.top - box.height / 2;
      if (distancia < 0 && distancia > maisProximo.distancia) {
        return { distancia, elemento: filho };
      }
      return maisProximo;
    }, { distancia: Number.NEGATIVE_INFINITY }).elemento;
  }

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!arrastando) return;
    const depois = elementoAposY(e.clientY);
    if (depois == null) {
      container.appendChild(arrastando);
    } else {
      container.insertBefore(arrastando, depois);
    }
  });

  function aplicarOrdemSalva(){
    try {
      const ordemSalva = JSON.parse(localStorage.getItem('ordemConversa_' + idConversa));
      if (ordemSalva && ordemSalva.length) {
        ordemSalva.forEach(itemId => {
          const el = container.querySelector(`[data-item-id="${itemId}"]`);
          if (el) container.appendChild(el);
        });
      }
    } catch(e){}
  }

  async function carregar(){
    const nivel = nivelAcesso();
    const filtro = nivel === 'visitante' ? '&visibilidade=eq.todos' : '';

    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/conversas?status=eq.aprovado${filtro}&select=*&order=criado_em.asc&limit=500`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      const dados = await resp.json();
      let itens = Array.isArray(dados) ? dados : [];

      if (nivel !== 'visitante') {
        const meuId = sessionStorage.getItem('usuarioId');
        itens = itens.filter(item => {
          if (item.visibilidade === 'privado') {
            const meuTipo = sessionStorage.getItem('tipoAcesso') === 'membro' ? 'membro' : 'visitante';
            const tipoConfere = !item.autor_tipo || item.autor_tipo === meuTipo;
            return !!meuId && tipoConfere && String(item.autor_id) === String(meuId);
          }
          return true;
        });
      }

      if (itens.length === 0) {
        mostrarMensagem('Nenhum print ou áudio aprovado por aqui ainda — adicione em Conversas para poder organizá-los.');
        return;
      }

      container.innerHTML = '';
      itens.forEach(item => container.appendChild(criarItemReorder(item)));
      aplicarOrdemSalva();
      habilitarArraste();
      if (btnSalvar) btnSalvar.style.display = '';
    } catch (e) {
      console.error('Erro ao carregar conversas para organizar:', e);
      mostrarMensagem('Não foi possível carregar os prints agora — tente de novo em instantes.');
    }
  }

  if (btnSalvar) {
    btnSalvar.addEventListener('click', () => {
      const ordem = [...container.querySelectorAll('.reorder-item')].map(item => item.dataset.itemId);
      localStorage.setItem('ordemConversa_' + idConversa, JSON.stringify(ordem));
      if (window.avisoSite) {
        window.avisoSite('Ordem salva! Os prints e áudios seguem essa sequência agora em "Ver sequência completa" e na lista de Conversas.', '✅');
      }
    });
  }

  carregar();
})();
