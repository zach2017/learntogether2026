Awesome brief! Here’s a small, production-ish stack you can run with `docker compose up -d`:

* **FastAPI backend** (CRUD for a single table: `items` with `product`, `price`, `cart`, `qty`)
* **Postgres** database
* **Nginx “frontend”** serving a simple HTML form + table UI
* **OpenTelemetry Collector (contrib)** to ingest:

  * app **traces & metrics** via OTLP
  * **container CPU/mem** via `docker_stats` receiver
* **Prometheus** scraping metrics from the OTel Collector
* **Tempo** for traces
* **Grafana** pre-provisioned with Prometheus + Tempo (ready dashboards)

> Directory layout (create these files as shown)

```
fastapi-otel-demo/
├─ docker-compose.yml
├─ backend/
│  ├─ Dockerfile
│  ├─ requirements.txt
│  └─ app/
│     └─ main.py
├─ frontend/
│  ├─ Dockerfile
│  └─ html/
│     ├─ index.html
│     └─ app.js
├─ otel/
│  └─ otel-collector-config.yaml
├─ prometheus/
│  └─ prometheus.yml
├─ tempo/
│  └─ tempo.yaml
└─ grafana/
   └─ provisioning/
      ├─ datasources/
      │  └─ datasources.yml
      └─ dashboards/
         ├─ dashboards.yml
         └─ simple_app_overview.json
```

---

### 1) `docker-compose.yml`

```yaml
version: "3.9"

services:
  db:
    image: postgres:16
    container_name: demo_db
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - db_data:/var/lib/postgresql/data
    networks: [demo]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d appdb"]
      interval: 5s
      timeout: 3s
      retries: 10

  backend:
    build: ./backend
    container_name: demo_backend
    environment:
      DATABASE_URL: postgresql+psycopg2://postgres:postgres@db:5432/appdb
      OTEL_SERVICE_NAME: backend
      OTEL_RESOURCE_ATTRIBUTES: service.version=1.0.0,service.namespace=demo
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318
      OTEL_EXPORTER_OTLP_PROTOCOL: http/protobuf
      OTEL_METRICS_EXPORTER: otlp
      OTEL_TRACES_EXPORTER: otlp
    depends_on:
      db:
        condition: service_healthy
      otel-collector:
        condition: service_started
    ports:
      - "8000:8000"
    networks: [demo]
    command: >
      opentelemetry-instrument
      --metrics_exporter otlp
      --traces_exporter otlp
      uvicorn app.main:app --host 0.0.0.0 --port 8000

  frontend:
    build: ./frontend
    container_name: demo_frontend
    depends_on:
      - backend
    ports:
      - "8080:80"
    networks: [demo]

  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.102.0
    container_name: demo_otel_collector
    command: ["--config=/etc/otelcol-contrib/config.yaml"]
    volumes:
      - ./otel/otel-collector-config.yaml:/etc/otelcol-contrib/config.yaml:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "8889:8889"   # Prometheus exporter metrics endpoint
    networks: [demo]

  prometheus:
    image: prom/prometheus:v2.54.1
    container_name: demo_prometheus
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prom_data:/prometheus
    command: ["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.retention.time=3d"]
    ports:
      - "9090:9090"
    networks: [demo]
    depends_on:
      - otel-collector

  tempo:
    image: grafana/tempo:2.6.1
    container_name: demo_tempo
    command: ["-config.file=/etc/tempo.yaml"]
    volumes:
      - ./tempo/tempo.yaml:/etc/tempo.yaml:ro
      - tempo_data:/var/tempo
    ports:
      - "3200:3200" # http
      - "4317:4317" # otlp grpc (internal only; we won't publish)
    networks: [demo]
    depends_on:
      - otel-collector

  grafana:
    image: grafana/grafana:11.2.0
    container_name: demo_grafana
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3000:3000"
    networks: [demo]
    depends_on:
      - prometheus
      - tempo

networks:
  demo:

volumes:
  db_data:
  prom_data:
  tempo_data:
  grafana_data:
```

---

### 2) OpenTelemetry Collector config

`otel/otel-collector-config.yaml`

```yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:
  docker_stats:
    endpoint: unix:///var/run/docker.sock
    collection_interval: 15s
    timeout: 10s
    api_version: 1.24

processors:
  batch: {}
  memory_limiter:
    check_interval: 5s
    limit_mib: 400
    spike_limit_mib: 200
  resource:
    attributes:
      - key: deployment.environment
        value: local
        action: upsert

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
  otlp/tempo:
    endpoint: tempo:4317
    tls:
      insecure: true
  logging:
    loglevel: info

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [otlp/tempo, logging]
    metrics:
      receivers: [otlp, docker_stats]
      processors: [memory_limiter, batch, resource]
      exporters: [prometheus, logging]
```

---

### 3) Prometheus config

`prometheus/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: "otel-collector"
    static_configs:
      - targets: ["otel-collector:8889"]
```

