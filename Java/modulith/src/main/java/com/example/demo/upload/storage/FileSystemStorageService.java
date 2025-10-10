package com.example.demo.upload.storage;

import com.example.documentprocessor.upload.StorageService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "filesystem", matchIfMissing = true)
public class FileSystemStorageService implements StorageService {
    
    private final Path rootLocation = Paths.get("upload-dir");
    
    public FileSystemStorageService() throws IOException {
        Files.createDirectories(rootLocation);
    }
    
    @Override
    public String store(MultipartFile file) throws IOException {
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path destinationFile = rootLocation.resolve(filename);
        
        Files.copy(file.getInputStream(), destinationFile, 
                   StandardCopyOption.REPLACE_EXISTING);
        
        return filename;
    }
    
    @Override
    public byte[] retrieve(String location) throws IOException {
        return Files.readAllBytes(rootLocation.resolve(location));
    }
    
    @Override
    public void delete(String location) throws IOException {
        Files.deleteIfExists(rootLocation.resolve(location));
    }
}

