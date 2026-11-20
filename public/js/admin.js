// GameKey TR - Admin Panel Logic
let productsList = [];
let keysList = [];
let ordersList = [];

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupAdminListeners();
});

function checkAuth() {
  const token = sessionStorage.getItem('admin_token');
  const modal = document.getElementById('authModal');
  if (!token) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
    initAdminData();
  }
}

function setupAdminListeners() {
  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = document.getElementById('adminPinInput').value.trim();
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        });
        const data = await res.json();
        if (data.success) {
          sessionStorage.setItem('admin_token', data.token);
          document.getElementById('authModal').classList.add('hidden');
          initAdminData();
        } else {
          alert(data.error || 'Hatalı PIN!');
        }
      } catch (err) {
        alert('Giriş hatası: ' + err.message);
      }
    });
  }

  // Bulk Key Upload Form
  const bulkKeyForm = document.getElementById('bulkKeyForm');
  if (bulkKeyForm) {
    bulkKeyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const productId = document.getElementById('bulkProductSelect').value;
      const keysText = document.getElementById('bulkKeyInput').value;

      try {
        const res = await fetch('/api/admin/keys/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, keysText })
        });
        const data = await res.json();
        if (data.success) {
          alert(data.message);
          document.getElementById('bulkKeyInput').value = '';
          await initAdminData();
        } else {
          alert('Hata: ' + data.error);
        }
      } catch (err) {
        alert('Key yükleme hatası: ' + err.message);
      }
    });
  }

  // Product Create/Edit Form
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editId = document.getElementById('editProductId').value;
      const productPayload = {
        id: editId || undefined,
        name: document.getElementById('pName').value.trim(),
        platform: document.getElementById('pPlatform').value,
        category: document.getElementById('pCategory').value,
        price: document.getElementById('pPrice').value,
        oldPrice: document.getElementById('pOldPrice').value || null,
        tag: document.getElementById('pTag').value.trim(),
        image: document.getElementById('pImage').value.trim(),
        region: document.getElementById('pRegion').value.trim(),
        description: document.getElementById('pDescription').value.trim(),
        activationGuide: document.getElementById('pGuide').value.trim()
      };

      try {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productPayload)
        });
        const data = await res.json();
        if (data.success) {
          alert('Ürün başarıyla kaydedildi!');
          resetProductForm();
          await initAdminData();
        } else {
          alert('Hata: ' + data.error);
        }
      } catch (err) {
        alert('Kayıt hatası: ' + err.message);
      }
    });
  }

  // Settings Form
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        siteName: document.getElementById('setSiteName').value.trim(),
        announcement: document.getElementById('setAnnouncement').value.trim(),
        shopier: {
          apiKey: document.getElementById('setShopierKey').value.trim(),
          apiSecret: document.getElementById('setShopierSecret').value.trim(),
          enabled: true
        },
        havale: {
          bankName: document.getElementById('setBankName').value.trim(),
          iban: document.getElementById('setIban').value.trim(),
          accountHolder: document.getElementById('setAccountHolder').value.trim(),
          enabled: true
        }
      };

      const newPin = document.getElementById('setAdminPin')?.value.trim();
      if (newPin) {
        payload.adminPin = newPin;
      }

      try {
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          alert('Ayarlar kaydedildi!');
        }
      } catch (err) {
        alert('Ayar kaydetme hatası: ' + err.message);
      }
    });
  }

  // Referral Code Creation Form
  const referralForm = document.getElementById('referralForm');
  if (referralForm) {
    referralForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('refCode').value.trim();
      const name = document.getElementById('refName').value.trim();
      const discount = document.getElementById('refDiscount').value;
      const maxUses = document.getElementById('refMaxUses').value;

      try {
        const res = await fetch('/api/admin/referrals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, name, discount, maxUses })
        });
        const data = await res.json();
        if (data.success) {
          alert('Bayi referans kodu başarıyla oluşturuldu: ' + data.referral.code);
          referralForm.reset();
          await loadReferrals();
        } else {
          alert('Hata: ' + (data.error || 'Oluşturulamadı'));
        }
      } catch (err) {
        alert('Kayıt hatası: ' + err.message);
      }
    });
  }
}

async function initAdminData() {
  await Promise.all([
    loadStats(),
    loadProducts(),
    loadKeysTable(),
    loadOrders(),
    loadSettings(),
    loadReferrals(),
    loadUsers()
  ]);
}

