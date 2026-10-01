const API_URL = 'http://localhost:8000/api';

const $ = (selector) => document.querySelector(selector);

const authModal = $('#auth-modal');
const authOverlay = $('#auth-overlay');
const loginForm = $('#login-form');
const registerForm = $('#register-form');
const loginMessage = $('#login-message');
const registerMessage = $('#register-message');
const productsContainer = $('#produtos');
const searchForm = $('#search-form');
const searchInput = $('#busca');
const cartCount = $('#cart-count');

function showMessage(element, message, type = 'error') {
  if (!element) return;
  element.textContent = message;
  element.className = `auth-message ${message ? type : ''}`.trim();
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

function saveSession(data) {
  if (data.token) localStorage.setItem('token', data.token);
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
  if (data.expires_at) localStorage.setItem('token_expires_at', data.expires_at);
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('token_expires_at');
}

function openAuthModal(tab = 'login') {
  authModal?.classList.remove('hidden');
  authModal?.setAttribute('aria-hidden', 'false');
  tab === 'register' ? showRegister() : showLogin();
}

function closeAuthModal() {
  authModal?.classList.add('hidden');
  authModal?.setAttribute('aria-hidden', 'true');
  clearMessages();
}

function showLogin() {
  loginForm?.classList.remove('hidden');
  registerForm?.classList.add('hidden');
  $('#tab-login')?.classList.add('active');
  $('#tab-register')?.classList.remove('active');
  clearMessages();
}

function showRegister() {
  loginForm?.classList.add('hidden');
  registerForm?.classList.remove('hidden');
  $('#tab-login')?.classList.remove('active');
  $('#tab-register')?.classList.add('active');
  clearMessages();
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();

  const text = await response.text();
  return { message: text || 'Resposta inválida do servidor.' };
}

function getApiErrorMessage(data) {
  if (data?.message) return data.message;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return 'Não foi possível concluir a operação.';
}

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(getApiErrorMessage(data));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function loadProducts(search = '') {
  if (!productsContainer) return;

  productsContainer.innerHTML = '<p>Carregando produtos...</p>';

  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await request(`/products${query}`);
    renderProducts(data.products || []);
  } catch (error) {
    console.error(error);
    productsContainer.innerHTML = '<p>Não foi possível carregar os produtos.</p>';
  }
}

function renderProducts(products) {
  if (!products.length) {
    productsContainer.innerHTML = '<p>Nenhum produto encontrado.</p>';
    return;
  }

  productsContainer.innerHTML = products.map((product) => `
    <article class="produto-card">
      <div class="produto-card__img">
        <img src="${escapeHtml(product.image || '')}" alt="${escapeHtml(product.name)}" loading="lazy">
      </div>
      <strong class="produto-card__nome">${escapeHtml(product.name)}</strong>
      <p class="produto-card__desc">${escapeHtml(product.description || '')}</p>
      <span class="produto-card__preco">${formatPrice(product.price)}</span>
      <small>${Number(product.stock) > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}</small>
      <button
        class="produto-card__btn"
        type="button"
        data-product-id="${Number(product.id)}"
        ${Number(product.stock) <= 0 ? 'disabled' : ''}
      >
        Adicionar ao carrinho
      </button>
    </article>
  `).join('');

  productsContainer.querySelectorAll('[data-product-id]').forEach((button) => {
    button.addEventListener('click', () => addToCart(Number(button.dataset.productId), button));
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatPrice(value) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

async function addToCart(productId, button) {
  if (!localStorage.getItem('token')) {
    openAuthModal('login');
    showMessage(loginMessage, 'Faça login para adicionar produtos ao carrinho.');
    return;
  }

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Adicionando...';

  try {
    const data = await request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    });

    updateCartCount(data.items_count);
    button.textContent = 'Adicionado!';
    setTimeout(() => { button.textContent = originalText; }, 800);
  } catch (error) {
    if (error.status === 401) clearSession();
    alert(error.message);
    button.textContent = originalText;
  } finally {
    button.disabled = false;
  }
}

function updateCartCount(count) {
  if (cartCount) cartCount.textContent = String(count ?? 0);
}

async function loadCart() {
  if (!localStorage.getItem('token')) {
    updateCartCount(0);
    return;
  }

  try {
    const data = await request('/cart');
    updateCartCount(data.items_count);
  } catch (error) {
    if (error.status === 401) clearSession();
  }
}

$('#account-btn')?.addEventListener('click', (event) => {
  event.preventDefault();
  openAuthModal();
});

$('#close-auth-btn')?.addEventListener('click', closeAuthModal);
authOverlay?.addEventListener('click', closeAuthModal);
$('#tab-login')?.addEventListener('click', showLogin);
$('#tab-register')?.addEventListener('click', showRegister);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !authModal?.classList.contains('hidden')) {
    closeAuthModal();
  }
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessages();

  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;
  const button = loginForm.querySelector('button[type="submit"]');

  if (!email || !password) {
    showMessage(loginMessage, 'Preencha o e-mail e a senha.');
    return;
  }

  setButtonLoading(button, true, 'Entrando...', 'Entrar');

  try {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    saveSession(data);
    showMessage(loginMessage, 'Login realizado com sucesso!', 'success');
    await loadCart();
    setTimeout(closeAuthModal, 400);
  } catch (error) {
    showMessage(loginMessage, error.message);
  } finally {
    setButtonLoading(button, false, 'Entrando...', 'Entrar');
  }
});

registerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessages();

  const nameInput = $('#register-name');
  const emailInput = $('#register-email');
  const passwordInput = $('#register-password');
  const confirmationInput = $('#register-password-confirmation');
  const button = registerForm.querySelector('button[type="submit"]');

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const passwordConfirmation = confirmationInput.value;

  if (name.length < 3) {
    showMessage(registerMessage, 'O nome deve possuir pelo menos 3 caracteres.');
    nameInput.focus();
    return;
  }

  if (!emailInput.validity.valid) {
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

  setButtonLoading(button, true, 'Cadastrando...', 'Cadastrar');

  try {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirmation }),
    });

    saveSession(data);
    showMessage(registerMessage, 'Cadastro realizado com sucesso!', 'success');
    await loadCart();

    setTimeout(() => {
      registerForm.reset();
      showLogin();
      $('#login-email').value = email;
      $('#login-password').focus();
    }, 500);
  } catch (error) {
    showMessage(registerMessage, error.message);
  } finally {
    setButtonLoading(button, false, 'Cadastrando...', 'Cadastrar');
  }
});

async function logout() {
  try {
    if (localStorage.getItem('token')) {
      await request('/auth/logout', { method: 'POST' });
    }
  } catch (error) {
    console.error(error);
  } finally {
    clearSession();
    updateCartCount(0);
  }
}

window.logout = logout;

async function checkAuth() {
  if (!localStorage.getItem('token')) return null;

  try {
    const data = await request('/auth/me');
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  } catch (error) {
    if (error.status === 401) clearSession();
    return null;
  }
}

searchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  loadProducts(searchInput.value.trim());
});

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([checkAuth(), loadProducts(), loadCart()]);
});
