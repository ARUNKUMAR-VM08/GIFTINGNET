const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files and downloadable assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Helper functions for Database Files
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

function readProducts() {
  try {
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading products database:', error);
    return [];
  }
}

function writeProducts(products) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing products database:', error);
    return false;
  }
}

function readOrders() {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading orders database:', error);
    return [];
  }
}

function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing orders database:', error);
    return false;
  }
}

// Ensure database files exist
if (!fs.existsSync(PRODUCTS_FILE)) {
  fs.mkdirSync(path.dirname(PRODUCTS_FILE), { recursive: true });
  fs.writeFileSync(PRODUCTS_FILE, '[]', 'utf8');
}
if (!fs.existsSync(ORDERS_FILE)) {
  fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true });
  fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');
}

// API Routes

/**
 * GET /api/products
 * Fetch all available products with optional queries for language, type, category, or search.
 */
app.get('/api/products', (req, res) => {
  let products = readProducts();
  const { language, type, category, search } = req.query;

  if (search) {
    const term = search.toLowerCase();
    products = products.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    );
  }

  if (language) {
    const langs = language.split(',');
    products = products.filter(p => langs.includes(p.language));
  }

  if (type) {
    const types = type.split(',');
    products = products.filter(p => types.includes(p.type));
  }

  if (category) {
    const cats = category.split(',');
    products = products.filter(p => cats.includes(p.category));
  }

  res.json(products);
});

/**
 * POST /api/products
 * Vendor endpoint to add a new digital product (Course, PDF, ZIP file).
 */
app.post('/api/products', (req, res) => {
  const { title, description, type, language, category, price, image, features } = req.body;

  // Simple validation
  if (!title || !description || !type || !language || !category || price === undefined) {
    return res.status(400).json({ error: 'Missing required product fields' });
  }

  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: 'Price must be a valid positive number' });
  }

  const products = readProducts();

  // Choose default asset depending on type
  let downloadUrl = '/assets/sample.pdf';
  if (type === 'course') {
    downloadUrl = '/assets/sample_course.html';
  } else if (type === 'file') {
    downloadUrl = '/assets/sample.zip';
  }

  // Fallback image if not provided
  const fallbackImage = type === 'course'
    ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80'
    : type === 'pdf'
    ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'
    : 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80';

  const newProduct = {
    id: `prod-${uuidv4().substring(0, 8)}`,
    title,
    description,
    type,
    language,
    category,
    price: parseFloat(price),
    rating: 5.0,
    reviewsCount: 1,
    image: image || fallbackImage,
    features: Array.isArray(features) ? features : ['Full digital access included'],
    downloadUrl
  };

  products.push(newProduct);
  if (writeProducts(products)) {
    res.status(201).json(newProduct);
  } else {
    res.status(500).json({ error: 'Failed to write product to database' });
  }
});

/**
 * POST /api/checkout
 * Mock payment checkouts and order processing.
 */
app.post('/api/checkout', (req, res) => {
  const { email, fullName, items } = req.body;

  if (!email || !fullName || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Checkout requires buyer name, email, and a non-empty list of items.' });
  }

  const products = readProducts();
  const orders = readOrders();

  let totalAmount = 0;
  const purchasedItems = [];

  for (const cartItem of items) {
    const product = products.find(p => p.id === cartItem.id);
    if (!product) {
      return res.status(404).json({ error: `Product with ID ${cartItem.id} was not found.` });
    }
    const quantity = cartItem.quantity || 1;
    totalAmount += product.price * quantity;
    purchasedItems.push({
      productId: product.id,
      title: product.title,
      type: product.type,
      language: product.language,
      price: product.price,
      quantity,
      downloadUrl: product.downloadUrl
    });
  }

  const newOrder = {
    orderId: `ord-${uuidv4().substring(0, 8)}`,
    fullName,
    email,
    date: new Date().toISOString(),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    items: purchasedItems
  };

  orders.push(newOrder);
  if (writeOrders(orders)) {
    res.status(201).json({
      success: true,
      orderId: newOrder.orderId,
      fullName: newOrder.fullName,
      totalAmount: newOrder.totalAmount,
      purchasedItems: newOrder.items
    });
  } else {
    res.status(500).json({ error: 'Failed to complete transaction database save' });
  }
});

// Start the Express Server
app.listen(PORT, () => {
  console.log(`Server is running beautifully at http://localhost:${PORT}`);
});
