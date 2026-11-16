const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helpers for JSON Data Management
const DATA_DIR = path.join(__dirname, 'data');

function readJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return [];
  }
}

function writeJson(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    return false;
  }
}

// ---------------- API ROUTES ---------------- //

// GET /api/settings
app.get('/api/settings', (req, res) => {
  const settings = readJson('settings.json');
  // Hide sensitive credentials from public
  const safeSettings = { ...settings };
  delete safeSettings.adminPin;
  if (safeSettings.shopier) {
    safeSettings.shopier = {
      enabled: safeSettings.shopier.enabled,
      testMode: safeSettings.shopier.testMode
    };
  }
  res.json(safeSettings);
});

// GET /api/products (with live stock count)
app.get('/api/products', (req, res) => {
  const products = readJson('products.json');
  const keys = readJson('keys.json');

  const productsWithStock = products.map((prod) => {
    const availableKeys = keys.filter(
      (k) => k.productId === prod.id && k.status === 'AVAILABLE'
    );
    // If keys exist, use that count; otherwise default to in-stock (99) for direct sales
    const count = availableKeys.length > 0 ? availableKeys.length : (prod.stock !== undefined ? prod.stock : 99);
    return {
      ...prod,
      stock: count,
      hasKeys: availableKeys.length > 0,
      inStock: count > 0
    };
  });

  res.json(productsWithStock);
});

// GET /api/products/:id
app.get('/api/products/:id', (req, res) => {
  const products = readJson('products.json');
  const keys = readJson('keys.json');
  const product = products.find((p) => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ error: 'Ürün bulunamadı' });
  }

  const availableKeys = keys.filter(
    (k) => k.productId === product.id && k.status === 'AVAILABLE'
  );

  const count = availableKeys.length > 0 ? availableKeys.length : (product.stock !== undefined ? product.stock : 99);

  res.json({
    ...product,
    stock: count,
    hasKeys: availableKeys.length > 0,
    inStock: count > 0
  });
});

// POST /api/checkout (Flexible Checkout - Key delivery if available, otherwise direct sale order)
app.post('/api/checkout', (req, res) => {
  const { customer, items, paymentMethod } = req.body;

  if (!customer || !customer.email || !customer.name) {
    return res.status(400).json({ error: 'Lütfen ad, soyad ve e-posta adresinizi eksiksiz girin.' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Sepetiniz boş.' });
  }

  const products = readJson('products.json');
  let keys = readJson('keys.json');
  const orders = readJson('orders.json');

  const allocatedItems = [];
  let orderTotal = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ error: `Geçersiz ürün: ${item.productId}` });
    }

    const qty = parseInt(item.quantity || 1, 10);
    orderTotal += product.price * qty;

    allocatedItems.push({
      productId: product.id,
      productName: product.name,
      platform: product.platform,
      price: product.price,
      quantity: qty,
      activationGuide: product.activationGuide || '',
      assignedKeys: []
    });
  }

  // Generate unique order ID: TR-XXXXXX
  const orderId = 'TR-' + Math.floor(100000 + Math.random() * 900000);
  const now = new Date().toISOString();

  // Try to assign keys if available in pool, otherwise mark for direct fulfillment
  let anyKeysAssigned = false;
  for (const item of allocatedItems) {
    let needed = item.quantity;
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].productId === item.productId && keys[i].status === 'AVAILABLE') {
        keys[i].status = 'SOLD';
        keys[i].orderId = orderId;
        keys[i].soldAt = now;
        item.assignedKeys.push(keys[i].keyCode);
        anyKeysAssigned = true;
        needed--;
        if (needed === 0) break;
      }
    }
  }

  const newOrder = {
    id: orderId,
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      note: customer.note || ''
    },
    items: allocatedItems,
    hasKeys: anyKeysAssigned,
    totalAmount: orderTotal,
    paymentMethod: paymentMethod || 'credit_card',
    paymentStatus: paymentMethod === 'havale' ? 'BEKLEMEDE' : 'TAMAMLANDI',
    orderStatus: anyKeysAssigned ? 'TESLİM EDİLDİ' : 'HAZIRLANIYOR',
    createdAt: now
  };

  // Persist keys and order
  if (anyKeysAssigned) {
    writeJson('keys.json', keys);
  }
  orders.unshift(newOrder);
  writeJson('orders.json', orders);

  res.json({
    success: true,
    message: 'Siparişiniz başarıyla oluşturuldu ve keyleriniz teslim edildi.',
    orderId: orderId,
    order: newOrder
  });
});

// GET /api/orders/:id
app.get('/api/orders/:id', (req, res) => {
  const orders = readJson('orders.json');
  const order = orders.find((o) => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Sipariş bulunamadı' });
  }

  res.json(order);
});

// GET /api/my-keys?email=...
app.get('/api/my-keys', (req, res) => {
  const email = (req.query.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Lütfen bir e-posta adresi belirtin.' });
  }

  const orders = readJson('orders.json');
  const customerOrders = orders.filter(
    (o) => o.customer && o.customer.email && o.customer.email.toLowerCase() === email
  );

  res.json({
    email,
    orders: customerOrders
  });
});

// ---------------- ADMIN API ---------------- //

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  const settings = readJson('settings.json');

  if (pin === settings.adminPin) {
    return res.json({ success: true, token: 'auth_' + Buffer.from(pin).toString('base64') });
  }

  return res.status(401).json({ error: 'Hatalı yönetici PIN kodu!' });
});