async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();

    document.getElementById('statRevenue').textContent = formatCurrency(data.totalRevenue);
    document.getElementById('statOrders').textContent = data.orderCount;
    document.getElementById('statAvailableKeys').textContent = data.availableKeys;
    document.getElementById('statSoldKeys').textContent = data.soldKeys;
  } catch (err) {
    console.error('Stats error:', err);
  }
}

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    productsList = await res.json();

    // Populate bulk key product selector
    const bulkSelect = document.getElementById('bulkProductSelect');
    if (bulkSelect) {
      bulkSelect.innerHTML = productsList
        .map(
          (p) => `<option value="${p.id}">${p.name} (${p.platform} - Kalan: ${p.stock})</option>`
        )
        .join('');
    }

    // Render products table
    const tbody = document.getElementById('productsTableBody');
    if (tbody) {
      tbody.innerHTML = productsList
        .map(
          (p) => `
        <tr class="hover:bg-slate-950/60 transition">
          <td class="p-3">
            <img src="${p.image}" class="w-10 h-10 rounded-lg object-cover">
          </td>
          <td class="p-3 font-semibold text-white">${p.name}</td>
          <td class="p-3 text-cyan-400 font-medium">${p.platform}</td>
          <td class="p-3 font-bold">${formatCurrency(p.price)}</td>
          <td class="p-3">
            <span class="${
              p.stock > 0
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-red-950 text-red-400 border border-red-800'
            } px-2.5 py-0.5 rounded-full font-bold text-[10px]">
              ${p.stock} Adet
            </span>
          </td>
          <td class="p-3 space-x-2">
            <button onclick="editProduct('${p.id}')" class="text-cyan-400 hover:text-cyan-300 font-semibold">Düzenle</button>
            <button onclick="deleteProduct('${p.id}')" class="text-red-400 hover:text-red-300 font-semibold">Sil</button>
          </td>
        </tr>
      `
        )
        .join('');
    }
  } catch (err) {
    console.error('Load products error:', err);
  }
}

async function loadKeysTable() {
  try {
    const status = document.getElementById('keyFilterStatus')?.value || '';
    const url = status ? `/api/admin/keys?status=${status}` : '/api/admin/keys';
    const res = await fetch(url);
    keysList = await res.json();

    const tbody = document.getElementById('keysTableBody');
    if (tbody) {
      tbody.innerHTML = keysList
        .map((k) => {
          const product = productsList.find((p) => p.id === k.productId);
          const isAvail = k.status === 'AVAILABLE';
          return `
          <tr class="hover:bg-slate-950/60 transition">
            <td class="p-3 font-medium text-white">${product ? product.name : k.productId}</td>
            <td class="p-3 font-mono font-bold text-cyan-300 tracking-wider">${k.keyCode}</td>
            <td class="p-3">
              <span class="${
                isAvail
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-slate-800 text-gray-400'
              } px-2 py-0.5 rounded text-[10px] font-bold">
                ${isAvail ? 'SATIŞTA (AKTİF)' : 'SATILDI'}
              </span>
            </td>
            <td class="p-3 font-mono text-gray-400">${k.orderId || '-'}</td>
            <td class="p-3 text-gray-500">${new Date(k.addedAt).toLocaleDateString('tr-TR')}</td>
          </tr>
        `;
        })
        .join('');
    }
  } catch (err) {
    console.error('Keys table error:', err);
  }
}

