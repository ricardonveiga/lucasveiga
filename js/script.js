const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DOMINIO_LOGIN = 'veigalucas.com.br';

const loginToggle = document.getElementById('loginToggle');
const loginOverlay = document.getElementById('loginOverlay');
const closeLogin = document.getElementById('closeLogin');
const btnPublico = document.getElementById('btnPublico');
const btnEntrar = document.getElementById('btnEntrar');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const loginError = document.getElementById('loginError');
const togglePass = document.getElementById('togglePass');

const loginFields = document.getElementById('loginFields');
const guestFields = document.getElementById('guestFields');
const lgpdFields = document.getElementById('lgpdFields');
const contentConsentFields = document.getElementById('contentConsentFields');
const forgotFields = document.getElementById('forgotFields');
const btnGuestConfirm = document.getElementById('btnGuestConfirm');
const btnGuestBack = document.getElementById('btnGuestBack');
const btnLgpdConfirm = document.getElementById('btnLgpdConfirm');
const btnLgpdCancel = document.getElementById('btnLgpdCancel');
const btnContentConsentConfirm = document.getElementById('btnContentConsentConfirm');
const btnEsqueciSenha = document.getElementById('btnEsqueciSenha');
const btnForgotBack = document.getElementById('btnForgotBack');
const guestEmail = document.getElementById('guestEmail');
const guestPhone = document.getElementById('guestPhone');
const guestError = document.getElementById('guestError');

// Guarda o que fazer depois que a pessoa confirmar o aviso de conteúdo —
// preenchido tanto pelo fluxo de membro quanto pelo de visitante.
let aoConfirmarConteudo = null;

function resetLoginView() {
  loginFields.classList.remove('login-content-hidden');
  guestFields.classList.add('login-content-hidden');
  lgpdFields.classList.add('login-content-hidden');
  contentConsentFields.classList.add('login-content-hidden');
  forgotFields.classList.add('login-content-hidden');
  guestEmail.value = '';
  guestPhone.value = '';
  guestEmail.style.borderColor = '';
  guestPhone.style.borderColor = '';
  guestError.textContent = '';
  loginError.textContent = '';
}

loginToggle.addEventListener('click', () => {
  loginOverlay.classList.add('active');
});

closeLogin.addEventListener('click', () => {
  loginOverlay.classList.remove('active');
  resetLoginView();
});

let mouseDownOnOverlay = false;

loginOverlay.addEventListener('mousedown', (e) => {
  mouseDownOnOverlay = (e.target === loginOverlay);
});

loginOverlay.addEventListener('mouseup', (e) => {
  if (mouseDownOnOverlay && e.target === loginOverlay) {
    loginOverlay.classList.remove('active');
    resetLoginView();
  }
  mouseDownOnOverlay = false;
});

togglePass.addEventListener('click', () => {
  const isHidden = loginPass.type === 'password';
  loginPass.type = isHidden ? 'text' : 'password';
});

btnEntrar.addEventListener('click', async () => {
  const usuarioDigitado = loginUser.value.trim().toLowerCase();
  const password = loginPass.value;

  loginError.textContent = '';

  if (!usuarioDigitado || !password) {
    loginError.textContent = 'Preencha usuário e senha.';
    return;
  }

  const email = usuarioDigitado.includes('@')
    ? usuarioDigitado
    : `${usuarioDigitado}@${DOMINIO_LOGIN}`;

  btnEntrar.disabled = true;
  btnEntrar.textContent = 'Entrando...';

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  btnEntrar.disabled = false;
  btnEntrar.textContent = 'Entrar';

  if (error) {
    loginError.textContent = 'Usuário ou senha incorretos.';
    return;
  }

  const { data: perfil } = await supabaseClient
    .from('usuários')
    .select('id, nome, mensagem_boas_vindas, grupo, papel')
    .eq('login', email)
    .single();

  let mensagem = 'Bem-vindo!';
  let nome = '';
  let usuarioId = '';
  let grupo = 'membro';
  let papel = 'membro';

  if (perfil && perfil.mensagem_boas_vindas) {
    mensagem = perfil.mensagem_boas_vindas;
  } else if (perfil && perfil.nome) {
    mensagem = `Bem-vindo, ${perfil.nome}!`;
  }
  if (perfil && perfil.nome) nome = perfil.nome;
  if (perfil && perfil.id) usuarioId = String(perfil.id);
  if (perfil && perfil.grupo) grupo = perfil.grupo;
  if (perfil && perfil.papel) papel = perfil.papel;

  aoConfirmarConteudo = () => {
    sessionStorage.setItem('mensagemBoasVindas', mensagem);
    sessionStorage.setItem('tipoAcesso', 'membro');
    sessionStorage.setItem('nomeUsuario', nome);
    sessionStorage.setItem('usuarioId', usuarioId);
    sessionStorage.setItem('grupoUsuario', grupo);
    sessionStorage.setItem('papelUsuario', papel);
    window.location.href = 'area.html';
  };

  loginFields.classList.add('login-content-hidden');
  contentConsentFields.classList.remove('login-content-hidden');
});

