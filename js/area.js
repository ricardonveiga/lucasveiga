const tipoAcesso = sessionStorage.getItem('tipoAcesso');
const mensagem = sessionStorage.getItem('mensagemBoasVindas');

const loadingOverlay = document.getElementById('loadingOverlay');
const welcomeOverlay = document.getElementById('welcomeOverlay');
const areaWelcome = document.getElementById('areaWelcome');
const closeWelcome = document.getElementById('closeWelcome');
const loadingText = document.getElementById('loadingText');

const ATRASO_REDIRECT_MS = 3000;

function irParaMembro(atraso){
  welcomeOverlay.classList.add('hidden');
  loadingOverlay.classList.remove('hidden');

  const nome = sessionStorage.getItem('nomeUsuario');
  loadingText.textContent = nome ? `Preparando o espaço de ${nome}...` : 'Preparando seu espaço...';

  const redirecionar = () => { window.location.href = 'membro.html'; };

  setTimeout(redirecionar, atraso);

  // Rede de segurança: se por algum motivo o redirecionamento automático
  // não disparar (ex: JS bloqueado, erro inesperado), depois de um tempo
  // extra aparece um link manual pra pessoa não ficar presa nessa tela.
  setTimeout(() => {
    if (loadingText) {
      loadingText.innerHTML = 'Preparando seu espaço... <a href="membro.html" style="color:#fff; text-decoration:underline;">clique aqui se a página não avançar</a>';
    }
  }, atraso + 2500);
}

if (tipoAcesso === 'membro') {
  irParaMembro(ATRASO_REDIRECT_MS);

} else if (tipoAcesso === 'visitante') {
  loadingOverlay.classList.add('hidden');

  if (mensagem) {
    // Mostra a mensagem de boas-vindas por alguns segundos e segue
    // sozinho — não depende de clique. O botão de fechar continua
    // funcionando pra quem quiser pular a espera.
    areaWelcome.textContent = mensagem;
    sessionStorage.removeItem('mensagemBoasVindas');
    welcomeOverlay.classList.remove('hidden');

    let jaAvancou = false;
    const avancar = () => {
      if (jaAvancou) return;
      jaAvancou = true;
      irParaMembro(ATRASO_REDIRECT_MS);
    };

    closeWelcome.addEventListener('click', avancar);
    setTimeout(avancar, 2500);
  } else {
    // Visitante recorrente (sem mensagem nova) — segue direto, sem
    // precisar fechar nada.
    welcomeOverlay.classList.add('hidden');
    irParaMembro(ATRASO_REDIRECT_MS);
  }

} else {
  // Sem sessão válida — volta pro login.
  loadingOverlay.classList.add('hidden');
  welcomeOverlay.classList.add('hidden');
  window.location.href = 'index.html';
}
