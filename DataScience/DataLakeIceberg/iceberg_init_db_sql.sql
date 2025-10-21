-- Create sample databases and tables for demonstration

-- Create schemas
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS customers;
CREATE SCHEMA IF NOT EXISTS products;

-- Sales data
CREATE TABLE sales.orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10, 2),
    status VARCHAR(50),
    region VARCHAR(50)
);

CREATE TABLE sales.order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT,
    price DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES sales.orders(order_id)
);

-- Customer data
CREATE TABLE customers.customer_info (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address VARCHAR(500),
    city VARCHAR(100),
    country VARCHAR(100),
    signup_date DATE,
    customer_type VARCHAR(50)
);

CREATE TABLE customers.customer_activity (
    activity_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    last_purchase_date DATE,
    total_purchases INT,
    total_spent DECIMAL(12, 2),
    segment VARCHAR(50),
    FOREIGN KEY (customer_id) REFERENCES customers.customer_info(customer_id)
);

-- Product data
CREATE TABLE products.product_catalog (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(255),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    price DECIMAL(10, 2),
    stock_quantity INT,
    supplier_id INT,
    created_date DATE,
    last_updated DATE
);

CREATE TABLE products.product_reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating DECIMAL(3, 2),
    review_text TEXT,
    review_date DATE,
    helpful_count INT,
    FOREIGN KEY (product_id) REFERENCES products.product_catalog(product_id)
);

-- Insert sample data
INSERT INTO sales.orders (customer_id, product_id, amount, status, region) VALUES
(1, 101, 299.99, 'completed', 'North America'),
(2, 102, 149.99, 'completed', 'Europe'),
(3, 103, 450.00, 'pending', 'Asia'),
(1, 104, 199.99, 'completed', 'North America'),
(4, 105, 89.99, 'completed', 'South America'),
(5, 106, 599.99, 'pending', 'Europe'),
(2, 107, 249.99, 'completed', 'Europe'),
(3, 108, 349.99, 'completed', 'Asia'),
(6, 109, 799.99, 'cancelled', 'North America'),
(7, 110, 199.99, 'completed', 'Africa');

INSERT INTO customers.customer_info (name, email, phone, city, country, signup_date, customer_type) VALUES
('John Smith', 'john.smith@email.com', '+1-555-0101', 'New York', 'USA', '2023-01-15', 'Premium'),
('Jane Doe', 'jane.doe@email.com', '+1-555-0102', 'Los Angeles', 'USA', '2023-02-20', 'Standard'),
('Bob Johnson', 'bob.johnson@email.com', '+44-20-7946', 'London', 'UK', '2023-03-10', 'Premium'),
('Alice Williams', 'alice.williams@email.com', '+33-1-42-68', 'Paris', 'France', '2023-04-05', 'Standard'),
('Charlie Brown', 'charlie.brown@email.com', '+81-3-1234', 'Tokyo', 'Japan', '2023-05-12', 'Standard');

INSERT INTO customers.customer_activity (customer_id, last_purchase_date, total_purchases, total_spent, segment) VALUES
(1, '2024-01-10', 5, 1250.00, 'High Value'),
(2, '2024-01-08', 3, 650.00, 'Medium'),
(3, '2024-01-05', 2, 500.00, 'Low'),
(4, '2024-01-12', 1, 89.99, 'New'),
(5, '2024-01-09', 4, 2100.00, 'High Value');

INSERT INTO products.product_catalog (product_name, category, subcategory, price, stock_quantity, supplier_id, created_date) VALUES
('Laptop Pro', 'Electronics', 'Computers', 1299.99, 45, 1, '2023-06-01'),
('Wireless Mouse', 'Electronics', 'Accessories', 29.99, 200, 2, '2023-06-15'),
('USB-C Cable', 'Electronics', 'Cables', 12.99, 500, 3, '2023-07-01'),
('Monitor 4K', 'Electronics', 'Displays', 399.99, 30, 1, '2023-07-15'),
('Mechanical Keyboard', 'Electronics', 'Peripherals', 149.99, 75, 2, '2023-08-01'),
('Webcam HD', 'Electronics', 'Accessories', 79.99, 120, 4, '2023-08-15'),
('Headphones Pro', 'Electronics', 'Audio', 299.99, 60, 3, '2023-09-01'),
('SSD Storage', 'Electronics', 'Storage', 199.99, 90, 5, '2023-09-15'),
('Monitor Stand', 'Electronics', 'Accessories', 49.99, 150, 2, '2023-10-01'),
('Laptop Stand', 'Electronics', 'Accessories', 39.99, 180, 4, '2023-10-15');

-- Create indexes for performance
CREATE INDEX idx_orders_customer_id ON sales.orders(customer_id);
CREATE INDEX idx_orders_status ON sales.orders(status);
CREATE INDEX idx_orders_date ON sales.orders(order_date);
CREATE INDEX idx_customer_email ON customers.customer_info(email);
CREATE INDEX idx_product_category ON products.product_catalog(category);
CREATE INDEX idx_product_reviews_rating ON products.product_reviews(rating);

-- Create views for common queries
CREATE OR REPLACE VIEW sales.vw_order_summary AS
SELECT 
    o.order_id,
    o.customer_id,
    c.name AS customer_name,
    p.product_name,
    o.amount,
    o.status,
    o.region,
    o.order_date
FROM sales.orders o
JOIN customers.customer_info c ON o.customer_id = c.customer_id
JOIN products.product_catalog p ON o.product_id = p.product_id;

CREATE OR REPLACE VIEW sales.vw_revenue_by_region AS
SELECT 
    region,
    COUNT(*) as total_orders,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_order_value
FROM sales.orders
WHERE status = 'completed'
GROUP BY region;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sales TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA customers TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA products TO admin;