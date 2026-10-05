// URL base da API (mesmo valor usado no script.js)
const API_URL = "http://127.0.0.1:8000";

// Categorias do site.
// A chave é o "slug" usado na URL (categoria.html?c=tacos).
// `apiName` precisa ser IGUAL ao valor gravado na coluna products.category.
const CATEGORIES = {
  tacos: {
    apiName: "Tacos",
    title: "Tacos",
    blurb: "Tacos para todos os níveis, do recreativo ao profissional.",
  },
  mesas: {
    apiName: "Mesas",
    title: "Mesas",
    blurb: "Mesas de sinuca para montar o seu salão de jogos.",
  },
  bolas: {
    apiName: "Bolas",
    title: "Bolas",
    blurb: "Jogos de bolas para um rolamento preciso e duradouro.",
  },
  triangulos: {
    apiName: "Triângulos",
    title: "Triângulos",
    blurb: "Triângulos para organizar a abertura de cada partida.",
  },
  giz: {
    apiName: "Giz",
    title: "Giz",
    blurb: "Giz de qualidade para mais aderência em cada tacada.",
  },
  maletas: {
    apiName: "Maletas",
    title: "Maletas",
    blurb: "Maletas e estojos para transportar e proteger seus tacos.",
  },
  acessorios: {
    apiName: "Acessórios",
    title: "Acessórios",
    blurb: "Tudo o que complementa o seu jogo.",
  },
};

// Imagem de reserva quando o produto não tem foto ou o link está quebrado
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
      '<rect width="100%" height="100%" fill="#efe3c6"/>' +
      '<text x="50%" y="50%" fill="#7a655b" font-family="sans-serif" ' +
      'font-size="14" text-anchor="middle">Sem imagem</text></svg>',
  );

// Elementos da página
const productsGrid = document.getElementById("produtos");
const categoryTitle = document.getElementById("category-title");
const categoryBlurb = document.getElementById("category-blurb");
const breadcrumbCurrent = document.getElementById("breadcrumb-current");
const categoryTabs = document.getElementById("category-tabs");
const resultsTitle = document.getElementById("results-title");
const resultsCount = document.getElementById("results-count");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("busca");
const cartCount = document.getElementById("cart-count");
const toast = document.getElementById("toast");

// Estado da página
const params = new URLSearchParams(window.location.search);
const currentSlug = (params.get("c") || "").toLowerCase();
const currentCategory = CATEGORIES[currentSlug] || null;

