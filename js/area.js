const tipoAcesso = sessionStorage.getItem('tipoAcesso');

const loadingOverlay = document.getElementById('loadingOverlay');
const welcomeOverlay = document.getElementById('welcomeOverlay');
const loadingText = document.getElementById('loadingText');

// Não usamos mais o cartão de boas-vindas separado — a mensagem
// personalizada agora só aparece dentro do próprio texto de carregamento.
sessionStorage.removeItem('mensagemBoasVindas');

if (tipoAcesso !== 'membro' && tipoAcesso !== 'visitante') {
  // Sem sessão válida — volta pro login.
  window.location.href = 'index.html';
} else {
  // Garante que nada aparece por cima da imagem nos primeiros segundos —
  // nem o card de boas-vindas, nem o "carregando".
  loadingOverlay.classList.add('hidden');
  welcomeOverlay.classList.add('hidden');

  const nome = sessionStorage.getItem('nomeUsuario');
  loadingText.textContent = nome ? `Preparando o espaço de ${nome}...` : 'Preparando seu espaço...';

  const TEMPO_SO_IMAGEM_MS = 4000;
  const TEMPO_CARREGANDO_MS = 3000;

  setTimeout(() => {
    loadingOverlay.classList.remove('hidden');

    const redirecionar = () => { window.location.href = 'membro.html'; };
    setTimeout(redirecionar, TEMPO_CARREGANDO_MS);

    // Rede de segurança: se o redirecionamento automático não disparar por
    // algum motivo, depois de um tempo extra aparece um link manual.
    setTimeout(() => {
      loadingText.innerHTML = (nome ? `Preparando o espaço de ${nome}...` : 'Preparando seu espaço...')
        + ' <a href="membro.html" style="color:#fff; text-decoration:underline;">clique aqui se a página não avançar</a>';
    }, TEMPO_CARREGANDO_MS + 2500);
  }, TEMPO_SO_IMAGEM_MS);
}
