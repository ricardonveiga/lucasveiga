(function(){
  const SUPABASE_URL = 'https://igvtlqkkflpjrgasapos.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_1WkbxOWGZWAfhnwhRdwcQQ_CJ-4-Ini';

  if (!window.supabase) return;
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const pencilBtn = document.getElementById('editPasswordIcon');
  const modal = document.getElementById('senhaModal');
  const btnClose = document.getElementById('senhaModalClose');
  const novaSenhaEl = document.getElementById('novaSenha');
  const confirmarSenhaEl = document.getElementById('confirmarSenha');
  const erroEl = document.getElementById('senhaModalErro');
  const btnSalvar = document.getElementById('btnSalvarSenha');

  if (!pencilBtn || !modal) return;

  let sucessoEl = document.getElementById('senhaModalSucesso');
  if (!sucessoEl) {
    sucessoEl = document.createElement('p');
    sucessoEl.id = 'senhaModalSucesso';
    sucessoEl.className = 'senha-modal-sucesso';
    sucessoEl.style.display = 'none';
    btnSalvar.parentNode.insertBefore(sucessoEl, btnSalvar);
  }

  function abrir(){
    novaSenhaEl.value = '';
    confirmarSenhaEl.value = '';
    erroEl.textContent = '';
    sucessoEl.style.display = 'none';
    sucessoEl.textContent = '';
    novaSenhaEl.disabled = false;
    confirmarSenhaEl.disabled = false;
    btnSalvar.style.display = '';
    modal.classList.add('active');
  }
  function fechar(){
    modal.classList.remove('active');
  }

  pencilBtn.addEventListener('click', abrir);
  btnClose.addEventListener('click', fechar);
  modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });

  btnSalvar.addEventListener('click', async () => {
    const novaSenha = novaSenhaEl.value;
    const confirmar = confirmarSenhaEl.value;
    erroEl.textContent = '';

    if (novaSenha.length < 6) {
      erroEl.textContent = 'A senha precisa ter pelo menos 6 caracteres.';
      return;
    }
    if (novaSenha !== confirmar) {
      erroEl.textContent = 'As senhas não coincidem.';
      return;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    const { error } = await supabaseClient.auth.updateUser({ password: novaSenha });

    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar nova senha';

    if (error) {
      erroEl.textContent = 'Não foi possível alterar a senha. Faça login novamente e tente de novo.';
      console.error('Erro ao alterar senha:', error);
      return;
    }

    novaSenhaEl.disabled = true;
    confirmarSenhaEl.disabled = true;
    btnSalvar.style.display = 'none';
    sucessoEl.textContent = '✓ Senha nova cadastrada com sucesso!';
    sucessoEl.style.display = 'block';

    setTimeout(fechar, 1800);
  });
})();