// Multi-Language Digital Storefront Frontend Logic
let allProducts = [];
let filteredProducts = [];
let cart = [];
let currentPaymentMethod = 'stripe'; // defaults to stripe credit card

// Filter State
let selectedLanguages = new Set();
let selectedProgrammingLanguages = new Set();
let selectedTypes = new Set();
let selectedCategories = new Set();
let searchQuery = '';

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const noResults = document.getElementById('no-results');
const resultsCount = document.getElementById('results-count');
const searchInput = document.getElementById('search-input');
const languageFiltersContainer = document.getElementById('language-filters-container');
const programmingLanguageFiltersContainer = document.getElementById('programming-language-filters-container');
const typeFiltersContainer = document.getElementById('type-filters-container');
const categoryFiltersContainer = document.getElementById('category-filters-container');

// Cart Drawer Elements
const cartDrawer = document.getElementById('cart-drawer');
const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
const cartItemsList = document.getElementById('cart-items-list');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartBadge = document.getElementById('cart-badge');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// Initialize Storefront
document.addEventListener('DOMContentLoaded', async () => {
  // Load Cart from localStorage
  loadCartFromStorage();
  updateCartUI();

  // Fetch initial product set
  await fetchProducts();

  // Generate filters based on the total catalog list
  generateFiltersUI();

  // Render products
  renderProducts();
});

// Toast Notification System
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `flex items-center space-x-3 p-4 rounded-xl border shadow-lg animate-slide-up bg-white text-slate-800 ${
    type === 'success' ? 'border-green-500/30 text-green-800' : 'border-red-500/30 text-red-800'
  }`;

  const icon = type === 'success'
    ? '<i class="fas fa-check-circle text-green-500 text-lg"></i>'
    : '<i class="fas fa-exclamation-circle text-red-500 text-lg"></i>';

  toast.innerHTML = `
    ${icon}
    <div class="text-xs font-bold">${message}</div>
  `;

  toastContainer.appendChild(toast);

  // Automatically remove toast after 3.5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

// Fetch products from full-stack api
async function fetchProducts() {
  try {
    // We fetch ALL products to know the languages/categories, then filter client-side or server-side.
    // Standardizing on full API endpoints:
    const url = new URL('/api/products', window.location.origin);
    const response = await fetch(url);
    if (!response.ok) throw new Error('API request failed');
    allProducts = await response.json();
    filteredProducts = [...allProducts];
  } catch (error) {
    console.error('Failed to load catalog products:', error);
    showToast('Failed to connect to backend api. Mocking local products.', 'error');
  }
}

// Extract filter categories dynamically from products
function generateFiltersUI() {
  const languages = [...new Set(allProducts.map(p => p.language))];
  const programmingLanguages = [...new Set(allProducts.map(p => p.programmingLanguage || 'No Code'))];
  const types = [...new Set(allProducts.map(p => p.type))];
  const categories = [...new Set(allProducts.map(p => p.category))];

  // Render Languages filters
  languageFiltersContainer.innerHTML = languages.map(lang => {
    const count = allProducts.filter(p => p.language === lang).length;
    return `
      <label class="flex items-center justify-between text-xs text-slate-600 hover:text-slate-800 cursor-pointer p-1 rounded hover:bg-slate-50">
        <div class="flex items-center space-x-2.5">
          <input type="checkbox" value="${lang}" onchange="toggleFilter('language', '${lang}')" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4">
          <span class="font-medium">${lang}</span>
        </div>
        <span class="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full font-bold text-slate-400">${count}</span>
      </label>
    `;
  }).join('');

  // Render Programming Languages filters
  programmingLanguageFiltersContainer.innerHTML = programmingLanguages.map(pl => {
    const count = allProducts.filter(p => (p.programmingLanguage || 'No Code') === pl).length;
    return `
      <label class="flex items-center justify-between text-xs text-slate-600 hover:text-slate-800 cursor-pointer p-1 rounded hover:bg-slate-50">
        <div class="flex items-center space-x-2.5">
          <input type="checkbox" value="${pl}" onchange="toggleFilter('programmingLanguage', '${pl}')" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4">
          <span class="font-medium">${pl}</span>
        </div>
        <span class="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full font-bold text-slate-400">${count}</span>
      </label>
    `;
  }).join('');

  // Render Types filters
  typeFiltersContainer.innerHTML = types.map(t => {
    const count = allProducts.filter(p => p.type === t).length;
    const label = t === 'course' ? 'Premium Course' : t === 'pdf' ? 'eBook / PDF' : 'Source Code / ZIP';
    return `
      <label class="flex items-center justify-between text-xs text-slate-600 hover:text-slate-800 cursor-pointer p-1 rounded hover:bg-slate-50">
        <div class="flex items-center space-x-2.5">
          <input type="checkbox" value="${t}" onchange="toggleFilter('type', '${t}')" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4">
          <span class="font-medium">${label}</span>
        </div>
        <span class="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full font-bold text-slate-400">${count}</span>
      </label>
    `;
  }).join('');

  // Render Categories filters
  categoryFiltersContainer.innerHTML = categories.map(cat => {
    const count = allProducts.filter(p => p.category === cat).length;
    return `
      <label class="flex items-center justify-between text-xs text-slate-600 hover:text-slate-800 cursor-pointer p-1 rounded hover:bg-slate-50">
        <div class="flex items-center space-x-2.5">
          <input type="checkbox" value="${cat}" onchange="toggleFilter('category', '${cat}')" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4">
          <span class="font-medium">${cat}</span>
        </div>
        <span class="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full font-bold text-slate-400">${count}</span>
      </label>
    `;
  }).join('');
}

