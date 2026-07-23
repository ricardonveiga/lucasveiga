(function(){
  // Mostra a mensagem de boas-vindas do Ricardo em TODO acesso (login novo)
  // — não é limitada a uma vez por dia como a caixa de perguntas. Usa
  // sessionStorage (não localStorage) de propósito: isso reseta sozinho
  // sempre que a pessoa abre uma sessão nova, mas não fica reaparecendo
  // a cada clique de página dentro do mesmo acesso.
  const usuarioId = sessionStorage.getItem('usuarioId');
  const tipoAcesso = sessionStorage.getItem('tipoAcesso') === 'membro' ? 'membro' : 'visitante';
  if (!usuarioId) { window.liberarPerguntasDiarias && window.liberarPerguntasDiarias(); return; }

  const CHAVE = `veigalucas_boas_vindas_mostrada`;

  function jaMostrouNestaSessao(){
    return sessionStorage.getItem(CHAVE) === '1';
  }

  function marcarMostradaNestaSessao(){
    sessionStorage.setItem(CHAVE, '1');
  }

  function liberarProximaEtapa(){
    // Sinaliza pro script das perguntas que já pode seguir com a lógica
    // dele normalmente (o próprio script decide se abre ou não — essa
    // parte continua diária, sem mudança).
    if (window.liberarPerguntasDiarias) window.liberarPerguntasDiarias();
  }

  if (jaMostrouNestaSessao()) {
    liberarProximaEtapa();
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'boas-vindas-overlay';
  overlay.innerHTML = `
    <div class="boas-vindas-caixa">
      <p class="boas-vindas-titulo">💛 Bem-vindo ao espaço do Lucas</p>

      <p>Que bom ter você aqui. Esse site existe pra guardar a memória do Lucas viva — fotos, vídeos, recados, sonhos, homenagens, conversas e a playlist com as músicas que ele amava. Cada seção do menu lateral é um jeito diferente de lembrar dele.</p>

      <p><strong>Sobre o que você pode ver:</strong> se você ganhou um login, é porque você é importante nessa história. Alguns perfis têm visibilidade total sobre o que é compartilhado aqui; outros têm uma restrição um pouco menor, dependendo de como combinamos o acesso. Não estranhe se algum conteúdo específico não aparecer pra você — é só o nível de acesso combinado, nada pessoal.</p>

      <p><strong>Sobre a carta que a IA escreve pra você:</strong> depois que você responde as perguntinhas iniciais, uma mensagem personalizada é gerada especialmente pra você. Ela chega no sininho 🔔 no topo da barra lateral — é só clicar lá pra ler.</p>

      <p><strong>Se você achar que alguém merece um login e ainda não tem, ou se você mesmo não recebeu um e acha que deveria</strong> — me procura que eu resolvo. É muita gente pra lembrar sozinho, então se ficou alguém de fora, foi sem querer, nunca por não considerarmos importante.</p>

      <p><strong>Qualquer problema no site ou dúvida</strong> — me chama diretamente, no Instagram <a href="https://instagram.com/ricardonveiga" target="_blank" rel="noopener">@ricardonveiga</a>. Estou aqui.</p>

      <p class="boas-vindas-assinatura">Com carinho,<br><strong>Ricardo (pai do Lucas)</strong></p>

      <button type="button" class="boas-vindas-fechar">Entendi ♥</button>
    </div>
  `;
  document.body.appendChild(overlay);

  function fechar(){
    marcarMostradaNestaSessao();
    overlay.remove();
    liberarProximaEtapa();
  }

  overlay.querySelector('.boas-vindas-fechar').addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });

  requestAnimationFrame(() => overlay.classList.add('ativo'));
})();
