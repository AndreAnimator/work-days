// URL base do seu servidor PHP (Ajuste a porta ou subpasta se necessário)
const API_URL = 'http://localhost:8000';

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
      await fetch(`${API_URL}/logout.php`, {
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

// EXPOSIÇÃO GLOBAL DE FUNÇÕES PARA OUTROS SCRIPTS (COMO PERFIL.JS)
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.logout = logout;