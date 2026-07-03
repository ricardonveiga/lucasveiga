// Corrige a altura real da viewport em navegadores mobile
// (a barra de endereço não é contabilizada em 100vh)
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setViewportHeight();

window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', () => {
  setViewportHeight();
  setTimeout(setViewportHeight, 300);
});
