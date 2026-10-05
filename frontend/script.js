'use strict';

const API_URL = 'http://127.0.0.1:8000';

const $ = (id) => document.getElementById(id);

const authModal = $('auth-modal');
const authOverlay = $('auth-overlay');
const closeAuthBtn = $('close-auth-btn');
const authContent = document.querySelector('.auth-modal__content');

const loginForm = $('login-form');
const registerForm = $('register-form');
const tabLogin = $('tab-login');
const tabRegister = $('tab-register');
const loginMessage = $('login-message');
const registerMessage = $('register-message');
const productsEl = $('produtos');
const searchForm = $('search-form');
const searchInput = $('busca');
const cartCountEl = $('cart-count');

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

class ApiError extends Error {
  constructor(status, message, errors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

function showMessage(element, message, type = 'error') {
  if (!element) return;
  element.textContent = message;
  element.className = `auth-message ${type}`;
  element.style.display = message ? 'block' : 'none';
}

function clearMessages() {
  showMessage(loginMessage, '');
  showMessage(registerMessage, '');
}

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('token_expires_at');
}

async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { Accept: 'application/json' };
  const token = localStorage.getItem('token');

  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Algumas respostas válidas podem não possuir corpo.
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.message || `Erro inesperado (HTTP ${response.status}).`,
      data?.errors || {},
    );
  }

  return data;
}

/* ========================= Autenticação ========================= */
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

closeAuthBtn?.addEventListener('click', closeAuthModal);
authOverlay?.addEventListener('click', closeAuthModal);
authContent?.addEventListener('click', (event) => event.stopPropagation());
tabLogin?.addEventListener('click', showLogin);
tabRegister?.addEventListener('click', showRegister);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && authModal && !authModal.classList.contains('hidden')) {
    closeAuthModal();
  }
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessages();

  const email = $('login-email')?.value.trim() || '';
  const password = $('login-password')?.value || '';

  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    if (data?.token) localStorage.setItem('token', data.token);
    if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
    if (data?.expires_at) localStorage.setItem('token_expires_at', data.expires_at);

    showMessage(loginMessage, 'Login realizado! Carregando...', 'success');
    setTimeout(() => window.location.reload(), 500);
  } catch (error) {
    showMessage(loginMessage, error.message || 'E-mail ou senha inválidos.');
  }
});

registerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessages();

  const name = $('register-name')?.value.trim() || '';
  const email = $('register-email')?.value.trim() || '';
  const password = $('register-password')?.value || '';
  const passwordConfirmation = $('register-password-confirmation')?.value || '';

  if (password !== passwordConfirmation) {
    showMessage(registerMessage, 'As senhas não coincidem.');
    return;
  }

  try {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: { name, email, password, password_confirmation: passwordConfirmation },
    });

    if (data?.token) localStorage.setItem('token', data.token);
    if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
    if (data?.expires_at) localStorage.setItem('token_expires_at', data.expires_at);

    showMessage(registerMessage, 'Cadastro realizado! Entrando...', 'success');
    setTimeout(() => window.location.reload(), 500);
  } catch (error) {
    const firstFieldError = Object.values(error.errors || {})[0]?.[0];
    showMessage(registerMessage, firstFieldError || error.message || 'Erro ao realizar cadastro.');
  }
});

async function logout() {
  const token = localStorage.getItem('token');
  if (!token) {
    clearSession();
    return;
  }

  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.warn('Não foi possível invalidar o token no servidor:', error);
  } finally {
    clearSession();
  }
}

/* ========================= Catálogo ========================= */
function safeImageUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function productCard(product) {
  const card = document.createElement('article');
  card.className = 'produto-card';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'produto-card__img';
  const src = safeImageUrl(product.image);
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = product.name;
    img.loading = 'lazy';
    img.addEventListener('error', () => imageWrap.replaceChildren());
    imageWrap.append(img);
  } else {
    imageWrap.textContent = 'Sem imagem';
  }

  const name = document.createElement('h3');
  name.className = 'produto-card__nome';
  name.textContent = product.name;

  const description = document.createElement('p');
  description.className = 'produto-card__desc';
  description.textContent = product.description || 'Produto de qualidade para seu jogo.';

  const price = document.createElement('div');
  price.className = 'produto-card__preco';
  price.textContent = brl.format(Number(product.price));

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'produto-card__btn';
  button.textContent = Number(product.stock) > 0 ? 'Adicionar ao carrinho' : 'Sem estoque';
  button.disabled = Number(product.stock) <= 0;
  button.addEventListener('click', () => addToCart(product.id, button));

  card.append(imageWrap, name, description, price, button);
  return card;
}

