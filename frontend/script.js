// URL base do seu servidor PHP (Atualizado para usar 127.0.0.1 e resolver o erro de CORS)
const API_URL = 'http://127.0.0.1:8000';

// Seleção de elementos do DOM
const authModal = document.getElementById('auth-modal');
const authOverlay = document.getElementById('auth-overlay');
const closeAuthBtn = document.getElementById('close-auth-btn');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');

const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');

// Função auxiliar para exibir mensagens de erro/sucesso
function showMessage(element, message, type = 'error') {
  if (!element) return;
  element.textContent = message;
  element.className = `login-alert ${type}`;
  element.style.display = message ? 'block' : 'none';
}

function clearMessages() {
  showMessage(loginMessage, '');
  showMessage(registerMessage, '');
}

// Controle de Abertura/Fechamento do Modal
function openAuthModal() {
  if (!authModal) return;
  authModal.classList.remove('hidden');
  authModal.setAttribute('aria-hidden', 'false');
  showLogin();
}

function closeAuthModal() {
  if (!authModal) return;
  authModal.classList.add('hidden');
  authModal.setAttribute('aria-hidden', 'true');
  clearMessages();
}

// EVITA QUE CLIQUES DENTRO DO FORMULÁRIO FECHEM O MODAL
const authContent = document.querySelector('.auth-content');
if (authContent) {
  authContent.addEventListener('click', (event) => {
    event.stopPropagation();
  });
}

// Eventos de fechar o modal
if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthModal);
if (authOverlay) authOverlay.addEventListener('click', closeAuthModal);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeAuthModal();
});

// Alternância entre as abas Entrar / Cadastrar
function showLogin() {
  loginForm?.classList.remove('hidden');
  registerForm?.classList.add('hidden');
  tabLogin?.classList.add('active');
  tabRegister?.classList.remove('active');
  clearMessages();
}

function showRegister() {
  loginForm?.classList.add('hidden');
  registerForm?.classList.remove('hidden');
  tabLogin?.classList.remove('active');
  tabRegister?.classList.add('active');
  clearMessages();
}

tabLogin?.addEventListener('click', showLogin);
tabRegister?.addEventListener('click', showRegister);

// ==========================================
// SUBMIT DO FORMULÁRIO DE LOGIN
// ==========================================
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(loginMessage, data.message || 'E-mail ou senha inválidos.');
      return;
    }

    if (data.token) localStorage.setItem('token', data.token);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

    showMessage(loginMessage, 'Login realizado! Carregando...', 'success');

    // Recarrega a página para atualizar o estado da conta
    setTimeout(() => {
      window.location.reload();
    }, 600);

  } catch (err) {
    console.error('Erro no login:', err);
    showMessage(loginMessage, 'Erro de conexão com o servidor PHP.');
  }
});

// ==========================================
// SUBMIT DO FORMULÁRIO DE CADASTRO
// ==========================================
registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const passwordConfirmation = document.getElementById('register-password-confirmation').value;

  if (password !== passwordConfirmation) {
    showMessage(registerMessage, 'As senhas não coincidem.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(registerMessage, data.message || 'Erro ao realizar cadastro.');
      return;
    }

    if (data.token) localStorage.setItem('token', data.token);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

    showMessage(registerMessage, 'Cadastro realizado! Entrando...', 'success');

    // Recarrega a página após cadastrar
    setTimeout(() => {
      window.location.reload();
    }, 600);

  } catch (err) {
    console.error('Erro no cadastro:', err);
    showMessage(registerMessage, 'Erro de conexão com o servidor PHP.');
  }
});

// Função global de logout
async function logout() {
  const token = localStorage.getItem('token');

  if (token) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Erro ao encerrar sessão no servidor:', err);
    }
  }

  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// ==========================================
// NAVEGAÇÃO POR PAPEL + REDIRECIONAMENTO PARA LOGIN
// ==========================================
function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

// Link do painel: apenas conveniência de navegação. Quem decide o acesso é o
// servidor (GET /api/admin/check), que o admin.html consulta antes de exibir o painel.
function syncAdminLink(user) {
  const actions = document.querySelector('.header__actions');
  if (!actions) return;

  const existing = actions.querySelector('[data-admin-link]');
  const isAdmin = Boolean(localStorage.getItem('token')) && user?.role === 'admin';

  if (!isAdmin) {
    existing?.remove();
    return;
  }

  if (existing) return;

  const link = document.createElement('a');
  link.href = 'admin.html';
  link.className = 'icon-btn';
  link.dataset.adminLink = '';
  link.title = 'Painel administrativo';
  link.setAttribute('aria-label', 'Painel administrativo');
  link.innerHTML = '&#9881;';
  actions.prepend(link);
}

// O papel guardado no login pode ficar velho (ex.: usuário promovido a admin depois).
// Em cada carga de página, busca o usuário atual no servidor e atualiza o cache.
async function syncUserFromServer() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401) {
      // Token revogado/expirado: encerra a sessão local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('token_expires_at');
      return;
    }

    if (!response.ok) return;

    const data = await response.json();
    if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
  } catch (err) {
    // Sem conexão com a API: mantém o que já estava salvo
    console.error('Não foi possível atualizar os dados do usuário:', err);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Mostra de imediato com o valor salvo e corrige depois que o servidor responder
  syncAdminLink(readStoredUser());
  await syncUserFromServer();
  syncAdminLink(readStoredUser());

  // admin.html redireciona para "index.html?login=1" quando não há sessão
  if (!localStorage.getItem('token') && new URLSearchParams(window.location.search).get('login') === '1') {
    openAuthModal();
  }
});

// EXPOSIÇÃO GLOBAL DE FUNÇÕES PARA OUTROS SCRIPTS
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.logout = logout;