docker-compose.yml
================

version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: postgres
    environment:
      POSTGRES_DB: shopdb
      POSTGRES_USER: shopuser
      POSTGRES_PASSWORD: shoppass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - shop-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U shopuser -d shopdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  # FastAPI Backend
  backend:
    build: ./backend
    container_name: fastapi-backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://shopuser:shoppass@postgres:5432/shopdb
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4317
      OTEL_SERVICE_NAME: fastapi-backend
      OTEL_METRICS_EXPORTER: otlp
      OTEL_TRACES_EXPORTER: otlp
    depends_on:
      postgres:
        condition: service_healthy
      otel-collector:
        condition: service_started
    networks:
      - shop-network
    volumes:
      - ./backend:/app

  # Frontend
  frontend:
    build: ./frontend
    container_name: frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - shop-network

  # OpenTelemetry Collector
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    container_name: otel-collector
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC receiver
      - "4318:4318"   # OTLP HTTP receiver
      - "8888:8888"   # Prometheus metrics
    networks:
      - shop-network

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - shop-network

  # Tempo for traces
  tempo:
    image: grafana/tempo:latest
    container_name: tempo
    command: [ "-config.file=/etc/tempo.yaml" ]
    volumes:
      - ./tempo.yaml:/etc/tempo.yaml
      - tempo_data:/tmp/tempo
    ports:
      - "3200:3200"   # tempo
      - "4317"        # otlp grpc
    networks:
      - shop-network

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_SECURITY_ADMIN_USER=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana-datasources.yaml:/etc/grafana/provisioning/datasources/datasources.yaml
    depends_on:
      - prometheus
      - tempo
    networks:
      - shop-network

networks:
  shop-network:
    driver: bridge

volumes:
  postgres_data:
  prometheus_data:
  tempo_data:
  grafana_data:

================

backend/Dockerfile
==================

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

================

backend/requirements.txt
========================

fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pydantic==2.5.0
python-multipart==0.0.6
opentelemetry-api==1.21.0
opentelemetry-sdk==1.21.0
opentelemetry-instrumentation-fastapi==0.42b0
opentelemetry-instrumentation-sqlalchemy==0.42b0
opentelemetry-instrumentation-psycopg2==0.42b0
opentelemetry-exporter-otlp==1.21.0
opentelemetry-exporter-otlp-proto-grpc==1.21.0
prometheus-client==0.19.0

================

backend/main.py
===============

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime

# OpenTelemetry imports
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes

# Prometheus metrics
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi.responses import Response
import time

# Configure OpenTelemetry
resource = Resource(attributes={
    ResourceAttributes.SERVICE_NAME: "fastapi-backend",
    ResourceAttributes.SERVICE_VERSION: "1.0.0",
})

# Set up tracing
trace.set_tracer_provider(TracerProvider(resource=resource))
tracer = trace.get_tracer(__name__)

otlp_exporter = OTLPSpanExporter(
    endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317"),
    insecure=True,
)
span_processor = BatchSpanProcessor(otlp_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# Set up metrics
metric_reader = PeriodicExportingMetricReader(
    exporter=OTLPMetricExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317"),
        insecure=True,
    ),
    export_interval_millis=10000,
)
metrics.set_meter_provider(MeterProvider(resource=resource, metric_readers=[metric_reader]))
meter = metrics.get_meter(__name__)

# Create custom metrics
request_counter = meter.create_counter(
    name="http_requests_total",
    description="Total number of HTTP requests",
    unit="1",
)

request_duration = meter.create_histogram(
    name="http_request_duration_seconds",
    description="HTTP request latency",
    unit="s",
)

active_carts = meter.create_up_down_counter(
    name="active_carts",
    description="Number of active shopping carts",
    unit="1",
)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://shopuser:shoppass@postgres:5432/shopdb")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Instrument SQLAlchemy
SQLAlchemyInstrumentor().instrument(
    engine=engine,
    service="fastapi-backend",
)

# Models
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    quantity = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Cart(Base):
    __tablename__ = "carts"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer)
    product_name = Column(String)
    price = Column(Float)
    quantity = Column(Integer)
    total = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class ProductBase(BaseModel):
    name: str
    price: float
    quantity: int

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    name: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CartBase(BaseModel):
    product_id: int
    quantity: int

class CartCreate(CartBase):
    pass

class CartResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    price: float
    quantity: int
    total: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# FastAPI app
app = FastAPI(title="Shop API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instrument FastAPI
FastAPIInstrumentor.instrument_app(app)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Middleware for metrics
@app.middleware("http")
async def track_metrics(request, call_next):
    start_time = time.time()
    
    with tracer.start_as_current_span(f"{request.method} {request.url.path}") as span:
        span.set_attribute("http.method", request.method)
        span.set_attribute("http.url", str(request.url))
        
        response = await call_next(request)
        
        duration = time.time() - start_time
        
        span.set_attribute("http.status_code", response.status_code)
        
        # Record metrics
        request_counter.add(1, {"method": request.method, "endpoint": request.url.path, "status": response.status_code})
        request_duration.record(duration, {"method": request.method, "endpoint": request.url.path})
        
        return response

# Routes

@app.get("/")
def read_root():
    return {"message": "Shop API is running"}

@app.get("/metrics")
def get_metrics():
    return Response(content=generate_latest(), media_type="text/plain")

# Product endpoints
@app.post("/api/products", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("create_product"):
        db_product = Product(**product.dict())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product

@app.get("/api/products", response_model=List[ProductResponse])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("read_products"):
        products = db.query(Product).offset(skip).limit(limit).all()
        return products

@app.get("/api/products/{product_id}", response_model=ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("read_product"):
        product = db.query(Product).filter(Product.id == product_id).first()
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

@app.put("/api/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("update_product"):
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if db_product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        
        update_data = product.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_product, field, value)
        
        db_product.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_product)
        return db_product

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("delete_product"):
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if db_product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        db.delete(db_product)
        db.commit()
        return {"message": "Product deleted successfully"}

# Cart endpoints
@app.post("/api/cart", response_model=CartResponse)
def add_to_cart(cart_item: CartCreate, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("add_to_cart"):
        product = db.query(Product).filter(Product.id == cart_item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        if product.quantity < cart_item.quantity:
            raise HTTPException(status_code=400, detail="Insufficient product quantity")
        
        db_cart = Cart(
            product_id=cart_item.product_id,
            product_name=product.name,
            price=product.price,
            quantity=cart_item.quantity,
            total=product.price * cart_item.quantity
        )
        
        # Update product quantity
        product.quantity -= cart_item.quantity
        
        db.add(db_cart)
        db.commit()
        db.refresh(db_cart)
        
        active_carts.add(1)
        
        return db_cart

@app.get("/api/cart", response_model=List[CartResponse])
def read_cart(db: Session = Depends(get_db)):
    with tracer.start_as_current_span("read_cart"):
        cart_items = db.query(Cart).all()
        return cart_items

@app.delete("/api/cart/{cart_id}")
def remove_from_cart(cart_id: int, db: Session = Depends(get_db)):
    with tracer.start_as_current_span("remove_from_cart"):
        cart_item = db.query(Cart).filter(Cart.id == cart_id).first()
        if not cart_item:
            raise HTTPException(status_code=404, detail="Cart item not found")
        
        # Restore product quantity
        product = db.query(Product).filter(Product.id == cart_item.product_id).first()
        if product:
            product.quantity += cart_item.quantity
        
        db.delete(cart_item)
        db.commit()
        
        active_carts.add(-1)
        
        return {"message": "Item removed from cart"}

@app.delete("/api/cart")
def clear_cart(db: Session = Depends(get_db)):
    with tracer.start_as_current_span("clear_cart"):
        cart_items = db.query(Cart).all()
        
        for item in cart_items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.quantity += item.quantity
        
        db.query(Cart).delete()
        db.commit()
        
        active_carts.add(-len(cart_items))
        
        return {"message": "Cart cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

================

frontend/Dockerfile
===================

FROM nginx:alpine

COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/

EXPOSE 80

================

frontend/index.html
===================

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shop Management System</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Shop Management System</h1>
        
        <!-- Product Management Section -->
        <div class="section">
            <h2>Product Management</h2>
            
            <div class="form-container">
                <h3>Add/Update Product</h3>
                <form id="productForm">
                    <input type="hidden" id="productId">
                    <div class="form-group">
                        <label for="productName">Product Name:</label>
                        <input type="text" id="productName" required>
                    </div>
                    <div class="form-group">
                        <label for="productPrice">Price:</label>
                        <input type="number" id="productPrice" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="productQty">Quantity:</label>
                        <input type="number" id="productQty" required>
                    </div>
                    <div class="button-group">
                        <button type="submit" class="btn btn-primary">Save Product</button>
                        <button type="button" class="btn btn-secondary" onclick="clearProductForm()">Clear</button>
                    </div>
                </form>
            </div>
            
            <div class="table-container">
                <h3>Products</h3>
                <table id="productsTable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        
        <!-- Cart Section -->
        <div class="section">
            <h2>Shopping Cart</h2>
            
            <div class="form-container">
                <h3>Add to Cart</h3>
                <form id="cartForm">
                    <div class="form-group">
                        <label for="cartProductId">Product ID:</label>
                        <input type="number" id="cartProductId" required>
                    </div>
                    <div class="form-group">
                        <label for="cartQty">Quantity:</label>
                        <input type="number" id="cartQty" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Add to Cart</button>
                </form>
            </div>
            
            <div class="table-container">
                <h3>Cart Items</h3>
                <table id="cartTable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
                <div class="cart-total">
                    <strong>Total: $<span id="cartTotal">0.00</span></strong>
                    <button class="btn btn-danger" onclick="clearCart()">Clear Cart</button>
                </div>
            </div>
        </div>
    </div>
    
    <script src="script.js"></script>
</body>
</html>

================

frontend/styles.css
===================

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    padding: 20px;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    background-color: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

h1 {
    color: #333;
    margin-bottom: 30px;
    text-align: center;
}

h2 {
    color: #444;
    margin-bottom: 20px;
    border-bottom: 2px solid #4CAF50;
    padding-bottom: 10px;
}

h3 {
    color: #555;
    margin-bottom: 15px;
}

.section {
    margin-bottom: 40px;
}

.form-container {
    background-color: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 30px;
}

.form-group {
    margin-bottom: 15px;
}

label {
    display: block;
    margin-bottom: 5px;
    color: #666;
    font-weight: bold;
}

input[type="text"],
input[type="number"] {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.button-group {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
}

.btn-primary {
    background-color: #4CAF50;
    color: white;
}

.btn-primary:hover {
    background-color: #45a049;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background-color: #5a6268;
}

.btn-danger {
    background-color: #dc3545;
    color: white;
}

.btn-danger:hover {
    background-color: #c82333;
}

.btn-warning {
    background-color: #ffc107;
    color: #212529;
}

.btn-warning:hover {
    background-color: #e0a800;
}

.table-container {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

thead {
    background-color: #4CAF50;
    color: white;
}

th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

tbody tr:hover {
    background-color: #f5f5f5;
}

.action-buttons {
    display: flex;
    gap: 5px;
}

.action-buttons button {
    padding: 5px 10px;
    font-size: 12px;
}

.cart-total {
    margin-top: 20px;
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cart-total strong {
    font-size: 18px;
    color: #333;
}

================

frontend/script.js
==================

const API_BASE_URL = 'http://localhost:8000/api';

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCart();
});

// Product form submission
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const productData = {
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        quantity: parseInt(document.getElementById('productQty').value)
    };
    
    try {
        let response;
        if (productId) {
            // Update existing product
            response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData)
            });
        } else {
            // Create new product
            response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData)
            });
        }
        
        if (response.ok) {
            clearProductForm();
            loadProducts();
            alert(productId ? 'Product updated successfully!' : 'Product added successfully!');
        } else {
            alert('Error saving product');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving product');
    }
});

