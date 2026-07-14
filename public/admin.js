// Merchant Admin Control Logic
let inventoryProducts = [];

const inventoryList = document.getElementById('inventory-list');
const totalListingsCount = document.getElementById('total-listings-count');
const addProductForm = document.getElementById('add-product-form');
const toastContainer = document.getElementById('toast-container');

// Load Dashboard Info on Boot
document.addEventListener('DOMContentLoaded', async () => {
  await fetchInventory();
});

// Toast notification trigger
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

// Fetch current inventory
async function fetchInventory() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('API server request failed');
    inventoryProducts = await response.json();

    // Update count labels
    totalListingsCount.textContent = inventoryProducts.length;

    renderInventoryTable();
  } catch (error) {
    console.error('Failed to retrieve inventory data:', error);
    showToast('Failed to fetch catalog from API server.', 'error');
  }
}

// Draw the inventory row listings
function renderInventoryTable() {
  if (inventoryProducts.length === 0) {
    inventoryList.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 px-2 text-center text-slate-400 font-medium">No inventory products registered yet.</td>
      </tr>
    `;
    return;
  }

  inventoryList.innerHTML = inventoryProducts.map(p => {
    // Type indicators
    let typeBadge = '<span class="px-2 py-0.5 rounded-md text-[10px] bg-blue-100 text-blue-800 font-bold uppercase">Course</span>';
    if (p.type === 'pdf') {
      typeBadge = '<span class="px-2 py-0.5 rounded-md text-[10px] bg-red-100 text-red-800 font-bold uppercase">PDF Guide</span>';
    } else if (p.type === 'file') {
      typeBadge = '<span class="px-2 py-0.5 rounded-md text-[10px] bg-amber-100 text-amber-800 font-bold uppercase">Code ZIP</span>';
    }

    return `
      <tr class="hover:bg-slate-50/50 transition">
        <td class="py-3.5 px-2">
          <div class="flex items-center space-x-3 max-w-sm">
            <img src="${p.image}" alt="${p.title}" class="w-10 h-10 rounded-lg object-cover border">
            <div class="min-w-0">
              <h5 class="font-extrabold text-slate-800 truncate">${p.title}</h5>
              <p class="text-[10px] text-slate-400 truncate">${p.description}</p>
            </div>
          </div>
        </td>
        <td class="py-3.5 px-2">${typeBadge}</td>
        <td class="py-3.5 px-2 font-bold text-slate-700">${p.language}</td>
        <td class="py-3.5 px-2 font-semibold text-slate-500">${p.category}</td>
        <td class="py-3.5 px-2 text-right font-black text-slate-800 text-sm">$${p.price.toFixed(2)}</td>
      </tr>
    `;
  }).join('');
}

// Form Submission handler
async function handleFormSubmit(event) {
  event.preventDefault();

  const title = document.getElementById('prod-title').value.trim();
  const description = document.getElementById('prod-desc').value.trim();
  const type = document.getElementById('prod-type').value;
  const price = parseFloat(document.getElementById('prod-price').value);
  const language = document.getElementById('prod-lang').value.trim();
  const category = document.getElementById('prod-category').value.trim();
  const image = document.getElementById('prod-image').value.trim() || null;
  const featuresText = document.getElementById('prod-features').value.trim();

  // Split lines to build bullet points
  const features = featuresText
    ? featuresText.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    : [];

  const payload = {
    title,
    description,
    type,
    price,
    language,
    category,
    image,
    features
  };

  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Server rejected product creation');
    }

    showToast(`"${title}" listing was successfully created!`, 'success');

    // Clear Form inputs
    addProductForm.reset();

    // Reload listings
    await fetchInventory();

  } catch (error) {
    console.error('Failed to register product listing:', error);
    showToast(error.message || 'Server error listing product.', 'error');
  }
}
