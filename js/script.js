const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DOMINIO_LOGIN = 'veigalucas.com.br';

const loginToggle = document.getElementById('loginToggle');
const loginOverlay = document.getElementById('loginOverlay');
const closeLogin = document.getElementById('closeLogin');
const btnEntrar = document.getElementById('btnEntrar');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const loginError = document.getElementById('loginError');
const loginSuccess = document.getElementById('loginSuccess');
const togglePass = document.getElementById('togglePass');

const loginFields = document.getElementById('loginFields');
const guestFields = document.getElementById('guestFields');
const lgpdFields = document.getElementById('lgpdFields');
const contentConsentFields = document.getElementById('contentConsentFields');
const forgotFields = document.getElementById('forgotFields');
const btnCriarCadastro = document.getElementById('btnCriarCadastro');
const btnGuestConfirm = document.getElementById('btnGuestConfirm');
const btnGuestBack = document.getElementById('btnGuestBack');
const btnLgpdConfirm = document.getElementById('btnLgpdConfirm');
const btnLgpdCancel = document.getElementById('btnLgpdCancel');
const btnContentConsentConfirm = document.getElementById('btnContentConsentConfirm');
const btnEsqueciSenha = document.getElementById('btnEsqueciSenha');
const btnForgotBack = document.getElementById('btnForgotBack');
const guestEmail = document.getElementById('guestEmail');
const guestNome = document.getElementById('guestNome');
const guestPhone = document.getElementById('guestPhone');
const guestCpf = document.getElementById('guestCpf');
const guestPass = document.getElementById('guestPass');
const guestPassConfirm = document.getElementById('guestPassConfirm');
const guestError = document.getElementById('guestError');

// Valida CPF de verdade (dígitos verificadores), não só o formato.
// Isso barra CPF inventado ou digitado errado, mas não confirma que o
// CPF pertence à pessoa — isso exigiria consulta a uma base oficial.
function cpfValido(cpfBruto){
  const cpf = (cpfBruto || '').replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i], 10) * (10 - i);
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;
  if (digito1 !== parseInt(cpf[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i], 10) * (11 - i);
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;
  if (digito2 !== parseInt(cpf[10], 10)) return false;

  return true;
}

if (guestCpf) {
  guestCpf.addEventListener('input', () => {
    let v = guestCpf.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    guestCpf.value = v;
  });
}

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
  if (guestNome) guestNome.value = '';
  guestPhone.value = '';
  if (guestCpf) guestCpf.value = '';
  if (guestPass) guestPass.value = '';
  if (guestPassConfirm) guestPassConfirm.value = '';
  guestEmail.style.borderColor = '';
  guestPhone.style.borderColor = '';
  if (guestCpf) guestCpf.style.borderColor = '';
  if (guestPass) guestPass.style.borderColor = '';
  guestError.textContent = '';
  loginError.textContent = '';
  if (loginSuccess) loginSuccess.textContent = '';
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
  if (loginSuccess) loginSuccess.textContent = '';

  if (!usuarioDigitado || !password) {
    loginError.textContent = 'Preencha email e senha.';
    return;
  }

  const email = usuarioDigitado.includes('@')
    ? usuarioDigitado
    : `${usuarioDigitado}@${DOMINIO_LOGIN}`;

  btnEntrar.disabled = true;
  btnEntrar.textContent = 'Entrando...';

  const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  btnEntrar.disabled = false;
  btnEntrar.textContent = 'Entrar';

  if (error) {
    loginError.textContent = 'Email ou senha incorretos.';
    return;
  }

  // Primeiro tenta como membro/família (tabela usuários);
  // se não encontrar, tenta como visitante (tabela visitantes).
  const { data: perfil } = await supabaseClient
    .from('usuários')
    .select('id, nome, mensagem_boas_vindas, grupo, papel')
    .eq('login', email)
    .maybeSingle();

  if (perfil) {
    let mensagem = 'Bem-vindo!';
    if (perfil.mensagem_boas_vindas) {
      mensagem = perfil.mensagem_boas_vindas;
    } else if (perfil.nome) {
      mensagem = `Bem-vindo, ${perfil.nome}!`;
    }

    aoConfirmarConteudo = () => {
      sessionStorage.setItem('mensagemBoasVindas', mensagem);
      sessionStorage.setItem('tipoAcesso', 'membro');
      sessionStorage.setItem('nomeUsuario', perfil.nome || '');
      sessionStorage.setItem('usuarioId', perfil.id ? String(perfil.id) : '');
      sessionStorage.setItem('grupoUsuario', perfil.grupo || 'membro');
      sessionStorage.setItem('papelUsuario', perfil.papel || 'membro');
      window.location.href = 'area.html';
    };
  } else {
    const { data: visitantePerfil } = await supabaseClient
      .from('visitantes')
      .select('id, nome')
      .eq('auth_uid', authData.user.id)
      .maybeSingle();

    const usuarioIdVisitante = visitantePerfil ? String(visitantePerfil.id) : '';
    const nomeVisitante = visitantePerfil && visitantePerfil.nome ? visitantePerfil.nome : '';

    aoConfirmarConteudo = () => {
      sessionStorage.removeItem('grupoUsuario');
      sessionStorage.removeItem('papelUsuario');

      sessionStorage.setItem('mensagemBoasVindas', nomeVisitante ? `Que bom te ver de novo, ${nomeVisitante}!` : 'Que bom te ver de novo!');
      sessionStorage.setItem('tipoAcesso', 'visitante');
      sessionStorage.setItem('usuarioId', usuarioIdVisitante);
      sessionStorage.setItem('nomeUsuario', nomeVisitante);
      window.location.href = 'area.html';
    };
  }

  loginFields.classList.add('login-content-hidden');
  contentConsentFields.classList.remove('login-content-hidden');
});

