// ===== Menu lateral (mobile) =====
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openSidebar(){
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('active');
}
function closeSidebarFn(){
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
}

menuToggle.addEventListener('click', openSidebar);
closeSidebar.addEventListener('click', closeSidebarFn);
sidebarOverlay.addEventListener('click', closeSidebarFn);

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth <= 900) closeSidebarFn();
  });
});

// ===== Alternância de tema claro/escuro =====
const themeToggle = document.getElementById('themeToggle');
const iconMoon = document.getElementById('iconMoon');
const iconSun = document.getElementById('iconSun');
const themeLabel = document.getElementById('themeLabel');

function aplicarTema(tema){
  if (tema === 'light'){
    document.documentElement.setAttribute('data-theme', 'light');
    iconMoon.style.display = 'none';
    iconSun.style.display = 'block';
    themeLabel.textContent = 'Modo escuro';
  } else {
    document.documentElement.removeAttribute('data-theme');
    iconMoon.style.display = 'block';
    iconSun.style.display = 'none';
    themeLabel.textContent = 'Modo claro';
  }
  localStorage.setItem('temaPreferido', tema);
}

const temaSalvo = localStorage.getItem('temaPreferido') || 'dark';
aplicarTema(temaSalvo);

themeToggle.addEventListener('click', () => {
  const temaAtual = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  aplicarTema(temaAtual === 'light' ? 'dark' : 'light');
});

// ===== Nome do usuário =====
const userName = document.getElementById('userName');
const nomeSalvo = sessionStorage.getItem('nomeUsuario');
if (nomeSalvo && userName) {
  userName.textContent = nomeSalvo.trim().split(' ')[0];
}

// ===== Filtro de visibilidade por perfil (Fotos, Vídeos, Conversas, Mural) =====
function nivelDeAcessoAtual(){
  const tipoAcesso = sessionStorage.getItem('tipoAcesso');
  if (tipoAcesso !== 'membro') return 'visitante';

  const grupo = sessionStorage.getItem('grupoUsuario');
  return grupo === 'familia' ? 'familia' : 'membro';
}

function podeVer(visibilidade, nivel){
  if (visibilidade === 'publico') return true;
  if (nivel === 'visitante') return false;
  if (visibilidade === 'familia') return true;
  if (visibilidade === 'membros') return true;
  return false;
}

function aplicarFiltroVisibilidade(){
  const nivel = nivelDeAcessoAtual();

  document.querySelectorAll('[data-visibility]').forEach(item => {
    const visibilidade = item.getAttribute('data-visibility');
    item.style.display = podeVer(visibilidade, nivel) ? '' : 'none';
  });

  // O aviso "você está vendo apenas conteúdo público" foi removido —
  // não é mais necessário mostrar essa frase.
  const avisoVisitante = document.getElementById('avisoVisitante');
  if (avisoVisitante) {
    avisoVisitante.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', aplicarFiltroVisibilidade);

// ============================================================
// Sair de verdade: limpa a sessão deste usuário e o token de
// autenticação do Supabase salvo no navegador. Sem isso, a próxima
// pessoa a usar o mesmo computador herdava o acesso de quem saiu.
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const btnSair = document.getElementById('btnSair');
  if (!btnSair) return;
  btnSair.addEventListener('click', () => {
    try { sessionStorage.clear(); } catch(e){}
    try {
      Object.keys(localStorage).forEach(chave => {
        if (chave.startsWith('sb-')) localStorage.removeItem(chave);
      });
    } catch(e){}
  });
});


// ============================================================
// Carrossel inteligente do dashboard.
// - Conteúdo que não atravessa a tela: mostra UMA vez, parado
//   (sem duplicação aparente).
// - Conteúdo maior que a tela: cria uma segunda cópia (que fica
//   fora da área visível) e desliza continuamente da direita para
//   a esquerda, de ponta a ponta, com velocidade proporcional.
// ============================================================
window.renderizarCarrossel = function(track, itens, criarCard){
  if (!track) return;
  track.classList.remove('marquee-vazio');
  track.classList.remove('marquee-estatico');
  track.style.animationDuration = '';
  track.innerHTML = '';

  itens.forEach((item, indice) => track.appendChild(criarCard(item, indice)));

  const wrap = track.parentElement;
  const larguraVisivel = wrap ? wrap.clientWidth : 0;
  const larguraBase = track.scrollWidth;

  if (larguraVisivel > 0 && larguraBase > larguraVisivel + 8) {
    // Segunda cópia para o loop sem emenda — os cards repetidos entram
    // por um lado conforme os originais saem pelo outro.
    itens.forEach((item, indice) => track.appendChild(criarCard(item, indice + itens.length)));
    const duracao = Math.max(18, Math.round(larguraBase / 45));
    track.style.animationDuration = duracao + 's';
  } else {
    track.classList.add('marquee-estatico');
  }
};