// Toggle filters check state
function toggleFilter(filterType, value) {
  if (filterType === 'language') {
    selectedLanguages.has(value) ? selectedLanguages.delete(value) : selectedLanguages.add(value);
  } else if (filterType === 'programmingLanguage') {
    selectedProgrammingLanguages.has(value) ? selectedProgrammingLanguages.delete(value) : selectedProgrammingLanguages.add(value);
  } else if (filterType === 'type') {
    selectedTypes.has(value) ? selectedTypes.delete(value) : selectedTypes.add(value);
  } else if (filterType === 'category') {
    selectedCategories.has(value) ? selectedCategories.delete(value) : selectedCategories.add(value);
  }
  applyFilters();
}

// Handle debounced search bar queries
let searchTimeout;
function handleSearchInput(event) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchQuery = event.target.value.trim().toLowerCase();
    applyFilters();
  }, 200);
}

// Reset filters to full state
function resetFilters() {
  selectedLanguages.clear();
  selectedProgrammingLanguages.clear();
  selectedTypes.clear();
  selectedCategories.clear();
  searchQuery = '';
  searchInput.value = '';

  // Uncheck checkboxes
  document.querySelectorAll('aside input[type="checkbox"]').forEach(cb => cb.checked = false);

  applyFilters();
  showToast('All filters and categories cleared!');
}

// Apply chosen filters to catalog
function applyFilters() {
  filteredProducts = allProducts.filter(p => {
    // Match search query
    const matchesSearch = searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery);

    // Match written languages
    const matchesLanguage = selectedLanguages.size === 0 || selectedLanguages.has(p.language);

    // Match programming languages
    const progLang = p.programmingLanguage || 'No Code';
    const matchesProgrammingLanguage = selectedProgrammingLanguages.size === 0 || selectedProgrammingLanguages.has(progLang);

    // Match types
    const matchesType = selectedTypes.size === 0 || selectedTypes.has(p.type);

    // Match categories
    const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(p.category);

    return matchesSearch && matchesLanguage && matchesProgrammingLanguage && matchesType && matchesCategory;
  });

  renderProducts();
}

