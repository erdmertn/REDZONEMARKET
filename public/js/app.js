// GameKey TR - Storefront Logic
let allProducts = [];
let filteredProducts = [];
let activeCategory = 'all';
let currentSearch = '';
let cart = JSON.parse(localStorage.getItem('gamekey_cart') || '[]');

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupEventListeners();
  updateCartBadge();
  await loadProducts();
  await loadSettings();
}

function setupEventListeners() {
  // Desktop & Mobile Search
  const searchInput = document.getElementById('searchInput');
  const mobileSearchInput = document.getElementById('mobileSearchInput');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      applyFilters();
    });
  }

  // Category Buttons
  const categoryBtns = document.querySelectorAll('.category-btn');
  categoryBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach((b) => {
        b.classList.remove('active', 'bg-cyan-500', 'text-white', 'shadow-md', 'shadow-cyan-500/20');
        b.classList.add('bg-slate-800/80', 'text-gray-300');
      });
      btn.classList.add('active', 'bg-cyan-500', 'text-white', 'shadow-md', 'shadow-cyan-500/20');
      btn.classList.remove('bg-slate-800/80', 'text-gray-300');

      activeCategory = btn.getAttribute('data-category');
      applyFilters();
    });
  });

  // Sorting
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      applyFilters();
    });
  }

  // Cart Drawer
  const cartBtn = document.getElementById('cartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartBackdrop = document.getElementById('cartDrawerBackdrop');

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartBackdrop) {
    cartBackdrop.addEventListener('click', (e) => {
      if (e.target === cartBackdrop) closeCart();
    });
  }
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const settings = await res.json();
    if (settings.announcement) {
      const el = document.getElementById('announcementText');
      if (el) el.textContent = settings.announcement;
    }
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    allProducts = await res.json();
    applyFilters();
  } catch (err) {
    console.error('Products load error:', err);
    showToast('Ürünler yüklenirken bir hata oluştu.', 'error');
  }
}

function applyFilters() {
  filteredProducts = allProducts.filter((product) => {
    const matchCategory =
      activeCategory === 'all' || product.category === activeCategory;
    const matchSearch =
      !currentSearch ||
      product.name.toLowerCase().includes(currentSearch) ||
      product.platform.toLowerCase().includes(currentSearch) ||
      (product.description && product.description.toLowerCase().includes(currentSearch));
    return matchCategory && matchSearch;
  });

  // Sort
  const sortValue = document.getElementById('sortSelect')?.value || 'featured';
  if (sortValue === 'price-asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortValue === 'price-desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortValue === 'stock') {
    filteredProducts.sort((a, b) => b.stock - a.stock);
  } else if (sortValue === 'featured') {
    filteredProducts.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const emptyState = document.getElementById('emptyState');
  const countBadge = document.getElementById('productCountBadge');

  if (countBadge) {
    countBadge.textContent = `${filteredProducts.length} Ürün`;
  }

  if (filteredProducts.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  grid.innerHTML = filteredProducts.map((p) => createProductCard(p)).join('');
}

function createProductCard(product) {
  const inStock = product.stock > 0;
  const platformIcons = {
    'REDLUA LOADER': 'fa-solid fa-code text-rose-500',
    'PUBG Mobile': 'fa-solid fa-parachute-box text-amber-400',
    'PUBG PC (Steam)': 'fa-brands fa-steam text-blue-400',
    'PUBG PC / Mobile': 'fa-solid fa-gift text-purple-400',
    Steam: 'fa-brands fa-steam text-blue-400',
    'Riot Games': 'fa-solid fa-fire text-red-500'
  };

  const iconClass = platformIcons[product.platform] || 'fa-solid fa-gamepad text-cyan-400';

  return `
    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col group hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300">
      
      <!-- Card Image & Badges -->
      <div class="relative h-48 overflow-hidden bg-slate-950">
        <img 
          src="${product.image}" 
          alt="${product.name}" 
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          loading="lazy"
        >
        
        <!-- Platform Badge -->
        <div class="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-[11px] font-semibold text-gray-200">
          <i class="${iconClass}"></i>
          <span>${product.platform}</span>
        </div>

        <!-- Tag Badge -->
        ${
          product.tag
            ? `<div class="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-pink-600 text-white text-[10px] font-bold tracking-wider shadow">
                ${product.tag}
              </div>`
            : ''
        }

        <!-- Region Indicator -->
        <div class="absolute bottom-2 left-3 text-[10px] text-gray-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
          <i class="fa-solid fa-globe text-cyan-400 mr-1"></i>${product.region || 'Global'}
        </div>
      </div>

      <!-- Card Body -->
      <div class="p-4 flex-1 flex flex-col justify-between">
        
        <div>
          <!-- Stock status -->
          <div class="mb-2">
            ${
              inStock
                ? `<span class="badge-instant px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                    <i class="fa-solid fa-bolt"></i> ${product.stock} Adet Stokta (Anında Teslim)
                  </span>`
                : `<span class="bg-red-950/80 border border-red-800/80 text-red-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                    <i class="fa-solid fa-ban"></i> Tükendi
                  </span>`
            }
          </div>

          <!-- Product Name -->
          <h3 class="font-bold text-sm text-white group-hover:text-cyan-400 transition line-clamp-2" title="${product.name}">
            <a href="product.html?id=${product.id}">${product.name}</a>
          </h3>

          <p class="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
            ${product.description}
          </p>
        </div>

        <!-- Card Footer (Price & Action) -->
        <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            ${
              product.oldPrice
                ? `<div class="text-[11px] text-gray-500 line-through">${formatCurrency(product.oldPrice)}</div>`
                : ''
            }
            <div class="font-heading text-xl font-black text-cyan-400">
              ${formatCurrency(product.price)}
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button 
              onclick="addToCart('${product.id}')" 
              ${!inStock ? 'disabled' : ''} 
              class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              title="Sepete Ekle"
            >
              <i class="fa-solid fa-cart-plus"></i>
            </button>

            <button 
              onclick="buyNow('${product.id}')" 
              ${!inStock ? 'disabled' : ''} 
              class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              ${inStock ? 'Hemen Al' : 'Tükendi'}
            </button>
          </div>

        </div>

      </div>

    </div>
  `;
}

// CART MANAGEMENT
function addToCart(productId) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  if (product.stock <= 0) {
    showToast('Bu ürün için stok kalmadı.', 'error');
    return;
  }

  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    if (existing.quantity >= product.stock) {
      showToast(`Stokta sadece ${product.stock} adet mevcut.`, 'warning');
      return;
    }
    existing.quantity += 1;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      platform: product.platform,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  saveCart();
  updateCartBadge();
  renderCartDrawer();
  showToast(`"${product.name}" sepete eklendi!`, 'success');
}

function buyNow(productId) {
  addToCart(productId);
  openCart();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.productId !== productId);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function updateCartQuantity(productId, delta) {
  const item = cart.find((i) => i.productId === productId);
  const product = allProducts.find((p) => p.id === productId);
  if (!item || !product) return;

  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    removeFromCart(productId);
    return;
  }

  if (newQty > product.stock) {
    showToast(`Maksimum ${product.stock} adet alabilirsiniz.`, 'warning');
    return;
  }

  item.quantity = newQty;
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}

