from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String, Numeric
from sqlalchemy.orm import declarative_base, sessionmaker
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
import os
import time

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@db:5432/appdb")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    product = Column(String(255), nullable=False, index=True)
    price = Column(Numeric(12,2), nullable=False)
    cart = Column(String(64), nullable=True, index=True)
    qty = Column(Integer, nullable=False, default=1)

Base.metadata.create_all(bind=engine)

class ItemCreate(BaseModel):
    product: str = Field(min_length=1)
    price: float = Field(ge=0)
    cart: Optional[str] = None
    qty: int = Field(ge=1, default=1)

class ItemUpdate(BaseModel):
    product: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    cart: Optional[str] = None
    qty: Optional[int] = Field(default=None, ge=1)

class ItemOut(BaseModel):
    id: int
    product: str
    price: float
    cart: Optional[str] = None
    qty: int

    class Config:
        from_attributes = True

# Prometheus metrics
http_requests_total = Counter(
    'http_requests_total', 
    'Total HTTP requests', 
    ['method', 'endpoint', 'status_code']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds', 
    'HTTP request duration in seconds', 
    ['method', 'endpoint']
)

db_operations_total = Counter(
    'db_operations_total', 
    'Total database operations', 
    ['operation', 'table']
)

items_created_total = Counter(
    'items_created_total', 
    'Total items created', 
    ['product_type']
)

active_requests = Gauge(
    'active_requests', 
    'Number of active HTTP requests'
)

app = FastAPI(title="Demo FastAPI + OTEL")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_credentials=True,
    allow_methods=["*"]
)

@app.middleware("http")
async def add_metrics_middleware(request: Request, call_next):
    start_time = time.time()
    active_requests.inc()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    # Record metrics
    http_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status_code=str(response.status_code)
    ).inc()
    
    http_request_duration_seconds.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    active_requests.dec()
    
    return response

@app.get("/metrics")
def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/items", response_model=ItemOut)
def create_item(payload: ItemCreate):
    with SessionLocal() as db:
        # Track database operation
        db_operations_total.labels(operation="create", table="items").inc()
        
        item = Item(
            product=payload.product, 
            price=payload.price, 
            cart=payload.cart, 
            qty=payload.qty
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        
        # Track item creation by product type
        items_created_total.labels(product_type=payload.product).inc()
        
        return item

@app.get("/items", response_model=List[ItemOut])
def list_items(cart: Optional[str] = None):
    with SessionLocal() as db:
        # Track database operation
        db_operations_total.labels(operation="read", table="items").inc()
        
        q = db.query(Item)
        if cart:
            q = q.filter(Item.cart == cart)
        return q.order_by(Item.id.desc()).all()

@app.get("/items/{item_id}", response_model=ItemOut)
def get_item(item_id: int):
    with SessionLocal() as db:
        # Track database operation
        db_operations_total.labels(operation="read", table="items").inc()
        
        item = db.get(Item, item_id)
        if not item:
            raise HTTPException(404, "Item not found")
        return item

@app.put("/items/{item_id}", response_model=ItemOut)
def update_item(item_id: int, payload: ItemUpdate):
    with SessionLocal() as db:
        # Track database operation
        db_operations_total.labels(operation="update", table="items").inc()
        
        item = db.get(Item, item_id)
        if not item:
            raise HTTPException(404, "Item not found")
        if payload.product is not None: 
            item.product = payload.product
        if payload.price is not None: 
            item.price = payload.price
        if payload.cart is not None: 
            item.cart = payload.cart
        if payload.qty is not None: 
            item.qty = payload.qty
        db.commit()
        db.refresh(item)
        return item

@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    with SessionLocal() as db:
        # Track database operation
        db_operations_total.labels(operation="delete", table="items").inc()
        
        item = db.get(Item, item_id)
        if not item:
            raise HTTPException(404, "Item not found")
        db.delete(item)
        db.commit()
        return {"deleted": item_id}