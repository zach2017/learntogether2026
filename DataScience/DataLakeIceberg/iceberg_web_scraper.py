#!/usr/bin/env python3
"""
Web Scraper Connector for Iceberg
Extracts data from various web sources and loads into data lake
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import pandas as pd
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WebScraperConnector:
    """Scrapes web data and loads into Iceberg"""
    
    def __init__(self, catalog_manager):
        self.catalog = catalog_manager
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def scrape_table_data(self, url: str, table_selector: str, 
                         table_name: str, namespace: str) -> Dict[str, Any]:
        """
        Scrape HTML table and load to Iceberg
        
        Args:
            url: URL containing table data
            table_selector: CSS selector for table element
            table_name: Target Iceberg table name
            namespace: Target namespace
            
        Returns:
            Dict with scraping results
        """
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            tables = soup.select(table_selector)
            
            if not tables:
                return {'status': 'error', 'message': f'No tables found with selector: {table_selector}'}
            
            # Extract data from first table
            data_rows = []
            table = tables[0]
            
            # Get headers
            headers = []
            for th in table.find_all(['th', 'td'], limit=20):
                headers.append(th.get_text(strip=True))
            
            # Get rows
            for tr in table.find_all('tr')[1:]:
                cells = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
                if cells and len(cells) == len(headers):
                    row_dict = dict(zip(headers, cells))
                    data_rows.append(row_dict)
            
            if not data_rows:
                return {'status': 'error', 'message': 'No data rows extracted'}
            
            # Convert to DataFrame
            df = pd.DataFrame(data_rows)
            
            # Add metadata
            df['scraped_from'] = url
            df['scraped_at'] = datetime.now().isoformat()
            
            # Write to Iceberg
            self.catalog._write_to_iceberg(df, f'{namespace}.{table_name}')
            
            logger.info(f"Successfully scraped {len(df)} rows from {url}")
            
            return {
                'status': 'success',
                'url': url,
                'table': f'{namespace}.{table_name}',
                'rows_scraped': len(df),
                'columns': list(df.columns),
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error scraping table: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def scrape_json_api(self, url: str, json_path: str,
                       table_name: str, namespace: str,
                       params: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Scrape JSON API endpoint and load to Iceberg
        
        Args:
            url: API endpoint URL
            json_path: JSONPath to data array
            table_name: Target table name
            namespace: Target namespace
            params: Query parameters
            
        Returns:
            Dict with scraping results
        """
        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract nested data using simple dot notation
            for key in json_path.split('.'):
                if key in data:
                    data = data[key]
                else:
                    return {'status': 'error', 'message': f'JSONPath {json_path} not found'}
            
            if not isinstance(data, list):
                data = [data]
            
            df = pd.DataFrame(data)
            df['source_url'] = url
            df['fetched_at'] = datetime.now().isoformat()
            
            self.catalog._write_to_iceberg(df, f'{namespace}.{table_name}')
            
            logger.info(f"Successfully fetched {len(df)} records from {url}")
            
            return {
                'status': 'success',
                'url': url,
                'table': f'{namespace}.{table_name}',
                'records': len(df),
                'columns': list(df.columns),
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error scraping JSON API: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def scrape_dynamic_page(self, url: str, wait_selector: str,
                           data_extractor_js: str,
                           table_name: str, namespace: str) -> Dict[str, Any]:
        """
        Scrape JavaScript-rendered page using Selenium
        
        Args:
            url: URL of dynamic page
            wait_selector: CSS selector to wait for
            data_extractor_js: JavaScript to extract data
            table_name: Target table
            namespace: Target namespace
            
        Returns:
            Dict with results
        """
        driver = None
        try:
            # Initialize Chrome driver
            options = webdriver.ChromeOptions()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            
            driver = webdriver.Chrome(options=options)
            driver.get(url)
            
            # Wait for dynamic content
            WebDriverWait(driver, 10).until(
                EC.presence_of_all_elements_located((By.CSS_SELECTOR, wait_selector))
            )
            
            time.sleep(2)  # Extra wait for rendering
            
            # Execute data extraction script
            data = driver.execute_script(data_extractor_js)
            
            df = pd.DataFrame(data)
            df['page_url'] = url
            df['rendered_at'] = datetime.now().isoformat()
            
            self.catalog._write_to_iceberg(df, f'{namespace}.{table_name}')
            
            logger.info(f"Successfully scraped dynamic page: {url}")
            
            return {
                'status': 'success',
                'url': url,
                'table': f'{namespace}.{table_name}',
                'rows': len(df),
                'columns': list(df.columns),
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error scraping dynamic page: {e}")
            return {'status': 'error', 'message': str(e)}
        
        finally:
            if driver:
                driver.quit()
    
    def scrape_multiple_pages(self, url_pattern: str, page_range: range,
                            data_selector: str, table_name: str,
                            namespace: str) -> Dict[str, Any]:
        """
        Scrape multiple pages with pagination
        
        Args:
            url_pattern: URL pattern with {page} placeholder
            page_range: Range of page numbers
            data_selector: CSS selector for data elements
            table_name: Target table
            namespace: Target namespace
            
        Returns:
            Dict with results
        """
        try:
            all_data = []
            
            for page_num in page_range:
                url = url_pattern.format(page=page_num)
                logger.info(f"Scraping page: {url}")
                
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                elements = soup.select(data_selector)
                
                for element in elements:
                    # Extract text and links
                    data_dict = {
                        'text': element.get_text(strip=True),
                        'url': element.get('href', ''),
                        'page': page_num
                    }
                    all_data.append(data_dict)
                
                time.sleep(1)  # Be respectful with requests
            
            df = pd.DataFrame(all_data)
            df['scraped_at'] = datetime.now().isoformat()
            
            self.catalog._write_to_iceberg(df, f'{namespace}.{table_name}')
            
            logger.info(f"Successfully scraped {len(df)} items from {len(page_range)} pages")
            
            return {
                'status': 'success',
                'url_pattern': url_pattern,
                'pages_scraped': len(page_range),
                'total_records': len(df),
                'table': f'{namespace}.{table_name}',
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error scraping multiple pages: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def scrape_with_pagination_api(self, base_url: str, 
                                  params_template: Dict[str, Any],
                                  total_pages: int,
                                  table_name: str,
                                  namespace: str) -> Dict[str, Any]:
        """
        Scrape paginated API endpoint
        
        Args:
            base_url: API base URL
            params_template: Template parameters for pagination
            total_pages: Number of pages to scrape
            table_name: Target table
            namespace: Target namespace
            
        Returns:
            Dict with results
        """
        try:
            all_records = []
            
            for page_num in range(1, total_pages + 1):
                params = params_template.copy()
                params['page'] = page_num
                
                logger.info(f"Fetching page {page_num} of {total_pages}")
                
                response = self.session.get(base_url, params=params, timeout=10)
                response.raise_for_status()
                
                data = response.json()
                
                # Assuming API returns {'data': [...], 'total': n}
                if isinstance(data, dict) and 'data' in data:
                    all_records.extend(data['data'])
                elif isinstance(data, list):
                    all_records.extend(data)
                
                time.sleep(1)
            
            df = pd.DataFrame(all_records)
            df['fetched_at'] = datetime.now().isoformat()
            
            self.catalog._write_to_iceberg(df, f'{namespace}.{table_name}')
            
            logger.info(f"Successfully fetched {len(df)} records from API")
            
            return {
                'status': 'success',
                'api_url': base_url,
                'pages_fetched': total_pages,
                'total_records': len(df),
                'table': f'{namespace}.{table_name}',
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error scraping paginated API: {e}")
            return {'status': 'error', 'message': str(e)}


# Usage Examples
if __name__ == '__main__':
    # Initialize catalog (assume it's already set up)
    from iceberg_data_lake_manager import IcebergDataLakeManager
    
    manager = IcebergDataLakeManager('/warehouse')
    scraper = WebScraperConnector(manager)
    
    # Example 1: Scrape Wikipedia table
    result = scraper.scrape_table_data(
        url='https://en.wikipedia.org/wiki/List_of_countries_by_population',
        table_selector='table.wikitable',
        table_name='countries_by_population',
        namespace='wikipedia_data'
    )
    print(f"Wikipedia scrape result: {json.dumps(result, indent=2)}")
    
    # Example 2: Fetch from public API
    result = scraper.scrape_json_api(
        url='https://api.github.com/users/octocat/repos',
        json_path='data',
        table_name='github_repos',
        namespace='public_apis'
    )
    print(f"API fetch result: {json.dumps(result, indent=2)}")
    
    # Example 3: Paginated API
    result = scraper.scrape_with_pagination_api(
        base_url='https://api.example.com/items',
        params_template={'limit': 100},
        total_pages=5,
        table_name='example_items',
        namespace='external_data'
    )
    print(f"Paginated API result: {json.dumps(result, indent=2)}")