function saveCart() {
  localStorage.setItem('gamekey_cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const badge = document.getElementById('cartCountBadge');
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) {
    badge.textContent = totalCount;
  }
}

function openCart() {
  const backdrop = document.getElementById('cartDrawerBackdrop');
  const drawer = document.getElementById('cartDrawer');
  if (!backdrop || !drawer) return;

  renderCartDrawer();
  backdrop.classList.remove('hidden');
  setTimeout(() => {
    backdrop.classList.remove('opacity-0');
    drawer.classList.remove('translate-x-full');
  }, 10);
}

function closeCart() {
  const backdrop = document.getElementById('cartDrawerBackdrop');
  const drawer = document.getElementById('cartDrawer');
  if (!backdrop || !drawer) return;

  drawer.classList.add('translate-x-full');
  backdrop.classList.add('opacity-0');
  setTimeout(() => {
    backdrop.classList.add('hidden');
  }, 300);
}

function renderCartDrawer() {
  const container = document.getElementById('cartItemsContainer');
  const drawerCount = document.getElementById('drawerCartCount');
  const subtotalEl = document.getElementById('cartSubtotal');
  const totalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (drawerCount) drawerCount.textContent = `${totalItems} Ürün`;
  if (subtotalEl) subtotalEl.textContent = formatCurrency(totalPrice);
  if (totalEl) totalEl.textContent = formatCurrency(totalPrice);

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <i class="fa-solid fa-cart-arrow-down text-4xl mb-3"></i>
        <p class="text-sm font-medium">Sepetiniz henüz boş.</p>
        <p class="text-xs text-gray-600 mt-1">İstediğiniz oyun veya keyi hemen ekleyin.</p>
      </div>
    `;
    if (checkoutBtn) {
      checkoutBtn.classList.add('pointer-events-none', 'opacity-50');
    }
    return;
  }

  if (checkoutBtn) {
    checkoutBtn.classList.remove('pointer-events-none', 'opacity-50');
  }

  container.innerHTML = cart
    .map(
      (item) => `
    <div class="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
      <img src="${item.image}" alt="${item.name}" class="w-14 h-14 rounded-lg object-cover">
      
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-white truncate">${item.name}</h4>
        <span class="text-[10px] text-cyan-400 font-semibold">${item.platform}</span>
        <div class="text-xs font-bold text-gray-300 mt-0.5">${formatCurrency(item.price)}</div>
      </div>

      <!-- Quantity controls -->
      <div class="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
        <button onclick="updateCartQuantity('${item.productId}', -1)" class="text-gray-400 hover:text-white px-1 text-xs">-</button>
        <span class="text-xs font-bold text-white min-w-[14px] text-center">${item.quantity}</span>
        <button onclick="updateCartQuantity('${item.productId}', 1)" class="text-gray-400 hover:text-white px-1 text-xs">+</button>
      </div>

      <button onclick="removeFromCart('${item.productId}')" class="text-gray-500 hover:text-red-400 p-1 transition" title="Kaldır">
        <i class="fa-solid fa-trash text-xs"></i>
      </button>
    </div>
  `
    )
    .join('');
}

// Helpers
function formatCurrency(val) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(val || 0);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = document.getElementById('toastIcon');

  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;

  if (type === 'error') {
    toastIcon.className = 'fa-solid fa-circle-xmark text-red-400 text-base';
  } else if (type === 'warning') {
    toastIcon.className = 'fa-solid fa-triangle-exclamation text-amber-400 text-base';
  } else {
    toastIcon.className = 'fa-solid fa-circle-check text-emerald-400 text-base';
  }

  toast.classList.remove('translate-y-20', 'opacity-0');

  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3500);
}

function resetFilters() {
  const searchInput = document.getElementById('searchInput');
  const mobileSearchInput = document.getElementById('mobileSearchInput');
  if (searchInput) searchInput.value = '';
  if (mobileSearchInput) mobileSearchInput.value = '';
  currentSearch = '';

  const firstCat = document.querySelector('.category-btn[data-category="all"]');
  if (firstCat) firstCat.click();
}