// Cart form submission
document.getElementById('cartForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cartData = {
        product_id: parseInt(document.getElementById('cartProductId').value),
        quantity: parseInt(document.getElementById('cartQty').value)
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cartData)
        });
        
        if (response.ok) {
            document.getElementById('cartForm').reset();
            loadCart();
            loadProducts(); // Reload products to update quantities
            alert('Added to cart successfully!');
        } else {
            const error = await response.json();
            alert(error.detail || 'Error adding to cart');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error adding to cart');
    }
});

// Load products
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        const products = await response.json();
        
        const tbody = document.querySelector('#productsTable tbody');
        tbody.innerHTML = '';
        
        products.forEach(product => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.quantity}</td>
                <td class="action-buttons">
                    <button class="btn btn-warning" onclick="editProduct(${product.id}, '${product.name}', ${product.price}, ${product.quantity})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
                </td>
            `;
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load cart
async function loadCart() {
    try {
        const response = await fetch(`${API_BASE_URL}/cart`);
        const cartItems = await response.json();
        
        const tbody = document.querySelector('#cartTable tbody');
        tbody.innerHTML = '';
        
        let total = 0;
        
        cartItems.forEach(item => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.product_name}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>$${item.total.toFixed(2)}</td>
                <td class="action-buttons">
                    <button class="btn btn-danger" onclick="removeFromCart(${item.id})">Remove</button>
                </td>
            `;
            total += item.total;
        });
        
        document.getElementById('cartTotal').textContent = total.toFixed(2);
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

