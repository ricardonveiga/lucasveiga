document.getElementById('btnPublicarConversa').addEventListener('click', () => {
  const texto = document.getElementById('conversaTexto').value.trim();
  const temPrint = document.getElementById('conversaPrint').files.length > 0;
  const temAudio = document.getElementById('conversaAudio').files.length > 0;
  const checkboxes = document.querySelectorAll('input[name="visibilidadeConversa"]:checked');

  if (!texto && !temPrint && !temAudio) {
    window.avisoSite('Envie um print, um áudio ou escreva algo antes de publicar.', '📎');
    return;
  }
  if (checkboxes.length === 0) {
    window.avisoSite('Selecione ao menos uma opção de visibilidade.', '👀');
    return;
  }

  const valores = Array.from(checkboxes).map(c => c.value);
  const somenteNaoCompartilhar = valores.length === 1 && valores[0] === 'privado';

  const mensagem = somenteNaoCompartilhar
    ? 'Conversa adicionada! Como está marcada como "Não compartilhar", já ficou disponível para você, sem precisar de aprovação.'
    : 'Conversa adicionada! Ela aparecerá para outras pessoas assim que for aprovada pelo administrador.';

  window.avisoSite(mensagem, '✅');
});

document.addEventListener('DOMContentLoaded', () => {
  const secao = document.getElementById('conversas-existentes');
  if (!secao) return;
  const grade = secao.querySelector('.full-grid');
  if (!grade) return;

  let ordemSalva = null;
  try { ordemSalva = JSON.parse(localStorage.getItem('ordemConversa_padrao')); } catch(e){}
  if (!ordemSalva || !ordemSalva.length) return;

  const itens = Array.from(grade.children);
  itens.sort((a, b) => {
    const idA = a.dataset.mediaId || '';
    const idB = b.dataset.mediaId || '';
    const posA = ordemSalva.indexOf(idA);
    const posB = ordemSalva.indexOf(idB);
    if (posA === -1 && posB === -1) return 0;
    if (posA === -1) return 1;
    if (posB === -1) return -1;
    return posA - posB;
  });
  itens.forEach(item => grade.appendChild(item));
});