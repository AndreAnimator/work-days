const API_URL = 'http://127.0.0.1:8000';
const $ = (id) => document.getElementById(id);
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="#efe3c6"/><text x="50%" y="50%" fill="#7a655b" font-family="sans-serif" font-size="13" text-anchor="middle">Sem imagem</text></svg>');

const content = document.querySelector('.cart-content');
const loginState = $('cart-login');
const loadingState = $('cart-loading');
const emptyState = $('cart-empty');
const errorState = $('cart-error');
const errorMessage = $('cart-error-message');
const layout = $('cart-layout');
const itemsEl = $('cart-items');
const subtotalEl = $('cart-subtotal');
const totalEl = $('cart-total');
const countEl = $('cart-count');
const toast = $('toast');
let toastTimer;

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function setState(name) {
  [loginState, loadingState, emptyState, errorState, layout].forEach(el => el.hidden = true);
  if (name === 'login') loginState.hidden = false;
  if (name === 'loading') loadingState.hidden = false;
  if (name === 'empty') emptyState.hidden = false;
  if (name === 'error') errorState.hidden = false;
  if (name === 'cart') layout.hidden = false;
  content.setAttribute('aria-busy', name === 'loading' ? 'true' : 'false');
}

function updateCount(value) {
  const count = Number(value || 0);
  countEl.textContent = String(Number.isFinite(count) ? count : 0);
}

function imageFor(item) {
  return item.image || PLACEHOLDER;
}

function renderCart(cart) {
  updateCount(cart.items_count);
  subtotalEl.textContent = brl.format(Number(cart.subtotal || 0));
  totalEl.textContent = brl.format(Number(cart.total || 0));
  itemsEl.replaceChildren();

  if (!Array.isArray(cart.items) || cart.items.length === 0) {
    setState('empty');
    return;
  }

  const hasUnavailableItems = cart.items.some(item => item.available !== true);
  const checkoutButton = document.querySelector('.cart-checkout');
  if (checkoutButton) {
    checkoutButton.disabled = hasUnavailableItems;
    checkoutButton.title = hasUnavailableItems
      ? 'Remova ou ajuste os itens indisponíveis antes de finalizar.'
      : '';
  }

  cart.items.forEach(item => {
    const row = document.createElement('article');
    const unavailable = item.available !== true;
    row.className = unavailable ? 'cart-item cart-item--unavailable' : 'cart-item';
    row.dataset.productId = item.product_id;

    const img = document.createElement('img');
    img.className = 'cart-item__image';
    img.src = imageFor(item);
    img.alt = item.name;
    img.addEventListener('error', () => { img.src = PLACEHOLDER; }, { once: true });

    const info = document.createElement('div');
    const name = document.createElement('h3');
    name.className = 'cart-item__name';
    name.textContent = item.name;
    const price = document.createElement('p');
    price.className = 'cart-item__price';
    price.textContent = brl.format(Number(item.price));
    const stock = document.createElement('p');
    stock.className = 'cart-item__stock';
    const availability = item.availability || (item.available ? 'available' : 'out_of_stock');
    const availabilityMessages = {
      inactive: 'Produto indisponível (desativado)',
      out_of_stock: 'Produto indisponível (sem estoque)',
      quantity_exceeds_stock: `Quantidade acima do estoque disponível (${item.stock})`,
      available: `Em estoque: ${item.stock}`,
    };
    stock.textContent = availabilityMessages[availability] || 'Produto indisponível';
    info.append(name, price, stock);

    const actions = document.createElement('div');
    actions.className = 'cart-item__actions';
    const qty = document.createElement('div');
    qty.className = 'qty-control';
    const minus = document.createElement('button');
    minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Diminuir quantidade de ${item.name}`);
    minus.disabled = Number(item.quantity) <= 1;
    minus.addEventListener('click', () => updateQuantity(item.product_id, Number(item.quantity) - 1));
    const qtyValue = document.createElement('span'); qtyValue.textContent = item.quantity;
    const plus = document.createElement('button');
    plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Aumentar quantidade de ${item.name}`);
    plus.disabled = Number(item.quantity) >= Number(item.stock) || !item.available;
    plus.addEventListener('click', () => updateQuantity(item.product_id, Number(item.quantity) + 1));
    qty.append(minus, qtyValue, plus);

    const right = document.createElement('div');
    right.className = 'cart-item__subtotal';
    right.textContent = brl.format(Number(item.subtotal));
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'cart-remove'; remove.textContent = 'Remover';
    remove.addEventListener('click', () => removeItem(item.product_id));
    right.append(remove);

    actions.append(qty, right);
    row.append(img, info, actions);
    itemsEl.append(row);
  });
  setState('cart');
}

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  if (!token) { const e = new Error('LOGIN_REQUIRED'); e.status = 401; throw e; }
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...(options.body ? {'Content-Type':'application/json'} : {}), Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const e = new Error(data.message || `Erro HTTP ${response.status}`); e.status = response.status; throw e; }
  return data;
}

async function loadCart() {
  if (!localStorage.getItem('token')) { updateCount(0); setState('login'); return; }
  setState('loading');
  try {
    const cart = await request('/api/cart');
    renderCart(cart);
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('token_expires_at');
      updateCount(0); setState('login'); return;
    }
    errorMessage.textContent = error.message || 'Tente novamente em instantes.';
    setState('error');
  }
}

async function updateQuantity(productId, quantity) {
  try {
    const cart = await request(`/api/cart/items/${encodeURIComponent(productId)}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
    renderCart(cart);
  } catch (error) {
    showToast(error.message || 'Não foi possível atualizar a quantidade.', 'error');
    loadCart();
  }
}

async function removeItem(productId) {
  try {
    const cart = await request(`/api/cart/items/${encodeURIComponent(productId)}`, { method: 'DELETE' });
    renderCart(cart);
    showToast('Produto removido do carrinho.');
  } catch (error) {
    showToast(error.message || 'Não foi possível remover o produto.', 'error');
  }
}

$('retry-cart').addEventListener('click', loadCart);
$('search-form').addEventListener('submit', event => {
  event.preventDefault();
  const term = $('busca').value.trim();
  window.location.href = term ? `produtos.html?q=${encodeURIComponent(term)}` : 'produtos.html';
});

document.addEventListener('DOMContentLoaded', loadCart);