// Edit product
function editProduct(id, name, price, quantity) {
    document.getElementById('productId').value = id;
    document.getElementById('productName').value = name;
    document.getElementById('productPrice').value = price;
    document.getElementById('productQty').value = quantity;
}

// Delete product
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadProducts();
            alert('Product deleted successfully!');
        } else {
            alert('Error deleting product');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting product');
    }
}

// Remove from cart
async function removeFromCart(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/cart/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadCart();
            loadProducts(); // Reload products to update quantities
            alert('Item removed from cart!');
        } else {
            alert('Error removing item from cart');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error removing item from cart');
    }
}

// Clear cart
async function clearCart() {
    if (!confirm('Are you sure you want to clear the entire cart?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadCart();
            loadProducts(); // Reload products to update quantities
            alert('Cart cleared successfully!');
        } else {
            alert('Error clearing cart');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error clearing cart');
    }
}

// Clear product form
function clearProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
}

================

init.sql
========

-- Initial database setup
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample products
INSERT INTO products (name, price, quantity) VALUES
    ('Laptop', 999.99, 10),
    ('Mouse', 29.99, 50),
    ('Keyboard', 79.99, 30),
    ('Monitor', 299.99, 15),
    ('Headphones', 149.99, 25);

================

otel-collector-config.yaml
===========================

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

exporters:
  prometheus:
    endpoint: "0.0.0.0:8888"
    const_labels:
      environment: "production"
    
  otlp/tempo:
    endpoint: tempo:4317
    tls:
      insecure: true

  logging:
    loglevel: debug

processors:
  batch:
    timeout: 10s
  
  memory_limiter:
    check_interval: 1s
    limit_percentage: 75
    spike_limit_percentage: 25
  
  resource:
    attributes:
      - key: environment
        value: production
        action: insert

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [otlp/tempo, logging]
    
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [prometheus, logging]

================

prometheus.yml
==============

global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'otel-collector'
    static_configs:
      - targets: ['otel-collector:8888']
  
  - job_name: 'fastapi'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: /metrics

================

tempo.yaml
==========

server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: 0.0.0.0:4317

ingester:
  trace_idle_period: 10s
  max_block_bytes: 1_000_000
  max_block_duration: 5m

compactor:
  compaction:
    compaction_window: 1h
    max_block_bytes: 100_000_000
    block_retention: 1h
    compacted_block_retention: 10m

storage:
  trace:
    backend: local
    block:
      bloom_filter_false_positive: .05
      index_downsample_bytes: 1000
      encoding: zstd
    wal:
      path: /tmp/tempo/wal
      encoding: none
    local:
      path: /tmp/tempo/blocks
    pool:
      max_workers: 100
      queue_depth: 10000

================

grafana-datasources.yaml
========================

apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    
  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    editable: true
    jsonData:
      nodeGraph:
        enabled: true
      tracesToLogs:
        datasourceUid: 'loki'
        filterByTraceID: false
        filterBySpanID: false

================

grafana-dashboards/dashboard.json
==================================

