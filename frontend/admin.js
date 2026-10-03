'use strict';

/* ==========================================================================
   PAINEL ADMINISTRATIVO - CRUD de produtos

   Endpoints consumidos (todos exigem "Authorization: Bearer <token>"):

     GET    /api/admin/check            -> JÁ EXISTE no backend. Confirma o papel ADMIN no servidor.
     POST   /api/auth/logout            -> JÁ EXISTE no backend.

     GET    /api/admin/products         -> A CRIAR no backend. Lista TODOS os produtos (inclusive inativos).
     POST   /api/admin/products         -> A CRIAR no backend. Cria produto.
     PATCH  /api/admin/products/{id}    -> A CRIAR no backend. Atualiza produto.
     DELETE /api/admin/products/{id}    -> A CRIAR no backend. Exclui produto.

   Segurança: o que está no localStorage NÃO decide o acesso. O painel só é
   exibido depois que GET /api/admin/check responde 200 (cliente recebe 403,
   sem token/token inválido recebe 401). Toda rota admin deve ser protegida
   no backend com Authenticate::class . ':admin'.
   ========================================================================== */

const API_URL = 'http://127.0.0.1:8000';

const ENDPOINTS = {
  check: '/api/admin/check',
  logout: '/api/auth/logout',
  products: '/api/admin/products',
  product: (id) => `/api/admin/products/${encodeURIComponent(id)}`,
};

/* ---------- Estado ---------- */
let products = [];
let editingId = null;      // null = criando
let deletingProduct = null;

/* ---------- Elementos ---------- */
const $ = (id) => document.getElementById(id);

const views = {
  checking: $('adm-checking'),
  denied: $('adm-denied'),
  fatal: $('adm-fatal'),
  panel: $('adm-panel'),
};

const rowsEl = $('adm-rows');
const summaryEl = $('adm-summary');
const feedbackEl = $('adm-feedback');

const searchEl = $('adm-search');
const filterCategoryEl = $('adm-filter-category');
const filterStatusEl = $('adm-filter-status');

const formDialog = $('adm-form-dialog');
const form = $('adm-form');
const formTitle = $('adm-form-title');
const formError = $('adm-form-error');
const formSubmit = $('adm-form-submit');

const deleteDialog = $('adm-delete-dialog');
const deleteForm = $('adm-delete-form');
const deleteText = $('adm-delete-text');
const deleteError = $('adm-delete-error');
const deleteConfirm = $('adm-delete-confirm');

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/* ==========================================================================
   Sessão e API
   ========================================================================== */
const getToken = () => localStorage.getItem('token');

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('token_expires_at');
}

function redirectToLogin() {
  window.location.replace('index.html?login=1');
}

class ApiError extends Error {
  constructor(status, message, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

/** 401/403 já são tratados em api() (redirecionam / mostram "acesso negado"). */
const isHandledAuthError = (err) =>
  err instanceof ApiError && (err.status === 401 || err.status === 403);

async function api(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json', Authorization: `Bearer ${getToken()}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor.');
  }

  let data = null;
  try { data = await response.json(); } catch { /* resposta sem corpo (ex.: 204) */ }

  if (response.status === 401) {
    clearSession();
    redirectToLogin();
    throw new ApiError(401, data?.message || 'Sessão expirada.');
  }