function renderProducts(products) {
  if (!productsEl) return;
  productsEl.replaceChildren();

  if (!products.length) {
    const empty = document.createElement('p');
    empty.className = 'produto-card__desc';
    empty.textContent = 'Nenhum produto encontrado.';
    productsEl.append(empty);
    return;
  }

  products.forEach((product) => productsEl.append(productCard(product)));
}

async function loadProducts(search = '') {
  if (!productsEl) return;
  productsEl.replaceChildren();

  const loading = document.createElement('p');
  loading.className = 'produto-card__desc';
  loading.textContent = 'Carregando produtos…';
  productsEl.append(loading);

  try {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const data = await api(`/api/products${query}`);
    renderProducts(Array.isArray(data?.products) ? data.products : []);
  } catch (error) {
    productsEl.replaceChildren();
    const message = document.createElement('p');
    message.className = 'produto-card__desc';
    message.textContent = error.message || 'Não foi possível carregar os produtos.';
    productsEl.append(message);
  }
}

async function addToCart(productId, button) {
  const token = localStorage.getItem('token');
  if (!token) {
    openAuthModal();
    return;
  }

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Adicionando…';

  try {
    const data = await api('/api/cart/items', {
      method: 'POST',
      auth: true,
      body: { product_id: productId, quantity: 1 },
    });
    updateCartCount(data);
    button.textContent = 'Adicionado ✓';
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 900);
  } catch (error) {
    if (error.status === 401) {
      clearSession();
      openAuthModal();
    } else {
      alert(error.message || 'Não foi possível adicionar o produto.');
    }
    button.textContent = originalText;
    button.disabled = false;
  }
}

function updateCartCount(cart) {
  if (!cartCountEl || !cart) return;
  const count = Number(cart.items_count || 0);
  cartCountEl.textContent = String(Number.isFinite(count) ? count : 0);
}

async function loadCartCount() {
  if (!localStorage.getItem('token') || !cartCountEl) return;
  try {
    const cart = await api('/api/cart', { auth: true });
    updateCartCount(cart);
  } catch (error) {
    if (error.status === 401) clearSession();
  }
}

searchForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const term = searchInput?.value.trim() || '';
  const url = new URL('produtos.html', window.location.href);

  if (term) {
    url.searchParams.set('q', term);
  }

  // A busca do cabeçalho sempre leva ao catálogo, onde os resultados
  // podem ser refinados por categoria e ordenação.
  window.location.href = url.href;
});



// O botão do carrinho é uma navegação normal para carrinho.html.
// A própria página do carrinho decide se deve mostrar login ou o conteúdo.
// Não bloqueamos o clique aqui, pois este script também é carregado na home,
// perfil e outras páginas.

/* ========================= Usuário / navegação ========================= */
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
  link.textContent = '⚙';
  actions.prepend(link);
}

async function syncUserFromServer() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const data = await api('/api/auth/me', { auth: true });
    if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
  } catch (error) {
    if (error.status === 401) clearSession();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  syncAdminLink(readStoredUser());
  await syncUserFromServer();
  syncAdminLink(readStoredUser());

  await Promise.all([loadProducts(), loadCartCount()]);

  if (!localStorage.getItem('token') && new URLSearchParams(window.location.search).get('login') === '1') {
    openAuthModal();
  }
});

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.logout = logout;


