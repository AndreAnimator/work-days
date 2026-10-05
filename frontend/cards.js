// URL dos produtos. A API de login roda na porta 8000, então os produtos
// provavelmente estão na mesma. Se não estiverem, ajuste aqui.
const PRODUCTS_URL = "http://localhost:8000/api/products";

const productsContainer = document.getElementById("produtos");
const cartCount = document.getElementById("cart-count");

let cartTotal = 0;

// Formata o preço em reais
function formatPrice(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Evita que texto vindo do banco seja interpretado como HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

// Aceita os nomes em português (nome, preco...) ou em inglês (name, price...)
function normalizeProduct(p) {
  return {
    id: p.id,
    name: p.nome ?? p.name ?? "",
    description: p.descricao ?? p.description ?? "",
    price: p.preco ?? p.price ?? 0,
    image: p.imagem ?? p.image ?? "",
  };
}

// Imagem de reserva quando o link está vazio ou quebrado
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#efe3c6"/><text x="50%" y="50%" fill="#7a655b" font-family="sans-serif" font-size="14" text-anchor="middle">Sem imagem</text></svg>'
  );

// Monta o HTML de um card
function createCard(rawProduct) {
  const product = normalizeProduct(rawProduct);
  const name = escapeHtml(product.name);
  const description = escapeHtml(product.description);
  const image = escapeHtml(product.image || PLACEHOLDER_IMG);

  return `
    <article class="produto-card" data-id="${escapeHtml(product.id)}">
      <div class="produto-card__img">
        <img src="${image}" alt="${name}" loading="lazy"
             onerror="this.onerror=null;this.src=PLACEHOLDER_IMG">
      </div>
      <h3 class="produto-card__nome">${name}</h3>
      <p class="produto-card__desc">${description}</p>
      <p class="produto-card__preco">${formatPrice(product.price)}</p>
      <button class="produto-card__btn" type="button">Adicionar ao carrinho</button>
    </article>
  `;
}

// Coloca todos os cards na página
function renderProducts(products) {
  if (!products.length) {
    productsContainer.innerHTML = "<p>Nenhum produto encontrado.</p>";
    return;
  }
  productsContainer.innerHTML = products.map(createCard).join("");
}

// Busca os produtos na API
async function loadProducts() {
  productsContainer.innerHTML = "<p>Carregando produtos...</p>";

  try {
    const response = await fetch(PRODUCTS_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    // Aceita [ ... ] ou { data: [ ... ] } ou { products: [ ... ] }
    const products = Array.isArray(data) ? data : data.data ?? data.products ?? [];
    renderProducts(products);
  } catch (error) {
    console.error("Failed to load products:", error);
    productsContainer.innerHTML =
      "<p>Não foi possível carregar os produtos. Tente novamente mais tarde.</p>";
  }
}

// Botão "Adicionar ao carrinho" (um único listener para todos os cards)
productsContainer.addEventListener("click", (event) => {
  if (event.target.classList.contains("produto-card__btn")) {
    cartTotal++;
    cartCount.textContent = cartTotal;
  }
});

loadProducts();