// Render filtered product cards
function renderProducts() {
  if (filteredProducts.length === 0) {
    productsGrid.classList.add('hidden');
    noResults.classList.remove('hidden');
    resultsCount.textContent = 'Showing 0 products';
    return;
  }

  productsGrid.classList.remove('hidden');
  noResults.classList.add('hidden');
  resultsCount.textContent = `Found ${filteredProducts.length} digital product${filteredProducts.length === 1 ? '' : 's'}`;

  productsGrid.innerHTML = filteredProducts.map(p => {
    // Type badges
    let typeColor = 'bg-blue-50 text-blue-700 border-blue-200';
    let typeLabel = 'Premium Course';
    let typeIcon = 'fa-video';
    if (p.type === 'pdf') {
      typeColor = 'bg-red-50 text-red-700 border-red-200';
      typeLabel = 'Ebook / PDF';
      typeIcon = 'fa-file-pdf';
    } else if (p.type === 'file') {
      typeColor = 'bg-amber-50 text-amber-700 border-amber-200';
      typeLabel = 'Code Files / ZIP';
      typeIcon = 'fa-file-archive';
    }

    // Rating star helper
    const fullStars = Math.floor(p.rating);
    const hasHalfStar = p.rating % 1 !== 0;
    let starHTML = '';
    for (let i = 0; i < fullStars; i++) {
      starHTML += '<i class="fas fa-star text-yellow-400"></i>';
    }
    if (hasHalfStar) {
      starHTML += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    }

    // Bullet points HTML
    const featuresList = (p.features || []).map(f => `
      <li class="flex items-start text-[11px] text-slate-500 leading-tight">
        <i class="fas fa-check text-indigo-500 mr-1.5 mt-0.5 shrink-0 text-[10px]"></i>
        <span>${f}</span>
      </li>
    `).join('');

    const progLangLabel = p.programmingLanguage ? p.programmingLanguage : 'General';
    return `
      <div class="bg-white rounded-2xl border border-gray-250 overflow-hidden hover-scale-card shadow-sm flex flex-col justify-between">
        <!-- Card Header Image -->
        <div class="relative h-44 w-full bg-slate-100 overflow-hidden">
          <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover">
          <span class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 flex items-center">
            <i class="fas fa-globe mr-1"></i> ${p.language}
          </span>
          <span class="absolute top-3 right-3 bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-white/10 flex items-center">
            <i class="fas fa-code mr-1"></i> ${progLangLabel}
          </span>
          <span class="absolute bottom-3 right-3 ${typeColor} text-[10px] font-extrabold px-2.5 py-1 rounded-lg border flex items-center shadow-md">
            <i class="fas ${typeIcon} mr-1.5"></i> ${typeLabel}
          </span>
        </div>

        <!-- Card Body -->
        <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600">${p.category}</span>
              <div class="flex items-center space-x-1 text-xs">
                ${starHTML}
                <span class="text-[10px] text-slate-400 font-bold">(${p.reviewsCount})</span>
              </div>
            </div>

            <h4 class="font-extrabold text-slate-800 text-sm tracking-tight leading-snug line-clamp-2">${p.title}</h4>
            <p class="text-xs text-slate-400 leading-relaxed line-clamp-3">${p.description}</p>
          </div>

          <!-- Features List -->
          <ul class="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            ${featuresList}
          </ul>

          <!-- Card Actions & Sharing -->
          <div class="flex flex-col space-y-2 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between">
              <span class="text-lg font-black text-slate-800">$${p.price.toFixed(2)}</span>
              <div class="flex items-center space-x-1.5">
                <!-- Share to WhatsApp -->
                <a href="https://wa.me/?text=Check%20out%20this%20awesome%20digital%20asset:%20${encodeURIComponent(p.title)}%20for%20only%20$${p.price.toFixed(2)}!%20Join%20GlobalDigital%20store." target="_blank" class="w-8 h-8 bg-green-50 text-green-600 rounded-lg border border-green-200 flex items-center justify-center text-xs hover:bg-green-500 hover:text-white transition" title="Share via WhatsApp">
                  <i class="fab fa-whatsapp"></i>
                </a>
                <!-- Share to Instagram info -->
                <a href="https://instagram.com/global_digital_store" target="_blank" class="w-8 h-8 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center justify-center text-xs hover:bg-gradient-to-tr hover:from-yellow-500 hover:to-purple-600 hover:text-white transition" title="Follow on Instagram">
                  <i class="fab fa-instagram"></i>
                </a>
                <button onclick="addToCart('${p.id}')" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md flex items-center space-x-1.5">
                  <i class="fas fa-cart-plus"></i>
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Toggle Cart Slider
function toggleCartDrawer(open) {
  if (open) {
    cartDrawer.classList.remove('translate-x-full');
    cartDrawerOverlay.classList.remove('pointer-events-none', 'opacity-0');
    cartDrawerOverlay.classList.add('opacity-100');
  } else {
    cartDrawer.classList.add('translate-x-full');
    cartDrawerOverlay.classList.add('pointer-events-none', 'opacity-0');
    cartDrawerOverlay.classList.remove('opacity-100');
  }
}

// Add Item to shopping Cart
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.product.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ product, quantity: 1 });
  }

  saveCartToStorage();
  updateCartUI();
  toggleCartDrawer(true);
  showToast(`"${product.title}" added to shopping basket!`);

  // Highlight Badge scale
  cartBadge.classList.remove('scale-0');
  cartBadge.classList.add('scale-110');
  setTimeout(() => cartBadge.classList.remove('scale-110'), 200);
}

// Adjust quantity inside basket
function changeQuantity(productId, delta) {
  const item = cart.find(item => item.product.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(item => item.product.id !== productId);
    showToast('Item removed from basket.');
  }

  saveCartToStorage();
  updateCartUI();
}

// Update Cart Badge and Drawer items UI
function updateCartUI() {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  // Update Header badge
  if (totalItems > 0) {
    cartBadge.textContent = totalItems;
    cartBadge.classList.remove('scale-0');
  } else {
    cartBadge.classList.add('scale-0');
  }

  // Draw list of cart items
  if (cart.length === 0) {
    cartItemsList.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-center space-y-3">
        <i class="fas fa-shopping-basket text-slate-350 text-4xl"></i>
        <div>
          <h4 class="font-bold text-slate-700 text-sm">Basket is Empty</h4>
          <p class="text-xs text-slate-400 mt-1 max-w-[200px]">Add courses, guides or files from the store catalog to continue.</p>
        </div>
      </div>
    `;
    cartSubtotal.textContent = '$0.00';
    document.getElementById('checkout-btn').disabled = true;
    document.getElementById('checkout-btn').classList.add('opacity-50', 'cursor-not-allowed');
    return;
  }

  document.getElementById('checkout-btn').disabled = false;
  document.getElementById('checkout-btn').classList.remove('opacity-50', 'cursor-not-allowed');

  cartItemsList.innerHTML = cart.map(item => {
    const p = item.product;
    return `
      <div class="flex items-start justify-between space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <img src="${p.image}" alt="${p.title}" class="w-12 h-12 rounded-lg object-cover border border-slate-250">
        <div class="flex-1 min-w-0">
          <h5 class="text-xs font-bold text-slate-800 truncate">${p.title}</h5>
          <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">${p.language} • ${p.category}</span>
          <div class="flex items-center justify-between mt-1.5">
            <span class="text-xs font-black text-indigo-600">$${(p.price * item.quantity).toFixed(2)}</span>
            <!-- Quantity click controls -->
            <div class="flex items-center bg-white rounded-lg border border-gray-200 text-xs shadow-inner">
              <button onclick="changeQuantity('${p.id}', -1)" class="px-2 py-0.5 font-bold hover:bg-slate-100 rounded-l-lg transition">-</button>
              <span class="px-2 font-bold text-slate-700 font-mono">${item.quantity}</span>
              <button onclick="changeQuantity('${p.id}', 1)" class="px-2 py-0.5 font-bold hover:bg-slate-100 rounded-r-lg transition">+</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Subtotal Calculation
  const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
}

// Local Storage triggers
function saveCartToStorage() {
  localStorage.setItem('cart_items', JSON.stringify(cart));
}

// WhatsApp Floating Widget and Support Ordering
function toggleWhatsAppWidget(forceState) {
  const popup = document.getElementById('whatsapp-widget-popup');
  if (forceState !== undefined) {
    if (forceState) {
      popup.classList.remove('hidden');
      setTimeout(() => popup.classList.remove('scale-95'), 10);
    } else {
      popup.classList.add('scale-95');
      setTimeout(() => popup.classList.add('hidden'), 150);
    }
  } else {
    const isHidden = popup.classList.contains('hidden');
    toggleWhatsAppWidget(isHidden);
  }
}

function updateWhatsAppCartSummary() {
  const summaryBox = document.getElementById('wa-cart-summary-box');
  if (cart.length === 0) {
    summaryBox.innerHTML = `
      <span class="text-[10px] text-slate-400 font-medium">Your basket is currently empty. Add items to see direct order checkout!</span>
    `;
    return;
  }

  const itemsHTML = cart.map(item => `
    <div class="flex items-center justify-between text-[11px] text-slate-600 font-medium">
      <span class="truncate max-w-[150px]">${item.product.title}</span>
      <span class="font-bold text-slate-800">x${item.quantity}</span>
    </div>
  `).join('');

  const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  summaryBox.innerHTML = `
    <div class="border-b border-slate-100 pb-1.5 mb-1.5 space-y-1">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Your Direct Order</span>
      ${itemsHTML}
    </div>
    <div class="flex items-center justify-between text-[11px] font-bold text-slate-800">
      <span>Total:</span>
      <span class="text-green-600">$${subtotal.toFixed(2)}</span>
    </div>
  `;
}

function sendWhatsAppMessage() {
  const customText = document.getElementById('wa-custom-msg').value.trim();
  let baseMsg = '';

  if (cart.length > 0) {
    const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const itemsText = cart.map(item => `• ${item.product.title} (x${item.quantity}) - $${(item.product.price * item.quantity).toFixed(2)}`).join('\n');

    baseMsg = `Hello GlobalDigital! I would like to place a direct order for the following items:\n\n${itemsText}\n\n*Total Due: $${subtotal.toFixed(2)}*\n\n`;
  } else {
    baseMsg = `Hello GlobalDigital Support! I have an inquiry:\n\n`;
  }

  if (customText) {
    baseMsg += `Message: "${customText}"`;
  } else if (cart.length === 0) {
    baseMsg += `I am interested in learning more about your multi-lingual digital courses and eBooks.`;
  }

  // Pre-fill clicking link with the official WhatsApp format API (using mock merchant phone number +15550199)
  const whatsappUrl = `https://wa.me/15550199?text=${encodeURIComponent(baseMsg)}`;
  window.open(whatsappUrl, '_blank');
}

function loadCartFromStorage() {
  try {
    const data = localStorage.getItem('cart_items');
    if (data) {
      cart = JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to parse localStorage cart data:', error);
  }
}

// Modal Toggle: Interactive Checkout
function openCheckoutModal() {
  console.log("openCheckoutModal() called! Cart size:", cart.length);
  // Close Cart Drawer slider
  toggleCartDrawer(false);

  const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  document.querySelectorAll('#checkout-total').forEach(el => el.textContent = `$${subtotal.toFixed(2)}`);

  // Default back to stripe selection
  selectPaymentMethod('stripe');

  const modal = document.getElementById('checkout-modal');
  modal.classList.remove('hidden');
  const card = document.getElementById('checkout-modal-card');
  setTimeout(() => card.className = card.className.replace('scale-95', 'scale-100'), 50);
}

function closeCheckoutModal() {
  const card = document.getElementById('checkout-modal-card');
  card.className = card.className.replace('scale-100', 'scale-95');
  setTimeout(() => {
    document.getElementById('checkout-modal').classList.add('hidden');
    document.getElementById('payment-processing-overlay').classList.add('hidden');
  }, 200);
}

// Payment Switch Logic
function selectPaymentMethod(method) {
  currentPaymentMethod = method;

  const stripeBtn = document.getElementById('pay-stripe-btn');
  const paypalBtn = document.getElementById('pay-paypal-btn');
  const waBtn = document.getElementById('pay-wa-btn');

  const stripeInputs = document.getElementById('stripe-card-inputs');
  const paypalInputs = document.getElementById('paypal-sim-button');
  const waInputs = document.getElementById('whatsapp-checkout-info');

  const submitLabel = document.getElementById('checkout-submit-label');

  // Reset button designs
  [stripeBtn, paypalBtn, waBtn].forEach(btn => {
    btn.className = "py-2 px-3 border border-gray-250 bg-white text-slate-600 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1 focus:outline-none";
  });

  // Reset inputs visibility
  stripeInputs.classList.add('hidden');
  paypalInputs.classList.add('hidden');
  waInputs.classList.add('hidden');

  if (method === 'stripe') {
    stripeBtn.className = "py-2 px-3 border-2 border-indigo-600 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1 focus:outline-none";
    stripeInputs.classList.remove('hidden');
    submitLabel.textContent = "Authorize & Complete Purchase";
  } else if (method === 'paypal') {
    paypalBtn.className = "py-2 px-3 border-2 border-indigo-600 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1 focus:outline-none";
    paypalInputs.classList.remove('hidden');
    submitLabel.textContent = "Pay via PayPal Express";
  } else if (method === 'whatsapp') {
    waBtn.className = "py-2 px-3 border-2 border-green-600 bg-green-50 text-green-700 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center space-y-1 focus:outline-none";
    waInputs.classList.remove('hidden');
    submitLabel.textContent = "Place Order on WhatsApp";
  }
}

// Checkout Form submission
async function handleCheckoutSubmit(event) {
  event.preventDefault();

  const fullName = document.getElementById('checkout-fullname').value.trim();
  const email = document.getElementById('checkout-email').value.trim();

  // Validate fields if card is selected
  if (currentPaymentMethod === 'stripe') {
    const cardNum = document.getElementById('stripe-card-num').value.trim();
    if (!cardNum) {
      showToast('Please provide a valid card number to simulate payment.', 'error');
      return;
    }
  }

  // Show processing loader
  const processingOverlay = document.getElementById('payment-processing-overlay');
  processingOverlay.classList.remove('hidden');

  // Simulate payment gateway handshakes for 1.8 seconds
  setTimeout(async () => {
    const checkoutPayload = {
      fullName,
      email,
      items: cart.map(item => ({
        id: item.product.id,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server rejected checkout');
      }

      const orderResult = await response.json();

      // Clear processing loader and close checkout modal
      processingOverlay.classList.add('hidden');
      closeCheckoutModal();

      // Trigger redirect to WhatsApp if direct order was selected
      if (currentPaymentMethod === 'whatsapp') {
        sendWhatsAppMessage();
      }

      // Fill and Display Success Deliverables access modal
      showSuccessModal(orderResult);

      // Clear Cart
      cart = [];
      saveCartToStorage();
      updateCartUI();
      showToast('Transaction processed successfully via ' + currentPaymentMethod + '!', 'success');

    } catch (error) {
      console.error('Checkout purchase transaction failed:', error);
      processingOverlay.classList.add('hidden');
      showToast(error.message || 'Payment authentication failed.', 'error');
    }
  }, 1800);
}

// Success delivery UI panel
function showSuccessModal(order) {
  document.getElementById('success-buyer-name').textContent = order.fullName;
  document.getElementById('success-order-id').textContent = order.orderId;

  const downloadsList = document.getElementById('success-downloads-list');
  downloadsList.innerHTML = order.purchasedItems.map(item => {
    // Determine download badge icon
    let badgeIcon = 'fa-file-pdf text-red-500 bg-red-500/10';
    let btnLabel = 'Download PDF Guide';
    let targetAttr = 'download';

    if (item.type === 'course') {
      badgeIcon = 'fa-graduation-cap text-indigo-500 bg-indigo-500/10';
      btnLabel = 'Open Digital Player';
      targetAttr = 'target="_blank"';
    } else if (item.type === 'file') {
      badgeIcon = 'fa-file-archive text-amber-500 bg-amber-500/10';
      btnLabel = 'Download ZIP Codebase';
      targetAttr = 'download';
    }

    return `
      <div class="flex items-center justify-between p-3 bg-white border border-slate-150 rounded-xl">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center ${badgeIcon}">
            <i class="fas ${item.type === 'course' ? 'fa-video' : item.type === 'pdf' ? 'fa-file-pdf' : 'fa-file-archive'} text-lg"></i>
          </div>
          <div>
            <h5 class="text-xs font-bold text-slate-800 max-w-[200px] truncate">${item.title}</h5>
            <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">${item.language} • ${item.type}</span>
          </div>
        </div>
        <a href="${item.downloadUrl}" ${targetAttr} class="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3.5 py-2 rounded-lg transition flex items-center space-x-1.5">
          <i class="fas ${item.type === 'course' ? 'fa-play' : 'fa-download'}"></i>
          <span>${btnLabel}</span>
        </a>
      </div>
    `;
  }).join('');

  document.getElementById('success-modal').classList.remove('hidden');
}

function closeSuccessModal() {
  document.getElementById('success-modal').classList.add('hidden');
}
