package com.example.app;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;

@Service
public class S3Service {
    private final S3Client s3Client;

    @Value("${aws.s3.bucket.name:documents}")
    private String bucketName;

    public S3Service(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    @PostConstruct
    public void initializeBucket() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
            System.out.println("Bucket " + bucketName + " already exists");
        } catch (NoSuchBucketException e) {
            System.out.println("Creating bucket: " + bucketName);
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
        }
    }

    public void uploadFile(String key, InputStream inputStream, long contentLength, String contentType) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(inputStream, contentLength));
    }

    public void uploadFile(String key, byte[] content, String contentType) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromBytes(content));
    }

    public String getBucketName() {
        return bucketName;
    }
}
