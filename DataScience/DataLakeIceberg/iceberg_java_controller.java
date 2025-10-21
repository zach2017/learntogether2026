package com.datalake.iceberg;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
public class IcebergController {
    
    private IcebergDataLakeService dataLakeService;

    @Value("${warehouse.path:/warehouse}")
    private String warehousePath;

    @PostConstruct
    public void init() {
        dataLakeService = new IcebergDataLakeService(warehousePath);
    }

    /**
     * Load data from PostgreSQL
     * POST /api/v1/load/postgres
     */
    @PostMapping("/load/postgres")
    public ResponseEntity<Map<String, Object>> loadFromPostgres(@RequestBody PostgresLoadRequest request) {
        try {
            dataLakeService.loadFromPostgres(
                    request.getHost(),
                    request.getDatabase(),
                    request.getUser(),
                    request.getPassword(),
                    request.getQuery(),
                    request.getTableName(),
                    request.getNamespace()
            );
            
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Data loaded from PostgreSQL",
                    "table", request.getNamespace() + "." + request.getTableName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Load data from S3
     * POST /api/v1/load/s3
     */
    @PostMapping("/load/s3")
    public ResponseEntity<Map<String, Object>> loadFromS3(@RequestBody S3LoadRequest request) {
        try {
            Map<String, String> s3Config = new HashMap<>();
            s3Config.put("endpoint", request.getEndpoint());
            s3Config.put("accessKey", request.getAccessKey());
            s3Config.put("secretKey", request.getSecretKey());
            
            dataLakeService.loadFromS3(
                    request.getS3Path(),
                    request.getFormat(),
                    request.getTableName(),
                    request.getNamespace(),
                    s3Config
            );
            
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Data loaded from S3",
                    "table", request.getNamespace() + "." + request.getTableName(),
                    "s3_path", request.getS3Path()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Load data from file
     * POST /api/v1/load/file
     */
    @PostMapping("/load/file")
    public ResponseEntity<Map<String, Object>> loadFromFile(@RequestBody FileLoadRequest request) {
        try {
            dataLakeService.loadFromFile(
                    request.getFilePath(),
                    request.getFormat(),
                    request.getTableName(),
                    request.getNamespace()
            );
            
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Data loaded from file",
                    "table", request.getNamespace() + "." + request.getTableName(),
                    "file_path", request.getFilePath()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get table metadata
     * GET /api/v1/tables/{namespace}/{table}/metadata
     */
    @GetMapping("/tables/{namespace}/{table}/metadata")
    public ResponseEntity<Map<String, Object>> getTableMetadata(
            @PathVariable String namespace,
            @PathVariable String table) {
        try {
            Map<String, Object> metadata = dataLakeService.getTableMetadata(namespace, table);
            return ResponseEntity.ok(metadata);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * List tables in namespace
     * GET /api/v1/tables/{namespace}
     */
    @GetMapping("/tables/{namespace}")
    public ResponseEntity<Map<String, Object>> listTables(@PathVariable String namespace) {
        try {
            List<String> tables = dataLakeService.listTables(namespace);
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "namespace", namespace,
                    "tables", tables,
                    "count", tables.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Migrate table between warehouses
     * POST /api/v1/migrate
     */
    @PostMapping("/migrate")
    public ResponseEntity<Map<String, Object>> migrateTable(@RequestBody MigrateRequest request) {
        try {
            dataLakeService.migrateTable(
                    request.getSourceNamespace(),
                    request.getSourceTable(),
                    request.getDestNamespace(),
                    request.getDestTable()
            );
            
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Table migrated successfully",
                    "source", request.getSourceNamespace() + "." + request.getSourceTable(),
                    "destination", request.getDestNamespace() + "." + request.getDestTable()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get row count
     * GET /api/v1/tables/{namespace}/{table}/count
     */
    @GetMapping("/tables/{namespace}/{table}/count")
    public ResponseEntity<Map<String, Object>> getRowCount(
            @PathVariable String namespace,
            @PathVariable String table) {
        try {
            long count = dataLakeService.getRowCount(namespace, table);
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "table", namespace + "." + table,
                    "row_count", count
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()
            ));
        }
    }

    // Request DTOs
    @Data
    public static class PostgresLoadRequest {
        private String host;
        private String database;
        private String user;
        private String password;
        private String query;
        private String tableName;
        private String namespace;
    }

    @Data
    public static class S3LoadRequest {
        private String s3Path;
        private String format;
        private String tableName;
        private String namespace;
        private String endpoint;
        private String accessKey;
        private String secretKey;
    }

    @Data
    public static class FileLoadRequest {
        private String filePath;
        private String format;
        private String tableName;
        private String namespace;
    }

    @Data
    public static class MigrateRequest {
        private String sourceNamespace;
        private String sourceTable;
        private String destNamespace;
        private String destTable;
    }
}