btnCriarCadastro.addEventListener('click', () => {
  loginError.textContent = '';
  if (loginSuccess) loginSuccess.textContent = '';
  loginFields.classList.add('login-content-hidden');
  guestFields.classList.remove('login-content-hidden');
});

btnGuestBack.addEventListener('click', () => {
  guestFields.classList.add('login-content-hidden');
  loginFields.classList.remove('login-content-hidden');
});

btnEsqueciSenha.addEventListener('click', () => {
  loginFields.classList.add('login-content-hidden');
  forgotFields.classList.remove('login-content-hidden');
});

btnForgotBack.addEventListener('click', () => {
  resetLoginView();

const btnForgotConfirm = document.getElementById('btnForgotConfirm');
if (btnForgotConfirm) {
  btnForgotConfirm.addEventListener('click', async () => {
    const emailEl = document.getElementById('forgotEmail');
    const cpfEl = document.getElementById('forgotCpf');
    const erroEl = document.getElementById('forgotErro');
    const resultadoEl = document.getElementById('forgotResultado');
    const senhaEl = document.getElementById('forgotNovaSenha');

    erroEl.textContent = '';
    resultadoEl.classList.add('login-content-hidden');

    const email = emailEl.value.trim().toLowerCase();
    const cpf = cpfEl.value.replace(/\D/g, '');

    if (!email.includes('@')) { erroEl.textContent = 'Informe um email válido.'; return; }
    if (cpf.length !== 11) { erroEl.textContent = 'Informe o CPF completo (11 números).'; return; }

    btnForgotConfirm.disabled = true;
    btnForgotConfirm.textContent = 'Gerando...';

    try {
      const resp = await fetch('https://igvtlqkkflpjrgasapos.supabase.co/functions/v1/redefinir-senha', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, cpf })
      });
      const dados = await resp.json();

      if (!resp.ok || dados.erro) {
        erroEl.textContent = dados.erro || 'Não foi possível redefinir agora. Tente novamente.';
      } else {
        senhaEl.textContent = dados.senha;
        resultadoEl.classList.remove('login-content-hidden');
        loginUser.value = email;
        loginPass.value = '';
      }
    } catch (e) {
      erroEl.textContent = 'Não foi possível redefinir agora. Tente novamente.';
    }

    btnForgotConfirm.disabled = false;
    btnForgotConfirm.textContent = 'Gerar nova senha';
  });
}
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
  const nomeValor = guestNome ? guestNome.value.trim() : '';
  const emailValor = guestEmail.value.trim();
  const phoneRaw = guestPhone.value.trim();
  const cpfValor = guestCpf ? guestCpf.value.trim() : '';
  const senhaValor = guestPass ? guestPass.value : '';
  const senhaConfirmValor = guestPassConfirm ? guestPassConfirm.value : '';

  guestEmail.style.borderColor = '';
  guestPhone.style.borderColor = '';
  if (guestNome) guestNome.style.borderColor = '';
  if (guestCpf) guestCpf.style.borderColor = '';
  if (guestPass) guestPass.style.borderColor = '';
  if (guestPassConfirm) guestPassConfirm.style.borderColor = '';
  guestError.textContent = '';

  if (!nomeValor) {
    guestNome.style.borderColor = '#e07a7a';
    guestError.textContent = 'Escreva seu nome para continuar.';
    guestNome.focus();
    return;
  }

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

  if (!cpfValido(cpfValor)) {
    guestCpf.style.borderColor = '#e07a7a';
    guestError.textContent = 'CPF inválido. Confira os números digitados.';
    guestCpf.focus();
    return;
  }

  if (!senhaValor || senhaValor.length < 6) {
    guestPass.style.borderColor = '#e07a7a';
    guestError.textContent = 'Crie uma senha com pelo menos 6 caracteres.';
    guestPass.focus();
    return;
  }

  if (senhaValor !== senhaConfirmValor) {
    guestPassConfirm.style.borderColor = '#e07a7a';
    guestError.textContent = 'As senhas não são iguais.';
    guestPassConfirm.focus();
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
  const nomeValor = guestNome ? guestNome.value.trim() : '';
  const emailValor = guestEmail.value.trim();
  const phoneRaw = guestPhone.value.trim();
  const apenasDigitos = phoneRaw.replace(/\D/g, '');
  const cpfDigitos = guestCpf ? guestCpf.value.replace(/\D/g, '') : '';
  const senhaValor = guestPass ? guestPass.value : '';

  btnLgpdConfirm.disabled = true;
  btnLgpdConfirm.textContent = 'Criando cadastro...';

  const ip = await obterIP();

  const { data: authData, error: authError } = await supabaseClient.auth.signUp({
    email: emailValor,
    password: senhaValor
  });

  if (authError) {
    btnLgpdConfirm.disabled = false;
    btnLgpdConfirm.textContent = 'Confirmar e continuar';
    console.error('Erro ao criar cadastro:', authError);
    lgpdFields.classList.add('login-content-hidden');
    guestFields.classList.remove('login-content-hidden');
    guestError.textContent = authError.message.includes('already registered')
      ? 'Esse e-mail já tem cadastro. Volte e entre com seu email e senha na tela de login.'
      : 'Erro ao criar cadastro. Tente novamente.';
    return;
  }

  const { data: visitanteSalvo, error } = await supabaseClient
    .from('visitantes')
    .insert([{
      nome: nomeValor,
      email: emailValor,
      telefone: apenasDigitos,
      cpf: cpfDigitos,
      ip: ip,
      auth_uid: authData.user ? authData.user.id : null
    }])
    .select()
    .single();

  btnLgpdConfirm.disabled = false;
  btnLgpdConfirm.textContent = 'Confirmar e continuar';

  if (error) {
    console.error('Erro ao salvar visitante:', error);
    lgpdFields.classList.add('login-content-hidden');
    guestFields.classList.remove('login-content-hidden');
    guestError.textContent = 'Erro ao salvar. Tente novamente.';
    return;
  }

  // O signUp deixa uma sessão aberta; encerra para a pessoa entrar
  // de verdade pela tela de login, com o email e a senha que criou.
  await supabaseClient.auth.signOut();

  // Volta para a tela inicial de login com o email já preenchido
  lgpdFields.classList.add('login-content-hidden');
  loginFields.classList.remove('login-content-hidden');
  loginUser.value = emailValor;
  loginPass.value = '';
  loginError.textContent = '';
  if (loginSuccess) loginSuccess.textContent = 'Cadastro criado! Agora entre com seu email e senha.';

  // Limpa o formulário de cadastro
  if (guestNome) guestNome.value = '';
  guestEmail.value = '';
  guestPhone.value = '';
  if (guestCpf) guestCpf.value = '';
  if (guestPass) guestPass.value = '';
  if (guestPassConfirm) guestPassConfirm.value = '';
  guestError.textContent = '';
});

btnContentConsentConfirm.addEventListener('click', () => {
  if (typeof aoConfirmarConteudo === 'function') {
    aoConfirmarConteudo();
  }
});