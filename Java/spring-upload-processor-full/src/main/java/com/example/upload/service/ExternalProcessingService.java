package com.example.upload.service;
import org.springframework.http.*;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.nio.file.*;
import java.util.Map;
@Service
public class ExternalProcessingService {
    private final RestTemplate rest = new RestTemplate();
    public Map<String,Object> callSummerize(Path filePath){return postMultipart(filePath,"http://localhost:8080/summerize");}
    public Map<String,Object> callKeywords(Path filePath){return postMultipart(filePath,"http://localhost:8080/keywords");}
    private Map<String,Object> postMultipart(Path filePath,String url){
        try{
            byte[] bytes = Files.readAllBytes(filePath);
            MultipartBodyBuilder body = new MultipartBodyBuilder();
            body.part("file",bytes).filename(filePath.getFileName().toString()).contentType(MediaType.APPLICATION_OCTET_STREAM);
            HttpEntity<?> req = new HttpEntity<>(body.build(), new HttpHeaders());
            ResponseEntity<Map> resp = rest.postForEntity(url,req,Map.class);
            return resp.getBody();
        }catch(Exception ex){throw new RuntimeException("Failed call "+url,ex);}
    }
}