document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // CARROSSEL / BANNER HERO
  // ==========================================
  const heroSection = document.getElementById("hero");

  if (heroSection) {
    const btnPrev = heroSection.querySelector(".hero__arrow--prev");
    const btnNext = heroSection.querySelector(".hero__arrow--next");
    const dots = heroSection.querySelectorAll(".hero__dots button");

    // Conteúdos para os slides do Banner
    const slidesData = [
      {
        eyebrow: "Qualidade • Tradição • Honra",
        title: "A arte da sinuca,<br><span>digna de uma dinastia</span>",
        text: "Tacos, mesas, bolas, giz, triângulos, maletas e muito mais. Equipamentos escolhidos com rigor para você jogar como um mestre ou apenas reunir os amigos à mesa.",
        btnText: "Ver produtos &rarr;",
        btnLink: "produtos.html"
      },
      {
        eyebrow: "Lançamento • Exclusividade",
        title: "Tacos Profissionais<br><span>de Alta Precisão</span>",
        text: "Feitos com madeiras nobres selecionadas para garantir o equilíbrio perfeito e máxima estabilidade em cada tacada.",
        btnText: "Conhecer Tacos &rarr;",
        btnLink: "produtos.html?c=tacos"
      },
      {
        eyebrow: "Sob Medida • Elegância",
        title: "Mesas Oficiais<br><span>para a Sua Casa</span>",
        text: "Transforme o seu espaço de lazer com mesas acabadas à mão, pedra ardósia polida e tecido de altíssima durabilidade.",
        btnText: "Ver Mesas &rarr;",
        btnLink: "produtos.html?c=mesas"
      }
    ];

    let currentSlide = 0;
    let autoSlideInterval = null;

    // Seleciona os elementos do HTML que vão mudar
    const eyebrowEl = heroSection.querySelector(".hero__eyebrow");
    const titleEl = heroSection.querySelector("h1");
    const textEl = heroSection.querySelector(".hero__text");
    const btnEl = heroSection.querySelector(".btn--primary");

    // Função para atualizar o slide na tela
    function updateSlide(index) {
      currentSlide = index;

      // Animação suave de saída
      const contentBox = heroSection.querySelector(".hero__content");
      if (contentBox) {
        contentBox.style.opacity = "0";
        contentBox.style.transform = "translateY(5px)";
        contentBox.style.transition = "all 0.25s ease";
      }

      setTimeout(() => {
        // Atualiza os textos do slide
        const data = slidesData[currentSlide];
        if (eyebrowEl) eyebrowEl.innerHTML = data.eyebrow;
        if (titleEl) titleEl.innerHTML = data.title;
        if (textEl) textEl.innerHTML = data.text;
        if (btnEl) {
          btnEl.innerHTML = data.btnText;
          btnEl.setAttribute("href", data.btnLink);
        }

        // Atualiza os pontos (dots)
        dots.forEach((dot, idx) => {
          if (idx === currentSlide) {
            dot.classList.add("active");
          } else {
            dot.classList.remove("active");
          }
        });

        // Animação suave de entrada
        if (contentBox) {
          contentBox.style.opacity = "1";
          contentBox.style.transform = "translateY(0)";
        }
      }, 250);
    }

    function nextSlide() {
      const nextIndex = (currentSlide + 1) % slidesData.length;
      updateSlide(nextIndex);
    }

    function prevSlide() {
      const prevIndex = (currentSlide - 1 + slidesData.length) % slidesData.length;
      updateSlide(prevIndex);
    }

    // Iniciar temporizador automático (muda a cada 5 segundos)
    function startAutoSlide() {
      stopAutoSlide();
      autoSlideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
      }
    }

    // Eventos das Setas
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        nextSlide();
        startAutoSlide(); // Reinicia o tempo ao clicar
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        prevSlide();
        startAutoSlide(); // Reinicia o tempo ao clicar
      });
    }

    // Eventos dos Pontos (Dots)
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        updateSlide(index);
        startAutoSlide();
      });
    });

    // Pausa o carrossel se o utilizador passar o rato por cima
    heroSection.addEventListener("mouseenter", stopAutoSlide);
    heroSection.addEventListener("mouseleave", startAutoSlide);

    // Iniciar
    startAutoSlide();
  }
});