const tipoAcesso = sessionStorage.getItem('tipoAcesso');
const mensagem = sessionStorage.getItem('mensagemBoasVindas');

const loadingOverlay = document.getElementById('loadingOverlay');
const welcomeOverlay = document.getElementById('welcomeOverlay');
const areaWelcome = document.getElementById('areaWelcome');
const closeWelcome = document.getElementById('closeWelcome');
const loadingText = document.getElementById('loadingText');

function irParaMembro(atraso){
  welcomeOverlay.classList.add('hidden');
  loadingOverlay.classList.remove('hidden');

  const nome = sessionStorage.getItem('nomeUsuario');
  loadingText.textContent = nome ? `Preparando o espaço de ${nome}...` : 'Preparando seu espaço...';

  setTimeout(() => {
    window.location.href = 'membro.html';
  }, atraso);
}

if (tipoAcesso === 'membro') {
  irParaMembro(1800);

} else if (tipoAcesso === 'visitante') {
  loadingOverlay.classList.add('hidden');

  if (mensagem) {
    // Mostra a mensagem de boas-vindas e só segue para o site quando a
    // pessoa fechar o cartão (no tempo dela, sem pressa).
    areaWelcome.textContent = mensagem;
    sessionStorage.removeItem('mensagemBoasVindas');

    closeWelcome.addEventListener('click', () => {
      irParaMembro(900);
    });
  } else {
    // Visitante recorrente (sem mensagem nova) — segue direto, sem
    // precisar fechar nada.
    welcomeOverlay.classList.add('hidden');
    irParaMembro(600);
  }

} else {
  // Sem sessão válida — volta pro login.
  loadingOverlay.classList.add('hidden');
  welcomeOverlay.classList.add('hidden');
  window.location.href = 'index.html';
}
