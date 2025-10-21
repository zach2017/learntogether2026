{
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Apache Iceberg Data Lake - Practical Examples\n",
    "## Working with PyIceberg and Trino"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 1. Setup and Connection"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Import required libraries\n",
    "from pyiceberg.catalog import load_catalog\n",
    "import pandas as pd\n",
    "import numpy as np\n",
    "from datetime import datetime, timedelta\n",
    "import requests\n",
    "import json\n",
    "\n",
    "# Initialize Iceberg Catalog\n",
    "catalog = load_catalog(\n",
    "    'default',\n",
    "    warehouse='/warehouse',\n",
    "    uri='thrift://hive-metastore:9083'\n",
    ")\n",
    "\n",
    "print(\"Catalog initialized successfully!\")\n",
    "print(f\"Available namespaces: {catalog.list_namespaces()}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 2. Load Data from PostgreSQL via API"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Load orders data from PostgreSQL\n",
    "load_response = requests.post(\n",
    "    'http://python-api:5000/api/v1/load/postgres',\n",
    "    json={\n",
    "        'host': 'postgres',\n",
    "        'database': 'source_db',\n",
    "        'user': 'admin',\n",
    "        'password': 'admin123',\n",
    "        'query': 'SELECT * FROM sales.orders',\n",
    "        'table_name': 'orders',\n",
    "        'namespace': 'commerce'\n",
    "    }\n",
    ")\n",
    "\n",
    "result = load_response.json()\n",
    "print(f\"Load Status: {result['status']}\")\n",
    "print(f\"Rows Loaded: {result.get('rows_loaded', 'N/A')}\")\n",
    "print(f\"Columns: {result.get('columns', [])}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 3. Load Data from S3"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Load customers data from S3\n",
    "s3_load = requests.post(\n",
    "    'http://python-api:5000/api/v1/load/s3',\n",
    "    json={\n",
    "        'bucket': 'datalake',\n",
    "        'key': 'input/sample_customers.csv',\n",
    "        'format': 'csv',\n",
    "        'table_name': 'customers',\n",
    "        'namespace': 'commerce'\n",
    "    }\n",
    ")\n",
    "\n",
    "s3_result = s3_load.json()\n",
    "print(f\"S3 Load Status: {s3_result['status']}\")\n",
    "print(f\"Source: {s3_result.get('s3_source', 'N/A')}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 4. Query Loaded Data"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Load and display orders\n",
    "orders_table = catalog.load_table('commerce.orders')\n",
    "orders_df = orders_table.to_pandas()\n",
    "\n",
    "print(f\"Orders Table Statistics:\")\n",
    "print(f\"  Total Rows: {len(orders_df)}\")\n",
    "print(f\"  Columns: {list(orders_df.columns)}\")\n",
    "print(f\"\\nFirst 5 rows:\")\n",
    "print(orders_df.head())\n",
    "print(f\"\\nData types:\")\n",
    "print(orders_df.dtypes)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 5. Data Analysis"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Load both tables\n",
    "customers_df = catalog.load_table('commerce.customers').to_pandas()\n",
    "\n",
    "# Merge tables\n",
    "merged = orders_df.merge(customers_df, on='customer_id', how='left')\n",
    "\n",
    "# Analysis\n",
    "print(\"Sales Analysis:\")\n",
    "print(f\"Total Orders: {len(orders_df)}\")\n",
    "print(f\"Unique Customers: {orders_df['customer_id'].nunique()}\")\n",
    "print(f\"Total Revenue: ${orders_df['amount'].sum():.2f}\")\n",
    "print(f\"Average Order Value: ${orders_df['amount'].mean():.2f}\")\n",
    "\n",
    "print(\"\\nRevenue by Status:\")\n",
    "status_summary = orders_df.groupby('status')['amount'].agg(['count', 'sum', 'mean'])\n",
    "print(status_summary)\n",
    "\n",
    "print(\"\\nRevenue by Region:\")\n",
    "region_summary = orders_df.groupby('region')['amount'].agg(['count', 'sum', 'mean'])\n",
    "print(region_summary)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 6. Get Table Metadata"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Retrieve metadata via API\n",
    "metadata_response = requests.get(\n",
    "    'http://python-api:5000/api/v1/tables/commerce/orders/metadata'\n",
    ")\n",
    "\n",
    "metadata = metadata_response.json()\n",
    "print(\"Table Metadata:\")\n",
    "for key, value in metadata.items():\n",
    "    print(f\"  {key}: {value}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 7. Web Scraping Example"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Scrape web data\n",
    "scrape_response = requests.post(\n",
    "    'http://python-api:5000/api/v1/scrape',\n",
    "    json={\n",
    "        'url': 'https://en.wikipedia.org/wiki/List_of_countries_by_population',\n",
    "        'selector': 'table.wikitable',\n",
    "        'table_name': 'world_population',\n",
    "        'namespace': 'public_data'\n",
    "    }\n",
    ")\n",
    "\n",
    "scrape_result = scrape_response.json()\n",
    "print(f\"Web Scraping Result:\")\n",
    "print(f\"  Status: {scrape_result['status']}\")\n",
    "print(f\"  Rows Scraped: {scrape_result.get('rows_scraped', 'N/A')}\")\n",
    "print(f\"  Source: {scrape_result.get('source_url', 'N/A')}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 8. List All Tables"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# List tables in namespace\n",
    "list_response = requests.get('http://python-api:5000/api/v1/tables/commerce')\n",
    "tables = list_response.json()\n",
    "\n",
    "print(f\"Tables in 'commerce' namespace:\")\n",
    "for table in tables['tables']:\n",
    "    print(f\"  - {table}\")\n",
    "    \n",
    "print(f\"\\nTotal: {tables['count']} tables\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 9. Data Migration"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Migrate table to production namespace\n",
    "migrate_response = requests.post(\n",
    "    'http://python-api:5000/api/v1/migrate',\n",
    "    json={\n",
    "        'source_namespace': 'commerce',\n",
    "        'source_table': 'orders',\n",
    "        'dest_namespace': 'production',\n",
    "        'dest_table': 'orders'\n",
    "    }\n",
    ")\n",
    "\n",
    "migration = migrate_response.json()\n",
    "print(f\"Migration Result:\")\n",
    "print(f\"  Status: {migration['status']}\")\n",
    "print(f\"  Source: {migration.get('source', 'N/A')}\")\n",
    "print(f\"  Destination: {migration.get('destination', 'N/A')}\")\n",
    "print(f\"  Rows Migrated: {migration.get('rows_migrated', 'N/A')}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 10. Create Derived Tables"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Create aggregated summary table\n",
    "summary_data = orders_df.groupby(['customer_id', 'region']).agg({\n",
    "    'amount': ['sum', 'count', 'mean'],\n",
    "    'status': lambda x: (x == 'completed').sum()\n",
    "}).reset_index()\n",
    "\n",
    "summary_data.columns = ['customer_id', 'region', 'total_amount', 'order_count', 'avg_amount', 'completed_orders']\n",
    "\n",
    "# Write to Iceberg\n",
    "import pyarrow as pa\n",
    "table = pa.Table.from_pandas(summary_data)\n",
    "\n",
    "# Note: In production, use proper Iceberg write API\n",
    "print(f\"Summary Table (first 5 rows):\")\n",
    "print(summary_data.head())\n",
    "print(f\"\\nTotal summary rows: {len(summary_data)}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 11. Time-Travel Example (Query Historical Data)"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Get table snapshots/history\n",
    "orders_table = catalog.load_table('commerce.orders')\n",
    "\n",
    "print(\"Table History:\")\n",
    "for snapshot in orders_table.history():\n",
    "    print(f\"  Snapshot ID: {snapshot.snapshot_id}\")\n",
    "    print(f\"  Timestamp: {snapshot.timestamp_ms}\")\n",
    "    print(f\"  Operation: {snapshot.operation}\")\n",
    "    print()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 12. Performance Comparison"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "import time\n",
    "\n",
    "# Query performance test\n",
    "start = time.time()\n",
    "orders = catalog.load_table('commerce.orders').to_pandas()\n",
    "time_pandas = time.time() - start\n",
    "\n",
    "# Pandas filtering\n",
    "start = time.time()\n",
    "filtered = orders[orders['amount'] > 200]\n",
    "time_filter = time.time() - start\n",
    "\n",
    "# Pandas aggregation\n",
    "start = time.time()\n",
    "result = orders.groupby('region')['amount'].sum()\n",
    "time_agg = time.time() - start\n",
    "\n",
    "print(\"Performance Metrics:\")\n",
    "print(f\"  Load from Iceberg: {time_pandas:.4f}s\")\n",
    "print(f\"  Filter operation: {time_filter:.4f}s\")\n",
    "print(f\"  Aggregation: {time_agg:.4f}s\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "## 13. Export Results"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Export analysis results\n",
    "summary_data.to_csv('/home/jovyan/work/analysis_summary.csv', index=False)\n",
    "summary_data.to_parquet('/home/jovyan/work/analysis_summary.parquet', index=False)\n",
    "\n",
    "# Export to JSON\n",
    "summary_json = summary_data.to_json(orient='records')\n",
    "with open('/home/jovyan/work/analysis_summary.json', 'w') as f:\n",
    "    f.write(summary_json)\n",
    "\n",
    "print(\"Results exported:\")\n",
    "print(\"  - analysis_summary.csv\")\n",
    "print(\"  - analysis_summary.parquet\")\n",
    "print(\"  - analysis_summary.json\")"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "name": "python",
   "version": "3.9.0"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 4
}