let latestRequestId = 0; // evita que uma resposta antiga sobrescreva a nova
let toastTimer = null;

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
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function showToast(message, type = "success") {
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

function updateCartCount(count) {
  if (cartCount && Number.isFinite(Number(count))) {
    cartCount.textContent = String(count);
  }
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// ---------------------------------------------------------------
// Cabeçalho da página, menu e atalhos de categoria
// ---------------------------------------------------------------

function renderPageHeader() {
  if (currentCategory) {
    document.title = `${currentCategory.title} - Sinuca Pro`;
    categoryTitle.textContent = currentCategory.title;
    categoryBlurb.textContent = currentCategory.blurb;
    breadcrumbCurrent.textContent = currentCategory.title;
    resultsTitle.textContent = `${currentCategory.title} disponíveis`;
    searchInput.placeholder = `Buscar em ${currentCategory.title}...`;
  } else {
    document.title = "Categoria não encontrada - Sinuca Pro";
    categoryTitle.textContent = "Categoria não encontrada";
    categoryBlurb.textContent =
      "Escolha uma das categorias abaixo para ver os produtos.";
    breadcrumbCurrent.textContent = "Categoria não encontrada";
    resultsTitle.textContent = "Produtos";
  }
}

// Marca no menu principal o link da categoria atual
function highlightMainNav() {
  document.querySelectorAll("#main-nav a").forEach((link) => {
    const isCurrent =
      Boolean(currentCategory) &&
      link.getAttribute("href") === `categoria.html?c=${currentSlug}`;
    link.classList.toggle("active", isCurrent);
  });
}

function renderCategoryTabs() {
  categoryTabs.replaceChildren();

  Object.entries(CATEGORIES).forEach(([slug, category]) => {
    const link = createElement("a", "", category.title);
    link.href = `categoria.html?c=${slug}`;

    if (slug === currentSlug) {
      link.setAttribute("aria-current", "page");
    }

    categoryTabs.appendChild(link);
  });
}

// ---------------------------------------------------------------
// Lista de produtos
// ---------------------------------------------------------------

// Mostra uma mensagem no lugar da lista (carregando, vazio, erro)
function renderListState(title, message, withLink = false) {
  const box = createElement("div", "estado-lista");
  box.appendChild(createElement("strong", "", title));
  box.appendChild(createElement("span", "", message));

  if (withLink) {
    const link = createElement("a", "", "Ver todas as categorias");
    link.href = "index.html#categorias";
    box.appendChild(document.createElement("br"));
    box.appendChild(link);
  }

  productsGrid.replaceChildren(box);
}

function createProductCard(product) {
  const name = product.name ?? "";
  const stock = Number(product.stock ?? 0);

  const card = createElement("article", "produto-card");
  card.dataset.id = product.id;

  // Imagem
  const imageWrapper = createElement("div", "produto-card__img");
  const image = document.createElement("img");
  image.src = product.image || PLACEHOLDER_IMAGE;
  image.alt = name;
  image.loading = "lazy";
  image.addEventListener(
    "error",
    () => {
      image.src = PLACEHOLDER_IMAGE;
    },
    { once: true },
  );
  imageWrapper.appendChild(image);

  card.appendChild(imageWrapper);
  card.appendChild(createElement("h3", "produto-card__nome", name));
  card.appendChild(
    createElement("p", "produto-card__desc", product.description ?? ""),
  );
  card.appendChild(
    createElement("p", "produto-card__preco", formatPrice(product.price)),
  );

  if (stock <= 0) {
    card.appendChild(
      createElement("p", "produto-card__estoque", "Produto sem estoque"),
    );
  }

  // Botão de compra
  const button = createElement(
    "button",
    "produto-card__btn",
    stock > 0 ? "Adicionar ao carrinho" : "Indisponível",
  );
  button.type = "button";
  button.disabled = stock <= 0;
  button.dataset.productId = product.id;
  card.appendChild(button);

  return card;
}

function renderProducts(products, searchTerm) {
  if (products.length === 0) {
    resultsCount.textContent = "0 produtos";

    if (searchTerm) {
      renderListState(
        "Nada encontrado",
        `Nenhum produto em ${currentCategory.title} corresponde a "${searchTerm}".`,
      );
    } else {
      renderListState(
        "Ainda não temos produtos aqui",
        `Em breve teremos novidades em ${currentCategory.title}.`,
      );
    }
    return;
  }

  resultsCount.textContent =
    products.length === 1 ? "1 produto" : `${products.length} produtos`;
  productsGrid.replaceChildren(...products.map(createProductCard));
}

// Busca na API somente os produtos da categoria atual (e do termo digitado)
async function loadProducts(searchTerm = "") {
  if (!currentCategory) {
    resultsCount.textContent = "";
    renderListState(
      "Categoria não encontrada",
      "O endereço que você abriu não corresponde a nenhuma categoria.",
      true,
    );
    productsGrid.setAttribute("aria-busy", "false");
    return;
  }

  const requestId = ++latestRequestId;

  productsGrid.setAttribute("aria-busy", "true");
  resultsCount.textContent = "";
  renderListState("Carregando...", "Buscando os produtos.");

  const query = new URLSearchParams({ category: currentCategory.apiName });
  if (searchTerm) query.set("search", searchTerm);

  try {
    const response = await fetch(`${API_URL}/api/products?${query}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Ignora a resposta se o usuário já fez outra busca depois
    if (requestId !== latestRequestId) return;

    const products = Array.isArray(data)
      ? data
      : (data.products ?? data.data ?? []);
    renderProducts(products, searchTerm);
  } catch (error) {
    if (requestId !== latestRequestId) return;

    console.error("Falha ao carregar produtos:", error);
    resultsCount.textContent = "";
    renderListState(
      "Não foi possível carregar os produtos",
      "Verifique se a API está rodando e tente novamente.",
    );
  } finally {
    if (requestId === latestRequestId) {
      productsGrid.setAttribute("aria-busy", "false");
    }
  }
}

// ---------------------------------------------------------------
// Carrinho
// ---------------------------------------------------------------

async function addToCart(productId, button) {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast(
      "Faça login na sua conta para adicionar produtos ao carrinho.",
      "error",
    );
    return;
  }

  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Adicionando...";

  try {
    const response = await fetch(`${API_URL}/api/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: Number(productId), quantity: 1 }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      clearSession();
      updateCartCount(0);
      showToast("Sua sessão expirou. Entre na sua conta novamente.", "error");
      return;
    }

    if (!response.ok) {
      showToast(
        data.message || "Não foi possível adicionar ao carrinho.",
        "error",
      );
      return;
    }

    updateCartCount(data.items_count);
    showToast("Produto adicionado ao carrinho!", "success");
  } catch (error) {
    console.error("Falha ao adicionar ao carrinho:", error);
    showToast("Erro de conexão com o servidor.", "error");
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

// Mostra no ícone do carrinho a quantidade de itens de quem está logado
async function loadCartCount() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/cart`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      clearSession();
      return;
    }

    if (!response.ok) return;

    const data = await response.json();
    updateCartCount(data.items_count);
  } catch (error) {
    console.error("Falha ao carregar o carrinho:", error);
  }
}

// ---------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------

// Um único listener para todos os botões "Adicionar ao carrinho"
productsGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".produto-card__btn");
  if (!button || button.disabled) return;

  addToCart(button.dataset.productId, button);
});

// A busca do topo filtra dentro da categoria atual
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const term = searchInput.value.trim();

  // Guarda o termo na URL (sem recarregar a página)
  const url = new URL(window.location.href);
  if (term) {
    url.searchParams.set("q", term);
  } else {
    url.searchParams.delete("q");
  }
  history.replaceState(null, "", url);

  loadProducts(term);
});

// ---------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------

const initialSearch = (params.get("q") || "").trim();
searchInput.value = initialSearch;

renderPageHeader();
highlightMainNav();
renderCategoryTabs();
loadProducts(initialSearch);
loadCartCount();
