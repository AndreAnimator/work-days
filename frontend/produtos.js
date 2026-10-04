// URL base da API (mesmo valor usado no script.js)
const API_URL = 'http://127.0.0.1:8000';

// Categorias do site.
// A chave é o "slug" usado na URL (produtos.html?c=tacos).
// `apiName` precisa ser IGUAL ao valor gravado na coluna products.category.
const CATEGORIES = {
  tacos: {
    apiName: 'Tacos',
    title: 'Tacos',
    blurb: 'Tacos para todos os níveis, do recreativo ao profissional.'
  },
  mesas: {
    apiName: 'Mesas',
    title: 'Mesas',
    blurb: 'Mesas de sinuca para montar o seu salão de jogos.'
  },
  bolas: {
    apiName: 'Bolas',
    title: 'Bolas',
    blurb: 'Jogos de bolas para um rolamento preciso e duradouro.'
  },
  triangulos: {
    apiName: 'Triângulos',
    title: 'Triângulos',
    blurb: 'Triângulos para organizar a abertura de cada partida.'
  },
  giz: {
    apiName: 'Giz',
    title: 'Giz',
    blurb: 'Giz de qualidade para mais aderência em cada tacada.'
  },
  maletas: {
    apiName: 'Maletas',
    title: 'Maletas',
    blurb: 'Maletas e estojos para transportar e proteger seus tacos.'
  },
  acessorios: {
    apiName: 'Acessórios',
    title: 'Acessórios',
    blurb: 'Tudo o que complementa o seu jogo.'
  }
};

// Ordenações aceitas pela API (?sort=)
const DEFAULT_SORT = 'newest';
const VALID_SORTS = ['newest', 'price_asc', 'price_desc'];

const DEFAULT_PLACEHOLDER = 'Buscar produtos pelo nome...';

// Imagem de reserva quando o produto não tem foto ou o link está quebrado
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
    '<rect width="100%" height="100%" fill="#efe3c6"/>' +
    '<text x="50%" y="50%" fill="#7a655b" font-family="sans-serif" ' +
    'font-size="14" text-anchor="middle">Sem imagem</text></svg>'
  );

// Elementos da página
const productsGrid = document.getElementById('produtos');
const pageTitle = document.getElementById('page-title');
const pageBlurb = document.getElementById('page-blurb');
const breadcrumbSeparator = document.getElementById('breadcrumb-sep');
const breadcrumbCurrent = document.getElementById('breadcrumb-current');
const categoryTabs = document.getElementById('category-tabs');
const sortSelect = document.getElementById('sort-select');
const resultsTitle = document.getElementById('results-title');
const resultsCount = document.getElementById('results-count');
const activeSearch = document.getElementById('active-search');
const activeSearchTerm = document.getElementById('active-search-term');
const clearSearchButton = document.getElementById('clear-search');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('busca');
const cartCount = document.getElementById('cart-count');
const toast = document.getElementById('toast');

// Estado da página (fica espelhado na URL: ?c=tacos&q=taco&sort=price_asc)
let state = readStateFromUrl();

let latestRequestId = 0; // evita que uma resposta antiga sobrescreva a nova
let toastTimer = null;

// ---------------------------------------------------------------
// Estado <-> URL
// ---------------------------------------------------------------

function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const sort = params.get('sort');

  return {
    slug: (params.get('c') || '').toLowerCase(),
    search: (params.get('q') || '').trim(),
    sort: VALID_SORTS.includes(sort) ? sort : DEFAULT_SORT
  };
}

function buildUrl(targetState) {
  const params = new URLSearchParams();

  if (targetState.slug) params.set('c', targetState.slug);
  if (targetState.search) params.set('q', targetState.search);
  if (targetState.sort !== DEFAULT_SORT) params.set('sort', targetState.sort);

  const queryString = params.toString();
  return queryString ? `produtos.html?${queryString}` : 'produtos.html';
}

// Aplica um novo estado: atualiza a URL (sem recarregar) e redesenha a página
function applyState(changes) {
  state = { ...state, ...changes };

  try {
    history.pushState(null, '', buildUrl(state));
  } catch (error) {
    // Alguns navegadores bloqueiam pushState em file:// — nesse caso recarrega
    window.location.href = buildUrl(state);
    return;
  }

  refresh();
}

// ---------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------

