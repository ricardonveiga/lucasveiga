const SUPABASE_URL_BANNER = 'https://igvtlqkkflpjrgasapos.supabase.co';
const SUPABASE_KEY_BANNER = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

const LIMITE_TOTAL_FAVORITAS = 15; // 5 banners de 3 fotos cada

async function validarFavoritasAoVivo(favoritasSalvas){
  if (favoritasSalvas.length === 0) return [];

  const ids = favoritasSalvas.map(f => `"${f.id}"`).join(',');
  try {
    const resp = await fetch(
      `${SUPABASE_URL_BANNER}/rest/v1/midias?id=in.(${ids})&select=id,url_arquivo,nome_evento,ano`,
      {
        headers: {
          apikey: SUPABASE_KEY_BANNER,
          Authorization: `Bearer ${SUPABASE_KEY_BANNER}`
        }
      }
    );
    const dados = await resp.json();
    if (!Array.isArray(dados)) return [];

    const mapa = new Map(dados.map(d => [String(d.id), d]));
    const validas = [];
    favoritasSalvas.forEach(fav => {
      const real = mapa.get(String(fav.id));
      if (real) {
        validas.push({
          id: real.id,
          url: real.url_arquivo,
          evento: real.nome_evento,
          year: real.ano
        });
      }
    });
    return validas;
  } catch (e) {
    console.error('Erro ao validar favoritas ao vivo:', e);
    return favoritasSalvas;
  }
}

function garantirAvisoElemento(){
  return document.getElementById('heroBannerAviso');
}

async function atualizarBannerRotativo(){
  const slidesContainer = document.getElementById('heroSlides');
  const dotsContainer = document.getElementById('heroDots');
  if (!slidesContainer || !dotsContainer) return;

  slidesContainer.querySelectorAll('.hero-slide-favorita').forEach(el => el.remove());

  const favoritasSalvas = obterFavoritas();
  const favoritasValidas = await validarFavoritasAoVivo(favoritasSalvas);

  if (favoritasValidas.length !== favoritasSalvas.length) {
    salvarFavoritas(favoritasValidas);
  }

  const favoritasConsideradas = favoritasValidas.slice(0, LIMITE_TOTAL_FAVORITAS);
  const totalCompletos = Math.floor(favoritasConsideradas.length / 3);
  const resto = favoritasConsideradas.length % 3;

  for (let i = 0; i < totalCompletos; i++) {
    const grupo = favoritasConsideradas.slice(i * 3, i * 3 + 3);

    const slide = document.createElement('div');
    slide.className = 'hero-slide hero-slide-favorita';

    const group = document.createElement('div');
    group.className = 'hero-favorita-group';

    grupo.forEach(foto => {
      const item = document.createElement('div');
      item.className = 'hero-favorita-item';
      item.style.backgroundImage = `url('${foto.url || ''}')`;

      const overlay = document.createElement('div');
      overlay.className = 'hero-favorita-item-overlay';
      item.appendChild(overlay);

      const tag = document.createElement('div');
      tag.className = 'hero-favorita-item-tag';
      tag.innerHTML = `★ ${foto.evento || 'Lembrança'}<small>${foto.year || 'Sem data'}</small>`;
      item.appendChild(tag);

      group.appendChild(item);
    });

    slide.appendChild(group);
    slidesContainer.appendChild(slide);
  }

  const totalSlides = slidesContainer.querySelectorAll('.hero-slide').length;
  dotsContainer.innerHTML = '';
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('span');
    dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
    dotsContainer.appendChild(dot);
  }

  const aviso = garantirAvisoElemento();
  if (aviso) {
    if (totalCompletos >= 5) {
      aviso.textContent = '★ Você atingiu o limite de 5 banners (15 fotos favoritas). Remova alguma favorita para adicionar outra.';
      aviso.classList.add('visivel');
    } else if (resto > 0) {
      const faltam = 3 - resto;
      aviso.textContent = `★ As fotos favoritas viram banners em múltiplos de 3 — você tem ${resto} foto${resto > 1 ? 's' : ''} marcada${resto > 1 ? 's' : ''}. Marque mais ${faltam} para criar o próximo banner (limite: 5 banners, 15 fotos no total).`;
      aviso.classList.add('visivel');
    } else if (totalCompletos === 0) {
      aviso.textContent = '★ As fotos favoritas viram banners em grupos de 3 — escolha até 15 no total (5 banners) para elas alternarem automaticamente no banner acima.';
      aviso.classList.add('visivel');
    } else {
      aviso.textContent = '';
      aviso.classList.remove('visivel');
    }
  }

  iniciarRotacaoBanner();
}

let intervaloBanner = null;

function iniciarRotacaoBanner(){
  if (intervaloBanner) clearInterval(intervaloBanner);

  const slidesContainer = document.getElementById('heroSlides');
  const dotsContainer = document.getElementById('heroDots');
  const slides = slidesContainer.querySelectorAll('.hero-slide');
  const dots = dotsContainer.querySelectorAll('.hero-dot');

  slides.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));
  slides[0].classList.add('active');
  dots[0].classList.add('active');

  if (slides.length <= 1) return;

  let indiceAtivo = 0;

  intervaloBanner = setInterval(() => {
    slides[indiceAtivo].classList.remove('active');
    dots[indiceAtivo].classList.remove('active');
    indiceAtivo = (indiceAtivo + 1) % slides.length;
    slides[indiceAtivo].classList.add('active');
    dots[indiceAtivo].classList.add('active');
  }, 6000);
}

document.addEventListener('DOMContentLoaded', atualizarBannerRotativo);