---

### 4) Tempo config

`tempo/tempo.yaml`

```yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
        http:

storage:
  trace:
    backend: local
    wal:
      path: /var/tempo/wal
    local:
      path: /var/tempo/blocks
compactor:
  compaction:
    block_retention: 24h
```

---

### 5) Grafana provisioning

`grafana/provisioning/datasources/datasources.yml`

```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    jsonData:
      httpMethod: GET
      serviceMap:
        datasourceUid: prometheus
```

`grafana/provisioning/dashboards/dashboards.yml`

```yaml
apiVersion: 1
providers:
  - name: "Demo dashboards"
    folder: "Demo"
    type: file
    options:
      path: /etc/grafana/provisioning/dashboards
```

A tiny “overview” board (you can tweak later):
`grafana/provisioning/dashboards/simple_app_overview.json`

```json
{
  "id": null,
  "title": "Demo App Overview",
  "tags": ["demo", "otel"],
  "timezone": "browser",
  "schemaVersion": 39,
  "version": 1,
  "panels": [
    {
      "type": "graph",
      "title": "Container CPU % (docker_stats)",
      "targets": [
        {
          "expr": "rate(container_cpu_usage_seconds_total[1m]) * 100",
          "legendFormat": "{{container_label_com_docker_compose_service}}"
        }
      ],
      "gridPos": {"x":0,"y":0,"w":24,"h":8},
      "datasource": "Prometheus"
    },
    {
      "type": "graph",
      "title": "Container Memory (bytes)",
      "targets": [
        {
          "expr": "container_memory_rss",
          "legendFormat": "{{container_label_com_docker_compose_service}}"
        }
      ],
      "gridPos": {"x":0,"y":8,"w":24,"h":8},
      "datasource": "Prometheus"
    }
  ],
  "templating": {"list":[]}
}
```

---

### 6) FastAPI backend

`backend/requirements.txt`

```
fastapi==0.114.2
uvicorn[standard]==0.30.6
SQLAlchemy==2.0.35
psycopg2-binary==2.9.9
pydantic==2.9.2
python-dotenv==1.0.1
# OpenTelemetry
opentelemetry-distro==0.48b0
opentelemetry-exporter-otlp==1.27.0
opentelemetry-instrumentation-fastapi==0.48b0
opentelemetry-instrumentation-logging==0.48b0
opentelemetry-instrumentation-psycopg2==0.48b0
opentelemetry-instrumentation-requests==0.48b0
```

`backend/Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# System deps for psycopg2
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    opentelemetry-bootstrap -a install

COPY app ./app

EXPOSE 8000
CMD ["sh", "-c", "opentelemetry-instrument --metrics_exporter otlp --traces_exporter otlp uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

`backend/app/main.py`

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String, Numeric
from sqlalchemy.orm import declarative_base, sessionmaker
import os

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

app = FastAPI(title="Demo FastAPI + OTEL")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_credentials=True,
    allow_methods=["*"]
)

@app.get("/health")
def health():
    return {"status":"ok"}

@app.post("/items", response_model=ItemOut)
def create_item(payload: ItemCreate):
    with SessionLocal() as db:
        item = Item(product=payload.product, price=payload.price, cart=payload.cart, qty=payload.qty)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

@app.get("/items", response_model=List[ItemOut])
def list_items(cart: Optional[str] = None):
    with SessionLocal() as db:
        q = db.query(Item)
        if cart:
            q = q.filter(Item.cart == cart)
        return q.order_by(Item.id.desc()).all()

@app.get("/items/{item_id}", response_model=ItemOut)
def get_item(item_id: int):
    with SessionLocal() as db:
        item = db.get(Item, item_id)
        if not item:
            raise HTTPException(404, "Item not found")
        return item

@app.put("/items/{item_id}", response_model=ItemOut)
def update_item(item_id: int, payload: ItemUpdate):
    with SessionLocal() as db:
      item = db.get(Item, item_id)
      if not item:
          raise HTTPException(404, "Item not found")
      if payload.product is not None: item.product = payload.product
      if payload.price is not None: item.price = payload.price
      if payload.cart is not None: item.cart = payload.cart
      if payload.qty is not None: item.qty = payload.qty
      db.commit()
      db.refresh(item)
      return item

@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    with SessionLocal() as db:
        item = db.get(Item, item_id)
        if not item:
            raise HTTPException(404, "Item not found")
        db.delete(item)
        db.commit()
        return {"deleted": item_id}
```

---

### 7) Frontend (static HTML + fetch)

`frontend/Dockerfile`

```dockerfile
FROM nginx:1.27-alpine
COPY html/ /usr/share/nginx/html/
```

