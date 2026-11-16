-- JUDAH CELL · esquema inicial (SQLite / libSQL)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('phone','accessory')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cop INTEGER NOT NULL CHECK (price_cop >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image TEXT NOT NULL,
  image_is_illustration INTEGER NOT NULL DEFAULT 0,
  ram_gb INTEGER,
  storage_gb INTEGER,
  main_camera_mp INTEGER,
  camera_summary TEXT,
  battery_mah INTEGER,
  screen TEXT,
  processor TEXT,
  performance_score INTEGER CHECK (performance_score BETWEEN 1 AND 5),
  has_5g INTEGER,
  connector TEXT,
  highlights TEXT NOT NULL DEFAULT '[]',
  colors TEXT NOT NULL DEFAULT '[]',
  warranty_months INTEGER,
  is_demo INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

CREATE TABLE IF NOT EXISTS compatibilities (
  accessory_id TEXT NOT NULL REFERENCES products(id),
  phone_id TEXT NOT NULL REFERENCES products(id),
  note TEXT,
  PRIMARY KEY (accessory_id, phone_id)
);

CREATE TABLE IF NOT EXISTS orders (
  code TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('pickup','delivery')),
  address TEXT,
  locality TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo','transferencia','addi','sistecredito')),
  status TEXT NOT NULL DEFAULT 'recibido',
  subtotal_cop INTEGER NOT NULL,
  delivery_cost_cop INTEGER,
  notes TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL REFERENCES orders(code),
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  unit_price_cop INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_code);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
