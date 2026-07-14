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

  const avisoVisitante = document.getElementById('avisoVisitante');
  if (avisoVisitante) {
    avisoVisitante.style.display = nivel === 'visitante' ? 'block' : 'none';
  }
}

document.addEventListener('DOMContentLoaded', aplicarFiltroVisibilidade);