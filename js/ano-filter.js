const params = new URLSearchParams(window.location.search);
const anoSelecionado = params.get('ano') || 'sem-data';

const tituloAno = document.getElementById('tituloAno');
if (tituloAno) {
  tituloAno.textContent = anoSelecionado === 'sem-data' ? 'Sem data' : anoSelecionado;
}

document.querySelectorAll('[data-year]').forEach(item => {
  item.style.display = item.getAttribute('data-year') === anoSelecionado ? '' : 'none';
});