{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": 1,
  "links": [],
  "panels": [
    {
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "short"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "id": 2,
      "options": {
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showThresholdLabels": false,
        "showThresholdMarkers": true,
        "text": {}
      },
      "pluginVersion": "8.0.0",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total[5m]))",
          "refId": "A"
        }
      ],
      "title": "Request Rate",
      "type": "gauge"
    },
    {
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "line",
            "fillOpacity": 10,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "never",
            "spanNulls": true,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 0
      },
      "id": 3,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom"
        },
        "tooltip": {
          "mode": "single"
        }
      },
      "pluginVersion": "8.0.0",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
          "legendFormat": "95th percentile",
          "refId": "A"
        },
        {
          "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
          "legendFormat": "50th percentile",
          "refId": "B"
        }
      ],
      "title": "Request Duration",
      "type": "timeseries"
    },
    {
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              }
            ]
          },
          "unit": "short"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 8
      },
      "id": 4,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "text": {},
        "textMode": "auto"
      },
      "pluginVersion": "8.0.0",
      "targets": [
        {
          "expr": "sum(active_carts)",
          "refId": "A"
        }
      ],
      "title": "Active Carts",
      "type": "stat"
    },
    {
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "drawStyle": "bars",
            "fillOpacity": 100,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "never",
            "spanNulls": true,
            "stacking": {
              "group": "A",
              "mode": "normal"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              }
            ]
          },
          "unit": "short"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 8
      },
      "id": 5,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom"
        },
        "tooltip": {
          "mode": "single"
        }
      },
      "pluginVersion": "8.0.0",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total[5m])) by (endpoint)",
          "legendFormat": "{{endpoint}}",
          "refId": "A"
        }
      ],
      "title": "Requests by Endpoint",
      "type": "timeseries"
    }
  ],
  "refresh": "5s",
  "schemaVersion": 27,
  "style": "dark",
  "tags": ["opentelemetry", "fastapi"],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-1h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "Shop Monitoring Dashboard",
  "uid": "shop-monitoring",
  "version": 1
}

================

README.md
=========

# Shop Management System with OpenTelemetry

A complete microservices application with FastAPI backend, PostgreSQL database, web frontend, and comprehensive observability using OpenTelemetry and Grafana.

## Architecture

- **Backend**: FastAPI with SQLAlchemy ORM
- **Database**: PostgreSQL
- **Frontend**: HTML/CSS/JavaScript served via Nginx
- **Observability Stack**:
  - OpenTelemetry Collector
  - Prometheus (metrics)
  - Tempo (traces)
  - Grafana (visualization)

## Features

- Full CRUD operations for products and shopping cart
- Real-time inventory tracking
- Complete observability with metrics and distributed tracing
- Auto-instrumentation of FastAPI and SQLAlchemy
- Custom metrics for business logic
- Pre-configured Grafana dashboards

## Quick Start

1. Clone the repository and ensure all files are in place

2. Start all services:
```bash
docker-compose up -d
```

3. Access the applications:
- **Frontend**: http://localhost
- **FastAPI Backend**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090

## Project Structure

```
.
├── docker-compose.yml
├── init.sql
├── otel-collector-config.yaml
├── prometheus.yml
├── tempo.yaml
├── grafana-datasources.yaml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── grafana-dashboards/
    └── dashboard.json
```

## Monitoring

The application automatically collects:

### Metrics
- HTTP request rate
- Request duration (latency)
- Active shopping carts
- Request count by endpoint
- Database query performance

### Traces
- End-to-end request tracing
- Database query spans
- Service dependencies
- Error tracking

## API Endpoints

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `GET /api/products/{id}` - Get product by ID
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Cart
- `GET /api/cart` - View cart items
- `POST /api/cart` - Add item to cart
- `DELETE /api/cart/{id}` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

## Configuration

### Environment Variables

Backend service:
- `DATABASE_URL`: PostgreSQL connection string
- `OTEL_EXPORTER_OTLP_ENDPOINT`: OpenTelemetry collector endpoint
- `OTEL_SERVICE_NAME`: Service name for tracing

### Grafana Setup

1. Login to Grafana (http://localhost:3000)
2. Default credentials: admin/admin
3. Data sources are automatically configured
4. Import the dashboard from the provisioning folder

## Development

To modify the application:

1. Backend changes: Edit `backend/main.py` and restart the container
2. Frontend changes: Edit files in `frontend/` and restart nginx container
3. Add new metrics: Update the OpenTelemetry configuration in `main.py`
4. Modify dashboards: Edit `grafana-dashboards/dashboard.json`

## Troubleshooting

1. If containers fail to start, check logs:
```bash
docker-compose logs [service-name]
```

2. Verify all services are healthy:
```bash
docker-compose ps
```

3. Reset the entire stack:
```bash
docker-compose down -v
docker-compose up -d
```

## License

MIT