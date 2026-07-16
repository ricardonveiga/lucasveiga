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
const tipoAcessoAtual = sessionStorage.getItem('tipoAcesso');

if (tipoAcessoAtual !== 'membro') {
  // Visitante não tem conta com nome — mostra uma saudação genérica em
  // vez de "Olá, Usuário".
  const saudacaoEl = userName ? userName.closest('.sidebar-hello') : null;
  if (saudacaoEl) saudacaoEl.textContent = 'Seja bem-vindo!';
} else if (nomeSalvo && userName) {
  userName.textContent = nomeSalvo;
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

  // Visitante não vê a opção "Não compartilhar" nos formulários de Fotos,
  // Vídeos, Mural e Conversas (em Sonhos e Sinais essa opção continua
  // disponível, por decisão separada).
  if (nivel === 'visitante') {
    document.querySelectorAll('input[value="privado"]').forEach(input => {
      if (input.name === 'visibilidadeSonho') return;
      const opcao = input.closest('.visibility-option');
      if (opcao) opcao.style.display = 'none';
    });
  }
}

document.addEventListener('DOMContentLoaded', aplicarFiltroVisibilidade);