// GET /api/admin/stats
app.get('/api/admin/stats', (req, res) => {
  const orders = readJson('orders.json');
  const keys = readJson('keys.json');
  const products = readJson('products.json');

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'TAMAMLANDI')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const availableKeysCount = keys.filter((k) => k.status === 'AVAILABLE').length;
  const soldKeysCount = keys.filter((k) => k.status === 'SOLD').length;

  res.json({
    totalRevenue,
    orderCount: orders.length,
    completedOrdersCount: orders.filter((o) => o.paymentStatus === 'TAMAMLANDI').length,
    totalProducts: products.length,
    availableKeys: availableKeysCount,
    soldKeys: soldKeysCount,
    recentOrders: orders.slice(0, 5)
  });
});

// GET /api/admin/orders
app.get('/api/admin/orders', (req, res) => {
  const orders = readJson('orders.json');
  res.json(orders);
});

// POST /api/admin/orders/:id/status
app.post('/api/admin/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const orders = readJson('orders.json');
  const orderIndex = orders.findIndex((o) => o.id === req.params.id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Sipariş bulunamadı' });
  }

  orders[orderIndex].paymentStatus = status;
  writeJson('orders.json', orders);
  res.json({ success: true, order: orders[orderIndex] });
});

// GET /api/admin/keys
app.get('/api/admin/keys', (req, res) => {
  const keys = readJson('keys.json');
  const { productId, status } = req.query;

  let filtered = [...keys];
  if (productId) {
    filtered = filtered.filter((k) => k.productId === productId);
  }
  if (status) {
    filtered = filtered.filter((k) => k.status === status);
  }

  res.json(filtered);
});

// POST /api/admin/keys/bulk (Bulk Key Upload)
app.post('/api/admin/keys/bulk', (req, res) => {
  const { productId, keysText } = req.body;

  if (!productId || !keysText) {
    return res.status(400).json({ error: 'Ürün seçimi ve key metni zorunludur.' });
  }

  const products = readJson('products.json');
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return res.status(400).json({ error: 'Seçilen ürün mevcut değil.' });
  }

  const lines = keysText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return res.status(400).json({ error: 'Eklenecek geçerli bir key bulunamadı.' });
  }

  const keys = readJson('keys.json');
  const now = new Date().toISOString();
  let addedCount = 0;

  for (const line of lines) {
    // Avoid exact duplicate active keys for the same product
    const alreadyExists = keys.some(
      (k) => k.productId === productId && k.keyCode === line && k.status === 'AVAILABLE'
    );

    if (!alreadyExists) {
      keys.push({
        id: 'key_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        productId,
        keyCode: line,
        status: 'AVAILABLE',
        orderId: null,
        addedAt: now,
        soldAt: null
      });
      addedCount++;
    }
  }

  writeJson('keys.json', keys);

  res.json({
    success: true,
    addedCount,
    message: `${addedCount} adet yeni key başarıyla stoğa eklendi.`
  });
});

// POST /api/admin/products (Create or Update Product)
app.post('/api/admin/products', (req, res) => {
  const productData = req.body;
  if (!productData.name || !productData.price) {
    return res.status(400).json({ error: 'Ürün adı ve fiyatı zorunludur.' });
  }

  const products = readJson('products.json');
  const id = productData.id || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const existingIndex = products.findIndex((p) => p.id === id);

  const updatedProduct = {
    id,
    name: productData.name,
    category: productData.category || 'steam',
    platform: productData.platform || 'Steam',
    price: parseFloat(productData.price),
    oldPrice: productData.oldPrice ? parseFloat(productData.oldPrice) : null,
    image: productData.image || 'https://images.unsplash.com/photo-1612287233207-635e1b6f00db?w=600&auto=format&fit=crop&q=80',
    tag: productData.tag || 'YENİ',
    featured: !!productData.featured,
    delivery: productData.delivery || 'Anında Otomatik Teslimat',
    region: productData.region || 'Global / TR',
    description: productData.description || '',
    activationGuide: productData.activationGuide || ''
  };

  if (existingIndex >= 0) {
    products[existingIndex] = updatedProduct;
  } else {
    products.push(updatedProduct);
  }

  writeJson('products.json', products);
  res.json({ success: true, product: updatedProduct });
});

// DELETE /api/admin/products/:id
app.delete('/api/admin/products/:id', (req, res) => {
  let products = readJson('products.json');
  products = products.filter((p) => p.id !== req.params.id);
  writeJson('products.json', products);
  res.json({ success: true });
});

// Settings Update
app.post('/api/admin/settings', (req, res) => {
  const newSettings = req.body;
  const current = readJson('settings.json');
  const merged = { ...current, ...newSettings };
  writeJson('settings.json', merged);
  res.json({ success: true, settings: merged });
});

// Fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🎮 RedZone Market Oyun & Key Satış Sitesi Yayında!`);
  console.log(`🌐 Site Adresi: http://localhost:${PORT}`);
  console.log(`🌍 Alan Adı (Domain): https://redzonemartket.com.tr`);
  console.log(`👑 Admin Paneli: http://localhost:${PORT}/admin.html`);
  console.log(`🔑 Varsayılan Admin PIN: admin123`);
  console.log(`===============================================`);
});
