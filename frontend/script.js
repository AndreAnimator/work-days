const API_URL = 'http://localhost:8000/api/auth';

const authModal = document.getElementById('auth-modal');
const authOverlay = document.getElementById('auth-overlay');
const closeAuthBtn = document.getElementById('close-auth-btn');
const accountBtn = document.getElementById('account-btn');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');

const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');

const searchForm = document.getElementById('search-form');

function showMessage(element, message, type = 'error') {
  if (!element) return;
  element.textContent = message;
  element.className = `auth-message ${type}`;
}

function clearMessages() {
  showMessage(loginMessage, '');
  showMessage(registerMessage, '');
}

function setButtonLoading(button, loading, loadingText, normalText) {
  if (!button) return;
  button.disabled = loading;
  button.textContent = loading ? loadingText : normalText;
}

function openAuthModal() {
  if (!authModal) return;

  authModal.classList.remove('hidden');
  authModal.setAttribute('aria-hidden', 'false');

  showLogin();

  setTimeout(() => {
    document.getElementById('login-email')?.focus();
  }, 50);
}

function closeAuthModal() {
  if (!authModal) return;

  authModal.classList.add('hidden');
  authModal.setAttribute('aria-hidden', 'true');

  clearMessages();
}

if (accountBtn) {
  accountBtn.addEventListener('click', (event) => {
    event.preventDefault();
    openAuthModal();
  });
}

if (closeAuthBtn) {
  closeAuthBtn.addEventListener('click', closeAuthModal);
}

if (authOverlay) {
  authOverlay.addEventListener('click', closeAuthModal);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeAuthModal();
  }
});

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

  setTimeout(() => {
    document.getElementById('register-name')?.focus();
  }, 50);
}

tabLogin?.addEventListener('click', showLogin);
tabRegister?.addEventListener('click', showRegister);

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return await response.json();
  }

  const text = await response.text();

  return {
    message: text || 'Resposta inválida do servidor.'
  };
}

function getApiErrorMessage(data) {
  if (!data) {
    return 'Ocorreu um erro inesperado.';
  }

  if (data.message) {
    return data.message;
  }

  if (data.errors) {
    const errors = data.errors;
    return Object.values(errors).flat().join(' ');
  }

  return 'Não foi possível concluir a operação.';
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  clearMessages();

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitButton = loginForm.querySelector('button[type="submit"]');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage(loginMessage, 'Preencha o e-mail e a senha.');
    return;
  }

  setButtonLoading(submitButton, true, 'Entrando...', 'Entrar');

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      showMessage(loginMessage, getApiErrorMessage(data));
      return;
    }

    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    if (data.expires_at) {
      localStorage.setItem('token_expires_at', data.expires_at);
    }

    showMessage(loginMessage, 'Login realizado com sucesso!', 'success');

    setTimeout(() => {
      closeAuthModal();
    }, 500);

  } catch (error) {
    console.error('Erro ao realizar login:', error);
    showMessage(
      loginMessage,
      'Não foi possível conectar ao servidor. Verifique se a API está funcionando.'
    );
  } finally {
    setButtonLoading(submitButton, false, 'Entrando...', 'Entrar');
  }
});

registerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  clearMessages();

  const nameInput = document.getElementById('register-name');
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');
  const confirmationInput = document.getElementById('register-password-confirmation');

  const submitButton = registerForm.querySelector('button[type="submit"]');

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const passwordConfirmation = confirmationInput.value;

  // Validações do frontend
  if (name.length < 3) {
    showMessage(registerMessage, 'O nome deve possuir pelo menos 3 caracteres.');
    nameInput.focus();
    return;
  }

  if (!email) {
    showMessage(registerMessage, 'Informe um e-mail válido.');
    emailInput.focus();
    return;
  }

  if (password.length < 8) {
    showMessage(registerMessage, 'A senha deve possuir pelo menos 8 caracteres.');
    passwordInput.focus();
    return;
  }

  if (password !== passwordConfirmation) {
    showMessage(registerMessage, 'As senhas não são iguais.');
    confirmationInput.focus();
    return;
  }

  setButtonLoading(submitButton, true, 'Cadastrando...', 'Cadastrar');

  try {
    const response = await fetch(`${API_URL}/register`, {
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

    const data = await parseResponse(response);

    if (!response.ok) {
      showMessage(registerMessage, getApiErrorMessage(data));
      return;
    }

    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    if (data.expires_at) {
      localStorage.setItem('token_expires_at', data.expires_at);
    }

    showMessage(registerMessage, 'Cadastro realizado com sucesso!', 'success');

    // Depois do cadastro, abre a aba de login.
    // Como a API já devolveu token, o usuário também permanece autenticado.
    setTimeout(() => {
      showLogin();
      loginForm.reset();

      if (emailInput.value) {
        document.getElementById('login-email').value = emailInput.value;
      }
    }, 700);

  } catch (error) {
    console.error('Erro ao realizar cadastro:', error);
    showMessage(
      registerMessage,
      'Não foi possível conectar ao servidor. Verifique se a API está funcionando.'
    );
  } finally {
    setButtonLoading(submitButton, false, 'Cadastrando...', 'Cadastrar');
  }
});

async function logout() {
  const token = localStorage.getItem('token');

  if (!token) return;

  try {
    await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Erro ao encerrar sessão:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expires_at');
  }
}

window.logout = logout;

async function checkAuth() {
  const token = localStorage.getItem('token');

  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('token_expires_at');
      return null;
    }

    const data = await response.json();

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data.user || null;
  } catch (error) {
    console.error('Não foi possível verificar a sessão:', error);
    return null;
  }
}

searchForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const searchInput = document.getElementById('busca');
  const term = searchInput.value.trim();

  if (!term) return;

  console.log('Busca:', term);

});

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();

  if (user) {
    console.log(`Usuário autenticado: ${user.name}`);
  }
});