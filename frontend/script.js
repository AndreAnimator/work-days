// URL da API PHP (ajuste a porta se necessário)
const API_URL = "http://localhost:8080/api/products";

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

// Monta o HTML de um card a partir de um produto
function createCard(product) {
  const name = escapeHtml(product.name);
  const description = escapeHtml(product.description);
  const image = escapeHtml(product.image);

  return `
    <article class="produto-card" data-id="${escapeHtml(product.id)}">
      <div class="produto-card__img">
        <img src="${image}" alt="${name}" loading="lazy">
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

// Pede os produtos ao backend (que lê do banco de dados)
async function loadProducts() {
  productsContainer.innerHTML = "<p>Carregando produtos...</p>";

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const products = await response.json();
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