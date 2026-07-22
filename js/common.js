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
  if (visibilidade === 'publico' || visibilidade === 'todos') return true;
  if (nivel === 'visitante') return false;
  if (visibilidade === 'familia') return nivel === 'familia';
  if (visibilidade === 'membros' || visibilidade === 'ambos') return true;
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

  if (itens.length === 0) return;

  itens.forEach((item, indice) => track.appendChild(criarCard(item, indice)));

  // Sempre rola, da esquerda para a direita, em loop — duplica os itens
  // para o laço ficar sem emenda (os repetidos entram por um lado
  // conforme os originais saem pelo outro).
  itens.forEach((item, indice) => track.appendChild(criarCard(item, indice + itens.length)));

  function ajustarVelocidade(){
    const largura = track.scrollWidth;
    const duracao = Math.max(14, Math.round(largura / 90));
    track.style.animationDuration = duracao + 's';
  }

  ajustarVelocidade();
  requestAnimationFrame(() => requestAnimationFrame(ajustarVelocidade));
  setTimeout(ajustarVelocidade, 400);
};


// ============================================================
// Seletor de emojis 😊 — um botãozinho ao lado dos campos de texto
// que abre uma paleta com os emojis padrão e insere no ponto onde
// a pessoa parou de digitar. No celular o teclado já tem emojis;
// isso facilita principalmente no computador.
// ============================================================
(function(){
  const EMOJIS_PADRAO = [
    '❤️','🧡','💛','💚','💙','💜','🤍','💕','💖','💗',
    '😊','😀','😄','😁','🥹','🥰','😍','😘','🤗','😇',
    '😢','😭','🥲','😌','🙏','✨','🌟','⭐','🌈','💫',
    '🌹','🌻','🌸','🍀','🕊️','🦋','🎵','🎶','🕯️','♾️',
    '👏','🙌','👍','🤝','💪','🎂','🎈','🎉','⚽','🏊'
  ];

  let painelAberto = null;

  function fecharPainel(){
    if (painelAberto) {
      painelAberto.remove();
      painelAberto = null;
      document.removeEventListener('click', aoClicarFora, true);
    }
  }

  function aoClicarFora(e){
    if (painelAberto && !painelAberto.contains(e.target) && !e.target.classList.contains('emoji-seletor-btn')) {
      fecharPainel();
    }
  }

  function inserirNoCampo(campo, emoji){
    const inicio = campo.selectionStart ?? campo.value.length;
    const fim = campo.selectionEnd ?? campo.value.length;
    campo.value = campo.value.slice(0, inicio) + emoji + campo.value.slice(fim);
    const nova = inicio + emoji.length;
    campo.focus();
    try { campo.setSelectionRange(nova, nova); } catch(e){}
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  }

  window.anexarSeletorEmoji = function(campo){
    if (!campo || campo.dataset.emojiAnexado) return;
    campo.dataset.emojiAnexado = '1';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'emoji-seletor-btn';
    btn.textContent = '😊';
    btn.setAttribute('aria-label', 'Inserir emoji');

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (painelAberto) { fecharPainel(); return; }

      const painel = document.createElement('div');
      painel.className = 'emoji-seletor-painel';
      EMOJIS_PADRAO.forEach(emoji => {
        const opcao = document.createElement('button');
        opcao.type = 'button';
        opcao.className = 'emoji-seletor-opcao';
        opcao.textContent = emoji;
        opcao.addEventListener('click', (ev) => {
          ev.stopPropagation();
          inserirNoCampo(campo, emoji);
        });
        painel.appendChild(opcao);
      });

      document.body.appendChild(painel);
      // Posiciona colado ao botão, sem depender do layout ao redor
      const r = btn.getBoundingClientRect();
      const larguraPainel = 268;
      let esquerda = Math.min(r.left, window.innerWidth - larguraPainel - 8);
      painel.style.left = Math.max(8, esquerda) + 'px';
      const alturaEstimada = 210;
      if (r.bottom + alturaEstimada + 8 > window.innerHeight) {
        painel.style.top = Math.max(8, r.top - alturaEstimada - 6) + 'px';
      } else {
        painel.style.top = (r.bottom + 6) + 'px';
      }

      painelAberto = painel;
      setTimeout(() => document.addEventListener('click', aoClicarFora, true), 0);
    });

    campo.insertAdjacentElement('afterend', btn);
  };

  // Liga automaticamente nos campos fixos que existirem na página
  document.addEventListener('DOMContentLoaded', () => {
    ['recadoTexto', 'recadoDescricao', 'homenagemTexto', 'conteudoTexto', 'sonhoTexto', 'conversaTexto']
      .forEach(id => window.anexarSeletorEmoji(document.getElementById(id)));
  });
})();


// ============================================================
// Autenticação real nas consultas ao banco.
// Antes, todo fetch usava sempre a mesma chave pública, então o
// banco não sabia diferenciar visitante/membro/família/admin.
// Agora, window.supaFetch() busca a sessão de login de verdade
// (a mesma que já existe desde o login) e a envia em cada
// consulta — é isso que permite as regras de segurança (RLS)
// funcionarem no banco, não só na tela.
// ============================================================
(function(){
  const SUPABASE_URL_AUTH = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY_AUTH = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

  function clienteCompartilhado(){
    if (!window.supabase) return null;
    if (!window._veigaSupabaseClient) {
      window._veigaSupabaseClient = window.supabase.createClient(SUPABASE_URL_AUTH, SUPABASE_KEY_AUTH);
    }
    return window._veigaSupabaseClient;
  }

  window.supaFetch = async function(url, options){
    options = options || {};
    const headers = Object.assign({}, options.headers || {});

    let token = null;
    try {
      const cliente = clienteCompartilhado();
      if (cliente) {
        const { data } = await cliente.auth.getSession();
        token = data && data.session ? data.session.access_token : null;
      }
    } catch (e) {
      // Sem sessão válida: segue como anônimo (mesmo comportamento de antes).
    }

    headers.apikey = SUPABASE_KEY_AUTH;
    headers.Authorization = `Bearer ${token || SUPABASE_KEY_AUTH}`;
    options.headers = headers;

    return fetch(url, options);
  };
})();