// Cria um elemento já com classe e texto (textContent evita injeção de HTML)
function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatPrice(value) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function showToast(message, type = 'success') {
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function updateCartCount(count) {
  if (cartCount && Number.isFinite(Number(count))) {
    cartCount.textContent = String(count);
  }
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function getCurrentCategory() {
  return CATEGORIES[state.slug] || null;
}

// Existe ?c= na URL, mas não é uma categoria conhecida
function hasInvalidCategory() {
  return state.slug !== '' && getCurrentCategory() === null;
}

// ---------------------------------------------------------------
// Cabeçalho da página, menu, filtros
// ---------------------------------------------------------------

function renderPageHeader() {
  const category = getCurrentCategory();

  if (category) {
    document.title = `${category.title} - Sinuca Pro`;
    pageTitle.textContent = category.title;
    pageBlurb.textContent = category.blurb;
    resultsTitle.textContent = `${category.title} disponíveis`;
    searchInput.placeholder = `Buscar em ${category.title}...`;

    breadcrumbCurrent.textContent = category.title;
    breadcrumbCurrent.hidden = false;
    breadcrumbSeparator.hidden = false;
  } else if (hasInvalidCategory()) {
    document.title = 'Categoria não encontrada - Sinuca Pro';
    pageTitle.textContent = 'Categoria não encontrada';
    pageBlurb.textContent = 'Escolha uma das categorias abaixo ou veja todos os produtos.';
    resultsTitle.textContent = 'Produtos';
    searchInput.placeholder = DEFAULT_PLACEHOLDER;

    breadcrumbCurrent.hidden = true;
    breadcrumbSeparator.hidden = true;
  } else {
    document.title = 'Produtos - Sinuca Pro';
    pageTitle.textContent = 'Todos os produtos';
    pageBlurb.textContent = 'Pesquise pelo nome, filtre por categoria e ordene pelo preço.';
    resultsTitle.textContent = 'Todos os produtos';
    searchInput.placeholder = DEFAULT_PLACEHOLDER;

    breadcrumbCurrent.hidden = true;
    breadcrumbSeparator.hidden = true;
  }
}

// Marca no menu principal o item correspondente à página atual
function highlightMainNav() {
  const activeHref = hasInvalidCategory()
    ? null
    : (state.slug ? `produtos.html?c=${state.slug}` : 'produtos.html');

  document.querySelectorAll('#main-nav a').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === activeHref);
  });
}

function renderCategoryTabs() {
  categoryTabs.replaceChildren();

  const items = [
    { slug: '', title: 'Todos' },
    ...Object.entries(CATEGORIES).map(([slug, category]) => ({ slug, title: category.title }))
  ];

  items.forEach((item) => {
    const link = createElement('a', '', item.title);
    link.href = buildUrl({ ...state, slug: item.slug });
    link.dataset.slug = item.slug;

    if (item.slug === state.slug && !hasInvalidCategory()) {
      link.setAttribute('aria-current', 'page');
    }

    categoryTabs.appendChild(link);
  });
}

// Mantém os campos (busca, ordenação, termo ativo) iguais ao estado
function syncControls() {
  sortSelect.value = state.sort;
  searchInput.value = state.search;

  activeSearch.hidden = state.search === '';
  activeSearchTerm.textContent = `"${state.search}"`;
}

// ---------------------------------------------------------------
// Lista de produtos
// ---------------------------------------------------------------

// Mostra uma mensagem no lugar da lista (carregando, vazio, erro)
function renderListState(title, message, actionLabel = '', onAction = null) {
  const box = createElement('div', 'estado-lista');
  box.appendChild(createElement('strong', '', title));
  box.appendChild(createElement('span', '', message));

  if (actionLabel && onAction) {
    box.appendChild(document.createElement('br'));

    const button = createElement('button', 'estado-lista__acao', actionLabel);
    button.type = 'button';
    button.addEventListener('click', onAction);
    box.appendChild(button);
  }

  productsGrid.replaceChildren(box);
}

function clearAllFilters() {
  applyState({ slug: '', search: '' });
}

// Mensagem exibida quando a consulta não devolve nenhum produto
function renderEmptyResult() {
  const category = getCurrentCategory();

  if (state.search && category) {
    renderListState(
      'Nenhum produto encontrado',
      `Nada em ${category.title} corresponde a "${state.search}". Confira a digitação ou tente outro nome.`,
      'Limpar filtros',
      clearAllFilters
    );
  } else if (state.search) {
    renderListState(
      'Nenhum produto encontrado',
      `Nenhum produto corresponde a "${state.search}". Confira a digitação ou tente outro nome.`,
      'Limpar busca',
      () => applyState({ search: '' })
    );
  } else if (category) {
    renderListState(
      'Ainda não temos produtos aqui',
      `Em breve teremos novidades em ${category.title}.`,
      'Ver todos os produtos',
      clearAllFilters
    );
  } else {
    renderListState(
      'Nenhum produto disponível',
      'O catálogo ainda não tem produtos cadastrados.'
    );
  }
}

function createProductCard(product) {
  const name = product.name ?? '';
  const isUnavailable = Number(product.stock ?? 0) <= 0;

  const card = createElement(
    'article',
    isUnavailable ? 'produto-card produto-card--indisponivel' : 'produto-card'
  );
  card.dataset.id = product.id;

  // Imagem (com selo quando não há estoque)
  const imageWrapper = createElement('div', 'produto-card__img');
  const image = document.createElement('img');
  image.src = product.image || PLACEHOLDER_IMAGE;
  image.alt = name;
  image.loading = 'lazy';
  image.addEventListener('error', () => {
    image.src = PLACEHOLDER_IMAGE;
  }, { once: true });
  imageWrapper.appendChild(image);

  if (isUnavailable) {
    imageWrapper.appendChild(createElement('span', 'produto-card__selo', 'Indisponível'));
  }

  card.appendChild(imageWrapper);
  card.appendChild(createElement('h3', 'produto-card__nome', name));
  card.appendChild(createElement('p', 'produto-card__desc', product.description ?? ''));
  card.appendChild(createElement('p', 'produto-card__preco', formatPrice(product.price)));

  // Botão de compra
  const button = createElement(
    'button',
    'produto-card__btn',
    isUnavailable ? 'Indisponível' : 'Adicionar ao carrinho'
  );
  button.type = 'button';
  button.disabled = isUnavailable;
  button.dataset.productId = product.id;
  card.appendChild(button);

  return card;
}

