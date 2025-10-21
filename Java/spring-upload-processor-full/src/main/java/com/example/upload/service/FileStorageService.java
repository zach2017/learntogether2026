package com.example.upload.service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
@Service
public class FileStorageService {
    private final Path storageDir;
    public FileStorageService(@Value("${app.storage.dir:uploads}") String storageDir) throws IOException {
        this.storageDir = Paths.get(storageDir).toAbsolutePath().normalize();
        Files.createDirectories(this.storageDir);
    }
    public Path save(MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
        Path destination = this.storageDir.resolve(System.currentTimeMillis() + "-" + original).normalize();
        if (!destination.startsWith(this.storageDir)) throw new SecurityException("Invalid file path");
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        return destination;
    }
}