`frontend/html/index.html`

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Demo Shop</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <style>
    body { font-family: system-ui, Arial, sans-serif; margin: 2rem; }
    form, table { max-width: 800px; margin-bottom: 1rem; }
    input, button, select { padding: .5rem; margin:.25rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding:.5rem; }
    tr:nth-child(even){background:#f9f9f9}
    .row { display:flex; flex-wrap:wrap; gap:.5rem; align-items:center; }
  </style>
</head>
<body>
  <h1>Demo Shop (FastAPI + OpenTelemetry)</h1>

  <form id="itemForm">
    <div class="row">
      <input id="product" placeholder="Product" required />
      <input id="price" type="number" step="0.01" placeholder="Price" required />
      <input id="cart" placeholder="Cart (optional)" />
      <input id="qty" type="number" min="1" value="1" placeholder="Qty" required />
      <button type="submit">Add</button>
      <button type="button" id="refreshBtn">Refresh</button>
    </div>
  </form>

  <div class="row">
    <label>Filter by cart:</label>
    <input id="filterCart" placeholder="cart id"/>
    <button id="applyFilter">Apply</button>
    <button id="clearFilter">Clear</button>
  </div>

  <table id="itemsTable">
    <thead><tr><th>ID</th><th>Product</th><th>Price</th><th>Cart</th><th>Qty</th><th>Actions</th></tr></thead>
    <tbody></tbody>
  </table>

  <p>
    API: <code>http://localhost:8000</code> • Frontend: <code>http://localhost:8080</code> • Grafana: <code>http://localhost:3000</code> (admin/admin)
  </p>

<script src="app.js"></script>
</body>
</html>
```

`frontend/html/app.js`

```javascript
const API = 'http://localhost:8000';

const tbody = document.querySelector('#itemsTable tbody');
const form = document.getElementById('itemForm');
const refreshBtn = document.getElementById('refreshBtn');
const filterCart = document.getElementById('filterCart');
const applyFilter = document.getElementById('applyFilter');
const clearFilter = document.getElementById('clearFilter');

async function fetchItems() {
  const cart = filterCart.value ? `?cart=${encodeURIComponent(filterCart.value)}` : '';
  const res = await fetch(`${API}/items${cart}`);
  const items = await res.json();
  render(items);
}

function render(items) {
  tbody.innerHTML = '';
  items.forEach(i => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i.id}</td>
      <td><input value="${i.product}" data-field="product"/></td>
      <td><input type="number" step="0.01" value="${i.price}" data-field="price"/></td>
      <td><input value="${i.cart ?? ''}" data-field="cart"/></td>
      <td><input type="number" min="1" value="${i.qty}" data-field="qty"/></td>
      <td>
        <button data-action="update" data-id="${i.id}">Update</button>
        <button data-action="delete" data-id="${i.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const id = btn.getAttribute('data-id');
  const tr = btn.closest('tr');
  const inputs = tr.querySelectorAll('input[data-field]');
  const payload = {};
  inputs.forEach(inp => payload[inp.dataset.field] = inp.type === 'number' ? Number(inp.value) : inp.value);

  if (btn.dataset.action === 'update') {
    await fetch(`${API}/items/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    await fetchItems();
  } else if (btn.dataset.action === 'delete') {
    await fetch(`${API}/items/${id}`, { method: 'DELETE' });
    await fetchItems();
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    product: document.getElementById('product').value,
    price: Number(document.getElementById('price').value),
    cart: document.getElementById('cart').value || null,
    qty: Number(document.getElementById('qty').value)
  };
  await fetch(`${API}/items`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  form.reset();
  document.getElementById('qty').value = 1;
  await fetchItems();
});

refreshBtn.addEventListener('click', fetchItems);
applyFilter.addEventListener('click', fetchItems);
clearFilter.addEventListener('click', () => { filterCart.value=''; fetchItems(); });

fetchItems();
```

---

## Run it

1. Save the files, then:

```bash
docker compose up -d --build
```

2. Open:

* Frontend: **[http://localhost:8080](http://localhost:8080)**
* API (docs): **[http://localhost:8000/docs](http://localhost:8000/docs)**
* Grafana: **[http://localhost:3000](http://localhost:3000)** (login `admin` / `admin`)

  * Dashboards → “Demo” → “Demo App Overview”
  * Explore → **Tempo** to view traces
* Prometheus: **[http://localhost:9090](http://localhost:9090)** (optional)

---

## How observability is wired

* **Backend**: Auto-instrumented via `opentelemetry-instrument` → ships **traces + metrics** to **OTel Collector** (`http://otel-collector:4318`).
* **Collector**:

  * Receives app OTLP data
  * Pulls **container CPU/mem** via `docker_stats`
  * **Exports metrics** on `/metrics` (Prometheus format) at `:8889`
  * **Sends traces** to **Tempo**
* **Prometheus** scrapes OTel Collector → Grafana reads Prometheus
* **Tempo** stores traces → Grafana reads Tempo

> Want logs too? Add **Loki** and configure the Collector’s `filelog` receiver + Loki exporter.

---