function renderProducts(products) {
  if (products.length === 0) {
    resultsCount.textContent = '0 produtos';
    renderEmptyResult();
    return;
  }

  resultsCount.textContent = products.length === 1 ? '1 produto' : `${products.length} produtos`;
  productsGrid.replaceChildren(...products.map(createProductCard));
}

// Busca na API os produtos conforme a categoria, o termo e a ordenação atuais
async function loadProducts() {
  if (hasInvalidCategory()) {
    resultsCount.textContent = '';
    renderListState(
      'Categoria não encontrada',
      'O endereço que você abriu não corresponde a nenhuma categoria.',
      'Ver todos os produtos',
      clearAllFilters
    );
    productsGrid.setAttribute('aria-busy', 'false');
    return;
  }

  const requestId = ++latestRequestId;

  productsGrid.setAttribute('aria-busy', 'true');
  resultsCount.textContent = '';
  renderListState('Carregando...', 'Buscando os produtos.');

  const query = new URLSearchParams({ sort: state.sort });
  const category = getCurrentCategory();
  if (category) query.set('category', category.apiName);
  if (state.search) query.set('search', state.search);

  try {
    const response = await fetch(`${API_URL}/api/products?${query}`, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Ignora a resposta se o usuário já mudou os filtros depois
    if (requestId !== latestRequestId) return;

    const products = Array.isArray(data) ? data : (data.products ?? data.data ?? []);
    renderProducts(products);
  } catch (error) {
    if (requestId !== latestRequestId) return;

    console.error('Falha ao carregar produtos:', error);
    resultsCount.textContent = '';
    renderListState(
      'Não foi possível carregar os produtos',
      'Verifique se a API está rodando e tente novamente.',
      'Tentar novamente',
      loadProducts
    );
  } finally {
    if (requestId === latestRequestId) {
      productsGrid.setAttribute('aria-busy', 'false');
    }
  }
}

// ---------------------------------------------------------------
// Carrinho
// ---------------------------------------------------------------

async function addToCart(productId, button) {
  const token = localStorage.getItem('token');

  if (!token) {
    showToast('Faça login na sua conta para adicionar produtos ao carrinho.', 'error');
    return;
  }

  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Adicionando...';

  try {
    const response = await fetch(`${API_URL}/api/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ product_id: Number(productId), quantity: 1 })
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      clearSession();
      updateCartCount(0);
      showToast('Sua sessão expirou. Entre na sua conta novamente.', 'error');
      return;
    }

    if (!response.ok) {
      showToast(data.message || 'Não foi possível adicionar ao carrinho.', 'error');
      return;
    }

    updateCartCount(data.items_count);
    showToast('Produto adicionado ao carrinho!', 'success');
  } catch (error) {
    console.error('Falha ao adicionar ao carrinho:', error);
    showToast('Erro de conexão com o servidor.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

// Mostra no ícone do carrinho a quantidade de itens de quem está logado
async function loadCartCount() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/cart`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      clearSession();
      return;
    }

    if (!response.ok) return;

    const data = await response.json();
    updateCartCount(data.items_count);
  } catch (error) {
    console.error('Falha ao carregar o carrinho:', error);
  }
}

// ---------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------

// Um único listener para todos os botões "Adicionar ao carrinho"
productsGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.produto-card__btn');
  if (!button || button.disabled) return;

  addToCart(button.dataset.productId, button);
});

// Filtro por categoria (mantém busca e ordenação)
categoryTabs.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) return;

  // Deixa o navegador agir normalmente em Ctrl/Cmd+clique (abrir em nova aba)
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;

  event.preventDefault();
  applyState({ slug: link.dataset.slug });
});

// Pesquisa por nome (mantém categoria e ordenação)
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  applyState({ search: searchInput.value.trim() });
});

clearSearchButton.addEventListener('click', () => {
  applyState({ search: '' });
});

// Ordenação
sortSelect.addEventListener('change', () => {
  applyState({ sort: VALID_SORTS.includes(sortSelect.value) ? sortSelect.value : DEFAULT_SORT });
});

// Botão "voltar/avançar" do navegador
window.addEventListener('popstate', () => {
  state = readStateFromUrl();
  refresh();
});

// ---------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------

function refresh() {
  renderPageHeader();
  highlightMainNav();
  renderCategoryTabs();
  syncControls();
  loadProducts();
}

refresh();
loadCartCount();
