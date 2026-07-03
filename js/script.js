// Corrige um problema clássico de responsividade em navegadores mobile:
// 100vh não considera a barra de endereço/teclado, então o fundo
// "pula" ou deixa espaço em branco. Recalculamos a altura real da
// viewport e guardamos numa variável CSS (--vh) usada no style.css.

function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setViewportHeight();

// Recalcula ao redimensionar a janela ou girar o celular
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);

// Pequeno atraso extra após a rotação, porque alguns navegadores
// mobile atualizam innerHeight com atraso
window.addEventListener('orientationchange', () => {
  setTimeout(setViewportHeight, 300);
});