btnPublico.addEventListener('click', () => {
  loginFields.classList.add('login-content-hidden');
  guestFields.classList.remove('login-content-hidden');
});

btnGuestBack.addEventListener('click', () => {
  resetLoginView();
});

btnEsqueciSenha.addEventListener('click', () => {
  loginFields.classList.add('login-content-hidden');
  forgotFields.classList.remove('login-content-hidden');
});

btnForgotBack.addEventListener('click', () => {
  resetLoginView();
});

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function telefoneValido(numero) {
  const apenasDigitos = numero.replace(/\D/g, '');
  return apenasDigitos.length >= 8 && apenasDigitos.length <= 15;
}

async function obterIP() {
  try {
    const resp = await fetch('https://api.ipify.org?format=json');
    const dados = await resp.json();
    return dados.ip;
  } catch (e) {
    console.error('Não foi possível obter o IP:', e);
    return null;
  }
}

btnGuestConfirm.addEventListener('click', () => {
  const emailValor = guestEmail.value.trim();
  const phoneRaw = guestPhone.value.trim();

  guestEmail.style.borderColor = '';
  guestPhone.style.borderColor = '';
  guestError.textContent = '';

  if (!emailValido(emailValor)) {
    guestEmail.style.borderColor = '#e07a7a';
    guestError.textContent = 'E-mail inválido. Digite um e-mail real para continuar.';
    guestEmail.focus();
    return;
  }

  if (!telefoneValido(phoneRaw)) {
    guestPhone.style.borderColor = '#e07a7a';
    guestError.textContent = 'Telefone inválido. Use de 8 a 15 dígitos (com código do país, se estrangeiro).';
    guestPhone.focus();
    return;
  }

  guestFields.classList.add('login-content-hidden');
  lgpdFields.classList.remove('login-content-hidden');
});

btnLgpdCancel.addEventListener('click', () => {
  lgpdFields.classList.add('login-content-hidden');
  guestFields.classList.remove('login-content-hidden');
});

btnLgpdConfirm.addEventListener('click', async () => {
  const emailValor = guestEmail.value.trim();
  const phoneRaw = guestPhone.value.trim();
  const apenasDigitos = phoneRaw.replace(/\D/g, '');

  btnLgpdConfirm.disabled = true;
  btnLgpdConfirm.textContent = 'Salvando...';

  const ip = await obterIP();

  const { error } = await supabaseClient
    .from('visitantes')
    .insert([{ email: emailValor, telefone: apenasDigitos, ip: ip }]);

  btnLgpdConfirm.disabled = false;
  btnLgpdConfirm.textContent = 'Confirmar e continuar';

  if (error) {
    console.error('Erro ao salvar visitante:', error);
    lgpdFields.classList.add('login-content-hidden');
    guestFields.classList.remove('login-content-hidden');
    guestError.textContent = 'Erro ao salvar. Tente novamente.';
    return;
  }

  aoConfirmarConteudo = () => {
    // Limpa qualquer resquício de sessão anterior (de um login de membro
    // feito antes, no mesmo navegador) — sem isso, o visitante podia
    // "herdar" nome/permissões de quem usou o site antes dele.
    sessionStorage.removeItem('nomeUsuario');
    sessionStorage.removeItem('usuarioId');
    sessionStorage.removeItem('grupoUsuario');
    sessionStorage.removeItem('papelUsuario');

    sessionStorage.setItem('mensagemBoasVindas', 'Obrigado por acessar!');
    sessionStorage.setItem('tipoAcesso', 'visitante');
    window.location.href = 'area.html';
  };

  lgpdFields.classList.add('login-content-hidden');
  contentConsentFields.classList.remove('login-content-hidden');
});

btnContentConsentConfirm.addEventListener('click', () => {
  if (typeof aoConfirmarConteudo === 'function') {
    aoConfirmarConteudo();
  }
});