(function(){
  const container = document.getElementById('reorderList');
  if (!container) return;

  const idConversa = container.getAttribute('data-conversa-id') || 'padrao';
  let arrastando = null;

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

  habilitarArraste();

  try {
    const ordemSalva = JSON.parse(localStorage.getItem('ordemConversa_' + idConversa));
    if (ordemSalva && ordemSalva.length) {
      ordemSalva.forEach(itemId => {
        const el = container.querySelector(`[data-item-id="${itemId}"]`);
        if (el) container.appendChild(el);
      });
    }
  } catch(e){}

  document.getElementById('btnSalvarOrdem').addEventListener('click', () => {
    const ordem = [...container.querySelectorAll('.reorder-item')].map(item => item.dataset.itemId);
    localStorage.setItem('ordemConversa_' + idConversa, JSON.stringify(ordem));
    if (window.avisoSite) {
      window.avisoSite('Ordem salva! Os prints e áudios seguem essa sequência agora em "Ver sequência completa" e na lista de Conversas.', '✅');
    }
  });
})();