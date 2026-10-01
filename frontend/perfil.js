document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('auth_token');
  const btnAuth = document.getElementById('btn-auth-action');

  if (!token) {
    // ESTADO: DESLOGADO -> Transforma botão em "Fazer Login"
    configurarBotaoLogin(btnAuth);
    exibirStatus('Você não está autenticado. Faça login para visualizar e editar seus dados.', 'warning');
    document.getElementById('user-display-name').textContent = 'Visitante';
    return;
  }

  // ESTADO: LOGADO -> Configura botão para "Sair da Conta" e carrega perfil
  configurarBotaoLogout(btnAuth, token);
  carregarPerfil(token);
});

/**
 * Transforma o botão no estado "Fazer Login"
 */
function configurarBotaoLogin(btnElement) {
  if (!btnElement) return;

  const authText = document.getElementById('auth-text');
  const authIcon = document.getElementById('auth-icon');

  if (authText) authText.textContent = 'Fazer Login';
  if (authIcon) authIcon.innerHTML = '&#128275;'; // Ícone de chave/login

  btnElement.style.color = '#137333';
  btnElement.onclick = (e) => {
    e.preventDefault();
    window.location.href = 'login.html'; // Altere para sua página de login
  };
}

/**
 * Transforma o botão no estado "Sair da Conta"
 */
function configurarBotaoLogout(btnElement, token) {
  if (!btnElement) return;

  const authText = document.getElementById('auth-text');
  const authIcon = document.getElementById('auth-icon');

  if (authText) authText.textContent = 'Sair da Conta';
  if (authIcon) authIcon.innerHTML = '&#10006;'; // Ícone de fechar/sair

  btnElement.style.color = '#b30000';
  btnElement.onclick = (e) => {
    e.preventDefault();
    fazerLogout(token);
  };
}

/**
 * Busca os dados do usuário logado na API
 */
async function carregarPerfil(token) {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        exibirStatus('Sua sessão expirou. Por favor, faça login novamente.', 'error');
        document.getElementById('user-display-name').textContent = 'Sessão Expirada';
        
        // Atualiza botão para Login
        const btnAuth = document.getElementById('btn-auth-action');
        configurarBotaoLogin(btnAuth);
        return;
      }
      throw new Error(`Erro na requisição: ${response.status}`);
    }

    const data = await response.json();
    const user = data.user;

    if (user) {
      document.getElementById('user-display-name').textContent = user.name || 'Cliente Imperial';
      document.getElementById('nome').value = user.name || '';
      document.getElementById('email').value = user.email || '';
      
      if (document.getElementById('telefone')) {
        document.getElementById('telefone').value = user.phone || '';
      }
      if (document.getElementById('cpf')) {
        document.getElementById('cpf').value = user.cpf || '';
      }
    }

  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    exibirStatus('Não foi possível conectar ao servidor backend.', 'warning');
    document.getElementById('user-display-name').textContent = 'Modo Offline';
  }
}

/**
 * Encerra a sessão via API e remove o token
 */
async function fazerLogout(token) {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
  } catch (error) {
    console.error('Erro no logout:', error);
  } finally {
    localStorage.removeItem('auth_token');
    window.location.href = 'index.html';
  }
}

/**
 * Alerta de aviso no topo do formulário
 */
function exibirStatus(mensagem, tipo = 'info') {
  const statusMsg = document.getElementById('status-message');
  if (!statusMsg) return;

  statusMsg.style.display = 'block';
  statusMsg.textContent = mensagem;

  if (tipo === 'error') {
    statusMsg.style.backgroundColor = '#fce8e6';
    statusMsg.style.color = '#c5221f';
    statusMsg.style.border = '1px solid #f5c6cb';
  } else if (tipo === 'warning') {
    statusMsg.style.backgroundColor = '#fef7e0';
    statusMsg.style.color = '#b06000';
    statusMsg.style.border = '1px solid #ffeba5';
  } else {
    statusMsg.style.backgroundColor = '#e6f4ea';
    statusMsg.style.color = '#137333';
    statusMsg.style.border = '1px solid #c3e6cb';
  }
}