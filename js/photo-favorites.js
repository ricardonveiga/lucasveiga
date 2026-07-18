// As favoritas são separadas por usuário (tipo + ID) — antes, todos os
// usuários do mesmo navegador compartilhavam e editavam a mesma lista.
const FAVORITAS_TIPO = sessionStorage.getItem('tipoAcesso') === 'membro' ? 'membro' : 'visitante';
const FAVORITAS_DONO = sessionStorage.getItem('usuarioId') || 'anon';
const CHAVE_FAVORITAS = 'fotosFavoritasLucas_' + FAVORITAS_TIPO + '_' + FAVORITAS_DONO;
const LIMITE_FAVORITAS = 15; // 5 banners de 3 fotos cada

// Migração única: as favoritas antigas (chave compartilhada) eram as
// escolhas do membro — aproveita para ele e ignora para visitantes.
try {
  if (FAVORITAS_TIPO === 'membro' && !localStorage.getItem(CHAVE_FAVORITAS) && localStorage.getItem('fotosFavoritasLucas')) {
    localStorage.setItem(CHAVE_FAVORITAS, localStorage.getItem('fotosFavoritasLucas'));
  }
} catch(e){}

function obterFavoritas(){
  try {
    return JSON.parse(localStorage.getItem(CHAVE_FAVORITAS)) || [];
  } catch (e) {
    return [];
  }
}

function salvarFavoritas(lista){
  localStorage.setItem(CHAVE_FAVORITAS, JSON.stringify(lista));
}

function ehFavorita(id){
  return obterFavoritas().some(f => f.id === id);
}

function alternarFavorita(foto){
  let favoritas = obterFavoritas();
  const jaExiste = favoritas.findIndex(f => f.id === foto.id);

  if (jaExiste > -1) {
    favoritas.splice(jaExiste, 1);
    salvarFavoritas(favoritas);
    marcarCardsFavoritos();
    return 'removida';
  }

  if (favoritas.length >= LIMITE_FAVORITAS) {
    return 'cheia';
  }

  favoritas.push(foto);
  salvarFavoritas(favoritas);
  marcarCardsFavoritos();
  return 'adicionada';
}

function substituirFavorita(idAntiga, fotoNova){
  let favoritas = obterFavoritas();
  const indice = favoritas.findIndex(f => f.id === idAntiga);
  if (indice > -1) {
    favoritas[indice] = fotoNova;
    salvarFavoritas(favoritas);
    marcarCardsFavoritos();
  }
}

// Percorre todos os cards de foto na página e adiciona/remove a estrelinha
// de acordo com o que está salvo nas favoritas.
function marcarCardsFavoritos(){
  const idsFavoritos = new Set(obterFavoritas().map(f => String(f.id)));

  document.querySelectorAll('.photo-card[data-photo-id]').forEach(card => {
    const id = card.getAttribute('data-photo-id');
    const jaTemMarca = card.querySelector('.media-card-favorita-marca');

    if (idsFavoritos.has(String(id))) {
      if (!jaTemMarca) {
        const marca = document.createElement('span');
        marca.className = 'media-card-favorita-marca';
        marca.textContent = '★';
        card.appendChild(marca);
      }
    } else if (jaTemMarca) {
      jaTemMarca.remove();
    }
  });
}

document.addEventListener('DOMContentLoaded', marcarCardsFavoritos);