async function loadOrders() {
  try {
    const res = await fetch('/api/admin/orders');
    ordersList = await res.json();

    const tbody = document.getElementById('ordersTableBody');
    if (tbody) {
      tbody.innerHTML = ordersList
        .map(
          (o) => `
        <tr class="hover:bg-slate-950/60 transition">
          <td class="p-3 font-mono font-bold text-cyan-400">${o.id}</td>
          <td class="p-3">
            <div class="font-semibold text-white">${o.customer.name}</div>
            <div class="text-[10px] text-gray-400">${o.customer.email} ${o.customer.phone ? '• ' + o.customer.phone : ''}</div>
            ${o.customer.note ? `<div class="text-[10px] text-amber-400 font-medium mt-0.5"><i class="fa-solid fa-comment-dots mr-1"></i>Not: ${o.customer.note}</div>` : ''}
          </td>
          <td class="p-3">
            ${o.items.map((i) => `<div class="text-[11px] text-gray-300">• ${i.productName} (${i.quantity}x)</div>`).join('')}
          </td>
          <td class="p-3 font-bold">${formatCurrency(o.totalAmount)}</td>
          <td class="p-3">
            <span class="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
              ${o.orderStatus || o.paymentStatus}
            </span>
          </td>
          <td class="p-3 text-gray-400">${new Date(o.createdAt).toLocaleString('tr-TR')}</td>
        </tr>
      `
        )
        .join('');
    }
  } catch (err) {
    console.error('Orders error:', err);
  }
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const s = await res.json();

    if (document.getElementById('setSiteName')) document.getElementById('setSiteName').value = s.siteName || '';
    if (document.getElementById('setAnnouncement')) document.getElementById('setAnnouncement').value = s.announcement || '';
    if (document.getElementById('setBankName')) document.getElementById('setBankName').value = s.havale?.bankName || '';
    if (document.getElementById('setIban')) document.getElementById('setIban').value = s.havale?.iban || '';
    if (document.getElementById('setAccountHolder')) document.getElementById('setAccountHolder').value = s.havale?.accountHolder || '';
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.admin-tab').forEach((b) => {
    b.classList.remove('bg-cyan-500', 'text-white');
    b.classList.add('text-gray-400');
  });

  const activeBtn = document.getElementById(`tab-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-cyan-500', 'text-white');
    activeBtn.classList.remove('text-gray-400');
  }

  document.querySelectorAll('.tab-pane').forEach((p) => p.classList.add('hidden'));
  const activePane = document.getElementById(`content-${tabId}`);
  if (activePane) activePane.classList.remove('hidden');
}

function editProduct(id) {
  const p = productsList.find((item) => item.id === id);
  if (!p) return;

  switchTab('products');

  document.getElementById('productFormTitle').textContent = `Ürün Düzenle: ${p.name}`;
  document.getElementById('editProductId').value = p.id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pPlatform').value = p.platform;
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pOldPrice').value = p.oldPrice || '';
  document.getElementById('pTag').value = p.tag || '';
  document.getElementById('pImage').value = p.image || '';
  document.getElementById('pRegion').value = p.region || '';
  document.getElementById('pDescription').value = p.description || '';
  document.getElementById('pGuide').value = p.activationGuide || '';
}

function resetProductForm() {
  document.getElementById('productFormTitle').textContent = 'Yeni Oyun / Key Ekle';
  document.getElementById('editProductId').value = '';
  document.getElementById('productForm').reset();
}

async function deleteProduct(id) {
  if (!confirm('Bu oyunu ve mağazadaki görünümünü silmek istediğinize emin misiniz?')) return;

  try {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Ürün silindi!');
      await initAdminData();
    }
  } catch (err) {
    alert('Silme hatası: ' + err.message);
  }
}

function logoutAdmin() {
  sessionStorage.removeItem('admin_token');
  location.reload();
}

function formatCurrency(val) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(val || 0);
}

async function loadReferrals() {
  try {
    const res = await fetch('/api/admin/referrals');
    const list = await res.json();
    const tbody = document.getElementById('referralsTableBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-gray-500">Henüz referans kodu oluşturulmamış.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(r => `
      <tr class="hover:bg-slate-800/40">
        <td class="p-3 font-mono font-bold text-amber-400">${r.code}</td>
        <td class="p-3 text-white font-medium">${r.name}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">%${r.discount} İndirim</span></td>
        <td class="p-3 text-gray-300">${r.usedCount || 0} / ${r.maxUses || 'Limitsiz'}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] uppercase font-bold">${r.isActive ? 'Aktif' : 'Pasif'}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Referrals load error:', err);
  }
}

async function loadUsers() {
  try {
    const res = await fetch('/api/admin/users');
    const users = await res.json();
    const tbody = document.getElementById('usersTableBody');
    const badge = document.getElementById('userCountBadge');
    if (badge) badge.textContent = `${users.length} Kayıtlı Kullanıcı`;
    if (!tbody) return;

    if (!users || users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-500">Henüz kayıtlı üye bulunmamaktadır.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => {
      const isReseller = u.role === 'reseller';
      return `
        <tr class="hover:bg-slate-800/40">
          <td class="p-3 font-bold text-white flex items-center gap-1.5">
            ${isReseller ? '<i class="fa-solid fa-crown text-amber-400 text-xs"></i>' : '<i class="fa-solid fa-user text-gray-400 text-xs"></i>'}
            ${u.username}
          </td>
          <td class="p-3 text-gray-400 font-mono">${u.email}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isReseller ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-gray-300 border border-slate-700'}">
              ${isReseller ? '👑 YETKİLİ BAYİ' : 'Standart Müşteri'}
            </span>
          </td>
          <td class="p-3 font-semibold text-emerald-400">%${u.discountRate || 0}</td>
          <td class="p-3 font-mono text-xs text-gray-400">${u.referralCodeUsed || '-'}</td>
          <td class="p-3 text-gray-500 text-[11px]">${u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '-'}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Users load error:', err);
  }
}
