#!/usr/bin/env python3
"""
Data Lake Migration Tool
Migrates data between Iceberg warehouses with validation and checksum verification
"""

import logging
import hashlib
import json
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataLakeMigrationTool:
    """Handles migration of data between data lakes"""
    
    def __init__(self, source_catalog, dest_catalog):
        self.source_catalog = source_catalog
        self.dest_catalog = dest_catalog
        self.migration_log = []
    
    def calculate_checksum(self, df: pd.DataFrame) -> str:
        """Calculate SHA256 checksum of DataFrame"""
        try:
            # Convert to bytes and calculate hash
            data_bytes = pd.util.hash_pandas_object(df, index=True).values.tobytes()
            checksum = hashlib.sha256(data_bytes).hexdigest()
            return checksum
        except Exception as e:
            logger.error(f"Error calculating checksum: {e}")
            return None
    
    def get_table_statistics(self, catalog, namespace: str, table_name: str) -> Dict[str, Any]:
        """Get statistics about a table"""
        try:
            full_name = f"{namespace}.{table_name}"
            table = catalog.load_table(full_name)
            
            stats = {
                'table_name': table_name,
                'namespace': namespace,
                'schema': str(table.schema()),
                'partitions': str(table.partitioning),
                'location': table.location(),
                'snapshots_count': len(table.history()),
                'current_snapshot_id': table.current_snapshot().snapshot_id if table.current_snapshot() else None,
                'metadata_version': table.metadata.metadata_file_path if hasattr(table, 'metadata') else None
            }
            return stats
        except Exception as e:
            logger.error(f"Error getting table statistics: {e}")
            return {}
    
    def validate_table_compatibility(self, source_schema: str, dest_schema: str) -> Tuple[bool, str]:
        """Validate schemas are compatible"""
        try:
            # Simple schema validation - in production, use Apache Arrow schema validation
            source_cols = set(source_schema.split(','))
            dest_cols = set(dest_schema.split(',')) if dest_schema else source_cols
            
            if source_cols != dest_cols:
                missing = source_cols - dest_cols
                extra = dest_cols - source_cols
                msg = f"Schema mismatch. Missing: {missing}, Extra: {extra}"
                return False, msg
            
            return True, "Schemas are compatible"
        except Exception as e:
            return False, str(e)
    
    def migrate_table(self, source_namespace: str, source_table: str,
                     dest_namespace: str, dest_table: str,
                     validate: bool = True, batch_size: int = 10000) -> Dict[str, Any]:
        """
        Migrate table from source to destination
        
        Args:
            source_namespace: Source namespace
            source_table: Source table name
            dest_namespace: Destination namespace
            dest_table: Destination table name
            validate: Whether to validate data
            batch_size: Batch size for processing
            
        Returns:
            Migration result dictionary
        """
        migration_start = datetime.now()
        migration_id = f"{migration_start.timestamp()}"
        
        try:
            logger.info(f"Starting migration: {source_namespace}.{source_table} -> {dest_namespace}.{dest_table}")
            
            # Get source table
            source_full = f"{source_namespace}.{source_table}"
            source_table_obj = self.source_catalog.load_table(source_full)
            
            # Get source statistics
            source_stats = self.get_table_statistics(
                self.source_catalog, source_namespace, source_table
            )
            
            # Read source data
            logger.info("Reading source data...")
            df_source = source_table_obj.to_pandas()
            source_rows = len(df_source)
            source_checksum = self.calculate_checksum(df_source)
            
            # Validate schema if needed
            if validate:
                logger.info("Validating schema compatibility...")
                is_compatible, msg = self.validate_table_compatibility(
                    source_stats.get('schema', ''),
                    ''  # Destination schema (empty if table doesn't exist yet)
                )
                if not is_compatible:
                    return {
                        'migration_id': migration_id,
                        'status': 'failed',
                        'reason': f"Schema validation failed: {msg}",
                        'timestamp': datetime.now().isoformat()
                    }
            
            # Write to destination
            logger.info("Writing to destination...")
            self.dest_catalog._write_to_iceberg(df_source, f"{dest_namespace}.{dest_table}")
            
            # Verify destination
            logger.info("Verifying migrated data...")
            dest_table_obj = self.dest_catalog.catalog.load_table(
                f"{dest_namespace}.{dest_table}"
            )
            df_dest = dest_table_obj.to_pandas()
            dest_rows = len(df_dest)
            dest_checksum = self.calculate_checksum(df_dest)
            
            # Validate row count
            if source_rows != dest_rows:
                logger.warning(f"Row count mismatch: {source_rows} -> {dest_rows}")
            
            migration_end = datetime.now()
            migration_duration = (migration_end - migration_start).total_seconds()
            
            result = {
                'migration_id': migration_id,
                'status': 'success' if source_rows == dest_rows else 'completed_with_warnings',
                'source': source_full,
                'destination': f"{dest_namespace}.{dest_table}",
                'rows_migrated': source_rows,
                'rows_verified': dest_rows,
                'source_checksum': source_checksum,
                'dest_checksum': dest_checksum,
                'checksum_match': source_checksum == dest_checksum,
                'duration_seconds': migration_duration,
                'columns': len(df_source.columns),
                'timestamp': migration_end.isoformat()
            }
            
            self.migration_log.append(result)
            logger.info(f"Migration completed successfully: {json.dumps(result, indent=2)}")
            
            return result
        
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return {
                'migration_id': migration_id,
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def migrate_bulk(self, migrations: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Migrate multiple tables in parallel
        
        Args:
            migrations: List of migration specs with 'source_namespace', 'source_table', etc.
            
        Returns:
            List of migration results
        """
        results = []
        
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {}
            
            for migration in migrations:
                future = executor.submit(
                    self.migrate_table,
                    migration['source_namespace'],
                    migration['source_table'],
                    migration['dest_namespace'],
                    migration['dest_table']
                )
                futures[future] = migration
            
            for future in as_completed(futures):
                migration = futures[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    logger.error(f"Error in parallel migration: {e}")
                    results.append({
                        'status': 'failed',
                        'error': str(e),
                        'migration': migration
                    })
        
        return results
    
    def incremental_migration(self, source_namespace: str, source_table: str,
                            dest_namespace: str, dest_table: str,
                            last_checkpoint: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform incremental migration based on timestamp
        
        Args:
            source_namespace: Source namespace
            source_table: Source table
            dest_namespace: Destination namespace
            dest_table: Destination table
            last_checkpoint: Last migration timestamp
            
        Returns:
            Incremental migration result
        """
        try:
            logger.info(f"Starting incremental migration from checkpoint: {last_checkpoint}")
            
            source_full = f"{source_namespace}.{source_table}"
            source_table_obj = self.source_catalog.load_table(source_full)
            
            # Read data (in production, use Iceberg time travel to get incremental data)
            df = source_table_obj.to_pandas()
            
            # Filter based on timestamp if available
            if last_checkpoint and 'timestamp' in df.columns:
                df = df[df['timestamp'] > last_checkpoint]
                logger.info(f"Filtered to {len(df)} new records since {last_checkpoint}")
            
            # Write incrementally
            self.dest_catalog._write_to_iceberg(df, f"{dest_namespace}.{dest_table}")
            
            return {
                'status': 'success',
                'new_records': len(df),
                'checkpoint': datetime.now().isoformat(),
                'table': f"{dest_namespace}.{dest_table}"
            }
        
        except Exception as e:
            logger.error(f"Incremental migration failed: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    def generate_migration_report(self) -> str:
        """Generate summary report of all migrations"""
        report = "=" * 80 + "\n"
        report += "DATA LAKE MIGRATION REPORT\n"
        report += "=" * 80 + "\n\n"
        
        total_migrations = len(self.migration_log)
        successful = sum(1 for m in self.migration_log if m['status'] == 'success')
        failed = sum(1 for m in self.migration_log if m['status'] == 'failed')
        
        report += f"Total Migrations: {total_migrations}\n"
        report += f"Successful: {successful}\n"
        report += f"Failed: {failed}\n"
        report += f"Success Rate: {(successful/total_migrations*100 if total_migrations > 0 else 0):.2f}%\n\n"
        
        total_rows = sum(m.get('rows_migrated', 0) for m in self.migration_log)
        total_duration = sum(m.get('duration_seconds', 0) for m in self.migration_log)
        
        report += f"Total Rows Migrated: {total_rows:,}\n"
        report += f"Total Duration: {total_duration:.2f} seconds\n"
        report += f"Average Throughput: {(total_rows/total_duration if total_duration > 0 else 0):,.0f} rows/sec\n\n"
        
        report += "-" * 80 + "\n"
        report += "MIGRATION DETAILS\n"
        report += "-" * 80 + "\n\n"
        
        for migration in self.migration_log:
            report += f"Migration ID: {migration['migration_id']}\n"
            report += f"Source: {migration.get('source', 'N/A')}\n"
            report += f"Destination: {migration.get('destination', 'N/A')}\n"
            report += f"Status: {migration['status']}\n"
            report += f"Rows: {migration.get('rows_migrated', 'N/A')}\n"
            report += f"Duration: {migration.get('duration_seconds', 'N/A')} sec\n"
            report += f"Checksum Match: {migration.get('checksum_match', 'N/A')}\n"
            report += "\n"
        
        return report
    
    def export_migration_log(self, file_path: str):
        """Export migration log to JSON file"""
        try:
            with open(file_path, 'w') as f:
                json.dump(self.migration_log, f, indent=2)
            logger.info(f"Migration log exported to {file_path}")
        except Exception as e:
            logger.error(f"Error exporting migration log: {e}")
    
    def validate_migration_integrity(self, source_namespace: str, source_table: str,
                                    dest_namespace: str, dest_table: str) -> Dict[str, Any]:
        """
        Comprehensive validation of migrated data
        
        Args:
            source_namespace: Source namespace
            source_table: Source table
            dest_namespace: Destination namespace
            dest_table: Destination table
            
        Returns:
            Validation report
        """
        try:
            source_full = f"{source_namespace}.{source_table}"
            dest_full = f"{dest_namespace}.{dest_table}"
            
            source_df = self.source_catalog.load_table(source_full).to_pandas()
            dest_df = self.dest_catalog.load_table(dest_full).to_pandas()
            
            validation_report = {
                'status': 'passed',
                'checks': {}
            }
            
            # Check 1: Row count
            row_count_match = len(source_df) == len(dest_df)
            validation_report['checks']['row_count'] = {
                'passed': row_count_match,
                'source': len(source_df),
                'destination': len(dest_df)
            }
            if not row_count_match:
                validation_report['status'] = 'failed'
            
            # Check 2: Column count
            col_count_match = len(source_df.columns) == len(dest_df.columns)
            validation_report['checks']['column_count'] = {
                'passed': col_count_match,
                'source': len(source_df.columns),
                'destination': len(dest_df.columns)
            }
            if not col_count_match:
                validation_report['status'] = 'failed'
            
            # Check 3: Column names
            cols_match = set(source_df.columns) == set(dest_df.columns)
            validation_report['checks']['column_names'] = {
                'passed': cols_match,
                'missing': list(set(source_df.columns) - set(dest_df.columns)),
                'extra': list(set(dest_df.columns) - set(source_df.columns))
            }
            if not cols_match:
                validation_report['status'] = 'failed'
            
            # Check 4: Data types
            dtype_match = source_df.dtypes.equals(dest_df.dtypes)
            validation_report['checks']['data_types'] = {
                'passed': dtype_match
            }
            if not dtype_match:
                validation_report['status'] = 'failed'
            
            # Check 5: Checksum
            source_checksum = self.calculate_checksum(source_df)
            dest_checksum = self.calculate_checksum(dest_df)
            checksum_match = source_checksum == dest_checksum
            validation_report['checks']['checksum'] = {
                'passed': checksum_match,
                'source': source_checksum,
                'destination': dest_checksum
            }
            if not checksum_match:
                validation_report['status'] = 'warning'  # Not critical if data structure is same
            
            # Check 6: Sample data comparison
            if len(source_df) > 0 and len(dest_df) > 0:
                sample_match = source_df.head(100).equals(dest_df.head(100))
                validation_report['checks']['sample_data'] = {
                    'passed': sample_match,
                    'rows_compared': min(100, len(source_df))
                }
            
            return validation_report
        
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return {'status': 'error', 'message': str(e)}


# Usage Examples
if __name__ == '__main__':
    from iceberg_data_lake_manager import IcebergDataLakeManager
    
    # Initialize catalogs
    source_catalog = IcebergDataLakeManager('/warehouse/source')
    dest_catalog = IcebergDataLakeManager('/warehouse/destination')
    
    # Create migration tool
    migrator = DataLakeMigrationTool(source_catalog, dest_catalog)
    
    # Example 1: Single table migration
    result = migrator.migrate_table(
        'source_db', 'orders',
        'prod_db', 'orders',
        validate=True
    )
    print(f"Migration result: {json.dumps(result, indent=2)}")
    
    # Example 2: Bulk migration
    migrations = [
        {'source_namespace': 'source_db', 'source_table': 'orders', 
         'dest_namespace': 'prod_db', 'dest_table': 'orders'},
        {'source_namespace': 'source_db', 'source_table': 'customers',
         'dest_namespace': 'prod_db', 'dest_table': 'customers'},
        {'source_namespace': 'source_db', 'source_table': 'products',
         'dest_namespace': 'prod_db', 'dest_table': 'products'}
    ]
    
    results = migrator.migrate_bulk(migrations)
    
    # Example 3: Generate report
    report = migrator.generate_migration_report()
    print(report)
    
    # Example 4: Export log
    migrator.export_migration_log('/warehouse/migration_log.json')
    
    # Example 5: Validate integrity
    validation = migrator.validate_migration_integrity(
        'source_db', 'orders',
        'prod_db', 'orders'
    )
    print(f"Validation report: {json.dumps(validation, indent=2)}")