  if (response.status === 403) {
    showView('denied');
    throw new ApiError(403, data?.message || 'Acesso negado.');
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

/* ==========================================================================
   Views
   ========================================================================== */
function showView(name) {
  for (const [key, node] of Object.entries(views)) {
    node.classList.toggle('hidden', key !== name);
  }
  // Fora do painel, nenhum diálogo pode ficar aberto.
  if (name !== 'panel') {
    if (formDialog.open) formDialog.close();
    if (deleteDialog.open) deleteDialog.close();
  }
}

function setFeedback(message, type = 'success') {
  if (!message) {
    feedbackEl.classList.add('hidden');
    feedbackEl.textContent = '';
    return;
  }
  feedbackEl.textContent = message;
  feedbackEl.className = `adm-feedback adm-feedback--${type}`;
}

/* ==========================================================================
   Inicialização: autoriza no servidor ANTES de exibir qualquer coisa
   ========================================================================== */
async function init() {
  if (!getToken()) {
    redirectToLogin();
    return;
  }

  showView('checking');

  try {
    const data = await api(ENDPOINTS.check);
    renderUser(data?.user);
  } catch (err) {
    if (isHandledAuthError(err)) return;
    $('adm-fatal-message').textContent = err.message;
    showView('fatal');
    return;
  }

  showView('panel');
  await loadProducts();
}

function renderUser(user) {
  if (!user) return;
  $('adm-user-name').textContent = user.name || user.email || 'Administrador';
  $('adm-user').classList.remove('hidden');
}

/* ==========================================================================
   Listagem
   ========================================================================== */
function normalizeProduct(p) {
  return {
    id: Number(p.id),
    name: String(p.name ?? ''),
    description: String(p.description ?? ''),
    category: String(p.category ?? ''),
    price: Number(p.price ?? 0),
    image: String(p.image ?? ''),
    stock: Number(p.stock ?? 0),
    // A listagem pública não traz "active"; a do admin deve trazer. Sem o campo, assume ativo.
    active: p.active === undefined ? true : p.active === true || p.active === 1 || p.active === '1',
  };
}

async function loadProducts() {
  rowsEl.replaceChildren(messageRow('Carregando produtos…'));

  try {
    const data = await api(ENDPOINTS.products);
    const list = Array.isArray(data) ? data : (data?.products ?? data?.data ?? []);
    products = list.map(normalizeProduct);
    refreshCategories();
    render();
  } catch (err) {
    if (isHandledAuthError(err)) return;
    products = [];
    summaryEl.textContent = ' ';
    rowsEl.replaceChildren(errorRow(
      err.status === 404
        ? `O endpoint GET ${ENDPOINTS.products} ainda não está disponível no backend.`
        : err.message,
    ));
  }
}

function el(tag, { className, text, attrs } = {}, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

function messageRow(text) {
  const td = el('td', { className: 'adm-empty', text, attrs: { colspan: '6' } });
  return el('tr', {}, td);
}

function errorRow(text) {
  const retry = el('button', { className: 'adm-btn adm-btn--ghost', text: 'Tentar novamente', attrs: { type: 'button' } });
  retry.addEventListener('click', loadProducts);
  const td = el('td', { className: 'adm-empty', attrs: { colspan: '6' } },
    el('p', { text }), el('p', {}, retry));
  return el('tr', {}, td);
}

function safeImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function thumb(product) {
  const placeholder = () => el('div', { className: 'adm-thumb adm-thumb--empty', text: 'sem foto' });
  const src = product.image ? safeImageUrl(product.image) : null;
  if (!src) return placeholder();

  const img = el('img', { className: 'adm-thumb', attrs: { src, alt: '', loading: 'lazy' } });
  img.addEventListener('error', () => img.replaceWith(placeholder()), { once: true });
  return img;
}

function statusBadge(product) {
  if (!product.active) return el('span', { className: 'adm-badge adm-badge--off', text: 'Inativo' });
  if (product.stock === 0) return el('span', { className: 'adm-badge adm-badge--warn', text: 'Sem estoque' });
  return el('span', { className: 'adm-badge adm-badge--ok', text: 'Ativo' });
}

function filteredProducts() {
  const term = searchEl.value.trim().toLowerCase();
  const category = filterCategoryEl.value;
  const status = filterStatusEl.value;

  return products.filter((p) => {
    if (term && !`${p.name} ${p.description}`.toLowerCase().includes(term)) return false;
    if (category && p.category !== category) return false;
    if (status === 'active' && !p.active) return false;
    if (status === 'inactive' && p.active) return false;
    if (status === 'out' && p.stock !== 0) return false;
    return true;
  });
}

function render() {
  const list = filteredProducts();

  summaryEl.textContent = list.length === products.length
    ? `${products.length} ${products.length === 1 ? 'produto' : 'produtos'}`
    : `${list.length} de ${products.length} produtos`;

  if (list.length === 0) {
    rowsEl.replaceChildren(messageRow(
      products.length === 0
        ? 'Nenhum produto cadastrado ainda. Clique em "Novo produto" para começar.'
        : 'Nenhum produto corresponde aos filtros aplicados.',
    ));
    return;
  }

  rowsEl.replaceChildren(...list.map(productRow));
}

function productRow(product) {
  const edit = el('button', { className: 'adm-btn adm-btn--ghost', text: 'Editar', attrs: { type: 'button', 'aria-label': `Editar ${product.name}` } });
  edit.addEventListener('click', () => openForm(product));

  const remove = el('button', { className: 'adm-btn adm-btn--danger', text: 'Excluir', attrs: { type: 'button', 'aria-label': `Excluir ${product.name}` } });
  remove.addEventListener('click', () => openDelete(product));

  return el('tr', {},
    el('td', {}, el('div', { className: 'adm-product' },
      thumb(product),
      el('div', {},
        el('div', { className: 'adm-product__name', text: product.name }),
        el('div', { className: 'adm-product__id', text: `#${product.id}` }),
      ),
    )),
    el('td', { text: product.category }),
    el('td', { className: 'adm-num', text: brl.format(product.price) }),
    el('td', { className: 'adm-num', text: String(product.stock) }),
    el('td', {}, statusBadge(product)),
    el('td', { className: 'adm-actions-col' }, el('div', { className: 'adm-row-actions' }, edit, remove)),
  );
}

function refreshCategories() {
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const selected = filterCategoryEl.value;
  filterCategoryEl.replaceChildren(
    el('option', { text: 'Todas', attrs: { value: '' } }),
    ...categories.map((c) => el('option', { text: c, attrs: { value: c } })),
  );
  filterCategoryEl.value = categories.includes(selected) ? selected : '';

  $('adm-categories').replaceChildren(...categories.map((c) => el('option', { attrs: { value: c } })));
}

[searchEl, filterCategoryEl, filterStatusEl].forEach((node) =>
  node.addEventListener('input', render));

/* ==========================================================================
   Criar / editar
   ========================================================================== */
function clearFieldErrors() {
  formError.classList.add('hidden');
  formError.textContent = '';
  form.querySelectorAll('[data-error-for]').forEach((node) => {
    node.textContent = '';
    node.closest('.adm-field')?.classList.remove('has-error');
  });
}

function showFieldErrors(errors) {
  const unmatched = [];

  for (const [field, messages] of Object.entries(errors)) {
    const node = form.querySelector(`[data-error-for="${CSS.escape(field)}"]`);
    const text = Array.isArray(messages) ? messages.join(' ') : String(messages);
    if (node) {
      node.textContent = text;
      node.closest('.adm-field')?.classList.add('has-error');
    } else {
      unmatched.push(text);
    }
  }

  return unmatched;
}

function showFormError(message) {
  formError.textContent = message;
  formError.classList.remove('hidden');
}

function openForm(product = null) {
  editingId = product ? product.id : null;
  setFeedback(null);
  clearFieldErrors();

  formTitle.textContent = product ? `Editar produto #${product.id}` : 'Novo produto';
  formSubmit.textContent = product ? 'Salvar alterações' : 'Criar produto';

  $('f-name').value = product?.name ?? '';
  $('f-description').value = product?.description ?? '';
  $('f-category').value = product?.category ?? '';
  $('f-price').value = product ? product.price.toFixed(2) : '';
  $('f-stock').value = product ? String(product.stock) : '0';
  $('f-image').value = product?.image ?? '';
  $('f-active').checked = product ? product.active : true;

  formDialog.showModal();
  $('f-name').focus();
}

/** Validação básica no cliente; a validação que vale é a do servidor. */
function validateForm(values) {
  const errors = {};

  if (!values.name) errors.name = ['Informe o nome do produto.'];
  if (!values.category) errors.category = ['Informe a categoria.'];

  if (values.priceRaw === '' || !Number.isFinite(Number(values.priceRaw)) || Number(values.priceRaw) < 0) {
    errors.price = ['Informe um preço válido (0 ou maior).'];
  }

  if (values.stockRaw === '' || !Number.isInteger(Number(values.stockRaw)) || Number(values.stockRaw) < 0) {
    errors.stock = ['Informe um estoque inteiro (0 ou maior).'];
  }

  if (values.image && !safeImageUrl(values.image)) {
    errors.image = ['Informe uma URL http(s) válida.'];
  }

  return errors;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFieldErrors();

  const values = {
    name: $('f-name').value.trim(),
    description: $('f-description').value.trim(),
    category: $('f-category').value.trim(),
    priceRaw: $('f-price').value.trim(),
    stockRaw: $('f-stock').value.trim(),
    image: $('f-image').value.trim(),
    active: $('f-active').checked,
  };

  const clientErrors = validateForm(values);
  if (Object.keys(clientErrors).length > 0) {
    showFieldErrors(clientErrors);
    form.querySelector('.has-error input, .has-error textarea')?.focus();
    return;
  }

  const payload = {
    name: values.name,
    description: values.description || null,
    category: values.category,
    price: Number(Number(values.priceRaw).toFixed(2)),
    stock: Number(values.stockRaw),
    image: values.image || null,
    active: values.active,
  };

  const wasEditing = editingId !== null;
  formSubmit.disabled = true;
  const originalLabel = formSubmit.textContent;
  formSubmit.textContent = 'Salvando…';

  try {
    if (wasEditing) {
      await api(ENDPOINTS.product(editingId), { method: 'PATCH', body: payload });
    } else {
      await api(ENDPOINTS.products, { method: 'POST', body: payload });
    }

    formDialog.close();
    await loadProducts();
    setFeedback(wasEditing ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.');
  } catch (err) {
    if (isHandledAuthError(err)) return;

    const fieldErrors = err.errors || {};
    const unmatched = showFieldErrors(fieldErrors);

    if (Object.keys(fieldErrors).length === 0) {
      // Erro sem detalhe por campo (rede, 404, 409, 500...)
      const route = wasEditing ? `PATCH ${ENDPOINTS.product(editingId)}` : `POST ${ENDPOINTS.products}`;
      showFormError(
        err.status === 404
          ? `O endpoint ${route} não foi encontrado no backend.`
          : err.message,
      );
    } else if (unmatched.length > 0) {
      // Erros de campos que o formulário não exibe
      showFormError(unmatched.join(' '));
    }
  } finally {
    formSubmit.disabled = false;
    formSubmit.textContent = originalLabel;
  }
});

$('adm-new').addEventListener('click', () => openForm());
$('adm-form-cancel').addEventListener('click', () => formDialog.close());

/* ==========================================================================
   Excluir
   ========================================================================== */
function openDelete(product) {
  deletingProduct = product;
  setFeedback(null);
  deleteError.classList.add('hidden');
  deleteError.textContent = '';
  deleteText.textContent =
    `Tem certeza que deseja excluir "${product.name}"? ` +
    'Para apenas tirá-lo do catálogo, desative o produto em vez de excluir.';
  deleteDialog.showModal();
}

deleteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!deletingProduct) return;

  deleteConfirm.disabled = true;
  deleteConfirm.textContent = 'Excluindo…';

  try {
    await api(ENDPOINTS.product(deletingProduct.id), { method: 'DELETE' });
    const name = deletingProduct.name;
    deleteDialog.close();
    deletingProduct = null;
    await loadProducts();
    setFeedback(`Produto "${name}" excluído.`);
  } catch (err) {
    if (isHandledAuthError(err)) return;
    deleteError.textContent = err.message;
    deleteError.classList.remove('hidden');
  } finally {
    deleteConfirm.disabled = false;
    deleteConfirm.textContent = 'Excluir';
  }
});

$('adm-delete-cancel').addEventListener('click', () => deleteDialog.close());

/* Clique no fundo escuro (backdrop) fecha o diálogo. */
[formDialog, deleteDialog].forEach((dialog) =>
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  }));

/* ==========================================================================
   Logout e retry
   ========================================================================== */
$('adm-logout').addEventListener('click', async () => {
  const token = getToken();

  if (token) {
    try {
      await fetch(`${API_URL}${ENDPOINTS.logout}`, {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
    } catch {
      /* mesmo sem resposta do servidor, a sessão local é encerrada */
    }
  }

  clearSession();
  window.location.replace('index.html');
});

$('adm-retry').addEventListener('click', init);

init();
